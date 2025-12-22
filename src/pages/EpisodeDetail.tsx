import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Calendar, Clock, Star, Eye, BookOpen, User, Flame } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MobileHeader } from "@/components/MobileHeader";
import { DesktopHeader } from "@/components/DesktopHeader";
import { Navigation } from "@/components/Navigation";
import { LogMediaModal } from "@/components/LogMediaModal";
import { RatingInput } from "@/components/RatingInput";
import { RatingComparisonCard } from "@/components/RatingComparisonCard";
import { WatchProviders } from "@/components/WatchProviders";
import { ActorCard } from "@/components/ActorCard";
import { CrewCard } from "@/components/CrewCard";
import { tmdbService, TVShow as TMDBTVShow } from "@/lib/tmdb";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useDiary } from "@/hooks/useDiary";
import { format } from "date-fns";

interface Episode {
  id: number;
  name: string;
  overview: string;
  still_path: string | null;
  air_date: string;
  episode_number: number;
  season_number: number;
  runtime: number | null;
  vote_average: number;
  crew?: { id: number; name: string; job: string; profile_path: string | null }[];
  guest_stars?: { id: number; name: string; character: string; profile_path: string | null }[];
  credits?: {
    cast: { id: number; name: string; character: string; profile_path: string | null }[];
    crew: { id: number; name: string; job: string; profile_path: string | null }[];
  };
}

interface EpisodeCommunityReview {
  id: string;
  notes: string;
  rating: number | null;
  watched_date: string;
  user_id: string;
  profile: {
    username: string | null;
    avatar_url: string | null;
  } | null;
}

const EpisodeDetail = () => {
  const { id, seasonNumber, episodeNumber } = useParams<{ 
    id: string; 
    seasonNumber: string; 
    episodeNumber: string;
  }>();
  const navigate = useNavigate();
  const [episode, setEpisode] = useState<Episode | null>(null);
  const [tvShow, setTVShow] = useState<TMDBTVShow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showLogModal, setShowLogModal] = useState(false);
  const [episodeRating, setEpisodeRating] = useState<number>(0);
  const [isWatched, setIsWatched] = useState(false);
  const { user } = useAuth();
  const { tvDiary, refetchTVDiary } = useDiary();

  const tvId = Number(id);
  const seasonNum = Number(seasonNumber);
  const episodeNum = Number(episodeNumber);

  const requireAuth = (action: () => void) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    action();
  };

  // Fetch Community Reviews for this specific episode
  const { data: communityReviews, refetch: refetchCommunityReviews } = useQuery({
    queryKey: ['episode-community-reviews', tvId, seasonNum, episodeNum],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tv_diary')
        .select('id, notes, rating, watched_date, user_id')
        .eq('tv_id', tvId)
        .eq('season_number', seasonNum)
        .eq('episode_number', episodeNum)
        .eq('is_public', true)
        .not('notes', 'is', null)
        .neq('notes', '')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching episode reviews:', error);
        return [];
      }

      // Fetch profiles for each review
      const reviewsWithProfiles: EpisodeCommunityReview[] = await Promise.all(
        (data || []).map(async (review) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', review.user_id)
            .maybeSingle();
          
          return {
            ...review,
            profile
          };
        })
      );

      return reviewsWithProfiles.filter(r => r.notes && r.notes.trim() !== '');
    },
    enabled: !!tvId && !!seasonNum && !!episodeNum
  });

  useEffect(() => {
    const loadEpisodeDetails = async () => {
      if (!id || !seasonNumber || !episodeNumber) return;
      
      setIsLoading(true);
      try {
        const tvShowData = await tmdbService.getTVShowDetails(tvId);
        setTVShow(tvShowData);

        const episodeData = await tmdbService.getEpisodeDetails(tvId, seasonNum, episodeNum) as Episode;
        setEpisode(episodeData);
      } catch (error) {
        console.error('Failed to load episode details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadEpisodeDetails();
  }, [id, seasonNumber, episodeNumber, tvId, seasonNum, episodeNum]);

  // Track watched status and rating from diary
  useEffect(() => {
    if (!tvId || !seasonNum || !episodeNum) return;
    
    const entry = tvDiary.find(
      e => e.tv_id === tvId && e.season_number === seasonNum && e.episode_number === episodeNum
    );
    
    setIsWatched(!!entry);
    setEpisodeRating(entry?.rating || 0);
  }, [tvId, seasonNum, episodeNum, tvDiary]);

  const handleMarkWatched = async () => {
    if (!user || !tvShow || !episode) return;

    const { data: existingEntry } = await supabase
      .from('tv_diary')
      .select('id')
      .eq('user_id', user.id)
      .eq('tv_id', tvId)
      .eq('season_number', seasonNum)
      .eq('episode_number', episodeNum)
      .maybeSingle();

    if (existingEntry) {
      await supabase
        .from('tv_diary')
        .delete()
        .eq('id', existingEntry.id)
        .eq('user_id', user.id);
      setIsWatched(false);
      setEpisodeRating(0);
    } else {
      await supabase
        .from('tv_diary')
        .insert({
          user_id: user.id,
          tv_id: tvId,
          tv_title: tvShow.name,
          tv_poster: tvShow.poster_path,
          season_number: seasonNum,
          episode_number: episodeNum,
          runtime: episode.runtime || 45,
          watched_date: new Date().toISOString().split('T')[0]
        });
      setIsWatched(true);
    }
    
    refetchTVDiary();
  };

  const handleRateEpisode = async (rating: number) => {
    if (!user || !tvShow || !episode) return;

    const newRating = rating === 0 ? null : rating;

    const { data: existingEntry } = await supabase
      .from('tv_diary')
      .select('id')
      .eq('user_id', user.id)
      .eq('tv_id', tvId)
      .eq('season_number', seasonNum)
      .eq('episode_number', episodeNum)
      .maybeSingle();

    if (existingEntry) {
      await supabase
        .from('tv_diary')
        .update({ rating: newRating })
        .eq('id', existingEntry.id)
        .eq('user_id', user.id);
    } else {
      await supabase
        .from('tv_diary')
        .insert({
          user_id: user.id,
          tv_id: tvId,
          tv_title: tvShow.name,
          tv_poster: tvShow.poster_path,
          season_number: seasonNum,
          episode_number: episodeNum,
          runtime: episode.runtime || 45,
          rating: newRating,
          watched_date: new Date().toISOString().split('T')[0]
        });
      setIsWatched(true);
    }

    setEpisodeRating(newRating || 0);
    refetchTVDiary();
  };


  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <MobileHeader title="Loading..." />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cinema-red"></div>
        </div>
      </div>
    );
  }

  if (!episode || !tvShow) {
    return (
      <div className="min-h-screen bg-background">
        <MobileHeader title="Episode Not Found" />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Episode not found</h1>
            <Link to={`/tv/${id}/season/${seasonNumber}`}>
              <Button>Back to Season</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const stillUrl = episode.still_path 
    ? tmdbService.getBackdropUrl(episode.still_path, 'w1280')
    : tmdbService.getBackdropUrl(tvShow.backdrop_path, 'w1280');

  return (
    <div className="min-h-screen bg-background pb-32 md:pb-12">
      <DesktopHeader />
      <MobileHeader title={`S${seasonNum} E${episodeNum}`} />
      
      {/* Hero Section */}
      <div className="md:max-w-7xl md:mx-auto md:px-6 md:pt-6">
        <div className="relative overflow-hidden h-[50vh] md:rounded-2xl">
        <div className="absolute inset-0">
          <img 
            src={stillUrl}
            alt=""
            className="w-full h-full object-cover object-center md:object-top"
            style={{ backgroundColor: 'hsl(var(--background))' }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-cinema-black/40 via-cinema-black/20 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-cinema-black/50 via-transparent to-transparent" />
        </div>

        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background via-background/90 to-transparent pointer-events-none z-20" />

        <div className="absolute bottom-6 left-4 z-30">
          {episode.still_path && (
            <img 
              src={tmdbService.getBackdropUrl(episode.still_path, 'w780')}
              alt={episode.name}
              className="w-28 h-16 rounded-lg shadow-cinematic object-cover border-2 border-white/20"
            />
          )}
        </div>

        <div className={`absolute bottom-6 right-4 z-30 ${episode.still_path ? 'left-36' : 'left-4'}`}>
          <div className="flex items-center space-x-2 mb-1 flex-wrap gap-y-1">
            <span className="text-cinema-gold font-semibold text-xs">TMDB {episode.vote_average.toFixed(1)}</span>
            <span className="text-white/80 text-xs">S{seasonNum} E{episodeNum}</span>
            {episode.air_date && (
              <span className="text-white/80 text-xs">
                {format(new Date(episode.air_date), 'MMM d, yyyy')}
              </span>
            )}
            {episode.runtime && (
              <span className="text-white/80 text-xs">{episode.runtime}m</span>
            )}
          </div>

          <h1 className="font-cinematic text-white mb-2 tracking-wide text-lg leading-tight">
            {episode.name}
          </h1>
          
          <p className="text-white/70 text-xs">
            {tvShow.name} - Season {seasonNum}
          </p>
        </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">
        {/* Rating Comparison Card */}
        <RatingComparisonCard
          mediaId={tvId}
          mediaType="tv"
          tmdbRating={episode.vote_average}
          userRating={episodeRating}
          onRatingChange={(rating) => requireAuth(() => handleRateEpisode(rating))}
          mediaTitle={`${tvShow.name} - S${seasonNum}E${episodeNum}`}
          mediaPoster={tvShow.poster_path || undefined}
        />

        {/* Action Buttons - Always visible */}
        <div className="flex items-center gap-3">
          <Button
            variant={isWatched ? "default" : "outline"}
            size="lg"
            onClick={() => requireAuth(() => handleMarkWatched())}
            className="flex-1 h-12 touch-manipulation active:scale-95"
          >
            <Eye className="h-5 w-5 mr-2" />
            {isWatched ? 'Watched' : 'Mark Watched'}
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => requireAuth(() => setShowLogModal(true))}
            className="flex-1 h-12 touch-manipulation active:scale-95"
          >
            <BookOpen className="h-5 w-5 mr-2" />
            Log Episode
          </Button>
        </div>

        {/* Where to Watch */}
        <WatchProviders mediaId={tvId} mediaType="tv" />

        {/* Overview */}
        {episode.overview && (
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Overview</h2>
            <p className="text-muted-foreground leading-relaxed">{episode.overview}</p>
          </div>
        )}

        {/* Cast Section - Matching MovieDetail style */}
        {episode.credits?.cast && episode.credits.cast.length > 0 && (
          <div>
            <h2 className="text-2xl font-cinematic text-foreground mb-6 tracking-wide">CAST</h2>
            <div className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4">
              {episode.credits.cast.slice(0, 20).map((person) => (
                <ActorCard 
                  key={person.id} 
                  actor={{
                    id: person.id,
                    name: person.name,
                    character: person.character,
                    profile_path: person.profile_path
                  }} 
                />
              ))}
            </div>
          </div>
        )}

        {/* Guest Stars Section - Matching MovieDetail style */}
        {episode.guest_stars && episode.guest_stars.length > 0 && (
          <div>
            <h2 className="text-2xl font-cinematic text-foreground mb-6 tracking-wide">GUEST STARS</h2>
            <div className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4">
              {episode.guest_stars.slice(0, 15).map((person) => (
                <ActorCard 
                  key={person.id} 
                  actor={{
                    id: person.id,
                    name: person.name,
                    character: person.character,
                    profile_path: person.profile_path
                  }} 
                />
              ))}
            </div>
          </div>
        )}

        {/* Crew Section - Matching MovieDetail style */}
        {episode.credits?.crew && episode.credits.crew.length > 0 && (
          <div>
            <h2 className="text-2xl font-cinematic text-foreground mb-6 tracking-wide">KEY CREW</h2>
            <div className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4">
              {episode.credits.crew
                .filter((person, index, self) => 
                  index === self.findIndex(p => p.id === person.id)
                )
                .slice(0, 10)
                .map((person) => (
                  <CrewCard 
                    key={`${person.id}-${person.job}`} 
                    person={{
                      id: person.id,
                      name: person.name,
                      job: person.job,
                      profile_path: person.profile_path
                    }} 
                  />
                ))}
            </div>
          </div>
        )}

        {/* Episode Reviews Section (Community) */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Episode Reviews
            <span className="text-sm font-normal text-muted-foreground ml-2">
              ({communityReviews?.length || 0})
            </span>
          </h2>
          
          {communityReviews && communityReviews.length > 0 ? (
            <div className="space-y-4">
              {communityReviews.map((review) => (
                <div 
                  key={review.id}
                  className="bg-card rounded-xl p-4 border border-border"
                >
                  <div className="flex items-start gap-3">
                    <Link to={`/user/${review.profile?.username || 'anonymous'}`}>
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        {review.profile?.avatar_url ? (
                          <AvatarImage src={review.profile.avatar_url} />
                        ) : null}
                        <AvatarFallback className="bg-muted">
                          <User className="h-5 w-5 text-muted-foreground" />
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <Link 
                          to={`/user/${review.profile?.username || 'anonymous'}`}
                          className="font-medium text-foreground hover:underline"
                        >
                          {review.profile?.username || 'Anonymous'}
                        </Link>
                        {review.rating && (
                          <div className="flex items-center gap-1 text-cinema-red text-sm">
                            <Flame className="h-3.5 w-3.5 fill-current" />
                            <span>{review.rating}/5</span>
                          </div>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(review.watched_date), 'MMM d, yyyy')}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {review.notes}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-card rounded-xl border border-border">
              <p className="text-muted-foreground text-sm mb-2">No episode reviews yet.</p>
              <Button
                variant="outline"
                size="lg"
                onClick={() => requireAuth(() => setShowLogModal(true))}
                className="h-12 px-6 touch-manipulation active:scale-95"
              >
                Be the first to review this episode
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Log Modal */}
      {showLogModal && tvShow && episode && (
        <LogMediaModal
          isOpen={showLogModal}
          onClose={() => {
            setShowLogModal(false);
            refetchCommunityReviews();
          }}
          mediaId={tvId}
          mediaTitle={`${tvShow.name} - S${seasonNum}E${episodeNum}: ${episode.name}`}
          mediaPoster={tvShow.poster_path}
          mediaType="tv"
          seasonNumber={seasonNum}
          episodeNumber={episodeNum}
        />
      )}

      <Navigation />
    </div>
  );
};

export default EpisodeDetail;
