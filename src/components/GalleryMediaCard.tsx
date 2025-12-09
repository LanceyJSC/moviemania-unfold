import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Film, Tv, Star, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { tmdbService } from '@/lib/tmdb';

const IMAGE_BASE = 'https://image.tmdb.org/t/p/w185';

interface GalleryMediaCardProps {
  id: string;
  movieId: number;
  title: string;
  poster: string | null;
  mediaType: 'movie' | 'tv';
  userRating?: number | null;
  onDelete: () => void;
  children?: React.ReactNode;
}

export const GalleryMediaCard = ({
  id,
  movieId,
  title,
  poster,
  mediaType,
  userRating,
  onDelete,
  children
}: GalleryMediaCardProps) => {
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

            {/* User Rating */}
            {userRating && userRating > 0 && (
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-3 w-3 ${star <= userRating ? 'fill-primary text-primary' : 'text-muted-foreground'}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Additional content slot */}
          {children}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
};
