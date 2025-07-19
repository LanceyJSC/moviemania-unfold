
import { useState, useEffect, useRef } from "react";
import { Sparkles, Clock } from "lucide-react";
import { MovieCard } from "@/components/MovieCard";
import { tmdbService, Movie } from "@/lib/tmdb";
import { useIsMobile } from "@/hooks/use-mobile";

export const FreshPicks = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const isMobile = useIsMobile();

  useEffect(() => {
    const loadFreshPicks = async () => {
      try {
        const response = await tmdbService.getTrendingMovies('week');
        const moviesWithPosters = response.results
          .filter(movie => movie.poster_path)
          .slice(0, 8);
        setMovies(moviesWithPosters);
      } catch (error) {
        console.error('Failed to load fresh picks:', error);
        try {
          const fallbackResponse = await tmdbService.getPopularMovies();
          const moviesWithPosters = fallbackResponse.results
            .filter(movie => movie.poster_path)
            .slice(0, 8);
          setMovies(moviesWithPosters);
        } catch (fallbackError) {
          console.error('Fallback also failed:', fallbackError);
        }
      } finally {
        setIsLoading(false);
      }
    };
    loadFreshPicks();
  }, []);

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

  if (isLoading) {
    return (
      <div className="mb-12">
        <div className="bg-gradient-to-r from-cinema-charcoal to-cinema-black rounded-2xl p-8">
          <div className="text-center mb-8">
            <h2 className="font-cinematic text-3xl text-foreground tracking-wide mb-4">
              FRESH PICKS
            </h2>
            <div className="w-16 h-0.5 bg-cinema-red mx-auto"></div>
          </div>
          <div className="flex space-x-4 overflow-hidden">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="flex-shrink-0 w-40 aspect-[2/3] bg-muted animate-pulse rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-12">
      <div className="bg-gradient-to-r from-cinema-charcoal to-cinema-black rounded-2xl p-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="h-8 w-8 text-cinema-red" />
            <h2 className="font-cinematic text-3xl text-foreground tracking-wide">
              FRESH PICKS
            </h2>
            <Clock className="h-8 w-8 text-cinema-red" />
          </div>
          <p className="text-muted-foreground mb-4">
            Trending this week - Updated weekly
          </p>
          <div className="w-16 h-0.5 bg-cinema-red mx-auto"></div>
        </div>
        
        {movies.length > 0 ? (
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
            {movies.map((movie) => (
              <div key={`fresh-${movie.id}`} className="flex-shrink-0 w-40">
                <MovieCard 
                  movie={tmdbService.formatMovieForCard(movie)} 
                  size="small" 
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground">
            No fresh picks available this week
          </div>
        )}
      </div>
    </div>
  );
};
