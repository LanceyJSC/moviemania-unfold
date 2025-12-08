import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Users, 
  UserPlus, 
  Check, 
  X, 
  Sparkles, 
  Heart,
  Calendar,
  Target,
  Zap,
  Globe,
  Search,
  RefreshCw,
  Trophy,
  Percent,
  BarChart3
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
import { FriendCompatibilityCard } from "@/components/social/FriendCompatibilityCard";
import { WeeklyChallengesCard } from "@/components/social/WeeklyChallengesCard";
import { LeaderboardCard } from "@/components/social/LeaderboardCard";
import { MovieNightPollCard } from "@/components/social/MovieNightPollCard";
import { WatchingInsightsCard } from "@/components/social/WatchingInsightsCard";
import { ShareStatsCard } from "@/components/social/ShareStatsCard";
import { useAuth } from "@/hooks/useAuth";
import { useFriendCompatibility } from "@/hooks/useFriendCompatibility";
import { useWeeklyChallenges } from "@/hooks/useWeeklyChallenges";
import { useMovieNightPolls } from "@/hooks/useMovieNightPolls";
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

export default function Social() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Connection[]>([]);
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState("discover");
  const { user } = useAuth();

  const { compatibilities, loading: compatLoading } = useFriendCompatibility();
  const { challenges, loading: challengesLoading } = useWeeklyChallenges();
  const { polls, vote, closePoll } = useMovieNightPolls();

  useEffect(() => {
    if (user) {
      fetchAllData();
    }
  }, [user]);

  const fetchAllData = async () => {
    await Promise.all([
      fetchConnections(),
      fetchSuggestedUsers()
    ]);
    setIsLoading(false);
  };

  const fetchConnections = async () => {
    if (!user) return;
    
    try {
      const { data: accepted } = await supabase
        .from('social_connections')
        .select('*')
        .eq('follower_id', user.id)
        .eq('status', 'accepted');

      const { data: pending } = await supabase
        .from('social_connections')
        .select('*')
        .eq('following_id', user.id)
        .eq('status', 'pending');

      if (accepted && accepted.length > 0) {
        const followingIds = accepted.map(conn => conn.following_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url')
          .in('id', followingIds);

        setConnections(accepted.map(conn => ({
          ...conn,
          profiles: profiles?.find(p => p.id === conn.following_id)
        })));
      }

      if (pending && pending.length > 0) {
        const followerIds = pending.map(req => req.follower_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url')
          .in('id', followerIds);

        setPendingRequests(pending.map(req => ({
          ...req,
          profiles: profiles?.find(p => p.id === req.follower_id)
        })));
      }
    } catch (error) {
      console.error('Error fetching connections:', error);
    }
  };

  const fetchSuggestedUsers = async () => {
    if (!user) return;
    
    try {
      const { data: recentUsers } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user.id)
        .order('created_at', { ascending: false })
        .limit(6);

      if (recentUsers) {
        setSuggestedUsers(recentUsers.map(u => ({
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
      await supabase.from('social_connections').update({ status: 'accepted' }).eq('id', connectionId);
      toast.success('Friend request accepted!');
      fetchConnections();
    } catch (error) {
      toast.error('Failed to accept request');
    }
  };

  const handleRejectRequest = async (connectionId: string) => {
    try {
      await supabase.from('social_connections').delete().eq('id', connectionId);
      toast.success('Request rejected');
      fetchConnections();
    } catch (error) {
      toast.error('Failed to reject request');
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    setIsSearching(true);
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%`)
        .neq('id', user?.id)
        .limit(10);
      setSearchResults(data || []);
    } catch (error) {
      toast.error('Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const sendFriendRequest = async (targetUserId: string) => {
    if (!user) return;
    try {
      await supabase.from('social_connections').insert({
        follower_id: user.id,
        following_id: targetUserId,
        friend_id: targetUserId,
        status: 'pending'
      } as any);
      toast.success('Friend request sent!');
      setSearchResults(prev => prev.filter(u => u.id !== targetUserId));
      setSuggestedUsers(prev => prev.filter(u => u.id !== targetUserId));
    } catch (error) {
      toast.error('Failed to send request');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 pb-32">
        <MobileHeader title="Social Hub" />
        <div className="container mx-auto px-6 py-8">
          <div className="text-center py-16">
            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-foreground mb-2">Join the Movie Community</h3>
            <p className="text-muted-foreground mb-6">Connect with fellow movie lovers</p>
            <Button onClick={() => window.location.href = '/auth'}>Sign In</Button>
          </div>
        </div>
        <Navigation />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
        <MobileHeader title="Social Hub" />
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 pb-32">
      <MobileHeader title="Social Hub" />
      
      {/* Hero Stats */}
      <div className="bg-gradient-to-r from-primary/10 via-accent/5 to-secondary/10 border-b border-border/50">
        <div className="container mx-auto px-6 py-8">
          <h1 className="text-3xl font-bold text-center mb-6">
            Your Movie <span className="text-primary">Social Hub</span>
          </h1>
          <div className="grid grid-cols-4 gap-3 max-w-lg mx-auto">
            <Card className="text-center p-3 bg-card/80">
              <div className="text-xl font-bold text-primary">{connections.length}</div>
              <div className="text-xs text-muted-foreground">Friends</div>
            </Card>
            <Card className="text-center p-3 bg-card/80">
              <div className="text-xl font-bold text-primary">{pendingRequests.length}</div>
              <div className="text-xs text-muted-foreground">Requests</div>
            </Card>
            <Card className="text-center p-3 bg-card/80">
              <div className="text-xl font-bold text-primary">{challenges.filter(c => c.completed).length}</div>
              <div className="text-xs text-muted-foreground">Challenges</div>
            </Card>
            <Card className="text-center p-3 bg-card/80">
              <div className="text-xl font-bold text-primary">{polls.length}</div>
              <div className="text-xs text-muted-foreground">Polls</div>
            </Card>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-card/50">
            <TabsTrigger value="discover"><Sparkles className="h-4 w-4" /></TabsTrigger>
            <TabsTrigger value="friends"><Users className="h-4 w-4" /></TabsTrigger>
            <TabsTrigger value="compatibility"><Percent className="h-4 w-4" /></TabsTrigger>
            <TabsTrigger value="challenges"><Target className="h-4 w-4" /></TabsTrigger>
            <TabsTrigger value="insights"><BarChart3 className="h-4 w-4" /></TabsTrigger>
            <TabsTrigger value="activity"><Zap className="h-4 w-4" /></TabsTrigger>
          </TabsList>

          <TabsContent value="discover" className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Search className="h-5 w-5" />Find Friends</CardTitle></CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input placeholder="Search username..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSearch()} />
                  <Button onClick={handleSearch} disabled={isSearching}><Search className="h-4 w-4" /></Button>
                </div>
                {searchResults.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {searchResults.map(user => (
                      <div key={user.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Avatar><AvatarImage src={user.avatar_url} /><AvatarFallback>{user.username?.charAt(0)}</AvatarFallback></Avatar>
                          <span className="font-medium">{user.full_name || user.username}</span>
                        </div>
                        <Button size="sm" onClick={() => sendFriendRequest(user.id)}><UserPlus className="h-4 w-4" /></Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            {suggestedUsers.length > 0 && (
              <Card>
                <CardHeader><CardTitle>Suggested Friends</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 gap-3">
                  {suggestedUsers.map(user => (
                    <div key={user.id} className="p-3 bg-muted/20 rounded-lg text-center">
                      <Avatar className="mx-auto mb-2"><AvatarImage src={user.avatar_url} /><AvatarFallback>{user.username?.charAt(0)}</AvatarFallback></Avatar>
                      <p className="font-medium text-sm truncate">{user.username}</p>
                      <Button size="sm" className="mt-2 w-full" onClick={() => sendFriendRequest(user.id)}>Add</Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="friends" className="space-y-6">
            {pendingRequests.length > 0 && (
              <Card>
                <CardHeader><CardTitle>Pending Requests ({pendingRequests.length})</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {pendingRequests.map(req => (
                    <div key={req.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar><AvatarImage src={req.profiles?.avatar_url} /><AvatarFallback>{req.profiles?.username?.charAt(0)}</AvatarFallback></Avatar>
                        <span>{req.profiles?.username}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleAcceptRequest(req.id)}><Check className="h-4 w-4" /></Button>
                        <Button size="sm" variant="outline" onClick={() => handleRejectRequest(req.id)}><X className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
            <Card>
              <CardHeader><CardTitle>Your Friends ({connections.length})</CardTitle></CardHeader>
              <CardContent>
                {connections.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No friends yet. Start connecting!</p>
                ) : (
                  <div className="space-y-2">
                    {connections.map(conn => (
                      <Link key={conn.id} to={`/user/${conn.following_id}`} className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg hover:bg-muted/30 transition-colors">
                        <Avatar><AvatarImage src={conn.profiles?.avatar_url} /><AvatarFallback>{conn.profiles?.username?.charAt(0)}</AvatarFallback></Avatar>
                        <div className="flex-1">
                          <p className="font-medium">{conn.profiles?.full_name || conn.profiles?.username}</p>
                          <p className="text-sm text-muted-foreground">@{conn.profiles?.username}</p>
                        </div>
                        <Badge variant="outline">View Profile</Badge>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="compatibility" className="space-y-6">
            <h2 className="text-xl font-semibold flex items-center gap-2"><Heart className="h-5 w-5 text-primary" />Taste Compatibility</h2>
            {compatLoading ? (
              <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="animate-pulse h-32 bg-muted rounded-lg" />)}</div>
            ) : compatibilities.length === 0 ? (
              <Card><CardContent className="py-8 text-center text-muted-foreground">Add friends to see compatibility scores!</CardContent></Card>
            ) : (
              <div className="space-y-4">
                {compatibilities.map(comp => (
                  <FriendCompatibilityCard key={comp.friendId} {...comp} profile={comp.friendProfile} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="challenges" className="space-y-6">
            <WeeklyChallengesCard challenges={challenges} loading={challengesLoading} />
            <LeaderboardCard />
            {polls.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2"><Calendar className="h-5 w-5 text-primary" />Movie Night Polls</h2>
                {polls.map(poll => (
                  <MovieNightPollCard key={poll.id} {...poll} onVote={vote} onClose={closePoll} isCreator={poll.createdBy === user?.id} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            <WatchingInsightsCard />
            <ShareStatsCard 
              username={user?.email?.split('@')[0] || 'User'} 
              stats={{
                moviesWatched: 0,
                totalRatings: 0,
                averageRating: 0,
                level: 1,
                xp: 0,
                achievements: 0,
                watchHours: 0
              }} 
            />
          </TabsContent>

          <TabsContent value="activity">
            <SocialActivityFeed />
          </TabsContent>
        </Tabs>
      </div>

      <Navigation />
    </div>
  );
}
