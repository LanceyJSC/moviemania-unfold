import { useState, useEffect } from "react";
import { Users, UserPlus, Check, X, Sparkles, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MobileHeader } from "@/components/MobileHeader";
import { Navigation } from "@/components/Navigation";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Connection {
  id: string;
  following_id: string;
  follower_id: string;
  status: string;
}

interface UserProfile {
  id: string;
  username: string;
  full_name: string;
  avatar_url?: string;
  created_at: string;
}

interface SuggestedUser extends UserProfile {
  reason?: string;
  shared_movies?: number;
}

export const SocialFriends = () => {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Connection[]>([]);
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchConnections();
      fetchSuggestedUsers();
    }
  }, [user]);

  const fetchConnections = async () => {
    if (!user) return;
    
    try {
      // Fetch accepted connections - simplified query
      const { data: accepted, error: acceptedError } = await supabase
        .from('social_connections')
        .select('*')
        .eq('follower_id', user.id)
        .eq('status', 'accepted');

      if (acceptedError) throw acceptedError;

      // Fetch pending requests - simplified query
      const { data: pending, error: pendingError } = await supabase
        .from('social_connections')
        .select('*')
        .eq('following_id', user.id)
        .eq('status', 'pending');

      if (pendingError) throw pendingError;

      setConnections(accepted || []);
      setPendingRequests(pending || []);
    } catch (error) {
      console.error('Error fetching connections:', error);
      toast.error('Failed to load connections');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptRequest = async (connectionId: string) => {
    try {
      const { error } = await supabase
        .from('social_connections')
        .update({ status: 'accepted' })
        .eq('id', connectionId);

      if (error) throw error;

      toast.success('Friend request accepted!');
      fetchConnections();
    } catch (error) {
      console.error('Error accepting request:', error);
      toast.error('Failed to accept request');
    }
  };

  const handleRejectRequest = async (connectionId: string) => {
    try {
      const { error } = await supabase
        .from('social_connections')
        .delete()
        .eq('id', connectionId);

      if (error) throw error;

      toast.success('Friend request rejected');
      fetchConnections();
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Failed to reject request');
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      toast.error('Please enter a username or email to search');
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%`)
        .neq('id', user?.id)
        .limit(10);

      if (error) throw error;

      setSearchResults(data || []);
      if (data && data.length === 0) {
        toast.info('No users found matching your search');
      }
    } catch (error) {
      console.error('Error searching users:', error);
      toast.error('Failed to search users');
    } finally {
      setIsSearching(false);
    }
  };

  const sendFriendRequest = async (targetUserId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('social_connections')
        .insert({
          follower_id: user.id,
          following_id: targetUserId,
          status: 'pending'
        });

      if (error) throw error;

      toast.success('Friend request sent!');
      // Remove from search results and suggestions
      setSearchResults(prev => prev.filter(u => u.id !== targetUserId));
      setSuggestedUsers(prev => prev.filter(u => u.id !== targetUserId));
    } catch (error) {
      console.error('Error sending friend request:', error);
      toast.error('Failed to send friend request');
    }
  };

  const fetchSuggestedUsers = async () => {
    if (!user) return;
    
    setIsLoadingSuggestions(true);
    try {
      // Get users with similar movie preferences (liked movies)
      const { data: userLikes } = await supabase
        .from('watchlist')
        .select('movie_id')
        .eq('user_id', user.id)
        .eq('list_type', 'liked');

      if (userLikes && userLikes.length > 0) {
        const movieIds = userLikes.map(like => like.movie_id);
        
        // Find users who liked similar movies
        const { data: similarUsers } = await supabase
          .from('watchlist')
          .select('user_id, movie_id')
          .in('movie_id', movieIds)
          .eq('list_type', 'liked')
          .neq('user_id', user.id);

        if (similarUsers && similarUsers.length > 0) {
          // Get unique user IDs
          const userIds = [...new Set(similarUsers.map(u => u.user_id))];
          
          // Fetch profile information for these users
          const { data: profiles } = await supabase
            .from('profiles')
            .select('*')
            .in('id', userIds);

          if (profiles) {
            // Count shared movies and exclude existing connections
            const existingConnections = connections.map(c => c.following_id);
            const pendingConnections = pendingRequests.map(p => p.follower_id);
            
            const userMovieCount: { [key: string]: { profile: any, count: number } } = {};
            
            similarUsers.forEach(item => {
              const userId = item.user_id;
              const profile = profiles.find(p => p.id === userId);
              
              if (profile && !existingConnections.includes(userId) && !pendingConnections.includes(userId)) {
                if (!userMovieCount[userId]) {
                  userMovieCount[userId] = { profile, count: 0 };
                }
                userMovieCount[userId].count++;
              }
            });

            // Sort by shared movies and take top 5
            const suggestions = Object.values(userMovieCount)
              .sort((a, b) => b.count - a.count)
              .slice(0, 5)
              .map(item => ({
                ...item.profile,
                reason: `${item.count} shared liked movie${item.count > 1 ? 's' : ''}`,
                shared_movies: item.count
              }));

            setSuggestedUsers(suggestions);
          }
        }
      }

      // If no suggestions from similar movies, get recent active users
      if (suggestedUsers.length === 0) {
        const { data: recentUsers } = await supabase
          .from('profiles')
          .select('*')
          .neq('id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (recentUsers) {
          const existingConnections = connections.map(c => c.following_id);
          const pendingConnections = pendingRequests.map(p => p.follower_id);
          
          const filtered = recentUsers.filter(u => 
            !existingConnections.includes(u.id) && 
            !pendingConnections.includes(u.id)
          );

          setSuggestedUsers(filtered.map(u => ({
            ...u,
            reason: 'New to the community'
          })));
        }
      }
    } catch (error) {
      console.error('Error fetching suggested users:', error);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      <MobileHeader title="Friends & Following" />
      
      <div className="container mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Discover People */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Discover People
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingSuggestions ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">Finding people you might like...</p>
                </div>
              ) : suggestedUsers.length > 0 ? (
                <div className="space-y-3">
                  {suggestedUsers.map((suggested) => (
                    <div key={suggested.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center overflow-hidden">
                          {suggested.avatar_url ? (
                            <img src={suggested.avatar_url} alt={suggested.username} className="w-full h-full object-cover" />
                          ) : (
                            <Users className="h-5 w-5 text-primary-foreground" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-foreground">{suggested.full_name || suggested.username}</div>
                          <div className="text-sm text-muted-foreground">@{suggested.username}</div>
                          {suggested.reason && (
                            <div className="text-xs text-primary flex items-center gap-1 mt-1">
                              <Heart className="h-3 w-3" />
                              {suggested.reason}
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => sendFriendRequest(suggested.id)}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add Friend
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No suggestions available right now</p>
                  <p className="text-xs text-muted-foreground mt-1">Like some movies to get personalized suggestions!</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Search */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Find Friends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="Search by username or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mb-4"
              />
              <Button 
                className="w-full" 
                onClick={handleSearch}
                disabled={!searchTerm.trim() || isSearching}
              >
                {isSearching ? 'Searching...' : 'Search Friends'}
              </Button>
            </CardContent>
          </Card>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Search Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {searchResults.map((profile) => (
                    <div key={profile.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center overflow-hidden">
                          {profile.avatar_url ? (
                            <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
                          ) : (
                            <Users className="h-5 w-5 text-primary-foreground" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{profile.full_name || profile.username}</div>
                          <div className="text-sm text-muted-foreground">@{profile.username}</div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => sendFriendRequest(profile.id)}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add Friend
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pending Requests */}
          {pendingRequests.length > 0 && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Friend Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pendingRequests.map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary-foreground" />
                        </div>
                        <div>
                          <div className="font-medium text-foreground">
                            User {request.follower_id.slice(0, 8)}...
                          </div>
                          <div className="text-sm text-muted-foreground">Wants to follow you</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAcceptRequest(request.id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRejectRequest(request.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Friends List */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Your Friends ({connections.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading connections...</p>
                </div>
              ) : connections.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No friends yet. Start by searching for people above!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {connections.map((connection) => (
                    <div key={connection.id} className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg">
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary-foreground" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-foreground">
                          User {connection.following_id.slice(0, 8)}...
                        </div>
                        <div className="text-sm text-muted-foreground">Following</div>
                      </div>
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