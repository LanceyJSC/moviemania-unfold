import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  User, Film, Star, Heart, Trophy, Users, Calendar, 
  TrendingUp, Clock, Award, Percent, ArrowLeft, UserPlus, Check
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MobileHeader } from '@/components/MobileHeader';
import { Navigation } from '@/components/Navigation';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface UserProfileData {
  id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
}

interface UserStats {
  total_movies_watched: number;
  total_ratings: number;
  average_rating: number;
  experience_points: number;
  level: number;
  watching_streak: number;
}

interface Achievement {
  id: string;
  achievement_type: string;
  achievement_data: any;
  unlocked_at: string;
}

interface WatchlistItem {
  id: string;
  movie_id: number;
  movie_title: string;
  movie_poster?: string;
}

interface Rating {
  id: string;
  movie_id: number;
  movie_title: string;
  movie_poster?: string;
  rating: number;
  created_at: string;
}

export default function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [compatibility, setCompatibility] = useState<number | null>(null);
  const [isFriend, setIsFriend] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [loading, setLoading] = useState(true);

  const isOwnProfile = currentUser?.id === userId;

  useEffect(() => {
    if (userId) {
      fetchUserData();
    }
  }, [userId, currentUser]);

  const fetchUserData = async () => {
    try {
      setLoading(true);

      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!profileData) {
        toast.error('User not found');
        return;
      }

      setProfile(profileData);

      // Fetch stats
      const { data: statsData } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userId)
        .single();

      setStats(statsData || {
        total_movies_watched: 0,
        total_ratings: 0,
        average_rating: 0,
        experience_points: 0,
        level: 1,
        watching_streak: 0
      });

      // Fetch achievements
      const { data: achievementsData } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', userId)
        .order('unlocked_at', { ascending: false });

      setAchievements(achievementsData || []);

      // Fetch public watchlist (liked movies)
      const { data: watchlistData } = await supabase
        .from('watchlist')
        .select('*')
        .eq('user_id', userId)
        .eq('list_type', 'liked')
        .limit(20);

      setWatchlist(watchlistData || []);

      // Fetch ratings
      const { data: ratingsData } = await supabase
        .from('user_ratings')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      setRatings(ratingsData || []);

      // Check friendship status
      if (currentUser && currentUser.id !== userId) {
        const { data: connectionData } = await supabase
          .from('social_connections')
          .select('*')
          .or(`and(follower_id.eq.${currentUser.id},following_id.eq.${userId}),and(follower_id.eq.${userId},following_id.eq.${currentUser.id})`);

        const connection = connectionData?.[0];
        if (connection) {
          setIsFriend(connection.status === 'accepted');
          setIsPending(connection.status === 'pending');
        }

        // Get compatibility score
        const { data: compatData } = await supabase
          .from('taste_compatibility')
          .select('compatibility_score')
          .or(`and(user_id.eq.${currentUser.id},friend_id.eq.${userId}),and(user_id.eq.${userId},friend_id.eq.${currentUser.id})`)
          .single();

        setCompatibility(compatData?.compatibility_score || null);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async () => {
    if (!currentUser || !userId) return;

    try {
      await supabase.from('social_connections').insert({
        follower_id: currentUser.id,
        following_id: userId,
        friend_id: userId,
        status: 'pending'
      } as any);

      setIsPending(true);
      toast.success('Friend request sent!');
    } catch (error) {
      toast.error('Failed to send request');
    }
  };

  const getLevelProgress = () => {
    if (!stats) return 0;
    const xpPerLevel = 500;
    return ((stats.experience_points % xpPerLevel) / xpPerLevel) * 100;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-32">
        <MobileHeader title="Profile" />
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
        <Navigation />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background pb-32">
        <MobileHeader title="Profile" />
        <div className="text-center py-16">
          <User className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">User Not Found</h2>
          <Link to="/social">
            <Button variant="outline"><ArrowLeft className="h-4 w-4 mr-2" />Back to Social</Button>
          </Link>
        </div>
        <Navigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <MobileHeader title={profile.username || 'Profile'} />

      {/* Profile Header */}
      <div className="bg-gradient-to-b from-primary/20 to-background">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col items-center text-center">
            <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                {profile.username?.charAt(0).toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>

            <h1 className="text-2xl font-bold mt-4">{profile.full_name || profile.username}</h1>
            <p className="text-muted-foreground">@{profile.username}</p>

            {stats && (
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Trophy className="h-3 w-3" />
                  Level {stats.level || 1}
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {stats.experience_points || 0} XP
                </Badge>
              </div>
            )}

            {compatibility !== null && !isOwnProfile && (
              <div className="mt-4 flex items-center gap-2">
                <Percent className="h-5 w-5 text-primary" />
                <span className="text-lg font-semibold">{compatibility}% Match</span>
              </div>
            )}

            {!isOwnProfile && currentUser && (
              <div className="mt-4">
                {isFriend ? (
                  <Button variant="secondary" disabled>
                    <Check className="h-4 w-4 mr-2" />Friends
                  </Button>
                ) : isPending ? (
                  <Button variant="outline" disabled>Request Pending</Button>
                ) : (
                  <Button onClick={sendFriendRequest}>
                    <UserPlus className="h-4 w-4 mr-2" />Add Friend
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-3 mt-8 max-w-lg mx-auto">
            <Card className="text-center p-3 bg-card/80">
              <div className="text-xl font-bold text-primary">{stats?.total_movies_watched || 0}</div>
              <div className="text-xs text-muted-foreground">Watched</div>
            </Card>
            <Card className="text-center p-3 bg-card/80">
              <div className="text-xl font-bold text-primary">{stats?.total_ratings || 0}</div>
              <div className="text-xs text-muted-foreground">Rated</div>
            </Card>
            <Card className="text-center p-3 bg-card/80">
              <div className="text-xl font-bold text-primary">{stats?.average_rating?.toFixed(1) || '0'}</div>
              <div className="text-xs text-muted-foreground">Avg Rating</div>
            </Card>
            <Card className="text-center p-3 bg-card/80">
              <div className="text-xl font-bold text-primary">{achievements.length}</div>
              <div className="text-xs text-muted-foreground">Badges</div>
            </Card>
          </div>

          {/* Level Progress */}
          {stats && (
            <div className="max-w-md mx-auto mt-6">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">Level {stats.level || 1}</span>
                <span className="text-muted-foreground">Level {(stats.level || 1) + 1}</span>
              </div>
              <Progress value={getLevelProgress()} className="h-2" />
            </div>
          )}
        </div>
      </div>

      {/* Content Tabs */}
      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="movies" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="movies"><Film className="h-4 w-4 mr-2" />Movies</TabsTrigger>
            <TabsTrigger value="ratings"><Star className="h-4 w-4 mr-2" />Ratings</TabsTrigger>
            <TabsTrigger value="achievements"><Award className="h-4 w-4 mr-2" />Badges</TabsTrigger>
          </TabsList>

          <TabsContent value="movies">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Heart className="h-5 w-5 text-red-500" />Liked Movies</CardTitle></CardHeader>
              <CardContent>
                {watchlist.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No liked movies yet</p>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {watchlist.map(item => (
                      <Link key={item.id} to={`/movie/${item.movie_id}`}>
                        {item.movie_poster ? (
                          <img
                            src={`https://image.tmdb.org/t/p/w185${item.movie_poster}`}
                            alt={item.movie_title}
                            className="w-full rounded-lg hover:opacity-80 transition-opacity"
                          />
                        ) : (
                          <div className="w-full aspect-[2/3] bg-muted rounded-lg flex items-center justify-center">
                            <Film className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ratings">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Star className="h-5 w-5 text-yellow-500" />Recent Ratings</CardTitle></CardHeader>
              <CardContent>
                {ratings.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No ratings yet</p>
                ) : (
                  <div className="space-y-3">
                    {ratings.map(rating => (
                      <Link key={rating.id} to={`/movie/${rating.movie_id}`} className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg hover:bg-muted/30">
                        {rating.movie_poster ? (
                          <img src={`https://image.tmdb.org/t/p/w92${rating.movie_poster}`} alt={rating.movie_title} className="w-12 h-18 rounded" />
                        ) : (
                          <div className="w-12 h-18 bg-muted rounded flex items-center justify-center"><Film className="h-4 w-4" /></div>
                        )}
                        <div className="flex-1">
                          <p className="font-medium">{rating.movie_title}</p>
                          <div className="flex items-center gap-1 mt-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className={cn('h-4 w-4', i < rating.rating ? 'text-yellow-500 fill-current' : 'text-muted')} />
                            ))}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="achievements">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Trophy className="h-5 w-5 text-primary" />Achievements</CardTitle></CardHeader>
              <CardContent>
                {achievements.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No achievements unlocked yet</p>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {achievements.map(achievement => (
                      <div key={achievement.id} className="p-4 bg-primary/5 border border-primary/20 rounded-lg text-center">
                        <Trophy className="h-8 w-8 text-primary mx-auto mb-2" />
                        <p className="font-medium text-sm">{achievement.achievement_data?.title || achievement.achievement_type}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(achievement.unlocked_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Navigation />
    </div>
  );
}
