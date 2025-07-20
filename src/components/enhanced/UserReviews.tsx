import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { StarRating } from './StarRating';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ThumbsUp, MessageCircle, Flag, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Review {
  id: string;
  user_id: string;
  movie_id: number;
  movie_title: string;
  movie_type: 'movie' | 'tv';
  rating?: number;
  review_text?: string;
  is_spoiler: boolean;
  helpful_count: number;
  created_at: string;
  profiles?: {
    username: string;
    avatar_url: string;
  };
}

interface UserReviewsProps {
  movieId: number;
  movieTitle: string;
  movieType?: 'movie' | 'tv';
}

export const UserReviews = ({ movieId, movieTitle, movieType = 'movie' }: UserReviewsProps) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [isWritingReview, setIsWritingReview] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(0);
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [showSpoilers, setShowSpoilers] = useState(false);

  const fetchReviews = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('user_reviews')
        .select(`
          *,
          profiles:user_id(username, avatar_url)
        `)
        .eq('movie_id', movieId)
        .order('helpful_count', { ascending: false })
        .limit(20);

      if (error) throw error;

      setReviews((data || []) as unknown as Review[]);
      
      // Find user's review
      if (user) {
        const userReviewData = (data || []).find(r => r.user_id === user.id) as unknown as Review | undefined;
        setUserReview(userReviewData || null);
        if (userReviewData) {
          setReviewText(userReviewData.review_text || '');
          setRating(userReviewData.rating || 0);
          setIsSpoiler(userReviewData.is_spoiler);
        }
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [movieId, user]);

  const submitReview = async () => {
    if (!user || (!rating && !reviewText.trim())) {
      toast.error('Please provide a rating or review text');
      return;
    }

    try {
      const reviewData = {
        user_id: user.id,
        movie_id: movieId,
        movie_title: movieTitle,
        movie_type: movieType,
        rating: rating || null,
        review_text: reviewText.trim() || null,
        is_spoiler: isSpoiler,
      };

      const { error } = await supabase
        .from('user_reviews')
        .upsert(reviewData, { onConflict: 'user_id,movie_id' });

      if (error) throw error;

      // Create activity
      await supabase.from('user_activities').insert({
        user_id: user.id,
        activity_type: rating ? 'rating' : 'review',
        movie_id: movieId,
        movie_title: movieTitle,
        movie_type: movieType,
        metadata: { rating, review_snippet: reviewText.substring(0, 100) },
      });

      toast.success('Review submitted successfully!');
      setIsWritingReview(false);
      await fetchReviews();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review');
    }
  };

  const likeReview = async (reviewId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('review_interactions')
        .upsert({
          user_id: user.id,
          review_id: reviewId,
          interaction_type: 'like',
        }, { onConflict: 'user_id,review_id,interaction_type' });

      if (error) throw error;

      // Update helpful count - for now just refresh
      await fetchReviews();
    } catch (error) {
      console.error('Error liking review:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="p-4">
            <div className="animate-pulse space-y-3">
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-muted rounded-full" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-1/4 bg-muted rounded" />
                  <div className="h-3 w-1/6 bg-muted rounded" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 w-full bg-muted rounded" />
                <div className="h-3 w-3/4 bg-muted rounded" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* User's review section */}
      {user && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Your Review</h3>
              {userReview && !isWritingReview && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsWritingReview(true)}
                >
                  Edit Review
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!userReview && !isWritingReview ? (
              <Button onClick={() => setIsWritingReview(true)}>
                Write a Review
              </Button>
            ) : isWritingReview ? (
              <div className="space-y-4">
                <div>
                  <Label>Rating</Label>
                  <StarRating
                    rating={rating}
                    interactive
                    onRatingChange={setRating}
                    size="lg"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="review-text">Review</Label>
                  <Textarea
                    id="review-text"
                    placeholder="Share your thoughts about this movie..."
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    className="mt-2"
                    rows={4}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="spoiler-toggle"
                    checked={isSpoiler}
                    onCheckedChange={setIsSpoiler}
                  />
                  <Label htmlFor="spoiler-toggle">Contains spoilers</Label>
                </div>
                <div className="flex gap-2">
                  <Button onClick={submitReview}>
                    {userReview ? 'Update Review' : 'Submit Review'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsWritingReview(false);
                      if (userReview) {
                        setReviewText(userReview.review_text || '');
                        setRating(userReview.rating || 0);
                        setIsSpoiler(userReview.is_spoiler);
                      } else {
                        setReviewText('');
                        setRating(0);
                        setIsSpoiler(false);
                      }
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : userReview ? (
              <div className="space-y-3">
                {userReview.rating && (
                  <StarRating rating={userReview.rating} />
                )}
                {userReview.review_text && (
                  <div className={cn(
                    "p-3 rounded-lg bg-muted/50",
                    userReview.is_spoiler && !showSpoilers && "blur-sm"
                  )}>
                    {userReview.is_spoiler && (
                      <Badge variant="secondary" className="mb-2">
                        <Eye className="h-3 w-3 mr-1" />
                        Spoiler Warning
                      </Badge>
                    )}
                    <p className="text-sm">{userReview.review_text}</p>
                  </div>
                )}
                {userReview.is_spoiler && !showSpoilers && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSpoilers(true)}
                  >
                    Show Spoilers
                  </Button>
                )}
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* All reviews */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            Community Reviews ({reviews.length})
          </h3>
          {reviews.some(r => r.is_spoiler) && (
            <div className="flex items-center space-x-2">
              <Switch
                id="show-spoilers"
                checked={showSpoilers}
                onCheckedChange={setShowSpoilers}
              />
              <Label htmlFor="show-spoilers">Show spoilers</Label>
            </div>
          )}
        </div>

        {reviews.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">
              No reviews yet. Be the first to share your thoughts!
            </p>
          </Card>
        ) : (
          reviews
            .filter(review => review.user_id !== user?.id)
            .map((review) => (
              <Card key={review.id}>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={review.profiles?.avatar_url} />
                        <AvatarFallback>
                          {review.profiles?.username?.[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {review.profiles?.username || 'Anonymous'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(review.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {review.rating && (
                          <StarRating rating={review.rating} size="sm" />
                        )}
                      </div>
                    </div>

                    {review.review_text && (
                      <div className={cn(
                        "mt-3",
                        review.is_spoiler && !showSpoilers && "blur-sm"
                      )}>
                        {review.is_spoiler && (
                          <Badge variant="secondary" className="mb-2">
                            <Eye className="h-3 w-3 mr-1" />
                            Spoiler Warning
                          </Badge>
                        )}
                        <p className="text-sm">{review.review_text}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-4 pt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => likeReview(review.id)}
                        disabled={!user}
                      >
                        <ThumbsUp className="h-4 w-4 mr-1" />
                        {review.helpful_count}
                      </Button>
                      <Button variant="ghost" size="sm" disabled>
                        <MessageCircle className="h-4 w-4 mr-1" />
                        Reply
                      </Button>
                      <Button variant="ghost" size="sm" disabled>
                        <Flag className="h-4 w-4 mr-1" />
                        Report
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
        )}
      </div>
    </div>
  );
};