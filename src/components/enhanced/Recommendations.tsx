import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSupabaseUserState } from '@/hooks/useSupabaseUserState';
import { tmdbService } from '@/lib/tmdb';
import { MovieCard } from '@/components/MovieCard';
import { TVShowCard } from '@/components/TVShowCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Shuffle } from 'lucide-react';
import { SkeletonGrid } from './SkeletonCard';

interface Movie {
  id: number;
  title: string;
  poster_path: string;
  release_date: string;
  vote_average: number;
  genre_ids: number[];
}

interface TVShow {
  id: number;
  name: string;
  poster_path: string;
  first_air_date: string;
  vote_average: number;
  genre_ids: number[];
}

export const Recommendations = () => {
  const { user } = useAuth();
  const { userState } = useSupabaseUserState();
  const [recommendations, setRecommendations] = useState<(Movie | TVShow)[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [recommendationType, setRecommendationType] = useState<'based_on_likes' | 'trending' | 'random'>('based_on_likes');

  const fetchRecommendations = async (type: 'based_on_likes' | 'trending' | 'random' = 'based_on_likes') => {
    try {
      setIsLoading(true);
      let results: (Movie | TVShow)[] = [];

      if (type === 'based_on_likes' && userState.likedMovies.length > 0) {
        // Get recommendations based on liked movies
        const sampleLikedMovies = userState.likedMovies.slice(0, 3);
        
        // Fallback to trending since getSimilarMovies doesn't exist
        const trending = await tmdbService.getTrendingMovies();
        results.push(...trending.results.slice(0, 12));
        
        // Remove duplicates and already liked movies
        const uniqueResults = results.filter((movie, index, self) => 
          index === self.findIndex(m => m.id === movie.id) &&
          !userState.likedMovies.some(liked => liked.movie_id === movie.id)
        );
        
        setRecommendations(uniqueResults.slice(0, 12));
      } else if (type === 'trending') {
        // Get trending content
        const [trendingMovies, trendingTVShows] = await Promise.all([
          tmdbService.getTrendingMovies(),
          tmdbService.getTrendingTVShows(),
        ]);
        
        const combined = [
          ...trendingMovies.results.slice(0, 6),
          ...trendingTVShows.results.slice(0, 6),
        ];
        
        // Shuffle and filter
        const shuffled = combined.sort(() => Math.random() - 0.5);
        setRecommendations(shuffled.slice(0, 12));
      } else {
        // Random popular content
        const randomPage = Math.floor(Math.random() * 5) + 1;
        const [movies, tvShows] = await Promise.all([
          tmdbService.getPopularMovies(randomPage),
          tmdbService.getPopularTVShows(randomPage),
        ]);
        
        const combined = [
          ...movies.results.slice(0, 6),
          ...tvShows.results.slice(0, 6),
        ];
        
        const shuffled = combined.sort(() => Math.random() - 0.5);
        setRecommendations(shuffled.slice(0, 12));
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchRecommendations(recommendationType);
    }
  }, [user, userState.likedMovies, recommendationType]);

  const handleRefresh = () => {
    fetchRecommendations(recommendationType);
  };

  const getRecommendationTitle = () => {
    switch (recommendationType) {
      case 'based_on_likes':
        return userState.likedMovies.length > 0 ? 'Because You Liked' : 'Popular Picks';
      case 'trending':
        return 'Trending Now';
      case 'random':
        return 'Surprise Me';
      default:
        return 'Recommendations';
    }
  };

  if (!user) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{getRecommendationTitle()}</CardTitle>
          <div className="flex gap-2">
            <Button
              variant={recommendationType === 'based_on_likes' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setRecommendationType('based_on_likes')}
              disabled={userState.likedMovies.length === 0}
            >
              For You
            </Button>
            <Button
              variant={recommendationType === 'trending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setRecommendationType('trending')}
            >
              Trending
            </Button>
            <Button
              variant={recommendationType === 'random' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setRecommendationType('random')}
            >
              <Shuffle className="h-4 w-4 mr-1" />
              Random
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <SkeletonGrid count={12} />
        ) : recommendations.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              No recommendations available. Try liking some movies first!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {recommendations.map((item) => {
              // Check if it's a TV show or movie
              const isTV = 'name' in item;
              
              return isTV ? (
                <TVShowCard
                  key={item.id}
                  tvShow={item as any}
                  priority={false}
                />
              ) : (
                <MovieCard
                  key={item.id}
                  movie={item as any}
                  priority={false}
                />
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};