import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarIcon, Star } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useDiary } from '@/hooks/useDiary';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface LogMovieModalProps {
  isOpen: boolean;
  onClose: () => void;
  movieId: number;
  movieTitle: string;
  moviePoster: string | null;
}

export const LogMovieModal = ({ isOpen, onClose, movieId, movieTitle, moviePoster }: LogMovieModalProps) => {
  const [watchedDate, setWatchedDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [shareAsReview, setShareAsReview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addMovieDiaryEntry } = useDiary();
  const queryClient = useQueryClient();

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Always save to diary
      await addMovieDiaryEntry.mutateAsync({
        movie_id: movieId,
        movie_title: movieTitle,
        movie_poster: moviePoster,
        watched_date: format(watchedDate, 'yyyy-MM-dd'),
        notes: notes || null,
        rating: rating,
      });

      // If sharing as review, also save to user_reviews
      if (shareAsReview && notes.trim()) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { error } = await supabase.from('user_reviews').insert({
            user_id: user.id,
            movie_id: movieId,
            movie_title: movieTitle,
            movie_poster: moviePoster,
            review_text: notes,
            rating: rating,
            is_spoiler: isSpoiler,
          });

          if (error) throw error;

          // Log review activity
          await supabase.from('activity_feed').insert({
            user_id: user.id,
            activity_type: 'reviewed',
            movie_id: movieId,
            movie_title: movieTitle,
            movie_poster: moviePoster,
          });

          queryClient.invalidateQueries({ queryKey: ['user-reviews', movieId] });
          toast.success('Review shared publicly!');
        }
      }

      onClose();
      resetForm();
    } catch (error) {
      console.error('Error logging movie:', error);
      toast.error('Failed to log movie');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setNotes('');
    setRating(null);
    setIsSpoiler(false);
    setShareAsReview(false);
    setWatchedDate(new Date());
  };

  const displayRating = hoveredRating ?? rating;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Log "{movieTitle}"</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Date Picker */}
          <div className="space-y-2">
            <label className="text-sm font-medium">When did you watch it?</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !watchedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {watchedDate ? format(watchedDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={watchedDate}
                  onSelect={(date) => date && setWatchedDate(date)}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Rating */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Rating (optional)</label>
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

          {/* Notes/Review */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Notes / Review (optional)</label>
            <Textarea
              placeholder="What did you think?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Spoiler checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="spoiler"
              checked={isSpoiler}
              onCheckedChange={(checked) => setIsSpoiler(checked as boolean)}
            />
            <label htmlFor="spoiler" className="text-sm cursor-pointer">
              Contains spoilers
            </label>
          </div>

          {/* Share as review checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="share-review"
              checked={shareAsReview}
              onCheckedChange={(checked) => setShareAsReview(checked as boolean)}
              disabled={!notes.trim()}
            />
            <label htmlFor="share-review" className="text-sm cursor-pointer">
              Share as a public review
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Log Movie'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
