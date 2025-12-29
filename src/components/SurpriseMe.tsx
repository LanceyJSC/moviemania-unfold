import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shuffle, Sparkles, X, Play, Clock, Star } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent } from './ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { ProUpgradeModal } from './ProUpgradeModal';
import { ProBadge } from './ProBadge';
import { supabase } from '@/integrations/supabase/client';
import { fetchMovieRecommendations, getImageUrl, fetchMovieDetails } from '@/lib/tmdb';
import { cn } from '@/lib/utils';

interface SurpriseMovie {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  vote_average: number;
  release_date: string;
  runtime?: number;
  genres?: Array<{ id: number; name: string }>;
}

interface SurpriseMeProps {
  variant?: 'button' | 'card';
  className?: string;
}

export const SurpriseMe = ({ variant = 'button', className }: SurpriseMeProps) => {
  const { user } = useAuth();
  const { isProUser } = useSubscription();
  const navigate = useNavigate();
  
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showReveal, setShowReveal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [movie, setMovie] = useState<SurpriseMovie | null>(null);
  const [isRevealing, setIsRevealing] = useState(false);

  const getSurpriseMovie = async () => {
    if (!user || !isProUser) {
      setShowUpgradeModal(true);
      return;
    }

    setLoading(true);
    setShowReveal(true);
    setIsRevealing(true);

    try {
      // Get user's highly rated movies
      const { data: ratings } = await supabase
        .from('user_ratings')
        .select('movie_id')
        .eq('user_id', user.id)
        .eq('media_type', 'movie')
        .gte('rating', 3)
        .limit(10);

      if (!ratings || ratings.length === 0) {
        // Fallback to popular movies if no ratings
        const response = await fetch(
          `https://api.themoviedb.org/3/movie/popular?api_key=${import.meta.env.VITE_TMDB_API_KEY}`
        );
        const data = await response.json();
        const randomIndex = Math.floor(Math.random() * data.results.length);
        const selectedMovie = data.results[randomIndex];
        const details = await fetchMovieDetails(selectedMovie.id);
        setMovie({ ...selectedMovie, ...details });
      } else {
        // Get recommendations from a random highly-rated movie
        const randomRating = ratings[Math.floor(Math.random() * ratings.length)];
        const recommendations = await fetchMovieRecommendations(randomRating.movie_id);
        
        if (recommendations && recommendations.length > 0) {
          const randomRec = recommendations[Math.floor(Math.random() * recommendations.length)];
          const details = await fetchMovieDetails(randomRec.id);
          setMovie({ ...randomRec, ...details });
        }
      }

      // Dramatic reveal animation delay
      setTimeout(() => {
        setIsRevealing(false);
      }, 1500);
    } catch (error) {
      console.error('Error getting surprise movie:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWatchMovie = () => {
    if (movie) {
      navigate(`/movie/${movie.id}`);
      setShowReveal(false);
    }
  };

  const handleShuffle = () => {
    setMovie(null);
    getSurpriseMovie();
  };

  if (variant === 'card') {
    return (
      <>
        <button
          onClick={getSurpriseMovie}
          className={cn(
            "relative overflow-hidden rounded-xl border border-dashed border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-orange-500/5 p-6 transition-all hover:border-amber-500/50 hover:from-amber-500/10 hover:to-orange-500/10 group",
            className
          )}
        >
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="p-3 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 group-hover:scale-110 transition-transform">
              <Shuffle className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <div className="flex items-center gap-2 justify-center mb-1">
                <h3 className="font-semibold text-foreground">Surprise Me!</h3>
                <ProBadge size="sm" />
              </div>
              <p className="text-sm text-muted-foreground">
                Get a random personalized pick
              </p>
            </div>
          </div>
          <Sparkles className="absolute top-2 right-2 h-4 w-4 text-amber-500/50" />
        </button>

        <Dialog open={showReveal} onOpenChange={setShowReveal}>
          <DialogContent className="sm:max-w-lg p-0 overflow-hidden bg-card border-border">
            {isRevealing ? (
              <div className="h-96 flex items-center justify-center bg-gradient-to-br from-amber-500/10 to-orange-500/10">
                <div className="text-center space-y-4">
                  <div className="animate-spin">
                    <Shuffle className="h-12 w-12 text-amber-500" />
                  </div>
                  <p className="text-lg font-medium text-foreground animate-pulse">
                    Finding your perfect pick...
                  </p>
                </div>
              </div>
            ) : movie ? (
              <div className="relative">
                {movie.backdrop_path && (
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={getImageUrl(movie.backdrop_path, 'w780')}
                      alt={movie.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
                  </div>
                )}
                
                <div className="p-6 space-y-4">
                  <div className="flex gap-4">
                    {movie.poster_path && (
                      <img
                        src={getImageUrl(movie.poster_path, 'w185')}
                        alt={movie.title}
                        className="w-24 h-36 rounded-lg object-cover shadow-lg -mt-16 relative z-10 border-2 border-card"
                      />
                    )}
                    <div className="flex-1 pt-2">
                      <h2 className="text-xl font-bold text-foreground">{movie.title}</h2>
                      <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                          {movie.vote_average.toFixed(1)}
                        </span>
                        {movie.runtime && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m
                          </span>
                        )}
                        <span>{new Date(movie.release_date).getFullYear()}</span>
                      </div>
                      {movie.genres && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {movie.genres.slice(0, 3).map(genre => (
                            <span key={genre.id} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                              {genre.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {movie.overview}
                  </p>

                  <div className="flex gap-3">
                    <Button onClick={handleWatchMovie} className="flex-1 gap-2">
                      <Play className="h-4 w-4" />
                      View Details
                    </Button>
                    <Button onClick={handleShuffle} variant="outline" className="gap-2">
                      <Shuffle className="h-4 w-4" />
                      Shuffle
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-96 flex items-center justify-center">
                <p className="text-muted-foreground">Something went wrong. Try again!</p>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <ProUpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          feature="Surprise Me"
          description="Get personalized random movie recommendations based on your taste. Perfect for when you can't decide what to watch!"
        />
      </>
    );
  }

  return (
    <>
      <Button
        onClick={getSurpriseMovie}
        variant="outline"
        className={cn("gap-2 border-amber-500/30 hover:border-amber-500/50 hover:bg-amber-500/10", className)}
      >
        <Shuffle className="h-4 w-4 text-amber-500" />
        Surprise Me
        <ProBadge size="sm" />
      </Button>

      <Dialog open={showReveal} onOpenChange={setShowReveal}>
        <DialogContent className="sm:max-w-lg p-0 overflow-hidden bg-card border-border">
          {/* Same content as card variant */}
          {isRevealing ? (
            <div className="h-96 flex items-center justify-center bg-gradient-to-br from-amber-500/10 to-orange-500/10">
              <div className="text-center space-y-4">
                <div className="animate-spin">
                  <Shuffle className="h-12 w-12 text-amber-500" />
                </div>
                <p className="text-lg font-medium text-foreground animate-pulse">
                  Finding your perfect pick...
                </p>
              </div>
            </div>
          ) : movie ? (
            <div className="relative">
              {movie.backdrop_path && (
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={getImageUrl(movie.backdrop_path, 'w780')}
                    alt={movie.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
                </div>
              )}
              
              <div className="p-6 space-y-4">
                <div className="flex gap-4">
                  {movie.poster_path && (
                    <img
                      src={getImageUrl(movie.poster_path, 'w185')}
                      alt={movie.title}
                      className="w-24 h-36 rounded-lg object-cover shadow-lg -mt-16 relative z-10 border-2 border-card"
                    />
                  )}
                  <div className="flex-1 pt-2">
                    <h2 className="text-xl font-bold text-foreground">{movie.title}</h2>
                    <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                        {movie.vote_average.toFixed(1)}
                      </span>
                      {movie.runtime && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m
                        </span>
                      )}
                      <span>{new Date(movie.release_date).getFullYear()}</span>
                    </div>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {movie.overview}
                </p>

                <div className="flex gap-3">
                  <Button onClick={handleWatchMovie} className="flex-1 gap-2">
                    <Play className="h-4 w-4" />
                    View Details
                  </Button>
                  <Button onClick={handleShuffle} variant="outline" className="gap-2">
                    <Shuffle className="h-4 w-4" />
                    Shuffle
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <ProUpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        feature="Surprise Me"
        description="Get personalized random movie recommendations based on your taste."
      />
    </>
  );
};
