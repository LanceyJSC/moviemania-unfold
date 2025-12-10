import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Film, Tv, Star, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
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
}

interface EpisodeReview {
  season_number: number;
  episode_number: number;
  rating: number | null;
  notes: string | null;
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
  const [seasonReviews, setSeasonReviews] = useState<SeasonReview[]>([]);
  const [episodeReviews, setEpisodeReviews] = useState<EpisodeReview[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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
      const { data } = await supabase
        .from('tv_diary')
        .select('season_number, episode_number, rating, notes')
        .eq('user_id', user.id)
        .eq('tv_id', tvId)
        .not('rating', 'is', null);

      if (data) {
        // Separate season-level (episode_number is null) from episode-level entries
        const seasons: SeasonReview[] = [];
        const episodes: EpisodeReview[] = [];

        data.forEach(entry => {
          if (entry.season_number && !entry.episode_number) {
            seasons.push({
              season_number: entry.season_number,
              rating: entry.rating,
              notes: entry.notes
            });
          } else if (entry.season_number && entry.episode_number) {
            episodes.push({
              season_number: entry.season_number,
              episode_number: entry.episode_number,
              rating: entry.rating,
              notes: entry.notes
            });
          }
        });

        // Sort by season/episode number
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

  const hasReviews = seasonReviews.length > 0 || episodeReviews.length > 0;

  return (
    <Card className="p-4">
      <div className="flex gap-4">
        <Link to={`/tv/${tvId}`}>
          {poster ? (
            <img src={`${IMAGE_BASE}${poster}`} alt={title} className="w-16 h-24 object-cover rounded" />
          ) : (
            <div className="w-16 h-24 bg-muted rounded flex items-center justify-center">
              <Tv className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
        </Link>
        <div className="flex-1 min-w-0">
          {/* Title with media type icon */}
          <div className="flex items-center gap-2">
            <Tv className="h-4 w-4 text-primary shrink-0" />
            <Link to={`/tv/${tvId}`} className="font-semibold hover:underline line-clamp-1">
              {title}
            </Link>
          </div>

          {/* Ratings row */}
          <div className="flex items-center gap-4 mt-1">
            {/* TMDB Rating */}
            {tmdbRating !== null && (
              <div className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-cinema-gold text-cinema-gold" />
                <span className="text-sm text-muted-foreground">{tmdbRating.toFixed(1)}</span>
              </div>
            )}

            {/* User Rating (series level) */}
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

          {/* Additional content slot */}
          {children}

          {/* Expand button for season/episode reviews */}
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 text-xs text-muted-foreground hover:text-foreground p-0 h-auto"
            onClick={handleToggleExpand}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-3 w-3 mr-1" />
                Hide reviews
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3 mr-1" />
                Show season & episode reviews
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

      {/* Expanded section with season/episode reviews */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-border">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : hasReviews ? (
            <div className="space-y-4">
              {/* Season Reviews */}
              {seasonReviews.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2">Season Reviews</h4>
                  <div className="space-y-2">
                    {seasonReviews.map((review) => (
                      <Link 
                        key={`season-${review.season_number}`}
                        to={`/tv/${tvId}/season/${review.season_number}`}
                        className="flex items-center justify-between p-2 bg-card/50 rounded hover:bg-card transition-colors"
                      >
                        <span className="text-sm text-foreground">Season {review.season_number}</span>
                        <div className="flex items-center gap-1">
                          {review.rating && (
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-3 w-3 ${star <= review.rating! ? 'fill-cinema-gold text-cinema-gold' : 'text-muted-foreground'}`}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Episode Reviews */}
              {episodeReviews.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2">Episode Reviews</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {episodeReviews.map((review) => (
                      <Link 
                        key={`ep-${review.season_number}-${review.episode_number}`}
                        to={`/tv/${tvId}/season/${review.season_number}`}
                        className="flex items-center justify-between p-2 bg-card/50 rounded hover:bg-card transition-colors"
                      >
                        <span className="text-sm text-foreground">
                          S{review.season_number} E{review.episode_number}
                        </span>
                        <div className="flex items-center gap-1">
                          {review.rating && (
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-3 w-3 ${star <= review.rating! ? 'fill-cinema-gold text-cinema-gold' : 'text-muted-foreground'}`}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No season or episode reviews yet
            </p>
          )}
        </div>
      )}
    </Card>
  );
};
