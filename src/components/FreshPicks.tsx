
import { useState, useEffect } from "react";
import { Sparkles, Clock } from "lucide-react";
import { MovieCard } from "@/components/MovieCard";
import { TVShowCard } from "@/components/TVShowCard";
import { tmdbService, Movie, TVShow } from "@/lib/tmdb";

type MediaItem = Movie | TVShow;

// High priority refresh - every 20 minutes for trending content
const FRESH_PICKS_REFRESH_INTERVAL = 20 * 60 * 1000;

export const FreshPicks = () => {
  const [content, setContent] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadFreshPicks = async (forceFresh: boolean = true) => {
    try {
      console.log('Loading Fresh Picks with FORCE FRESH data');
      // Always force fresh data for Fresh Picks - this is the most critical content
      const [trendingMovies, trendingTV] = await Promise.all([
        tmdbService.getTrendingMovies('week', forceFresh),
        tmdbService.getTrendingTVShows('week', forceFresh)
      ]);
      
      // Combine and shuffle movies and TV shows
      const allContent: MediaItem[] = [
        ...trendingMovies.results.filter(item => item.poster_path).slice(0, 4),
        ...trendingTV.results.filter(item => item.poster_path).slice(0, 4)
      ];
      
      // Shuffle the combined array
      const shuffled = allContent.sort(() => Math.random() - 0.5);
      setContent(shuffled.slice(0, 8));
      setLastUpdated(new Date());
      console.log('Fresh Picks loaded successfully with latest TMDB data');
    } catch (error) {
      console.error('Failed to load fresh picks:', error);
      try {
        // Fallback to popular movies only
        const fallbackResponse = await tmdbService.getPopularMovies(1, forceFresh);
        const moviesWithPosters = fallbackResponse.results
          .filter(movie => movie.poster_path)
          .slice(0, 8);
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

  // High priority refresh every 20 minutes for Fresh Picks
  useEffect(() => {
    console.log('Setting up Fresh Picks auto-refresh every 20 minutes');
    const refreshInterval = setInterval(() => {
      console.log('Auto-refreshing Fresh Picks - Priority content update');
      loadFreshPicks(true);
    }, FRESH_PICKS_REFRESH_INTERVAL);

    return () => clearInterval(refreshInterval);
  }, []);

  // Refresh when app regains focus
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
            <div className="flex space-x-3 overflow-hidden">
             {Array.from({ length: 6 }).map((_, index) => (
               <div key={index} className="flex-shrink-0 w-32 h-48 bg-muted animate-pulse rounded-lg"></div>
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
        
        {content.length > 0 ? (
           <div className="flex space-x-3 overflow-x-auto scrollbar-hide pb-4">
             {content.map((item) => {
               const isMovie = 'title' in item;
               return (
                 <div key={`fresh-${item.id}-${isMovie ? 'movie' : 'tv'}`} className="flex-shrink-0">
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
            Loading fresh picks from TMDB...
          </div>
        )}
      </div>
    </div>
  );
};
