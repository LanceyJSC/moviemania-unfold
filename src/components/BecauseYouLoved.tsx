import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ChevronDown, ChevronUp, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { tmdbService, Movie, TVShow } from '@/lib/tmdb';
import { Skeleton } from './ui/skeleton';
import { Button } from './ui/button';
import { MovieCard } from './MovieCard';
import { TVShowCard } from './TVShowCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

type MediaItem = (Movie | TVShow) & { mediaType: 'movie' | 'tv' };

interface RecommendationSection {
  basedOn: {
    id: number;
    title: string;
    poster: string | null;
    mediaType: 'movie' | 'tv';
  };
  recommendations: MediaItem[];
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
        // Get user's top-rated movies (rating >= 4 out of 5, so >= 8 out of 10 scale or 4+ on 5 scale)
        const { data: topRatedMovies } = await supabase
          .from('user_ratings')
          .select('movie_id, movie_title, movie_poster, rating, media_type')
          .eq('user_id', user.id)
          .eq('media_type', 'movie')
          .gte('rating', 4)
          .order('rating', { ascending: false })
          .limit(2);

        // Get user's top-rated TV shows
        const { data: topRatedTV } = await supabase
          .from('user_ratings')
          .select('movie_id, movie_title, movie_poster, rating, media_type')
          .eq('user_id', user.id)
          .eq('media_type', 'tv')
          .gte('rating', 4)
          .order('rating', { ascending: false })
          .limit(2);

        const allTopRated = [
          ...(topRatedMovies || []).map(m => ({ ...m, mediaType: 'movie' as const })),
          ...(topRatedTV || []).map(t => ({ ...t, mediaType: 'tv' as const }))
        ];

        // Sort by rating and take top 3
        allTopRated.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        const topThree = allTopRated.slice(0, 3);

        if (topThree.length === 0) {
          setLoading(false);
          return;
        }

        // Fetch RECOMMENDATIONS (better quality than 'similar') for each top-rated item
        const recommendationSections: RecommendationSection[] = [];

        for (const item of topThree) {
          try {
            let recommendations: MediaItem[] = [];
            
            if (item.mediaType === 'movie') {
              const response = await tmdbService.getMovieRecommendations(item.movie_id);
              recommendations = (response.results || [])
                .filter(m => m.poster_path)
                .slice(0, 12)
                .map(m => ({ ...m, mediaType: 'movie' as const }));
            } else {
              const response = await tmdbService.getTVRecommendations(item.movie_id);
              recommendations = (response.results || [])
                .filter(t => t.poster_path)
                .slice(0, 12)
                .map(t => ({ ...t, mediaType: 'tv' as const }));
            }

            if (recommendations.length > 0) {
              recommendationSections.push({
                basedOn: {
                  id: item.movie_id,
                  title: item.movie_title,
                  poster: item.movie_poster,
                  mediaType: item.mediaType
                },
                recommendations
              });
            }
          } catch (error) {
            console.error(`Error fetching recommendations for ${item.movie_title}:`, error);
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

  const getItemTitle = (item: MediaItem) => {
    return 'title' in item ? item.title : item.name;
  };

  const navigateToDetail = (item: MediaItem) => {
    if (item.mediaType === 'movie') {
      navigate(`/movie/${item.id}`);
    } else {
      navigate(`/tv/${item.id}`);
    }
  };

  if (!isProUser || loading) {
    if (loading && isProUser) {
      return (
        <div className="mb-6 sm:mb-12">
          <div className="bg-background rounded-2xl py-4 sm:py-8">
            <div className="text-center mb-4 sm:mb-8">
              <Skeleton className="h-7 sm:h-10 w-48 sm:w-64 mx-auto mb-2 sm:mb-4" />
              <Skeleton className="h-3 sm:h-4 w-36 sm:w-48 mx-auto" />
            </div>
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
              {[...Array(8)].map((_, i) => (
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
  // Show 6 on mobile (2 rows of 3), 8 on larger screens
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const initialCount = isMobile ? 6 : 8;
  const displayedItems = isExpanded 
    ? primarySection.recommendations 
    : primarySection.recommendations.slice(0, initialCount);

  const mediaTypeLabel = primarySection.basedOn.mediaType === 'movie' ? 'movie' : 'show';

  return (
    <>
      <div className="mb-6 sm:mb-12">
        <div className="bg-background rounded-2xl py-4 sm:py-8">
          <div className="text-center mb-4 sm:mb-8">
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2 sm:mb-4">
              <Sparkles className="h-5 w-5 sm:h-8 sm:w-8 text-amber-500" />
              <h2 className="font-cinematic text-lg sm:text-3xl text-foreground tracking-wide">
                BECAUSE YOU LOVED
              </h2>
              <Sparkles className="h-5 w-5 sm:h-8 sm:w-8 text-amber-500" />
            </div>
            <p className="text-muted-foreground text-xs sm:text-base mb-2 sm:mb-4">
              Based on the {mediaTypeLabel}{' '}
              <span className="text-cinema-red font-medium">{primarySection.basedOn.title}</span>
            </p>
            <div className="w-12 sm:w-16 h-0.5 bg-amber-500 mx-auto"></div>
          </div>

          <div className="grid grid-cols-3 gap-1.5 sm:gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
            {displayedItems.map((item) => (
              <div key={`${item.mediaType}-${item.id}`}>
                {item.mediaType === 'movie' ? (
                  <MovieCard 
                    movie={tmdbService.formatMovieForCard(item as Movie)} 
                    variant="grid"
                  />
                ) : (
                  <TVShowCard 
                    tvShow={tmdbService.formatTVShowForCard(item as TVShow)} 
                    variant="grid"
                  />
                )}
              </div>
            ))}
          </div>

          {/* See More Button */}
          {primarySection.recommendations.length > initialCount && (
            <div className="flex justify-center mt-6">
              <Button
                variant="ghost"
                onClick={() => handleSeeMore(primarySection)}
                className="flex items-center gap-2 text-amber-500 hover:text-amber-400 hover:bg-amber-500/10"
              >
                See More
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* See More Modal - List view with details */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Sparkles className="h-5 w-5 text-amber-500" />
              Because you loved{' '}
              <span className="text-cinema-red">{activeSection?.basedOn.title}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            {activeSection?.recommendations.map((item) => (
              <button
                key={`modal-${item.mediaType}-${item.id}`}
                onClick={() => {
                  setShowModal(false);
                  navigateToDetail(item);
                }}
                className="w-full flex items-center gap-4 p-3 rounded-lg bg-card/50 border border-border/50 hover:border-cinema-red/50 hover:bg-card transition-all text-left"
              >
                <img
                  src={tmdbService.getPosterUrl(item.poster_path, 'w300')}
                  alt={getItemTitle(item)}
                  className="w-16 h-24 object-cover rounded-md flex-shrink-0"
                  loading="lazy"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground truncate">{getItemTitle(item)}</h3>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                      {item.mediaType === 'movie' ? 'Movie' : 'TV'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 text-cinema-gold fill-current" />
                      <span className="text-sm text-foreground">{item.vote_average.toFixed(1)}</span>
                    </div>
                    {('release_date' in item && item.release_date) && (
                      <span className="text-sm text-muted-foreground">
                        {new Date(item.release_date).getFullYear()}
                      </span>
                    )}
                    {('first_air_date' in item && item.first_air_date) && (
                      <span className="text-sm text-muted-foreground">
                        {new Date(item.first_air_date).getFullYear()}
                      </span>
                    )}
                  </div>
                  {item.overview && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                      {item.overview}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
