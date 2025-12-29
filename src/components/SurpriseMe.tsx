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

export interface SurpriseFilters {
  genres: number[];
  yearRange: [number, number];
  ratingRange: [number, number];
  runtimeRange: [number, number];
  mood: string;
  tone: string;
  pacing: string;
}

interface SurpriseMeProps {
  variant?: 'button' | 'card';
  className?: string;
  mediaType?: 'all' | 'movies' | 'tv';
  filters?: SurpriseFilters;
}

const DEFAULT_FILTERS: SurpriseFilters = {
  genres: [],
  yearRange: [1900, new Date().getFullYear()],
  ratingRange: [0, 10],
  runtimeRange: [0, 300],
  mood: 'any',
  tone: 'any',
  pacing: 'any'
};

export const SurpriseMe = ({ variant = 'button', className, mediaType = 'all', filters = DEFAULT_FILTERS }: SurpriseMeProps) => {
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
      // Build discover params from filters
      const discoverParams: any = {
        sortBy: 'popularity.desc',
        page: Math.floor(Math.random() * 5) + 1 // Random page 1-5 for variety
      };

      // Build genre list from explicit selection + mood/tone mappings
      let genreIds: number[] = [...(filters.genres || [])];
      
      // Map mood to genre IDs
      const moodGenreMap: { [key: string]: number[] } = {
        'feel-good': [35, 10751],
        'intense': [28, 53],
        'thought-provoking': [18, 99],
        'emotional': [18, 10749],
        'uplifting': [35, 10751, 12],
        'dark': [27, 53, 80],
        'nostalgic': [10751, 14],
        'inspiring': [18, 36],
      };
      
      // Map tone to genre IDs
      const toneGenreMap: { [key: string]: number[] } = {
        'lighthearted': [35, 10751],
        'serious': [18, 36],
        'satirical': [35],
        'suspenseful': [53, 9648],
        'romantic': [10749],
        'gritty': [80, 53],
        'whimsical': [14, 16],
      };
      
      if (filters.mood && filters.mood !== 'any') {
        const moodGenres = moodGenreMap[filters.mood];
        if (moodGenres) genreIds = [...genreIds, ...moodGenres];
      }
      
      if (filters.tone && filters.tone !== 'any') {
        const toneGenres = toneGenreMap[filters.tone];
        if (toneGenres) genreIds = [...genreIds, ...toneGenres];
      }
      
      if (genreIds.length > 0) {
        discoverParams.genre = [...new Set(genreIds)].join(',');
      }
      
      // Apply year range
      if (filters.yearRange[0] > 1900 || filters.yearRange[1] < new Date().getFullYear()) {
        discoverParams.yearFrom = filters.yearRange[0];
        discoverParams.yearTo = filters.yearRange[1];
      }
      
      // Apply rating range
      if (filters.ratingRange[0] > 0 || filters.ratingRange[1] < 10) {
        discoverParams.voteAverageFrom = filters.ratingRange[0];
        discoverParams.voteAverageTo = filters.ratingRange[1];
      }
      
      // Apply runtime (or pacing override)
      if (filters.pacing && filters.pacing !== 'any') {
        const pacingRanges: { [key: string]: [number, number] } = {
          'slow': [150, 300],
          'moderate': [90, 150],
          'fast': [60, 100]
        };
        const pacingRange = pacingRanges[filters.pacing];
        if (pacingRange) {
          discoverParams.runtimeFrom = pacingRange[0];
          discoverParams.runtimeTo = pacingRange[1];
        }
      } else if (filters.runtimeRange[0] > 0 || filters.runtimeRange[1] < 300) {
        discoverParams.runtimeFrom = filters.runtimeRange[0];
        discoverParams.runtimeTo = filters.runtimeRange[1];
      }

      let selectedMedia: SurpriseMedia | null = null;
      
      // Fetch based on media type
      const shouldFetchMovies = mediaType === 'movies' || (mediaType === 'all' && Math.random() > 0.5);
      
      if (shouldFetchMovies) {
        const results = await tmdbService.discoverMovies(discoverParams);
        if (results.results && results.results.length > 0) {
          const randomIndex = Math.floor(Math.random() * results.results.length);
          const movie = results.results[randomIndex];
          const details = await tmdbService.getMovieDetails(movie.id);
          selectedMedia = {
            ...movie,
            title: movie.title,
            release_date: movie.release_date,
            runtime: details.runtime,
            genres: details.genres,
            media_type: 'movie'
          };
        }
      } else {
        const results = await tmdbService.discoverTV(discoverParams);
        if (results.results && results.results.length > 0) {
          const randomIndex = Math.floor(Math.random() * results.results.length);
          const show = results.results[randomIndex];
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
      }
      
      // Fallback to popular if no results from filters
      if (!selectedMedia) {
        if (shouldFetchMovies) {
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
                  <div className="relative aspect-video overflow-hidden">
                    <img
                      src={getImageUrl(media.backdrop_path, 'w780')}
                      alt={media.title}
                      className="w-full h-full object-cover object-top"
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
                <div className="relative aspect-video overflow-hidden">
                  <img
                    src={getImageUrl(media.backdrop_path, 'w780')}
                    alt={media.title}
                    className="w-full h-full object-cover object-top"
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
