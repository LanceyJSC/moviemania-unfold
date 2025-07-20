
import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Play, Info, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TrailerModal } from "@/components/TrailerModal";
import { tmdbService, Movie } from "@/lib/tmdb";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTrailerContext } from "@/contexts/TrailerContext";

export const HeroSection = () => {
  const [heroMovies, setHeroMovies] = useState<Movie[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trailerKeys, setTrailerKeys] = useState<(string | null)[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  
  const isMobile = useIsMobile();
  const rotationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Safe context usage with fallback
  let isTrailerOpen = false;
  let setIsTrailerOpen = (_open: boolean) => {};
  
  try {
    const trailerContext = useTrailerContext();
    isTrailerOpen = trailerContext.isTrailerOpen;
    setIsTrailerOpen = trailerContext.setIsTrailerOpen;
  } catch (contextError) {
    console.warn('TrailerContext not available:', contextError);
  }

  const loadHeroMovies = async (fresh: boolean = false) => {
    console.log('Loading hero movies, fresh:', fresh);
    
    if (fresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    
    setError(null);
    
    try {
      const trending = await tmdbService.getTrendingMovies('week', fresh);
      console.log('Trending movies loaded:', trending.results?.length || 0);
      
      if (trending.results && trending.results.length > 0) {
        // Get the first 5 movies with backdrop images
        const moviesWithBackdrops = trending.results
          .filter(movie => movie.backdrop_path)
          .slice(0, 5);
        console.log('Movies with backdrops:', moviesWithBackdrops.length);
        
        // Get full movie details including videos for each movie
        const movieDetailsPromises = moviesWithBackdrops.map(async (movie) => {
          try {
            return await tmdbService.getMovieDetails(movie.id, fresh);
          } catch (detailError) {
            console.error('Failed to load movie details for:', movie.id, detailError);
            return movie; // Return basic movie data if details fail
          }
        });
        
        const movieDetails = await Promise.all(movieDetailsPromises);
        console.log('Movie details loaded:', movieDetails.length);
        
        setHeroMovies(movieDetails.filter(Boolean)); // Filter out any null results
        
        // Extract trailer keys for all movies
        const trailerKeysArray = movieDetails.map(movie => {
          const trailer = movie?.videos?.results.find(
            video => video.type === 'Trailer' && video.site === 'YouTube'
          );
          return trailer ? trailer.key : null;
        });
        setTrailerKeys(trailerKeysArray);
        
        // Reset to first movie if we have new data
        if (fresh) {
          setCurrentIndex(0);
        }
      } else {
        throw new Error('No trending movies found');
      }
    } catch (error) {
      console.error("Failed to load hero movies:", error);
      setError(error instanceof Error ? error.message : 'Failed to load movies');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Start rotation interval
  const startRotation = () => {
    if (rotationIntervalRef.current) {
      clearInterval(rotationIntervalRef.current);
    }
    
    rotationIntervalRef.current = setInterval(() => {
      if (!isPaused && heroMovies.length > 1) {
        setCurrentIndex(prevIndex => 
          prevIndex >= heroMovies.length - 1 ? 0 : prevIndex + 1
        );
      }
    }, 6000); // 6 seconds per slide
  };

  // Stop rotation interval
  const stopRotation = () => {
    if (rotationIntervalRef.current) {
      clearInterval(rotationIntervalRef.current);
      rotationIntervalRef.current = null;
    }
  };

  useEffect(() => {
    loadHeroMovies();
    
    return () => {
      stopRotation();
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  // Start rotation when we have movies
  useEffect(() => {
    if (heroMovies.length > 1 && !error) {
      startRotation();
    }
    
    return () => stopRotation();
  }, [heroMovies.length, isPaused, error]);

  // Periodic refresh every hour with more aggressive cache busting
  useEffect(() => {
    if (!error) {
      refreshIntervalRef.current = setInterval(() => {
        console.log('Auto-refreshing hero movies...');
        loadHeroMovies(true);
      }, 3600000); // 1 hour in milliseconds
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [error]);

  // Manual refresh function
  const handleManualRefresh = () => {
    console.log('Manual refresh triggered');
    setError(null);
    loadHeroMovies(true);
  };

  // Navigation functions
  const goToSlide = (index: number) => {
    if (index >= 0 && index < heroMovies.length) {
      setCurrentIndex(index);
      // Restart rotation after manual navigation
      if (heroMovies.length > 1) {
        startRotation();
      }
    }
  };

  const goToPrevious = () => {
    const newIndex = currentIndex === 0 ? heroMovies.length - 1 : currentIndex - 1;
    goToSlide(newIndex);
  };

  const goToNext = () => {
    const newIndex = currentIndex >= heroMovies.length - 1 ? 0 : currentIndex + 1;
    goToSlide(newIndex);
  };

  const handleWatchNow = () => {
    const currentTrailerKey = trailerKeys[currentIndex];
    if (currentTrailerKey && setIsTrailerOpen) {
      setIsTrailerOpen(true);
    }
  };

  const handleCloseTrailer = () => {
    if (setIsTrailerOpen) {
      setIsTrailerOpen(false);
    }
  };

  // Error state
  if (error && !isRefreshing) {
    return (
      <div 
        className="relative text-foreground overflow-hidden bg-gradient-to-br from-cinema-black via-cinema-charcoal to-cinema-black"
        style={{ 
          height: '50vh',
          minHeight: '400px',
          maxHeight: '600px'
        }}
      >
        <div className="relative z-10 flex flex-col justify-center items-center h-full px-6 text-center">
          <AlertCircle className="h-12 w-12 text-cinema-red mb-4" />
          <h2 className="font-cinematic text-xl text-foreground mb-2">
            Unable to Load Featured Content
          </h2>
          <p className="text-muted-foreground mb-4 max-w-md">
            We're having trouble connecting to our movie database. Please try refreshing.
          </p>
          <Button
            onClick={handleManualRefresh}
            className="bg-cinema-red hover:bg-cinema-red/90"
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Always show the hero section, even when loading
  const heroMovie = heroMovies[currentIndex];
  const heroBackdrop = heroMovie ? tmdbService.getBackdropUrl(heroMovie.backdrop_path, 'original') : null;
  const currentTrailerKey = trailerKeys[currentIndex];

  return (
    <>
      <div 
        className="relative text-foreground overflow-hidden"
        style={{ 
          height: 'clamp(350px, 45vh, 500px)', // iPhone-optimized height
          minHeight: '350px', // Smaller for iPhone screens
          maxHeight: '500px'  // More compact for mobile
        }}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Hero Background - Mobile optimized with smooth transitions */}
        <div 
          className="absolute inset-0 bg-contain bg-center bg-no-repeat transition-all duration-1000 ease-in-out"
          style={{ 
            backgroundImage: heroBackdrop ? `url(${heroBackdrop})` : 'linear-gradient(135deg, hsl(var(--cinema-black)), hsl(var(--cinema-charcoal)))',
            backgroundColor: 'hsl(var(--background))'
          }}
        >
          {/* Mobile-optimized overlays */}
          <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/40 to-background/80" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/60 via-transparent to-background/20" />
        </div>

        {/* iOS-style safe area top spacing with refresh button */}
        <div 
          className="absolute top-0 left-0 right-0 z-20 px-6 flex justify-between items-start"
          style={{ 
            paddingTop: 'max(env(safe-area-inset-top), 16px)',
            marginTop: '8px'
          }}
        >
          <div>
            <h1 className="font-cinematic text-2xl sm:text-3xl tracking-wide text-foreground">
              CINE<span className="text-cinema-red">SCOPE</span>
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Discover Movies Like Never Before
            </p>
          </div>
          
          {/* Manual refresh button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="h-8 w-8 p-0 bg-background/20 backdrop-blur-sm hover:bg-background/40 text-foreground"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Navigation arrows for desktop */}
        {heroMovies.length > 1 && !isMobile && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 h-12 w-12 p-0 bg-background/20 backdrop-blur-sm hover:bg-background/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 h-12 w-12 p-0 bg-background/20 backdrop-blur-sm hover:bg-background/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          </>
        )}

        {/* Hero Content - Mobile-first layout */}
        <div className="relative z-10 flex flex-col justify-end h-full px-6 pb-8">
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
            <div className="space-y-4 transition-all duration-500 ease-in-out">
              <div>
                <h2 className="font-cinematic text-xl sm:text-2xl tracking-wide text-foreground mb-2">
                  {heroMovie.title}
                </h2>
                <p className="text-sm sm:text-base text-foreground/90 line-clamp-3 leading-relaxed">
                  {heroMovie.overview}
                </p>
              </div>
              
              <div className="flex gap-3 pt-2">
                {currentTrailerKey ? (
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

          {/* Slide indicators */}
          {heroMovies.length > 1 && (
            <div className="flex justify-center space-x-2 mt-6">
              {heroMovies.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentIndex 
                      ? 'bg-primary w-6' 
                      : 'bg-foreground/30 hover:bg-foreground/50'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Loading indicator for refresh */}
        {isRefreshing && (
          <div className="absolute top-16 right-6 z-30">
            <div className="bg-background/80 backdrop-blur-sm rounded-lg px-3 py-2 text-sm text-foreground flex items-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Refreshing...
            </div>
          </div>
        )}
      </div>

      {/* Trailer Modal */}
      {isTrailerOpen && currentTrailerKey && heroMovie && (
        <TrailerModal
          isOpen={isTrailerOpen}
          onClose={handleCloseTrailer}
          trailerKey={currentTrailerKey}
          movieTitle={heroMovie.title}
        />
      )}
    </>
  );
};
