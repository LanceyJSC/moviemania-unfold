
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MovieCard } from "./MovieCard";
import { useState, useRef, useEffect } from "react";
import { tmdbService, Movie } from "@/lib/tmdb";

interface MovieCarouselProps {
  title: string;
  category: "trending" | "popular" | "top_rated" | "upcoming";
  cardSize?: "small" | "medium" | "large";
}

export const MovieCarousel = ({ title, category, cardSize = "medium" }: MovieCarouselProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
      const scrollAmount = cardSize === 'small' ? 176 : cardSize === 'medium' ? 208 : 240; // Based on card widths + gap
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

  // Get skeleton width based on card size
  const getSkeletonWidth = () => {
    switch (cardSize) {
      case "small": return "w-40";
      case "medium": return "w-48";
      case "large": return "w-56";
      default: return "w-48";
    }
  };

  const getSkeletonHeight = () => {
    switch (cardSize) {
      case "small": return "h-60";
      case "medium": return "h-72";
      case "large": return "h-84";
      default: return "h-72";
    }
  };

  return (
    <div className="relative group">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl md:text-3xl font-cinematic text-foreground tracking-wide">
          {title}
        </h2>
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
      </div>

      {/* Movie Cards Container */}
      <div 
        ref={scrollRef}
        className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {isLoading ? (
          // Loading skeleton with consistent sizing
          Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className={`flex-shrink-0 ${getSkeletonWidth()} ${getSkeletonHeight()} bg-muted animate-pulse rounded-lg`}></div>
          ))
        ) : (
          movies.map((movie) => (
            <MovieCard 
              key={movie.id} 
              movie={tmdbService.formatMovieForCard(movie)} 
              size={cardSize} 
            />
          ))
        )}
      </div>
    </div>
  );
};
