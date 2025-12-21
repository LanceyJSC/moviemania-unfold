
import { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Info, Star, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { tmdbService } from "@/lib/tmdb";
import { useTrailerContext } from "@/contexts/TrailerContext";

interface FeaturedHeroProps {
  type: 'movie' | 'tv';
}

export const FeaturedHero = ({ type }: FeaturedHeroProps) => {
  const [featuredItems, setFeaturedItems] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [trailerKeys, setTrailerKeys] = useState<(string | null)[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { setIsTrailerOpen, setTrailerKey: setGlobalTrailerKey, setMovieTitle } = useTrailerContext();
  
  const rotationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startRotation = (itemCount: number) => {
    if (rotationIntervalRef.current) {
      clearInterval(rotationIntervalRef.current);
    }
    
    if (itemCount <= 1) return;
    
    rotationIntervalRef.current = setInterval(() => {
      setCurrentIndex(prevIndex => {
        const newIndex = prevIndex >= itemCount - 1 ? 0 : prevIndex + 1;
        return newIndex;
      });
    }, 5000);
  };

  const stopRotation = () => {
    if (rotationIntervalRef.current) {
      clearInterval(rotationIntervalRef.current);
      rotationIntervalRef.current = null;
    }
  };

  const loadFeaturedContent = async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    
    try {
      let trending;
      if (type === 'movie') {
        trending = await tmdbService.getTrendingMovies();
      } else {
        trending = await tmdbService.getTrendingTVShows();
      }
      
      // Get top 5 trending items for rotation
      const topItems = trending.results.slice(0, 5).filter((item: any) => item.backdrop_path);
      setFeaturedItems(topItems);
      
      // Get trailer keys for all items
      const keys = await Promise.all(
        topItems.map(async (item: any) => {
          try {
            const details = type === 'movie' 
              ? await tmdbService.getMovieDetails(item.id)
              : await tmdbService.getTVShowDetails(item.id);
            const trailer = details.videos?.results.find(
              (video: any) => video.type === 'Trailer' && video.site === 'YouTube'
            );
            return trailer ? trailer.key : null;
          } catch {
            return null;
          }
        })
      );
      setTrailerKeys(keys);
      
      if (isRefresh) {
        setCurrentIndex(0);
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
    
    return () => stopRotation();
  }, [type]);

  useEffect(() => {
    if (featuredItems.length > 1) {
      startRotation(featuredItems.length);
    }
    
    return () => stopRotation();
  }, [featuredItems.length]);

  const goToSlide = (index: number) => {
    if (index >= 0 && index < featuredItems.length) {
      setCurrentIndex(index);
      if (featuredItems.length > 1) {
        startRotation(featuredItems.length);
      }
    }
  };

  if (isLoading || featuredItems.length === 0) {
    return (
      <div className="relative h-96 bg-gradient-to-r from-cinema-charcoal to-cinema-black rounded-xl overflow-hidden mb-8">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-muted-foreground">Loading featured {type}...</div>
        </div>
      </div>
    );
  }

  const featuredContent = featuredItems[currentIndex];
  const currentTrailerKey = trailerKeys[currentIndex];
  const backdropUrl = featuredContent.backdrop_path 
    ? `https://image.tmdb.org/t/p/w1280${featuredContent.backdrop_path}`
    : null;

  const title = type === 'movie' ? featuredContent.title : featuredContent.name;
  const releaseDate = type === 'movie' ? featuredContent.release_date : featuredContent.first_air_date;
  const rating = featuredContent.vote_average;
  const overview = featuredContent.overview;

  const handleWatchTrailer = () => {
    if (currentTrailerKey) {
      setGlobalTrailerKey(currentTrailerKey);
      setMovieTitle(title);
      setIsTrailerOpen(true);
    }
  };

  return (
    <div className="md:max-w-7xl md:mx-auto md:px-6 md:pt-6">
      <div className="relative w-full overflow-hidden group md:rounded-2xl h-[50vh]">
      {/* Background Image */}
      {backdropUrl && (
        <img 
          src={backdropUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-center"
          style={{ backgroundColor: 'hsl(var(--background))' }}
        />
      )}
      
      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
      
      {/* Bottom gradient blend */}
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none" />
      
      {/* Content - with desktop centering */}
      <div className="relative h-full flex flex-col justify-end px-4 md:px-6 pb-6 md:pb-8 max-w-7xl mx-auto w-full">
        <div className="max-w-2xl">
          {/* Badge */}
          <Badge className="mb-2 sm:mb-4 bg-cinema-red/20 text-cinema-red border-cinema-red text-xs sm:text-sm">
            Featured {type === 'movie' ? 'Movie' : 'TV Show'}
            {isRefreshing && <span className="ml-2 text-xs">Updating...</span>}
          </Badge>
          
          {/* Title */}
          <h1 className="font-cinematic text-xl sm:text-2xl md:text-3xl lg:text-4xl text-white mb-2 sm:mb-4 tracking-wide leading-tight uppercase">
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
            {currentTrailerKey ? (
              <Button 
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-12 px-4 sm:px-6 font-medium"
                disabled={isRefreshing}
                onClick={handleWatchTrailer}
              >
                <Play className="mr-2 h-4 w-4" />
                <span className="hidden xs:inline">Watch Trailer</span>
                <span className="xs:hidden">Trailer</span>
              </Button>
            ) : (
              <Button 
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-12 px-4 sm:px-6 font-medium"
                disabled={true}
              >
                <Play className="mr-2 h-4 w-4" />
                No Trailer
              </Button>
            )}
            <Link to={`/${type}/${featuredContent.id}`}>
              <Button 
                variant="outline" 
                className="border-foreground/30 text-foreground bg-background/20 backdrop-blur-sm hover:bg-background/40 rounded-xl h-12 px-4 sm:px-6"
                disabled={isRefreshing}
              >
                <Info className="mr-2 h-4 w-4" />
                More Info
              </Button>
            </Link>
          </div>
        </div>

        {/* Slide indicators - larger touch targets */}
        {featuredItems.length > 1 && (
          <div className="flex justify-center space-x-3 mt-6">
            {featuredItems.map((_: any, index: number) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`h-3 rounded-full transition-all duration-300 touch-manipulation ${
                  index === currentIndex 
                    ? 'bg-primary w-8' 
                    : 'bg-foreground/30 hover:bg-foreground/50 w-3'
                }`}
              />
            ))}
          </div>
        )}
        </div>
      </div>
    </div>
  );
};
