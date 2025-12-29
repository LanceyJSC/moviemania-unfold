import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ChevronDown, ChevronUp, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { tmdbService, Movie } from '@/lib/tmdb';
import { Skeleton } from './ui/skeleton';
import { Button } from './ui/button';
import { MovieCard } from './MovieCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

interface RecommendationSection {
  basedOn: {
    id: number;
    title: string;
    poster: string | null;
  };
  recommendations: Movie[];
}

export const BecauseYouLoved = () => {
  const { user } = useAuth();
  const { isProUser } = useSubscription();
  const navigate = useNavigate();
  const [sections, setSections] = useState<RecommendationSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [activeSection, setActiveSection] = useState<RecommendationSection | null>(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!user || !isProUser) {
        setLoading(false);
        return;
      }

      try {
        // Get user's top-rated movies (4-5 rating)
        const { data: topRated } = await supabase
          .from('user_ratings')
          .select('movie_id, movie_title, movie_poster, rating')
          .eq('user_id', user.id)
          .eq('media_type', 'movie')
          .gte('rating', 4)
          .order('rating', { ascending: false })
          .limit(3);

        if (!topRated || topRated.length === 0) {
          setLoading(false);
          return;
        }

        // Fetch SIMILAR movies (more accurate than recommendations)
        const recommendationSections: RecommendationSection[] = [];

        for (const movie of topRated) {
          try {
            const response = await tmdbService.getSimilarMovies(movie.movie_id);
            const similarMovies = response.results || [];
            if (similarMovies.length > 0) {
              recommendationSections.push({
                basedOn: {
                  id: movie.movie_id,
                  title: movie.movie_title,
                  poster: movie.movie_poster
                },
                recommendations: similarMovies.slice(0, 12)
              });
            }
          } catch (error) {
            console.error(`Error fetching similar movies for ${movie.movie_title}:`, error);
          }
        }

        setSections(recommendationSections);
      } catch (error) {
        console.error('Error fetching recommendations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [user, isProUser]);

  const handleSeeMore = (section: RecommendationSection) => {
    setActiveSection(section);
    setShowModal(true);
  };

  if (!isProUser || loading) {
    if (loading && isProUser) {
      return (
        <div className="mb-12 pt-4">
          <div className="bg-background rounded-t-2xl rounded-b-2xl -mx-4 px-4 py-8">
            <div className="text-center mb-8">
              <Skeleton className="h-10 w-64 mx-auto mb-4" />
              <Skeleton className="h-4 w-48 mx-auto" />
            </div>
            <div className="flex space-x-3 overflow-x-auto scrollbar-hide pb-4 2xl:hidden">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex-shrink-0 w-32 h-48 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
            <div className="hidden 2xl:grid grid-cols-6 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="aspect-[2/3] bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      );
    }
    return null;
  }

  if (sections.length === 0) return null;

  // Get the first section for display
  const primarySection = sections[0];
  const displayedMovies = isExpanded 
    ? primarySection.recommendations 
    : primarySection.recommendations.slice(0, 6);

  return (
    <>
      <div className="mb-12 pt-4">
        <div className="bg-background rounded-t-2xl rounded-b-2xl -mx-4 px-4 py-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Sparkles className="h-8 w-8 text-amber-500" />
              <h2 className="font-cinematic text-3xl text-foreground tracking-wide">
                BECAUSE YOU LOVED
              </h2>
              <Sparkles className="h-8 w-8 text-amber-500" />
            </div>
            <p className="text-muted-foreground mb-4">
              Similar to <span className="text-cinema-red font-medium">{primarySection.basedOn.title}</span>
            </p>
            <div className="w-16 h-0.5 bg-amber-500 mx-auto"></div>
          </div>

          {/* Mobile: Horizontal scroll */}
          <div className="flex space-x-3 overflow-x-auto scrollbar-hide pb-4 2xl:hidden">
            {displayedMovies.map((movie) => (
              <div key={movie.id} className="flex-shrink-0">
                <MovieCard movie={tmdbService.formatMovieForCard(movie)} />
              </div>
            ))}
          </div>

          {/* Desktop: Grid layout */}
          <div className="hidden 2xl:grid grid-cols-6 gap-4">
            {displayedMovies.map((movie) => (
              <div key={`desktop-${movie.id}`}>
                <MovieCard 
                  movie={tmdbService.formatMovieForCard(movie)} 
                  variant="grid"
                />
              </div>
            ))}
          </div>

          {/* See More Button */}
          {primarySection.recommendations.length > 6 && (
            <div className="flex justify-center mt-6">
              <Button
                variant="ghost"
                onClick={() => handleSeeMore(primarySection)}
                className="flex items-center gap-2 text-amber-500 hover:text-amber-400 hover:bg-amber-500/10"
              >
                {isExpanded ? 'Show Less' : 'See More'}
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* See More Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Sparkles className="h-5 w-5 text-amber-500" />
              Because you loved{' '}
              <span className="text-cinema-red">{activeSection?.basedOn.title}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 mt-4">
            {activeSection?.recommendations.map((movie) => (
              <button
                key={movie.id}
                onClick={() => {
                  setShowModal(false);
                  navigate(`/movie/${movie.id}`);
                }}
                className="group relative aspect-[2/3] rounded-lg overflow-hidden bg-card border border-border/50 hover:border-cinema-red/50 transition-all"
              >
                <img
                  src={tmdbService.getPosterUrl(movie.poster_path, 'w300')}
                  alt={movie.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  loading="lazy"
                />
                {movie.vote_average > 0 && (
                  <div className="absolute bottom-1 right-1 bg-black/70 text-xs px-1.5 py-0.5 rounded text-amber-400 font-medium">
                    {movie.vote_average.toFixed(1)}
                  </div>
                )}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
