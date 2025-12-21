
import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Play, Info, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const isMobile = useIsMobile();
  const rotationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const { setIsTrailerOpen, setTrailerKey: setGlobalTrailerKey, setMovieTitle } = useTrailerContext();

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
        const moviesWithBackdrops = trending.results
          .filter(movie => movie.backdrop_path)
          .slice(0, 5);
        console.log('Movies with backdrops:', moviesWithBackdrops.length);
        
        const movieDetailsPromises = moviesWithBackdrops.map(async (movie) => {
          try {
            return await tmdbService.getMovieDetails(movie.id, fresh);
          } catch (detailError) {
            console.error('Failed to load movie details for:', movie.id, detailError);
            return movie;
          }
        });
        
        const movieDetails = await Promise.all(movieDetailsPromises);
        console.log('Movie details loaded:', movieDetails.length);
        
        setHeroMovies(movieDetails.filter(Boolean));
        
        const trailerKeysArray = movieDetails.map(movie => {
          const trailer = movie?.videos?.results.find(
            video => video.type === 'Trailer' && video.site === 'YouTube'
          );
          return trailer ? trailer.key : null;
        });
        setTrailerKeys(trailerKeysArray);
        
        if (fresh) {
          setCurrentIndex(0);
        }
        
        setLastUpdated(new Date());
        console.log('🎬 Hero Section: Content refreshed at', new Date().toLocaleTimeString());
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

  const startRotation = (movieCount: number) => {
    if (rotationIntervalRef.current) {
      clearInterval(rotationIntervalRef.current);
    }
    
    if (movieCount <= 1) return;
    
    // Fixed 5 second interval for all devices
    rotationIntervalRef.current = setInterval(() => {
      setCurrentIndex(prevIndex => {
        const newIndex = prevIndex >= movieCount - 1 ? 0 : prevIndex + 1;
        console.log('Hero rotation tick, new index:', newIndex);
        return newIndex;
      });
    }, 5000);
  };

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

  useEffect(() => {
    if (heroMovies.length > 1 && !error) {
      // Always start rotation - don't pause based on isPaused for touch devices
      // The isPaused state is only set by mouse events which don't apply to touch
      console.log('Starting hero rotation, movies:', heroMovies.length);
      startRotation(heroMovies.length);
    }
    
    return () => stopRotation();
  }, [heroMovies.length, error]);

  useEffect(() => {
    if (!error) {
      refreshIntervalRef.current = setInterval(() => {
        console.log('🎬 Hero Section: Auto-refreshing trending movies...');
        loadHeroMovies(true);
      }, 1200000);
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [error]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && lastUpdated) {
        const timeSinceUpdate = Date.now() - lastUpdated.getTime();
        if (timeSinceUpdate > 900000) {
          console.log('🎬 Hero Section: Refreshing on visibility change');
          loadHeroMovies(true);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [lastUpdated]);

  const handleManualRefresh = () => {
    console.log('🎬 Hero Section: Manual refresh triggered');
    setError(null);
    loadHeroMovies(true);
  };

  const goToSlide = (index: number) => {
    if (index >= 0 && index < heroMovies.length) {
      setCurrentIndex(index);
      if (heroMovies.length > 1) {
        startRotation(heroMovies.length);
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
    if (currentTrailerKey && heroMovie) {
      setGlobalTrailerKey(currentTrailerKey);
      setMovieTitle(heroMovie.title);
      setIsTrailerOpen(true);
    }
  };

  // Error state
  if (error && !isRefreshing) {
    return (
      <div 
        className="relative text-foreground overflow-hidden bg-gradient-to-br from-cinema-black via-cinema-charcoal to-cinema-black aspect-video md:h-[50vh] md:aspect-auto"
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

  const heroMovie = heroMovies[currentIndex];
  const heroBackdrop = heroMovie ? tmdbService.getBackdropUrl(heroMovie.backdrop_path, 'original') : null;
  const currentTrailerKey = trailerKeys[currentIndex];

  return (
    <>
      <div className="md:max-w-7xl md:mx-auto md:px-6 md:pt-6">
        <div 
          className="relative text-foreground overflow-hidden group md:rounded-2xl aspect-video md:h-[50vh] md:aspect-auto"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
        {/* Hero Background */}
        {heroBackdrop ? (
          <img 
            src={heroBackdrop}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            style={{ backgroundColor: 'hsl(var(--background))' }}
          />
        ) : (
          <div 
            className="absolute inset-0"
            style={{ background: 'linear-gradient(135deg, hsl(var(--cinema-black)), hsl(var(--cinema-charcoal)))' }}
          />
        )}
        
        {/* Gradient Overlays - matching FeaturedHero */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        
        {/* Bottom gradient blend */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none" />

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

        {/* Hero Content - with desktop centering */}
        <div className="relative h-full flex flex-col justify-end px-4 md:px-6 pb-6 md:pb-8 max-w-7xl mx-auto w-full">
          {isLoading ? (
            <div className="max-w-2xl animate-pulse space-y-3">
              <div className="h-6 bg-muted/60 rounded w-32 mb-4"></div>
              <div className="h-8 bg-muted/60 rounded-lg w-3/4"></div>
              <div className="flex gap-3">
                <div className="h-4 bg-muted/40 rounded w-16"></div>
                <div className="h-4 bg-muted/40 rounded w-16"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-muted/40 rounded w-full"></div>
                <div className="h-4 bg-muted/40 rounded w-5/6"></div>
              </div>
              <div className="flex gap-3 pt-2">
                <div className="h-12 bg-muted/60 rounded-xl w-32"></div>
                <div className="h-12 bg-muted/40 rounded-xl w-28"></div>
              </div>
            </div>
          ) : heroMovie ? (
            <div className="max-w-2xl">
              {/* Title */}
              <h1 className="font-cinematic text-xl sm:text-2xl md:text-3xl lg:text-4xl text-white mb-2 sm:mb-4 tracking-wide leading-tight uppercase">
                {heroMovie.title}
              </h1>
              
              {/* Overview */}
              <p className="text-white/90 text-sm sm:text-base leading-relaxed mb-4 line-clamp-2 sm:line-clamp-3">
                {heroMovie.overview}
              </p>
              
              {/* Action Buttons */}
              <div className="flex gap-3">
                {currentTrailerKey ? (
                  <Button 
                    className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-12 px-4 sm:px-6 font-medium"
                    onClick={handleWatchNow}
                  >
                    <Play className="mr-2 h-4 w-4" />
                    <span className="hidden xs:inline">Watch Trailer</span>
                    <span className="xs:hidden">Trailer</span>
                  </Button>
                ) : (
                  <Link to={`/movie/${heroMovie.id}`}>
                    <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-12 px-4 sm:px-6 font-medium">
                      <Play className="mr-2 h-4 w-4" />
                      <span className="hidden xs:inline">Watch Trailer</span>
                      <span className="xs:hidden">Trailer</span>
                    </Button>
                  </Link>
                )}
                <Link to={`/movie/${heroMovie.id}`}>
                  <Button 
                    variant="outline" 
                    className="border-foreground/30 text-foreground bg-background/20 backdrop-blur-sm hover:bg-background/40 rounded-xl h-12 px-4 sm:px-6"
                  >
                    <Info className="mr-2 h-4 w-4" />
                    More Info
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="max-w-2xl text-center space-y-4">
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

          {/* Slide indicators - larger touch targets */}
          {heroMovies.length > 1 && (
            <div className="flex justify-center space-x-3 mt-6">
              {heroMovies.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`h-3 rounded-full transition-all duration-300 touch-manipulation ${
                    index === currentIndex 
                      ? 'bg-primary w-8' 
                      : 'bg-foreground/30 hover:bg-foreground/50 w-3'
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
      </div>
    </>
  );
};
