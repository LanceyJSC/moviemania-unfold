import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, ChevronDown, ChevronUp, ArrowUpDown, Heart, MessageCircle, PenLine } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ReviewLikes } from '@/components/ReviewLikes';

interface CommunityReviewsProps {
  movieId: number;
  onWriteReview?: () => void;
}

interface ReviewWithProfile {
  id: string;
  user_id: string;
  review_text: string | null;
  rating: number | null;
  is_spoiler: boolean | null;
  created_at: string;
  profile: {
    username: string | null;
    avatar_url: string | null;
    full_name: string | null;
  } | null;
}

type SortOption = 'recent' | 'oldest' | 'highest' | 'lowest';

export const CommunityReviews = ({ movieId, onWriteReview }: CommunityReviewsProps) => {
  const { user } = useAuth();
  const [expandedReviews, setExpandedReviews] = useState<Set<string>>(new Set());
  const [showSpoilers, setShowSpoilers] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<SortOption>('recent');

  const { data: reviews, isLoading } = useQuery({
    queryKey: ['community-reviews', movieId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_reviews')
        .select('id, user_id, review_text, rating, is_spoiler, created_at')
        .eq('movie_id', movieId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles for all reviewers
      const userIds = data.map((r) => r.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, full_name')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

      return data.map((review) => ({
        ...review,
        profile: profileMap.get(review.user_id) || null,
      })) as ReviewWithProfile[];
    },
  });

  const toggleExpanded = (id: string) => {
    setExpandedReviews((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const revealSpoiler = (id: string) => {
    setShowSpoilers((prev) => new Set(prev).add(id));
  };

  const getSortedReviews = () => {
    if (!reviews) return [];
    
    const sorted = [...reviews];
    
    // Move user's own review to the top
    if (user) {
      const userReviewIndex = sorted.findIndex(r => r.user_id === user.id);
      if (userReviewIndex > 0) {
        const [userReview] = sorted.splice(userReviewIndex, 1);
        sorted.unshift(userReview);
      }
    }
    
    // Sort remaining reviews (skip first if it's user's own)
    const startIndex = user && sorted[0]?.user_id === user.id ? 1 : 0;
    const toSort = sorted.slice(startIndex);
    
    switch (sortBy) {
      case 'recent':
        toSort.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'oldest':
        toSort.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'highest':
        toSort.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'lowest':
        toSort.sort((a, b) => (a.rating || 0) - (b.rating || 0));
        break;
    }
    
    return [...sorted.slice(0, startIndex), ...toSort];
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Community Reviews</h3>
        <div className="animate-pulse space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const sortedReviews = getSortedReviews();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Community Reviews {reviews?.length ? `(${reviews.length})` : ''}
        </h3>
        
        <div className="flex items-center gap-2">
          {reviews && reviews.length > 1 && (
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger className="w-[130px] h-8 text-xs">
                <ArrowUpDown className="h-3 w-3 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="highest">Highest Rated</SelectItem>
                <SelectItem value="lowest">Lowest Rated</SelectItem>
              </SelectContent>
            </Select>
          )}
          
          {onWriteReview && (
            <Button size="sm" variant="outline" onClick={onWriteReview} className="h-8 text-xs">
              <PenLine className="h-3 w-3 mr-1" />
              Write Review
            </Button>
          )}
        </div>
      </div>

      {!sortedReviews.length ? (
        <p className="text-muted-foreground text-sm">No reviews yet. Be the first to review!</p>
      ) : (
        <div className="space-y-3">
          {sortedReviews.map((review) => {
            const isExpanded = expandedReviews.has(review.id);
            const isSpoilerVisible = showSpoilers.has(review.id);
            const reviewText = review.review_text || '';
            const isLong = reviewText.length > 300;
            const isOwnReview = user?.id === review.user_id;

            return (
              <Card key={review.id} className={isOwnReview ? 'border-primary/30 bg-primary/5' : ''}>
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <Link to={`/user/${review.user_id}`}>
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={review.profile?.avatar_url || undefined} />
                        <AvatarFallback>
                          {review.profile?.username?.[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link 
                          to={`/user/${review.user_id}`}
                          className="font-medium hover:underline"
                        >
                          {review.profile?.username || review.profile?.full_name || 'Anonymous'}
                        </Link>
                        {isOwnReview && (
                          <span className="text-xs px-1.5 py-0.5 bg-primary/20 text-primary rounded">You</span>
                        )}
                        {review.rating && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-cinema-gold/20 rounded text-cinema-gold font-semibold text-xs">
                            {review.rating}/10
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(review.created_at), 'MMM d, yyyy')}
                        </span>
                      </div>

                      {review.is_spoiler && !isSpoilerVisible ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => revealSpoiler(review.id)}
                          className="mt-2"
                        >
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          Show Spoiler
                        </Button>
                      ) : (
                        <div className="mt-2">
                          <p className="text-sm text-foreground/90 whitespace-pre-wrap">
                            {isLong && !isExpanded
                              ? `${reviewText.slice(0, 300)}...`
                              : reviewText}
                          </p>
                          {isLong && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleExpanded(review.id)}
                              className="mt-1 h-auto p-0 text-muted-foreground hover:text-foreground"
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronUp className="h-4 w-4 mr-1" />
                                  Show less
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="h-4 w-4 mr-1" />
                                  Read more
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      )}
                      
                      {/* Likes and Comments */}
                      <div className="mt-3">
                        <ReviewLikes reviewId={review.id} compact />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};