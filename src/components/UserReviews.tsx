import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, ChevronRight } from "lucide-react";
import { Review, tmdbService } from "@/lib/tmdb";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

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
    const fetchReviews = async (fresh: boolean = false) => {
      try {
        setLoading(true);
        const response = isTV 
          ? await tmdbService.getTVShowReviews(movieId, 1, fresh)
          : await tmdbService.getMovieReviews(movieId, 1, fresh);
        
        setReviews(response.results.slice(0, 1)); // Only show top review initially
        setAllReviews(response.results);
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();

    // Periodic refresh every hour to stay updated with TMDB
    const refreshInterval = setInterval(() => {
      fetchReviews(true);
    }, 3600000); // 1 hour in milliseconds

    return () => clearInterval(refreshInterval);
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
        <h3 className="text-lg font-semibold text-foreground mb-3">TMDB Reviews</h3>
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
      <h3 className="text-lg font-semibold text-foreground mb-3">TMDB Reviews</h3>
      <Card className="p-4 bg-muted/50">
        <div className="space-y-3">
          {topReview.author_details.rating && (
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="flex items-center space-x-1">
                <Star className="h-3 w-3 fill-current" />
                <span>{topReview.author_details.rating}/10</span>
              </Badge>
            </div>
          )}
          
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
    </div>
  );
};