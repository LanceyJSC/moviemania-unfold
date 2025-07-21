
import { useState, useEffect } from "react";
import { Grid, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MovieCard } from "./MovieCard";
import { tmdbService } from "@/lib/tmdb";

interface MovieGridProps {
  title: string;
  category: "all" | "popular" | "now_playing" | "upcoming" | "top_rated";
  refreshInterval?: number;
}

export const MovieGrid = ({ title, category, refreshInterval = 30 * 60 * 1000 }: MovieGridProps) => {
  const [movies, setMovies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchMovies = async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    }
    
    try {
      let response;
      switch (category) {
        case "popular":
          response = await tmdbService.getPopularMovies();
          break;
        case "now_playing":
          response = await tmdbService.getNowPlayingMovies();
          break;
        case "upcoming":
          response = await tmdbService.getUpcomingMovies();
          break;
        case "top_rated":
          response = await tmdbService.getTopRatedMovies();
          break;
        case "all":
        default:
          response = await tmdbService.getPopularMovies();
          break;
      }
      const formattedMovies = response.results.map((movie: any) => 
        tmdbService.formatMovieForCard(movie)
      );
      setMovies(formattedMovies);
    } catch (error) {
      console.error(`Error fetching ${title}:`, error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMovies();
    
    const interval = setInterval(() => fetchMovies(), refreshInterval);
    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = () => {
    fetchMovies(true);
  };

  if (isLoading) {
    return (
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Grid className="h-6 w-6 text-cinema-gold" />
            <h2 className="text-2xl font-cinematic text-foreground">{title}</h2>
          </div>
        </div>
        <div className="poster-grid-responsive">
          {Array.from({ length: 20 }).map((_, index) => (
            <div key={index} className="w-48 h-72 bg-muted animate-pulse rounded-lg"></div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Grid className="h-6 w-6 text-cinema-gold" />
          <h2 className="text-2xl font-cinematic text-foreground">{title}</h2>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleManualRefresh}
          disabled={isRefreshing}
          className="flex items-center space-x-2"
        >
          <RotateCcw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>
      </div>
      
      <div className="poster-grid-responsive">
        {movies.map((movie) => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </div>
    </section>
  );
};
