
import { useState, useEffect, useCallback, useRef } from "react";
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
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const isMobile = useIsMobile();
  
  // Refs for Intersection Observer and loading lock
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<() => void>();
  const isLoadingRef = useRef(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Use React Query for caching - 24 hour cache for TMDB data
  const { data, isLoading } = useQuery({
    queryKey: ['movies', category, 1],
    queryFn: () => fetchMovies(category, 1),
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Reset pagination when category changes
  useEffect(() => {
    setPage(1);
    setAdditionalMovies([]);
    setHasMore(true);
    isLoadingRef.current = false;
  }, [category]);

  // Update hasMore when initial data loads
  useEffect(() => {
    if (data) {
      setHasMore(1 < data.total_pages);
    }
  }, [data]);

  // Combine initial data with additional loaded pages, deduplicate by ID
  const allMovies = [...(data?.results || []), ...additionalMovies];
  const movies = allMovies.filter((movie, index, self) => 
    index === self.findIndex(m => m.id === movie.id)
  );

  const loadMore = useCallback(async () => {
    // Use ref-based lock to prevent race conditions
    if (isLoadingRef.current || !hasMore || isLoading) return;
    
    isLoadingRef.current = true;
    setIsLoadingMore(true);
    const nextPage = page + 1;
    
    try {
      const response = await fetchMovies(category, nextPage);
      setAdditionalMovies(prev => [...prev, ...response.results]);
      setHasMore(nextPage < response.total_pages);
      setPage(nextPage);
    } catch (error) {
      console.error(`Failed to load more ${category} movies:`, error);
    } finally {
      setIsLoadingMore(false);
      // Add small delay before allowing next load
      setTimeout(() => {
        isLoadingRef.current = false;
      }, 300);
    }
  }, [category, page, hasMore, isLoading]);

  // Keep ref updated with latest loadMore
  useEffect(() => {
    loadMoreRef.current = loadMore;
  }, [loadMore]);

  // Intersection Observer with debouncing
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && loadMoreRef.current) {
          // Debounce the load call
          if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
          }
          debounceTimerRef.current = setTimeout(() => {
            loadMoreRef.current?.();
          }, 100);
        }
      },
      { rootMargin: '200px', threshold: 0 }
    );

    observer.observe(sentinel);
    return () => {
      observer.disconnect();
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

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
          Array.from({ length: 15 }).map((_, index) => (
            <div key={index}>
              <div className="bg-muted animate-pulse rounded-lg aspect-[2/3] w-full"></div>
            </div>
          ))
        ) : (
          movies.map((movie, index) => (
            <div key={`${movie.id}-${index}`}>
              <MovieCard 
                movie={tmdbService.formatMovieForCard(movie)} 
                variant="grid"
              />
            </div>
          ))
        )}
      </div>

      {/* Sentinel element for Intersection Observer */}
      <div ref={sentinelRef} className="h-1" />

      {/* Loading more indicator */}
      {isLoadingMore && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cinema-red"></div>
        </div>
      )}
    </div>
  );
};
