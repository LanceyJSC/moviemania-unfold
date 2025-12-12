import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Star, User, AlertTriangle, ChevronDown, ChevronUp, ArrowUpDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MobileHeader } from "@/components/MobileHeader";
import { Navigation } from "@/components/Navigation";
import { LogMediaModal } from "@/components/LogMediaModal";
import { tmdbService, Movie, Review } from "@/lib/tmdb";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ReviewLikes } from "@/components/ReviewLikes";
import { format } from "date-fns";

interface CommunityReview {
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

const MovieReviews = () => {
  const { id } = useParams<{ id: string }>();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showLogModal, setShowLogModal] = useState(false);
  const [expandedReviews, setExpandedReviews] = useState<Set<string>>(new Set());
  const [showSpoilers, setShowSpoilers] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const { user } = useAuth();

  const movieId = Number(id);

  // Fetch Movie details
  useEffect(() => {
    const loadMovie = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const data = await tmdbService.getMovieDetails(movieId);
        setMovie(data);
      } catch (error) {
        console.error('Failed to load movie:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadMovie();
  }, [id, movieId]);

  // Fetch TMDB Reviews
  const { data: tmdbReviews } = useQuery({
    queryKey: ['movie-tmdb-reviews', movieId],
    queryFn: async () => {
      const response = await tmdbService.getMovieReviews(movieId);
      return response.results;
    },
    enabled: !!movieId
  });

  // Fetch Community Reviews
  const { data: communityReviews, refetch: refetchCommunityReviews } = useQuery({
    queryKey: ['community-reviews', movieId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_reviews')
        .select('id, user_id, review_text, rating, is_spoiler, created_at')
        .eq('movie_id', movieId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const userIds = data.map((r) => r.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, full_name')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

      return data.map((review) => ({
        ...review,
        profile: profileMap.get(review.user_id) || null,
      })) as CommunityReview[];
    },
    enabled: !!movieId
  });

  const toggleExpanded = (reviewId: string) => {
    setExpandedReviews((prev) => {
      const next = new Set(prev);
      if (next.has(reviewId)) next.delete(reviewId);
      else next.add(reviewId);
      return next;
    });
  };

  const revealSpoiler = (reviewId: string) => {
    setShowSpoilers((prev) => new Set(prev).add(reviewId));
  };

  const getSortedReviews = () => {
    if (!communityReviews) return [];
    
    const sorted = [...communityReviews];
    
    if (user) {
      const userReviewIndex = sorted.findIndex(r => r.user_id === user.id);
      if (userReviewIndex > 0) {
        const [userReview] = sorted.splice(userReviewIndex, 1);
        sorted.unshift(userReview);
      }
    }
    
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

  const formatReviewContent = (content: string, maxLength: number = 300) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <MobileHeader title="Loading..." />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cinema-red"></div>
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-background">
        <MobileHeader title="Not Found" />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Movie not found</h1>
            <Link to="/movies">
              <Button>Back to Movies</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const backdropUrl = tmdbService.getBackdropUrl(movie.backdrop_path, 'w1280');
  const sortedCommunityReviews = getSortedReviews();

  return (
    <div className="min-h-screen bg-background pb-32">
      <MobileHeader title="Reviews" />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden h-[25vh] rounded-b-2xl">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: `url(${backdropUrl})`,
            backgroundColor: 'hsl(var(--background))'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-cinema-black/60 via-cinema-black/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-cinema-black/70 via-transparent to-transparent" />
        </div>

        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background via-background/90 to-transparent pointer-events-none z-20" />

        <div className="absolute bottom-6 left-4 right-4 z-30">
          <h1 className="font-cinematic text-white tracking-wide text-xl leading-tight">
            Reviews for {movie.title}
          </h1>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Community Reviews Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">
              Community Reviews
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({communityReviews?.length || 0})
              </span>
            </h2>
            
            {communityReviews && communityReviews.length > 1 && (
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
          </div>
          
          {sortedCommunityReviews.length > 0 ? (
            <div className="space-y-4">
              {sortedCommunityReviews.map((review) => {
                const isExpanded = expandedReviews.has(review.id);
                const isSpoilerVisible = showSpoilers.has(review.id);
                const reviewText = review.review_text || '';
                const isLong = reviewText.length > 300;
                const isOwnReview = user?.id === review.user_id;

                return (
                  <div 
                    key={review.id}
                    className={`bg-card rounded-xl p-4 border ${isOwnReview ? 'border-primary/30 bg-primary/5' : 'border-border'}`}
                  >
                    <div className="flex items-start gap-3">
                      <Link to={`/user/${review.profile?.username || review.user_id}`}>
                        <Avatar className="h-10 w-10 flex-shrink-0">
                          <AvatarImage src={review.profile?.avatar_url || undefined} />
                          <AvatarFallback className="bg-muted">
                            <User className="h-5 w-5 text-muted-foreground" />
                          </AvatarFallback>
                        </Avatar>
                      </Link>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <Link 
                            to={`/user/${review.profile?.username || review.user_id}`}
                            className="font-medium text-foreground hover:underline"
                          >
                            {review.profile?.username || review.profile?.full_name || 'Anonymous'}
                          </Link>
                          {isOwnReview && (
                            <span className="text-xs px-1.5 py-0.5 bg-primary/20 text-primary rounded">You</span>
                          )}
                          {review.rating && (
                            <div className="flex items-center gap-1 text-cinema-gold text-sm">
                              <Star className="h-3.5 w-3.5 fill-current" />
                              <span>{review.rating}/10</span>
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
                          <div>
                            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
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
                        
                        <div className="mt-3">
                          <ReviewLikes reviewId={review.id} compact />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 bg-card rounded-xl border border-border">
              <p className="text-muted-foreground text-sm mb-2">No community reviews yet.</p>
              {user && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowLogModal(true)}
                >
                  Be the first to review
                </Button>
              )}
            </div>
          )}
        </div>

        {/* TMDB Reviews Section */}
        {tmdbReviews && tmdbReviews.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">
              TMDB Reviews
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({tmdbReviews.length})
              </span>
            </h2>
            
            <div className="space-y-4">
              {tmdbReviews.map((review: Review) => (
                <div 
                  key={review.id}
                  className="bg-card rounded-xl p-4 border border-border"
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      {review.author_details.avatar_path ? (
                        <AvatarImage 
                          src={
                            review.author_details.avatar_path.startsWith('/https')
                              ? review.author_details.avatar_path.slice(1)
                              : tmdbService.getProfileUrl(review.author_details.avatar_path)
                          } 
                        />
                      ) : null}
                      <AvatarFallback className="bg-muted">
                        <User className="h-5 w-5 text-muted-foreground" />
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className="font-medium text-foreground">
                          {review.author_details.username || review.author}
                        </span>
                        {review.author_details.rating && (
                          <div className="flex items-center gap-1 text-cinema-gold text-sm">
                            <Star className="h-3.5 w-3.5 fill-current" />
                            <span>{review.author_details.rating}/10</span>
                          </div>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(review.created_at), 'MMM d, yyyy')}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {formatReviewContent(review.content)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Log Modal */}
      {showLogModal && movie && (
        <LogMediaModal
          isOpen={showLogModal}
          onClose={() => {
            setShowLogModal(false);
            refetchCommunityReviews();
          }}
          mediaId={movieId}
          mediaTitle={movie.title}
          mediaPoster={movie.poster_path}
          mediaType="movie"
        />
      )}

      <Navigation />
    </div>
  );
};

export default MovieReviews;