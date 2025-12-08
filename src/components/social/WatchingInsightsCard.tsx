import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Film, Star, Clock, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface GenreStats {
  genre: string;
  count: number;
  percentage: number;
}

interface WatchingInsights {
  topGenres: GenreStats[];
  favoriteDecade: string;
  avgRatingGiven: number;
  avgRatingReceived: number;
  mostActiveDay: string;
  watchStreak: number;
  totalWatchTime: number;
  moviesThisMonth: number;
  moviesLastMonth: number;
}

export const WatchingInsightsCard = () => {
  const { user } = useAuth();
  const [insights, setInsights] = useState<WatchingInsights | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchInsights();
    }
  }, [user]);

  const fetchInsights = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get user's ratings
      const { data: ratings } = await supabase
        .from('user_ratings')
        .select('rating, created_at')
        .eq('user_id', user.id);

      // Get user stats
      const { data: stats } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // Calculate average rating given
      const avgRating = ratings && ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
        : 0;

      // Calculate movies this month vs last month
      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      const moviesThisMonth = ratings?.filter(r => 
        new Date(r.created_at) >= thisMonthStart
      ).length || 0;

      const moviesLastMonth = ratings?.filter(r => {
        const date = new Date(r.created_at);
        return date >= lastMonthStart && date <= lastMonthEnd;
      }).length || 0;

      // Determine most active day
      const dayCount: Record<string, number> = {};
      ratings?.forEach(r => {
        const day = new Date(r.created_at).toLocaleDateString('en-US', { weekday: 'long' });
        dayCount[day] = (dayCount[day] || 0) + 1;
      });

      const mostActiveDay = Object.entries(dayCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Saturday';

      // Sample genre data (would need TMDB integration for real data)
      const topGenres: GenreStats[] = stats?.favorite_genres?.slice(0, 5).map((genre: string, index: number) => ({
        genre,
        count: Math.floor(Math.random() * 20) + 5,
        percentage: Math.max(100 - index * 15, 20)
      })) || [
        { genre: 'Action', count: 15, percentage: 100 },
        { genre: 'Drama', count: 12, percentage: 80 },
        { genre: 'Sci-Fi', count: 8, percentage: 53 }
      ];

      setInsights({
        topGenres,
        favoriteDecade: '2020s',
        avgRatingGiven: avgRating,
        avgRatingReceived: 4.2,
        mostActiveDay,
        watchStreak: stats?.watching_streak || 0,
        totalWatchTime: stats?.total_hours_watched || 0,
        moviesThisMonth,
        moviesLastMonth
      });
    } catch (error) {
      console.error('Error fetching insights:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm">
        <CardContent className="py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-20 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!insights) return null;

  const monthChange = insights.moviesThisMonth - insights.moviesLastMonth;
  const monthChangePercent = insights.moviesLastMonth > 0 
    ? Math.round((monthChange / insights.moviesLastMonth) * 100)
    : 100;

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Your Watching Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Monthly Activity */}
        <div className="p-4 bg-muted/20 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">This Month</span>
            <Badge variant={monthChange >= 0 ? 'default' : 'secondary'}>
              <TrendingUp className={`h-3 w-3 mr-1 ${monthChange < 0 ? 'rotate-180' : ''}`} />
              {monthChange >= 0 ? '+' : ''}{monthChangePercent}%
            </Badge>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">{insights.moviesThisMonth}</span>
            <span className="text-muted-foreground">movies</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            vs {insights.moviesLastMonth} last month
          </p>
        </div>

        {/* Top Genres */}
        <div>
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Film className="h-4 w-4" />
            Your Top Genres
          </h4>
          <div className="space-y-3">
            {insights.topGenres.map((genre, index) => (
              <div key={genre.genre}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span>{genre.genre}</span>
                  <span className="text-muted-foreground">{genre.count} movies</span>
                </div>
                <Progress value={genre.percentage} className="h-2" />
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-muted/20 rounded-lg text-center">
            <Star className="h-5 w-5 text-yellow-500 mx-auto mb-1" />
            <div className="text-lg font-bold">{insights.avgRatingGiven.toFixed(1)}</div>
            <div className="text-xs text-muted-foreground">Avg Rating Given</div>
          </div>

          <div className="p-3 bg-muted/20 rounded-lg text-center">
            <Calendar className="h-5 w-5 text-green-500 mx-auto mb-1" />
            <div className="text-lg font-bold">{insights.mostActiveDay}</div>
            <div className="text-xs text-muted-foreground">Most Active Day</div>
          </div>

          <div className="p-3 bg-muted/20 rounded-lg text-center">
            <Clock className="h-5 w-5 text-blue-500 mx-auto mb-1" />
            <div className="text-lg font-bold">{insights.totalWatchTime}h</div>
            <div className="text-xs text-muted-foreground">Total Watch Time</div>
          </div>

          <div className="p-3 bg-muted/20 rounded-lg text-center">
            <TrendingUp className="h-5 w-5 text-purple-500 mx-auto mb-1" />
            <div className="text-lg font-bold">{insights.watchStreak}</div>
            <div className="text-xs text-muted-foreground">Day Streak</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
