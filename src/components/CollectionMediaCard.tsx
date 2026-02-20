import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Film, Tv, Star, Trash2, Pencil, Flame } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

const getPosterUrl = (posterPath: string | null): string | null => {
  if (!posterPath) return null;
  if (posterPath.startsWith('http')) return posterPath;
  return `${IMAGE_BASE}${posterPath}`;
};

interface CollectionMediaCardProps {
  id: string;
  movieId: number;
  title: string;
  poster: string | null;
  mediaType: 'movie' | 'tv';
  userRating?: number | null;
  onDelete: () => void;
  onEdit?: () => void;
  children?: React.ReactNode;
  showWatchedOverlay?: boolean;
}

export const CollectionMediaCard = ({
  id,
  movieId,
  title,
  poster,
  mediaType,
  userRating,
  onDelete,
  onEdit,
  children,
  showWatchedOverlay = false,
}: CollectionMediaCardProps) => {
  const [tmdbRating, setTmdbRating] = useState<number | null>(null);
  const [releaseYear, setReleaseYear] = useState<string | null>(null);
  const [genres, setGenres] = useState<string[]>([]);
  const [overview, setOverview] = useState<string | null>(null);

  useEffect(() => {
    const fetchTmdbData = async () => {
      try {
        if (mediaType === 'tv') {
          const details = await tmdbService.getTVShowDetails(movieId);
          setTmdbRating(details.vote_average);
          setReleaseYear(details.first_air_date?.split('-')[0] || null);
          setGenres((details.genres || []).slice(0, 2).map((g: any) => g.name));
          setOverview(details.overview || null);
        } else {
          const details = await tmdbService.getMovieDetails(movieId);
          setTmdbRating(details.vote_average);
          setReleaseYear(details.release_date?.split('-')[0] || null);
          setGenres((details.genres || []).slice(0, 2).map((g: any) => g.name));
          setOverview(details.overview || null);
        }
      } catch (error) {
        console.error('Failed to fetch TMDB data:', error);
      }
    };
    fetchTmdbData();
  }, [movieId, mediaType]);

  const linkPath = mediaType === 'tv' ? `/tv/${movieId}` : `/movie/${movieId}`;

  return (
    <Card className="p-3 sm:p-4 hover:bg-accent/5 transition-colors">
      <div className="flex gap-3 sm:gap-4">
        <Link to={linkPath} className="relative shrink-0">
          {poster ? (
            <img src={getPosterUrl(poster) || ''} alt={title} className="w-24 h-36 object-cover rounded-md shadow-sm" />
          ) : (
            <div className="w-24 h-36 bg-muted rounded-md flex items-center justify-center">
              {mediaType === 'tv' ? <Tv className="h-8 w-8 text-muted-foreground" /> : <Film className="h-8 w-8 text-muted-foreground" />}
            </div>
          )}
        </Link>
        <div className="flex-1 min-w-0">
          {/* Title with media type icon */}
          <div className="flex items-center gap-1.5">
            {mediaType === 'tv' ? (
              <Tv className="h-3.5 w-3.5 text-primary shrink-0" />
            ) : (
              <Film className="h-3.5 w-3.5 text-cinema-red shrink-0" />
            )}
            <Link to={linkPath} className="font-semibold text-sm hover:underline line-clamp-1">
              {title}
            </Link>
          </div>

          {/* Year & Genres */}
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            {releaseYear && (
              <span className="text-xs text-muted-foreground">{releaseYear}</span>
            )}
            {genres.map(genre => (
              <Badge key={genre} variant="secondary" className="text-[10px] h-4 px-1.5 py-0">
                {genre}
              </Badge>
            ))}
          </div>

          {/* Ratings row */}
          <div className="flex items-center gap-3 mt-1.5">
            {tmdbRating !== null && (
              <div className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-cinema-gold text-cinema-gold" />
                <span className="text-xs text-muted-foreground">{tmdbRating.toFixed(1)}</span>
              </div>
            )}
            {userRating && userRating > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-cinema-red/20 rounded text-cinema-red font-semibold text-xs">
                <Flame className="h-3 w-3 fill-current" />
                {userRating}/5
              </span>
            )}
          </div>

          {/* Overview */}
          {overview && (
            <p className="text-[11px] text-muted-foreground line-clamp-1 mt-1">{overview}</p>
          )}

          {/* Additional content slot */}
          {children}
        </div>
        <div className="flex flex-col gap-1 shrink-0">
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onEdit}
              className="text-muted-foreground hover:text-foreground hover:bg-muted h-9 w-9 touch-manipulation active:scale-95"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive hover:bg-destructive/10 h-9 w-9 touch-manipulation active:scale-95"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete "{title}"?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all your data for this {mediaType === 'tv' ? 'TV show' : 'movie'} including ratings, reviews, and diary entries.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </Card>
  );
};
