
import { useState, useEffect } from "react";
import { Play, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { tmdbService } from "@/lib/tmdb";
import { TrailerModal } from "./TrailerModal";

export const LatestTrailers = () => {
  const [trailers, setTrailers] = useState<any[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<any>(null);
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLatestTrailers = async () => {
      try {
        const upcoming = await tmdbService.getUpcomingMovies();
        const moviesWithTrailers = upcoming.results.slice(0, 8);
        setTrailers(moviesWithTrailers);
      } catch (error) {
        console.error('Error fetching latest trailers:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLatestTrailers();
    
    // Refresh every 4 hours
    const interval = setInterval(fetchLatestTrailers, 4 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleWatchTrailer = (movie: any) => {
    setSelectedMovie(movie);
    setIsTrailerOpen(true);
  };

  if (isLoading) {
    return (
      <section className="space-y-4">
        <div className="flex items-center space-x-2">
          <Play className="h-6 w-6 text-cinema-red" />
          <h2 className="text-2xl font-cinematic text-foreground">Latest Trailers</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="aspect-video bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Play className="h-6 w-6 text-cinema-red" />
            <h2 className="text-2xl font-cinematic text-foreground">Latest Trailers</h2>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {trailers.map((movie) => (
            <div key={movie.id} className="relative group cursor-pointer" onClick={() => handleWatchTrailer(movie)}>
              <div className="aspect-video bg-cinema-black rounded-lg overflow-hidden">
                <img
                  src={movie.backdrop_path ? `https://image.tmdb.org/t/p/w500${movie.backdrop_path}` : '/placeholder.svg'}
                  alt={movie.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="sm" className="bg-cinema-red hover:bg-cinema-red/90">
                    <Play className="h-4 w-4 mr-1" />
                    Play
                  </Button>
                </div>
              </div>
              <div className="mt-2 space-y-1">
                <h3 className="font-medium text-sm text-foreground line-clamp-1">{movie.title}</h3>
                <div className="flex items-center text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3 mr-1" />
                  {new Date(movie.release_date).getFullYear()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <TrailerModal 
        isOpen={isTrailerOpen} 
        onClose={() => setIsTrailerOpen(false)} 
        trailerKey=""
        movieTitle={selectedMovie?.title || ""}
      />
    </>
  );
};
