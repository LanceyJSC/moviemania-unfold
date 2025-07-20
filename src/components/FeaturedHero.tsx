
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Info, Star, Calendar } from "lucide-react";
import { tmdbService } from "@/lib/tmdb";

interface FeaturedHeroProps {
  type: 'movie' | 'tv';
}

export const FeaturedHero = ({ type }: FeaturedHeroProps) => {
  const [featuredContent, setFeaturedContent] = useState<any>(null);
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
        const trending = await tmdbService.getTrendingMovies();
        setFeaturedContent(trending.results[0]);
      } else {
        const trending = await tmdbService.getTrendingTVShows();
        setFeaturedContent(trending.results[0]);
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
      <div className="relative bg-gradient-to-r from-cinema-charcoal to-cinema-black rounded-xl overflow-hidden mb-8" style={{ aspectRatio: '16/9' }}>
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

  return (
    <div className="relative rounded-2xl overflow-hidden mb-8 group" style={{ aspectRatio: '16/9' }}>
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
      <div className="relative h-full flex items-center">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl">
            {/* Badge */}
            <Badge className="mb-4 bg-cinema-red/20 text-cinema-red border-cinema-red">
              Featured {type === 'movie' ? 'Movie' : 'TV Show'}
              {isRefreshing && <span className="ml-2 text-xs">Updating...</span>}
            </Badge>
            
            {/* Title */}
            <h1 className="font-cinematic text-3xl md:text-4xl lg:text-5xl text-white mb-4 tracking-wide">
              {title}
            </h1>
            
            {/* Meta Info */}
            <div className="flex items-center space-x-4 mb-4">
              {releaseDate && (
                <div className="flex items-center space-x-1 text-white/80">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(releaseDate).getFullYear()}</span>
                </div>
              )}
              <div className="flex items-center space-x-1 text-white/80">
                <Star className="h-4 w-4 fill-cinema-gold text-cinema-gold" />
                <span>{rating?.toFixed(1)}/10</span>
              </div>
            </div>
            
            {/* Overview */}
            <p className="text-white/90 text-base md:text-lg mb-6 line-clamp-3">
              {overview}
            </p>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
              <Button 
                size="lg" 
                className="bg-cinema-red text-white hover:bg-cinema-red/90 w-full sm:w-auto"
                disabled={isRefreshing}
              >
                <Play className="h-5 w-5 mr-2" />
                Watch Trailer
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="border-white/30 text-white hover:bg-white/10 w-full sm:w-auto"
                disabled={isRefreshing}
              >
                <Info className="h-5 w-5 mr-2" />
                More Info
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
