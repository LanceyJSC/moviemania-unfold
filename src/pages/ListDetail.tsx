import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { MobileHeader } from "@/components/MobileHeader";
import { DesktopHeader } from "@/components/DesktopHeader";
import { Navigation } from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Globe, Lock, Heart, Trash2, Film, Tv } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { tmdbService } from "@/lib/tmdb";
import { toast } from "sonner";

interface ListData {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  created_at: string;
  profile?: {
    username: string | null;
    avatar_url: string | null;
  };
}

interface ListItem {
  id: string;
  movie_id: number;
  movie_title: string;
  movie_poster: string | null;
  notes: string | null;
  position: number;
}

const ListDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [list, setList] = useState<ListData | null>(null);
  const [items, setItems] = useState<ListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  useEffect(() => {
    if (id) {
      fetchList();
      fetchLikes();
    }
  }, [id, user]);

  const fetchList = async () => {
    try {
      setLoading(true);
      
      const { data: listData, error: listError } = await supabase
        .from('user_lists')
        .select('*')
        .eq('id', id)
        .single();

      if (listError) throw listError;
      
      const { data: profileData } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', listData.user_id)
        .single();
      
      setList({ ...listData, profile: profileData });

      const { data: itemsData } = await supabase
        .from('list_items')
        .select('*')
        .eq('list_id', id)
        .order('position', { ascending: true });

      setItems(itemsData || []);
    } catch (error) {
      console.error('Error fetching list:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLikes = async () => {
    if (!id) return;
    try {
      const { data, count } = await supabase
        .from('list_likes')
        .select('*', { count: 'exact' })
        .eq('list_id', id);

      setLikeCount(count || 0);
      if (user && data) {
        setLiked(data.some(like => like.user_id === user.id));
      }
    } catch (error) {
      console.error('Error fetching likes:', error);
    }
  };

  const toggleLike = async () => {
    if (!user || !id) {
      toast.error("Sign in to like lists");
      return;
    }
    try {
      if (liked) {
        await supabase.from('list_likes').delete().eq('list_id', id).eq('user_id', user.id);
        setLiked(false);
        setLikeCount(prev => prev - 1);
      } else {
        await supabase.from('list_likes').insert({ list_id: id, user_id: user.id });
        setLiked(true);
        setLikeCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      const { error } = await supabase.from('list_items').delete().eq('id', itemId);
      if (error) throw error;
      setItems(prev => prev.filter(item => item.id !== itemId));
      toast.success("Removed from list");
    } catch (error) {
      console.error('Error removing item:', error);
      toast.error("Failed to remove item");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-24 2xl:pb-12">
        <DesktopHeader />
        <MobileHeader title="List" />
        <div className="max-w-4xl mx-auto px-4 md:px-6 pt-4">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64 mb-6" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[2/3] rounded-lg" />
            ))}
          </div>
        </div>
        <Navigation />
      </div>
    );
  }

  if (!list) {
    return (
      <div className="min-h-screen bg-background pb-24 2xl:pb-12">
        <DesktopHeader />
        <MobileHeader title="List Not Found" />
        <div className="max-w-4xl mx-auto px-4 md:px-6 pt-4">
          <Card className="p-8 text-center border-dashed">
            <Film className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-lg font-semibold text-foreground mb-1">List not found</p>
            <p className="text-sm text-muted-foreground">It may have been deleted or made private.</p>
          </Card>
        </div>
        <Navigation />
      </div>
    );
  }

  const isOwner = user?.id === list.user_id;

  return (
    <div className="min-h-screen bg-background pb-24 2xl:pb-12">
      <DesktopHeader />
      <MobileHeader title={list.name} />

      <div className="max-w-4xl mx-auto px-4 md:px-6 pt-4 pb-8">
        {/* List Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="font-cinematic text-2xl text-foreground truncate">{list.name}</h1>
                {list.is_public ? (
                  <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                ) : (
                  <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
              </div>
              {list.description && (
                <p className="text-sm text-muted-foreground">{list.description}</p>
              )}
            </div>

            <Button
              variant={liked ? "default" : "outline"}
              size="sm"
              onClick={toggleLike}
              className={`shrink-0 ${liked ? "text-red-500" : ""}`}
            >
              <Heart className={`h-4 w-4 mr-1 ${liked ? "fill-current" : ""}`} />
              {likeCount}
            </Button>
          </div>

          <div className="flex items-center gap-3 mt-3">
            {list.profile && (
              <Link
                to={`/user/${list.profile.username || list.user_id}`}
                className="flex items-center gap-2"
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage src={list.profile.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">
                    {list.profile.username?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {list.profile.username || 'User'}
                </span>
              </Link>
            )}
            <Badge variant="secondary">
              {items.length} {items.length === 1 ? 'title' : 'titles'}
            </Badge>
          </div>
        </div>

        {/* List Items */}
        {items.length === 0 ? (
          <Card className="p-8 text-center border-dashed">
            <Film className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-lg font-semibold text-foreground mb-1">This list is empty</p>
            {isOwner && (
              <p className="text-sm text-muted-foreground">
                Add movies or TV shows from their detail pages using the "Add to List" button.
              </p>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {items.map((item) => (
              <div key={item.id} className="relative group">
                <Link to={`/movie/${item.movie_id}`}>
                  <div className="aspect-[2/3] rounded-lg overflow-hidden bg-muted">
                    {item.movie_poster ? (
                      <img
                        src={tmdbService.getPosterUrl(item.movie_poster, 'w300')}
                        alt={item.movie_title}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Film className="h-8 w-8 text-muted-foreground/50" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-foreground mt-1.5 line-clamp-2 font-medium">
                    {item.movie_title}
                  </p>
                </Link>

                {isOwner && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-1.5 right-1.5 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove from list?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Remove "{item.movie_title}" from this list.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => removeItem(item.id)}>
                          Remove
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Navigation />
    </div>
  );
};

export default ListDetail;
