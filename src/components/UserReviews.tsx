import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, ChevronRight, ChevronDown } from "lucide-react";
import { Review, tmdbService } from "@/lib/tmdb";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";

interface UserReviewsProps {
  movieId: number;
  isTV?: boolean;
}

interface AppUserReview {
  id: string;
  user_id: string;
  rating: number | null;
  review_text: string | null;
  is_spoiler: boolean;
  created_at: string;
  profiles?: {
    username: string | null;
    avatar_url: string | null;
  };
}

export const UserReviews = ({ movieId, isTV = false }: UserReviewsProps) => {
  const [tmdbReviews, setTmdbReviews] = useState<Review[]>([]);
  const [allTmdbReviews, setAllTmdbReviews] = useState<Review[]>([]);
  const [userReviews, setUserReviews] = useState<AppUserReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tmdb' | 'user'>('tmdb');

  useEffect(() => {
    const fetchReviews = async (fresh: boolean = false) => {
      try {
        setLoading(true);
        
        // Fetch TMDB reviews
        const response = isTV 
          ? await tmdbService.getTVShowReviews(movieId, 1, fresh)
          : await tmdbService.getMovieReviews(movieId, 1, fresh);
        
        setTmdbReviews(response.results.slice(0, 1));
        setAllTmdbReviews(response.results);

        // Fetch user reviews from our database
        const { data: appReviews } = await supabase
          .from('user_reviews')
          .select(`
            id,
            user_id,
            rating,
            review_text,
            is_spoiler,
            created_at
          `)
          .eq('movie_id', movieId)
          .not('review_text', 'is', null)
          .order('created_at', { ascending: false });

        if (appReviews && appReviews.length > 0) {
          // Fetch profiles for these users
          const userIds = appReviews.map(r => r.user_id);
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, username, avatar_url')
            .in('id', userIds);

          const reviewsWithProfiles = appReviews.map(review => ({
            ...review,
            profiles: profiles?.find(p => p.id === review.user_id) || null
          }));

          setUserReviews(reviewsWithProfiles);
        } else {
          setUserReviews([]);
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();

    const refreshInterval = setInterval(() => {
      fetchReviews(true);
    }, 3600000);

    return () => clearInterval(refreshInterval);
  }, [movieId, isTV]);

  const formatContent = (content: string, maxLength: number = 200) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + "...";
  };

  const getTabLabel = () => {
    if (activeTab === 'tmdb') {
      return 'TMDB Reviews';
    }
    return 'User Reviews';
  };

  const tmdbCount = allTmdbReviews.length;
  const userCount = userReviews.length;

  if (loading) {
    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground mb-3">Reviews</h3>
        <Card className="p-4 bg-muted/50 animate-pulse">
          <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-muted rounded w-full mb-1"></div>
          <div className="h-3 bg-muted rounded w-5/6"></div>
        </Card>
      </div>
    );
  }

  if (tmdbCount === 0 && userCount === 0) {
    return null;
  }

  const topTmdbReview = tmdbReviews[0];

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-foreground">Reviews</h3>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1">
              {getTabLabel()}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-popover border-border z-50">
            <DropdownMenuItem 
              onClick={() => setActiveTab('tmdb')}
              className={activeTab === 'tmdb' ? 'bg-accent' : ''}
            >
              TMDB Reviews ({tmdbCount})
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setActiveTab('user')}
              className={activeTab === 'user' ? 'bg-accent' : ''}
            >
              User Reviews ({userCount})
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {activeTab === 'tmdb' && (
        <>
          {tmdbCount === 0 ? (
            <Card className="p-4 bg-muted/50">
              <p className="text-sm text-muted-foreground">No TMDB reviews available.</p>
            </Card>
          ) : (
            <Card className="p-4 bg-muted/50">
              <div className="space-y-3">
                {topTmdbReview.author_details.rating && (
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="flex items-center space-x-1">
                      <Star className="h-3 w-3 fill-current" />
                      <span>{topTmdbReview.author_details.rating}/10</span>
                    </Badge>
                  </div>
                )}
                
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {formatContent(topTmdbReview.content)}
                </p>
                
                {allTmdbReviews.length > 1 && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="p-0 h-auto text-primary hover:text-primary/80">
                        More reviews ({allTmdbReviews.length})
                        <ChevronRight className="h-3 w-3 ml-1" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh]">
                      <DialogHeader>
                        <DialogTitle>All TMDB Reviews ({allTmdbReviews.length})</DialogTitle>
                      </DialogHeader>
                      <ScrollArea className="h-[60vh] pr-4">
                        <div className="space-y-4">
                          {allTmdbReviews.map((review) => (
                            <Card key={review.id} className="p-4">
                              <div className="space-y-3">
                                {review.author_details.rating && (
                                  <Badge variant="secondary" className="flex items-center space-x-1 w-fit">
                                    <Star className="h-3 w-3 fill-current" />
                                    <span>{review.author_details.rating}/10</span>
                                  </Badge>
                                )}
                                
                                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                  {review.content}
                                </p>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </ScrollArea>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </Card>
          )}
        </>
      )}

      {activeTab === 'user' && (
        <>
          {userCount === 0 ? (
            <Card className="p-4 bg-muted/50">
              <p className="text-sm text-muted-foreground">No user reviews yet. Be the first to review!</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {userReviews.slice(0, 3).map((review) => (
                <Card key={review.id} className="p-4 bg-muted/50">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">
                        @{review.profiles?.username || 'Anonymous'}
                      </span>
                      {review.rating && (
                        <Badge variant="secondary" className="flex items-center space-x-1">
                          <Star className="h-3 w-3 fill-current" />
                          <span>{review.rating}/10</span>
                        </Badge>
                      )}
                    </div>
                    
                    {review.is_spoiler && (
                      <Badge variant="destructive" className="text-xs">Spoiler</Badge>
                    )}
                    
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {formatContent(review.review_text || '')}
                    </p>
                  </div>
                </Card>
              ))}
              
              {userReviews.length > 3 && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="p-0 h-auto text-primary hover:text-primary/80">
                      More reviews ({userReviews.length})
                      <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh]">
                    <DialogHeader>
                      <DialogTitle>All User Reviews ({userReviews.length})</DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="h-[60vh] pr-4">
                      <div className="space-y-4">
                        {userReviews.map((review) => (
                          <Card key={review.id} className="p-4">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-foreground">
                                  @{review.profiles?.username || 'Anonymous'}
                                </span>
                                {review.rating && (
                                  <Badge variant="secondary" className="flex items-center space-x-1">
                                    <Star className="h-3 w-3 fill-current" />
                                    <span>{review.rating}/10</span>
                                  </Badge>
                                )}
                              </div>
                              
                              {review.is_spoiler && (
                                <Badge variant="destructive" className="text-xs">Spoiler</Badge>
                              )}
                              
                              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                {review.review_text}
                              </p>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};