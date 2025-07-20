
import { Loader2, ArrowRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MovieCard } from "./MovieCard";
import { useState, useRef, useEffect } from "react";
import { tmdbService, Movie } from "@/lib/tmdb";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";

interface SwipeableMovieCarouselProps {
  title: string;
  category: "trending" | "popular" | "top_rated" | "upcoming" | "now_playing";
  cardSize?: "small" | "medium" | "large";
}

export const SwipeableMovieCarousel = ({ title, category, cardSize = "medium" }: SwipeableMovieCarouselProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  // Load movies based on category
  const loadMovies = async (fresh: boolean = false) => {
    if (fresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    
    try {
      let response;
      switch (category) {
        case "trending":
          response = await tmdbService.getTrendingMovies('week', fresh);
          break;
        case "popular":
          response = await tmdbService.getPopularMovies(1, fresh);
          break;
        case "top_rated":
          response = await tmdbService.getTopRatedMovies(1, fresh);
          break;
        case "upcoming":
          response = await tmdbService.getUpcomingMovies(1, fresh);
          break;
        case "now_playing":
          response = await tmdbService.getNowPlayingMovies(1, fresh);
          break;
        default:
          response = await tmdbService.getPopularMovies(1, fresh);
      }
      setMovies(response.results);
    } catch (error) {
      console.error(`Failed to load ${category} movies:`, error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadMovies();
  }, [category]);

  // Periodic refresh every hour to stay updated with TMDB
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      loadMovies(true);
    }, 3600000); // 1 hour in milliseconds

    return () => clearInterval(refreshInterval);
  }, [category]);

  const handleRefresh = () => {
    loadMovies(true);
  };

  const handleViewAll = () => {
    navigate(`/category/${category}`);
  };

  // Touch/Mouse event handlers for swipe functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.touches[0].pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !scrollRef.current) return;
    const x = e.touches[0].pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleEnd = () => {
    setIsDragging(false);
  };

  const getSkeletonClasses = () => {
    switch (cardSize) {
      case "small": return "w-28 h-42";
      case "medium": return "w-30 h-45"; 
      case "large": return "w-32 h-48";
      default: return "w-30 h-45";
    }
  };

  return (
    <div className="relative group">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className={`font-cinematic text-foreground tracking-wide ${
          isMobile ? 'text-xl' : 'text-2xl md:text-3xl'
        }`}>
          {title}
        </h2>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 text-cinema-gold hover:text-cinema-gold/80 hover:bg-cinema-gold/10"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {!isMobile && 'Refresh'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleViewAll}
            className="flex items-center gap-2 text-cinema-red hover:text-cinema-red/80 hover:bg-cinema-red/10"
          >
            View All
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Movie Cards Container with consistent spacing */}
      <div 
        ref={scrollRef}
        className={`flex space-x-3 overflow-x-auto scrollbar-hide pb-4 cursor-grab active:cursor-grabbing ${isDragging ? 'select-none' : ''}`}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleEnd}
      >
        {isLoading ? (
          // Loading skeleton with uniform sizing
          Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="flex-shrink-0">
              <div className={`${getSkeletonClasses()} bg-muted animate-pulse rounded-lg`}></div>
            </div>
          ))
        ) : (
          movies.map((movie) => (
            <div key={movie.id} className="flex-shrink-0">
              <MovieCard 
                movie={tmdbService.formatMovieForCard(movie)} 
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
};
