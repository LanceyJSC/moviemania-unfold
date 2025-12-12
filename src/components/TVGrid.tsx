import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { tmdbService } from "@/lib/tmdb";
import { TVShow } from "@/lib/tmdb";
import { TVShowCard } from "@/components/TVShowCard";
import { useIsMobile } from "@/hooks/use-mobile";

interface TVGridProps {
  title: string;
  category: "all" | "popular" | "airing_today" | "on_the_air" | "top_rated";
}

const fetchTVShows = async (category: string, page: number) => {
  let response;
  switch (category) {
    case "all":
      response = await tmdbService.getPopularTVShows(page, false);
      break;
    case "popular":
      response = await tmdbService.getPopularTVShows(page, false);
      break;
    case "airing_today":
      response = await tmdbService.getAiringTodayTVShows(page, false);
      break;
    case "on_the_air":
      response = await tmdbService.getOnTheAirTVShows(page, false);
      break;
    case "top_rated":
      response = await tmdbService.getTopRatedTVShows(page, false);
      break;
    default:
      response = await tmdbService.getPopularTVShows(page, false);
  }
  return response;
};

export const TVGrid = ({ title, category }: TVGridProps) => {
  const [additionalShows, setAdditionalShows] = useState<TVShow[]>([]);
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
    queryKey: ['tvshows', category, 1],
    queryFn: () => fetchTVShows(category, 1),
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Reset pagination when category changes
  useEffect(() => {
    setPage(1);
    setAdditionalShows([]);
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
  const allShows = [...(data?.results || []), ...additionalShows];
  const tvShows = allShows.filter((show, index, self) => 
    index === self.findIndex(s => s.id === show.id)
  );

  const loadMore = useCallback(async () => {
    // Use ref-based lock to prevent race conditions
    if (isLoadingRef.current || !hasMore || isLoading) return;
    
    isLoadingRef.current = true;
    setIsLoadingMore(true);
    const nextPage = page + 1;
    
    try {
      const response = await fetchTVShows(category, nextPage);
      setAdditionalShows(prev => [...prev, ...response.results]);
      setHasMore(nextPage < response.total_pages);
      setPage(nextPage);
    } catch (error) {
      console.error(`Failed to load more ${category} TV shows:`, error);
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
    if (!sentinel || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          // Debounce the load call
          if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
          }
          debounceTimerRef.current = setTimeout(() => {
            loadMoreRef.current?.();
          }, 100);
        }
      },
      { rootMargin: '400px', threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => {
      observer.disconnect();
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [isLoading]);

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

      {/* TV Shows Grid - Optimized for iPhone 3-across */}
      <div className="grid grid-cols-3 gap-2 md:grid-cols-6 lg:grid-cols-8">
        {isLoading && tvShows.length === 0 ? (
          Array.from({ length: 15 }).map((_, index) => (
            <div key={index}>
              <div className="bg-muted animate-pulse rounded-lg aspect-[2/3] w-full"></div>
            </div>
          ))
        ) : (
          tvShows.map((tvShow, index) => (
            <div key={`${tvShow.id}-${index}`}>
              <TVShowCard 
                tvShow={tmdbService.formatTVShowForCard(tvShow)} 
                variant="grid"
              />
            </div>
          ))
        )}
      </div>

      {/* Sentinel element for Intersection Observer - must have height to be observable */}
      <div ref={sentinelRef} className="h-10 w-full" />

      {/* Loading more indicator */}
      {isLoadingMore && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cinema-red"></div>
        </div>
      )}
    </div>
  );
};
