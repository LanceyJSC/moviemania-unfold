import { useState, useEffect } from "react";
import { Play, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TrailerModal } from "@/components/TrailerModal";
import { tmdbService } from "@/lib/tmdb";
import { useNavigate } from "react-router-dom";
import heroBackdrop from "@/assets/hero-backdrop.jpg";

export const HeroSection = () => {
  const navigate = useNavigate();
  const [currentMovie, setCurrentMovie] = useState(0);
  const [showTrailer, setShowTrailer] = useState(false);
  const [isCarouselPaused, setIsCarouselPaused] = useState(false);
  const [featuredMovies, setFeaturedMovies] = useState([
    {
      id: 1,
      title: "Loading...",
      backdrop: heroBackdrop,
      description: "Discover amazing movies and shows",
      year: "2024",
      rating: "8.0",
      trailerKey: null as string | null
    }
  ]);

  useEffect(() => {
    const loadTrendingMovies = async () => {
      try {
        const response = await tmdbService.getTrendingMovies('day');
        const moviesWithTrailers = await Promise.all(
          response.results.slice(0, 5).map(async (movie) => {
            try {
              const movieDetails = await tmdbService.getMovieDetails(movie.id);
              const trailer = movieDetails.videos?.results.find(
                video => video.type === 'Trailer' && video.site === 'YouTube'
              );
              
              return {
                id: movie.id,
                title: movie.title,
                backdrop: tmdbService.getBackdropUrl(movie.backdrop_path),
                description: movie.overview,
                year: movie.release_date ? new Date(movie.release_date).getFullYear().toString() : '2024',
                rating: movie.vote_average.toFixed(1),
                trailerKey: trailer?.key || null
              };
            } catch (error) {
              console.error(`Failed to load trailer for movie ${movie.id}:`, error);
              return {
                id: movie.id,
                title: movie.title,
                backdrop: tmdbService.getBackdropUrl(movie.backdrop_path),
                description: movie.overview,
                year: movie.release_date ? new Date(movie.release_date).getFullYear().toString() : '2024',
                rating: movie.vote_average.toFixed(1),
                trailerKey: null
              };
            }
          })
        );
        setFeaturedMovies(moviesWithTrailers);
      } catch (error) {
        console.error('Failed to load trending movies:', error);
      }
    };
    loadTrendingMovies();
  }, []);

  useEffect(() => {
    if (isCarouselPaused) return;
    
    const timer = setInterval(() => {
      setCurrentMovie((prev) => (prev + 1) % featuredMovies.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [featuredMovies.length, isCarouselPaused]);

  const movie = featuredMovies[currentMovie];

  const handleWatchTrailer = () => {
    if (movie.trailerKey) {
      setIsCarouselPaused(true);
      setShowTrailer(true);
    }
  };

  const handleCloseTrailer = () => {
    setShowTrailer(false);
    setIsCarouselPaused(false);
  };

  const handleLearnMore = () => {
    navigate(`/movie/${movie.id}`);
  };

  return (
    <>
      <div className="relative overflow-hidden h-[75vh]">
        {/* Hero Background with Enhanced Gradients */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: `url(${movie.backdrop})`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-cinema-black via-cinema-black/80 to-cinema-black/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-cinema-black via-cinema-black/30 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-cinema-black/90" />
        </div>

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col">
          {/* Enhanced Header */}
          <header className="flex items-center justify-center p-6 bg-gradient-to-b from-cinema-black/60 to-transparent">
            <div className="text-center">
              <h1 className="font-cinematic text-foreground tracking-wider text-3xl mb-2">
                CINE<span className="text-cinema-red">SCOPE</span>
              </h1>
              <div className="w-16 h-0.5 bg-cinema-red mx-auto"></div>
            </div>
          </header>

          {/* Main Content */}
          <div className="flex-1 flex items-center justify-center px-6">
            <div className="max-w-4xl w-full text-center">
              {/* Enhanced Branding Section */}
              <div className="mb-12 animate-fade-in">
                <h2 className="font-cinematic text-foreground mb-6 text-4xl tracking-wide">
                  DISCOVER
                </h2>
                <div className="flex items-center justify-center space-x-8 mb-8">
                  <div className="w-8 h-px bg-cinema-gold"></div>
                  <span className="text-cinema-gold text-sm font-medium tracking-widest">CINEMA</span>
                  <div className="w-8 h-px bg-cinema-gold"></div>
                </div>
                <p className="text-muted-foreground mb-8 max-w-2xl mx-auto text-base px-4 leading-relaxed">
                  Your ultimate destination for movie discovery and entertainment. 
                  Explore trending films, save your favorites, and dive deep into cinema.
                </p>
              </div>

              {/* Enhanced Featured Movie Info */}
              <div className="animate-scale-in bg-gradient-to-t from-cinema-black/80 to-transparent rounded-2xl p-8 backdrop-blur-sm">
                <div className="flex items-center justify-center space-x-6 mb-6">
                  <div className="flex items-center space-x-2">
                    <span className="text-cinema-gold font-semibold text-lg">★</span>
                    <span className="text-cinema-gold font-semibold text-lg">{movie.rating}</span>
                  </div>
                  <div className="w-px h-4 bg-muted-foreground/30"></div>
                  <span className="text-muted-foreground text-base">{movie.year}</span>
                </div>
                
                <h3 className="font-cinematic text-foreground mb-6 tracking-wide text-2xl">
                  {movie.title}
                </h3>
                
                <p className="text-muted-foreground leading-relaxed max-w-2xl text-base mb-8 px-4 line-clamp-3">
                  {movie.description}
                </p>
                
                <div className="flex flex-col gap-4 px-4 max-w-md mx-auto">
                  <Button 
                    onClick={handleWatchTrailer}
                    disabled={!movie.trailerKey}
                    className={`font-semibold w-full py-4 text-base ${
                      movie.trailerKey 
                        ? 'bg-cinema-red hover:bg-cinema-red/90 text-white shadow-lg' 
                        : 'bg-muted text-muted-foreground cursor-not-allowed'
                    }`}
                  >
                    <Play className="mr-2 h-5 w-5" />
                    {movie.trailerKey ? 'Watch Trailer' : 'No Trailer Available'}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={handleLearnMore}
                    className="border-border hover:bg-card w-full py-4 text-base hover:border-cinema-red/50"
                  >
                    <Info className="mr-2 h-5 w-5" />
                    Learn More
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Movie Indicators */}
          <div className="flex justify-center space-x-3 pb-8">
            {featuredMovies.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentMovie(index)}
                className={`w-3 h-3 rounded-full ${
                  index === currentMovie
                    ? 'bg-cinema-red shadow-lg'
                    : 'bg-muted hover:bg-muted-foreground'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Trailer Modal */}
      <TrailerModal
        isOpen={showTrailer}
        onClose={handleCloseTrailer}
        trailerKey={movie.trailerKey || ''}
        movieTitle={movie.title}
      />
    </>
  );
};
