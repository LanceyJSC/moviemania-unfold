
import { useState, useEffect } from "react";
import { Film, TrendingUp, Star, Calendar, AlertCircle } from "lucide-react";
import { tmdbService } from "@/lib/tmdb";

export const MovieStats = ({ hideTitle = false }: { hideTitle?: boolean }) => {
  const [stats, setStats] = useState({
    totalMovies: 0,
    trendingCount: 0,
    topRatedCount: 0,
    upcomingCount: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = async (fresh: boolean = false) => {
    console.log('Loading movie stats, fresh:', fresh);
    setError(null);
    
    try {
      const [trending, topRated, upcoming] = await Promise.all([
        tmdbService.getTrendingMovies('week', fresh).catch(err => {
          console.warn('Failed to load trending movies:', err);
          return { results: [], total_results: 0 };
        }),
        tmdbService.getTopRatedMovies(1, fresh).catch(err => {
          console.warn('Failed to load top rated movies:', err);
          return { results: [], total_results: 0 };
        }),
        tmdbService.getUpcomingMovies(1, fresh).catch(err => {
          console.warn('Failed to load upcoming movies:', err);
          return { results: [], total_results: 0 };
        })
      ]);
      
      setStats({
        totalMovies: trending.total_results > 1000000 ? Math.floor(trending.total_results / 1000) * 1000 : trending.total_results,
        trendingCount: trending.results.length,
        topRatedCount: topRated.results.length,
        upcomingCount: upcoming.results.length
      });
      
      console.log('Movie stats loaded successfully');
    } catch (error) {
      console.error('Failed to load stats:', error);
      setError('Unable to load movie statistics');
      // Fallback to reasonable estimates
      setStats({
        totalMovies: 500000,
        trendingCount: 20,
        topRatedCount: 20,
        upcomingCount: 20
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  // Periodic refresh every hour to stay updated with TMDB
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      console.log('Auto-refreshing movie stats...');
      loadStats(true);
    }, 3600000); // 1 hour in milliseconds

    return () => clearInterval(refreshInterval);
  }, []);

  const statItems = [
    { icon: Film, label: "Movies Available", value: stats.totalMovies > 999 ? `${Math.floor(stats.totalMovies / 1000)}K+` : stats.totalMovies.toLocaleString() },
    { icon: TrendingUp, label: "Trending Now", value: stats.trendingCount },
    { icon: Star, label: "Top Rated", value: stats.topRatedCount },
    { icon: Calendar, label: "Coming Soon", value: stats.upcomingCount }
  ];

  if (error && !isLoading) {
    return (
      <div className="bg-background rounded-2xl p-8 mb-12 text-center">
        <AlertCircle className="h-8 w-8 text-cinema-red mx-auto mb-4" />
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-background rounded-2xl py-6 px-4 mb-12">
      {!hideTitle && (
        <div className="text-center mb-4">
          <h2 className="font-cinematic text-2xl text-foreground tracking-wide mb-2">
            DISCOVER THE NUMBERS
          </h2>
          <div className="w-12 h-0.5 bg-cinema-gold mx-auto"></div>
        </div>
      )}
      
      <div className="flex justify-between items-center gap-2">
        {statItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <div key={index} className="flex flex-col items-center flex-1">
              <div className="bg-cinema-red/20 rounded-full w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center mb-2">
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cinema-red"></div>
                ) : (
                  <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-cinema-red" />
                )}
              </div>
              <div className="text-lg sm:text-xl font-bold text-foreground">
                {isLoading ? '-' : item.value}
              </div>
              <div className="text-xs text-muted-foreground text-center">
                {item.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
