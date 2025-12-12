
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { tmdbService } from "@/lib/tmdb";
import { Movie } from "@/lib/tmdb";
import { MovieCard } from "@/components/MovieCard";
import { useIsMobile } from "@/hooks/use-mobile";

interface MovieGridProps {
  title: string;
  category: "all" | "popular" | "now_playing" | "upcoming" | "top_rated";
}

const fetchMovies = async (category: string, page: number) => {
  let response;
  switch (category) {
    case "all":
      response = await tmdbService.getPopularMovies(page, false);
      break;
    case "popular":
      response = await tmdbService.getPopularMovies(page, false);
      break;
    case "now_playing":
      response = await tmdbService.getNowPlayingMovies(page, false);
      break;
    case "upcoming":
      response = await tmdbService.getUpcomingMovies(page, false);
      break;
    case "top_rated":
      response = await tmdbService.getTopRatedMovies(page, false);
      break;
    default:
      response = await tmdbService.getPopularMovies(page, false);
  }
  return response;
};

export const MovieGrid = ({ title, category }: MovieGridProps) => {
  const [additionalMovies, setAdditionalMovies] = useState<Movie[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const loadingMoreRef = useRef(false);
  const isMobile = useIsMobile();

  // Use React Query for caching - staleTime prevents refetch on mount
  const { data, isLoading } = useQuery({
    queryKey: ['movies', category, 1],
    queryFn: () => fetchMovies(category, 1),
    staleTime: 5 * 60 * 1000, // 5 minutes - won't refetch if data is fresh
    gcTime: 30 * 60 * 1000, // 30 minutes cache
  });

  // Reset pagination when category changes
  useEffect(() => {
    setPage(1);
    setAdditionalMovies([]);
    setHasMore(true);
  }, [category]);

  // Update hasMore when initial data loads
  useEffect(() => {
    if (data) {
      setHasMore(1 < data.total_pages);
    }
  }, [data]);

  // Combine initial data with additional loaded pages
  const movies = [...(data?.results || []), ...additionalMovies];

  const loadMore = async () => {
    if (loadingMoreRef.current || !hasMore || isLoading) return;
    
    loadingMoreRef.current = true;
    const nextPage = page + 1;
    
    try {
      const response = await fetchMovies(category, nextPage);
      setAdditionalMovies(prev => [...prev, ...response.results]);
      setHasMore(nextPage < response.total_pages);
      setPage(nextPage);
    } catch (error) {
      console.error(`Failed to load more ${category} movies:`, error);
    } finally {
      loadingMoreRef.current = false;
    }
  };

  // Infinite scroll
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
  }, [page, hasMore]);

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
          movies.map((movie) => (
            <div key={movie.id} className="animate-fade-in">
              <MovieCard 
                movie={tmdbService.formatMovieForCard(movie)} 
                variant="grid"
              />
            </div>
          ))
        )}
      </div>

      {/* Loading more indicator */}
      {loadingMoreRef.current && movies.length > 0 && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cinema-red"></div>
        </div>
      )}
    </div>
  );
};
