import { useState, useEffect } from "react";
import { ArrowLeft, Film, Tv, Clock, Star, TrendingUp, Calendar, Award, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Navigation } from "@/components/Navigation";
import { DesktopHeader } from "@/components/DesktopHeader";
import { MobileHeader } from "@/components/MobileHeader";
import { TasteProfileCard } from "@/components/TasteProfileCard";
import { TasteInsightsSection } from "@/components/TasteInsightsSection";
import { ProUpgradeModal } from "@/components/ProUpgradeModal";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useTasteProfile } from "@/hooks/useTasteProfile";
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
  const { isProUser } = useSubscription();
  const { profile: tasteProfile, loading: tasteLoading, error: tasteError } = useTasteProfile();
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
  const [showProModal, setShowProModal] = useState(false);

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

      // Get ALL ratings for distribution and counts (includes both movies and TV)
      const { data: ratings } = await supabase
        .from('user_ratings')
        .select('rating, media_type, created_at')
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

      // Process monthly data from diary entries
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

      // Also add ratings activity to monthly chart (use created_at as fallback)
      ratings?.forEach(rating => {
        const createdAt = rating.created_at;
        if (createdAt) {
          const ratingDate = new Date(createdAt);
          if (ratingDate >= twelveMonthsAgo) {
            const monthKey = format(ratingDate, 'MMM');
            if (monthlyMap.has(monthKey)) {
              const current = monthlyMap.get(monthKey)!;
              // Only add if not already counted in diary
              if (rating.media_type === 'movie') {
                // Check if movie diary is empty, then count from ratings
                if (!movieDiary || movieDiary.length === 0) {
                  current.movies += 1;
                  current.hours += 2; // Assume 2 hours for movies
                }
              } else if (rating.media_type === 'tv') {
                // TV ratings don't add to episode count (tv_diary has episodes)
              }
            }
          }
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

      // Process rating distribution (1-5 scale) - include ALL ratings
      const ratingMap = new Map<number, number>();
      for (let i = 1; i <= 5; i++) {
        ratingMap.set(i, 0);
      }
      
      // Add ratings from user_ratings table
      ratings?.forEach(r => {
        if (r.rating && r.rating >= 1 && r.rating <= 5) {
          ratingMap.set(r.rating, (ratingMap.get(r.rating) || 0) + 1);
        }
      });

      // Also add ratings from diary entries if they have ratings
      movieDiary?.forEach(m => {
        if (m.rating && m.rating >= 1 && m.rating <= 5) {
          ratingMap.set(m.rating, (ratingMap.get(m.rating) || 0) + 1);
        }
      });

      tvDiary?.forEach(t => {
        if (t.rating && t.rating >= 1 && t.rating <= 5) {
          ratingMap.set(t.rating, (ratingMap.get(t.rating) || 0) + 1);
        }
      });

      setRatingDistribution(
        Array.from(ratingMap.entries()).map(([rating, count]) => ({ rating, count }))
      );

      // Calculate totals - combine diary AND ratings
      const movieDiaryCount = movieDiary?.length || 0;
      const tvDiaryCount = tvDiary?.length || 0;
      
      // Count unique movies/TV from ratings that may not be in diary
      const movieRatingsCount = ratings?.filter(r => r.media_type === 'movie').length || 0;
      const tvRatingsCount = ratings?.filter(r => r.media_type === 'tv').length || 0;
      
      // Use the higher count between diary and ratings for each type
      const totalMovies = Math.max(movieDiaryCount, movieRatingsCount);
      const totalTVEpisodes = tvDiaryCount; // TV diary has episodes, ratings don't
      
      // Calculate hours from diary entries
      const movieHours = movieDiary?.reduce((sum, e) => sum + ((e.runtime || 120) / 60), 0) || 0;
      const tvHours = tvDiary?.reduce((sum, e) => sum + ((e.runtime || 45) / 60), 0) || 0;
      
      // If no movie diary but has movie ratings, estimate hours
      const estimatedMovieHours = movieDiaryCount === 0 && movieRatingsCount > 0 
        ? movieRatingsCount * 2 // Assume 2 hours per movie
        : movieHours;
      
      const allRatings = ratings?.filter(r => r.rating).map(r => r.rating!) || [];
      const avgRating = allRatings.length > 0 
        ? allRatings.reduce((a, b) => a + b, 0) / allRatings.length 
        : 0;

      setTotalStats({
        movies: totalMovies,
        tvShows: totalTVEpisodes,
        totalHours: Math.round(estimatedMovieHours + tvHours),
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
      <div className="min-h-screen bg-background pb-32 md:pb-12">
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
    <div className="min-h-screen bg-background pb-32 md:pb-12">
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
        <Tabs defaultValue="taste" className="w-full">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="taste" className="flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span className="hidden sm:inline">Taste</span>
            </TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="genres">Genres</TabsTrigger>
            <TabsTrigger value="ratings">Ratings</TabsTrigger>
          </TabsList>

          <TabsContent value="taste" className="mt-4 space-y-4">
            <TasteProfileCard 
              profile={tasteProfile}
              loading={tasteLoading}
              error={tasteError}
              isProUser={isProUser}
              onUpgradeClick={() => setShowProModal(true)}
            />
            <TasteInsightsSection
              profile={tasteProfile}
              loading={tasteLoading}
              isProUser={isProUser}
              onUpgradeClick={() => setShowProModal(true)}
            />
          </TabsContent>

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

      <ProUpgradeModal
        isOpen={showProModal}
        onClose={() => setShowProModal(false)}
        feature="Taste Profile"
        description="Get personalized insights from your ratings including your genre DNA, rating style, favorite actors/directors, and more."
      />

      <Navigation />
    </div>
  );
};

export default Stats;
