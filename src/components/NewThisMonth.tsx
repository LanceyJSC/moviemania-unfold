import { useState, useEffect } from "react";
import { Calendar, TrendingUp, ChevronDown, ChevronUp } from "lucide-react";
import { MovieCard } from "@/components/MovieCard";
import { TVShowCard } from "@/components/TVShowCard";
import { Button } from "@/components/ui/button";
import { tmdbService, Movie, TVShow } from "@/lib/tmdb";

type MediaItem = Movie | TVShow;

export const NewThisMonth = () => {
  const [content, setContent] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  const loadNewContent = async (fresh: boolean = false) => {
    try {
      // Get movies and TV shows released THIS MONTH using proper TMDB discover endpoints
      const [moviesResponse, tvShowsResponse] = await Promise.all([
        tmdbService.getThisMonthMovies(fresh),
        tmdbService.getThisMonthTVShows(fresh)
      ]);
      
      // Filter for items with posters
      const recentMovies = moviesResponse.results.filter(movie => movie.poster_path);
      const recentTVShows = tvShowsResponse.results.filter(show => show.poster_path);

      // Combine and interleave movies and TV shows
      const allContent: MediaItem[] = [];
      const maxLength = Math.max(recentMovies.length, recentTVShows.length);
      
      for (let i = 0; i < maxLength && allContent.length < 24; i++) {
        if (i < recentMovies.length) allContent.push(recentMovies[i]);
        if (i < recentTVShows.length) allContent.push(recentTVShows[i]);
      }
      
      setContent(allContent.slice(0, 24));
    } catch (error) {
      console.error('Failed to load new content:', error);
      try {
        // Fallback to now playing movies
        const fallbackResponse = await tmdbService.getNowPlayingMovies(1, fresh);
        const moviesWithPosters = fallbackResponse.results
          .filter(movie => movie.poster_path)
          .slice(0, 24);
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

  useEffect(() => {
    const refreshInterval = setInterval(() => {
      loadNewContent(true);
    }, 3600000);
    return () => clearInterval(refreshInterval);
  }, []);

  const displayedContent = isExpanded ? content : content.slice(0, 12);

  if (isLoading) {
    return (
      <div className="mb-12">
        <div className="text-center mb-8">
          <h2 className="font-cinematic text-3xl text-foreground tracking-wide mb-4">
            NEW THIS MONTH
          </h2>
          <div className="w-16 h-0.5 bg-cinema-gold mx-auto"></div>
        </div>
        <div className="flex space-x-3 overflow-x-auto scrollbar-hide pb-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="flex-shrink-0 w-32 h-48 bg-muted animate-pulse rounded-lg"></div>
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
            Recent movies & TV shows from {currentMonth}
          </p>
          <div className="w-16 h-0.5 bg-cinema-gold mx-auto"></div>
        </div>
      
      {displayedContent.length > 0 ? (
        <>
          <div className="flex space-x-3 overflow-x-auto scrollbar-hide pb-4">
            {displayedContent.map((item) => {
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
          {content.length > 12 && (
            <div className="flex justify-center mt-6">
              <Button
                variant="ghost"
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-2 text-cinema-gold hover:text-cinema-gold/80 hover:bg-cinema-gold/10"
              >
                {isExpanded ? 'Show Less' : 'See More'}
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center text-muted-foreground">
          No new releases found for this month
        </div>
        )}
      </div>
    </div>
  );
};
