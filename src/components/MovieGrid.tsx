import { useState, useEffect } from "react";
import { tmdbService } from "@/lib/tmdb";
import { Movie } from "@/lib/tmdb";
import { MovieCard } from "@/components/MovieCard";
import { useIsMobile } from "@/hooks/use-mobile";

interface MovieGridProps {
  title: string;
  category: "all" | "popular" | "now_playing" | "upcoming" | "top_rated";
}

export const MovieGrid = ({ title, category }: MovieGridProps) => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const isMobile = useIsMobile();

  const loadMovies = async (pageNum: number = 1, fresh: boolean = false) => {
    try {
      if (pageNum === 1) {
        setIsLoading(true);
      }

      let response;
      switch (category) {
        case "all":
          response = await tmdbService.getPopularMovies(pageNum, fresh);
          break;
        case "popular":
          response = await tmdbService.getPopularMovies(pageNum, fresh);
          break;
        case "now_playing":
          response = await tmdbService.getNowPlayingMovies(pageNum, fresh);
          break;
        case "upcoming":
          response = await tmdbService.getUpcomingMovies(pageNum, fresh);
          break;
        case "top_rated":
          response = await tmdbService.getTopRatedMovies(pageNum, fresh);
          break;
        default:
          response = await tmdbService.getPopularMovies(pageNum, fresh);
      }

      if (pageNum === 1) {
        setMovies(response.results);
      } else {
        setMovies(prev => [...prev, ...response.results]);
      }
      
      setHasMore(pageNum < response.total_pages);
    } catch (error) {
      console.error(`Failed to load ${category} movies:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMore = () => {
    if (!isLoading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadMovies(nextPage);
    }
  };

  useEffect(() => {
    setPage(1);
    loadMovies(1);
  }, [category]);

  // Periodic refresh every hour to stay updated with TMDB
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      setPage(1);
      loadMovies(1, true);
    }, 3600000); // 1 hour in milliseconds

    return () => clearInterval(refreshInterval);
  }, [category]);

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop
        >= document.documentElement.offsetHeight - 1000
      ) {
        loadMore();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [page, hasMore, isLoading]);

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h2 className={`font-cinematic text-foreground tracking-wide ${
          isMobile ? 'text-xl' : 'text-2xl md:text-3xl'
        }`}>
          {title}
        </h2>
      </div>

      {/* Movies Grid */}
      <div className="poster-grid-standard">
        {isLoading && movies.length === 0 ? (
          // Loading skeleton
          Array.from({ length: 15 }).map((_, index) => (
            <div key={index} className="animate-fade-in">
              <div className="poster-card bg-muted animate-pulse"></div>
            </div>
          ))
        ) : (
          movies.map((movie, index) => (
            <div key={movie.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
              <MovieCard 
                movie={tmdbService.formatMovieForCard(movie)} 
                size={isMobile ? "small" : "medium"} 
              />
            </div>
          ))
        )}
      </div>

      {/* Loading more indicator */}
      {isLoading && movies.length > 0 && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cinema-red"></div>
        </div>
      )}
    </div>
  );
};