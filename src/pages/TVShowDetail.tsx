import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Play, Heart, Plus, Star, Share, Loader2, MoreHorizontal, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MovieCarousel } from "@/components/MovieCarousel";
import { UserReviews } from "@/components/UserReviews";
import { ActorCard } from "@/components/ActorCard";
import { MobileHeader } from "@/components/MobileHeader";
import { Navigation } from "@/components/Navigation";
import { TrailerModal } from "@/components/TrailerModal";
import { tmdbService, TVShow } from "@/lib/tmdb";
import { useSupabaseUserState } from "@/hooks/useSupabaseUserState";
import { useIsMobile } from "@/hooks/use-mobile";
import { CrewCard } from "@/components/CrewCard";
import { SynopsisModal } from "@/components/SynopsisModal";

const TVShowDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [tvShow, setTVShow] = useState<TVShow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [showTrailer, setShowTrailer] = useState(false);
  const [showSynopsis, setShowSynopsis] = useState(false);
  const isMobile = useIsMobile();
  const {
    toggleLike,
    toggleWatchlist,
    setRating,
    isLiked,
    isInWatchlist,
    getRating
  } = useSupabaseUserState();

  const tvShowId = Number(id);
  const isTVShowLiked = isLiked(tvShowId);
  const isTVShowInWatchlist = isInWatchlist(tvShowId);
  const userRating = getRating(tvShowId);

  useEffect(() => {
    const loadDetails = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        // Get TV show details with images for logo
        const tvShowData = await tmdbService.getTVShowDetails(Number(id));
        setTVShow(tvShowData);
        
        // Find trailer
        const trailer = tvShowData.videos?.results.find(
          video => video.type === 'Trailer' && video.site === 'YouTube'
        );
        if (trailer) {
          setTrailerKey(trailer.key);
        }
      } catch (error) {
        console.error('Failed to load TV show details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDetails();
  }, [id]);

  const handleShare = async () => {
    if (navigator.share && tvShow) {
      try {
        await navigator.share({
          title: tvShow.name,
          text: `Check out ${tvShow.name} on CineScope!`,
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
      setShowTrailer(true);
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

  if (!tvShow) {
    return (
      <div className="min-h-screen bg-background">
        <MobileHeader title="TV Show Not Found" />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">TV Show not found</h1>
            <Link to="/tv-shows">
              <Button>Back to TV Shows</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const backdropUrl = tmdbService.getBackdropUrl(tvShow.backdrop_path, 'original');
  const posterUrl = tmdbService.getPosterUrl(tvShow.poster_path, 'w500');
  const logoUrl = tvShow.images?.logos?.[0]?.file_path 
    ? tmdbService.getImageUrl(tvShow.images.logos[0].file_path, 'w500')
    : null;
  
  const releaseYear = tvShow.first_air_date ? new Date(tvShow.first_air_date).getFullYear() : 'TBA';
  const genres = tvShow.genres?.map(g => g.name).join(', ') || 'Unknown';
  
  // Fixed cast and crew data access
  const cast = tvShow.credits?.cast?.slice(0, 8) || [];
  const crew = tvShow.credits?.crew || [];
  const creator = tvShow.created_by?.[0];
  const keyCrewMembers = crew.filter(person => 
    ['Executive Producer', 'Producer', 'Writer', 'Creator'].includes(person.job)
  ).slice(0, 6);

  return (
    <div className="min-h-screen bg-background pb-32">
      <MobileHeader title={tvShow.name} />
      
      {/* Hero Section with Poster Overlay */}
      <div className="relative overflow-hidden h-[50vh]">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${backdropUrl})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-cinema-black/30 via-cinema-black/15 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-cinema-black/40 via-transparent to-transparent" />
        </div>

        {/* Bottom Gradient Blend */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none z-20" />

        {/* Poster positioned on top and to the left */}
        <div className="absolute bottom-6 left-4 z-30">
          <img 
            src={posterUrl} 
            alt={tvShow.name}
            className="w-32 h-48 rounded-lg shadow-cinematic object-cover border-2 border-white/20"
          />
        </div>

        {/* TV Show Info positioned to the right of poster */}
        <div className="absolute bottom-6 left-40 right-4 z-30">
          {/* TV Show Logo */}
          {logoUrl && (
            <div className="mb-3">
              <img 
                src={logoUrl} 
                alt={`${tvShow.name} logo`}
                className="h-12 max-w-48 object-contain"
              />
            </div>
          )}
          
          <div className="flex items-center space-x-3 mb-2">
            <span className="text-cinema-gold font-semibold text-sm">★ {tvShow.vote_average.toFixed(1)}</span>
            <span className="text-white/80 text-sm">{releaseYear}</span>
            <span className="text-white/80 text-sm">TV Series</span>
            {tvShow.number_of_seasons && (
              <span className="text-white/80 text-sm">{tvShow.number_of_seasons} Season{tvShow.number_of_seasons > 1 ? 's' : ''}</span>
            )}
          </div>

          {!logoUrl && (
            <h1 className="font-cinematic text-white mb-2 tracking-wide text-xl leading-tight">
              {tvShow.name}
            </h1>
          )}

          <p className="text-white/70 mb-3 text-sm">
            {genres}
          </p>
        </div>
      </div>

      {/* Synopsis Section */}
      <div className="container mx-auto px-4 -mt-4 relative z-30">
        <div className="bg-black/40 backdrop-blur-sm rounded-lg p-4 border border-white/10">
          <p className="text-white leading-relaxed text-sm line-clamp-3">
            {tvShow.overview || "No synopsis available."}
          </p>
          {tvShow.overview && tvShow.overview.length > 120 && (
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
                isTVShowLiked ? 'bg-cinema-red border-cinema-red text-white' : ''
              }`}
              onClick={() => toggleLike(tvShowId, tvShow.name, posterUrl)}
            >
              <Heart className={`h-4 w-4 ${isTVShowLiked ? 'fill-current' : ''}`} />
            </Button>

            <Button 
              variant="outline" 
              className={`border-border hover:bg-card px-3 py-3 min-h-[44px] min-w-[44px] ${
                isTVShowInWatchlist ? 'bg-cinema-gold border-cinema-gold text-cinema-black' : ''
              }`}
              onClick={() => toggleWatchlist(tvShowId, tvShow.name, posterUrl)}
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
              onClick={() => setRating(tvShowId, star, tvShow.name)}
              className="p-2 touch-target"
            >
              <Star 
                className={`h-5 w-5 ${star <= userRating ? 'text-cinema-gold fill-current' : 'text-muted-foreground'}`}
              />
            </button>
          ))}
        </div>

        {/* Creator */}
        {creator && (
          <div className="mb-6 text-center">
            <div className="flex flex-wrap gap-6 justify-center">
              <div>
                <h4 className="font-semibold text-foreground text-sm">Creator</h4>
                <p className="text-muted-foreground text-sm">{creator.name}</p>
              </div>
            </div>
          </div>
        )}

        {/* Seasons Section */}
        {tvShow.seasons && tvShow.seasons.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-cinematic text-foreground mb-6 tracking-wide">
              SEASONS
            </h2>
            <div className="space-y-3">
              {tvShow.seasons
                .filter(season => season.season_number > 0) // Filter out "Season 0" (specials)
                .map((season) => (
                <Link 
                  key={season.id} 
                  to={`/tv/${tvShow.id}/season/${season.season_number}`}
                  className="group"
                >
                  <div className="flex items-center gap-4 p-4 bg-card/50 rounded-lg border border-border hover:border-cinema-red transition-all duration-200 hover:bg-card/70">
                    <img 
                      src={tmdbService.getPosterUrl(season.poster_path, 'w300')}
                      alt={season.name}
                      className="w-16 h-24 rounded object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground group-hover:text-cinema-red transition-colors">
                        {season.name}
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        {season.episode_count} episode{season.episode_count !== 1 ? 's' : ''}
                      </p>
                      {season.air_date && (
                        <p className="text-muted-foreground text-xs">
                          {new Date(season.air_date).getFullYear()}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-cinema-red transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
        
        {/* User Reviews Section */}
        <UserReviews movieId={tvShow.id} isTV={true} />
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

        {/* Cast Section */}
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
          cardSize="medium"
        />
      </div>

      {/* Trailer Modal */}
      {showTrailer && (
        <TrailerModal 
          isOpen={showTrailer} 
          onClose={() => setShowTrailer(false)} 
          trailerKey={trailerKey || ''} 
          movieTitle={tvShow.name} 
        />
      )}

      {/* Synopsis Modal */}
      {showSynopsis && (
        <SynopsisModal
          isOpen={showSynopsis}
          onClose={() => setShowSynopsis(false)}
          title={tvShow.name}
          synopsis={tvShow.overview || ""}
          posterUrl={posterUrl}
        />
      )}

      {/* Mobile Navigation */}
      <Navigation />
    </div>
  );
};

export default TVShowDetail;