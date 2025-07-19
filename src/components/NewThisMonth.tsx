
import { useState, useEffect } from "react";
import { Calendar, TrendingUp } from "lucide-react";
import { MovieCard } from "@/components/MovieCard";
import { tmdbService, Movie } from "@/lib/tmdb";

export const NewThisMonth = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadNewMovies = async () => {
      try {
        const response = await tmdbService.getThisMonthMovies();
        // Filter out movies without posters for better display
        const moviesWithPosters = response.results.filter(movie => movie.poster_path);
        setMovies(moviesWithPosters.slice(0, 8));
      } catch (error) {
        console.error('Failed to load new movies:', error);
        // Fallback to recent popular movies
        try {
          const fallbackResponse = await tmdbService.getPopularMovies();
          const moviesWithPosters = fallbackResponse.results.filter(movie => movie.poster_path);
          setMovies(moviesWithPosters.slice(0, 8));
        } catch (fallbackError) {
          console.error('Fallback also failed:', fallbackError);
        }
      } finally {
        setIsLoading(false);
      }
    };
    loadNewMovies();
  }, []);

  if (isLoading) {
    return (
      <div className="mb-12">
        <div className="text-center mb-8">
          <h2 className="font-cinematic text-3xl text-foreground tracking-wide mb-4">
            NEW THIS MONTH
          </h2>
          <div className="w-16 h-0.5 bg-cinema-gold mx-auto"></div>
        </div>
        <div className="text-center text-muted-foreground">Loading fresh content...</div>
      </div>
    );
  }

  const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long' });

  return (
    <div className="mb-12">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Calendar className="h-8 w-8 text-cinema-gold" />
          <h2 className="font-cinematic text-3xl text-foreground tracking-wide">
            NEW THIS MONTH
          </h2>
          <TrendingUp className="h-8 w-8 text-cinema-gold" />
        </div>
        <p className="text-muted-foreground mb-4">
          Fresh releases from {currentMonth} - Updated automatically
        </p>
        <div className="w-16 h-0.5 bg-cinema-gold mx-auto"></div>
      </div>
      
      {movies.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {movies.map((movie) => (
            <MovieCard key={movie.id} movie={tmdbService.formatMovieForCard(movie)} size="small" />
          ))}
        </div>
      ) : (
        <div className="text-center text-muted-foreground">
          No new releases found for this month
        </div>
      )}
    </div>
  );
};
