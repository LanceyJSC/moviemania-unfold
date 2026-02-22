import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, Flame, Heart, Eye, Clock, Calendar, BookOpen, ExternalLink, Film, Tv, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
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
import { tmdbService } from '@/lib/tmdb';

const IMAGE_BASE = 'https://image.tmdb.org/t/p/w342';

interface CollectionDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mediaId: number;
  mediaType: 'movie' | 'tv';
  title: string;
  poster: string | null;
  userRating?: number | null;
  notes?: string | null;
  watchedDate?: string | null;
  onDelete?: () => void;
  onEdit?: () => void;
  children?: React.ReactNode;
}

export const CollectionDetailDrawer = ({
  open,
  onOpenChange,
  mediaId,
  mediaType,
  title,
  poster,
  userRating,
  notes,
  watchedDate,
  onDelete,
  onEdit,
  children,
}: CollectionDetailDrawerProps) => {
  const [tmdbData, setTmdbData] = useState<any>(null);

  useEffect(() => {
    if (!open || !mediaId) return;
    const fetchData = async () => {
      try {
        const details = mediaType === 'tv'
          ? await tmdbService.getTVShowDetails(mediaId)
          : await tmdbService.getMovieDetails(mediaId);
        setTmdbData(details);
      } catch (e) {
        console.error('Failed to fetch TMDB details:', e);
      }
    };
    fetchData();
  }, [open, mediaId, mediaType]);

  const getPosterUrl = (p: string | null) => {
    if (!p) return null;
    if (p.startsWith('http')) return p;
    return `${IMAGE_BASE}${p}`;
  };

  const year = tmdbData
    ? (mediaType === 'tv' ? tmdbData.first_air_date : tmdbData.release_date)?.split('-')[0]
    : null;
  const genres = (tmdbData?.genres || []).slice(0, 3).map((g: any) => g.name);
  const runtime = mediaType === 'movie' ? tmdbData?.runtime : null;
  const tmdbRating = tmdbData?.vote_average;
  const overview = tmdbData?.overview;
  const detailPath = mediaType === 'tv' ? `/tv/${mediaId}` : `/movie/${mediaId}`;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="p-0">
          {/* Hero poster + gradient overlay */}
          <div className="relative">
            {poster && (
              <div className="w-full h-48 overflow-hidden">
                <img
                  src={getPosterUrl(poster) || ''}
                  alt={title}
                  className="w-full h-full object-cover object-top blur-sm scale-110 opacity-40"
                />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4 flex gap-4 items-end">
              {poster ? (
                <img
                  src={getPosterUrl(poster) || ''}
                  alt={title}
                  className="w-20 h-[120px] object-cover rounded-lg shadow-lg border border-border/50"
                />
              ) : (
                <div className="w-20 h-[120px] bg-muted rounded-lg flex items-center justify-center">
                  {mediaType === 'tv' ? <Tv className="h-8 w-8 text-muted-foreground" /> : <Film className="h-8 w-8 text-muted-foreground" />}
                </div>
              )}
              <div className="flex-1 min-w-0 pb-1">
                <DrawerTitle className="text-lg font-bold text-foreground text-left line-clamp-2">{title}</DrawerTitle>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {year && <span className="text-sm text-muted-foreground">{year}</span>}
                  {runtime && <span className="text-sm text-muted-foreground">· {runtime} min</span>}
                  {mediaType === 'tv' && <Badge variant="secondary" className="text-[10px] h-4">TV</Badge>}
                </div>
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  {genres.map((g: string) => (
                    <Badge key={g} variant="outline" className="text-[10px] h-4 px-1.5">{g}</Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </DrawerHeader>

        <div className="overflow-y-auto p-4 space-y-4" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
          {/* Ratings row */}
          <div className="flex items-center gap-4">
            {tmdbRating != null && tmdbRating > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-lg">
                <Star className="h-4 w-4 fill-cinema-gold text-cinema-gold" />
                <span className="text-sm font-semibold text-foreground">{tmdbRating.toFixed(1)}</span>
                <span className="text-xs text-muted-foreground">TMDB</span>
              </div>
            )}
            {userRating != null && userRating > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-cinema-red/15 rounded-lg">
                <Flame className="h-4 w-4 fill-cinema-red text-cinema-red" />
                <span className="text-sm font-semibold text-cinema-red">{userRating}/5</span>
                <span className="text-xs text-muted-foreground">Your rating</span>
              </div>
            )}
          </div>

          {/* Watched date */}
          {watchedDate && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Watched on {new Date(watchedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </div>
          )}

          {/* User notes/review */}
          {notes && (
            <div className="bg-muted/50 rounded-xl p-4 border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Your Review</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{notes}</p>
            </div>
          )}

          {/* Overview */}
          {overview && (
            <div>
              <h4 className="text-sm font-medium text-foreground mb-1.5">Synopsis</h4>
              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">{overview}</p>
            </div>
          )}

          {/* Additional content from parent */}
          {children}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            <Button asChild variant="outline" size="sm" className="flex-1">
              <Link to={detailPath}>
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                Full Details
              </Link>
            </Button>
            {onEdit && (
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Pencil className="h-3.5 w-3.5 mr-1.5" />
                Edit
              </Button>
            )}
            {onDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete "{title}"?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all your data for this {mediaType === 'tv' ? 'TV show' : 'movie'}.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => { onDelete(); onOpenChange(false); }}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
