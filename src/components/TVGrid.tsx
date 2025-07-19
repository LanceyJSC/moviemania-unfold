import { useState, useEffect } from "react";
import { tmdbService } from "@/lib/tmdb";
import { TVShow } from "@/lib/tmdb";
import { TVShowCard } from "@/components/TVShowCard";
import { useIsMobile } from "@/hooks/use-mobile";

interface TVGridProps {
  title: string;
  category: "all" | "popular" | "airing_today" | "on_the_air" | "top_rated";
}

export const TVGrid = ({ title, category }: TVGridProps) => {
  const [tvShows, setTVShows] = useState<TVShow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const isMobile = useIsMobile();

  const loadTVShows = async (pageNum: number = 1, fresh: boolean = false) => {
    try {
      if (pageNum === 1) {
        setIsLoading(true);
      }

      let response;
      switch (category) {
        case "all":
          response = await tmdbService.getPopularTVShows(pageNum, fresh);
          break;
        case "popular":
          response = await tmdbService.getPopularTVShows(pageNum, fresh);
          break;
        case "airing_today":
          response = await tmdbService.getAiringTodayTVShows(pageNum, fresh);
          break;
        case "on_the_air":
          response = await tmdbService.getOnTheAirTVShows(pageNum, fresh);
          break;
        case "top_rated":
          response = await tmdbService.getTopRatedTVShows(pageNum, fresh);
          break;
        default:
          response = await tmdbService.getPopularTVShows(pageNum, fresh);
      }

      if (pageNum === 1) {
        setTVShows(response.results);
      } else {
        setTVShows(prev => [...prev, ...response.results]);
      }
      
      setHasMore(pageNum < response.total_pages);
    } catch (error) {
      console.error(`Failed to load ${category} TV shows:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMore = () => {
    if (!isLoading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadTVShows(nextPage);
    }
  };

  useEffect(() => {
    setPage(1);
    loadTVShows(1);
  }, [category]);

  // Periodic refresh every hour to stay updated with TMDB
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      setPage(1);
      loadTVShows(1, true);
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

      {/* TV Shows Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
        {isLoading && tvShows.length === 0 ? (
          // Loading skeleton
          Array.from({ length: 15 }).map((_, index) => (
            <div key={index} className="animate-fade-in">
              <div className="bg-muted animate-pulse rounded-lg aspect-[2/3] w-full"></div>
            </div>
          ))
        ) : (
          tvShows.map((tvShow, index) => (
            <div key={tvShow.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
              <TVShowCard 
                tvShow={tmdbService.formatTVShowForCard(tvShow)} 
                size={isMobile ? "small" : "medium"} 
              />
            </div>
          ))
        )}
      </div>

      {/* Loading more indicator */}
      {isLoading && tvShows.length > 0 && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cinema-red"></div>
        </div>
      )}
    </div>
  );
};