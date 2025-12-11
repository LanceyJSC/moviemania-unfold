
import { useState, useEffect } from "react";
import { tmdbService } from "@/lib/tmdb";
import { Movie } from "@/lib/tmdb";
import { MovieCard } from "@/components/MovieCard";
import { useIsMobile } from "@/hooks/use-mobile";

interface MovieGridProps {
  title: string;
  category: "all" | "popular" | "now_playing" | "upcoming" | "top_rated";
}

// Content priority refresh intervals
const REFRESH_INTERVALS = {
  HIGH_PRIORITY: 20 * 60 * 1000,    // 20 minutes for trending/popular/now_playing
  MEDIUM_PRIORITY: 45 * 60 * 1000,  // 45 minutes for upcoming
  LOW_PRIORITY: 60 * 60 * 1000      // 60 minutes for top_rated
};

const getRefreshInterval = (category: string) => {
  switch (category) {
    case "popular":
    case "now_playing":
      return REFRESH_INTERVALS.HIGH_PRIORITY;
    case "upcoming":
      return REFRESH_INTERVALS.MEDIUM_PRIORITY;
    case "top_rated":
    case "all":
    default:
      return REFRESH_INTERVALS.LOW_PRIORITY;
  }
};

export const MovieGrid = ({ title, category }: MovieGridProps) => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const isMobile = useIsMobile();

  const loadMovies = async (pageNum: number = 1, forceFresh: boolean = true) => {
    try {
      if (pageNum === 1) {
        setIsLoading(true);
        console.log(`Loading fresh ${category} movies - Page ${pageNum}`);
      }

      let response;
      switch (category) {
        case "all":
          response = await tmdbService.getPopularMovies(pageNum, forceFresh);
          break;
        case "popular":
          response = await tmdbService.getPopularMovies(pageNum, forceFresh);
          break;
        case "now_playing":
          response = await tmdbService.getNowPlayingMovies(pageNum, forceFresh);
          break;
        case "upcoming":
          response = await tmdbService.getUpcomingMovies(pageNum, forceFresh);
          break;
        case "top_rated":
          response = await tmdbService.getTopRatedMovies(pageNum, forceFresh);
          break;
        default:
          response = await tmdbService.getPopularMovies(pageNum, forceFresh);
      }

      if (pageNum === 1) {
        setMovies(response.results);
        setLastUpdated(new Date());
      } else {
        setMovies(prev => [...prev, ...response.results]);
      }
      
      setHasMore(pageNum < response.total_pages);
      console.log(`${category} movies loaded successfully - ${response.results.length} items`);
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
      loadMovies(nextPage, true);
    }
  };

  useEffect(() => {
    setPage(1);
    loadMovies(1, true);
  }, [category]);

  // Enhanced refresh strategy with different intervals based on content priority
  useEffect(() => {
    const refreshInterval = getRefreshInterval(category);
    console.log(`Setting up refresh for ${category} every ${refreshInterval / 60000} minutes`);
    
    const interval = setInterval(() => {
      console.log(`Auto-refreshing ${category} movies - Priority refresh`);
      setPage(1);
      loadMovies(1, true);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [category]);

  // Refresh when app regains focus (visibility change)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log(`App regained focus - Refreshing ${category} movies`);
        setPage(1);
        loadMovies(1, true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
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
      <div>
        <h2 className={`font-cinematic text-foreground tracking-wide ${
          isMobile ? 'text-xl' : 'text-2xl md:text-3xl'
        }`}>
          {title}
        </h2>
      </div>

      {/* Movies Grid - Optimized for iPhone 3-across */}
      <div className="grid grid-cols-3 gap-2 md:grid-cols-6 lg:grid-cols-8">
        {isLoading && movies.length === 0 ? (
          // Loading skeleton
          Array.from({ length: 15 }).map((_, index) => (
            <div key={index} className="animate-fade-in">
              <div className="bg-muted animate-pulse rounded-lg aspect-[2/3] w-full"></div>
            </div>
          ))
        ) : (
          movies.map((movie, index) => (
            <div key={movie.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
              <MovieCard 
                movie={tmdbService.formatMovieForCard(movie)} 
                variant="grid"
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
