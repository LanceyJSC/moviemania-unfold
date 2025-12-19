import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Play, Heart, Plus, Loader2, MoreHorizontal, BookOpen, Eye, ChevronRight, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ActorCard } from "@/components/ActorCard";
import { MobileHeader } from "@/components/MobileHeader";
import { DesktopHeader } from "@/components/DesktopHeader";
import { Navigation } from "@/components/Navigation";
import { useTrailerContext } from "@/contexts/TrailerContext";
import { tmdbService, TVShow } from "@/lib/tmdb";
import { useUserStateContext } from "@/contexts/UserStateContext";
import { CrewCard } from "@/components/CrewCard";
import { SynopsisModal } from "@/components/SynopsisModal";
import { LogMediaModal } from "@/components/LogMediaModal";
import { RatingComparisonCard } from "@/components/RatingComparisonCard";
import { SeasonProgressCard } from "@/components/SeasonProgressCard";
import { WatchProviders } from "@/components/WatchProviders";
import { SimilarContent } from "@/components/SimilarContent";
import { useDiary } from "@/hooks/useDiary";
import { useAuth } from "@/hooks/useAuth";

const TVShowDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tvShow, setTVShow] = useState<TVShow | null>(null);
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
  const { tvDiary, refetchTVDiary, isLoading: isDiaryLoading } = useDiary();

  const tvShowId = Number(id);
  const isTVShowLiked = isLiked(tvShowId);
  const isTVShowInWatchlist = isInWatchlist(tvShowId);
  const isTVShowWatched = isWatched(tvShowId);
  const userRating = getRating(tvShowId);

  // Helper to check auth before actions
  const requireAuth = (action: () => void) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    action();
  };

  // Refetch diary on mount to ensure fresh data
  useEffect(() => {
    refetchTVDiary();
  }, [id]);

  // Calculate watched episodes per season from diary
  const getWatchedEpisodesForSeason = (seasonNumber: number) => {
    const count = tvDiary.filter(
      entry => entry.tv_id === tvShowId && entry.season_number === seasonNumber && entry.episode_number !== null
    ).length;
    return count;
  };

  // Calculate season rating as average of episode ratings
  const getSeasonRating = (seasonNumber: number) => {
    const episodeRatings = tvDiary
      .filter(entry => 
        entry.tv_id === tvShowId && 
        entry.season_number === seasonNumber && 
        entry.episode_number !== null &&
        entry.rating !== null
      )
      .map(entry => entry.rating as number);
    
    if (episodeRatings.length === 0) return null;
    
    const average = Math.round(episodeRatings.reduce((a, b) => a + b, 0) / episodeRatings.length);
    return average;
  };

  useEffect(() => {
    const loadDetails = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        const tvShowData = await tmdbService.getTVShowDetails(Number(id));
        setTVShow(tvShowData);
        
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


  const handleWatchTrailer = () => {
    if (trailerKey) {
      setGlobalTrailerKey(trailerKey);
      setMovieTitle(tvShow?.name || 'TV Show');
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
  
  // Show more cast and crew - TMDB returns full lists
  const cast = tvShow.credits?.cast?.slice(0, 20) || [];
  const crew = tvShow.credits?.crew || [];
  const creator = tvShow.created_by?.[0];
  const keyCrewMembers = crew.filter(person => 
    ['Executive Producer', 'Producer', 'Writer', 'Creator', 'Director', 'Director of Photography', 'Original Music Composer'].includes(person.job)
  ).slice(0, 12);

  return (
    <div className="min-h-screen bg-background pb-32 md:pb-12">
      <DesktopHeader />
      <MobileHeader title={tvShow.name} />
      
      {/* Hero Section with Poster Overlay */}
      <div className="md:max-w-7xl md:mx-auto md:px-6 md:pt-6">
        <div className="relative overflow-hidden h-[50vh] md:rounded-2xl">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: `url(${backdropUrl})`,
            backgroundColor: 'hsl(var(--background))'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-cinema-black/40 via-cinema-black/20 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-cinema-black/50 via-transparent to-transparent" />
        </div>

        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background via-background/90 to-transparent pointer-events-none z-20" />

        <div className="absolute bottom-6 left-4 z-30 iphone-65:left-3">
          <img 
            src={posterUrl} 
            alt={tvShow.name}
            className="w-24 h-36 iphone-65:w-28 iphone-65:h-42 iphone-67:w-32 iphone-67:h-48 rounded-lg shadow-cinematic object-cover border-2 border-white/20"
          />
        </div>

        <div className="absolute bottom-6 left-32 right-4 z-30 iphone-65:left-36 iphone-67:left-40">
          {logoUrl && (
            <div className="mb-3">
              <img 
                src={logoUrl} 
                alt={`${tvShow.name} logo`}
                className="h-8 iphone-65:h-10 iphone-67:h-12 max-w-36 iphone-65:max-w-44 iphone-67:max-w-48 object-contain"
              />
            </div>
          )}
          
          <div className="flex items-center space-x-2 iphone-65:space-x-3 mb-1 flex-wrap gap-y-1">
            <span className="text-cinema-gold font-semibold text-xs iphone-65:text-sm">TMDB {tvShow.vote_average.toFixed(1)}</span>
            <span className="text-white/80 text-xs iphone-65:text-sm">{releaseYear}</span>
            <span className="text-white/80 text-xs iphone-65:text-sm">TV Series</span>
            {tvShow.number_of_seasons && (
              <span className="text-white/80 text-xs iphone-65:text-sm">{tvShow.number_of_seasons} Season{tvShow.number_of_seasons > 1 ? 's' : ''}</span>
            )}
          </div>

          {!logoUrl && (
            <h1 className="font-cinematic text-white mb-2 tracking-wide text-lg iphone-65:text-xl leading-tight">
              {tvShow.name}
            </h1>
          )}

          <p className="text-white/70 mb-3 text-xs iphone-65:text-sm">
            {genres}
          </p>
        </div>
        </div>
      </div>

      {/* Synopsis Section */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 -mt-4 relative z-30">
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
              isTVShowLiked ? 'bg-cinema-red border-cinema-red text-white' : ''
            }`}
            onClick={() => requireAuth(() => toggleLike(tvShowId, tvShow.name, posterUrl, 'tv'))}
          >
            <Heart className={`h-5 w-5 ${isTVShowLiked ? 'fill-current' : ''}`} />
            <span className="text-xs">Like</span>
          </Button>

          <Button 
            variant="outline" 
            className={`flex flex-col items-center gap-1 h-auto py-3 border-border hover:bg-card ${
              isTVShowInWatchlist ? 'bg-cinema-gold border-cinema-gold text-cinema-black' : ''
            }`}
            onClick={() => requireAuth(() => toggleWatchlist(tvShowId, tvShow.name, posterUrl, 'tv'))}
          >
            <Plus className="h-5 w-5" />
            <span className="text-xs">Watchlist</span>
          </Button>

          <Button 
            variant="outline" 
            className={`flex flex-col items-center gap-1 h-auto py-3 border-border hover:bg-card ${
              isTVShowWatched ? 'bg-green-600 border-green-600 text-white' : ''
            }`}
            onClick={() => requireAuth(() => markAsWatched(tvShowId, tvShow.name, posterUrl, 'tv'))}
          >
            <Eye className={`h-5 w-5 ${isTVShowWatched ? 'fill-current' : ''}`} />
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
            <Link to={`/tv/${tvShowId}/reviews`}>
              <MessageCircle className="h-5 w-5" />
              <span className="text-xs">Reviews</span>
            </Link>
          </Button>
        </div>

        {/* Rating Comparison Card */}
        <RatingComparisonCard
          mediaId={tvShowId}
          mediaType="tv"
          tmdbRating={tvShow.vote_average}
          userRating={userRating}
          onRatingChange={(rating) => requireAuth(() => setRating(tvShowId, rating, tvShow.name, posterUrl, 'tv'))}
          mediaTitle={tvShow.name}
          mediaPoster={tvShow.poster_path}
        />

        {/* Where to Watch */}
        <div className="mb-6">
          <WatchProviders mediaId={tvShowId} mediaType="tv" />
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
                .filter(season => season.season_number > 0)
                .map((season) => (
                  <SeasonProgressCard
                    key={season.id}
                    tvShowId={tvShow.id}
                    tvShowName={tvShow.name}
                    tvShowPoster={tvShow.poster_path}
                    season={season}
                    watchedEpisodes={getWatchedEpisodesForSeason(season.season_number)}
                    seasonRating={getSeasonRating(season.season_number)}
                    onProgressUpdate={refetchTVDiary}
                  />
                ))}
            </div>
          </div>
        )}
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

        {/* Cast Section */}
        {cast && cast.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-cinematic text-foreground tracking-wide">
                CAST
              </h2>
              <Link 
                to={`/tv/${tvShowId}/cast`}
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
        
        {/* Similar TV Shows */}
        <SimilarContent 
          mediaId={tvShowId} 
          mediaType="tv" 
          title="SIMILAR SHOWS"
        />
      </div>

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

      {/* Log Modal */}
      <LogMediaModal
        isOpen={showLogModal}
        onClose={() => setShowLogModal(false)}
        mediaId={tvShowId}
        mediaTitle={tvShow.name}
        mediaPoster={tvShow.poster_path}
        mediaType="tv"
        initialRating={userRating}
      />

      <Navigation />
    </div>
  );
};

export default TVShowDetail;
