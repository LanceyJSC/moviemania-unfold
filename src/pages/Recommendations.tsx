import { useState, useEffect } from "react";
import { Star, TrendingUp, Heart, Film, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navigation } from "@/components/Navigation";
import { MobileHeader } from "@/components/MobileHeader";
import { DesktopHeader } from "@/components/DesktopHeader";
import { SurpriseMe } from "@/components/SurpriseMe";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { tmdbService, Movie } from "@/lib/tmdb";

interface RecommendationReason {
  type: 'liked' | 'rated' | 'watched' | 'trending';
  basedOn?: string;
  message: string;
}

interface MovieRecommendation {
  movie: Movie;
  reason: RecommendationReason;
  confidence: number;
}

export const Recommendations = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<MovieRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRecommendations();
  }, [user]);

  const loadRecommendations = async () => {
    setIsLoading(true);
    try {
      let allRecommendations: MovieRecommendation[] = [];

      if (user) {
        // Get user's highly rated movies
        const { data: ratings } = await supabase
          .from('user_ratings')
          .select('movie_id, movie_title, rating, media_type')
          .eq('user_id', user.id)
          .eq('media_type', 'movie')
          .gte('rating', 7)
          .order('rating', { ascending: false })
          .limit(5);

        // Get user's liked movies
        const { data: liked } = await supabase
          .from('watchlist')
          .select('movie_id, movie_title')
          .eq('user_id', user.id)
          .eq('list_type', 'liked')
          .eq('media_type', 'movie')
          .limit(3);

        // Fetch recommendations based on highly rated movies
        if (ratings && ratings.length > 0) {
          for (const rating of ratings.slice(0, 3)) {
            try {
              const response = await tmdbService.getMovieRecommendations(rating.movie_id);
              const movieRecs = response.results.slice(0, 4).map(movie => ({
                movie,
                reason: {
                  type: 'rated' as const,
                  basedOn: rating.movie_title,
                  message: `Because you gave "${rating.movie_title}" ${rating.rating} flames`
                },
                confidence: Math.min(95, 70 + (rating.rating || 0) * 2)
              }));
              allRecommendations.push(...movieRecs);
            } catch (error) {
              console.error('Error fetching recommendations for movie:', rating.movie_id);
            }
          }
        }

        // Fetch recommendations based on liked movies
        if (liked && liked.length > 0) {
          for (const item of liked.slice(0, 2)) {
            try {
              const response = await tmdbService.getSimilarMovies(item.movie_id);
              const similarRecs = response.results.slice(0, 3).map(movie => ({
                movie,
                reason: {
                  type: 'liked' as const,
                  basedOn: item.movie_title,
                  message: `Similar to "${item.movie_title}" which you liked`
                },
                confidence: Math.floor(Math.random() * 15) + 75
              }));
              allRecommendations.push(...similarRecs);
            } catch (error) {
              console.error('Error fetching similar movies:', item.movie_id);
            }
          }
        }
      }

      // If no personalized recommendations, show trending
      if (allRecommendations.length < 5) {
        const trending = await tmdbService.getTrendingMovies('week');
        const trendingRecs = trending.results.slice(0, 10 - allRecommendations.length).map(movie => ({
          movie,
          reason: {
            type: 'trending' as const,
            message: 'Trending this week'
          },
          confidence: Math.floor(Math.random() * 20) + 60
        }));
        allRecommendations.push(...trendingRecs);
      }

      // Deduplicate by movie ID and shuffle
      const uniqueRecs = Array.from(
        new Map(allRecommendations.map(rec => [rec.movie.id, rec])).values()
      );
      
      // Sort by confidence
      uniqueRecs.sort((a, b) => b.confidence - a.confidence);
      
      setRecommendations(uniqueRecs.slice(0, 12));
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 85) return 'text-green-500';
    if (confidence >= 70) return 'text-cinema-gold';
    return 'text-orange-500';
  };

  const getReasonIcon = (type: RecommendationReason['type']) => {
    switch (type) {
      case 'rated':
        return <Star className="h-4 w-4" />;
      case 'liked':
        return <Heart className="h-4 w-4" />;
      case 'trending':
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <Film className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-32 2xl:pb-12">
      <DesktopHeader />
      <MobileHeader title="For You" />
      
      <div className="sticky top-0 2xl:top-16 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center gap-4 p-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold text-foreground">Recommended For You</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Surprise Me - Pro Feature */}
        <SurpriseMe variant="card" className="mb-6" />

        {!user && (
          <Card className="bg-card border-border mb-6">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground text-center">
                <Link to="/auth" className="text-cinema-gold hover:underline">Sign in</Link> to get personalized recommendations based on your ratings and favorites.
              </p>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-cinema-red" />
          </div>
        ) : (
          <div className="space-y-4">
            {recommendations.map((rec) => (
              <Link key={rec.movie.id} to={`/movie/${rec.movie.id}`}>
                <Card className="bg-card border-border hover:bg-card/80 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <img
                        src={tmdbService.getPosterUrl(rec.movie.poster_path, 'w300')}
                        alt={rec.movie.title}
                        className="w-20 h-28 rounded-lg object-cover flex-shrink-0"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-semibold text-foreground line-clamp-1">
                            {rec.movie.title}
                          </h3>
                          <Badge 
                            variant="secondary" 
                            className={`text-xs flex-shrink-0 ${getConfidenceColor(rec.confidence)}`}
                          >
                            {rec.confidence}%
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex items-center gap-1">
                            <Star className="h-3.5 w-3.5 text-cinema-gold fill-cinema-gold" />
                            <span className="text-sm text-muted-foreground">
                              {rec.movie.vote_average.toFixed(1)}
                            </span>
                          </div>
                          {rec.movie.release_date && (
                            <span className="text-sm text-muted-foreground">
                              {new Date(rec.movie.release_date).getFullYear()}
                            </span>
                          )}
                        </div>
                        
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {rec.movie.overview}
                        </p>

                        <div className="flex items-center gap-2 text-xs text-primary">
                          {getReasonIcon(rec.reason.type)}
                          <span className="line-clamp-1">{rec.reason.message}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {!isLoading && recommendations.length === 0 && (
          <Card className="bg-muted/20 border-muted">
            <CardContent className="p-6 text-center">
              <Film className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Start rating movies to get personalized recommendations!
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <Navigation />
    </div>
  );
};
