import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Play, Heart, Plus, Loader2, MoreHorizontal, BookOpen, Eye, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FunFacts } from "@/components/FunFacts";
import { LogMediaModal } from "@/components/LogMediaModal";
import { RatingComparisonCard } from "@/components/RatingComparisonCard";
import { WatchProviders } from "@/components/WatchProviders";
import { SimilarContent } from "@/components/SimilarContent";
import { MovieCollectionBanner } from "@/components/MovieCollectionBanner";

import { ActorCard } from "@/components/ActorCard";
import { MobileHeader } from "@/components/MobileHeader";
import { DesktopHeader } from "@/components/DesktopHeader";
import { Navigation } from "@/components/Navigation";
import { useTrailerContext } from "@/contexts/TrailerContext";
import { tmdbService, Movie, TVShow, MovieWithCollection } from "@/lib/tmdb";
import { useUserStateContext } from "@/contexts/UserStateContext";
import { CrewCard } from "@/components/CrewCard";
import { SynopsisModal } from "@/components/SynopsisModal";
import { useAuth } from "@/hooks/useAuth";

const MovieDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [movie, setMovie] = useState<MovieWithCollection | TVShow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [showSynopsis, setShowSynopsis] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  // Using CSS-based responsive design instead of JS detection
  const { setIsTrailerOpen, setTrailerKey: setGlobalTrailerKey, setMovieTitle } = useTrailerContext();
  const {
    toggleLike,
    toggleWatchlist,
    setRating,
    markAsWatched,
    isLiked,
    isInWatchlist,
    isWatched,
    getRating
  } = useUserStateContext();

  const movieId = Number(id);
  const isMovieLiked = isLiked(movieId);
  const isMovieInWatchlist = isInWatchlist(movieId);
  const isMovieWatched = isWatched(movieId);
  const userRating = getRating(movieId);

  // Helper to check auth before actions
  const requireAuth = (action: () => void) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    action();
  };

  useEffect(() => {
    const loadDetails = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        const isTV = window.location.pathname.includes('/tv/');
        let movieData;
        
        if (isTV) {
          movieData = await tmdbService.getTVShowDetails(Number(id));
        } else {
          // Use the enhanced method that includes collection info
          movieData = await tmdbService.getMovieDetailsWithCollection(Number(id));
        }
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

    loadDetails();
  }, [id]);


  const handleWatchTrailer = () => {
    if (trailerKey) {
      setGlobalTrailerKey(trailerKey);
      setMovieTitle(title);
      setIsTrailerOpen(true);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <MobileHeader title="Loading..." />
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-cinema-red" />
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-background">
        <MobileHeader title="Movie Not Found" />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Movie not found</h1>
            <Link to="/">
              <Button>Back to Home</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const backdropUrl = tmdbService.getBackdropUrl(movie.backdrop_path, 'original');
  const posterUrl = tmdbService.getPosterUrl(movie.poster_path, 'w500');
  const isTV = 'name' in movie;
  const title = isTV ? (movie as TVShow).name : (movie as Movie).title;
  const releaseDate = isTV ? (movie as TVShow).first_air_date : (movie as Movie).release_date;
  const releaseYear = releaseDate ? new Date(releaseDate).getFullYear() : 'TBA';
  const runtime = isTV ? 'TV Series' : ((movie as Movie).runtime ? `${(movie as Movie).runtime} min` : 'Unknown');
  const genres = movie.genres?.map(g => g.name).join(', ') || 'Unknown';
  
  // Get collection info for movies
  const collectionInfo = !isTV ? (movie as MovieWithCollection).belongs_to_collection : null;
  
  // Fixed cast and crew data access
  // Show more cast and crew - TMDB returns full lists
  const cast = movie.credits?.cast?.slice(0, 20) || [];
  const crew = movie.credits?.crew || [];
  const director = crew.find(person => person.job === 'Director');
  const producer = crew.find(person => person.job === 'Producer');
  const keyCrewMembers = crew.filter(person => 
    ['Director', 'Producer', 'Executive Producer', 'Screenplay', 'Writer', 'Director of Photography', 'Original Music Composer', 'Editor'].includes(person.job)
  ).slice(0, 12);

  return (
    <div className="min-h-screen bg-background pb-32 md:pb-12">
      <DesktopHeader />
      <MobileHeader title={title} />
      
      {/* Hero Section with Poster Overlay */}
      <div className="md:max-w-7xl md:mx-auto md:px-6 md:pt-6">
        <div className="relative overflow-hidden aspect-video md:h-[50vh] md:aspect-auto md:rounded-2xl">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: `url(${backdropUrl})`,
            backgroundColor: 'hsl(var(--background))'
          }}
        >
          {/* Base overlays for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-cinema-black/40 via-cinema-black/20 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-cinema-black/50 via-transparent to-transparent" />
        </div>

        {/* Bottom Gradient Blend - Creates smooth transition to page background */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background via-background/90 to-transparent pointer-events-none z-20" />

        {/* Poster positioned on top and to the left */}
        <div className="absolute bottom-6 left-4 z-30 iphone-65:left-3">
          <img 
            src={posterUrl} 
            alt={title}
            className="w-24 h-36 iphone-65:w-28 iphone-65:h-42 iphone-67:w-32 iphone-67:h-48 rounded-lg shadow-cinematic object-cover border-2 border-white/20"
          />
        </div>

        {/* Movie Info positioned to the right of poster - Responsive spacing */}
        <div className="absolute bottom-6 left-32 right-4 z-30 iphone-65:left-36 iphone-67:left-40">
          <div className="flex items-center space-x-2 iphone-65:space-x-3 mb-1 flex-wrap gap-y-1">
            <span className="text-cinema-gold font-semibold text-xs iphone-65:text-sm">TMDB {movie.vote_average.toFixed(1)}</span>
            <span className="text-white/80 text-xs iphone-65:text-sm">{releaseYear}</span>
            <span className="text-white/80 text-xs iphone-65:text-sm">{runtime}</span>
          </div>

          <h1 className="font-cinematic text-white mb-2 tracking-wide text-lg iphone-65:text-xl leading-tight">
            {title}
          </h1>

          <p className="text-white/70 mb-3 text-xs iphone-65:text-sm">
            {genres}
          </p>
        </div>
        </div>
      </div>

      {/* Synopsis Section - Positioned below the hero */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 -mt-4 relative z-30">
        <div className="bg-black/40 backdrop-blur-sm rounded-lg p-4 border border-white/10">
          <p className="text-white leading-relaxed text-sm line-clamp-3">
            {movie.overview || "No synopsis available."}
          </p>
          {movie.overview && movie.overview.length > 120 && (
            <button
              onClick={() => setShowSynopsis(true)}
              className="mt-2 inline-flex items-center gap-1 text-cinema-gold hover:text-cinema-gold/80 transition-colors text-sm font-semibold"
            >
              <MoreHorizontal className="h-4 w-4" />
              Read More
            </button>
          )}
        </div>
      </div>

      {/* Action Section */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        {/* Watch Trailer Button */}
        <div className="mb-4">
          {trailerKey ? (
            <Button 
              className="w-full bg-cinema-red hover:bg-cinema-red/90 text-white font-semibold px-4 py-3 text-sm min-h-[44px]"
              onClick={handleWatchTrailer}
            >
              <Play className="mr-2 h-4 w-4" />
              Watch Trailer
            </Button>
          ) : (
            <Button className="w-full bg-cinema-red hover:bg-cinema-red/90 text-white font-semibold px-4 py-3 text-sm min-h-[44px]" disabled>
              <Play className="mr-2 h-4 w-4" />
              No Trailer
            </Button>
          )}
        </div>

        {/* Action Buttons with Labels */}
        <div className="grid grid-cols-5 gap-2 mb-6">
          <Button 
            variant="outline" 
            className={`flex flex-col items-center gap-1 h-auto py-3 border-border hover:bg-card ${
              isMovieLiked ? 'bg-cinema-red border-cinema-red text-white' : ''
            }`}
            onClick={() => requireAuth(() => toggleLike(movieId, title, posterUrl))}
          >
            <Heart className={`h-5 w-5 ${isMovieLiked ? 'fill-current' : ''}`} />
            <span className="text-xs">Like</span>
          </Button>

          <Button 
            variant="outline" 
            className={`flex flex-col items-center gap-1 h-auto py-3 border-border hover:bg-card ${
              isMovieInWatchlist ? 'bg-cinema-gold border-cinema-gold text-cinema-black' : ''
            }`}
            onClick={() => requireAuth(() => toggleWatchlist(movieId, title, posterUrl))}
          >
            <Plus className="h-5 w-5" />
            <span className="text-xs">Watchlist</span>
          </Button>

          <Button 
            variant="outline" 
            className={`flex flex-col items-center gap-1 h-auto py-3 border-border hover:bg-card ${
              isMovieWatched ? 'bg-green-600 border-green-600 text-white' : ''
            }`}
            onClick={() => requireAuth(() => markAsWatched(movieId, title, posterUrl))}
          >
            <Eye className={`h-5 w-5 ${isMovieWatched ? 'fill-current' : ''}`} />
            <span className="text-xs">Watched</span>
          </Button>

          <Button 
            variant="outline" 
            className="flex flex-col items-center gap-1 h-auto py-3 border-border hover:bg-card"
            onClick={() => requireAuth(() => setShowLogModal(true))}
          >
            <BookOpen className="h-5 w-5" />
            <span className="text-xs">Log</span>
          </Button>

          <Button 
            variant="outline" 
            className="flex flex-col items-center gap-1 h-auto py-3 border-border hover:bg-card"
            asChild
          >
            <Link to={`/movie/${movieId}/reviews`}>
              <MessageCircle className="h-5 w-5" />
              <span className="text-xs">Reviews</span>
            </Link>
          </Button>
        </div>

        {/* Rating Comparison Card */}
        <RatingComparisonCard
          mediaId={movieId}
          mediaType="movie"
          tmdbRating={movie.vote_average}
          userRating={userRating}
          onRatingChange={(rating) => requireAuth(() => setRating(movieId, rating, title, movie.poster_path))}
          mediaTitle={title}
          mediaPoster={movie.poster_path}
        />

        {/* Where to Watch */}
        <div className="mb-6">
          <WatchProviders mediaId={movieId} mediaType="movie" />
        </div>

        {/* Movie Collection Banner */}
        {collectionInfo && (
          <MovieCollectionBanner 
            collectionId={collectionInfo.id} 
            currentMovieId={movieId}
          />
        )}

        {/* Director and Producer */}
        {(director || producer) && (
          <div className="mb-6 text-center">
            <div className="flex flex-wrap gap-6 justify-center">
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
        )}

        {/* Fun Facts Carousel - Only show for movies */}
        {!isTV && <FunFacts movie={movie as Movie} />}
      </div>

      {/* Additional Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 space-y-8">
        {/* Key Crew Section */}
        {keyCrewMembers.length > 0 && (
          <div>
            <h2 className="text-2xl font-cinematic text-foreground mb-6 tracking-wide">
              KEY CREW
            </h2>
            <div className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4">
              {keyCrewMembers.map((person) => (
                <CrewCard key={`${person.id}-${person.job}`} person={person} />
              ))}
            </div>
          </div>
        )}

        {/* Cast Section - Fixed to ensure it displays */}
        {cast && cast.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-cinematic text-foreground tracking-wide">
                CAST
              </h2>
              <Link 
                to={`/movie/${movieId}/cast`}
                className="text-cinema-gold hover:text-cinema-gold/80 text-sm font-medium touch-manipulation"
              >
                View All Cast & Crew →
              </Link>
            </div>
            <div className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4">
              {cast.map((actor) => (
                <ActorCard key={actor.id} actor={actor} />
              ))}
            </div>
          </div>
        )}
        
        {/* Similar Movies */}
        <SimilarContent 
          mediaId={movieId} 
          mediaType="movie" 
          title="SIMILAR MOVIES"
        />
      </div>


      {/* Synopsis Modal */}
      {showSynopsis && (
        <SynopsisModal
          isOpen={showSynopsis}
          onClose={() => setShowSynopsis(false)}
          title={title}
          synopsis={movie.overview || ""}
          posterUrl={posterUrl}
        />
      )}

      {/* Log Movie Modal */}
      <LogMediaModal
        isOpen={showLogModal}
        onClose={() => setShowLogModal(false)}
        mediaId={movieId}
        mediaTitle={title}
        mediaPoster={movie.poster_path}
        mediaType="movie"
        initialRating={userRating}
      />

      <Navigation />
    </div>
  );
};

export default MovieDetail;
