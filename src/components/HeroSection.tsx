
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
      <div className="relative w-full backdrop-16-9 overflow-hidden">
        {/* Hero Background - TMDB Backdrop 16:9 */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: heroBackdrop ? `url(${heroBackdrop})` : 'linear-gradient(135deg, hsl(var(--cinema-black)), hsl(var(--cinema-charcoal)))',
            backgroundSize: 'cover',
            backgroundPosition: 'center center'
          }}
        >
          {/* Enhanced gradient overlays for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/90" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-black/40" />
          {/* Additional gradient for text area */}
          <div className="absolute bottom-0 left-0 right-0 h-3/4 bg-gradient-to-t from-black/95 via-black/60 to-transparent" />
        </div>

        {/* App Header - Fixed positioning with proper safe areas */}
        <div 
          className="absolute top-0 left-0 right-0 z-30 px-4 sm:px-6"
          style={{ 
            paddingTop: 'max(env(safe-area-inset-top), 12px)',
            marginTop: '8px'
          }}
        >
          <div className="backdrop-blur-sm bg-black/20 rounded-xl px-4 py-3 inline-block">
            <h1 className="font-cinematic text-xl sm:text-2xl lg:text-3xl tracking-wide text-white drop-shadow-lg">
              CINE<span className="text-cinema-red">SCOPE</span>
            </h1>
            <p className="text-white/90 text-xs sm:text-sm mt-1 drop-shadow-sm">
              Discover Movies Like Never Before
            </p>
          </div>
        </div>

        {/* Hero Content - Proper positioning with safe spacing */}
        <div className="absolute bottom-0 left-0 right-0 z-20 px-4 sm:px-6 pb-6 sm:pb-8">
          <div className="max-w-4xl">
            {isLoading ? (
              <div className="animate-pulse space-y-4">
                <div className="h-8 sm:h-10 bg-white/20 rounded-lg w-3/4 backdrop-blur-sm"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-white/10 rounded w-full backdrop-blur-sm"></div>
                  <div className="h-4 bg-white/10 rounded w-5/6 backdrop-blur-sm"></div>
                  <div className="h-4 bg-white/10 rounded w-4/6 backdrop-blur-sm"></div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <div className="h-12 bg-white/20 rounded-xl w-full sm:w-40 backdrop-blur-sm"></div>
                  <div className="h-12 bg-white/10 rounded-xl w-full sm:w-32 backdrop-blur-sm"></div>
                </div>
              </div>
            ) : heroMovie ? (
              <div className="space-y-4 sm:space-y-6">
                <div className="backdrop-blur-sm bg-black/20 rounded-xl p-4 sm:p-6">
                  <h2 className="font-cinematic text-2xl sm:text-3xl lg:text-4xl tracking-wide text-white mb-3 sm:mb-4 text-shadow-lg">
                    {heroMovie.title}
                  </h2>
                  <p className="text-sm sm:text-base lg:text-lg text-white/95 line-clamp-3 leading-relaxed text-shadow-md">
                    {heroMovie.overview}
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  {trailerKey ? (
                    <Button 
                      className="bg-cinema-red hover:bg-cinema-red/90 text-white rounded-xl h-12 sm:h-14 px-6 sm:px-8 font-medium text-base touch-target"
                      onClick={handleWatchNow}
                    >
                      <Play className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                      Watch Trailer
                    </Button>
                  ) : (
                    <Link to={`/movie/${heroMovie.id}`}>
                      <Button className="bg-cinema-red hover:bg-cinema-red/90 text-white rounded-xl h-12 sm:h-14 px-6 sm:px-8 font-medium text-base touch-target w-full sm:w-auto">
                        <Play className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                        Watch Now
                      </Button>
                    </Link>
                  )}
                  <Link to={`/movie/${heroMovie.id}`}>
                    <Button 
                      variant="outline" 
                      className="border-white/50 text-white bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-xl h-12 sm:h-14 px-4 sm:px-6 touch-target w-full sm:w-auto"
                    >
                      <Info className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="hidden sm:inline">More Info</span>
                      <span className="sm:hidden">Info</span>
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="backdrop-blur-sm bg-black/20 rounded-xl p-6 text-center space-y-6">
                <div>
                  <h2 className="font-cinematic text-2xl sm:text-3xl lg:text-4xl tracking-wide text-white mb-4 text-shadow-lg">
                    Welcome to Your Movie Universe
                  </h2>
                  <p className="text-sm sm:text-base lg:text-lg text-white/95 leading-relaxed text-shadow-md max-w-2xl mx-auto">
                    Discover, save, and explore thousands of movies with personalized recommendations.
                  </p>
                </div>
                <Link to="/search">
                  <Button className="bg-cinema-red hover:bg-cinema-red/90 text-white rounded-xl h-12 sm:h-14 px-6 sm:px-8 font-medium text-base touch-target">
                    Start Exploring
                  </Button>
                </Link>
              </div>
            )}
          </div>
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
