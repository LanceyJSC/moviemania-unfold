import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Tv, Star, Trash2, ChevronDown, ChevronUp, BookOpen } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { tmdbService } from '@/lib/tmdb';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const IMAGE_BASE = 'https://image.tmdb.org/t/p/w185';

interface TVShowGalleryCardProps {
  id: string;
  tvId: number;
  title: string;
  poster: string | null;
  userRating?: number | null;
  onDelete: () => void;
  children?: React.ReactNode;
}

interface SeasonReview {
  season_number: number;
  rating: number | null;
  notes: string | null;
  watched_date: string | null;
}

interface EpisodeReview {
  season_number: number;
  episode_number: number;
  rating: number | null;
  notes: string | null;
  watched_date: string | null;
}

interface SeriesRating {
  rating: number | null;
}

export const TVShowGalleryCard = ({
  id,
  tvId,
  title,
  poster,
  userRating,
  onDelete,
  children
}: TVShowGalleryCardProps) => {
  const { user } = useAuth();
  const [tmdbRating, setTmdbRating] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [seriesRating, setSeriesRating] = useState<number | null>(null);
  const [seasonReviews, setSeasonReviews] = useState<SeasonReview[]>([]);
  const [episodeReviews, setEpisodeReviews] = useState<EpisodeReview[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [seasonCount, setSeasonCount] = useState(0);
  const [episodeCount, setEpisodeCount] = useState(0);

  // Load counts on mount
  useEffect(() => {
    const loadCounts = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('tv_diary')
        .select('season_number, episode_number')
        .eq('user_id', user.id)
        .eq('tv_id', tvId);

      if (data) {
        const uniqueSeasons = new Set<number>();
        let episodes = 0;

        data.forEach(entry => {
          if (entry.season_number) {
            uniqueSeasons.add(entry.season_number);
          }
          if (entry.episode_number) {
            episodes++;
          }
        });

        setSeasonCount(uniqueSeasons.size);
        setEpisodeCount(episodes);
      }
    };
    
    loadCounts();
  }, [user, tvId]);

  useEffect(() => {
    const fetchTmdbRating = async () => {
      try {
        const details = await tmdbService.getTVShowDetails(tvId);
        setTmdbRating(details.vote_average);
      } catch (error) {
        console.error('Failed to fetch TMDB rating:', error);
      }
    };
    fetchTmdbRating();
  }, [tvId]);

  const loadReviews = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Load series-level rating from user_ratings
      const { data: ratingData } = await supabase
        .from('user_ratings')
        .select('rating')
        .eq('user_id', user.id)
        .eq('movie_id', tvId)
        .eq('media_type', 'tv')
        .maybeSingle();
      
      if (ratingData) {
        setSeriesRating(ratingData.rating);
      }

      // Load ALL diary entries for this TV show
      const { data } = await supabase
        .from('tv_diary')
        .select('season_number, episode_number, rating, notes, watched_date')
        .eq('user_id', user.id)
        .eq('tv_id', tvId);

      if (data) {
        const seasons: SeasonReview[] = [];
        const episodes: EpisodeReview[] = [];

        data.forEach(entry => {
          if (entry.season_number && !entry.episode_number) {
            seasons.push({
              season_number: entry.season_number,
              rating: entry.rating,
              notes: entry.notes,
              watched_date: entry.watched_date
            });
          } else if (entry.season_number && entry.episode_number) {
            episodes.push({
              season_number: entry.season_number,
              episode_number: entry.episode_number,
              rating: entry.rating,
              notes: entry.notes,
              watched_date: entry.watched_date
            });
          }
        });

        seasons.sort((a, b) => a.season_number - b.season_number);
        episodes.sort((a, b) => {
          if (a.season_number !== b.season_number) return a.season_number - b.season_number;
          return a.episode_number - b.episode_number;
        });

        setSeasonReviews(seasons);
        setEpisodeReviews(episodes);
      }
    } catch (error) {
      console.error('Failed to load reviews:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleExpand = () => {
    if (!isExpanded) {
      loadReviews();
    }
    setIsExpanded(!isExpanded);
  };

  const hasContent = seriesRating || userRating || seasonReviews.length > 0 || episodeReviews.length > 0;

  const getPosterUrl = (posterPath: string | null) => {
    if (!posterPath) return null;
    if (posterPath.startsWith('http')) return posterPath;
    return `${IMAGE_BASE}${posterPath}`;
  };

  const renderStars = (rating: number, size: string = 'h-3 w-3') => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${size} ${star <= rating ? 'fill-cinema-gold text-cinema-gold' : 'text-muted-foreground'}`}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <Card className="p-4">
      <div className="flex gap-4">
        <Link to={`/tv/${tvId}`}>
          {poster ? (
            <img src={getPosterUrl(poster) || ''} alt={title} className="w-16 h-24 object-cover rounded" />
          ) : (
            <div className="w-16 h-24 bg-muted rounded flex items-center justify-center">
              <Tv className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Tv className="h-4 w-4 text-primary shrink-0" />
            <Link to={`/tv/${tvId}`} className="font-semibold hover:underline line-clamp-1">
              {title}
            </Link>
          </div>

          <div className="flex items-center gap-4 mt-1">
            {tmdbRating !== null && (
              <div className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-cinema-gold text-cinema-gold" />
                <span className="text-sm text-muted-foreground">{tmdbRating.toFixed(1)}</span>
              </div>
            )}

            {userRating && userRating > 0 && (
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-3 w-3 ${star <= userRating ? 'fill-primary text-primary' : 'text-muted-foreground'}`}
                  />
                ))}
              </div>
            )}
          </div>

          {(seasonCount > 0 || episodeCount > 0) && (
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              {seasonCount > 0 && (
                <span>{seasonCount} {seasonCount === 1 ? 'Season' : 'Seasons'}</span>
              )}
              {episodeCount > 0 && (
                <span>{episodeCount} {episodeCount === 1 ? 'Episode' : 'Episodes'}</span>
              )}
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="mt-2 text-xs text-muted-foreground hover:text-foreground p-0 h-auto"
            onClick={handleToggleExpand}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-3 w-3 mr-1" />
                Hide details
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3 mr-1" />
                Show ratings & reviews
              </>
            )}
          </Button>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-border bg-card rounded-b-lg z-50 relative">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : (seasonReviews.length > 0 || episodeReviews.length > 0 || seriesRating || userRating) ? (
            <div className="space-y-4">
              {/* Series Rating */}
              {(seriesRating || userRating) && (
                <div className="p-3 bg-background rounded border border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">Series Rating</span>
                    {(seriesRating || userRating) ? (
                      renderStars(seriesRating || userRating || 0, 'h-4 w-4')
                    ) : (
                      <span className="text-xs text-muted-foreground">Not rated</span>
                    )}
                  </div>
                </div>
              )}

              {/* Season Reviews */}
              {seasonReviews.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2">Season Ratings</h4>
                  <div className="space-y-2">
                    {seasonReviews.map((review) => (
                      <div 
                        key={`season-${review.season_number}`}
                        className="p-3 bg-background rounded border border-border"
                      >
                        <Link 
                          to={`/tv/${tvId}/season/${review.season_number}`}
                          className="flex items-center justify-between hover:text-primary transition-colors"
                        >
                          <span className="text-sm font-medium text-foreground">Season {review.season_number}</span>
                          {review.rating ? (
                            renderStars(review.rating)
                          ) : (
                            <span className="text-xs text-muted-foreground">Logged</span>
                          )}
                        </Link>
                        {review.watched_date && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Watched: {formatDate(review.watched_date)}
                          </p>
                        )}
                        {review.notes && (
                          <div className="mt-2 flex items-start gap-2">
                            <BookOpen className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
                            <p className="text-xs text-muted-foreground line-clamp-2">{review.notes}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Episode Reviews */}
              {episodeReviews.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2">Episode Ratings</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {episodeReviews.map((review) => (
                      <div 
                        key={`ep-${review.season_number}-${review.episode_number}`}
                        className="p-3 bg-background rounded border border-border"
                      >
                        <Link 
                          to={`/tv/${tvId}/season/${review.season_number}`}
                          className="flex items-center justify-between hover:text-primary transition-colors"
                        >
                          <span className="text-sm font-medium text-foreground">
                            S{review.season_number} E{review.episode_number}
                          </span>
                          {review.rating ? (
                            renderStars(review.rating)
                          ) : (
                            <span className="text-xs text-muted-foreground">Watched</span>
                          )}
                        </Link>
                        {review.watched_date && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Watched: {formatDate(review.watched_date)}
                          </p>
                        )}
                        {review.notes && (
                          <div className="mt-2 flex items-start gap-2">
                            <BookOpen className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
                            <p className="text-xs text-muted-foreground line-clamp-2">{review.notes}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No ratings or reviews yet
            </p>
          )}
        </div>
      )}
    </Card>
  );
};