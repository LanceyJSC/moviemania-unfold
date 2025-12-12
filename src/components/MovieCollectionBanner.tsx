import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Film, ChevronRight, Check } from 'lucide-react';
import { tmdbService, MovieCollection } from '@/lib/tmdb';
import { useUserStateContext } from '@/contexts/UserStateContext';

interface MovieCollectionBannerProps {
  collectionId: number;
  currentMovieId: number;
}

export const MovieCollectionBanner = ({ collectionId, currentMovieId }: MovieCollectionBannerProps) => {
  const [collection, setCollection] = useState<MovieCollection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isWatched } = useUserStateContext();

  useEffect(() => {
    const fetchCollection = async () => {
      setIsLoading(true);
      try {
        const data = await tmdbService.getMovieCollection(collectionId);
        // Sort parts by release date
        data.parts.sort((a, b) => {
          if (!a.release_date) return 1;
          if (!b.release_date) return -1;
          return new Date(a.release_date).getTime() - new Date(b.release_date).getTime();
        });
        setCollection(data);
      } catch (error) {
        console.error('Failed to fetch collection:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (collectionId) {
      fetchCollection();
    }
  }, [collectionId]);

  if (isLoading || !collection) {
    return null;
  }

  const watchedCount = collection.parts.filter(movie => isWatched(movie.id)).length;
  const totalCount = collection.parts.length;
  const progressPercent = totalCount > 0 ? (watchedCount / totalCount) * 100 : 0;

  return (
    <div className="relative rounded-xl overflow-hidden mb-6">
      {/* Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: collection.backdrop_path 
            ? `url(${tmdbService.getBackdropUrl(collection.backdrop_path, 'w780')})`
            : undefined,
          backgroundColor: 'hsl(var(--card))'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-cinema-black/90 via-cinema-black/70 to-cinema-black/50" />
      </div>

      {/* Content */}
      <div className="relative p-4">
        <div className="flex items-center gap-2 mb-2">
          <Film className="h-4 w-4 text-cinema-gold" />
          <span className="text-xs text-cinema-gold font-semibold uppercase tracking-wider">Part of Collection</span>
        </div>
        
        <h3 className="text-lg font-cinematic text-white mb-2">{collection.name}</h3>
        
        {/* Progress bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-white/70 mb-1">
            <span>{watchedCount} of {totalCount} watched</span>
            <span>{Math.round(progressPercent)}%</span>
          </div>
          <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-cinema-gold rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Movie posters */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
          {collection.parts.map((movie) => (
            <Link 
              key={movie.id} 
              to={`/movie/${movie.id}`}
              className={`flex-shrink-0 relative ${movie.id === currentMovieId ? 'ring-2 ring-cinema-gold rounded-md' : ''}`}
            >
              <img
                src={tmdbService.getPosterUrl(movie.poster_path, 'w300')}
                alt={movie.title}
                className="w-14 h-20 object-cover rounded-md"
              />
              {isWatched(movie.id) && (
                <div className="absolute inset-0 bg-green-600/50 rounded-md flex items-center justify-center">
                  <Check className="h-4 w-4 text-white" />
                </div>
              )}
              {movie.id === currentMovieId && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-cinema-gold rounded-full" />
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};
