import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Film, Tv, Star, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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

const IMAGE_BASE = 'https://image.tmdb.org/t/p/w185';

interface CollectionMediaCardProps {
  id: string;
  movieId: number;
  title: string;
  poster: string | null;
  mediaType: 'movie' | 'tv';
  userRating?: number | null;
  onDelete: () => void;
  children?: React.ReactNode;
}

export const CollectionMediaCard = ({
  id,
  movieId,
  title,
  poster,
  mediaType,
  userRating,
  onDelete,
  children
}: CollectionMediaCardProps) => {
  const [tmdbRating, setTmdbRating] = useState<number | null>(null);

  useEffect(() => {
    const fetchTmdbRating = async () => {
      try {
        if (mediaType === 'tv') {
          const details = await tmdbService.getTVShowDetails(movieId);
          setTmdbRating(details.vote_average);
        } else {
          const details = await tmdbService.getMovieDetails(movieId);
          setTmdbRating(details.vote_average);
        }
      } catch (error) {
        console.error('Failed to fetch TMDB rating:', error);
      }
    };
    fetchTmdbRating();
  }, [movieId, mediaType]);

  const linkPath = mediaType === 'tv' ? `/tv/${movieId}` : `/movie/${movieId}`;

  return (
    <Card className="p-4">
      <div className="flex gap-4">
        <Link to={linkPath}>
          {poster ? (
            <img src={`${IMAGE_BASE}${poster}`} alt={title} className="w-16 h-24 object-cover rounded" />
          ) : (
            <div className="w-16 h-24 bg-muted rounded flex items-center justify-center">
              {mediaType === 'tv' ? <Tv className="h-6 w-6 text-muted-foreground" /> : <Film className="h-6 w-6 text-muted-foreground" />}
            </div>
          )}
        </Link>
        <div className="flex-1 min-w-0">
          {/* Title with media type icon */}
          <div className="flex items-center gap-2">
            {mediaType === 'tv' ? (
              <Tv className="h-4 w-4 text-primary shrink-0" />
            ) : (
              <Film className="h-4 w-4 text-cinema-red shrink-0" />
            )}
            <Link to={linkPath} className="font-semibold hover:underline line-clamp-1">
              {title}
            </Link>
          </div>

          {/* Ratings row */}
          <div className="flex items-center gap-4 mt-1">
            {/* TMDB Rating */}
            {tmdbRating !== null && (
              <div className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-cinema-gold text-cinema-gold" />
                <span className="text-sm text-muted-foreground">{tmdbRating.toFixed(1)}</span>
              </div>
            )}

            {/* User Rating - now 1-10 */}
            {userRating && userRating > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/20 rounded text-primary font-semibold text-xs">
                {userRating}/10
              </span>
            )}
          </div>

          {/* Additional content slot */}
          {children}
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete "{title}"?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete all data for this {mediaType === 'tv' ? 'TV show' : 'movie'} including:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Ratings and reviews</li>
                  <li>Diary entries and notes</li>
                  <li>Watchlist and favorites status</li>
                </ul>
                <p className="mt-2 font-medium">This action cannot be undone.</p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={onDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete All Data
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Card>
  );
};
