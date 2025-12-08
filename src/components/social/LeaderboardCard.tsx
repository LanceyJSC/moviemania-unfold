import { useState, useEffect } from 'react';
import { Trophy, Medal, Star, Film, Crown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface LeaderboardEntry {
  userId: string;
  profile: {
    username: string;
    full_name?: string;
    avatar_url?: string;
  };
  value: number;
  rank: number;
}

export const LeaderboardCard = () => {
  const { user } = useAuth();
  const [topWatchers, setTopWatchers] = useState<LeaderboardEntry[]>([]);
  const [topRaters, setTopRaters] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboards();
  }, []);

  const fetchLeaderboards = async () => {
    try {
      setLoading(true);

      // Get top watchers from user_stats
      const { data: watchStats } = await supabase
        .from('user_stats')
        .select('user_id, total_movies_watched')
        .order('total_movies_watched', { ascending: false })
        .limit(10);

      // Get top raters
      const { data: ratingStats } = await supabase
        .from('user_stats')
        .select('user_id, total_ratings')
        .order('total_ratings', { ascending: false })
        .limit(10);

      // Get all relevant profiles
      const allUserIds = [...new Set([
        ...(watchStats?.map(s => s.user_id) || []),
        ...(ratingStats?.map(s => s.user_id) || [])
      ])];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .in('id', allUserIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      setTopWatchers(
        (watchStats || []).map((stat, index) => ({
          userId: stat.user_id,
          profile: profileMap.get(stat.user_id) || { username: 'Unknown' },
          value: stat.total_movies_watched || 0,
          rank: index + 1
        })).filter(e => e.value > 0)
      );

      setTopRaters(
        (ratingStats || []).map((stat, index) => ({
          userId: stat.user_id,
          profile: profileMap.get(stat.user_id) || { username: 'Unknown' },
          value: stat.total_ratings || 0,
          rank: index + 1
        })).filter(e => e.value > 0)
      );
    } catch (error) {
      console.error('Error fetching leaderboards:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Medal className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const renderLeaderboard = (entries: LeaderboardEntry[], valueLabel: string) => {
    if (entries.length === 0) {
      return (
        <div className="text-center py-8">
          <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No data yet</p>
          <p className="text-sm text-muted-foreground mt-1">Start watching to appear here!</p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {entries.map((entry) => (
          <div
            key={entry.userId}
            className={cn(
              'flex items-center gap-3 p-3 rounded-lg transition-colors',
              entry.userId === user?.id ? 'bg-primary/10 border border-primary/30' : 'bg-muted/20',
              entry.rank <= 3 && 'bg-gradient-to-r from-muted/20 to-transparent'
            )}
          >
            <div className="w-8 flex justify-center">
              {getRankIcon(entry.rank)}
            </div>

            <Avatar className="h-10 w-10">
              <AvatarImage src={entry.profile.avatar_url} />
              <AvatarFallback>
                {entry.profile.username?.charAt(0).toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <p className={cn(
                'font-medium truncate',
                entry.userId === user?.id && 'text-primary'
              )}>
                {entry.profile.full_name || entry.profile.username}
                {entry.userId === user?.id && ' (You)'}
              </p>
              <p className="text-sm text-muted-foreground">@{entry.profile.username}</p>
            </div>

            <Badge variant="secondary" className="text-sm">
              {entry.value} {valueLabel}
            </Badge>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Community Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="watched" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="watched" className="flex items-center gap-2">
              <Film className="h-4 w-4" />
              Top Watchers
            </TabsTrigger>
            <TabsTrigger value="ratings" className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              Top Raters
            </TabsTrigger>
          </TabsList>

          <TabsContent value="watched">
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse h-16 bg-muted rounded-lg" />
                ))}
              </div>
            ) : (
              renderLeaderboard(topWatchers, 'watched')
            )}
          </TabsContent>

          <TabsContent value="ratings">
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse h-16 bg-muted rounded-lg" />
                ))}
              </div>
            ) : (
              renderLeaderboard(topRaters, 'rated')
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
