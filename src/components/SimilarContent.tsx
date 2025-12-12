import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MovieCard } from '@/components/MovieCard';
import { TVShowCard } from '@/components/TVShowCard';
import { tmdbService, Movie, TVShow } from '@/lib/tmdb';

interface SimilarContentProps {
  mediaId: number;
  mediaType: 'movie' | 'tv';
  title?: string;
}

export const SimilarContent = ({ mediaId, mediaType, title = 'SIMILAR' }: SimilarContentProps) => {
  const [items, setItems] = useState<(Movie | TVShow)[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchSimilar = async () => {
      setIsLoading(true);
      try {
        const response = mediaType === 'movie'
          ? await tmdbService.getSimilarMovies(mediaId)
          : await tmdbService.getSimilarTVShows(mediaId);
        
        setItems(response.results.slice(0, 20));
      } catch (error) {
        console.error('Failed to fetch similar content:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSimilar();
  }, [mediaId, mediaType]);

  const checkScrollButtons = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = 300;
    const newPosition = scrollRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
    scrollRef.current.scrollTo({ left: newPosition, behavior: 'smooth' });
    setTimeout(checkScrollButtons, 300);
  };

  useEffect(() => {
    checkScrollButtons();
  }, [items]);

  if (isLoading) {
    return (
      <div className="py-4">
        <h2 className="text-2xl font-cinematic text-foreground mb-6 tracking-wide">{title}</h2>
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-cinema-red" />
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="py-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-cinematic text-foreground tracking-wide">{title}</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            className={`h-8 w-8 rounded-full ${!canScrollLeft ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className={`h-8 w-8 rounded-full ${!canScrollRight ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4"
        onScroll={checkScrollButtons}
      >
        {items.map((item) => (
          mediaType === 'movie' ? (
            <MovieCard
              key={item.id}
              movie={tmdbService.formatMovieForCard(item as Movie)}
            />
          ) : (
            <TVShowCard
              key={item.id}
              tvShow={tmdbService.formatTVShowForCard(item as TVShow)}
            />
          )
        ))}
      </div>
    </div>
  );
};
