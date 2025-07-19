
import { Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TVShowCard } from "./TVShowCard";
import { useState, useRef, useEffect } from "react";
import { tmdbService, TVShow } from "@/lib/tmdb";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";

interface SwipeableTVCarouselProps {
  title: string;
  category: "trending" | "popular" | "top_rated" | "airing_today" | "on_the_air";
  cardSize?: "small" | "medium" | "large";
}

export const SwipeableTVCarousel = ({ title, category, cardSize = "medium" }: SwipeableTVCarouselProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [tvShows, setTVShows] = useState<TVShow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  useEffect(() => {
    const loadTVShows = async () => {
      setIsLoading(true);
      try {
        let response;
        switch (category) {
          case "trending":
            response = await tmdbService.getTrendingTVShows();
            break;
          case "popular":
            response = await tmdbService.getPopularTVShows();
            break;
          case "top_rated":
            response = await tmdbService.getTopRatedTVShows();
            break;
          case "airing_today":
            response = await tmdbService.getAiringTodayTVShows();
            break;
          case "on_the_air":
            response = await tmdbService.getOnTheAirTVShows();
            break;
          default:
            response = await tmdbService.getPopularTVShows();
        }
        setTVShows(response.results);
      } catch (error) {
        console.error(`Failed to load ${category} TV shows:`, error);
      } finally {
        setIsLoading(false);
      }
    };
    loadTVShows();
  }, [category]);

  const handleViewAll = () => {
    navigate(`/category/tv/${category}`);
  };

  // Touch/Mouse event handlers for swipe functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isMobile || !scrollRef.current) return;
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

      {/* TV Show Cards Container */}
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
        {isLoading ? (
          // Loading skeleton
          Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="flex-shrink-0">
              <div className={`bg-muted animate-pulse rounded-lg ${
                isMobile ? 'w-40 h-60' : 'w-48 h-72'
              }`}></div>
            </div>
          ))
        ) : (
          tvShows.map((tvShow) => (
            <div key={tvShow.id} className="flex-shrink-0">
              <TVShowCard 
                tvShow={tmdbService.formatTVShowForCard(tvShow)} 
                size={isMobile ? "small" : cardSize} 
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
};
