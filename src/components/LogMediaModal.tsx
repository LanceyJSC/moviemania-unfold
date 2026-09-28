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
import { useQueryClient } from '@tanstack/react-query';
import { useUserStateContext } from '@/contexts/UserStateContext';
import { diaryNotesSchema, ratingSchema, sanitizeString, validateInput } from '@/lib/validation';

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
  initialNotes?: string;
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
  initialRating = 0,
  initialNotes = ''
}: LogMediaModalProps) => {
  const { user } = useAuth();
  const { addMovieDiaryEntry, addTVDiaryEntry } = useDiary();
  const { recalculateStats } = useUserStats();
  const queryClient = useQueryClient();
  const { refetch: refetchUserState, updateRatingLocally } = useUserStateContext();
  const [watchedDate, setWatchedDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState(initialNotes);
  const [rating, setRating] = useState<number>(initialRating);
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [existingReviewId, setExistingReviewId] = useState<string | null>(null);

  // Scope a user_reviews query to this exact title/season/episode
  const scopeReviewQuery = (q: any) => {
    q = q.eq('movie_id', mediaId);
    q = mediaType === 'movie'
      ? q.or('media_type.eq.movie,media_type.is.null')
      : q.eq('media_type', 'tv');
    q = seasonNumber ? q.eq('season_number', seasonNumber) : q.is('season_number', null);
    q = episodeNumber ? q.eq('episode_number', episodeNumber) : q.is('episode_number', null);
    return q;
  };
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [runtime, setRuntime] = useState<number | null>(null);

  // Sync rating and notes with initial values when modal opens
  useEffect(() => {
    if (isOpen) {
      setRating(initialRating);
      setNotes(initialNotes);
      setExistingReviewId(null);
      if (user && mediaId) {
        scopeReviewQuery(
          supabase.from('user_reviews').select('id, review_text, is_spoiler').eq('user_id', user.id)
        ).maybeSingle().then(({ data }: any) => {
          if (data) {
            setExistingReviewId(data.id);
            setIsSpoiler(!!data.is_spoiler);
            if (!initialNotes) setNotes(data.review_text || '');
          }
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialRating, initialNotes, user?.id, mediaId, mediaType, seasonNumber, episodeNumber]);

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

    // Validate notes
    const notesValidation = validateInput(diaryNotesSchema, notes.trim() || null);
    if (!notesValidation.success && notesValidation.error) {
      toast.error(notesValidation.error);
      return;
    }

    // Validate rating
    const ratingValidation = validateInput(ratingSchema, rating);
    if (!ratingValidation.success && ratingValidation.error) {
      toast.error(ratingValidation.error);
      return;
    }

    const sanitizedNotes = sanitizeString(notes, 5000);

    // Only delete a review if one existed and the user explicitly cleared it
    const shouldDeleteReview = !!existingReviewId && !notes.trim();
    if (shouldDeleteReview && !window.confirm('Remove your review?')) {
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

        // Set is_public to true if notes are provided (for community reviews)
        if (notes.trim()) {
          await supabase
            .from('tv_diary')
            .update({ is_public: true })
            .eq('user_id', user.id)
            .eq('tv_id', mediaId)
            .eq('season_number', seasonNumber || null)
            .eq('episode_number', episodeNumber || null);
        }
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

      // Also update the ratings table which is used for displaying user rating on main page
      if (rating > 0) {
        await supabase
          .from('ratings')
          .upsert({
            user_id: user.id,
            movie_id: mediaId,
            movie_title: mediaTitle,
            rating: rating
          }, {
            onConflict: 'user_id,movie_id'
          });
      } else {
        // If rating is 0/cleared, remove from ratings table
        await supabase
          .from('ratings')
          .delete()
          .eq('user_id', user.id)
          .eq('movie_id', mediaId);
      }

      // Remove from watchlist since it's now watched
      await supabase
        .from('enhanced_watchlist_items')
        .delete()
        .eq('user_id', user.id)
        .eq('movie_id', mediaId);

      const reviewMeta = {
        rating,
        media_type: mediaType,
        season_number: seasonNumber ?? null,
        episode_number: episodeNumber ?? null,
      };

      if (notes.trim()) {
        const { data: existing } = await scopeReviewQuery(
          supabase.from('user_reviews').select('id').eq('user_id', user.id)
        ).maybeSingle();

        const reviewData = {
          user_id: user.id,
          movie_id: mediaId,
          movie_title: mediaTitle,
          movie_poster: mediaPoster,
          rating: rating > 0 ? rating : null,
          review_text: notes,
          is_spoiler: isSpoiler,
          media_type: mediaType,
          season_number: seasonNumber || null,
          episode_number: episodeNumber || null,
        };

        const { error: reviewError } = existing
          ? await supabase.from('user_reviews').update(reviewData as any).eq('id', existing.id)
          : await supabase.from('user_reviews').insert(reviewData as any);

        if (reviewError) {
          console.error('Error saving review:', reviewError);
        } else {
          // Find an existing "reviewed" activity for this exact title/season/episode
          const { data: prior } = await supabase
            .from('activity_feed')
            .select('id, target_type, metadata')
            .eq('user_id', user.id)
            .eq('movie_id', mediaId)
            .eq('activity_type', 'reviewed')
            .order('created_at', { ascending: false });
          const match = (prior || []).find((a: any) => {
            const m = a.metadata || {};
            const t = m.media_type || a.target_type || 'movie';
            return t === mediaType &&
              (m.season_number ?? null) === (seasonNumber ?? null) &&
              (m.episode_number ?? null) === (episodeNumber ?? null);
          });
          if (existing && match) {
            const { error } = await supabase
              .from('activity_feed')
              .update({ metadata: reviewMeta, movie_title: mediaTitle, movie_poster: mediaPoster, target_type: mediaType })
              .eq('id', match.id);
            if (error) console.error('Error updating review activity:', error);
          } else if (!match) {
            await supabase.from('activity_feed').insert({
              user_id: user.id,
              activity_type: 'reviewed',
              target_type: mediaType,
              movie_id: mediaId,
              movie_title: mediaTitle,
              movie_poster: mediaPoster,
              metadata: reviewMeta,
            });
          }
        }
      } else {
        if (shouldDeleteReview && existingReviewId) {
          await supabase.from('user_reviews').delete().eq('id', existingReviewId).eq('user_id', user.id);
        }
        // Rewatch / log without review: single "watched" activity
        await supabase.from('activity_feed').insert({
          user_id: user.id,
          activity_type: 'watched',
          target_type: mediaType,
          movie_id: mediaId,
          movie_title: mediaTitle,
          movie_poster: mediaPoster,
          metadata: { ...reviewMeta, runtime },
        });
      }

      // Recalculate stats after logging
      await recalculateStats();

      // Invalidate all relevant queries to update the UI
      queryClient.invalidateQueries({ queryKey: ['average-user-rating', mediaId, mediaType] });
      queryClient.invalidateQueries({ queryKey: ['community-reviews', mediaType, mediaId] });
      if (mediaType === 'tv' && seasonNumber) {
        queryClient.invalidateQueries({ queryKey: ['season-episode-review-counts', mediaId, seasonNumber] });
      }
      queryClient.invalidateQueries({ queryKey: ['movie-diary'] });
      queryClient.invalidateQueries({ queryKey: ['tv-diary'] });
      queryClient.invalidateQueries({ queryKey: ['user-ratings'] });
      // Invalidate episode community reviews if this is a TV episode
      if (mediaType === 'tv' && seasonNumber && episodeNumber) {
        queryClient.invalidateQueries({ queryKey: ['episode-community-reviews', mediaId, seasonNumber, episodeNumber] });
        queryClient.invalidateQueries({ queryKey: ['episode-review-count', mediaId, seasonNumber, episodeNumber] });
      }
      
      // Instantly update the local rating state so cards reflect the change immediately
      updateRatingLocally(mediaId, rating);
      
      await refetchUserState();

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
            <label className="text-sm font-medium">Rating (1-5 flames, optional)</label>
            <div className="overflow-x-auto">
              <RatingInput
                value={rating}
                onChange={setRating}
                max={5}
                size="md"
              />
            </div>
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

          {/* Info about public reviews */}
          {notes.trim() && (
            <p className="text-xs text-muted-foreground">
              Your review will be visible to other users in the Community Reviews section.
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={handleClose} className="h-12 touch-manipulation active:scale-95">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="h-12 touch-manipulation active:scale-95">
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
