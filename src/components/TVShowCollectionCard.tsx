import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Tv, Star, Trash2, ChevronDown, ChevronUp, BookOpen, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { tmdbService } from '@/lib/tmdb';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const IMAGE_BASE = 'https://image.tmdb.org/t/p/w185';

interface TVShowCollectionCardProps {
  id: string;
  tvId: number;
  title: string;
  poster: string | null;
  userRating?: number | null;
  onDelete: () => void;
  children?: React.ReactNode;
  defaultExpanded?: boolean;
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

export const TVShowCollectionCard = ({
  id,
  tvId,
  title,
  poster,
  userRating,
  onDelete,
  children,
  defaultExpanded = false
}: TVShowCollectionCardProps) => {
  const { user } = useAuth();
  const [tmdbRating, setTmdbRating] = useState<number | null>(null);
  const [showTitle, setShowTitle] = useState(title);
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [seriesRating, setSeriesRating] = useState<number | null>(null);
  const [seasonReviews, setSeasonReviews] = useState<SeasonReview[]>([]);
  const [episodeReviews, setEpisodeReviews] = useState<EpisodeReview[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [seasonCount, setSeasonCount] = useState(0);
  const [episodeCount, setEpisodeCount] = useState(0);
  const [seriesNotes, setSeriesNotes] = useState<string | null>(null);
  const [seriesWatchedDate, setSeriesWatchedDate] = useState<string | null>(null);

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
    const fetchTmdbData = async () => {
      try {
        const details = await tmdbService.getTVShowDetails(tvId);
        setTmdbRating(details.vote_average);
        // Use TMDB title to ensure we show the actual show name, not episode-specific title
        if (details.name) {
          setShowTitle(details.name);
        }
      } catch (error) {
        console.error('Failed to fetch TMDB data:', error);
      }
    };
    fetchTmdbData();
  }, [tvId]);

  // Auto-load reviews if defaultExpanded is true
  useEffect(() => {
    if (defaultExpanded && user) {
      loadReviews();
    }
  }, [defaultExpanded, user, tvId]);

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

      // Load series-level diary entry (no season/episode number)
      const { data: seriesDiaryData } = await supabase
        .from('tv_diary')
        .select('notes, watched_date, rating')
        .eq('user_id', user.id)
        .eq('tv_id', tvId)
        .is('season_number', null)
        .is('episode_number', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (seriesDiaryData) {
        setSeriesNotes(seriesDiaryData.notes);
        setSeriesWatchedDate(seriesDiaryData.watched_date);
        // If no rating from user_ratings, use diary rating
        if (!ratingData?.rating && seriesDiaryData.rating) {
          setSeriesRating(seriesDiaryData.rating);
        }
      }

      // Load ALL diary entries for this TV show (seasons and episodes)
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

  const renderRating = (rating: number, size: 'sm' | 'md' = 'sm') => {
    const sizeClasses = size === 'sm' ? 'text-xs px-1.5 py-0.5' : 'text-sm px-2 py-1';
    return (
      <span className={`inline-flex items-center bg-cinema-gold/20 rounded text-cinema-gold font-semibold ${sizeClasses}`}>
        {rating}/10
      </span>
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
              {showTitle}
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
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/20 rounded text-primary font-semibold text-xs">
                {userRating}/10
              </span>
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
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete "{showTitle}"?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete all data for this TV show including:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>All watched episodes and seasons</li>
                  <li>All ratings and reviews</li>
                  <li>Diary entries and notes</li>
                  <li>Watchlist and favorites status</li>
                </ul>
                <p className="mt-2 font-medium">This action cannot be undone.</p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={onDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete All Data
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-border bg-card rounded-b-lg z-50 relative">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : (
            <div className="space-y-2">
              {/* Show Rating - Collapsible */}
              <Collapsible defaultOpen={!!(seriesRating || userRating || seriesNotes)}>
                <CollapsibleTrigger className="w-full p-3 bg-background rounded border border-border hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-90" />
                      <span className="text-sm font-semibold text-foreground">Show Rating</span>
                    </div>
                    {(seriesRating || userRating) ? (
                      renderRating(seriesRating || userRating || 0, 'md')
                    ) : (
                      <span className="text-xs text-muted-foreground">Not rated</span>
                    )}
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="px-3 pb-3 pt-2 bg-background rounded-b border-x border-b border-border -mt-1">
                  {seriesWatchedDate && (
                    <p className="text-xs text-muted-foreground">
                      Watched: {formatDate(seriesWatchedDate)}
                    </p>
                  )}
                  {seriesNotes ? (
                    <div className="mt-2 flex items-start gap-2">
                      <BookOpen className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
                      <p className="text-xs text-muted-foreground">{seriesNotes}</p>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No notes for this show yet.</p>
                  )}
                </CollapsibleContent>
              </Collapsible>

              {/* Seasons - Collapsible */}
              {(seasonReviews.length > 0 || episodeReviews.length > 0) && (
                <Collapsible defaultOpen={true}>
                  <CollapsibleTrigger className="w-full p-3 bg-background rounded border border-border hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-90" />
                        <span className="text-sm font-semibold text-foreground">Seasons</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {(() => {
                          const allSeasons = new Set<number>();
                          seasonReviews.forEach(r => allSeasons.add(r.season_number));
                          episodeReviews.forEach(r => allSeasons.add(r.season_number));
                          return `${allSeasons.size} logged`;
                        })()}
                      </span>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-2 pt-2">
                    {(() => {
                      const allSeasons = new Set<number>();
                      seasonReviews.forEach(r => allSeasons.add(r.season_number));
                      episodeReviews.forEach(r => allSeasons.add(r.season_number));
                      const sortedSeasons = Array.from(allSeasons).sort((a, b) => a - b);
                      
                      return sortedSeasons.map((seasonNum) => {
                        const seasonReview = seasonReviews.find(r => r.season_number === seasonNum);
                        const seasonEpisodes = episodeReviews.filter(r => r.season_number === seasonNum);
                        
                        return (
                          <Collapsible key={`season-${seasonNum}`} defaultOpen={seasonEpisodes.length > 0}>
                            <div className="ml-2 border-l-2 border-border pl-3">
                              <CollapsibleTrigger className="w-full p-2 bg-muted/30 rounded border border-border/50 hover:bg-muted/50 transition-colors">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    {seasonEpisodes.length > 0 && (
                                      <ChevronRight className="h-3 w-3 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-90" />
                                    )}
                                    <Link 
                                      to={`/tv/${tvId}/season/${seasonNum}`}
                                      className="text-sm font-medium text-foreground hover:text-primary"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      Season {seasonNum}
                                    </Link>
                                  </div>
                                  {seasonReview?.rating ? (
                                    renderRating(seasonReview.rating)
                                  ) : (
                                    <span className="text-xs text-muted-foreground">
                                      {seasonEpisodes.length > 0 ? `${seasonEpisodes.length} ep` : 'Logged'}
                                    </span>
                                  )}
                                </div>
                              </CollapsibleTrigger>
                              
                              {/* Season details and notes */}
                              {(seasonReview?.watched_date || seasonReview?.notes) && (
                                <div className="px-2 py-1 text-xs text-muted-foreground">
                                  {seasonReview?.watched_date && (
                                    <p>Watched: {formatDate(seasonReview.watched_date)}</p>
                                  )}
                                  {seasonReview?.notes && (
                                    <div className="mt-1 flex items-start gap-1">
                                      <BookOpen className="h-3 w-3 mt-0.5 shrink-0" />
                                      <p className="line-clamp-2">{seasonReview.notes}</p>
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {/* Episodes nested under this season */}
                              {seasonEpisodes.length > 0 && (
                                <CollapsibleContent className="space-y-1 pt-1 ml-2">
                                  {seasonEpisodes.map((ep) => (
                                    <div 
                                      key={`ep-${ep.season_number}-${ep.episode_number}`}
                                      className="p-2 bg-muted/20 rounded border border-border/30"
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium text-foreground">
                                          Episode {ep.episode_number}
                                        </span>
                                        {ep.rating ? (
                                          renderRating(ep.rating)
                                        ) : (
                                          <span className="text-xs text-muted-foreground">Watched</span>
                                        )}
                                      </div>
                                      {ep.watched_date && (
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                          Watched: {formatDate(ep.watched_date)}
                                        </p>
                                      )}
                                      {ep.notes && (
                                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{ep.notes}</p>
                                      )}
                                    </div>
                                  ))}
                                </CollapsibleContent>
                              )}
                            </div>
                          </Collapsible>
                        );
                      });
                    })()}
                  </CollapsibleContent>
                </Collapsible>
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  );
};