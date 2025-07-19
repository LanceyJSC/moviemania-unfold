
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
        // Use popular movies with recent release date filtering for more reliable data
        const response = await tmdbService.getPopularMovies();
        // Filter for movies released in the last 60 days and have posters
        const now = new Date();
        const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
        
        const recentMovies = response.results.filter(movie => {
          if (!movie.poster_path || !movie.release_date) return false;
          const releaseDate = new Date(movie.release_date);
          return releaseDate >= twoMonthsAgo && releaseDate <= now;
        });

        if (recentMovies.length >= 6) {
          setMovies(recentMovies.slice(0, 8));
        } else {
          // Fallback to popular movies with posters if not enough recent releases
          const moviesWithPosters = response.results.filter(movie => movie.poster_path);
          setMovies(moviesWithPosters.slice(0, 8));
        }
      } catch (error) {
        console.error('Failed to load new movies:', error);
        // Final fallback to trending movies
        try {
          const fallbackResponse = await tmdbService.getTrendingMovies();
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
          Recent releases from {currentMonth} - Updated regularly
        </p>
        <div className="w-16 h-0.5 bg-cinema-gold mx-auto"></div>
      </div>
      
      {movies.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {movies.map((movie, index) => (
            <MovieCard key={`new-${movie.id}-${index}`} movie={tmdbService.formatMovieForCard(movie)} size="small" />
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
