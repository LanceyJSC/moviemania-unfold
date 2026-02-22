import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Flame, Film, Trash2, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
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
}

export const CollectionReviewsList = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchReviews();
  }, [user]);

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

  return (
    <div className="space-y-2">
      {reviews.map(review => {
        const posterUrl = review.movie_poster
          ? review.movie_poster.startsWith('http') ? review.movie_poster : `${IMAGE_BASE}${review.movie_poster}`
          : null;

        return (
          <div key={review.id} className="flex gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent/5 transition-colors">
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
                <p className="text-sm font-medium text-foreground truncate">{review.movie_title}</p>
              </Link>
              {review.rating != null && review.rating > 0 && (
                <div className="flex items-center gap-0.5 mt-0.5">
                  {Array.from({ length: review.rating }).map((_, i) => (
                    <Flame key={i} className={`h-3 w-3 fill-current ${flameColors[i] || flameColors[4]}`} />
                  ))}
                </div>
              )}
              {review.review_text && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{review.review_text}</p>
              )}
              <p className="text-[10px] text-muted-foreground/70 mt-1">
                {new Date(review.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
            <div className="shrink-0 flex flex-col gap-1">
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
                    <AlertDialogAction onClick={() => deleteReview(review.id)}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        );
      })}
    </div>
  );
};
