
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Play, Heart, Plus, Star, Share, Loader2, Brain, Tv } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MovieCarousel } from "@/components/MovieCarousel";
import { MovieTrivia } from "@/components/MovieTrivia";
import { StreamingAvailability } from "@/components/StreamingAvailability";
import { ActorCard } from "@/components/ActorCard";
import { Navigation } from "@/components/Navigation";
import { TrailerModal } from "@/components/TrailerModal";
import { tmdbService, Movie } from "@/lib/tmdb";
import { useSupabaseUserState } from "@/hooks/useSupabaseUserState";
import { useIsMobile } from "@/hooks/use-mobile";

const MovieDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [showTrailer, setShowTrailer] = useState(false);
  const [showTrivia, setShowTrivia] = useState(false);
  const isMobile = useIsMobile();
  const {
    toggleLike,
    toggleWatchlist,
    setRating,
    isLiked,
    isInWatchlist,
    getRating
  } = useSupabaseUserState();

  const movieId = Number(id);
  const isMovieLiked = isLiked(movieId);
  const isMovieInWatchlist = isInWatchlist(movieId);
  const userRating = getRating(movieId);

  useEffect(() => {
    const loadMovieDetails = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        const movieData = await tmdbService.getMovieDetails(Number(id));
        setMovie(movieData);
        
        // Find trailer
        const trailer = movieData.videos?.results.find(
          video => video.type === 'Trailer' && video.site === 'YouTube'
        );
        if (trailer) {
          setTrailerKey(trailer.key);
        }
      } catch (error) {
        console.error('Failed to load movie details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMovieDetails();
  }, [id]);

  const handleShare = async () => {
    if (navigator.share && movie) {
      try {
        await navigator.share({
          title: movie.title,
          text: `Check out ${movie.title} on CineScope!`,
          url: window.location.href,
        });
      } catch (error) {
        // Fallback to copying URL
        navigator.clipboard.writeText(window.location.href);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleWatchTrailer = () => {
    if (trailerKey) {
      setShowTrailer(true);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cinema-red" />
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Movie not found</h1>
          <Link to="/">
            <Button>Back to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const backdropUrl = tmdbService.getBackdropUrl(movie.backdrop_path, 'original');
  const posterUrl = tmdbService.getPosterUrl(movie.poster_path, 'w500');
  const releaseYear = movie.release_date ? new Date(movie.release_date).getFullYear() : 'TBA';
  const runtime = movie.runtime ? `${movie.runtime} min` : 'Unknown';
  const genres = movie.genres?.map(g => g.name).join(', ') || 'Unknown';
  
  // Fixed cast and crew data access
  const cast = movie.credits?.cast?.slice(0, 8) || [];
  const director = movie.credits?.crew?.find(person => person.job === 'Director');
  const producer = movie.credits?.crew?.find(person => person.job === 'Producer');

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hero Section - Fixed height for mobile */}
      <div className={`relative overflow-hidden ${isMobile ? 'h-[75vh]' : 'h-screen'}`}>
        
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${backdropUrl})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-cinema-black via-cinema-black/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-cinema-black via-transparent to-transparent" />
        </div>

        {/* Content */}
        <div className="relative z-10 h-full flex items-center">
          <div className={`container mx-auto ${isMobile ? 'px-4 pt-8' : 'px-6'}`}>
            <div className={`flex items-center space-y-6 lg:space-y-0 lg:space-x-12 ${
              isMobile ? 'flex-col text-center lg:flex-row lg:text-left lg:items-end' : 'flex-col lg:flex-row lg:items-end'
            }`}>
              {/* Poster - Adjusted size for mobile */}
              <div className="flex-shrink-0">
                <img 
                  src={posterUrl} 
                  alt={movie.title}
                  className={`rounded-lg shadow-cinematic ${
                    isMobile ? 'w-40 h-60 mx-auto lg:mx-0' : 'w-80 h-auto'
                  } object-cover`}
                />
              </div>

              {/* Movie Info */}
              <div className="flex-1">
                <div className={`flex items-center space-x-4 mb-4 ${
                  isMobile ? 'justify-center lg:justify-start' : 'justify-center lg:justify-start'
                }`}>
                  <span className={`text-cinema-gold font-semibold ${isMobile ? 'text-lg' : 'text-xl'}`}>★ {movie.vote_average.toFixed(1)}</span>
                  <span className="text-muted-foreground">{releaseYear}</span>
                  <span className="text-muted-foreground">{runtime}</span>
                </div>

                <h1 className={`font-cinematic text-foreground mb-4 tracking-wide ${
                  isMobile ? 'text-2xl lg:text-5xl' : 'text-5xl md:text-7xl'
                }`}>
                  {movie.title}
                </h1>

                <p className={`text-muted-foreground mb-4 max-w-2xl ${
                  isMobile ? 'text-base' : 'text-lg'
                }`}>
                  {genres}
                </p>

                <p className={`text-muted-foreground leading-relaxed max-w-3xl mb-6 ${
                  isMobile ? 'text-sm line-clamp-3' : 'text-lg'
                }`}>
                  {movie.overview}
                </p>

                {/* Director and Producer */}
                <div className="mb-6">
                  <div className="flex flex-wrap gap-6">
                    {director && (
                      <div>
                        <h4 className="font-semibold text-foreground text-sm">Director</h4>
                        <p className="text-muted-foreground text-sm">{director.name}</p>
                      </div>
                    )}
                    {producer && (
                      <div>
                        <h4 className="font-semibold text-foreground text-sm">Producer</h4>
                        <p className="text-muted-foreground text-sm">{producer.name}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className={`flex gap-4 mb-6 ${
                  isMobile ? 'flex-col sm:flex-row justify-center lg:justify-start' : 'flex-wrap justify-center lg:justify-start'
                }`}>
                  {trailerKey ? (
                    <Button 
                      className={`bg-cinema-red hover:bg-cinema-red/90 text-white font-semibold touch-target ${
                        isMobile ? 'w-full sm:w-auto px-6 py-3 text-base min-h-[44px]' : 'px-8 py-6 text-lg'
                      }`}
                      onClick={handleWatchTrailer}
                    >
                      <Play className="mr-2 h-5 w-5" />
                      Watch Trailer
                    </Button>
                  ) : (
                    <Button className={`bg-cinema-red hover:bg-cinema-red/90 text-white font-semibold touch-target ${
                      isMobile ? 'w-full sm:w-auto px-6 py-3 text-base min-h-[44px]' : 'px-8 py-6 text-lg'
                    }`} disabled>
                      <Play className="mr-2 h-5 w-5" />
                      No Trailer Available
                    </Button>
                  )}
                  
                  <div className={`flex gap-2 ${isMobile ? 'justify-center' : ''}`}>
                    <Button 
                      variant="outline" 
                      className={`border-border hover:bg-card touch-target ${
                        isMovieLiked ? 'bg-cinema-red border-cinema-red text-white' : ''
                      } ${isMobile ? 'px-4 py-3 min-h-[44px] min-w-[44px]' : 'px-6 py-6'}`}
                      onClick={() => toggleLike(movieId, movie.title, posterUrl)}
                    >
                      <Heart className={`h-5 w-5 ${isMovieLiked ? 'fill-current' : ''}`} />
                    </Button>

                    <Button 
                      variant="outline" 
                      className={`border-border hover:bg-card touch-target ${
                        isMovieInWatchlist ? 'bg-cinema-gold border-cinema-gold text-cinema-black' : ''
                      } ${isMobile ? 'px-4 py-3 min-h-[44px] min-w-[44px]' : 'px-6 py-6'}`}
                      onClick={() => toggleWatchlist(movieId, movie.title, posterUrl)}
                    >
                      <Plus className="h-5 w-5" />
                    </Button>

                    <Button 
                      variant="outline" 
                      className={`border-border hover:bg-card touch-target ${isMobile ? 'px-4 py-3 min-h-[44px] min-w-[44px]' : 'px-6 py-6'}`} 
                      onClick={handleShare}
                    >
                      <Share className="h-5 w-5" />
                    </Button>

                    <Button 
                      variant="outline" 
                      className={`border-border hover:bg-card touch-target ${isMobile ? 'px-4 py-3 min-h-[44px] min-w-[44px]' : 'px-6 py-6'}`}
                      onClick={() => setShowTrivia(true)}
                    >
                      <Brain className="h-5 w-5" />
                    </Button>
                  </div>
                </div>

                {/* Rating */}
                <div className={`flex items-center space-x-2 ${
                  isMobile ? 'justify-center lg:justify-start' : 'justify-center lg:justify-start'
                }`}>
                  <span className="text-foreground">Your Rating:</span>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(movieId, star, movie.title)}
                      className="touch-target p-2"
                    >
                      <Star 
                        className={`h-6 w-6 ${star <= userRating ? 'text-cinema-gold fill-current' : 'text-muted-foreground'}`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Content */}
      <div className={`container mx-auto py-16 space-y-16 ${isMobile ? 'px-4' : 'px-6'}`}>
        {/* Enhanced Cast Section */}
        {cast.length > 0 && (
          <div>
            <h2 className="text-3xl font-cinematic text-foreground mb-8 tracking-wide">
              CAST
            </h2>
            <div className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4">
              {cast.map((actor) => (
                <ActorCard key={actor.id} actor={actor} />
              ))}
            </div>
          </div>
        )}
        
        {/* Streaming Availability */}
        <StreamingAvailability movieId={movieId} movieTitle={movie.title} />
        
        {/* Recommendations */}
        <MovieCarousel 
          title="YOU MIGHT ALSO LIKE" 
          category="popular"
          cardSize="medium"
        />
      </div>

      {/* Trailer Modal */}
      {showTrailer && (
        <TrailerModal 
          isOpen={showTrailer} 
          onClose={() => setShowTrailer(false)} 
          trailerKey={trailerKey || ''} 
          movieTitle={movie.title} 
        />
      )}

      {/* Movie Trivia Modal */}
      {showTrivia && (
        <MovieTrivia 
          movie={movie} 
          isOpen={showTrivia} 
          onClose={() => setShowTrivia(false)} 
        />
      )}

      {/* Mobile Navigation */}
      <Navigation />
    </div>
  );
};

export default MovieDetail;
