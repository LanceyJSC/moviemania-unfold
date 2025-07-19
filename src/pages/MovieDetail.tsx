
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Play, Heart, Plus, Star, Share, ArrowLeft, Loader2, Brain, Tv } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MovieCarousel } from "@/components/MovieCarousel";
import { MovieTrivia } from "@/components/MovieTrivia";
import { StreamingAvailability } from "@/components/StreamingAvailability";
import { tmdbService, Movie } from "@/lib/tmdb";
import { useUserState } from "@/hooks/useUserState";

const MovieDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [showTrivia, setShowTrivia] = useState(false);
  const {
    toggleLike,
    toggleWatchlist,
    setRating,
    isLiked,
    isInWatchlist,
    getRating
  } = useUserState();

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
      <div className="relative h-screen overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${backdropUrl})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-cinema-black via-cinema-black/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-cinema-black via-transparent to-transparent" />
        </div>

        {/* Back Button */}
        <div className="absolute top-6 left-6 z-10">
          <Link to="/">
            <Button variant="ghost" size="sm" className="bg-cinema-charcoal/60 backdrop-blur-sm hover:bg-cinema-red">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>

        {/* Content */}
        <div className="relative z-10 h-full flex items-center">
          <div className="container mx-auto px-6">
            <div className="flex flex-col lg:flex-row items-center lg:items-end space-y-8 lg:space-y-0 lg:space-x-12">
              {/* Poster */}
              <div className="flex-shrink-0">
                <img 
                  src={posterUrl} 
                  alt={movie.title}
                  className="w-80 h-auto rounded-lg shadow-cinematic"
                />
              </div>

              {/* Movie Info */}
              <div className="flex-1 text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start space-x-4 mb-4">
                  <span className="text-cinema-gold text-xl font-semibold">★ {movie.vote_average.toFixed(1)}</span>
                  <span className="text-muted-foreground">{releaseYear}</span>
                  <span className="text-muted-foreground">{runtime}</span>
                </div>

                <h1 className="text-5xl md:text-7xl font-cinematic text-foreground mb-4 tracking-wide">
                  {movie.title}
                </h1>

                <p className="text-lg text-muted-foreground mb-6 max-w-2xl">
                  {genres}
                </p>

                <p className="text-lg text-muted-foreground mb-8 max-w-3xl leading-relaxed">
                  {movie.overview}
                </p>

                {/* Cast */}
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-foreground mb-2">Cast</h3>
                  <p className="text-muted-foreground">{cast}</p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap justify-center lg:justify-start gap-4 mb-8">
                  {trailerKey ? (
                    <Button 
                      className="bg-cinema-red hover:bg-cinema-red/90 text-white px-8 py-6 text-lg font-semibold"
                      onClick={() => window.open(`https://www.youtube.com/watch?v=${trailerKey}`, '_blank')}
                    >
                      <Play className="mr-2 h-5 w-5" />
                      Watch Trailer
                    </Button>
                  ) : (
                    <Button className="bg-cinema-red hover:bg-cinema-red/90 text-white px-8 py-6 text-lg font-semibold" disabled>
                      <Play className="mr-2 h-5 w-5" />
                      No Trailer Available
                    </Button>
                  )}
                  
                  <Button 
                    variant="outline" 
                    className={`border-border hover:bg-card px-6 py-6 ${isMovieLiked ? 'bg-cinema-red border-cinema-red text-white' : ''}`}
                    onClick={() => toggleLike(movieId)}
                  >
                    <Heart className={`h-5 w-5 ${isMovieLiked ? 'fill-current' : ''}`} />
                  </Button>

                  <Button 
                    variant="outline" 
                    className={`border-border hover:bg-card px-6 py-6 ${isMovieInWatchlist ? 'bg-cinema-gold border-cinema-gold text-cinema-black' : ''}`}
                    onClick={() => toggleWatchlist(movieId)}
                  >
                    <Plus className="h-5 w-5" />
                  </Button>

                  <Button variant="outline" className="border-border hover:bg-card px-6 py-6" onClick={handleShare}>
                    <Share className="h-5 w-5" />
                  </Button>

                  <Button 
                    variant="outline" 
                    className="border-border hover:bg-card px-6 py-6"
                    onClick={() => setShowTrivia(true)}
                  >
                    <Brain className="h-5 w-5" />
                  </Button>
                </div>

                {/* Rating */}
                <div className="flex items-center justify-center lg:justify-start space-x-2">
                  <span className="text-foreground">Your Rating:</span>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(movieId, star)}
                      className="transition-colors"
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
      <div className="container mx-auto px-6 py-16 space-y-16">
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
