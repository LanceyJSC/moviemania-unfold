import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { fetchMovieRecommendations, getImageUrl } from '@/lib/tmdb';
import { ProBadge } from './ProBadge';
import { Skeleton } from './ui/skeleton';
import { Button } from './ui/button';

interface RecommendationSection {
  basedOn: {
    id: number;
    title: string;
    poster: string | null;
  };
  recommendations: Array<{
    id: number;
    title: string;
    poster_path: string | null;
    vote_average: number;
  }>;
}

export const BecauseYouLoved = () => {
  const { user } = useAuth();
  const { isProUser } = useSubscription();
  const navigate = useNavigate();
  const [sections, setSections] = useState<RecommendationSection[]>([]);
  const [loading, setLoading] = useState(true);

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

        // Fetch recommendations for each top-rated movie
        const recommendationSections: RecommendationSection[] = [];

        for (const movie of topRated) {
          const recommendations = await fetchMovieRecommendations(movie.movie_id);
          if (recommendations && recommendations.length > 0) {
            recommendationSections.push({
              basedOn: {
                id: movie.movie_id,
                title: movie.movie_title,
                poster: movie.movie_poster
              },
              recommendations: recommendations.slice(0, 8)
            });
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

  if (!isProUser || loading) {
    if (loading && isProUser) {
      return (
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="flex gap-3 overflow-hidden 2xl:hidden">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="w-32 h-48 flex-shrink-0 rounded-lg" />
            ))}
          </div>
          <div className="hidden 2xl:grid grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="aspect-[2/3] rounded-lg" />
            ))}
          </div>
        </div>
      );
    }
    return null;
  }

  if (sections.length === 0) return null;

  return (
    <div className="space-y-8">
      {sections.map((section, index) => (
        <div key={section.basedOn.id} className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            <h3 className="text-lg font-semibold text-foreground">
              Because you loved{' '}
              <span className="text-cinema-red">{section.basedOn.title}</span>
            </h3>
            {index === 0 && <ProBadge size="sm" />}
          </div>

          {/* Mobile: Horizontal scroll */}
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide 2xl:hidden">
            {section.recommendations.map((movie) => (
              <button
                key={movie.id}
                onClick={() => navigate(`/movie/${movie.id}`)}
                className="flex-shrink-0 group relative"
              >
                <div className="w-32 h-48 rounded-lg overflow-hidden bg-card border border-border/50 group-hover:border-cinema-red/50 transition-all">
                  {movie.poster_path ? (
                    <img
                      src={getImageUrl(movie.poster_path, 'w185')}
                      alt={movie.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs text-center p-2">
                      {movie.title}
                    </div>
                  )}
                </div>
                <div className="absolute bottom-1 right-1 bg-black/70 text-xs px-1.5 py-0.5 rounded text-amber-400 font-medium">
                  {movie.vote_average.toFixed(1)}
                </div>
              </button>
            ))}
            <button
              onClick={() => navigate('/recommendations')}
              className="flex-shrink-0 w-32 h-48 rounded-lg border border-dashed border-border/50 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-cinema-red/50 hover:text-foreground transition-colors"
            >
              <ChevronRight className="h-6 w-6" />
              <span className="text-xs">See More</span>
            </button>
          </div>
          {/* Desktop: Grid layout */}
          <div className="hidden 2xl:grid grid-cols-6 gap-4">
            {section.recommendations.map((movie) => (
              <button
                key={`desktop-${movie.id}`}
                onClick={() => navigate(`/movie/${movie.id}`)}
                className="group relative aspect-[2/3]"
              >
                <div className="w-full h-full rounded-lg overflow-hidden bg-card border border-border/50 group-hover:border-cinema-red/50 transition-all">
                  {movie.poster_path ? (
                    <img
                      src={getImageUrl(movie.poster_path, 'w342')}
                      alt={movie.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm text-center p-4">
                      {movie.title}
                    </div>
                  )}
                </div>
                <div className="absolute bottom-2 right-2 bg-black/70 text-sm px-2 py-1 rounded text-amber-400 font-medium">
                  {movie.vote_average.toFixed(1)}
                </div>
              </button>
            ))}
          </div>
          {/* Desktop: See More button */}
          <div className="hidden 2xl:flex justify-center mt-6">
            <Button
              variant="ghost"
              onClick={() => navigate('/recommendations')}
              className="flex items-center gap-2 text-cinema-red hover:text-cinema-red/80 hover:bg-cinema-red/10"
            >
              See More Recommendations
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};
