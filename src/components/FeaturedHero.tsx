
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Info, Star, Calendar, TrendingUp, Users, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { tmdbService } from "@/lib/tmdb";
import { useTrailerContext } from "@/contexts/TrailerContext";

interface FeaturedHeroProps {
  type: 'movie' | 'tv';
}

export const FeaturedHero = ({ type }: FeaturedHeroProps) => {
  const [featuredContent, setFeaturedContent] = useState<any>(null);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    trending: 0,
    topRated: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { setIsTrailerOpen, setTrailerKey: setGlobalTrailerKey, setMovieTitle } = useTrailerContext();

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
        
        const featuredItem = trending.results[0];
        setFeaturedContent(featuredItem);
        
        // Get movie details with trailer
        if (featuredItem) {
          const details = await tmdbService.getMovieDetails(featuredItem.id);
          const trailer = details.videos?.results.find(
            video => video.type === 'Trailer' && video.site === 'YouTube'
          );
          setTrailerKey(trailer ? trailer.key : null);
        }
        
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
        
        const featuredItem = trending.results[0];
        setFeaturedContent(featuredItem);
        
        // Get TV show details with trailer
        if (featuredItem) {
          const details = await tmdbService.getTVShowDetails(featuredItem.id);
          const trailer = details.videos?.results.find(
            video => video.type === 'Trailer' && video.site === 'YouTube'
          );
          setTrailerKey(trailer ? trailer.key : null);
        }
        
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
      <div className="relative h-96 bg-gradient-to-r from-cinema-charcoal to-cinema-black rounded-xl overflow-hidden mb-8">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-muted-foreground">Loading featured {type}...</div>
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

  const handleWatchTrailer = () => {
    if (trailerKey) {
      setGlobalTrailerKey(trailerKey);
      setMovieTitle(title);
      setIsTrailerOpen(true);
    }
  };

  return (
    <div className="relative w-full overflow-hidden mb-8 group" style={{ 
      height: 'clamp(350px, 45vh, 500px)',
      minHeight: '350px',
      maxHeight: '500px'  
    }}>
      {/* Background Image */}
      {backdropUrl && (
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
          style={{ 
            backgroundImage: `url(${backdropUrl})`,
            backgroundColor: 'hsl(var(--background))'
          }}
        />
      )}
      
      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
      
      {/* Bottom gradient blend - Creates smooth transition to page background */}
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none" />
      
      {/* Content */}
      <div className="relative h-full flex flex-col justify-end px-4 sm:px-6 pb-6 sm:pb-8">
        <div className="max-w-2xl">
          {/* Badge */}
          <Badge className="mb-2 sm:mb-4 bg-cinema-red/20 text-cinema-red border-cinema-red text-xs sm:text-sm">
            Featured {type === 'movie' ? 'Movie' : 'TV Show'}
            {isRefreshing && <span className="ml-2 text-xs">Updating...</span>}
          </Badge>
          
          {/* Title */}
          <h1 className="font-cinematic text-xl sm:text-2xl md:text-3xl lg:text-4xl text-white mb-2 sm:mb-4 tracking-wide leading-tight">
            {title}
          </h1>
          
          {/* Meta Info */}
          <div className="flex items-center space-x-3 sm:space-x-4 mb-3 sm:mb-4">
            {releaseDate && (
              <div className="flex items-center space-x-1 text-white/80">
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">{new Date(releaseDate).getFullYear()}</span>
              </div>
            )}
            <div className="flex items-center space-x-1 text-white/80">
              <Star className="h-3 w-3 sm:h-4 sm:w-4 fill-cinema-gold text-cinema-gold" />
              <span className="text-xs sm:text-sm">{rating?.toFixed(1)}/10</span>
            </div>
          </div>
          
          {/* Overview */}
          <p className="text-white/90 text-sm sm:text-base leading-relaxed mb-4 line-clamp-2 sm:line-clamp-3">
            {overview}
          </p>
          
          {/* Action Buttons */}
          <div className="flex gap-3">
            {trailerKey ? (
              <Button 
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-12 px-6 font-medium"
                disabled={isRefreshing}
                onClick={handleWatchTrailer}
              >
                <Play className="mr-2 h-4 w-4" />
                Watch Trailer
              </Button>
            ) : (
              <Button 
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-12 px-6 font-medium"
                disabled={true}
              >
                <Play className="mr-2 h-4 w-4" />
                No Trailer
              </Button>
            )}
            <Button 
              variant="outline" 
              className="border-foreground/30 text-foreground bg-background/20 backdrop-blur-sm hover:bg-background/40 rounded-xl h-12 px-4"
              disabled={isRefreshing}
            >
              <Info className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">More Info</span>
              <span className="sm:hidden">Info</span>
            </Button>
          </div>
          
          {/* Discover Button */}
          <div className="mt-3">
            <Link to={`/discover/${type === 'movie' ? 'movies' : 'tv-shows'}`}>
              <Button 
                variant="outline" 
                className="border-primary/30 text-primary bg-primary/10 backdrop-blur-sm hover:bg-primary/20 rounded-xl h-12 px-6 font-medium w-full"
                disabled={isRefreshing}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Discover More {type === 'movie' ? 'Movies' : 'TV Shows'}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
