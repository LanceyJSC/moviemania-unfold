import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Play, Heart, Plus, Star, Share, Loader2, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MovieCarousel } from "@/components/MovieCarousel";
import { FunFacts } from "@/components/FunFacts";
import { UserReviews } from "@/components/UserReviews";

import { ActorCard } from "@/components/ActorCard";
import { MobileHeader } from "@/components/MobileHeader";
import { Navigation } from "@/components/Navigation";
import { useTrailerContext } from "@/contexts/TrailerContext";
import { tmdbService, Movie, TVShow } from "@/lib/tmdb";
import { useSupabaseUserState } from "@/hooks/useSupabaseUserState";
import { useIsMobile } from "@/hooks/use-mobile";
import { CrewCard } from "@/components/CrewCard";
import { SynopsisModal } from "@/components/SynopsisModal";

const MovieDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [movie, setMovie] = useState<Movie | TVShow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [showSynopsis, setShowSynopsis] = useState(false);
  const isMobile = useIsMobile();
  const { setIsTrailerOpen, setTrailerKey: setGlobalTrailerKey, setMovieTitle } = useTrailerContext();
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
    const loadDetails = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        const isTV = window.location.pathname.includes('/tv/');
        let movieData;
        
        if (isTV) {
          movieData = await tmdbService.getTVShowDetails(Number(id));
        } else {
          movieData = await tmdbService.getMovieDetails(Number(id));
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

  const handleShare = async () => {
    if (navigator.share && movie) {
      try {
        await navigator.share({
          title: title,
          text: `Check out ${title} on CineScope!`,
          url: window.location.href,
        });
      } catch (error) {
        navigator.clipboard.writeText(window.location.href);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

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
  
  // Fixed cast and crew data access
  const cast = movie.credits?.cast?.slice(0, 8) || [];
  const crew = movie.credits?.crew || [];
  const director = crew.find(person => person.job === 'Director');
  const producer = crew.find(person => person.job === 'Producer');
  const keyCrewMembers = crew.filter(person => 
    ['Director', 'Producer', 'Executive Producer', 'Screenplay', 'Writer'].includes(person.job)
  ).slice(0, 6);

  return (
    <div className="min-h-screen bg-background pb-32">
      <MobileHeader title={title} />
      
      {/* Hero Section with Poster Overlay */}
      <div className="relative overflow-hidden h-[50vh] rounded-b-2xl">
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
          <div className="flex items-center space-x-2 iphone-65:space-x-3 mb-2">
            <span className="text-cinema-gold font-semibold text-xs iphone-65:text-sm">★ {movie.vote_average.toFixed(1)}</span>
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

      {/* Synopsis Section - Positioned below the hero */}
      <div className="container mx-auto px-4 -mt-4 relative z-30">
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
      <div className="container mx-auto px-4 py-6">
        {/* Action Buttons */}
        <div className="flex gap-3 mb-6">
          {trailerKey ? (
            <Button 
              className="flex-1 bg-cinema-red hover:bg-cinema-red/90 text-white font-semibold px-4 py-3 text-sm min-h-[44px]"
              onClick={handleWatchTrailer}
            >
              <Play className="mr-2 h-4 w-4" />
              Watch Trailer
            </Button>
          ) : (
            <Button className="flex-1 bg-cinema-red hover:bg-cinema-red/90 text-white font-semibold px-4 py-3 text-sm min-h-[44px]" disabled>
              <Play className="mr-2 h-4 w-4" />
              No Trailer
            </Button>
          )}
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className={`border-border hover:bg-card px-3 py-3 min-h-[44px] min-w-[44px] ${
                isMovieLiked ? 'bg-cinema-red border-cinema-red text-white' : ''
              }`}
              onClick={() => toggleLike(movieId, title, posterUrl)}
            >
              <Heart className={`h-4 w-4 ${isMovieLiked ? 'fill-current' : ''}`} />
            </Button>

            <Button 
              variant="outline" 
              className={`border-border hover:bg-card px-3 py-3 min-h-[44px] min-w-[44px] ${
                isMovieInWatchlist ? 'bg-cinema-gold border-cinema-gold text-cinema-black' : ''
              }`}
              onClick={() => toggleWatchlist(movieId, title, posterUrl)}
            >
              <Plus className="h-4 w-4" />
            </Button>

            <Button 
              variant="outline" 
              className="border-border hover:bg-card px-3 py-3 min-h-[44px] min-w-[44px]" 
              onClick={handleShare}
            >
              <Share className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Rating */}
        <div className="flex items-center justify-center space-x-2 mb-6">
          <span className="text-foreground text-sm">Your Rating:</span>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(movieId, star, title)}
              className="p-2 touch-target"
            >
              <Star 
                className={`h-5 w-5 ${star <= userRating ? 'text-cinema-gold fill-current' : 'text-muted-foreground'}`}
              />
            </button>
          ))}
        </div>

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
        
        {/* User Reviews Section */}
        <UserReviews movieId={movie.id} isTV={isTV} />
      </div>

      {/* Additional Content */}
      <div className="container mx-auto px-4 space-y-8">
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
            <h2 className="text-2xl font-cinematic text-foreground mb-6 tracking-wide">
              CAST
            </h2>
            <div className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4">
              {cast.map((actor) => (
                <ActorCard key={actor.id} actor={actor} />
              ))}
            </div>
          </div>
        )}
        
        
        {/* Recommendations */}
        <MovieCarousel 
          title="YOU MIGHT ALSO LIKE" 
          category="popular"
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

      {/* Mobile Navigation */}
      <Navigation />
    </div>
  );
};

export default MovieDetail;
