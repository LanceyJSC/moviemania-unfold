
import { useState, useEffect, useRef } from "react";
import { Sparkles, Clock } from "lucide-react";
import { MovieCard } from "@/components/MovieCard";
import { TVShowCard } from "@/components/TVShowCard";
import { tmdbService, Movie, TVShow } from "@/lib/tmdb";
import { useIsMobile } from "@/hooks/use-mobile";

type MediaItem = Movie | TVShow;

export const FreshPicks = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [content, setContent] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const isMobile = useIsMobile();

  const loadFreshPicks = async (fresh: boolean = false) => {
    try {
      // Get trending movies and TV shows for this week
      const [trendingMovies, trendingTV] = await Promise.all([
        tmdbService.getTrendingMovies('week', fresh),
        tmdbService.getTrendingTVShows('week', fresh)
      ]);
      
      // Combine and shuffle movies and TV shows
      const allContent: MediaItem[] = [
        ...trendingMovies.results.filter(item => item.poster_path).slice(0, 4),
        ...trendingTV.results.filter(item => item.poster_path).slice(0, 4)
      ];
      
      // Shuffle the combined array
      const shuffled = allContent.sort(() => Math.random() - 0.5);
      setContent(shuffled.slice(0, 8));
    } catch (error) {
      console.error('Failed to load fresh picks:', error);
      try {
        // Fallback to popular movies only
        const fallbackResponse = await tmdbService.getPopularMovies(1, fresh);
        const moviesWithPosters = fallbackResponse.results
          .filter(movie => movie.poster_path)
          .slice(0, 8);
        setContent(moviesWithPosters);
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFreshPicks();
  }, []);

  // Periodic refresh every hour to stay updated with TMDB
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      loadFreshPicks(true);
    }, 3600000); // 1 hour in milliseconds

    return () => clearInterval(refreshInterval);
  }, []);

  // Touch/Mouse event handlers for swipe functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
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

  if (isLoading) {
    return (
      <div className="mb-12">
        <div className="bg-background rounded-t-2xl rounded-b-2xl -mx-1 md:-mx-4 px-1 md:px-4 py-8">
          <div className="text-center mb-8">
            <h2 className="font-cinematic text-3xl text-foreground tracking-wide mb-4">
              FRESH PICKS
            </h2>
            <div className="w-16 h-0.5 bg-cinema-red mx-auto"></div>
          </div>
           <div className="flex space-x-4 overflow-hidden">
             {Array.from({ length: 6 }).map((_, index) => (
               <div key={index} className="flex-shrink-0 w-44 aspect-[2/3] bg-muted animate-pulse rounded-lg"></div>
             ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-12 pt-4">
      <div className="bg-background rounded-t-2xl rounded-b-2xl -mx-1 md:-mx-4 px-1 md:px-4 py-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="h-8 w-8 text-cinema-red" />
            <h2 className="font-cinematic text-3xl text-foreground tracking-wide">
              FRESH PICKS
            </h2>
            <Clock className="h-8 w-8 text-cinema-red" />
          </div>
          <p className="text-muted-foreground mb-4">
            Trending movies & TV shows this week - Updated hourly
          </p>
          <div className="w-16 h-0.5 bg-cinema-red mx-auto"></div>
        </div>
        
        {content.length > 0 ? (
          <div 
            ref={scrollRef}
            className={`flex space-x-4 overflow-x-auto ios-horizontal-scroll pb-4 cursor-grab active:cursor-grabbing ${isDragging ? 'select-none' : ''}`}
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleEnd}
          >
             {content.map((item) => {
               const isMovie = 'title' in item;
               return (
                 <div key={`fresh-${item.id}-${isMovie ? 'movie' : 'tv'}`} className="flex-shrink-0 w-44">
                   {isMovie ? (
                      <MovieCard 
                        movie={tmdbService.formatMovieForCard(item as Movie)} 
                      />
                   ) : (
                      <TVShowCard 
                        tvShow={tmdbService.formatTVShowForCard(item as TVShow)}
                      />
                   )}
                 </div>
               );
             })}
           </div>
        ) : (
          <div className="text-center text-muted-foreground">
            No fresh picks available this week
          </div>
        )}
      </div>
    </div>
  );
};
