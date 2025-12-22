import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Flame } from 'lucide-react';
import { useDiary, MovieDiaryEntry, TVDiaryEntry } from '@/hooks/useDiary';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface DiaryEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: MovieDiaryEntry | TVDiaryEntry | null;
  type: 'movie' | 'tv';
}

const DiaryEntryModal = ({ isOpen, onClose, entry, type }: DiaryEntryModalProps) => {
  const { updateMovieDiaryEntry, updateTVDiaryEntry } = useDiary();
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [notes, setNotes] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [seasonNumber, setSeasonNumber] = useState<number | null>(null);
  const [episodeNumber, setEpisodeNumber] = useState<number | null>(null);

  useEffect(() => {
    if (entry) {
      setDate(new Date(entry.watched_date));
      setNotes(entry.notes || '');
      setRating(entry.rating);
      if (type === 'tv' && 'season_number' in entry) {
        setSeasonNumber(entry.season_number);
        setEpisodeNumber(entry.episode_number);
      }
    }
  }, [entry, type]);

  const handleSave = async () => {
    if (!entry || !date) return;

    if (type === 'movie') {
      await updateMovieDiaryEntry.mutateAsync({
        id: entry.id,
        watched_date: format(date, 'yyyy-MM-dd'),
        notes: notes || null,
        rating,
      });
    } else {
      await updateTVDiaryEntry.mutateAsync({
        id: entry.id,
        watched_date: format(date, 'yyyy-MM-dd'),
        notes: notes || null,
        rating,
        season_number: seasonNumber,
        episode_number: episodeNumber,
      });
    }
    onClose();
  };

  const title = type === 'movie' 
    ? (entry as MovieDiaryEntry)?.movie_title 
    : (entry as TVDiaryEntry)?.tv_title;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="line-clamp-1">Edit: {title}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Watched Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {type === 'tv' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Season</Label>
                <Input
                  type="number"
                  min={1}
                  value={seasonNumber || ''}
                  onChange={(e) => setSeasonNumber(e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="Season #"
                />
              </div>
              <div className="space-y-2">
                <Label>Episode</Label>
                <Input
                  type="number"
                  min={1}
                  value={episodeNumber || ''}
                  onChange={(e) => setEpisodeNumber(e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="Episode #"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Rating (1-5 flames)</Label>
            <div className="flex items-center justify-center gap-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(rating === value ? null : value)}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                    rating !== null && value <= rating
                      ? "text-cinema-red"
                      : "text-muted-foreground/40 hover:text-muted-foreground/60"
                  )}
                >
                  <Flame className={cn(
                    "h-6 w-6",
                    rating !== null && value <= rating && "fill-current"
                  )} />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Your thoughts about this..."
              className="min-h-[100px]"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex-1">
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DiaryEntryModal;
