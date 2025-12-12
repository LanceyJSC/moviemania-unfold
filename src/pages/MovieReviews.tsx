import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MobileHeader } from "@/components/MobileHeader";
import { Navigation } from "@/components/Navigation";
import { ReviewLikes } from "@/components/ReviewLikes";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { tmdbService } from "@/lib/tmdb";
import { format } from "date-fns";

interface ReviewWithProfile {
  id: string;
  user_id: string;
  movie_id: number;
  movie_title: string;
  review_text: string | null;
  rating: number | null;
  is_spoiler: boolean | null;
  created_at: string;
  profile?: {
    username: string | null;
    avatar_url: string | null;
  };
}

type SortOption = 'newest' | 'oldest' | 'highest' | 'lowest';

const MovieReviews = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const movieId = Number(id);

  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [expandedReviews, setExpandedReviews] = useState<Set<string>>(new Set());
  const [revealedSpoilers, setRevealedSpoilers] = useState<Set<string>>(new Set());

  // Fetch movie details
  const { data: movie, isLoading: movieLoading } = useQuery({
    queryKey: ['movie-details', movieId],
    queryFn: () => tmdbService.getMovieDetails(movieId),
  });

  // Fetch community reviews
  const { data: reviews = [], isLoading: reviewsLoading } = useQuery({
    queryKey: ['community-reviews', movieId],
    queryFn: async () => {
      const { data: reviewsData, error } = await supabase
        .from('user_reviews')
        .select('*')
        .eq('movie_id', movieId)
        .not('review_text', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles separately
      const userIds = [...new Set(reviewsData?.map(r => r.user_id) || [])];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', userIds);

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

      return (reviewsData || []).map(review => ({
        ...review,
        profile: profilesMap.get(review.user_id) || null
      })) as ReviewWithProfile[];
    },
  });

  // Fetch TMDB reviews
  const { data: tmdbReviews = [] } = useQuery({
    queryKey: ['tmdb-reviews', movieId],
    queryFn: async () => {
      const response = await fetch(
        `https://api.themoviedb.org/3/movie/${movieId}/reviews?api_key=4c78b0640f0c6a7d61cd4c8e90c0aa81`
      );
      const data = await response.json();
      return data.results || [];
    },
  });

  const toggleExpanded = (reviewId: string) => {
    setExpandedReviews(prev => {
      const next = new Set(prev);
      if (next.has(reviewId)) {
        next.delete(reviewId);
      } else {
        next.add(reviewId);
      }
      return next;
    });
  };

  const revealSpoiler = (reviewId: string) => {
    setRevealedSpoilers(prev => new Set([...prev, reviewId]));
  };

  const getSortedReviews = () => {
    const sorted = [...reviews];
    
    switch (sortBy) {
      case 'newest':
        sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'oldest':
        sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'highest':
        sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'lowest':
        sorted.sort((a, b) => (a.rating || 0) - (b.rating || 0));
        break;
    }

    // Move current user's review to top
    if (user) {
      const userReviewIndex = sorted.findIndex(r => r.user_id === user.id);
      if (userReviewIndex > 0) {
        const [userReview] = sorted.splice(userReviewIndex, 1);
        sorted.unshift(userReview);
      }
    }

    return sorted;
  };

  if (movieLoading || reviewsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <MobileHeader title="Reviews" />
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-cinema-red" />
        </div>
      </div>
    );
  }

  const sortedReviews = getSortedReviews();

  return (
    <div className="min-h-screen bg-background pb-32">
      <MobileHeader title={`Reviews - ${movie?.title || 'Movie'}`} />

      <div className="container mx-auto px-4 py-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          className="mb-4 -ml-2"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {/* Community Reviews Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-cinematic text-foreground tracking-wide">
              COMMUNITY REVIEWS ({reviews.length})
            </h2>
            {reviews.length > 0 && (
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-card border border-border rounded px-2 py-1 text-sm text-foreground"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="highest">Highest Rated</option>
                <option value="lowest">Lowest Rated</option>
              </select>
            )}
          </div>

          {sortedReviews.length === 0 ? (
            <div className="bg-card/50 rounded-lg p-6 text-center border border-border">
              <p className="text-muted-foreground mb-4">No user reviews yet. Be the first to review!</p>
              <Button
                onClick={() => navigate(`/movie/${movieId}`)}
                className="bg-cinema-red hover:bg-cinema-red/90"
              >
                Write a Review
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedReviews.map((review) => {
                const isExpanded = expandedReviews.has(review.id);
                const isSpoilerRevealed = revealedSpoilers.has(review.id);
                const shouldTruncate = review.review_text && review.review_text.length > 300;

                return (
                  <div key={review.id} className="bg-card/50 rounded-lg p-4 border border-border">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={review.profile?.avatar_url || ''} />
                        <AvatarFallback className="bg-cinema-red/20 text-cinema-red">
                          {review.profile?.username?.[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-foreground">
                            {review.profile?.username || 'Anonymous'}
                          </span>
                          {review.rating && (
                            <span className="flex items-center gap-1 text-cinema-gold text-sm">
                              <Star className="h-3 w-3 fill-current" />
                              {review.rating}/10
                            </span>
                          )}
                          {review.user_id === user?.id && (
                            <span className="text-xs bg-cinema-red/20 text-cinema-red px-2 py-0.5 rounded">
                              You
                            </span>
                          )}
                        </div>
                        <p className="text-muted-foreground text-xs mt-0.5">
                          {format(new Date(review.created_at), 'MMM d, yyyy')}
                        </p>

                        <div className="mt-2">
                          {review.is_spoiler && !isSpoilerRevealed ? (
                            <button
                              onClick={() => revealSpoiler(review.id)}
                              className="text-cinema-red hover:text-cinema-red/80 text-sm"
                            >
                              ⚠️ Contains spoilers - Click to reveal
                            </button>
                          ) : (
                            <>
                              <p className={`text-foreground text-sm ${!isExpanded && shouldTruncate ? 'line-clamp-4' : ''}`}>
                                {review.review_text}
                              </p>
                              {shouldTruncate && (
                                <button
                                  onClick={() => toggleExpanded(review.id)}
                                  className="text-cinema-gold text-sm mt-1 hover:underline"
                                >
                                  {isExpanded ? 'Show less' : 'Read more'}
                                </button>
                              )}
                            </>
                          )}
                        </div>

                        <div className="mt-3">
                          <ReviewLikes reviewId={review.id} compact />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* TMDB Reviews Section */}
        {tmdbReviews.length > 0 && (
          <div>
            <h2 className="text-xl font-cinematic text-foreground mb-4 tracking-wide">
              TMDB REVIEWS ({tmdbReviews.length})
            </h2>
            <div className="space-y-4">
              {tmdbReviews.map((review: any) => (
                <div key={review.id} className="bg-card/50 rounded-lg p-4 border border-border">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage 
                        src={review.author_details?.avatar_path 
                          ? (review.author_details.avatar_path.startsWith('/http') 
                            ? review.author_details.avatar_path.slice(1) 
                            : `https://image.tmdb.org/t/p/w45${review.author_details.avatar_path}`)
                          : ''
                        } 
                      />
                      <AvatarFallback className="bg-muted text-muted-foreground">
                        {review.author?.[0]?.toUpperCase() || 'T'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-foreground">{review.author}</span>
                        {review.author_details?.rating && (
                          <span className="flex items-center gap-1 text-cinema-gold text-sm">
                            <Star className="h-3 w-3 fill-current" />
                            {review.author_details.rating}/10
                          </span>
                        )}
                      </div>
                      <p className="text-muted-foreground text-xs mt-0.5">
                        {format(new Date(review.created_at), 'MMM d, yyyy')}
                      </p>
                      <p className="text-foreground text-sm mt-2 line-clamp-4">
                        {review.content}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Navigation />
    </div>
  );
};

export default MovieReviews;