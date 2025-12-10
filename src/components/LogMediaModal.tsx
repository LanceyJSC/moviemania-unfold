import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2, Film, Tv } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useDiary } from '@/hooks/useDiary';
import { useUserStats } from '@/hooks/useUserStats';
import { tmdbService } from '@/lib/tmdb';
import { RatingInput } from '@/components/RatingInput';

interface LogMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaId: number;
  mediaTitle: string;
  mediaPoster: string | null;
  mediaType: 'movie' | 'tv';
  seasonNumber?: number;
  episodeNumber?: number;
  initialRating?: number;
}

export const LogMediaModal = ({
  isOpen,
  onClose,
  mediaId,
  mediaTitle,
  mediaPoster,
  mediaType,
  seasonNumber,
  episodeNumber,
  initialRating = 0
}: LogMediaModalProps) => {
  const { user } = useAuth();
  const { addMovieDiaryEntry, addTVDiaryEntry } = useDiary();
  const { recalculateStats } = useUserStats();
  const [watchedDate, setWatchedDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState('');
  const [rating, setRating] = useState<number>(initialRating);
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [shareAsReview, setShareAsReview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [runtime, setRuntime] = useState<number | null>(null);

  // Sync rating with initialRating when modal opens
  useEffect(() => {
    if (isOpen) {
      setRating(initialRating);
    }
  }, [isOpen, initialRating]);

  // Fetch runtime when modal opens
  useEffect(() => {
    const fetchRuntime = async () => {
      if (!isOpen || !mediaId) return;
      
      try {
        if (mediaType === 'movie') {
          const movie = await tmdbService.getMovieDetails(mediaId);
          setRuntime(movie.runtime || null);
        } else {
          const tvShow = await tmdbService.getTVShowDetails(mediaId);
          // Use average episode runtime
          const avgRuntime = tvShow.episode_run_time?.[0] || 45;
          setRuntime(avgRuntime);
        }
      } catch (error) {
        console.error('Error fetching runtime:', error);
        // Fallback to defaults
        setRuntime(mediaType === 'movie' ? 120 : 45);
      }
    };

    fetchRuntime();
  }, [isOpen, mediaId, mediaType]);

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Please sign in to log');
      return;
    }

    setIsSubmitting(true);

    try {
      if (mediaType === 'movie') {
        await addMovieDiaryEntry.mutateAsync({
          movie_id: mediaId,
          movie_title: mediaTitle,
          movie_poster: mediaPoster,
          watched_date: format(watchedDate, 'yyyy-MM-dd'),
          rating: rating > 0 ? rating : null,
          notes: notes || null,
          runtime: runtime
        });
      } else {
        await addTVDiaryEntry.mutateAsync({
          tv_id: mediaId,
          tv_title: mediaTitle,
          tv_poster: mediaPoster,
          watched_date: format(watchedDate, 'yyyy-MM-dd'),
          rating: rating > 0 ? rating : null,
          notes: notes || null,
          season_number: seasonNumber || null,
          episode_number: episodeNumber || null,
          runtime: runtime
        });
      }

      // Always add to user_ratings (marks as "Watched") - rating can be null
      const { error: ratingError } = await supabase
        .from('user_ratings')
        .upsert({
          user_id: user.id,
          movie_id: mediaId,
          movie_title: mediaTitle,
          movie_poster: mediaPoster,
          rating: rating > 0 ? rating : null,
          media_type: mediaType,
          is_public: true
        }, {
          onConflict: 'user_id,movie_id'
        });

      if (ratingError) {
        console.error('Error saving to watched:', ratingError);
      }

      // Remove from watchlist since it's now watched
      await supabase
        .from('enhanced_watchlist_items')
        .delete()
        .eq('user_id', user.id)
        .eq('movie_id', mediaId);

      // If sharing as review and has notes, also save to user_reviews
      if (shareAsReview && notes.trim()) {
        const { error: reviewError } = await supabase
          .from('user_reviews')
          .upsert({
            user_id: user.id,
            movie_id: mediaId,
            movie_title: mediaTitle,
            movie_poster: mediaPoster,
            rating: rating > 0 ? rating : null,
            review_text: notes,
            is_spoiler: isSpoiler
          }, {
            onConflict: 'user_id,movie_id'
          });

        if (reviewError) {
          console.error('Error saving review:', reviewError);
        } else {
          await supabase.from('activity_feed').insert({
            user_id: user.id,
            activity_type: 'reviewed',
            movie_id: mediaId,
            movie_title: mediaTitle,
            movie_poster: mediaPoster,
            metadata: { rating, media_type: mediaType }
          });
        }
      }

      // Log activity for diary entry
      await supabase.from('activity_feed').insert({
        user_id: user.id,
        activity_type: 'watched',
        movie_id: mediaId,
        movie_title: mediaTitle,
        movie_poster: mediaPoster,
        metadata: { rating, media_type: mediaType, runtime }
      });

      // Recalculate stats after logging
      await recalculateStats();

      resetForm();
      onClose();
    } catch (error) {
      console.error('Error logging:', error);
      toast.error('Failed to log entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setWatchedDate(new Date());
    setNotes('');
    setRating(0);
    setIsSpoiler(false);
    setShareAsReview(false);
    setRuntime(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const formatRuntime = (mins: number | null) => {
    if (!mins) return '';
    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mediaType === 'movie' ? <Film className="h-5 w-5" /> : <Tv className="h-5 w-5" />}
            Log "{mediaTitle}"
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Runtime Display */}
          {runtime && (
            <div className="text-sm text-muted-foreground text-center bg-muted/50 rounded-md py-2">
              Runtime: {formatRuntime(runtime)}
            </div>
          )}

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
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Rating */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Rating (1-10, optional)</label>
            <RatingInput
              value={rating}
              onChange={setRating}
              max={10}
              size="sm"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Notes / Review</label>
            <Textarea
              placeholder="What did you think?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          {/* Spoiler Toggle */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="spoiler"
              checked={isSpoiler}
              onCheckedChange={(checked) => setIsSpoiler(checked === true)}
            />
            <label htmlFor="spoiler" className="text-sm cursor-pointer">
              Contains spoilers
            </label>
          </div>

          {/* Share as Review Toggle - only for movies */}
          {mediaType === 'movie' && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="shareReview"
                checked={shareAsReview}
                onCheckedChange={(checked) => setShareAsReview(checked === true)}
              />
              <label htmlFor="shareReview" className="text-sm cursor-pointer">
                Share as a public review
              </label>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Logging...
              </>
            ) : (
              `Log ${mediaType === 'movie' ? 'Movie' : 'TV Show'}`
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
