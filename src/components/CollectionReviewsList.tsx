import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Flame, Film, Tv, Trash2, MessageCircle, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { MobileFilterPills } from '@/components/MobileFilterPills';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
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

const IMAGE_BASE = 'https://image.tmdb.org/t/p/w92';
const flameColors = ['text-amber-500', 'text-orange-500', 'text-orange-600', 'text-red-500', 'text-red-600'];

const reviewFilterOptions = [
  { value: 'all', label: 'All' },
  { value: 'movie', label: 'Movies' },
  { value: 'tv-show', label: 'TV Shows' },
  { value: 'episode', label: 'Episodes' },
];

interface Review {
  id: string;
  movie_id: number;
  movie_title: string;
  movie_poster: string | null;
  rating: number | null;
  review_text: string | null;
  created_at: string;
  is_spoiler: boolean | null;
  media_type: string | null;
  season_number: number | null;
  episode_number: number | null;
}

interface CollectionReviewsListProps {
  onCountChange?: (count: number) => void;
}

type RenderItem =
  | { type: 'standalone'; review: Review; sortDate: string }
  | { type: 'episode-group'; movieId: number; reviews: Review[]; sortDate: string };

const getPosterUrl = (poster: string | null) => {
  if (!poster) return null;
  return poster.startsWith('http') ? poster : `${IMAGE_BASE}${poster}`;
};

const FlameRating = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-0.5">
    {Array.from({ length: rating }).map((_, i) => (
      <Flame key={i} className={`h-3 w-3 fill-current ${flameColors[i] || flameColors[4]}`} />
    ))}
  </div>
);

const DeleteReviewButton = ({ review, onDelete }: { review: Review; onDelete: (id: string) => void }) => (
  <AlertDialog>
    <AlertDialogTrigger asChild>
      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
        <Trash2 className="h-3 w-3" />
      </Button>
    </AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Delete review?</AlertDialogTitle>
        <AlertDialogDescription>This will permanently remove your review for "{review.movie_title}".</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction onClick={() => onDelete(review.id)}>Delete</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

const StandaloneReviewRow = ({ review, onDelete }: { review: Review; onDelete: (id: string) => void }) => {
  const posterUrl = getPosterUrl(review.movie_poster);
  return (
    <div className="flex gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent/5 transition-colors">
      <Link to={`/${review.media_type === 'tv' ? 'tv' : 'movie'}/${review.movie_id}/reviews`} className="shrink-0">
        <div className="w-12 h-[72px] rounded overflow-hidden bg-muted">
          {posterUrl ? (
            <img src={posterUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Film className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
        </div>
      </Link>
      <div className="flex-1 min-w-0">
        <Link to={`/${review.media_type === 'tv' ? 'tv' : 'movie'}/${review.movie_id}/reviews`} className="hover:underline">
          <div className="flex items-center gap-1.5">
            {review.media_type === 'tv' ? (
              <Tv className="h-3 w-3 text-muted-foreground shrink-0" />
            ) : (
              <Film className="h-3 w-3 text-muted-foreground shrink-0" />
            )}
            <p className="text-sm font-medium text-foreground truncate">{review.movie_title}</p>
          </div>
        </Link>
        {review.rating != null && review.rating > 0 && (
          <div className="mt-0.5"><FlameRating rating={review.rating} /></div>
        )}
        {review.review_text && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{review.review_text}</p>
        )}
        <p className="text-[10px] text-muted-foreground/70 mt-1">
          {new Date(review.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </p>
      </div>
      <div className="shrink-0 flex flex-col gap-1">
        <DeleteReviewButton review={review} onDelete={onDelete} />
      </div>
    </div>
  );
};

const getSeriesName = (title: string) => {
  // Strip episode suffixes like " - S6E1" or " S1E2"
  return title.replace(/\s*[-–]\s*S\d+E\d+.*$/i, '').replace(/\s+S\d+E\d+.*$/i, '').trim();
};

const EpisodeGroupRow = ({ reviews, onDelete }: { reviews: Review[]; onDelete: (id: string) => void }) => {
  const first = reviews[0];
  const posterUrl = getPosterUrl(first.movie_poster);
  const seriesName = getSeriesName(first.movie_title);

  // Group by season
  const seasonMap = new Map<number, Review[]>();
  for (const r of reviews) {
    const s = r.season_number ?? 0;
    const arr = seasonMap.get(s) || [];
    arr.push(r);
    seasonMap.set(s, arr);
  }
  const seasons = [...seasonMap.entries()].sort((a, b) => a[0] - b[0]);
  // Sort episodes within each season
  for (const [, eps] of seasons) {
    eps.sort((a, b) => (a.episode_number ?? 0) - (b.episode_number ?? 0));
  }

  return (
    <Collapsible>
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <CollapsibleTrigger className="w-full flex items-center gap-3 p-3 hover:bg-accent/5 transition-colors cursor-pointer group">
          <Link to={`/tv/${first.movie_id}/reviews`} className="shrink-0" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-[72px] rounded overflow-hidden bg-muted">
              {posterUrl ? (
                <img src={posterUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Tv className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </div>
          </Link>
          <div className="flex-1 min-w-0 text-left">
            <div className="flex items-center gap-1.5">
              <Tv className="h-3 w-3 text-muted-foreground shrink-0" />
              <p className="text-sm font-medium text-foreground truncate">{seriesName}</p>
            </div>
            <span className="text-[11px] text-muted-foreground mt-0.5 inline-block">
              {reviews.length} episode review{reviews.length !== 1 ? 's' : ''} · {seasons.length} season{seasons.length !== 1 ? 's' : ''}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="border-t border-border">
            {seasons.map(([seasonNum, eps]) => (
              <div key={seasonNum}>
                <div className="px-3 py-1.5 pl-[72px] bg-muted/30">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                    Season {seasonNum}
                  </span>
                </div>
                <div className="divide-y divide-border">
                  {eps.map(review => (
                    <div key={review.id} className="flex items-center gap-2 px-3 py-2 pl-[84px]">
                      <span className="text-[10px] text-muted-foreground shrink-0 bg-muted px-1.5 py-0.5 rounded font-medium">
                        E{review.episode_number}
                      </span>
                      <div className="flex-1 min-w-0">
                        {review.rating != null && review.rating > 0 && <FlameRating rating={review.rating} />}
                        {review.review_text && (
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{review.review_text}</p>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground/70 shrink-0">
                        {new Date(review.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                      <DeleteReviewButton review={review} onDelete={onDelete} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};

export const CollectionReviewsList = ({ onCountChange }: CollectionReviewsListProps) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [mediaTypeFilter, setMediaTypeFilter] = useState('all');

  useEffect(() => {
    if (user) fetchReviews();
  }, [user]);

  useEffect(() => {
    onCountChange?.(reviews.length);
  }, [reviews.length, onCountChange]);

  const fetchReviews = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_reviews')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteReview = async (id: string) => {
    try {
      const { error } = await supabase.from('user_reviews').delete().eq('id', id);
      if (error) throw error;
      setReviews(prev => prev.filter(r => r.id !== id));
      toast.success('Review deleted');
    } catch {
      toast.error('Failed to delete review');
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <Card className="p-8 text-center border-dashed">
        <MessageCircle className="h-14 w-14 mx-auto mb-4 text-muted-foreground/50" />
        <p className="text-lg font-semibold text-foreground mb-1">No reviews yet</p>
        <p className="text-sm text-muted-foreground">Write reviews on movie and TV show pages</p>
      </Card>
    );
  }

  const filteredReviews = mediaTypeFilter === 'all'
    ? reviews
    : mediaTypeFilter === 'episode'
      ? reviews.filter(r => r.media_type === 'tv' && r.episode_number != null)
      : mediaTypeFilter === 'tv-show'
        ? reviews.filter(r => r.media_type === 'tv' && r.episode_number == null)
        : reviews.filter(r => r.media_type === mediaTypeFilter);

  // Partition into standalone and episode reviews
  const standaloneReviews = filteredReviews.filter(
    r => r.media_type === 'movie' || (r.media_type === 'tv' && r.episode_number == null)
  );
  const episodeReviews = filteredReviews.filter(
    r => r.media_type === 'tv' && r.episode_number != null
  );

  // Group episodes by movie_id
  const episodeGroups = new Map<number, Review[]>();
  for (const r of episodeReviews) {
    const arr = episodeGroups.get(r.movie_id) || [];
    arr.push(r);
    episodeGroups.set(r.movie_id, arr);
  }

  // Build unified render list sorted by most recent date
  const renderItems: RenderItem[] = [];
  for (const review of standaloneReviews) {
    renderItems.push({ type: 'standalone', review, sortDate: review.created_at });
  }
  for (const [movieId, group] of episodeGroups) {
    const mostRecent = group.reduce((a, b) => (a.created_at > b.created_at ? a : b));
    renderItems.push({ type: 'episode-group', movieId, reviews: group, sortDate: mostRecent.created_at });
  }
  renderItems.sort((a, b) => b.sortDate.localeCompare(a.sortDate));

  return (
    <div className="space-y-3">
      <MobileFilterPills
        options={reviewFilterOptions}
        selectedValue={mediaTypeFilter}
        onSelect={setMediaTypeFilter}
      />
      {renderItems.length === 0 && reviews.length > 0 ? (
        <Card className="p-6 text-center border-dashed">
          <p className="text-sm text-muted-foreground">
            No {mediaTypeFilter === 'movie' ? 'movie' : mediaTypeFilter === 'episode' ? 'episode' : 'TV show'} reviews yet
          </p>
        </Card>
      ) : null}
      {renderItems.map(item =>
        item.type === 'standalone' ? (
          <StandaloneReviewRow key={item.review.id} review={item.review} onDelete={deleteReview} />
        ) : (
          <EpisodeGroupRow key={`group-${item.movieId}`} reviews={item.reviews} onDelete={deleteReview} />
        )
      )}
    </div>
  );
};
