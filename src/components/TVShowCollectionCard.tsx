import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Tv, Star, Trash2, Pencil, ChevronDown, BookOpen, Flame, Check } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
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
  onEdit?: () => void;
  children?: React.ReactNode;
  defaultExpanded?: boolean;
  showWatchedOverlay?: boolean;
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

export const TVShowCollectionCard = ({
  id: _id,
  tvId,
  title,
  poster,
  userRating,
  onDelete,
  onEdit,
  children,
  defaultExpanded: _defaultExpanded = false,
  showWatchedOverlay = false,
}: TVShowCollectionCardProps) => {
  const { user } = useAuth();
  const [tmdbRating, setTmdbRating] = useState<number | null>(null);
  const [showTitle, setShowTitle] = useState(title);
  const [showDetailsSheet, setShowDetailsSheet] = useState(false);
  const [seriesRating, setSeriesRating] = useState<number | null>(null);
  const [seasonReviews, setSeasonReviews] = useState<SeasonReview[]>([]);
  const [episodeReviews, setEpisodeReviews] = useState<EpisodeReview[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [seasonCount, setSeasonCount] = useState(0);
  const [episodeCount, setEpisodeCount] = useState(0);
  const [seriesNotes, setSeriesNotes] = useState<string | null>(null);
  const [firstAirYear, setFirstAirYear] = useState<string | null>(null);
  const [genres, setGenres] = useState<string[]>([]);
  const [overview, setOverview] = useState<string | null>(null);

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
        if (details.name) setShowTitle(details.name);
        setFirstAirYear(details.first_air_date?.split('-')[0] || null);
        setGenres((details.genres || []).slice(0, 2).map((g: any) => g.name));
        setOverview(details.overview || null);
      } catch (error) {
        console.error('Failed to fetch TMDB data:', error);
      }
    };
    fetchTmdbData();
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

      // Load series-level diary entry
      const { data: seriesDiaryData } = await supabase
        .from('tv_diary')
        .select('notes, rating')
        .eq('user_id', user.id)
        .eq('tv_id', tvId)
        .is('season_number', null)
        .is('episode_number', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (seriesDiaryData) {
        setSeriesNotes(seriesDiaryData.notes);
        if (!ratingData?.rating && seriesDiaryData.rating) {
          setSeriesRating(seriesDiaryData.rating);
        }
      }

      // Load ALL diary entries for this TV show
      const { data } = await supabase
        .from('tv_diary')
        .select('season_number, episode_number, rating, notes, watched_date')
        .eq('user_id', user.id)
        .eq('tv_id', tvId);

      if (data) {
        const seasonMap = new Map<number, SeasonReview>();
        const episodeMap = new Map<string, EpisodeReview>();

        data.forEach(entry => {
          if (entry.season_number && !entry.episode_number) {
            const existing = seasonMap.get(entry.season_number);
            if (!existing || entry.rating) {
              seasonMap.set(entry.season_number, {
                season_number: entry.season_number,
                rating: entry.rating,
                notes: entry.notes,
                watched_date: entry.watched_date
              });
            }
          } else if (entry.season_number && entry.episode_number) {
            const key = `${entry.season_number}-${entry.episode_number}`;
            const existing = episodeMap.get(key);
            if (!existing || entry.rating) {
              episodeMap.set(key, {
                season_number: entry.season_number,
                episode_number: entry.episode_number,
                rating: entry.rating,
                notes: entry.notes,
                watched_date: entry.watched_date
              });
            }
          }
        });

        setSeasonReviews(Array.from(seasonMap.values()).sort((a, b) => a.season_number - b.season_number));
        setEpisodeReviews(Array.from(episodeMap.values()).sort((a, b) => {
          if (a.season_number !== b.season_number) return a.season_number - b.season_number;
          return a.episode_number - b.episode_number;
        }));
      }
    } catch (error) {
      console.error('Failed to load reviews:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShowDetails = () => {
    loadReviews();
    setShowDetailsSheet(true);
  };

  const getPosterUrl = (posterPath: string | null) => {
    if (!posterPath) return null;
    if (posterPath.startsWith('http')) return posterPath;
    return `${IMAGE_BASE}${posterPath}`;
  };

  const displayRating = seriesRating || userRating;

  // Group episodes by season for the details sheet
  const getEpisodesBySeason = () => {
    const grouped: Record<number, EpisodeReview[]> = {};
    episodeReviews.forEach(ep => {
      if (!grouped[ep.season_number]) {
        grouped[ep.season_number] = [];
      }
      grouped[ep.season_number].push(ep);
    });
    return grouped;
  };

  return (
    <>
      <Card className="p-3 sm:p-4 hover:bg-accent/5 transition-colors">
        <div className="flex gap-3 sm:gap-4">
          <Link to={`/tv/${tvId}`} className="relative shrink-0">
            {poster ? (
              <img src={getPosterUrl(poster) || ''} alt={title} className="w-20 h-28 object-cover rounded-md shadow-sm" />
            ) : (
              <div className="w-20 h-28 bg-muted rounded-md flex items-center justify-center">
                <Tv className="h-7 w-7 text-muted-foreground" />
              </div>
            )}
            {showWatchedOverlay && (
              <div className="absolute inset-0 bg-green-600/40 rounded-md flex items-center justify-center">
                <Check className="h-5 w-5 text-white" />
              </div>
            )}
          </Link>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <Tv className="h-3.5 w-3.5 text-primary shrink-0" />
              <Link to={`/tv/${tvId}`} className="font-semibold text-sm hover:underline line-clamp-1">
                {showTitle}
              </Link>
            </div>

            {/* Year & Genres */}
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              {firstAirYear && (
                <span className="text-xs text-muted-foreground">{firstAirYear}</span>
              )}
              {genres.map(genre => (
                <Badge key={genre} variant="secondary" className="text-[10px] h-4 px-1.5 py-0">
                  {genre}
                </Badge>
              ))}
            </div>

            <div className="flex items-center gap-3 mt-1.5">
              {tmdbRating !== null && (
                <div className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-cinema-gold text-cinema-gold" />
                  <span className="text-xs text-muted-foreground">{tmdbRating.toFixed(1)}</span>
                </div>
              )}
              {displayRating && displayRating > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-cinema-red/20 rounded text-cinema-red font-semibold text-xs">
                  <Flame className="h-3 w-3 fill-current" />
                  {displayRating}/5
                </span>
              )}
            </div>

            {(seasonCount > 0 || episodeCount > 0) && (
              <div className="flex items-center gap-1.5 mt-1.5">
                {seasonCount > 0 && (
                  <Badge variant="outline" className="text-[10px] h-4 px-1.5 py-0">
                    {seasonCount} {seasonCount === 1 ? 'Season' : 'Seasons'}
                  </Badge>
                )}
                {episodeCount > 0 && (
                  <Badge variant="outline" className="text-[10px] h-4 px-1.5 py-0">
                    {episodeCount} {episodeCount === 1 ? 'Ep' : 'Eps'}
                  </Badge>
                )}
              </div>
            )}

            {/* Overview */}
            {overview && (
              <p className="text-[11px] text-muted-foreground line-clamp-1 mt-1">{overview}</p>
            )}

            {/* Children content */}
            {children}

            {/* View Details Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleShowDetails}
              className="mt-2 h-8 px-3 text-xs touch-manipulation active:scale-95"
            >
              <ChevronDown className="h-3.5 w-3.5" />
              View ratings & reviews
            </Button>
          </div>

          <div className="flex flex-col gap-1 shrink-0">
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onEdit}
                className="text-muted-foreground hover:text-foreground h-9 w-9 touch-manipulation"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 h-10 w-10 touch-manipulation"
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete "{showTitle}"?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all your data for this TV show including watched episodes, ratings, reviews, and diary entries.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={onDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </Card>

      {/* Details Bottom Sheet */}
      <Drawer open={showDetailsSheet} onOpenChange={setShowDetailsSheet}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="border-b border-border">
            <DrawerTitle className="text-center">{showTitle}</DrawerTitle>
          </DrawerHeader>
          
          <div className="overflow-y-auto p-4 space-y-4" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            ) : (
              <>
                {/* Show Rating */}
                <div className="bg-card rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-foreground">Show Rating</h3>
                    {(seriesRating || userRating) ? (
                      <span className="px-3 py-1 bg-cinema-red/20 rounded-lg text-cinema-red font-bold flex items-center gap-1">
                        <Flame className="h-4 w-4 fill-current" />
                        {seriesRating || userRating}/5
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Not rated</span>
                    )}
                  </div>
                  {seriesNotes ? (
                    <div className="flex items-start gap-2 mt-2">
                      <BookOpen className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <p className="text-sm text-muted-foreground">{seriesNotes}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No review written yet.</p>
                  )}
                </div>

                {/* Seasons & Episodes */}
                {(seasonReviews.length > 0 || episodeReviews.length > 0) && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-foreground">Your Logged Seasons & Episodes</h3>
                    
                    {(() => {
                      const episodesBySeason = getEpisodesBySeason();
                      const allSeasons = new Set<number>();
                      seasonReviews.forEach(r => allSeasons.add(r.season_number));
                      episodeReviews.forEach(r => allSeasons.add(r.season_number));
                      const sortedSeasons = Array.from(allSeasons).sort((a, b) => a - b);

                      return sortedSeasons.map(seasonNum => {
                        const seasonReview = seasonReviews.find(r => r.season_number === seasonNum);
                        const episodes = episodesBySeason[seasonNum] || [];

                        return (
                          <div key={seasonNum} className="bg-card rounded-xl border border-border overflow-hidden">
                            {/* Season Header */}
                            <div className="p-3 bg-muted/30 flex items-center justify-between">
                              <span className="font-medium">Season {seasonNum}</span>
                              <div className="flex items-center gap-2">
                                {episodes.length > 0 && (
                                  <span className="text-xs text-muted-foreground">{episodes.length} ep</span>
                                )}
                                {seasonReview?.rating && (
                                  <span className="px-2 py-0.5 bg-cinema-red/20 rounded text-cinema-red text-xs font-semibold flex items-center gap-1">
                                    <Flame className="h-3 w-3 fill-current" />
                                    {seasonReview.rating}/5
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Episodes */}
                            {episodes.length > 0 && (
                              <div className="divide-y divide-border">
                                {episodes.map(ep => (
                                  <div key={`${ep.season_number}-${ep.episode_number}`} className="p-3 flex items-center justify-between">
                                    <div>
                                      <span className="text-sm">Episode {ep.episode_number}</span>
                                      {ep.watched_date && (
                                        <p className="text-xs text-muted-foreground">
                                          {new Date(ep.watched_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </p>
                                      )}
                                    </div>
                                    {ep.rating && (
                                      <span className="px-2 py-0.5 bg-cinema-red/20 rounded text-cinema-red text-xs font-semibold flex items-center gap-1">
                                        <Flame className="h-3 w-3 fill-current" />
                                        {ep.rating}/5
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>
                )}

                {/* Empty state */}
                {!seriesRating && !userRating && seasonReviews.length === 0 && episodeReviews.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No ratings or reviews logged yet.</p>
                    <Link to={`/tv/${tvId}`}>
                      <Button variant="outline" className="mt-4">
                        Go to show page to log
                      </Button>
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="p-4 border-t border-border">
            <DrawerClose asChild>
              <Button variant="outline" className="w-full h-12 rounded-xl">
                Close
              </Button>
            </DrawerClose>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
};
