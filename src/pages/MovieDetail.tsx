import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Play, Heart, Plus, Star, Share, ArrowLeft, Loader2, Brain, Tv } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MovieCarousel } from "@/components/MovieCarousel";
import { MovieTrivia } from "@/components/MovieTrivia";
import { StreamingAvailability } from "@/components/StreamingAvailability";
import { tmdbService, Movie } from "@/lib/tmdb";
import { useSupabaseUserState } from "@/hooks/useSupabaseUserState";
import { useIsMobile } from "@/hooks/use-mobile";

const MovieDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
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
  const cast = movie.cast?.slice(0, 5).map(c => c.name).join(', ') || 'Cast information unavailable';

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className={`relative overflow-hidden ${isMobile ? 'h-[85vh]' : 'h-screen'}`}>
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${backdropUrl})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-cinema-black via-cinema-black/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-cinema-black via-transparent to-transparent" />
        </div>

        {/* Back Button */}
        <div className={`absolute top-6 left-6 z-10 ${isMobile ? 'top-4 left-4' : ''}`}>
          <Link to="/">
            <Button variant="ghost" size="sm" className="bg-cinema-charcoal/60 backdrop-blur-sm hover:bg-cinema-red">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>

        {/* Content */}
        <div className="relative z-10 h-full flex items-center">
          <div className={`container mx-auto ${isMobile ? 'px-4' : 'px-6'}`}>
            <div className={`flex items-center space-y-8 lg:space-y-0 lg:space-x-12 ${
              isMobile ? 'flex-col text-center lg:flex-row lg:text-left lg:items-end' : 'flex-col lg:flex-row lg:items-end'
            }`}>
              {/* Poster */}
              <div className="flex-shrink-0">
                <img 
                  src={posterUrl} 
                  alt={movie.title}
                  className={`rounded-lg shadow-cinematic ${
                    isMobile ? 'w-48 h-auto mx-auto lg:mx-0' : 'w-80 h-auto'
                  }`}
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
                  isMobile ? 'text-3xl lg:text-5xl' : 'text-5xl md:text-7xl'
                }`}>
                  {movie.title}
                </h1>

                <p className={`text-muted-foreground mb-6 max-w-2xl ${
                  isMobile ? 'text-base' : 'text-lg'
                }`}>
                  {genres}
                </p>

                <p className={`text-muted-foreground leading-relaxed max-w-3xl mb-8 ${
                  isMobile ? 'text-sm line-clamp-4' : 'text-lg'
                }`}>
                  {movie.overview}
                </p>

                {/* Cast */}
                <div className="mb-8">
                  <h3 className={`font-semibold text-foreground mb-2 ${isMobile ? 'text-lg' : 'text-xl'}`}>Cast</h3>
                  <p className={`text-muted-foreground ${isMobile ? 'text-sm line-clamp-2' : ''}`}>{cast}</p>
                </div>

                {/* Action Buttons */}
                <div className={`flex gap-4 mb-8 ${
                  isMobile ? 'flex-col sm:flex-row justify-center lg:justify-start' : 'flex-wrap justify-center lg:justify-start'
                }`}>
                  {trailerKey ? (
                    <Button 
                      className={`bg-cinema-red hover:bg-cinema-red/90 text-white font-semibold ${
                        isMobile ? 'w-full sm:w-auto px-6 py-3 text-base' : 'px-8 py-6 text-lg'
                      }`}
                      onClick={() => window.open(`https://www.youtube.com/watch?v=${trailerKey}`, '_blank')}
                    >
                      <Play className="mr-2 h-5 w-5" />
                      Watch Trailer
                    </Button>
                  ) : (
                    <Button className={`bg-cinema-red hover:bg-cinema-red/90 text-white font-semibold ${
                      isMobile ? 'w-full sm:w-auto px-6 py-3 text-base' : 'px-8 py-6 text-lg'
                    }`} disabled>
                      <Play className="mr-2 h-5 w-5" />
                      No Trailer Available
                    </Button>
                  )}
                  
                  <div className={`flex gap-2 ${isMobile ? 'justify-center' : ''}`}>
                    <Button 
                      variant="outline" 
                      className={`border-border hover:bg-card ${
                        isMovieLiked ? 'bg-cinema-red border-cinema-red text-white' : ''
                      } ${isMobile ? 'px-4 py-3' : 'px-6 py-6'}`}
                      onClick={() => toggleLike(movieId, movie.title, posterUrl)}
                    >
                      <Heart className={`h-5 w-5 ${isMovieLiked ? 'fill-current' : ''}`} />
                    </Button>

                    <Button 
                      variant="outline" 
                      className={`border-border hover:bg-card ${
                        isMovieInWatchlist ? 'bg-cinema-gold border-cinema-gold text-cinema-black' : ''
                      } ${isMobile ? 'px-4 py-3' : 'px-6 py-6'}`}
                      onClick={() => toggleWatchlist(movieId, movie.title, posterUrl)}
                    >
                      <Plus className="h-5 w-5" />
                    </Button>

                    <Button 
                      variant="outline" 
                      className={`border-border hover:bg-card ${isMobile ? 'px-4 py-3' : 'px-6 py-6'}`} 
                      onClick={handleShare}
                    >
                      <Share className="h-5 w-5" />
                    </Button>

                    <Button 
                      variant="outline" 
                      className={`border-border hover:bg-card ${isMobile ? 'px-4 py-3' : 'px-6 py-6'}`}
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
                      className="transition-colors p-1"
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
        {/* Streaming Availability */}
        <StreamingAvailability movieId={movieId} movieTitle={movie.title} />
        
        {/* Recommendations */}
        <MovieCarousel 
          title="YOU MIGHT ALSO LIKE" 
          category="popular"
          cardSize="medium"
        />
      </div>

      {/* Movie Trivia Modal */}
      {showTrivia && (
        <MovieTrivia 
          movie={movie} 
          isOpen={showTrivia} 
          onClose={() => setShowTrivia(false)} 
        />
      )}
    </div>
  );
};

export default MovieDetail;
