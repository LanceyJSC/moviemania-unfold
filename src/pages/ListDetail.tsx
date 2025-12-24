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
import { Globe, Lock, Heart, Trash2, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { tmdbService } from "@/lib/tmdb";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
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
      
      // Fetch profile separately
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
      toast({
        title: "Sign in required",
        description: "Please sign in to like lists",
        variant: "destructive",
      });
      return;
    }

    try {
      if (liked) {
        await supabase
          .from('list_likes')
          .delete()
          .eq('list_id', id)
          .eq('user_id', user.id);
        
        setLiked(false);
        setLikeCount(prev => prev - 1);
      } else {
        await supabase
          .from('list_likes')
          .insert({
            list_id: id,
            user_id: user.id
          });
        
        setLiked(true);
        setLikeCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('list_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      setItems(prev => prev.filter(item => item.id !== itemId));
      
      toast({
        title: "Removed",
        description: "Movie removed from list",
      });
    } catch (error) {
      console.error('Error removing item:', error);
      toast({
        title: "Error",
        description: "Failed to remove movie",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-24 lg:pb-12">
        <DesktopHeader />
        <MobileHeader title="List" />
        <div className="max-w-7xl mx-auto px-4 md:px-6 pt-4">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-4 w-full mb-6" />
          <div className="grid grid-cols-3 gap-2">
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
      <div className="min-h-screen bg-background pb-24 lg:pb-12">
        <DesktopHeader />
        <MobileHeader title="List" />
        <div className="max-w-7xl mx-auto px-4 md:px-6 pt-4">
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">List not found</p>
            <Link to="/lists">
              <Button variant="link" className="mt-2">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Lists
              </Button>
            </Link>
          </Card>
        </div>
        <Navigation />
      </div>
    );
  }

  const isOwner = user?.id === list.user_id;

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-12">
      <DesktopHeader />
      <MobileHeader title={list?.name || "List"} />
      
      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-4 pb-8">
        <Link to="/lists" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Lists
        </Link>

        {/* List Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="font-cinematic text-2xl text-foreground">{list.name}</h1>
                {list.is_public ? (
                  <Globe className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Lock className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              {list.description && (
                <p className="text-muted-foreground mt-1">{list.description}</p>
              )}
            </div>
            
            <Button
              variant={liked ? "default" : "outline"}
              size="sm"
              onClick={toggleLike}
              className={liked ? "text-red-500" : ""}
            >
              <Heart className={`h-4 w-4 mr-1 ${liked ? "fill-current" : ""}`} />
              {likeCount}
            </Button>
          </div>

          {list.profile && (
            <Link 
              to={`/user/${list.profile.username || list.user_id}`}
              className="flex items-center gap-2 mt-3"
            >
              <Avatar className="h-6 w-6">
                <AvatarImage src={list.profile.avatar_url || undefined} />
                <AvatarFallback className="text-xs">
                  {list.profile.username?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground hover:text-foreground">
                {list.profile.username || 'User'}
              </span>
            </Link>
          )}

          <Badge variant="secondary" className="mt-3">
            {items.length} {items.length === 1 ? 'film' : 'films'}
          </Badge>
        </div>

        {/* List Items */}
        {items.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">This list is empty</p>
            {isOwner && (
              <p className="text-sm text-muted-foreground mt-1">
                Add movies from their detail pages
              </p>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {items.map((item) => (
              <div key={item.id} className="relative group">
                <Link to={`/movie/${item.movie_id}`}>
                  <img
                    src={item.movie_poster 
                      ? tmdbService.getPosterUrl(item.movie_poster, 'w300')
                      : '/placeholder.svg'
                    }
                    alt={item.movie_title}
                    className="w-full aspect-[2/3] object-cover rounded-lg"
                  />
                </Link>
                
                {isOwner && (
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeItem(item.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
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
