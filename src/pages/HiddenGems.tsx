import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gem, Sparkles, Lock, Star, Calendar, Film } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Navigation } from '@/components/Navigation';
import { DesktopHeader } from '@/components/DesktopHeader';
import { MobileHeader } from '@/components/MobileHeader';
import { ProBadge } from '@/components/ProBadge';
import { ProUpgradeModal } from '@/components/ProUpgradeModal';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { tmdbService, getImageUrl, Movie } from '@/lib/tmdb';

const HiddenGems = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isProUser } = useSubscription();
  const [showProModal, setShowProModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [gems, setGems] = useState<Movie[]>([]);
  const [userGenres, setUserGenres] = useState<number[]>([]);

  useEffect(() => {
    const fetchHiddenGems = async () => {
      if (!user || !isProUser) {
        setLoading(false);
        return;
      }

      try {
        // Get user's highly rated genres
        const { data: ratings } = await supabase
          .from('user_ratings')
          .select('movie_id')
          .eq('user_id', user.id)
          .eq('media_type', 'movie')
          .gte('rating', 4);

        // Fetch genre info for rated movies
        const genreCounts: Record<number, number> = {};
        if (ratings && ratings.length > 0) {
          for (const rating of ratings.slice(0, 20)) {
            try {
              const movie = await tmdbService.getMovieDetails(rating.movie_id);
              movie.genres?.forEach(g => {
                genreCounts[g.id] = (genreCounts[g.id] || 0) + 1;
              });
            } catch {}
          }
        }

        // Get top 3 genres
        const topGenres = Object.entries(genreCounts)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 3)
          .map(([id]) => parseInt(id));
        
        setUserGenres(topGenres);

        // Fetch hidden gems: high rating (7.5+), low vote count (<5000)
        const genreParam = topGenres.length > 0 ? topGenres.join(',') : undefined;
        const response = await tmdbService.discoverMovies({
          genre: genreParam,
          voteAverageFrom: 7.5,
          sortBy: 'vote_average.desc',
          page: 1
        });

        // Filter for low vote count (hidden gems)
        const hiddenGems = response.results
          .filter(m => m.vote_count < 5000 && m.vote_count > 50)
          .slice(0, 20);

        setGems(hiddenGems);
      } catch (error) {
        console.error('Error fetching hidden gems:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHiddenGems();
  }, [user, isProUser]);

  if (!isProUser) {
    return (
      <div className="min-h-screen bg-background pb-24 2xl:pb-12">
        <DesktopHeader />
        <MobileHeader title="Hidden Gems" showBack />
        
        <div className="px-4 md:px-6 pt-4 max-w-4xl mx-auto">
          <Card className="border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-pink-500/5">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                <Lock className="h-8 w-8 text-purple-500" />
              </div>
              <h2 className="text-xl font-bold mb-2">Hidden Gems is Pro-Only</h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Discover critically acclaimed movies that flew under the radar. Find your next favorite film that most people haven't seen yet.
              </p>
              <Button 
                onClick={() => setShowProModal(true)}
                className="gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                <Sparkles className="h-4 w-4" />
                Upgrade to Pro
              </Button>
            </CardContent>
          </Card>
        </div>

        <ProUpgradeModal
          isOpen={showProModal}
          onClose={() => setShowProModal(false)}
          feature="Hidden Gems"
          description="Discover highly-rated movies with low popularity - perfect for finding unique films others haven't seen."
        />
        <Navigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 2xl:pb-12">
      <DesktopHeader />
      <MobileHeader title="Hidden Gems" showBack />
      
      <div className="px-4 md:px-6 pt-4 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20">
            <Gem className="h-6 w-6 text-purple-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">Hidden Gems</h1>
              <ProBadge size="sm" />
            </div>
            <p className="text-sm text-muted-foreground">
              Critically acclaimed films that flew under the radar
            </p>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[...Array(10)].map((_, i) => (
              <Skeleton key={i} className="aspect-[2/3] rounded-lg" />
            ))}
          </div>
        ) : gems.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Gem className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Rate more movies to get personalized hidden gem recommendations!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {gems.map((movie) => (
              <button
                key={movie.id}
                onClick={() => navigate(`/movie/${movie.id}`)}
                className="group relative text-left"
              >
                <div className="aspect-[2/3] rounded-lg overflow-hidden bg-card border border-border/50 group-hover:border-purple-500/50 transition-all">
                  {movie.poster_path ? (
                    <img
                      src={getImageUrl(movie.poster_path, 'w342')}
                      alt={movie.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                      <Film className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  
                  {/* Hidden Gem badge */}
                  <div className="absolute top-2 left-2 px-2 py-1 rounded-full bg-purple-500/90 text-white text-xs font-medium flex items-center gap-1">
                    <Gem className="h-3 w-3" />
                    Gem
                  </div>

                  {/* Rating */}
                  <div className="absolute bottom-2 right-2 px-2 py-1 rounded-full bg-black/70 text-amber-400 text-xs font-medium flex items-center gap-1">
                    <Star className="h-3 w-3 fill-amber-400" />
                    {movie.vote_average.toFixed(1)}
                  </div>
                </div>
                
                <div className="mt-2">
                  <h3 className="font-medium text-sm line-clamp-1 group-hover:text-purple-400 transition-colors">
                    {movie.title}
                  </h3>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {new Date(movie.release_date).getFullYear()}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <Navigation />
    </div>
  );
};

export default HiddenGems;
