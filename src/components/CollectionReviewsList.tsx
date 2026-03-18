import { useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { MobileFilterPills } from '@/components/MobileFilterPills';
import { CollectionPosterGrid, PosterGridItem } from '@/components/CollectionPosterGrid';
import { MovieReviewRow } from '@/components/collection-reviews/ReviewRows';
import { TVReviewGroupCard } from '@/components/collection-reviews/TVReviewGroupCard';
import {
  CollectionReview,
  buildGroupedTVReviews,
  buildReviewTimeline,
  getSeriesName,
  reviewFilterOptions,
} from '@/components/collection-reviews/utils';

interface CollectionReviewsListProps {
  onCountChange?: (count: number) => void;
  viewMode?: 'grid' | 'list';
}

const getEmptyFilterLabel = (filter: string) => {
  if (filter === 'movie') return 'movie';
  if (filter === 'tv-show') return 'series';
  if (filter === 'episode') return 'episode';
  return 'review';
};

export const CollectionReviewsList = ({ onCountChange, viewMode = 'list' }: CollectionReviewsListProps) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<CollectionReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [mediaTypeFilter, setMediaTypeFilter] = useState('all');

  useEffect(() => {
    if (!user) {
      setReviews([]);
      setLoading(false);
      return;
    }

    const fetchReviews = async () => {
      setLoading(true);

      try {
        const { data, error } = await supabase
          .from('user_reviews')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setReviews((data as CollectionReview[]) || []);
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [user]);

  useEffect(() => {
    onCountChange?.(reviews.length);
  }, [reviews.length, onCountChange]);

  const deleteReview = async (id: string) => {
    try {
      const { error } = await supabase.from('user_reviews').delete().eq('id', id);
      if (error) throw error;

      setReviews((current) => current.filter((review) => review.id !== id));
      toast.success('Review deleted');
    } catch {
      toast.error('Failed to delete review');
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <Skeleton key={item} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <Card className="border-dashed p-8 text-center">
        <MessageCircle className="mx-auto mb-4 h-14 w-14 text-muted-foreground/50" />
        <p className="mb-1 text-lg font-semibold text-foreground">No reviews yet</p>
        <p className="text-sm text-muted-foreground">Write reviews on movie and TV show pages</p>
      </Card>
    );
  }

  const filteredReviews =
    mediaTypeFilter === 'all'
      ? reviews
      : mediaTypeFilter === 'episode'
        ? reviews.filter((review) => review.media_type === 'tv' && review.episode_number != null)
        : mediaTypeFilter === 'tv-show'
          ? reviews.filter((review) => review.media_type === 'tv' && review.episode_number == null)
          : reviews.filter((review) => review.media_type === mediaTypeFilter);

  const timelineItems = buildReviewTimeline(filteredReviews);
  const tvGroups = buildGroupedTVReviews(filteredReviews);
  const movieReviews = filteredReviews.filter((review) => review.media_type !== 'tv');

  const movieGridItems: PosterGridItem[] = movieReviews.map((review) => ({
    id: review.id,
    movieId: review.movie_id,
    title: review.movie_title,
    poster: review.movie_poster,
    mediaType: 'movie',
    userRating: review.rating,
    linkPath: `/movie/${review.movie_id}/reviews`,
  }));

  return (
    <div className="space-y-4">
      <MobileFilterPills
        options={reviewFilterOptions}
        selectedValue={mediaTypeFilter}
        onSelect={setMediaTypeFilter}
      />

      {filteredReviews.length === 0 ? (
        <Card className="border-dashed p-6 text-center">
          <p className="text-sm text-muted-foreground">
            No {getEmptyFilterLabel(mediaTypeFilter)} reviews yet
          </p>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="space-y-4">
          {movieGridItems.length > 0 && (
            <section className="space-y-3">
              {tvGroups.length > 0 && (
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Movie reviews
                </p>
              )}
              <CollectionPosterGrid items={movieGridItems} />
            </section>
          )}

          {tvGroups.length > 0 && (
            <section className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                TV reviews grouped by show
              </p>
              <div className="space-y-3">
                {tvGroups.map((group) => (
                  <TVReviewGroupCard key={`tv-${group.movieId}`} group={group} onDelete={deleteReview} />
                ))}
              </div>
            </section>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {timelineItems.map((item) =>
            item.type === 'movie' ? (
              <MovieReviewRow key={item.review.id} review={item.review} onDelete={deleteReview} />
            ) : (
              <TVReviewGroupCard key={`tv-${item.group.movieId}`} group={item.group} onDelete={deleteReview} />
            )
          )}
        </div>
      )}

      {tvGroups.length > 0 && mediaTypeFilter === 'all' && viewMode === 'grid' && (
        <Card className="border-dashed p-4 text-center">
          <p className="text-xs text-muted-foreground">
            TV reviews stay grouped by show so series and episode entries stay together and make sense.
          </p>
        </Card>
      )}
    </div>
  );
};
