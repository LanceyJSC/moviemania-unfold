
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Info, Star, Calendar, TrendingUp, Users } from "lucide-react";
import { tmdbService } from "@/lib/tmdb";

interface FeaturedHeroProps {
  type: 'movie' | 'tv';
}

export const FeaturedHero = ({ type }: FeaturedHeroProps) => {
  const [featuredContent, setFeaturedContent] = useState<any>(null);
  const [stats, setStats] = useState({
    total: 0,
    trending: 0,
    topRated: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadFeaturedContent = async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    
    try {
      if (type === 'movie') {
        const [trending, topRated, popular] = await Promise.all([
          tmdbService.getTrendingMovies(),
          tmdbService.getTopRatedMovies(),
          tmdbService.getPopularMovies()
        ]);
        
        setFeaturedContent(trending.results[0]);
        setStats({
          total: popular.total_results || 0,
          trending: trending.total_results || 0,
          topRated: topRated.total_results || 0
        });
      } else {
        const [trending, topRated, popular] = await Promise.all([
          tmdbService.getTrendingTVShows(),
          tmdbService.getTopRatedTVShows(),
          tmdbService.getPopularTVShows()
        ]);
        
        setFeaturedContent(trending.results[0]);
        setStats({
          total: popular.total_results || 0,
          trending: trending.total_results || 0,
          topRated: topRated.total_results || 0
        });
      }
    } catch (error) {
      console.error(`Failed to load featured ${type} content:`, error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadFeaturedContent();

    // Set up periodic refresh every hour (3,600,000 milliseconds)
    const refreshInterval = setInterval(() => {
      loadFeaturedContent(true);
    }, 3600000);

    // Clean up interval on component unmount
    return () => clearInterval(refreshInterval);
  }, [type]);

  if (isLoading || !featuredContent) {
    return (
      <div className="relative backdrop-16-9 bg-gradient-to-r from-cinema-charcoal to-cinema-black rounded-xl overflow-hidden mb-8">
        <div className="absolute inset-0 flex items-center justify-center backdrop-blur-sm bg-black/20">
          <div className="text-white/80 text-lg">Loading featured {type}...</div>
        </div>
      </div>
    );
  }

  const backdropUrl = featuredContent.backdrop_path 
    ? `https://image.tmdb.org/t/p/w1280${featuredContent.backdrop_path}`
    : null;

  const title = type === 'movie' ? featuredContent.title : featuredContent.name;
  const releaseDate = type === 'movie' ? featuredContent.release_date : featuredContent.first_air_date;
  const rating = featuredContent.vote_average;
  const overview = featuredContent.overview;

  return (
    <div className="relative backdrop-16-9 rounded-xl overflow-hidden mb-8 group">
      {/* Background Image */}
      {backdropUrl && (
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
          style={{ backgroundImage: `url(${backdropUrl})` }}
        />
      )}
      
      {/* Enhanced Gradient Overlays for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-black/70" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/90" />
      
      {/* Stats Cards - Repositioned to avoid overlap */}
      <div className="absolute top-4 left-4 right-4 z-20">
        <div className="flex flex-wrap gap-2 justify-end">
          <Card className="bg-black/60 backdrop-blur-md border-white/20 p-2">
            <div className="flex items-center space-x-1 text-white">
              <TrendingUp className="h-3 w-3 text-cinema-red" />
              <div className="text-xs">
                <div className="font-semibold">{stats.trending.toLocaleString()}</div>
                <div className="text-white/70 text-xs">Trending</div>
              </div>
            </div>
          </Card>
          
          <Card className="bg-black/60 backdrop-blur-md border-white/20 p-2">
            <div className="flex items-center space-x-1 text-white">
              <Star className="h-3 w-3 text-cinema-gold" />
              <div className="text-xs">
                <div className="font-semibold">{stats.topRated.toLocaleString()}</div>
                <div className="text-white/70 text-xs">Top Rated</div>
              </div>
            </div>
          </Card>
          
          <Card className="bg-black/60 backdrop-blur-md border-white/20 p-2">
            <div className="flex items-center space-x-1 text-white">
              <Users className="h-3 w-3 text-cinema-gold" />
              <div className="text-xs">
                <div className="font-semibold">{stats.total.toLocaleString()}</div>
                <div className="text-white/70 text-xs">Total</div>
              </div>
            </div>
          </Card>
        </div>
      </div>
      
      {/* Content - Repositioned with better spacing */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-4 sm:p-6">
        <div className="backdrop-blur-sm bg-black/40 rounded-xl p-4 sm:p-6 space-y-4">
          {/* Badge */}
          <Badge className="bg-cinema-red/80 text-white border-cinema-red backdrop-blur-sm">
            Featured {type === 'movie' ? 'Movie' : 'TV Show'}
            {isRefreshing && <span className="ml-2 text-xs">Updating...</span>}
          </Badge>
          
          {/* Title */}
          <h1 className="font-cinematic text-2xl sm:text-3xl lg:text-4xl text-white tracking-wide text-shadow-lg">
            {title}
          </h1>
          
          {/* Meta Info */}
          <div className="flex items-center space-x-4 text-sm sm:text-base">
            {releaseDate && (
              <div className="flex items-center space-x-1 text-white/90">
                <Calendar className="h-4 w-4" />
                <span>{new Date(releaseDate).getFullYear()}</span>
              </div>
            )}
            <div className="flex items-center space-x-1 text-white/90">
              <Star className="h-4 w-4 fill-cinema-gold text-cinema-gold" />
              <span>{rating?.toFixed(1)}/10</span>
            </div>
          </div>
          
          {/* Overview */}
          <p className="text-white/95 text-sm sm:text-base line-clamp-2 sm:line-clamp-3 text-shadow-sm leading-relaxed">
            {overview}
          </p>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 pt-2">
            <Button 
              size="lg" 
              className="bg-cinema-red text-white hover:bg-cinema-red/90 w-full sm:w-auto h-12 px-6 rounded-xl"
              disabled={isRefreshing}
            >
              <Play className="h-4 w-4 mr-2" />
              Watch Trailer
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="border-white/50 text-white hover:bg-white/10 backdrop-blur-sm w-full sm:w-auto h-12 px-6 rounded-xl"
              disabled={isRefreshing}
            >
              <Info className="h-4 w-4 mr-2" />
              More Info
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
