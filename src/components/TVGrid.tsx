import { useState, useEffect, useRef } from "react";
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
  const [tvShows, setTVShows] = useState<TVShow[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const loadingMoreRef = useRef(false);
  const isMobile = useIsMobile();

  // Use React Query for caching - staleTime prevents refetch on mount
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['tvshows', category, 1],
    queryFn: () => fetchTVShows(category, 1),
    staleTime: 5 * 60 * 1000, // 5 minutes - won't refetch if data is fresh
    gcTime: 30 * 60 * 1000, // 30 minutes cache
  });

  // Set initial TV shows from query
  useEffect(() => {
    if (data?.results) {
      setTVShows(data.results);
      setHasMore(1 < data.total_pages);
      setPage(1);
    }
  }, [data]);

  // Reset when category changes
  useEffect(() => {
    setPage(1);
    setTVShows([]);
  }, [category]);

  const loadMore = async () => {
    if (loadingMoreRef.current || !hasMore) return;
    
    loadingMoreRef.current = true;
    const nextPage = page + 1;
    
    try {
      const response = await fetchTVShows(category, nextPage);
      setTVShows(prev => [...prev, ...response.results]);
      setHasMore(nextPage < response.total_pages);
      setPage(nextPage);
    } catch (error) {
      console.error(`Failed to load more ${category} TV shows:`, error);
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
          // Loading skeleton
          Array.from({ length: 15 }).map((_, index) => (
            <div key={index} className="animate-fade-in">
              <div className="bg-muted animate-pulse rounded-lg aspect-[2/3] w-full"></div>
            </div>
          ))
        ) : (
          tvShows.map((tvShow) => (
            <div key={tvShow.id} className="animate-fade-in">
              <TVShowCard 
                tvShow={tmdbService.formatTVShowForCard(tvShow)} 
                variant="grid"
              />
            </div>
          ))
        )}
      </div>

      {/* Loading more indicator */}
      {(isFetching || loadingMoreRef.current) && tvShows.length > 0 && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cinema-red"></div>
        </div>
      )}
    </div>
  );
};
