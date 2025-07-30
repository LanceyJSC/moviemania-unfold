import { useState, useEffect } from 'react';
import { motion, PanInfo, AnimatePresence } from 'framer-motion';
import { Heart, X, RotateCcw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSocialFeatures } from '@/hooks/useSocialFeatures';
import { tmdbService, TMDBResponse } from '@/lib/tmdb';
import { useToast } from '@/hooks/use-toast';

interface Movie {
  id: number;
  title: string;
  poster_path: string;
  overview: string;
  vote_average: number;
  release_date: string;
  genre_ids: number[];
}

export const MovieDiscovery = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dragDirection, setDragDirection] = useState<'left' | 'right' | null>(null);
  const { saveMoviePreference } = useSocialFeatures();
  const { toast } = useToast();

  const fetchRandomMovies = async () => {
    try {
      setLoading(true);
      // Fetch multiple pages to get variety
      const pages = [1, 2, 3, 4, 5];
      const allMovies: Movie[] = [];
      
      for (const page of pages) {
        const data = await tmdbService.getPopularMovies(page, true);
        allMovies.push(...data.results);
      }
      
      // Shuffle the array for random order
      const shuffled = allMovies.sort(() => 0.5 - Math.random());
      setMovies(shuffled);
      setCurrentIndex(0);
    } catch (error) {
      console.error('Error fetching movies:', error);
      toast({
        title: "Error",
        description: "Failed to load movies. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = async (direction: 'like' | 'dislike') => {
    const currentMovie = movies[currentIndex];
    if (!currentMovie) return;

    try {
      await saveMoviePreference(
        currentMovie.id,
        currentMovie.title,
        currentMovie.poster_path ? `https://image.tmdb.org/t/p/w500${currentMovie.poster_path}` : '',
        direction
      );

      if (direction === 'like') {
        toast({
          title: "Added to watchlist!",
          description: `${currentMovie.title} has been added to your watchlist.`
        });
      }

      setCurrentIndex(prev => prev + 1);
      
      // Load more movies if running low
      if (currentIndex >= movies.length - 3) {
        await fetchRandomMovies();
      }
    } catch (error) {
      console.error('Error saving preference:', error);
      toast({
        title: "Error",
        description: "Failed to save your preference. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDragEnd = (event: any, info: PanInfo) => {
    const threshold = 100;
    const { offset, velocity } = info;

    if (Math.abs(offset.x) > threshold || Math.abs(velocity.x) > 500) {
      if (offset.x > 0) {
        handleSwipe('like');
      } else {
        handleSwipe('dislike');
      }
    }
    setDragDirection(null);
  };

  const handleDrag = (event: any, info: PanInfo) => {
    const { offset } = info;
    if (Math.abs(offset.x) > 50) {
      setDragDirection(offset.x > 0 ? 'right' : 'left');
    } else {
      setDragDirection(null);
    }
  };

  const resetAndFetchNew = () => {
    fetchRandomMovies();
  };

  useEffect(() => {
    fetchRandomMovies();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  const currentMovie = movies[currentIndex];
  const nextMovie = movies[currentIndex + 1];

  if (!currentMovie) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
        <p className="text-xl text-muted-foreground">No more movies to discover!</p>
        <Button onClick={resetAndFetchNew} className="flex items-center gap-2">
          <RotateCcw className="h-4 w-4" />
          Load More Movies
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/50 p-4">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Discover Movies
          </h1>
          <p className="text-muted-foreground mt-2">
            Swipe right to like, left to pass
          </p>
        </div>

        <div className="relative h-[600px] flex items-center justify-center">
          <AnimatePresence mode="popLayout">
            {/* Next movie (background) */}
            {nextMovie && (
              <motion.div
                key={`next-${nextMovie.id}`}
                className="absolute inset-0"
                initial={{ scale: 0.9, opacity: 0.5 }}
                animate={{ scale: 0.9, opacity: 0.5 }}
                style={{ zIndex: 1 }}
              >
                <Card className="h-full overflow-hidden">
                  <div className="relative h-full">
                    <img
                      src={nextMovie.poster_path ? `https://image.tmdb.org/t/p/w500${nextMovie.poster_path}` : '/placeholder.svg'}
                      alt={nextMovie.title}
                      className="w-full h-2/3 object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4">
                      <h3 className="text-white font-bold text-lg">{nextMovie.title}</h3>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Current movie */}
            <motion.div
              key={`current-${currentMovie.id}`}
              className="absolute inset-0"
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              onDrag={handleDrag}
              onDragEnd={handleDragEnd}
              animate={{
                x: 0,
                rotate: 0,
                opacity: 1,
              }}
              exit={{
                x: dragDirection === 'right' ? 300 : -300,
                rotate: dragDirection === 'right' ? 20 : -20,
                opacity: 0,
              }}
              whileDrag={{
                rotate: dragDirection === 'right' ? 10 : dragDirection === 'left' ? -10 : 0,
                scale: 1.05,
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              style={{ zIndex: 2 }}
            >
              <Card className="h-full overflow-hidden cursor-grab active:cursor-grabbing shadow-xl">
                <div className="relative h-full">
                  <img
                    src={currentMovie.poster_path ? `https://image.tmdb.org/t/p/w500${currentMovie.poster_path}` : '/placeholder.svg'}
                    alt={currentMovie.title}
                    className="w-full h-2/3 object-cover"
                  />
                  <CardContent className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent text-white p-6">
                    <h3 className="font-bold text-xl mb-2">{currentMovie.title}</h3>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="secondary" className="bg-white/20 text-white">
                        ⭐ {currentMovie.vote_average.toFixed(1)}
                      </Badge>
                      <Badge variant="secondary" className="bg-white/20 text-white">
                        {new Date(currentMovie.release_date).getFullYear()}
                      </Badge>
                    </div>
                    <p className="text-sm line-clamp-3 opacity-90">
                      {currentMovie.overview}
                    </p>
                  </CardContent>
                  
                  {/* Swipe indicators */}
                  {dragDirection && (
                    <div className={`absolute inset-0 flex items-center justify-center bg-black/50`}>
                      <div className={`p-4 rounded-full ${dragDirection === 'right' ? 'bg-green-500/80' : 'bg-red-500/80'}`}>
                        {dragDirection === 'right' ? (
                          <Heart className="h-12 w-12 text-white" />
                        ) : (
                          <X className="h-12 w-12 text-white" />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Action buttons */}
        <div className="flex justify-center gap-6 mt-6">
          <Button
            size="lg"
            variant="outline"
            className="rounded-full w-16 h-16 p-0 border-2 hover:bg-red-50 hover:border-red-500"
            onClick={() => handleSwipe('dislike')}
          >
            <X className="h-6 w-6 text-red-500" />
          </Button>
          
          <Button
            size="lg"
            variant="outline"
            className="rounded-full w-16 h-16 p-0 border-2 hover:bg-green-50 hover:border-green-500"
            onClick={() => handleSwipe('like')}
          >
            <Heart className="h-6 w-6 text-green-500" />
          </Button>
        </div>

        <div className="text-center mt-6">
          <Button
            variant="ghost"
            onClick={resetAndFetchNew}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-4 w-4" />
            Load Different Movies
          </Button>
        </div>
      </div>
    </div>
  );
};