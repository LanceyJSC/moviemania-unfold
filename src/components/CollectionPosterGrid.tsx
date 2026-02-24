import { Flame, Film, Tv, Heart, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';

const IMAGE_BASE = 'https://image.tmdb.org/t/p/w185';

const getPosterUrl = (posterPath: string | null): string | null => {
  if (!posterPath) return null;
  if (posterPath.startsWith('http')) return posterPath;
  return `${IMAGE_BASE}${posterPath}`;
};

const flameColors = [
  'text-amber-500',
  'text-orange-500',
  'text-orange-600',
  'text-red-500',
  'text-red-600',
];

export interface PosterGridItem {
  id: string;
  movieId: number;
  title: string;
  poster: string | null;
  mediaType: 'movie' | 'tv';
  userRating?: number | null;
  notes?: string | null;
  watchedDate?: string | null;
  onDelete?: () => void;
  onEdit?: () => void;
  isLiked?: boolean;
  isRewatch?: boolean;
}

interface CollectionPosterGridProps {
  items: PosterGridItem[];
}

export const CollectionPosterGrid = ({ items }: CollectionPosterGridProps) => {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
      {items.map(item => {
        const linkPath = item.mediaType === 'tv' ? `/tv/${item.movieId}` : `/movie/${item.movieId}`;
        return (
          <Link
            key={item.id}
            to={linkPath}
            className="group text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg block"
          >
            <div className="aspect-[2/3] w-full rounded-lg overflow-hidden bg-muted shadow-sm group-hover:shadow-md transition-shadow relative">
              {item.poster ? (
                <img
                  src={getPosterUrl(item.poster) || ''}
                  alt={item.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  {item.mediaType === 'tv' ? (
                    <Tv className="h-8 w-8 text-muted-foreground" />
                  ) : (
                    <Film className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
              )}
              {/* Hover overlay with title (desktop only) */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors hidden sm:flex items-end opacity-0 group-hover:opacity-100">
                <p className="text-white text-xs font-medium p-2 line-clamp-2 w-full">{item.title}</p>
              </div>
              {/* Liked heart badge */}
              {item.isLiked && (
                <div className="absolute bottom-1.5 left-1.5">
                  <Heart className="h-4 w-4 fill-cinema-red text-cinema-red drop-shadow" />
                </div>
              )}
              {/* Rewatch indicator */}
              {item.isRewatch && (
                <div className="absolute top-1.5 right-1.5 bg-black/50 rounded-full p-0.5">
                  <RotateCcw className="h-3 w-3 text-white" />
                </div>
              )}
            </div>
            {/* Flame rating below poster */}
            <div className="mt-1 flex items-center gap-0.5 min-h-[18px]">
              {item.userRating != null && item.userRating > 0 ? (
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: item.userRating }).map((_, i) => (
                    <Flame
                      key={i}
                      className={`h-3 w-3 fill-current ${flameColors[i] || flameColors[4]}`}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          </Link>
        );
      })}
    </div>
  );
};
