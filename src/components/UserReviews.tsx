import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, User, ChevronRight } from "lucide-react";
import { Review, tmdbService } from "@/lib/tmdb";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserReviewsProps {
  movieId: number;
  isTV?: boolean;
}

export const UserReviews = ({ movieId, isTV = false }: UserReviewsProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [allReviews, setAllReviews] = useState<Review[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        const response = isTV 
          ? await tmdbService.getTVShowReviews(movieId)
          : await tmdbService.getMovieReviews(movieId);
        
        setReviews(response.results.slice(0, 1)); // Only show top review initially
        setAllReviews(response.results);
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [movieId, isTV]);

  const formatContent = (content: string, maxLength: number = 200) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + "...";
  };

  const getAvatarUrl = (avatarPath: string | null) => {
    if (!avatarPath) return null;
    if (avatarPath.startsWith('/https://')) {
      return avatarPath.substring(1); // Remove leading slash
    }
    return tmdbService.getProfileUrl(avatarPath, 'w185');
  };

  if (loading) {
    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground mb-3">User Reviews</h3>
        <Card className="p-4 bg-muted/50 animate-pulse">
          <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-muted rounded w-full mb-1"></div>
          <div className="h-3 bg-muted rounded w-5/6"></div>
        </Card>
      </div>
    );
  }

  if (reviews.length === 0) {
    return null;
  }

  const topReview = reviews[0];

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-foreground mb-3">User Reviews</h3>
      <Card className="p-4 bg-muted/50">
        <div className="flex items-start space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage 
              src={getAvatarUrl(topReview.author_details.avatar_path) || undefined} 
              alt={topReview.author}
            />
            <AvatarFallback>
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-foreground">
                  {topReview.author_details.name || topReview.author}
                </span>
                {topReview.author_details.rating && (
                  <Badge variant="secondary" className="flex items-center space-x-1">
                    <Star className="h-3 w-3 fill-current" />
                    <span>{topReview.author_details.rating}/10</span>
                  </Badge>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {new Date(topReview.created_at).toLocaleDateString()}
              </span>
            </div>
            
            <p className="text-sm text-muted-foreground leading-relaxed">
              {formatContent(topReview.content)}
            </p>
            
            {allReviews.length > 1 && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="p-0 h-auto text-primary hover:text-primary/80">
                    More reviews ({allReviews.length})
                    <ChevronRight className="h-3 w-3 ml-1" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh]">
                  <DialogHeader>
                    <DialogTitle>All Reviews ({allReviews.length})</DialogTitle>
                  </DialogHeader>
                  <ScrollArea className="h-[60vh] pr-4">
                    <div className="space-y-4">
                      {allReviews.map((review) => (
                        <Card key={review.id} className="p-4">
                          <div className="flex items-start space-x-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage 
                                src={getAvatarUrl(review.author_details.avatar_path) || undefined} 
                                alt={review.author}
                              />
                              <AvatarFallback>
                                <User className="h-4 w-4" />
                              </AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium text-foreground">
                                    {review.author_details.name || review.author}
                                  </span>
                                  {review.author_details.rating && (
                                    <Badge variant="secondary" className="flex items-center space-x-1">
                                      <Star className="h-3 w-3 fill-current" />
                                      <span>{review.author_details.rating}/10</span>
                                    </Badge>
                                  )}
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(review.created_at).toLocaleDateString()}
                                </span>
                              </div>
                              
                              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                {review.content}
                              </p>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};