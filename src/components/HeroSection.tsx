
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
    const timer = setInterval(() => {
      setCurrentMovie((prev) => (prev + 1) % featuredMovies.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [featuredMovies.length]);

  const movie = featuredMovies[currentMovie];

  const handleWatchTrailer = () => {
    if (movie.trailerKey) {
      setShowTrailer(true);
    }
  };

  const handleLearnMore = () => {
    navigate(`/movie/${movie.id}`);
  };

  return (
    <>
      <div className="relative overflow-hidden h-[70vh]">
        {/* Hero Background */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-all duration-1000"
          style={{ 
            backgroundImage: `url(${movie.backdrop})`,
            backgroundBlendMode: 'overlay'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-cinema-black via-cinema-black/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-cinema-black via-transparent to-transparent" />
        </div>

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col">
          {/* Mobile Header - Only Branding */}
          <header className="flex items-center justify-center p-4">
            <h1 className="font-cinematic text-foreground tracking-wider text-2xl">
              CINE<span className="text-cinema-red">SCOPE</span>
            </h1>
          </header>

          {/* Main Content */}
          <div className="flex-1 flex items-center justify-center px-4">
            <div className="max-w-4xl w-full text-center">
              {/* Branding Section */}
              <div className="mb-8 animate-fade-in">
                <h2 className="font-cinematic text-foreground mb-4 text-3xl tracking-wide">
                  DISCOVER
                </h2>
                <p className="text-muted-foreground mb-8 max-w-2xl mx-auto text-sm px-2">
                  Your ultimate destination for movie discovery and entertainment
                </p>
              </div>

              {/* Featured Movie Info */}
              <div className="animate-scale-in">
                <div className="flex items-center justify-center space-x-4 mb-4">
                  <span className="text-cinema-gold font-semibold text-base">★ {movie.rating}</span>
                  <span className="text-muted-foreground text-sm">{movie.year}</span>
                </div>
                <h3 className="font-cinematic text-foreground mb-4 tracking-wide text-xl">
                  {movie.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed max-w-2xl text-sm mb-6 px-4 line-clamp-3">
                  {movie.description}
                </p>
                <div className="flex flex-col gap-3 px-4">
                  <Button 
                    onClick={handleWatchTrailer}
                    disabled={!movie.trailerKey}
                    className={`font-semibold w-full py-3 text-base transition-all duration-200 active:scale-95 ${
                      movie.trailerKey 
                        ? 'bg-cinema-red hover:bg-cinema-red/90 text-white' 
                        : 'bg-muted text-muted-foreground cursor-not-allowed'
                    }`}
                  >
                    <Play className="mr-2 h-5 w-5" />
                    {movie.trailerKey ? 'Watch Trailer' : 'No Trailer Available'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleLearnMore}
                    className="border-border hover:bg-card w-full py-3 text-base transition-all duration-200 active:scale-95"
                  >
                    <Info className="mr-2 h-5 w-5" />
                    Learn More
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Movie Indicators */}
          <div className="flex justify-center space-x-2 pb-6">
            {featuredMovies.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentMovie(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 active:scale-125 ${
                  index === currentMovie
                    ? 'bg-cinema-red shadow-glow scale-125'
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
        onClose={() => setShowTrailer(false)}
        trailerKey={movie.trailerKey || ''}
        movieTitle={movie.title}
      />
    </>
  );
};
