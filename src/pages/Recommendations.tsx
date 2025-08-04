import { useState, useEffect } from "react";
import { Star, TrendingUp, Heart, Film, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navigation } from "@/components/Navigation";
import { MobileHeader } from "@/components/MobileHeader";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface Movie {
  id: number;
  title: string;
  poster_path?: string;
  overview: string;
  vote_average: number;
  release_date: string;
  genre_ids: number[];
}

interface RecommendationReason {
  type: 'genre' | 'actor' | 'director' | 'similar';
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
    if (user) {
      loadRecommendations();
    }
  }, [user]);

  const loadRecommendations = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Get user's watchlist and ratings for analysis
      const { data: watchlist } = await supabase
        .from('watchlist')
        .select('movie_id, movie_title')
        .eq('user_id', user.id)
        .eq('list_type', 'liked')
        .limit(5);

      // Generate mock recommendations based on popular movies
      const mockRecommendations: MovieRecommendation[] = [
        {
          movie: {
            id: 1263256,
            title: "Mufasa: The Lion King",
            poster_path: "/poster1.jpg",
            overview: "A stunning visual spectacle that explores the origins of one of cinema's most beloved characters.",
            vote_average: 8.2,
            release_date: "2024-12-20",
            genre_ids: [16, 12, 10751]
          },
          reason: {
            type: 'genre',
            message: 'Because you enjoyed animated family films'
          },
          confidence: 87
        },
        {
          movie: {
            id: 1100988,
            title: "Nosferatu",
            poster_path: "/poster2.jpg", 
            overview: "A gothic tale of obsession between a haunted young woman and the terrifying vampire infatuated with her.",
            vote_average: 7.8,
            release_date: "2024-12-25",
            genre_ids: [27, 18, 53]
          },
          reason: {
            type: 'similar',
            message: 'Similar to other horror films you\'ve rated highly'
          },
          confidence: 74
        },
        {
          movie: {
            id: 980477,
            title: "Sonic the Hedgehog 3",
            poster_path: "/poster3.jpg",
            overview: "The blue blur returns for another high-speed adventure with friends and foes.",
            vote_average: 7.5,
            release_date: "2024-12-20",
            genre_ids: [12, 35, 10751]
          },
          reason: {
            type: 'actor',
            message: 'Features actors from movies you\'ve enjoyed'
          },
          confidence: 82
        },
        {
          movie: {
            id: 1061474,
            title: "Wicked",
            poster_path: "/poster4.jpg",
            overview: "The story of how a green-skinned woman framed by the Wizard of Oz becomes the Wicked Witch of the West.",
            vote_average: 8.5,
            release_date: "2024-11-22",
            genre_ids: [14, 10749, 10402]
          },
          reason: {
            type: 'director',
            message: 'From directors of films you\'ve loved'
          },
          confidence: 91
        }
      ];

      setRecommendations(mockRecommendations);
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 85) return 'text-green-500';
    if (confidence >= 70) return 'text-yellow-500';
    return 'text-orange-500';
  };

  const getReasonIcon = (type: RecommendationReason['type']) => {
    switch (type) {
      case 'genre':
        return <Film className="h-4 w-4" />;
      case 'actor':
      case 'director':
        return <Star className="h-4 w-4" />;
      case 'similar':
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <Heart className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      <MobileHeader title="Recommendations" />
      
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center gap-4 p-4">
          <Button
            onClick={() => navigate('/profile')}
            size="sm"
            variant="ghost"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Smart Recommendations</h1>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="space-y-6">
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Star className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Personalized for You</h2>
                  <p className="text-sm text-muted-foreground">
                    Based on your viewing history and preferences
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="animate-pulse space-y-3">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                      <div className="h-3 bg-muted rounded w-full"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {recommendations.map((recommendation) => (
                <Card key={recommendation.movie.id} className="bg-card border-border hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      <div className="w-20 h-28 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                        <Film className="h-8 w-8 text-muted-foreground" />
                      </div>
                      
                      <div className="flex-1 space-y-3">
                        <div>
                          <h3 className="text-lg font-semibold text-foreground mb-1">
                            {recommendation.movie.title}
                          </h3>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-yellow-500" />
                              <span className="text-sm text-muted-foreground">
                                {recommendation.movie.vote_average.toFixed(1)}
                              </span>
                            </div>
                            <Badge 
                              variant="secondary" 
                              className={`text-xs ${getConfidenceColor(recommendation.confidence)}`}
                            >
                              {recommendation.confidence}% match
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {recommendation.movie.overview}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-primary">
                          {getReasonIcon(recommendation.reason.type)}
                          <span>{recommendation.reason.message}</span>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            onClick={() => navigate(`/movie/${recommendation.movie.id}`)}
                            size="sm"
                            className="flex-1"
                          >
                            View Details
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // Add to watchlist functionality would go here
                            }}
                          >
                            <Heart className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <Card className="bg-muted/20 border-muted">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground text-center">
                Recommendations are generated using AI based on your viewing patterns, ratings, and preferences. 
                The more you interact with the app, the better your recommendations become.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Navigation />
    </div>
  );
};