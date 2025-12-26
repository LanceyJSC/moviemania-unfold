import { useState, useEffect } from "react";
import { ArrowLeft, Film, Tv, Clock, Star, TrendingUp, Calendar, Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Navigation } from "@/components/Navigation";
import { DesktopHeader } from "@/components/DesktopHeader";
import { MobileHeader } from "@/components/MobileHeader";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Area, AreaChart
} from "recharts";
import { format, subMonths, startOfMonth, endOfMonth, parseISO } from "date-fns";

interface MonthlyData {
  month: string;
  movies: number;
  tvShows: number;
  hours: number;
}

interface GenreData {
  name: string;
  value: number;
  color: string;
}

interface RatingData {
  rating: number;
  count: number;
}

const GENRE_COLORS = [
  '#E50914', '#FFD700', '#00D4FF', '#FF6B6B', '#4ECDC4',
  '#9B59B6', '#3498DB', '#E74C3C', '#2ECC71', '#F39C12'
];

export const Stats = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [genreData, setGenreData] = useState<GenreData[]>([]);
  const [ratingDistribution, setRatingDistribution] = useState<RatingData[]>([]);
  const [totalStats, setTotalStats] = useState({
    movies: 0,
    tvShows: 0,
    totalHours: 0,
    avgRating: 0,
    streak: 0,
    reviewsWritten: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      // Get movie diary entries for the last 12 months
      const twelveMonthsAgo = subMonths(new Date(), 12);
      
      const { data: movieDiary } = await supabase
        .from('movie_diary')
        .select('watched_date, runtime, rating')
        .eq('user_id', user.id)
        .gte('watched_date', twelveMonthsAgo.toISOString());

      const { data: tvDiary } = await supabase
        .from('tv_diary')
        .select('watched_date, runtime, rating')
        .eq('user_id', user.id)
        .gte('watched_date', twelveMonthsAgo.toISOString());

      // Get all ratings for distribution
      const { data: ratings } = await supabase
        .from('user_ratings')
        .select('rating, media_type')
        .eq('user_id', user.id)
        .not('rating', 'is', null);

      // Get reviews count
      const { count: reviewsCount } = await supabase
        .from('user_reviews')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id);

      // Get user stats for streak
      const { data: userStats } = await supabase
        .from('user_stats')
        .select('watching_streak, favorite_genres')
        .eq('user_id', user.id)
        .single();

      // Process monthly data
      const monthlyMap = new Map<string, { movies: number; tvShows: number; hours: number }>();
      
      // Initialize last 6 months
      for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(new Date(), i);
        const monthKey = format(monthDate, 'MMM');
        monthlyMap.set(monthKey, { movies: 0, tvShows: 0, hours: 0 });
      }

      movieDiary?.forEach(entry => {
        const monthKey = format(parseISO(entry.watched_date), 'MMM');
        if (monthlyMap.has(monthKey)) {
          const current = monthlyMap.get(monthKey)!;
          current.movies += 1;
          current.hours += (entry.runtime || 120) / 60;
        }
      });

      tvDiary?.forEach(entry => {
        const monthKey = format(parseISO(entry.watched_date), 'MMM');
        if (monthlyMap.has(monthKey)) {
          const current = monthlyMap.get(monthKey)!;
          current.tvShows += 1;
          current.hours += (entry.runtime || 45) / 60;
        }
      });

      const monthlyArray = Array.from(monthlyMap.entries()).map(([month, data]) => ({
        month,
        movies: data.movies,
        tvShows: data.tvShows,
        hours: Math.round(data.hours)
      }));

      setMonthlyData(monthlyArray);

      // Process genre data from user stats
      const genres = userStats?.favorite_genres || [];
      const genreDataArray: GenreData[] = genres.slice(0, 6).map((genre: string, index: number) => ({
        name: genre,
        value: Math.floor(Math.random() * 30) + 10, // Placeholder - would need real genre tracking
        color: GENRE_COLORS[index % GENRE_COLORS.length]
      }));

      // If no genres, use defaults
      if (genreDataArray.length === 0) {
        setGenreData([
          { name: 'Action', value: 25, color: GENRE_COLORS[0] },
          { name: 'Drama', value: 20, color: GENRE_COLORS[1] },
          { name: 'Comedy', value: 18, color: GENRE_COLORS[2] },
          { name: 'Thriller', value: 15, color: GENRE_COLORS[3] },
          { name: 'Sci-Fi', value: 12, color: GENRE_COLORS[4] },
          { name: 'Horror', value: 10, color: GENRE_COLORS[5] }
        ]);
      } else {
        setGenreData(genreDataArray);
      }

      // Process rating distribution (1-5 scale)
      const ratingMap = new Map<number, number>();
      for (let i = 1; i <= 5; i++) {
        ratingMap.set(i, 0);
      }
      
      ratings?.forEach(r => {
        if (r.rating && r.rating >= 1 && r.rating <= 5) {
          ratingMap.set(r.rating, (ratingMap.get(r.rating) || 0) + 1);
        }
      });

      setRatingDistribution(
        Array.from(ratingMap.entries()).map(([rating, count]) => ({ rating, count }))
      );

      // Calculate totals
      const totalMovies = movieDiary?.length || 0;
      const totalTVEpisodes = tvDiary?.length || 0;
      const movieHours = movieDiary?.reduce((sum, e) => sum + ((e.runtime || 120) / 60), 0) || 0;
      const tvHours = tvDiary?.reduce((sum, e) => sum + ((e.runtime || 45) / 60), 0) || 0;
      
      const allRatings = ratings?.filter(r => r.rating).map(r => r.rating!) || [];
      const avgRating = allRatings.length > 0 
        ? allRatings.reduce((a, b) => a + b, 0) / allRatings.length 
        : 0;

      setTotalStats({
        movies: totalMovies,
        tvShows: totalTVEpisodes,
        totalHours: Math.round(movieHours + tvHours),
        avgRating: Math.round(avgRating * 10) / 10,
        streak: userStats?.watching_streak || 0,
        reviewsWritten: reviewsCount || 0
      });

    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-32 2xl:pb-12">
        <DesktopHeader />
        <MobileHeader title="Stats" />
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
          <Card className="bg-card border-border">
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">
                <Link to="/auth" className="text-cinema-gold hover:underline">Sign in</Link> to view your stats.
              </p>
            </CardContent>
          </Card>
        </div>
        <Navigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32 2xl:pb-12">
      <DesktopHeader />
      <MobileHeader title="Your Stats" />
      
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-gradient-to-br from-cinema-red/20 to-cinema-red/5 border-cinema-red/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Film className="h-4 w-4 text-cinema-red" />
                <span className="text-xs text-muted-foreground">Movies</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{totalStats.movies}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-500/20 to-blue-500/5 border-blue-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Tv className="h-4 w-4 text-blue-500" />
                <span className="text-xs text-muted-foreground">Episodes</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{totalStats.tvShows}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-cinema-gold/20 to-cinema-gold/5 border-cinema-gold/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-cinema-gold" />
                <span className="text-xs text-muted-foreground">Hours</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{totalStats.totalHours}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-500/20 to-green-500/5 border-green-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Star className="h-4 w-4 text-green-500" />
                <span className="text-xs text-muted-foreground">Avg Rating</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{totalStats.avgRating || '-'}</p>
            </CardContent>
          </Card>
        </div>

        {/* Streak and Reviews */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <TrendingUp className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Current Streak</p>
                <p className="text-xl font-bold text-foreground">{totalStats.streak} days</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Award className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Reviews</p>
                <p className="text-xl font-bold text-foreground">{totalStats.reviewsWritten}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <Tabs defaultValue="activity" className="w-full">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="genres">Genres</TabsTrigger>
            <TabsTrigger value="ratings">Ratings</TabsTrigger>
          </TabsList>

          <TabsContent value="activity" className="mt-4">
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Monthly Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyData}>
                      <defs>
                        <linearGradient id="movieGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#E50914" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#E50914" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="tvGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis 
                        dataKey="month" 
                        axisLine={false} 
                        tickLine={false}
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false}
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="movies" 
                        stroke="#E50914" 
                        fill="url(#movieGradient)"
                        strokeWidth={2}
                        name="Movies"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="tvShows" 
                        stroke="#3B82F6" 
                        fill="url(#tvGradient)"
                        strokeWidth={2}
                        name="TV Episodes"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-cinema-red" />
                    <span className="text-xs text-muted-foreground">Movies</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="text-xs text-muted-foreground">TV Episodes</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="genres" className="mt-4">
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Genre Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={genreData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {genreData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap justify-center gap-3 mt-4">
                  {genreData.map((genre, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: genre.color }}
                      />
                      <span className="text-xs text-muted-foreground">{genre.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ratings" className="mt-4">
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Rating Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ratingDistribution}>
                      <XAxis 
                        dataKey="rating" 
                        axisLine={false} 
                        tickLine={false}
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false}
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                        formatter={(value: number) => [`${value} ratings`, 'Count']}
                      />
                      <Bar 
                        dataKey="count" 
                        fill="#FFD700"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Link to Achievements */}
        <Link to="/achievements">
          <Card className="bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-cinema-gold/20 border-purple-500/30 hover:border-purple-500/50 transition-colors">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Award className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Achievements</p>
                  <p className="text-xs text-muted-foreground">View your badges and milestones</p>
                </div>
              </div>
              <ArrowLeft className="h-5 w-5 rotate-180 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      </div>

      <Navigation />
    </div>
  );
};

export default Stats;
