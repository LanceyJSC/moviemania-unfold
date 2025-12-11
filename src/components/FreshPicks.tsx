import { useState, useEffect } from "react";
import { Sparkles, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { MovieCard } from "@/components/MovieCard";
import { TVShowCard } from "@/components/TVShowCard";
import { Button } from "@/components/ui/button";
import { tmdbService, Movie, TVShow } from "@/lib/tmdb";

type MediaItem = Movie | TVShow;

const FRESH_PICKS_REFRESH_INTERVAL = 20 * 60 * 1000;

export const FreshPicks = () => {
  const [content, setContent] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const loadFreshPicks = async (forceFresh: boolean = true) => {
    try {
      console.log('Loading Fresh Picks with FORCE FRESH data');
      const [trendingMovies, trendingTV] = await Promise.all([
        tmdbService.getTrendingMovies('week', forceFresh),
        tmdbService.getTrendingTVShows('week', forceFresh)
      ]);
      
      // Get more items for expanded view
      const allContent: MediaItem[] = [
        ...trendingMovies.results.filter(item => item.poster_path).slice(0, 12),
        ...trendingTV.results.filter(item => item.poster_path).slice(0, 12)
      ];
      
      const shuffled = allContent.sort(() => Math.random() - 0.5);
      setContent(shuffled.slice(0, 24));
      setLastUpdated(new Date());
      console.log('Fresh Picks loaded successfully with latest TMDB data');
    } catch (error) {
      console.error('Failed to load fresh picks:', error);
      try {
        const fallbackResponse = await tmdbService.getPopularMovies(1, forceFresh);
        const moviesWithPosters = fallbackResponse.results
          .filter(movie => movie.poster_path)
          .slice(0, 24);
        setContent(moviesWithPosters);
        setLastUpdated(new Date());
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFreshPicks(true);
  }, []);

  useEffect(() => {
    console.log('Setting up Fresh Picks auto-refresh every 20 minutes');
    const refreshInterval = setInterval(() => {
      console.log('Auto-refreshing Fresh Picks - Priority content update');
      loadFreshPicks(true);
    }, FRESH_PICKS_REFRESH_INTERVAL);
    return () => clearInterval(refreshInterval);
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('App regained focus - Refreshing Fresh Picks');
        loadFreshPicks(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const displayedContent = isExpanded ? content : content.slice(0, 12);

  if (isLoading) {
    return (
      <div className="mb-12">
        <div className="bg-background rounded-t-2xl rounded-b-2xl -mx-4 px-4 py-8">
          <div className="text-center mb-8">
            <h2 className="font-cinematic text-3xl text-foreground tracking-wide mb-4">
              FRESH PICKS
            </h2>
            <div className="w-16 h-0.5 bg-cinema-red mx-auto"></div>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {Array.from({ length: 12 }).map((_, index) => (
              <div key={index} className="aspect-[2/3] bg-muted animate-pulse rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-12 pt-4">
      <div className="bg-background rounded-t-2xl rounded-b-2xl -mx-4 px-4 py-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="h-8 w-8 text-cinema-red" />
            <h2 className="font-cinematic text-3xl text-foreground tracking-wide">
              FRESH PICKS
            </h2>
            <Clock className="h-8 w-8 text-cinema-red" />
          </div>
          <p className="text-muted-foreground mb-4">
            Trending movies & TV shows this week
          </p>
          <div className="w-16 h-0.5 bg-cinema-red mx-auto"></div>
        </div>
        
        {displayedContent.length > 0 ? (
          <>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {displayedContent.map((item) => {
                const isMovie = 'title' in item;
                return (
                  <div key={`fresh-${item.id}-${isMovie ? 'movie' : 'tv'}`}>
                    {isMovie ? (
                      <MovieCard 
                        movie={tmdbService.formatMovieForCard(item as Movie)}
                        variant="grid"
                      />
                    ) : (
                      <TVShowCard 
                        tvShow={tmdbService.formatTVShowForCard(item as TVShow)}
                        variant="grid"
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
                  className="flex items-center gap-2 text-cinema-red hover:text-cinema-red/80 hover:bg-cinema-red/10"
                >
                  {isExpanded ? 'Show Less' : 'See More'}
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center text-muted-foreground">
            Loading fresh picks from TMDB...
          </div>
        )}
      </div>
    </div>
  );
};
