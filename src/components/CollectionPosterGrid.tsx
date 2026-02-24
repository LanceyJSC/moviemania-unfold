import { Flame, Film, Tv, Heart, Eye, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUserStateContext } from '@/contexts/UserStateContext';

const IMAGE_BASE = 'https://image.tmdb.org/t/p/w185';

const getPosterUrl = (posterPath: string | null): string | null => {
  if (!posterPath) return null;
  if (posterPath.startsWith('http')) return posterPath;
  return `${IMAGE_BASE}${posterPath}`;
};

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
  linkPath?: string;
}

interface CollectionPosterGridProps {
  items: PosterGridItem[];
}

const PosterGridCard = ({ item }: { item: PosterGridItem }) => {
  const { getRating, isLiked, isWatched, isInWatchlist } = useUserStateContext();

  const userRating = getRating(item.movieId);
  const liked = isLiked(item.movieId);
  const watched = isWatched(item.movieId);
  const onWatchlist = isInWatchlist(item.movieId);

  const linkPath = item.linkPath || (item.mediaType === 'tv' ? `/tv/${item.movieId}` : `/movie/${item.movieId}`);

  return (
    <Link
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

        {/* Hover overlay dim */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 pointer-events-none" />

        {/* Hover badges - each in a corner */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          {/* Top-left: SceneBurn Score */}
          {userRating > 0 && (
            <div className="absolute top-1.5 left-1.5 bg-black/70 backdrop-blur-sm rounded-full px-1.5 py-0.5 flex items-center gap-0.5">
              <Flame className="h-3 w-3 text-cinema-red fill-current" />
              <span className="text-white font-semibold text-[10px]">{userRating}/5</span>
            </div>
          )}

          {/* Top-right: Favorite */}
          {liked && (
            <div className="absolute top-1.5 right-1.5 bg-black/70 backdrop-blur-sm rounded-full p-1">
              <Heart className="h-3 w-3 text-cinema-red fill-cinema-red" />
            </div>
          )}

          {/* Bottom-left: Watched */}
          {watched && (
            <div className="absolute bottom-1.5 left-1.5 bg-black/70 backdrop-blur-sm rounded-full p-1">
              <Eye className="h-3 w-3 text-emerald-400" />
            </div>
          )}

          {/* Bottom-right: On Watchlist */}
          {onWatchlist && (
            <div className="absolute bottom-1.5 right-1.5 bg-black/70 backdrop-blur-sm rounded-full p-1">
              <Plus className="h-3 w-3 text-primary" />
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export const CollectionPosterGrid = ({ items }: CollectionPosterGridProps) => {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
      {items.map(item => (
        <PosterGridCard key={item.id} item={item} />
      ))}
    </div>
  );
};
