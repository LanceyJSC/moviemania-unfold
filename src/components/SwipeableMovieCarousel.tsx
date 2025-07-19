
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MovieCard } from "./MovieCard";
import { useState, useRef, useEffect } from "react";
import { tmdbService, Movie } from "@/lib/tmdb";
import { useIsMobile } from "@/hooks/use-mobile";

interface SwipeableMovieCarouselProps {
  title: string;
  category: "trending" | "popular" | "top_rated" | "upcoming";
  cardSize?: "small" | "medium" | "large";
}

export const SwipeableMovieCarousel = ({ title, category, cardSize = "medium" }: SwipeableMovieCarouselProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const isMobile = useIsMobile();

  // Load movies based on category
  useEffect(() => {
    const loadMovies = async () => {
      setIsLoading(true);
      try {
        let response;
        switch (category) {
          case "trending":
            response = await tmdbService.getTrendingMovies();
            break;
          case "popular":
            response = await tmdbService.getPopularMovies();
            break;
          case "top_rated":
            response = await tmdbService.getTopRatedMovies();
            break;
          case "upcoming":
            response = await tmdbService.getUpcomingMovies();
            break;
          default:
            response = await tmdbService.getPopularMovies();
        }
        setMovies(response.results);
      } catch (error) {
        console.error(`Failed to load ${category} movies:`, error);
      } finally {
        setIsLoading(false);
      }
    };
    loadMovies();
  }, [category]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = cardSize === 'small' ? 280 : cardSize === 'medium' ? 400 : 520;
      const newScrollLeft = scrollRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
      
      scrollRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
      
      // Update button states
      setTimeout(() => {
        if (scrollRef.current) {
          setCanScrollLeft(scrollRef.current.scrollLeft > 0);
          setCanScrollRight(
            scrollRef.current.scrollLeft < 
            scrollRef.current.scrollWidth - scrollRef.current.clientWidth - 10
          );
        }
      }, 300);
    }
  };

  // Touch/Mouse event handlers for swipe functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isMobile || !scrollRef.current) return;
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
    if (scrollRef.current) {
      setCanScrollLeft(scrollRef.current.scrollLeft > 0);
      setCanScrollRight(
        scrollRef.current.scrollLeft < 
        scrollRef.current.scrollWidth - scrollRef.current.clientWidth - 10
      );
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
        {!isMobile && (
          <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className="h-10 w-10 p-0 bg-cinema-charcoal/60 backdrop-blur-sm hover:bg-cinema-red disabled:opacity-30"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              className="h-10 w-10 p-0 bg-cinema-charcoal/60 backdrop-blur-sm hover:bg-cinema-red disabled:opacity-30"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        )}
      </div>

      {/* Movie Cards Container */}
      <div 
        ref={scrollRef}
        className={`flex space-x-4 overflow-x-auto scrollbar-hide pb-4 ${
          isMobile ? 'cursor-grab active:cursor-grabbing' : ''
        } ${isDragging ? 'select-none' : ''}`}
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
          // Loading skeleton
          Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="flex-shrink-0">
              <div className={`bg-muted animate-pulse rounded-lg ${
                isMobile ? 'w-40 h-60' : 'w-48 h-72'
              }`}></div>
            </div>
          ))
        ) : (
          movies.map((movie) => (
            <div key={movie.id} className="flex-shrink-0">
              <MovieCard 
                movie={tmdbService.formatMovieForCard(movie)} 
                size={isMobile ? "small" : cardSize} 
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
};
