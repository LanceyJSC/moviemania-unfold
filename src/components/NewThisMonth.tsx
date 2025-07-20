import { useState, useEffect, useRef } from "react";
import { Calendar, TrendingUp } from "lucide-react";
import { MovieCard } from "@/components/MovieCard";
import { TVShowCard } from "@/components/TVShowCard";
import { tmdbService, Movie, TVShow } from "@/lib/tmdb";
import { useIsMobile } from "@/hooks/use-mobile";

type MediaItem = Movie | TVShow;

export const NewThisMonth = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [content, setContent] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const isMobile = useIsMobile();

  const loadNewContent = async (fresh: boolean = false) => {
    try {
      const now = new Date();
      const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
      
      // Get both movies and TV shows
      const [moviesResponse, tvShowsResponse] = await Promise.all([
        tmdbService.getPopularMovies(1, fresh),
        tmdbService.getPopularTVShows(1, fresh)
      ]);
      
      // Filter recent releases for movies
      const recentMovies = moviesResponse.results.filter(movie => {
        if (!movie.poster_path || !movie.release_date) return false;
        const releaseDate = new Date(movie.release_date);
        return releaseDate >= twoMonthsAgo && releaseDate <= now;
      });
      
      // Filter recent releases for TV shows
      const recentTVShows = tvShowsResponse.results.filter(show => {
        if (!show.poster_path || !show.first_air_date) return false;
        const releaseDate = new Date(show.first_air_date);
        return releaseDate >= twoMonthsAgo && releaseDate <= now;
      });

      // Combine recent content
      let allContent: MediaItem[] = [...recentMovies, ...recentTVShows];
      
      // If we don't have enough recent content, add popular content
      if (allContent.length < 8) {
        const additionalMovies = moviesResponse.results
          .filter(movie => movie.poster_path && !recentMovies.includes(movie))
          .slice(0, 4);
        const additionalTVShows = tvShowsResponse.results
          .filter(show => show.poster_path && !recentTVShows.includes(show))
          .slice(0, 4);
        
        allContent = [...allContent, ...additionalMovies, ...additionalTVShows];
      }
      
      // Shuffle and limit to 8 items
      const shuffled = allContent.sort(() => Math.random() - 0.5);
      setContent(shuffled.slice(0, 8));
    } catch (error) {
      console.error('Failed to load new content:', error);
      try {
        // Fallback to trending movies
        const fallbackResponse = await tmdbService.getTrendingMovies('week', fresh);
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
    loadNewContent();
  }, []);

  // Periodic refresh every hour to stay updated with TMDB
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      loadNewContent(true);
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
        <div className="text-center mb-8">
          <h2 className="font-cinematic text-3xl text-foreground tracking-wide mb-4">
            NEW THIS MONTH
          </h2>
          <div className="w-16 h-0.5 bg-cinema-gold mx-auto"></div>
        </div>
        <div className="flex space-x-3 overflow-hidden">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="flex-shrink-0 w-30 h-45 bg-muted animate-pulse rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long' });

  return (
    <div className="mb-12 pt-4">
      <div className="bg-background rounded-t-2xl rounded-b-2xl -mx-4 px-4 py-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Calendar className="h-8 w-8 text-cinema-gold" />
            <h2 className="font-cinematic text-3xl text-foreground tracking-wide">
              NEW THIS MONTH
            </h2>
            <TrendingUp className="h-8 w-8 text-cinema-gold" />
          </div>
          <p className="text-muted-foreground mb-4">
            Recent movies & TV shows from {currentMonth} - Updated hourly
          </p>
          <div className="w-16 h-0.5 bg-cinema-gold mx-auto"></div>
        </div>
      
      {content.length > 0 ? (
        <div 
          ref={scrollRef}
          className={`flex space-x-3 overflow-x-auto scrollbar-hide pb-4 cursor-grab active:cursor-grabbing transition-all duration-200 ease-out ${isDragging ? 'select-none' : ''}`}
          style={{ 
            scrollbarWidth: 'none', 
            msOverflowStyle: 'none',
            scrollBehavior: 'smooth',
            WebkitOverflowScrolling: 'touch'
          }}
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
              <div key={`new-${item.id}-${isMovie ? 'movie' : 'tv'}`} className="flex-shrink-0">
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
          No new releases found for this month
        </div>
        )}
      </div>
    </div>
  );
};
