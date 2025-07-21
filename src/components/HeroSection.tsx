
import { useState, useEffect } from "react";
import { Play, Info, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { tmdbService } from "@/lib/tmdb";
import { TrailerModal } from "./TrailerModal";
import { SynopsisModal } from "./SynopsisModal";

export const HeroSection = () => {
  const [featuredMovie, setFeaturedMovie] = useState<any>(null);
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);
  const [isSynopsisOpen, setIsSynopsisOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedMovie = async () => {
      try {
        const trending = await tmdbService.getTrendingMovies();
        if (trending.results && trending.results.length > 0) {
          const randomIndex = Math.floor(Math.random() * Math.min(10, trending.results.length));
          const selectedMovie = trending.results[randomIndex];
          
          // Get detailed movie info
          const movieDetails = await tmdbService.getMovieDetails(selectedMovie.id);
          setFeaturedMovie(movieDetails);
        }
      } catch (error) {
        console.error('Error fetching featured movie:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeaturedMovie();
    
    // Refresh every 30 minutes
    const interval = setInterval(fetchFeaturedMovie, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="relative h-[70vh] bg-gradient-to-b from-cinema-black to-background animate-pulse">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-cinema-silver">Loading featured movie...</div>
        </div>
      </div>
    );
  }

  if (!featuredMovie) {
    return (
      <div className="relative h-[70vh] bg-gradient-to-b from-cinema-black to-background">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-cinema-silver">No featured movie available</div>
        </div>
      </div>
    );
  }

  const backdropUrl = featuredMovie.backdrop_path 
    ? `https://image.tmdb.org/t/p/original${featuredMovie.backdrop_path}`
    : '/placeholder.svg';

  return (
    <>
      <div className="relative h-[70vh] overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: `url(${backdropUrl})`,
          }}
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-cinema-black/90 via-cinema-black/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        
        {/* Content */}
        <div className="relative z-10 flex items-center h-full">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-2xl space-y-6">
              {/* Title */}
              <h1 className="text-4xl md:text-6xl font-cinematic text-white leading-tight">
                {featuredMovie.title}
              </h1>
              
              {/* Rating and Year */}
              <div className="flex items-center space-x-4 text-cinema-silver">
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 text-cinema-gold fill-current" />
                  <span>{featuredMovie.vote_average?.toFixed(1)}</span>
                </div>
                <span>•</span>
                <span>{new Date(featuredMovie.release_date).getFullYear()}</span>
                {featuredMovie.runtime && (
                  <>
                    <span>•</span>
                    <span>{Math.floor(featuredMovie.runtime / 60)}h {featuredMovie.runtime % 60}m</span>
                  </>
                )}
              </div>
              
              {/* Overview */}
              <p className="text-lg text-cinema-silver leading-relaxed line-clamp-3">
                {featuredMovie.overview}
              </p>
              
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4">
                <Button 
                  size="lg" 
                  className="bg-cinema-red hover:bg-cinema-red/90 text-white px-8"
                  onClick={() => setIsTrailerOpen(true)}
                >
                  <Play className="h-5 w-5 mr-2" />
                  Watch Trailer
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-white text-white hover:bg-white hover:text-cinema-black px-8"
                  onClick={() => setIsSynopsisOpen(true)}
                >
                  <Info className="h-5 w-5 mr-2" />
                  More Info
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <TrailerModal 
        isOpen={isTrailerOpen} 
        onClose={() => setIsTrailerOpen(false)} 
        movie={featuredMovie}
      />
      <SynopsisModal
        isOpen={isSynopsisOpen}
        onClose={() => setIsSynopsisOpen(false)}
        movie={featuredMovie}
      />
    </>
  );
};
