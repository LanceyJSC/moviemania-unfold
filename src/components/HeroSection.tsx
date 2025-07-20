import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Play, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TrailerModal } from "@/components/TrailerModal";
import { tmdbService, Movie } from "@/lib/tmdb";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTrailerContext } from "@/contexts/TrailerContext";

export const HeroSection = () => {
  const [heroMovies, setHeroMovies] = useState<Movie[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const { isTrailerOpen, setIsTrailerOpen } = useTrailerContext();
  const isMobile = useIsMobile();

  const loadHeroMovies = async (fresh: boolean = false) => {
    try {
      const trending = await tmdbService.getTrendingMovies('week', fresh);
      if (trending.results && trending.results.length > 0) {
        // Get the first 5 movies with backdrop images
        const moviesWithBackdrops = trending.results
          .filter(movie => movie.backdrop_path)
          .slice(0, 5);
        
        // Get full movie details including videos for each movie
        const movieDetailsPromises = moviesWithBackdrops.map(movie => 
          tmdbService.getMovieDetails(movie.id)
        );
        const movieDetails = await Promise.all(movieDetailsPromises);
        
        setHeroMovies(movieDetails);
        
        // Find trailer for the first movie
        const firstMovie = movieDetails[0];
        const trailer = firstMovie?.videos?.results.find(
          video => video.type === 'Trailer' && video.site === 'YouTube'
        );
        if (trailer) {
          setTrailerKey(trailer.key);
        }
      }
    } catch (error) {
      console.error("Failed to load hero movies:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHeroMovies();
  }, []);

  // Periodic refresh every hour to stay updated with TMDB
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      loadHeroMovies(true);
    }, 3600000); // 1 hour in milliseconds

    return () => clearInterval(refreshInterval);
  }, []);

  const handleWatchNow = () => {
    if (trailerKey) {
      setIsTrailerOpen(true);
    }
  };

  const handleCloseTrailer = () => {
    setIsTrailerOpen(false);
  };

  // Always show the hero section, even when loading
  const heroMovie = heroMovies[currentIndex];
  const heroBackdrop = heroMovie ? tmdbService.getBackdropUrl(heroMovie.backdrop_path, 'original') : null;

  return (
    <>
      <div className="relative text-foreground overflow-hidden backdrop-16-9">
        {/* Hero Background - TMDB Backdrop 16:9 */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: heroBackdrop ? `url(${heroBackdrop})` : 'var(--gradient-dark)',
            backgroundSize: 'cover',
            backgroundPosition: 'center center'
          }}
        >
          {/* iOS-style gradients for readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/80" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/30" />
        </div>

        {/* iOS-style safe area top spacing */}
        <div 
          className="absolute top-0 left-0 right-0 z-20 px-6"
          style={{ 
            paddingTop: 'max(env(safe-area-inset-top), 16px)',
            marginTop: '8px'
          }}
        >
          <h1 className="font-cinematic text-2xl sm:text-3xl tracking-wide text-foreground drop-shadow-lg">
            CINE<span className="text-cinema-red">SCOPE</span>
          </h1>
          <p className="text-foreground/90 text-sm mt-1 drop-shadow-sm">
            Discover Movies Like Never Before
          </p>
        </div>

        {/* Hero Content - Mobile-first layout */}
        <div className="relative z-10 flex flex-col justify-end h-full px-6 pb-8 pt-24">
          {isLoading ? (
            <div className="animate-pulse space-y-3">
              <div className="h-8 bg-muted/60 rounded-lg w-3/4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-muted/40 rounded w-full"></div>
                <div className="h-4 bg-muted/40 rounded w-5/6"></div>
                <div className="h-4 bg-muted/40 rounded w-4/6"></div>
              </div>
              <div className="flex gap-3 pt-2">
                <div className="h-12 bg-muted/60 rounded-xl w-32"></div>
                <div className="h-12 bg-muted/40 rounded-xl w-24"></div>
              </div>
            </div>
          ) : heroMovie ? (
            <div className="space-y-4">
              <div>
                <h2 className="font-cinematic text-xl sm:text-2xl tracking-wide text-foreground mb-2">
                  {heroMovie.title}
                </h2>
                <p className="text-sm sm:text-base text-foreground/90 line-clamp-3 leading-relaxed">
                  {heroMovie.overview}
                </p>
              </div>
              
              <div className="flex gap-3 pt-2">
                {trailerKey ? (
                  <Button 
                    className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-12 px-6 font-medium touch-target"
                    onClick={handleWatchNow}
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Watch Trailer
                  </Button>
                ) : (
                  <Link to={`/movie/${heroMovie.id}`}>
                    <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-12 px-6 font-medium touch-target">
                      <Play className="mr-2 h-4 w-4" />
                      Watch Now
                    </Button>
                  </Link>
                )}
                <Link to={`/movie/${heroMovie.id}`}>
                  <Button 
                    variant="outline" 
                    className="border-foreground/30 text-foreground bg-background/20 backdrop-blur-sm hover:bg-background/40 rounded-xl h-12 px-4 touch-target"
                  >
                    <Info className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">More Info</span>
                    <span className="sm:hidden">Info</span>
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div>
                <h2 className="font-cinematic text-xl sm:text-2xl tracking-wide text-foreground mb-2">
                  Welcome to Your Movie Universe
                </h2>
                <p className="text-sm sm:text-base text-foreground/90 leading-relaxed">
                  Discover, save, and explore thousands of movies with personalized recommendations.
                </p>
              </div>
              <Link to="/search">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-12 px-6 font-medium touch-target">
                  Start Exploring
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Trailer Modal */}
      {isTrailerOpen && trailerKey && heroMovie && (
        <TrailerModal
          isOpen={isTrailerOpen}
          onClose={handleCloseTrailer}
          trailerKey={trailerKey}
          movieTitle={heroMovie.title}
        />
      )}
    </>
  );
};
