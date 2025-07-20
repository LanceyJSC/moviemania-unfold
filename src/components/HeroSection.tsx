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
      <div className="relative h-[50vh] sm:h-[60vh] md:h-[70vh] lg:h-[80vh] xl:h-[85vh] text-foreground overflow-hidden">
        {/* Hero Background with proper aspect ratio */}
        <div className="absolute inset-0">
          {heroBackdrop ? (
            <img 
              src={heroBackdrop}
              alt={heroMovie?.title || "Hero backdrop"}
              className="w-full h-full object-cover object-center"
              style={{ aspectRatio: '16/9' }}
            />
          ) : (
            <div 
              className="w-full h-full bg-gradient-to-br from-cinema-black via-cinema-charcoal to-cinema-black"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-cinema-black/70 via-cinema-black/40 to-cinema-black/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-cinema-black/80 via-transparent to-transparent" />
        </div>

        {/* Bottom Gradient Blend - Creates smooth transition to page background */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none z-20" />

        {/* CINESCOPE Branding - Always visible */}
        <div className="absolute top-8 left-8 z-20">
          <h1 className="font-cinematic text-3xl md:text-4xl lg:text-5xl tracking-wide text-foreground">
            CINE<span className="text-cinema-red">SCOPE</span>
          </h1>
          <p className="text-muted-foreground text-sm md:text-base mt-2">
            Discover Movies Like Never Before
          </p>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 flex flex-col justify-center items-start h-full p-8 md:p-12 lg:p-20">
          {isLoading ? (
            <div className="animate-pulse">
              <div className="h-12 bg-muted rounded w-64 mb-4"></div>
              <div className="h-4 bg-muted rounded w-96 mb-2"></div>
              <div className="h-4 bg-muted rounded w-80 mb-6"></div>
              <div className="flex gap-4">
                <div className="h-10 bg-muted rounded w-32"></div>
                <div className="h-10 bg-muted rounded w-32"></div>
              </div>
            </div>
          ) : heroMovie ? (
            <>
              <h2 className="font-cinematic text-2xl md:text-3xl lg:text-4xl tracking-wide mb-4">
                {heroMovie.title}
              </h2>
              <p className="text-lg md:text-xl mb-6 line-clamp-3 md:line-clamp-4 max-w-2xl">
                {heroMovie.overview}
              </p>
              <div className="flex gap-4">
                {trailerKey ? (
                  <Button 
                    className="bg-cinema-red hover:bg-cinema-red/90"
                    onClick={handleWatchNow}
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Watch Trailer
                  </Button>
                ) : (
                  <Link to={`/movie/${heroMovie.id}`}>
                    <Button className="bg-cinema-red hover:bg-cinema-red/90">
                      <Play className="mr-2 h-4 w-4" />
                      Watch Now
                    </Button>
                  </Link>
                )}
                <Link to={`/movie/${heroMovie.id}`}>
                  <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
                    <Info className="mr-2 h-4 w-4" />
                    More Info
                  </Button>
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center">
              <h2 className="font-cinematic text-2xl md:text-3xl lg:text-4xl tracking-wide mb-4">
                Welcome to Your Movie Universe
              </h2>
              <p className="text-lg md:text-xl mb-6 max-w-2xl">
                Discover, save, and explore thousands of movies with personalized recommendations.
              </p>
              <Link to="/search">
                <Button className="bg-cinema-red hover:bg-cinema-red/90">
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
