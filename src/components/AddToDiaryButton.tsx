import { useState } from 'react';
import { format } from 'date-fns';
import { BookOpen, Calendar as CalendarIcon } from 'lucide-react';
import { useDiary } from '@/hooks/useDiary';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface AddToDiaryButtonProps {
  type: 'movie' | 'tv';
  id: number;
  title: string;
  poster: string | null;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

const AddToDiaryButton = ({ 
  type, 
  id, 
  title, 
  poster, 
  variant = 'outline',
  size = 'default',
  className 
}: AddToDiaryButtonProps) => {
  const { user } = useAuth();
  const { addMovieDiaryEntry, addTVDiaryEntry } = useDiary();
  const [isOpen, setIsOpen] = useState(false);
  const [date, setDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [seasonNumber, setSeasonNumber] = useState<number | null>(null);
  const [episodeNumber, setEpisodeNumber] = useState<number | null>(null);

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Please sign in to add to diary');
      return;
    }

    if (type === 'movie') {
      await addMovieDiaryEntry.mutateAsync({
        movie_id: id,
        movie_title: title,
        movie_poster: poster,
        watched_date: format(date, 'yyyy-MM-dd'),
        notes: notes || null,
        rating,
      });
    } else {
      await addTVDiaryEntry.mutateAsync({
        tv_id: id,
        tv_title: title,
        tv_poster: poster,
        watched_date: format(date, 'yyyy-MM-dd'),
        notes: notes || null,
        rating,
        season_number: seasonNumber,
        episode_number: episodeNumber,
      });
    }

    setIsOpen(false);
    setNotes('');
    setRating(null);
    setSeasonNumber(null);
    setEpisodeNumber(null);
    setDate(new Date());
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={`touch-manipulation active:scale-95 min-h-[44px] ${className}`}>
          <BookOpen className="w-4 h-4 mr-2" />
          Add to Diary
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="line-clamp-1">Log: {title}</DialogTitle>
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
                  onSelect={(d) => d && setDate(d)}
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
            <Label>Rating (1-10)</Label>
            <div className="flex items-center gap-1 flex-wrap">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                <button
                  key={value}
                  onClick={() => setRating(rating === value ? null : value)}
                  className={cn(
                    "w-8 h-8 rounded-full text-sm font-medium transition-colors touch-manipulation active:scale-95 min-h-[44px] min-w-[44px]",
                    rating === value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-muted/80"
                  )}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Your thoughts about this..."
              className="min-h-[100px]"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsOpen(false)} className="flex-1 h-12 touch-manipulation active:scale-95">
              Cancel
            </Button>
            <Button onClick={handleSubmit} className="flex-1 h-12 touch-manipulation active:scale-95">
              Log It
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddToDiaryButton;
