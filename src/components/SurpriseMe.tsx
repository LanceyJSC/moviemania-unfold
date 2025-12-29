import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shuffle, Sparkles, X, Play, Clock, Star } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent } from './ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { ProUpgradeModal } from './ProUpgradeModal';
import { supabase } from '@/integrations/supabase/client';
import { tmdbService, getImageUrl } from '@/lib/tmdb';
import { cn } from '@/lib/utils';

interface SurpriseMedia {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  vote_average: number;
  release_date: string;
  runtime?: number;
  genres?: Array<{ id: number; name: string }>;
  media_type: 'movie' | 'tv';
}

interface SurpriseMeProps {
  variant?: 'button' | 'card';
  className?: string;
  mediaType?: 'all' | 'movies' | 'tv';
}

export const SurpriseMe = ({ variant = 'button', className, mediaType = 'all' }: SurpriseMeProps) => {
  const { user } = useAuth();
  const { isProUser } = useSubscription();
  const navigate = useNavigate();
  
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showReveal, setShowReveal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [media, setMedia] = useState<SurpriseMedia | null>(null);
  const [isRevealing, setIsRevealing] = useState(false);

  const getSurpriseMedia = async () => {
    if (!user || !isProUser) {
      setShowUpgradeModal(true);
      return;
    }

    setLoading(true);
    setShowReveal(true);
    setIsRevealing(true);

    try {
      // Determine which media types to consider
      const includeMovies = mediaType === 'all' || mediaType === 'movies';
      const includeTV = mediaType === 'all' || mediaType === 'tv';

      // Get user's highly rated content based on media type filter
      const ratingsQuery = supabase
        .from('user_ratings')
        .select('movie_id, media_type')
        .eq('user_id', user.id)
        .gte('rating', 3)
        .limit(20);

      if (mediaType === 'movies') {
        ratingsQuery.eq('media_type', 'movie');
      } else if (mediaType === 'tv') {
        ratingsQuery.eq('media_type', 'tv');
      }

      const { data: ratings } = await ratingsQuery;

      let selectedMedia: SurpriseMedia | null = null;

      if (!ratings || ratings.length === 0) {
        // Fallback to popular content
        if (includeMovies && (!includeTV || Math.random() > 0.5)) {
          const popular = await tmdbService.getPopularMovies();
          const randomIndex = Math.floor(Math.random() * popular.results.length);
          const movie = popular.results[randomIndex];
          const details = await tmdbService.getMovieDetails(movie.id);
          selectedMedia = { 
            ...movie, 
            title: movie.title,
            release_date: movie.release_date,
            runtime: details.runtime,
            genres: details.genres,
            media_type: 'movie' 
          };
        } else {
          const popular = await tmdbService.getPopularTVShows();
          const randomIndex = Math.floor(Math.random() * popular.results.length);
          const show = popular.results[randomIndex];
          const details = await tmdbService.getTVShowDetails(show.id);
          selectedMedia = { 
            id: show.id,
            title: show.name,
            poster_path: show.poster_path,
            backdrop_path: show.backdrop_path,
            overview: show.overview,
            vote_average: show.vote_average,
            release_date: show.first_air_date,
            runtime: details.episode_run_time?.[0],
            genres: details.genres,
            media_type: 'tv' 
          };
        }
      } else {
        // Get recommendations from a random highly-rated item
        const randomRating = ratings[Math.floor(Math.random() * ratings.length)];
        const isTV = randomRating.media_type === 'tv';

        if (isTV) {
          const recommendations = await tmdbService.getTVRecommendations(randomRating.movie_id);
          if (recommendations.results && recommendations.results.length > 0) {
            const randomRec = recommendations.results[Math.floor(Math.random() * recommendations.results.length)];
            const details = await tmdbService.getTVShowDetails(randomRec.id);
            selectedMedia = {
              id: randomRec.id,
              title: randomRec.name,
              poster_path: randomRec.poster_path,
              backdrop_path: randomRec.backdrop_path,
              overview: randomRec.overview,
              vote_average: randomRec.vote_average,
              release_date: randomRec.first_air_date,
              runtime: details.episode_run_time?.[0],
              genres: details.genres,
              media_type: 'tv'
            };
          }
        } else {
          const recommendations = await tmdbService.getMovieRecommendations(randomRating.movie_id);
          if (recommendations.results && recommendations.results.length > 0) {
            const randomRec = recommendations.results[Math.floor(Math.random() * recommendations.results.length)];
            const details = await tmdbService.getMovieDetails(randomRec.id);
            selectedMedia = {
              ...randomRec,
              title: randomRec.title,
              release_date: randomRec.release_date,
              runtime: details.runtime,
              genres: details.genres,
              media_type: 'movie'
            };
          }
        }
      }

      setMedia(selectedMedia);

      // Dramatic reveal animation delay
      setTimeout(() => {
        setIsRevealing(false);
      }, 1500);
    } catch (error) {
      console.error('Error getting surprise media:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWatch = () => {
    if (media) {
      const route = media.media_type === 'tv' ? `/tv/${media.id}` : `/movie/${media.id}`;
      navigate(route);
      setShowReveal(false);
    }
  };

  const handleShuffle = () => {
    setMedia(null);
    getSurpriseMedia();
  };

  if (variant === 'card') {
    return (
      <>
        <button
          onClick={getSurpriseMedia}
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
            ) : media ? (
              <div className="relative">
                {media.backdrop_path && (
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={getImageUrl(media.backdrop_path, 'w780')}
                      alt={media.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
                  </div>
                )}
                
                <div className="p-6 space-y-4">
                  <div className="flex gap-4">
                    {media.poster_path && (
                      <img
                        src={getImageUrl(media.poster_path, 'w185')}
                        alt={media.title}
                        className="w-24 h-36 rounded-lg object-cover shadow-lg -mt-16 relative z-10 border-2 border-card"
                      />
                    )}
                    <div className="flex-1 pt-2">
                      <h2 className="text-xl font-bold text-foreground">{media.title}</h2>
                      <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                          {media.vote_average.toFixed(1)}
                        </span>
                        {media.runtime && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {Math.floor(media.runtime / 60)}h {media.runtime % 60}m
                          </span>
                        )}
                        <span>{new Date(media.release_date).getFullYear()}</span>
                      </div>
                      {media.genres && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {media.genres.slice(0, 3).map(genre => (
                            <span key={genre.id} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                              {genre.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {media.overview}
                  </p>

                  <div className="flex gap-3">
                    <Button onClick={handleWatch} className="flex-1 gap-2">
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
          description="Get personalized random recommendations based on your taste. Perfect for when you can't decide what to watch!"
        />
      </>
    );
  }

  return (
    <>
      <Button
        onClick={getSurpriseMedia}
        variant="outline"
        className={cn("gap-2 border-amber-500/30 hover:border-amber-500/50 hover:bg-amber-500/10", className)}
      >
        <Shuffle className="h-4 w-4 text-amber-500" />
        Surprise Me
      </Button>

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
          ) : media ? (
            <div className="relative">
              {media.backdrop_path && (
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={getImageUrl(media.backdrop_path, 'w780')}
                    alt={media.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
                </div>
              )}
              
              <div className="p-6 space-y-4">
                <div className="flex gap-4">
                  {media.poster_path && (
                    <img
                      src={getImageUrl(media.poster_path, 'w185')}
                      alt={media.title}
                      className="w-24 h-36 rounded-lg object-cover shadow-lg -mt-16 relative z-10 border-2 border-card"
                    />
                  )}
                  <div className="flex-1 pt-2">
                    <h2 className="text-xl font-bold text-foreground">{media.title}</h2>
                    <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                        {media.vote_average.toFixed(1)}
                      </span>
                      {media.runtime && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {Math.floor(media.runtime / 60)}h {media.runtime % 60}m
                        </span>
                      )}
                      <span>{new Date(media.release_date).getFullYear()}</span>
                    </div>
                    {media.genres && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {media.genres.slice(0, 3).map(genre => (
                          <span key={genre.id} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                            {genre.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {media.overview}
                </p>

                <div className="flex gap-3">
                  <Button onClick={handleWatch} className="flex-1 gap-2">
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
        description="Get personalized random recommendations based on your taste."
      />
    </>
  );
};
