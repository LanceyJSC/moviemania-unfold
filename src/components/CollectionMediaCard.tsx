import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Film, Tv, Star, Trash2, Pencil, ChevronRight } from 'lucide-react';
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
  onEdit?: () => void;
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
  onEdit,
  children
}: CollectionMediaCardProps) => {
  const navigate = useNavigate();
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
    <Card className="overflow-hidden">
      {/* Main tappable area - navigates to detail page */}
      <button
        onClick={() => navigate(linkPath)}
        className="w-full p-4 text-left touch-manipulation active:bg-muted/50 transition-colors"
      >
        <div className="flex gap-4">
          {/* Poster */}
          {poster ? (
            <img 
              src={`${IMAGE_BASE}${poster}`} 
              alt={title} 
              className="w-16 h-24 object-cover rounded flex-shrink-0" 
            />
          ) : (
            <div className="w-16 h-24 bg-muted rounded flex items-center justify-center flex-shrink-0">
              {mediaType === 'tv' ? (
                <Tv className="h-6 w-6 text-muted-foreground" />
              ) : (
                <Film className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
          )}

          {/* Info */}
          <div className="flex-1 min-w-0">
            {/* Title with media type icon */}
            <div className="flex items-center gap-2 mb-1">
              {mediaType === 'tv' ? (
                <Tv className="h-4 w-4 text-primary flex-shrink-0" />
              ) : (
                <Film className="h-4 w-4 text-cinema-red flex-shrink-0" />
              )}
              <span className="font-semibold line-clamp-1">{title}</span>
            </div>

            {/* Ratings row */}
            <div className="flex items-center gap-3">
              {tmdbRating !== null && (
                <div className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-cinema-gold text-cinema-gold" />
                  <span className="text-sm text-muted-foreground">{tmdbRating.toFixed(1)}</span>
                </div>
              )}
              {userRating && userRating > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-cinema-gold/20 rounded text-cinema-gold font-semibold text-xs">
                  {userRating}/10
                </span>
              )}
            </div>

            {/* Additional content slot */}
            {children && <div className="mt-2">{children}</div>}
          </div>

          {/* Chevron indicator */}
          <div className="flex items-center flex-shrink-0">
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
      </button>

      {/* Action buttons - separate from main tap area */}
      <div className="flex items-center justify-end gap-1 px-4 pb-4 -mt-2">
        {onEdit && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="text-muted-foreground hover:text-foreground h-9 px-3 touch-manipulation"
          >
            <Pencil className="h-4 w-4 mr-1.5" />
            Edit
          </Button>
        )}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => e.stopPropagation()}
              className="text-destructive hover:text-destructive hover:bg-destructive/10 h-9 px-3 touch-manipulation"
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete "{title}"?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete all data for this {mediaType === 'tv' ? 'TV show' : 'movie'} including ratings, reviews, and diary entries.
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
    </Card>
  );
};
