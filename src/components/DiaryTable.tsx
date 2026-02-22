import { useState } from 'react';
import { Star, Heart, BookOpen, Pencil, Trash2, Film, Tv } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CollectionDetailDrawer } from '@/components/CollectionDetailDrawer';
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

const getPosterUrl = (posterPath: string | null): string | null => {
  if (!posterPath) return null;
  if (posterPath.startsWith('http')) return posterPath;
  return `${IMAGE_BASE}${posterPath}`;
};

export interface DiaryItem {
  id: string;
  movieId: number;
  title: string;
  poster: string | null;
  mediaType: 'movie' | 'tv';
  userRating?: number | null;
  notes?: string | null;
  watchedDate: string;
  onDelete?: () => void;
  onEdit?: () => void;
}

interface DiaryTableProps {
  items: DiaryItem[];
}

type GroupedDiary = {
  monthLabel: string;
  year: string;
  entries: DiaryItem[];
};

const groupByMonth = (items: DiaryItem[]): GroupedDiary[] => {
  const groups: Record<string, DiaryItem[]> = {};
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

  items.forEach(item => {
    const d = new Date(item.watchedDate);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  });

  return Object.entries(groups).map(([key, entries]) => {
    const [year, month] = key.split('-');
    return {
      monthLabel: months[parseInt(month)],
      year,
      entries: entries.sort((a, b) => new Date(b.watchedDate).getTime() - new Date(a.watchedDate).getTime()),
    };
  });
};

export const DiaryTable = ({ items }: DiaryTableProps) => {
  const [selectedItem, setSelectedItem] = useState<DiaryItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const grouped = groupByMonth(items);

  const handleTap = (item: DiaryItem) => {
    setSelectedItem(item);
    setDrawerOpen(true);
  };

  return (
    <>
      {/* Table header */}
      <div className="hidden sm:grid sm:grid-cols-[80px_40px_1fr_60px_100px_40px_40px] gap-2 px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground font-medium border-b border-border">
        <span>Month</span>
        <span>Day</span>
        <span>Film</span>
        <span>Year</span>
        <span>Rating</span>
        <span className="text-center">Review</span>
        <span></span>
      </div>

      <div className="divide-y divide-border/50">
        {grouped.map(group => (
          <div key={`${group.year}-${group.monthLabel}`}>
            {group.entries.map((entry, idx) => {
              const d = new Date(entry.watchedDate);
              const day = d.getDate().toString().padStart(2, '0');
              const releaseYear = ''; // Will show from title or could be fetched

              return (
                <button
                  key={entry.id}
                  onClick={() => handleTap(entry)}
                  className="w-full text-left hover:bg-accent/5 transition-colors focus:outline-none focus-visible:bg-accent/10"
                >
                  {/* Mobile layout */}
                  <div className="sm:hidden flex items-center gap-3 px-3 py-2.5">
                    {/* Month badge - only on first entry */}
                    <div className="w-12 shrink-0">
                      {idx === 0 && (
                        <div className="bg-primary/10 rounded-lg p-1.5 text-center">
                          <div className="text-[10px] font-bold text-primary leading-none">{group.monthLabel}</div>
                          <div className="text-[9px] text-muted-foreground leading-none mt-0.5">{group.year}</div>
                        </div>
                      )}
                    </div>
                    <div className="text-lg font-light text-muted-foreground w-8 text-right">{day}</div>
                    {/* Poster */}
                    <div className="w-9 h-[52px] rounded overflow-hidden bg-muted shrink-0">
                      {entry.poster ? (
                        <img src={getPosterUrl(entry.poster) || ''} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          {entry.mediaType === 'tv' ? <Tv className="h-3.5 w-3.5 text-muted-foreground" /> : <Film className="h-3.5 w-3.5 text-muted-foreground" />}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{entry.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {entry.userRating != null && entry.userRating > 0 && (
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-2.5 w-2.5 ${
                                  i < entry.userRating! ? 'fill-cinema-gold text-cinema-gold' : 'text-muted-foreground/30'
                                }`}
                              />
                            ))}
                          </div>
                        )}
                        {entry.notes && <BookOpen className="h-3 w-3 text-primary" />}
                      </div>
                    </div>
                  </div>

                  {/* Desktop layout */}
                  <div className="hidden sm:grid sm:grid-cols-[80px_40px_1fr_60px_100px_40px_40px] gap-2 items-center px-3 py-2.5">
                    <div>
                      {idx === 0 && (
                        <div className="bg-primary/10 rounded-lg p-1.5 text-center inline-block">
                          <div className="text-[10px] font-bold text-primary leading-none">{group.monthLabel}</div>
                          <div className="text-[9px] text-muted-foreground leading-none mt-0.5">{group.year}</div>
                        </div>
                      )}
                    </div>
                    <div className="text-lg font-light text-muted-foreground text-right">{day}</div>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-[52px] rounded overflow-hidden bg-muted shrink-0">
                        {entry.poster ? (
                          <img src={getPosterUrl(entry.poster) || ''} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            {entry.mediaType === 'tv' ? <Tv className="h-3.5 w-3.5 text-muted-foreground" /> : <Film className="h-3.5 w-3.5 text-muted-foreground" />}
                          </div>
                        )}
                      </div>
                      <span className="text-sm font-medium text-foreground truncate">{entry.title}</span>
                    </div>
                    <span className="text-xs text-muted-foreground"></span>
                    <div className="flex items-center gap-0.5">
                      {entry.userRating != null && entry.userRating > 0 ? (
                        Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${
                              i < entry.userRating! ? 'fill-cinema-gold text-cinema-gold' : 'text-muted-foreground/30'
                            }`}
                          />
                        ))
                      ) : null}
                    </div>
                    <div className="text-center">
                      {entry.notes && <BookOpen className="h-3.5 w-3.5 text-primary mx-auto" />}
                    </div>
                    <div>
                      {entry.onEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => { e.stopPropagation(); entry.onEdit?.(); }}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {selectedItem && (
        <CollectionDetailDrawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          mediaId={selectedItem.movieId}
          mediaType={selectedItem.mediaType}
          title={selectedItem.title}
          poster={selectedItem.poster}
          userRating={selectedItem.userRating}
          notes={selectedItem.notes}
          watchedDate={selectedItem.watchedDate}
          onDelete={selectedItem.onDelete}
          onEdit={selectedItem.onEdit}
        />
      )}
    </>
  );
};
