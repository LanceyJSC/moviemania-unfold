import { useState } from 'react';
import { Star, Flame, Film, Tv } from 'lucide-react';
import { CollectionDetailDrawer } from '@/components/CollectionDetailDrawer';

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
}

interface CollectionPosterGridProps {
  items: PosterGridItem[];
}

export const CollectionPosterGrid = ({ items }: CollectionPosterGridProps) => {
  const [selectedItem, setSelectedItem] = useState<PosterGridItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handlePosterTap = (item: PosterGridItem) => {
    setSelectedItem(item);
    setDrawerOpen(true);
  };

  return (
    <>
      <div className="flex flex-wrap gap-3">
        {items.map(item => (
          <button
            key={item.id}
            onClick={() => handlePosterTap(item)}
            className="group text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg"
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
            {/* Rating below poster */}
            <div className="mt-1 flex items-center gap-0.5 min-h-[18px]">
              {item.userRating != null && item.userRating > 0 ? (
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-2.5 w-2.5 ${
                        i < item.userRating!
                          ? 'fill-cinema-gold text-cinema-gold'
                          : 'text-muted-foreground/30'
                      }`}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          </button>
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
