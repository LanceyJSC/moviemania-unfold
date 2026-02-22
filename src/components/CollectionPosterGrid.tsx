import { Flame, Film, Tv } from 'lucide-react';
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
}

interface CollectionPosterGridProps {
  items: PosterGridItem[];
}

export const CollectionPosterGrid = ({ items }: CollectionPosterGridProps) => {
  return (
    <div className="flex flex-wrap gap-3">
      {items.map(item => {
        const linkPath = item.mediaType === 'tv' ? `/tv/${item.movieId}` : `/movie/${item.movieId}`;
        return (
          <Link
            key={item.id}
            to={linkPath}
            className="group text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg block"
          >
            <div className="w-32 h-48 rounded-lg overflow-hidden bg-muted shadow-sm group-hover:shadow-md transition-shadow relative flex-shrink-0">
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
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
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
