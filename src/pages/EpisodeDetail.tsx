import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Calendar, Clock, Star, Eye, BookOpen, ArrowLeft, User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MobileHeader } from "@/components/MobileHeader";
import { Navigation } from "@/components/Navigation";
import { LogMediaModal } from "@/components/LogMediaModal";
import { RatingInput } from "@/components/RatingInput";
import { tmdbService, TVShow as TMDBTVShow, Review } from "@/lib/tmdb";
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
  crew?: { id: number; name: string; job: string }[];
  guest_stars?: { id: number; name: string; character: string; profile_path: string | null }[];
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

  // Fetch TMDB Reviews for the TV Show (not episode-specific)
  const { data: tmdbReviews } = useQuery({
    queryKey: ['tv-reviews', tvId],
    queryFn: async () => {
      const response = await tmdbService.getTVShowReviews(tvId);
      return response.results;
    },
    enabled: !!tvId
  });

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

  const formatReviewContent = (content: string, maxLength: number = 300) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
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
    <div className="min-h-screen bg-background pb-32">
      <MobileHeader title={`S${seasonNum} E${episodeNum}`} />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden h-[35vh] rounded-b-2xl">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: `url(${stillUrl})`,
            backgroundColor: 'hsl(var(--background))'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-cinema-black/60 via-cinema-black/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-cinema-black/70 via-transparent to-transparent" />
        </div>

        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background via-background/90 to-transparent pointer-events-none z-20" />

        <div className="absolute bottom-6 left-4 right-4 z-30">
          <Link 
            to={`/tv/${id}/season/${seasonNumber}`}
            className="inline-flex items-center gap-1 text-white/80 text-sm mb-2 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to {tvShow.name} - Season {seasonNum}
          </Link>
          
          <h1 className="font-cinematic text-white mb-2 tracking-wide text-xl leading-tight">
            {episode.name}
          </h1>
          
          <div className="flex items-center gap-3 text-white/80 text-sm flex-wrap">
            <span>S{seasonNum} E{episodeNum}</span>
            {episode.air_date && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(episode.air_date), 'MMM d, yyyy')}
              </span>
            )}
            {episode.runtime && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {episode.runtime}m
              </span>
            )}
            {episode.vote_average > 0 && (
              <span className="flex items-center gap-1 text-cinema-gold">
                <Star className="h-3 w-3 fill-current" />
                {episode.vote_average.toFixed(1)}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Action Buttons */}
        {user && (
          <div className="flex items-center gap-3">
            <Button
              variant={isWatched ? "default" : "outline"}
              size="sm"
              onClick={handleMarkWatched}
              className="flex-1"
            >
              <Eye className="h-4 w-4 mr-2" />
              {isWatched ? 'Watched' : 'Mark Watched'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowLogModal(true)}
              className="flex-1"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Log Episode
            </Button>
          </div>
        )}

        {/* Rating */}
        {user && (
          <div className="bg-card rounded-xl p-4 border border-border">
            <h3 className="text-sm font-medium text-foreground mb-3">Your Rating</h3>
            <RatingInput
              value={episodeRating}
              onChange={handleRateEpisode}
              size="md"
            />
          </div>
        )}

        {/* Overview */}
        {episode.overview && (
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Overview</h2>
            <p className="text-muted-foreground leading-relaxed">{episode.overview}</p>
          </div>
        )}

        {/* TMDB Reviews Section */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">
            TMDB Reviews
            <span className="text-sm font-normal text-muted-foreground ml-2">
              (for {tvShow.name})
            </span>
          </h2>
          
          {tmdbReviews && tmdbReviews.length > 0 ? (
            <div className="space-y-4">
              {tmdbReviews.slice(0, 5).map((review: Review) => (
                <div 
                  key={review.id}
                  className="bg-card rounded-xl p-4 border border-border"
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      {review.author_details.avatar_path ? (
                        <AvatarImage 
                          src={
                            review.author_details.avatar_path.startsWith('/https')
                              ? review.author_details.avatar_path.slice(1)
                              : tmdbService.getProfileUrl(review.author_details.avatar_path)
                          } 
                        />
                      ) : null}
                      <AvatarFallback className="bg-muted">
                        <User className="h-5 w-5 text-muted-foreground" />
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className="font-medium text-foreground">
                          {review.author_details.username || review.author}
                        </span>
                        {review.author_details.rating && (
                          <div className="flex items-center gap-1 text-cinema-gold text-sm">
                            <Star className="h-3.5 w-3.5 fill-current" />
                            <span>{review.author_details.rating}/10</span>
                          </div>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(review.created_at), 'MMM d, yyyy')}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {formatReviewContent(review.content)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No TMDB reviews available for this show.</p>
          )}
        </div>

        {/* Community Reviews Section */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Community Reviews
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
                          <div className="flex items-center gap-1 text-cinema-gold text-sm">
                            <Star className="h-3.5 w-3.5 fill-current" />
                            <span>{review.rating}/10</span>
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
              <p className="text-muted-foreground text-sm mb-2">No community reviews yet.</p>
              {user && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowLogModal(true)}
                >
                  Be the first to review
                </Button>
              )}
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
