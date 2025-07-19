
import { useState, useEffect } from "react";
import { Sparkles, Clock } from "lucide-react";
import { MovieCard } from "@/components/MovieCard";
import { tmdbService, Movie } from "@/lib/tmdb";

export const FreshPicks = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadFreshPicks = async () => {
      try {
        const response = await tmdbService.getThisWeekMovies();
        // Filter out movies without posters for better display
        const moviesWithPosters = response.results.filter(movie => movie.poster_path);
        setMovies(moviesWithPosters.slice(0, 6));
      } catch (error) {
        console.error('Failed to load fresh picks:', error);
        // Fallback to popular movies if week movies fail
        try {
          const fallbackResponse = await tmdbService.getPopularMovies();
          const moviesWithPosters = fallbackResponse.results.filter(movie => movie.poster_path);
          setMovies(moviesWithPosters.slice(0, 6));
        } catch (fallbackError) {
          console.error('Fallback also failed:', fallbackError);
        }
      } finally {
        setIsLoading(false);
      }
    };
    loadFreshPicks();
  }, []);

  if (isLoading) {
    return (
      <div className="mb-12">
        <div className="bg-gradient-to-r from-cinema-charcoal to-cinema-black rounded-2xl p-8">
          <div className="text-center mb-8">
            <h2 className="font-cinematic text-3xl text-foreground tracking-wide mb-4">
              FRESH PICKS
            </h2>
            <div className="w-16 h-0.5 bg-cinema-red mx-auto"></div>
          </div>
          <div className="text-center text-muted-foreground">Loading weekly highlights...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-12">
      <div className="bg-gradient-to-r from-cinema-charcoal to-cinema-black rounded-2xl p-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="h-8 w-8 text-cinema-red" />
            <h2 className="font-cinematic text-3xl text-foreground tracking-wide">
              FRESH PICKS
            </h2>
            <Clock className="h-8 w-8 text-cinema-red" />
          </div>
          <p className="text-muted-foreground mb-4">
            This week's hottest releases - Refreshed weekly
          </p>
          <div className="w-16 h-0.5 bg-cinema-red mx-auto"></div>
        </div>
        
        {movies.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {movies.map((movie) => (
              <MovieCard key={movie.id} movie={tmdbService.formatMovieForCard(movie)} size="small" />
            ))}
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
