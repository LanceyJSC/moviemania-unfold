
import { Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TVShowCard } from "./TVShowCard";
import { useState, useEffect } from "react";
import { tmdbService, TVShow } from "@/lib/tmdb";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";

interface SwipeableTVCarouselProps {
  title: string;
  category: "trending" | "popular" | "top_rated" | "airing_today" | "on_the_air";
}

export const SwipeableTVCarousel = ({ title, category }: SwipeableTVCarouselProps) => {
  const [tvShows, setTVShows] = useState<TVShow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const loadTVShows = async (fresh: boolean = false) => {
    setIsLoading(true);
    try {
      let response;
      switch (category) {
        case "trending":
          response = await tmdbService.getTrendingTVShows('week', fresh);
          break;
        case "popular":
          response = await tmdbService.getPopularTVShows(1, fresh);
          break;
        case "top_rated":
          response = await tmdbService.getTopRatedTVShows(1, fresh);
          break;
        case "airing_today":
          response = await tmdbService.getAiringTodayTVShows(1, fresh);
          break;
        case "on_the_air":
          response = await tmdbService.getOnTheAirTVShows(1, fresh);
          break;
        default:
          response = await tmdbService.getPopularTVShows(1, fresh);
      }
      setTVShows(response.results);
    } catch (error) {
      console.error(`Failed to load ${category} TV shows:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTVShows();
  }, [category]);

  // Periodic refresh every hour to stay updated with TMDB
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      loadTVShows(true);
    }, 3600000); // 1 hour in milliseconds

    return () => clearInterval(refreshInterval);
  }, [category]);

  const handleViewAll = () => {
    navigate(`/category/tv/${category}`);
  };


  const getSkeletonClasses = () => {
    return "w-32 h-48";
  };

  return (
    <div className="relative group">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className={`font-cinematic text-foreground tracking-wide ${
          isMobile ? 'text-xl' : 'text-2xl md:text-3xl'
        }`}>
          {title}
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleViewAll}
          className="flex items-center gap-2 text-cinema-red hover:text-cinema-red/80 hover:bg-cinema-red/10"
        >
          View All
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      {/* TV Show Cards Container with consistent spacing */}
      <div className="flex space-x-3 overflow-x-auto scrollbar-hide pb-4">
        {isLoading ? (
          // Loading skeleton with uniform sizing
          Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="flex-shrink-0">
              <div className={`${getSkeletonClasses()} bg-muted animate-pulse rounded-lg`}></div>
            </div>
          ))
        ) : (
          tvShows.map((tvShow) => (
            <div key={tvShow.id} className="flex-shrink-0">
              <TVShowCard 
                tvShow={tmdbService.formatTVShowForCard(tvShow)} 
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
};
