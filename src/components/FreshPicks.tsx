
import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";
import { MovieCarousel } from "./MovieCarousel";
import { tmdbService } from "@/lib/tmdb";

export const FreshPicks = () => {
  const [movies, setMovies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFreshPicks = async () => {
      try {
        const [nowPlaying, upcoming] = await Promise.all([
          tmdbService.getNowPlayingMovies(),
          tmdbService.getUpcomingMovies()
        ]);
        
        // Combine and shuffle the results
        const combined = [...nowPlaying.results.slice(0, 10), ...upcoming.results.slice(0, 10)];
        const shuffled = combined.sort(() => 0.5 - Math.random()).slice(0, 15);
        
        setMovies(shuffled);
      } catch (error) {
        console.error('Error fetching fresh picks:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFreshPicks();
    
    // Refresh every 2 hours
    const interval = setInterval(fetchFreshPicks, 2 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Sparkles className="h-6 w-6 text-cinema-gold" />
          <h2 className="text-2xl font-cinematic text-foreground">Fresh Picks</h2>
        </div>
      </div>
      
      <MovieCarousel movies={movies} isLoading={isLoading} />
    </section>
  );
};
