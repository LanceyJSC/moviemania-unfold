import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Flame, Film, Tv, Trash2, MessageCircle, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { MobileFilterPills } from '@/components/MobileFilterPills';
import { CollectionPosterGrid, PosterGridItem } from '@/components/CollectionPosterGrid';

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
  viewMode?: 'grid' | 'list';
}

type RenderItem =
  | { type: 'standalone'; review: Review; sortDate: string }
  | { type: 'tv-group'; movieId: number; seriesReview: Review | null; episodeReviews: Review[]; sortDate: string };

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

const TVGroupRow = ({ seriesReview, episodeReviews, onDelete }: { seriesReview: Review | null; episodeReviews: Review[]; onDelete: (id: string) => void }) => {
  const representative = seriesReview || episodeReviews[0];
  if (!representative) return null;
  const posterUrl = getPosterUrl(representative.movie_poster);
  const seriesName = getSeriesName(representative.movie_title);
  const totalReviews = (seriesReview ? 1 : 0) + episodeReviews.length;

  return (
    <Link to={`/tv/${representative.movie_id}/reviews`} className="block">
      <div className="flex gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent/5 transition-colors">
        <div className="shrink-0">
          <div className="w-12 h-[72px] rounded overflow-hidden bg-muted">
            {posterUrl ? (
              <img src={posterUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Tv className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <Tv className="h-3 w-3 text-muted-foreground shrink-0" />
            <p className="text-sm font-medium text-foreground truncate">{seriesName}</p>
          </div>
          {seriesReview?.rating != null && seriesReview.rating > 0 && (
            <div className="mt-0.5"><FlameRating rating={seriesReview.rating} /></div>
          )}
          {seriesReview?.review_text && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{seriesReview.review_text}</p>
          )}
          <p className="text-[11px] text-muted-foreground/70 mt-1">
            {totalReviews} review{totalReviews !== 1 ? 's' : ''}
            {episodeReviews.length > 0 && ` · ${episodeReviews.length} episode`}
          </p>
        </div>
        <div className="shrink-0 flex items-center">
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    </Link>
  );
};

export const CollectionReviewsList = ({ onCountChange, viewMode = 'list' }: CollectionReviewsListProps) => {
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
      <div className={viewMode === 'grid' ? 'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2' : 'space-y-3'}>
        {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className={viewMode === 'grid' ? 'aspect-[2/3] w-full rounded-lg' : 'h-24 w-full rounded-lg'} />)}
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

  // Merge series-level TV reviews with their episode groups
  const tvGroups = new Map<number, { seriesReview: Review | null; episodeReviews: Review[] }>();
  
  // First add episode groups
  for (const [movieId, group] of episodeGroups) {
    tvGroups.set(movieId, { seriesReview: null, episodeReviews: group });
  }
  
  // Then merge series-level TV reviews
  const movieStandaloneReviews: Review[] = [];
  for (const review of standaloneReviews) {
    if (review.media_type === 'tv') {
      const existing = tvGroups.get(review.movie_id);
      if (existing) {
        existing.seriesReview = review;
      } else {
        tvGroups.set(review.movie_id, { seriesReview: review, episodeReviews: [] });
      }
    } else {
      movieStandaloneReviews.push(review);
    }
  }

  // Build unified render list
  const renderItems: RenderItem[] = [];
  for (const review of movieStandaloneReviews) {
    renderItems.push({ type: 'standalone', review, sortDate: review.created_at });
  }
  for (const [movieId, group] of tvGroups) {
    const allDates = [
      ...(group.seriesReview ? [group.seriesReview.created_at] : []),
      ...group.episodeReviews.map(r => r.created_at),
    ];
    const mostRecent = allDates.reduce((a, b) => (a > b ? a : b));
    renderItems.push({ type: 'tv-group', movieId, seriesReview: group.seriesReview, episodeReviews: group.episodeReviews, sortDate: mostRecent });
  }
  renderItems.sort((a, b) => b.sortDate.localeCompare(a.sortDate));

  // Build poster grid items for grid view - deduplicate by movie_id
  const gridItems: PosterGridItem[] = (() => {
    const seen = new Set<number>();
    const items: PosterGridItem[] = [];
    for (const review of filteredReviews) {
      if (seen.has(review.movie_id)) continue;
      seen.add(review.movie_id);
      items.push({
        id: review.id,
        movieId: review.movie_id,
        title: review.movie_title.replace(/\s*[-–]\s*S\d+E\d+.*$/i, '').replace(/\s+S\d+E\d+.*$/i, '').trim(),
        poster: review.movie_poster,
        mediaType: (review.media_type === 'tv' ? 'tv' : 'movie') as 'movie' | 'tv',
        userRating: review.rating,
      });
    }
    return items;
  })();

  return (
    <div className="space-y-3">
      <MobileFilterPills
        options={reviewFilterOptions}
        selectedValue={mediaTypeFilter}
        onSelect={setMediaTypeFilter}
      />
      {viewMode === 'grid' ? (
        gridItems.length === 0 && reviews.length > 0 ? (
          <Card className="p-6 text-center border-dashed">
            <p className="text-sm text-muted-foreground">
              No {mediaTypeFilter === 'movie' ? 'movie' : mediaTypeFilter === 'episode' ? 'episode' : 'TV show'} reviews yet
            </p>
          </Card>
        ) : (
          <CollectionPosterGrid items={gridItems} />
        )
      ) : (
        <>
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
              <TVGroupRow key={`tv-${item.movieId}`} seriesReview={item.seriesReview} episodeReviews={item.episodeReviews} onDelete={deleteReview} />
            )
          )}
        </>
      )}
    </div>
  );
};
