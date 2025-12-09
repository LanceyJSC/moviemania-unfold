import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface WriteReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  movieId: number;
  movieTitle: string;
  moviePoster: string | null;
}

export const WriteReviewModal = ({ isOpen, onClose, movieId, movieTitle, moviePoster }: WriteReviewModalProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Please sign in to write a review');
      return;
    }

    if (!reviewText.trim()) {
      toast.error('Please write a review');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('user_reviews').insert({
        user_id: user.id,
        movie_id: movieId,
        movie_title: movieTitle,
        movie_poster: moviePoster,
        review_text: reviewText,
        rating: rating,
        is_spoiler: isSpoiler,
      });

      if (error) throw error;

      // Log activity
      await supabase.from('activity_feed').insert({
        user_id: user.id,
        activity_type: 'reviewed',
        movie_id: movieId,
        movie_title: movieTitle,
        movie_poster: moviePoster,
        metadata: { rating, is_spoiler: isSpoiler },
      });

      toast.success('Review posted!');
      queryClient.invalidateQueries({ queryKey: ['community-reviews', movieId] });
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
      onClose();
      setReviewText('');
      setRating(null);
      setIsSpoiler(false);
    } catch (error) {
      console.error('Error posting review:', error);
      toast.error('Failed to post review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayRating = hoveredRating ?? rating;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Review "{movieTitle}"</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Rating */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Your Rating</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(rating === star ? null : star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(null)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={cn(
                      "h-6 w-6 transition-colors",
                      displayRating && star <= displayRating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground"
                    )}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Review Text */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Your Review</label>
            <Textarea
              placeholder="What did you think of this movie?"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              rows={5}
            />
          </div>

          {/* Spoiler Toggle */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="spoiler"
              checked={isSpoiler}
              onCheckedChange={(checked) => setIsSpoiler(checked === true)}
            />
            <label htmlFor="spoiler" className="text-sm text-muted-foreground cursor-pointer">
              This review contains spoilers
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isSubmitting || !reviewText.trim()}>
              {isSubmitting ? 'Posting...' : 'Post Review'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
