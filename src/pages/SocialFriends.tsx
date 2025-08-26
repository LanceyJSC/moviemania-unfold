import { useState, useEffect } from "react";
import { 
  Users, 
  UserPlus, 
  Check, 
  X, 
  Sparkles, 
  Heart,
  MessageSquare,
  Calendar,
  Target,
  Zap,
  Globe,
  Search,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MobileHeader } from "@/components/MobileHeader";
import { Navigation } from "@/components/Navigation";
import { SocialActivityFeed } from "@/components/SocialActivityFeed";
import { MovieClubHub } from "@/components/MovieClubHub";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Connection {
  id: string;
  following_id: string;
  follower_id: string;
  status: string;
  profiles?: {
    username: string;
    full_name?: string;
    avatar_url?: string;
  };
}

interface UserProfile {
  id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
}

interface SuggestedUser extends UserProfile {
  reason?: string;
  shared_movies?: number;
}

interface WatchParty {
  id: string;
  host_id: string;
  movie_title: string;
  party_name: string;
  scheduled_at: string;
  max_participants: number;
  status: string;
  host_profile?: {
    username: string;
    avatar_url?: string;
  };
}

export const SocialFriends = () => {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Connection[]>([]);
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([]);
  const [watchParties, setWatchParties] = useState<WatchParty[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState("discover");
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchAllData();
    }
  }, [user]);

  const fetchAllData = async () => {
    await Promise.all([
      fetchConnections(),
      fetchSuggestedUsers(),
      fetchWatchParties()
    ]);
    setIsLoading(false);
  };

  const fetchConnections = async () => {
    if (!user) return;
    
    try {
      // Fetch accepted connections first
      const { data: accepted, error: acceptedError } = await supabase
        .from('social_connections')
        .select('*')
        .eq('follower_id', user.id)
        .eq('status', 'accepted');

      if (acceptedError) throw acceptedError;

      // Fetch pending requests
      const { data: pending, error: pendingError } = await supabase
        .from('social_connections')
        .select('*')
        .eq('following_id', user.id)
        .eq('status', 'pending');

      if (pendingError) throw pendingError;

      // Get profile data for connections
      if (accepted && accepted.length > 0) {
        const followingIds = accepted.map(conn => conn.following_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url')
          .in('id', followingIds);

        const connectionsWithProfiles = accepted.map(conn => ({
          ...conn,
          profiles: profiles?.find(p => p.id === conn.following_id)
        }));
        setConnections(connectionsWithProfiles);
      }

      // Get profile data for pending requests
      if (pending && pending.length > 0) {
        const followerIds = pending.map(req => req.follower_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url')
          .in('id', followerIds);

        const requestsWithProfiles = pending.map(req => ({
          ...req,
          profiles: profiles?.find(p => p.id === req.follower_id)
        }));
        setPendingRequests(requestsWithProfiles);
      }
    } catch (error) {
      console.error('Error fetching connections:', error);
    }
  };

  const fetchWatchParties = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('watch_parties')
        .select('*')
        .eq('status', 'scheduled')
        .gte('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true })
        .limit(5);

      if (error) throw error;

      // Get host profiles separately
      if (data && data.length > 0) {
        const hostIds = data.map(party => party.host_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .in('id', hostIds);

        const partiesWithProfiles = data.map(party => ({
          ...party,
          host_profile: profiles?.find(p => p.id === party.host_id)
        }));

        setWatchParties(partiesWithProfiles);
      } else {
        setWatchParties([]);
      }
    } catch (error) {
      console.error('Error fetching watch parties:', error);
      setWatchParties([]);
    }
  };

  const fetchSuggestedUsers = async () => {
    if (!user) return;
    
    try {
      // Get users with similar movie preferences
      const { data: userLikes } = await supabase
        .from('watchlist')
        .select('movie_id')
        .eq('user_id', user.id)
        .eq('list_type', 'liked')
        .limit(10);

      if (userLikes && userLikes.length > 0) {
        const movieIds = userLikes.map(like => like.movie_id);
        
        const { data: similarUsers } = await supabase
          .from('watchlist')
          .select('user_id, movie_id')
          .in('movie_id', movieIds)
          .eq('list_type', 'liked')
          .neq('user_id', user.id);

        if (similarUsers && similarUsers.length > 0) {
          const userIds = [...new Set(similarUsers.map(u => u.user_id))];
          
          const { data: profiles } = await supabase
            .from('profiles')
            .select('*')
            .in('id', userIds)
            .limit(8);

          if (profiles) {
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

            const suggestions = Object.values(userMovieCount)
              .sort((a, b) => b.count - a.count)
              .slice(0, 6)
              .map(item => ({
                ...item.profile,
                reason: `${item.count} shared liked movie${item.count > 1 ? 's' : ''}`,
                shared_movies: item.count
              }));

            setSuggestedUsers(suggestions);
            return;
          }
        }
      }

      // Fallback: Get recent active users
      const { data: recentUsers } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user.id)
        .order('created_at', { ascending: false })
        .limit(6);

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
    } catch (error) {
      console.error('Error fetching suggested users:', error);
    }
  };

  const handleAcceptRequest = async (connectionId: string) => {
    try {
      const { error } = await supabase
        .from('social_connections')
        .update({ status: 'accepted' })
        .eq('id', connectionId);

      if (error) throw error;

      toast.success('Friend request accepted! 🎉');
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
      toast.error('Please enter a username to search');
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

      toast.success('Friend request sent! 🚀');
      setSearchResults(prev => prev.filter(u => u.id !== targetUserId));
      setSuggestedUsers(prev => prev.filter(u => u.id !== targetUserId));
    } catch (error) {
      console.error('Error sending friend request:', error);
      toast.error('Failed to send friend request');
    }
  };

  const joinWatchParty = async (partyId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('watch_party_participants')
        .insert({
          party_id: partyId,
          user_id: user.id
        });

      if (error) throw error;

      toast.success('Joined watch party! 🎬');
      fetchWatchParties();
    } catch (error) {
      console.error('Error joining watch party:', error);
      toast.error('Failed to join watch party');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
        <MobileHeader title="Social Hub" />
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading your social world...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 pb-32">
      <MobileHeader title="Social Hub" />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary/10 via-accent/5 to-secondary/10 border-b border-border/50">
        <div className="container mx-auto px-6 py-12">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Your Movie <span className="text-primary">Social Hub</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Connect with fellow movie enthusiasts, discover new films together, and share your cinematic journey
            </p>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 max-w-2xl mx-auto">
            <Card className="text-center p-4">
              <div className="text-2xl font-bold text-primary">{connections.length}</div>
              <div className="text-xs text-muted-foreground">Friends</div>
            </Card>
            <Card className="text-center p-4">
              <div className="text-2xl font-bold text-primary">{pendingRequests.length}</div>
              <div className="text-xs text-muted-foreground">Requests</div>
            </Card>
            <Card className="text-center p-4">
              <div className="text-2xl font-bold text-primary">{suggestedUsers.length}</div>
              <div className="text-xs text-muted-foreground">Suggestions</div>
            </Card>
            <Card className="text-center p-4">
              <div className="text-2xl font-bold text-primary">{watchParties.length}</div>
              <div className="text-xs text-muted-foreground">Watch Parties</div>
            </Card>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="discover" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Discover</span>
            </TabsTrigger>
            <TabsTrigger value="friends" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Friends</span>
            </TabsTrigger>
            <TabsTrigger value="community" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">Community</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              <span className="hidden sm:inline">Activity</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="discover" className="space-y-6">
            {/* Search Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-primary" />
                  Find Movie Friends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <Input
                    placeholder="Search by username..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="flex-1"
                  />
                  <Button onClick={handleSearch} disabled={isSearching}>
                    {isSearching ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Search Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {searchResults.map((profile) => (
                      <div key={profile.id} className="flex items-center justify-between p-4 bg-muted/20 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={profile.avatar_url} alt={profile.username} />
                            <AvatarFallback>
                              <Users className="h-6 w-6" />
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-foreground">{profile.full_name || profile.username}</div>
                            <div className="text-sm text-muted-foreground">@{profile.username}</div>
                          </div>
                        </div>
                        <Button size="sm" onClick={() => sendFriendRequest(profile.id)}>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Add Friend
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Suggested Users */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  People You Might Like
                </CardTitle>
              </CardHeader>
              <CardContent>
                {suggestedUsers.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {suggestedUsers.map((suggested) => (
                      <div key={suggested.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/5 to-accent/5 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={suggested.avatar_url} alt={suggested.username} />
                            <AvatarFallback>
                              <Users className="h-6 w-6" />
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-foreground">{suggested.full_name || suggested.username}</div>
                            <div className="text-sm text-muted-foreground">@{suggested.username}</div>
                            {suggested.reason && (
                              <Badge variant="secondary" className="text-xs mt-1">
                                <Heart className="h-3 w-3 mr-1" />
                                {suggested.reason}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button size="sm" onClick={() => sendFriendRequest(suggested.id)}>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Connect
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No suggestions available right now</p>
                    <p className="text-sm text-muted-foreground mt-1">Like some movies to get personalized suggestions!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="friends" className="space-y-6">
            {/* Pending Requests */}
            {pendingRequests.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-primary" />
                    Friend Requests ({pendingRequests.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {pendingRequests.map((request) => (
                      <div key={request.id} className="flex items-center justify-between p-4 bg-primary/5 rounded-lg border-l-4 border-primary">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={request.profiles?.avatar_url} alt={request.profiles?.username} />
                            <AvatarFallback>
                              <Users className="h-6 w-6" />
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-foreground">
                              {request.profiles?.full_name || request.profiles?.username || 'Anonymous User'}
                            </div>
                            <div className="text-sm text-muted-foreground">Wants to connect with you</div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleAcceptRequest(request.id)}>
                            <Check className="h-4 w-4 mr-2" />
                            Accept
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleRejectRequest(request.id)}>
                            <X className="h-4 w-4 mr-2" />
                            Decline
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Friends List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Your Movie Friends ({connections.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {connections.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No friends yet</h3>
                    <p className="text-muted-foreground mb-6">
                      Start connecting with fellow movie enthusiasts!
                    </p>
                    <Button onClick={() => setActiveTab("discover")}>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Discover People
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {connections.map((connection) => (
                      <Card key={connection.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={connection.profiles?.avatar_url} alt={connection.profiles?.username} />
                              <AvatarFallback>
                                <Users className="h-6 w-6" />
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="font-medium text-foreground">
                                {connection.profiles?.full_name || connection.profiles?.username || 'Movie Friend'}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                @{connection.profiles?.username || 'user'}
                              </div>
                            </div>
                          </div>
                          <div className="mt-3 pt-3 border-t border-border">
                            <Button size="sm" variant="outline" className="w-full">
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Message
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="community" className="space-y-6">
            <MovieClubHub />
          </TabsContent>
          <TabsContent value="activity" className="space-y-6">
            <SocialActivityFeed />
          </TabsContent>
        </Tabs>
      </div>

      <Navigation />
    </div>
  );
};