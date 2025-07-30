import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Star, Heart, Eye, ArrowLeft } from 'lucide-react';
import { useSocialFeatures, Friend, WatchlistComparison, RatingComparison } from '@/hooks/useSocialFeatures';
import { useToast } from '@/hooks/use-toast';

interface FriendComparisonProps {
  friend: Friend;
  onBack: () => void;
}

export const FriendComparison = ({ friend, onBack }: FriendComparisonProps) => {
  const [watchlistComparison, setWatchlistComparison] = useState<WatchlistComparison[]>([]);
  const [ratingComparison, setRatingComparison] = useState<RatingComparison[]>([]);
  const [loading, setLoading] = useState(true);
  const { getFriendWatchlistComparison, getFriendRatingComparison } = useSocialFeatures();
  const { toast } = useToast();

  useEffect(() => {
    const loadComparisons = async () => {
      try {
        setLoading(true);
        const [watchlist, ratings] = await Promise.all([
          getFriendWatchlistComparison(friend.friend_id),
          getFriendRatingComparison(friend.friend_id)
        ]);
        
        setWatchlistComparison(watchlist);
        setRatingComparison(ratings);
      } catch (error) {
        console.error('Error loading comparisons:', error);
        toast({
          title: "Error",
          description: "Failed to load friend comparison data.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadComparisons();
  }, [friend.friend_id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  const sharedWatchlist = watchlistComparison.filter(item => 
    item.in_user_watchlist && item.in_friend_watchlist
  );
  
  const userOnlyWatchlist = watchlistComparison.filter(item => 
    item.in_user_watchlist && !item.in_friend_watchlist
  );
  
  const friendOnlyWatchlist = watchlistComparison.filter(item => 
    !item.in_user_watchlist && item.in_friend_watchlist
  );

  const sharedRatings = ratingComparison.filter(item => 
    item.user_rating > 0 && item.friend_rating > 0
  );

  const agreementRatings = sharedRatings.filter(item => 
    Math.abs(item.user_rating - item.friend_rating) <= 1
  );

  const disagreementRatings = sharedRatings.filter(item => 
    Math.abs(item.user_rating - item.friend_rating) > 2
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={friend.friend_avatar_url || ''} />
              <AvatarFallback>
                {friend.friend_username?.charAt(0).toUpperCase() || 'F'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">Movie Comparison</h1>
              <p className="text-muted-foreground">with {friend.friend_username}</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="watchlist" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="watchlist" className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Watchlists
            </TabsTrigger>
            <TabsTrigger value="ratings" className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              Ratings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="watchlist" className="space-y-6">
            {/* Shared Movies */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-red-500" />
                  Movies You Both Want to Watch ({sharedWatchlist.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {sharedWatchlist.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {sharedWatchlist.map((movie) => (
                      <div key={movie.movie_id} className="space-y-2">
                        <img
                          src={movie.movie_poster || '/placeholder.svg'}
                          alt={movie.movie_title}
                          className="w-full aspect-[2/3] object-cover rounded-lg"
                        />
                        <div>
                          <h4 className="font-medium text-sm line-clamp-2">{movie.movie_title}</h4>
                          <div className="flex gap-1 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              You: {movie.user_list_type}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              Them: {movie.friend_list_type}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No shared movies in your watchlists yet!
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Your Movies */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-blue-500" />
                  Movies Only You Want to Watch ({userOnlyWatchlist.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {userOnlyWatchlist.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                    {userOnlyWatchlist.slice(0, 12).map((movie) => (
                      <div key={movie.movie_id} className="space-y-2">
                        <img
                          src={movie.movie_poster || '/placeholder.svg'}
                          alt={movie.movie_title}
                          className="w-full aspect-[2/3] object-cover rounded-lg"
                        />
                        <h4 className="font-medium text-xs line-clamp-2">{movie.movie_title}</h4>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    No unique movies in your watchlist.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Friend's Movies */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-green-500" />
                  Movies Only {friend.friend_username} Wants to Watch ({friendOnlyWatchlist.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {friendOnlyWatchlist.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                    {friendOnlyWatchlist.slice(0, 12).map((movie) => (
                      <div key={movie.movie_id} className="space-y-2">
                        <img
                          src={movie.movie_poster || '/placeholder.svg'}
                          alt={movie.movie_title}
                          className="w-full aspect-[2/3] object-cover rounded-lg"
                        />
                        <h4 className="font-medium text-xs line-clamp-2">{movie.movie_title}</h4>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    No unique movies in {friend.friend_username}'s watchlist.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ratings" className="space-y-6">
            {/* Similar Tastes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  Similar Ratings ({agreementRatings.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {agreementRatings.length > 0 ? (
                  <div className="space-y-4">
                    {agreementRatings.slice(0, 10).map((movie) => (
                      <div key={movie.movie_id} className="flex items-center gap-4 p-3 border rounded-lg">
                        <div className="font-medium flex-1">{movie.movie_title}</div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span className="font-medium">{movie.user_rating}</span>
                            <span className="text-muted-foreground text-sm">You</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span className="font-medium">{movie.friend_rating}</span>
                            <span className="text-muted-foreground text-sm">Them</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No similar ratings found yet!
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Different Opinions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-red-500" />
                  Different Opinions ({disagreementRatings.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {disagreementRatings.length > 0 ? (
                  <div className="space-y-4">
                    {disagreementRatings.slice(0, 10).map((movie) => (
                      <div key={movie.movie_id} className="flex items-center gap-4 p-3 border rounded-lg">
                        <div className="font-medium flex-1">{movie.movie_title}</div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span className="font-medium">{movie.user_rating}</span>
                            <span className="text-muted-foreground text-sm">You</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span className="font-medium">{movie.friend_rating}</span>
                            <span className="text-muted-foreground text-sm">Them</span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            Diff: {movie.rating_difference}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No major disagreements found!
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};