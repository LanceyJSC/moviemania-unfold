import { useState, useEffect } from "react";
import { Film, Plus, Users, Lock, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MobileHeader } from "@/components/MobileHeader";
import { Navigation } from "@/components/Navigation";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CommunityList {
  id: string;
  title: string;
  description: string;
  is_public: boolean;
  is_collaborative: boolean;
  created_at: string;
  community_list_items?: Array<{
    movie_title: string;
    movie_poster: string;
  }>;
}

export const SocialLists = () => {
  const [myLists, setMyLists] = useState<CommunityList[]>([]);
  const [publicLists, setPublicLists] = useState<CommunityList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchLists();
    }
  }, [user]);

  const fetchLists = async () => {
    if (!user) return;
    
    try {
      // Fetch user's own lists
      const { data: userLists, error: userError } = await supabase
        .from('community_lists')
        .select(`
          *,
          community_list_items(movie_title, movie_poster)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (userError) throw userError;

      // Fetch public lists
      const { data: publicListsData, error: publicError } = await supabase
        .from('community_lists')
        .select(`
          *,
          community_list_items(movie_title, movie_poster)
        `)
        .eq('is_public', true)
        .neq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (publicError) throw publicError;

      setMyLists(userLists || []);
      setPublicLists(publicListsData || []);
    } catch (error) {
      console.error('Error fetching lists:', error);
      toast.error('Failed to load community lists');
    } finally {
      setIsLoading(false);
    }
  };

  const createNewList = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('community_lists')
        .insert({
          user_id: user.id,
          title: 'My New List',
          description: 'A collection of my favorite movies',
          is_public: false,
          is_collaborative: false
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('New list created!');
      fetchLists();
    } catch (error) {
      console.error('Error creating list:', error);
      toast.error('Failed to create list');
    }
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      <MobileHeader title="Community Lists" />
      
      <div className="container mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Create New List */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Create New List
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={createNewList} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Create Movie List
              </Button>
            </CardContent>
          </Card>

          {/* My Lists */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">My Lists ({myLists.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading your lists...</p>
                </div>
              ) : myLists.length === 0 ? (
                <div className="text-center py-8">
                  <Film className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No lists yet. Create your first movie collection!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myLists.map((list) => (
                    <div key={list.id} className="p-4 bg-muted/20 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium text-foreground">{list.title}</h3>
                        <div className="flex gap-1">
                          {list.is_public ? (
                            <Badge variant="outline">
                              <Globe className="h-3 w-3 mr-1" />
                              Public
                            </Badge>
                          ) : (
                            <Badge variant="outline">
                              <Lock className="h-3 w-3 mr-1" />
                              Private
                            </Badge>
                          )}
                          {list.is_collaborative && (
                            <Badge variant="outline">
                              <Users className="h-3 w-3 mr-1" />
                              Collaborative
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{list.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {list.community_list_items?.length || 0} movies
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Public Lists */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Discover Public Lists</CardTitle>
            </CardHeader>
            <CardContent>
              {publicLists.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No public lists available yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {publicLists.map((list) => (
                    <div key={list.id} className="p-4 bg-muted/20 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium text-foreground">{list.title}</h3>
                        <Badge variant="outline">
                          <Globe className="h-3 w-3 mr-1" />
                          Public
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{list.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {list.community_list_items?.length || 0} movies
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Navigation />
    </div>
  );
};