
import { useState, useEffect } from "react";
import { Film, TrendingUp, Star, Calendar } from "lucide-react";
import { tmdbService } from "@/lib/tmdb";

export const MovieStats = () => {
  const [stats, setStats] = useState({
    totalMovies: 0,
    trendingCount: 0,
    topRatedCount: 0,
    upcomingCount: 0
  });

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [trending, topRated, upcoming] = await Promise.all([
          tmdbService.getTrendingMovies(),
          tmdbService.getTopRatedMovies(),
          tmdbService.getUpcomingMovies()
        ]);
        
        setStats({
          totalMovies: trending.total_results > 1000000 ? Math.floor(trending.total_results / 1000) * 1000 : trending.total_results,
          trendingCount: trending.results.length,
          topRatedCount: topRated.results.length,
          upcomingCount: upcoming.results.length
        });
      } catch (error) {
        console.error('Failed to load stats:', error);
        // Fallback to reasonable estimates
        setStats({
          totalMovies: 500000,
          trendingCount: 20,
          topRatedCount: 20,
          upcomingCount: 20
        });
      }
    };
    loadStats();
  }, []);

  const statItems = [
    { icon: Film, label: "Movies Available", value: stats.totalMovies > 999 ? `${Math.floor(stats.totalMovies / 1000)}K+` : stats.totalMovies.toLocaleString() },
    { icon: TrendingUp, label: "Trending Now", value: stats.trendingCount },
    { icon: Star, label: "Top Rated", value: stats.topRatedCount },
    { icon: Calendar, label: "Coming Soon", value: stats.upcomingCount }
  ];

  return (
    <div className="bg-gradient-to-r from-cinema-charcoal to-cinema-black rounded-2xl p-8 mb-12">
      <div className="text-center mb-8">
        <h2 className="font-cinematic text-3xl text-foreground tracking-wide mb-4">
          DISCOVER THE NUMBERS
        </h2>
        <div className="w-16 h-0.5 bg-cinema-gold mx-auto"></div>
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {statItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <div key={index} className="text-center">
              <div className="bg-cinema-red/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Icon className="h-8 w-8 text-cinema-red" />
              </div>
              <div className="text-2xl font-bold text-foreground mb-2">
                {item.value}
              </div>
              <div className="text-sm text-muted-foreground">
                {item.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
