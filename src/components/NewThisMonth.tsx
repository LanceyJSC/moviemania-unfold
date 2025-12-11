import { useState, useEffect } from "react";
import { Calendar, TrendingUp, ArrowRight } from "lucide-react";
import { MovieCard } from "@/components/MovieCard";
import { TVShowCard } from "@/components/TVShowCard";
import { Button } from "@/components/ui/button";
import { tmdbService, Movie, TVShow } from "@/lib/tmdb";
import { useNavigate } from "react-router-dom";

type MediaItem = Movie | TVShow;

export const NewThisMonth = () => {
  const [content, setContent] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

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
      if (allContent.length < 12) {
        const additionalMovies = moviesResponse.results
          .filter(movie => movie.poster_path && !recentMovies.includes(movie))
          .slice(0, 6);
        const additionalTVShows = tvShowsResponse.results
          .filter(show => show.poster_path && !recentTVShows.includes(show))
          .slice(0, 6);
        
        allContent = [...allContent, ...additionalMovies, ...additionalTVShows];
      }
      
      // Shuffle and limit to 12 items (2 rows of 6)
      const shuffled = allContent.sort(() => Math.random() - 0.5);
      setContent(shuffled.slice(0, 12));
    } catch (error) {
      console.error('Failed to load new content:', error);
      try {
        // Fallback to trending movies
        const fallbackResponse = await tmdbService.getTrendingMovies('week', fresh);
        const moviesWithPosters = fallbackResponse.results
          .filter(movie => movie.poster_path)
          .slice(0, 12);
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

  const handleSeeMore = () => {
    navigate('/category/now_playing');
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
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {Array.from({ length: 12 }).map((_, index) => (
            <div key={index} className="aspect-[2/3] bg-muted animate-pulse rounded-lg"></div>
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
        <>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {content.map((item) => {
              const isMovie = 'title' in item;
              return (
                <div key={`new-${item.id}-${isMovie ? 'movie' : 'tv'}`}>
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
          <div className="flex justify-center mt-6">
            <Button
              variant="ghost"
              onClick={handleSeeMore}
              className="flex items-center gap-2 text-cinema-gold hover:text-cinema-gold/80 hover:bg-cinema-gold/10"
            >
              See More
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
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
