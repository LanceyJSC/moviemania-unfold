import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MobileHeader } from "@/components/MobileHeader";
import { DesktopHeader } from "@/components/DesktopHeader";
import { Navigation } from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { List, Globe, Lock, Heart } from "lucide-react";
import { CreateListModal } from "@/components/CreateListModal";
import { useUserLists } from "@/hooks/useUserLists";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface PublicList {
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
  like_count?: number;
}

const Lists = () => {
  const { user } = useAuth();
  const { lists: myLists, loading: myListsLoading } = useUserLists();
  const [publicLists, setPublicLists] = useState<PublicList[]>([]);
  const [loadingPublic, setLoadingPublic] = useState(true);
  const [activeTab, setActiveTab] = useState(user ? "my-lists" : "popular");

  useEffect(() => {
    fetchPublicLists();
  }, []);

  const fetchPublicLists = async () => {
    try {
      setLoadingPublic(true);
      const { data, error } = await supabase
        .from('user_lists')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(l => l.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .in('id', userIds);
        
        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
        setPublicLists(data.map(l => ({ ...l, profile: profileMap.get(l.user_id) })));
      } else {
        setPublicLists([]);
      }
    } catch (error) {
      console.error('Error fetching public lists:', error);
    } finally {
      setLoadingPublic(false);
    }
  };

  const ListCard = ({ list, showAuthor = false }: { list: PublicList; showAuthor?: boolean }) => (
    <Link to={`/lists/${list.id}`}>
      <Card className="p-4 hover:bg-muted/50 transition-colors">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-foreground truncate">{list.name}</h3>
              {list.is_public ? (
                <Globe className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              ) : (
                <Lock className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              )}
            </div>
            {list.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {list.description}
              </p>
            )}
            {showAuthor && list.profile && (
              <div className="flex items-center gap-2 mt-2">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={list.profile.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">
                    {list.profile.username?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground">
                  {list.profile.username || 'User'}
                </span>
              </div>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );

  return (
    <div className="min-h-screen bg-background pb-24 2xl:pb-12">
      <DesktopHeader />
      <MobileHeader title="Lists" />
      
      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-4 pb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <List className="h-8 w-8 text-cinema-red" />
            <h1 className="font-cinematic text-2xl text-foreground">Lists</h1>
          </div>
          {user && <CreateListModal />}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start mb-4">
            {user && (
              <TabsTrigger value="my-lists">My Lists</TabsTrigger>
            )}
            <TabsTrigger value="popular">Popular</TabsTrigger>
            <TabsTrigger value="recent">Recent</TabsTrigger>
          </TabsList>

          {user && (
            <TabsContent value="my-lists">
              {myListsLoading ? (
                <div className="grid gap-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i} className="p-4">
                      <Skeleton className="h-5 w-48 mb-2" />
                      <Skeleton className="h-4 w-full" />
                    </Card>
                  ))}
                </div>
              ) : myLists.length === 0 ? (
                <Card className="p-8 text-center">
                  <List className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground mb-4">You haven't created any lists yet</p>
                  <CreateListModal />
                </Card>
              ) : (
                <div className="grid gap-3">
                  {myLists.map((list) => (
                    <ListCard key={list.id} list={list as PublicList} />
                  ))}
                </div>
              )}
            </TabsContent>
          )}

          <TabsContent value="popular">
            {loadingPublic ? (
              <div className="grid gap-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Card key={i} className="p-4">
                    <Skeleton className="h-5 w-48 mb-2" />
                    <Skeleton className="h-4 w-full" />
                  </Card>
                ))}
              </div>
            ) : publicLists.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No public lists yet</p>
              </Card>
            ) : (
              <div className="grid gap-3">
                {publicLists.map((list) => (
                  <ListCard key={list.id} list={list} showAuthor />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="recent">
            {loadingPublic ? (
              <div className="grid gap-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Card key={i} className="p-4">
                    <Skeleton className="h-5 w-48 mb-2" />
                    <Skeleton className="h-4 w-full" />
                  </Card>
                ))}
              </div>
            ) : publicLists.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No public lists yet</p>
              </Card>
            ) : (
              <div className="grid gap-3">
                {publicLists
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .map((list) => (
                    <ListCard key={list.id} list={list} showAuthor />
                  ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Navigation />
    </div>
  );
};

export default Lists;
