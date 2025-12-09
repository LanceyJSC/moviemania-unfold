import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Star, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { useState } from 'react';
import { Link } from 'react-router-dom';

interface CommunityReviewsProps {
  movieId: number;
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

export const CommunityReviews = ({ movieId }: CommunityReviewsProps) => {
  const [expandedReviews, setExpandedReviews] = useState<Set<string>>(new Set());
  const [showSpoilers, setShowSpoilers] = useState<Set<string>>(new Set());

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

  if (!reviews?.length) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Community Reviews</h3>
        <p className="text-muted-foreground text-sm">No reviews yet. Be the first to review!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Community Reviews ({reviews.length})</h3>
      <div className="space-y-3">
        {reviews.map((review) => {
          const isExpanded = expandedReviews.has(review.id);
          const isSpoilerVisible = showSpoilers.has(review.id);
          const reviewText = review.review_text || '';
          const isLong = reviewText.length > 300;

          return (
            <Card key={review.id}>
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
                      {review.rating && (
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-3.5 w-3.5 ${
                                star <= review.rating!
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-muted-foreground'
                              }`}
                            />
                          ))}
                        </div>
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
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
