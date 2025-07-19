import { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { tmdbService } from "@/lib/tmdb";
import { Movie } from "@/lib/tmdb";
import { MovieCard } from "@/components/MovieCard";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

interface MovieGridProps {
  title: string;
  category: "all" | "popular" | "now_playing" | "upcoming" | "top_rated";
}

export const MovieGrid = ({ title, category }: MovieGridProps) => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
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
      setIsRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setPage(1);
    await loadMovies(1, true);
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
      </div>

      {/* Movies Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
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