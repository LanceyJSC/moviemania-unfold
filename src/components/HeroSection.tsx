
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

  useEffect(() => {
    const loadHeroMovies = async () => {
      try {
        const trending = await tmdbService.getTrendingMovies();
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

    loadHeroMovies();
  }, []);

  // Auto-rotate hero images every 5 seconds
  useEffect(() => {
    if (heroMovies.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => {
          const nextIndex = (prev + 1) % heroMovies.length;
          // Update trailer key for the new movie
          const nextMovie = heroMovies[nextIndex];
          const trailer = nextMovie?.videos?.results.find(
            video => video.type === 'Trailer' && video.site === 'YouTube'
          );
          setTrailerKey(trailer?.key || null);
          return nextIndex;
        });
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [heroMovies]);

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
      <div className="relative h-[60vh] md:h-[75vh] lg:h-[90vh] text-foreground">
        {/* Hero Background with lighter overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: heroBackdrop ? `url(${heroBackdrop})` : 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-cinema-black/50 via-cinema-black/30 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-cinema-black/60 via-transparent to-transparent" />
        </div>

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
