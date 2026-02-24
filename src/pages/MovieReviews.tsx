import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Star, User, AlertTriangle, ChevronDown, ChevronUp, ArrowUpDown, Flame, Play, Heart, Plus, BookOpen, Eye, MessageCircle, MoreHorizontal } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MobileHeader } from "@/components/MobileHeader";
import { DesktopHeader } from "@/components/DesktopHeader";
import { Navigation } from "@/components/Navigation";
import { LogMediaModal } from "@/components/LogMediaModal";
import { MobileActionSheet } from "@/components/MobileActionSheet";
import { RatingComparisonCard } from "@/components/RatingComparisonCard";
import { SynopsisModal } from "@/components/SynopsisModal";
import { AddToListButton } from "@/components/AddToListButton";
import { tmdbService, Movie, Review } from "@/lib/tmdb";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserStateContext } from "@/contexts/UserStateContext";
import { useTrailerContext } from "@/contexts/TrailerContext";
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
  const navigate = useNavigate();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showLogModal, setShowLogModal] = useState(false);
  const [showSynopsis, setShowSynopsis] = useState(false);
  const [expandedReviews, setExpandedReviews] = useState<Set<string>>(new Set());
  const [showSpoilers, setShowSpoilers] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [showSortSheet, setShowSortSheet] = useState(false);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const { user } = useAuth();
  const { toggleLike, toggleWatchlist, setRating, markAsWatched, isLiked, isInWatchlist, isWatched, getRating } = useUserStateContext();
  const { setIsTrailerOpen, setTrailerKey: setGlobalTrailerKey, setMovieTitle } = useTrailerContext();

  const movieId = Number(id);
  const isMovieLiked = isLiked(movieId);
  const isMovieInWatchlist = isInWatchlist(movieId);
  const isMovieWatched = isWatched(movieId);
  const userRating = getRating(movieId);

  const requireAuth = (action: () => void) => {
    if (!user) { navigate('/auth'); return; }
    action();
  };

  useEffect(() => {
    const loadMovie = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const data = await tmdbService.getMovieDetails(movieId);
        setMovie(data);
        const trailer = data.videos?.results.find(v => v.type === 'Trailer' && v.site === 'YouTube');
        if (trailer) setTrailerKey(trailer.key);
      } catch (error) {
        console.error('Failed to load movie:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadMovie();
  }, [id, movieId]);

  const { data: tmdbReviews } = useQuery({
    queryKey: ['movie-tmdb-reviews', movieId],
    queryFn: async () => {
      const response = await tmdbService.getMovieReviews(movieId);
      return response.results;
    },
    enabled: !!movieId
  });

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
      case 'recent': toSort.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); break;
      case 'oldest': toSort.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()); break;
      case 'highest': toSort.sort((a, b) => (b.rating || 0) - (a.rating || 0)); break;
      case 'lowest': toSort.sort((a, b) => (a.rating || 0) - (b.rating || 0)); break;
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
            <Link to="/movies"><Button>Back to Movies</Button></Link>
          </div>
        </div>
      </div>
    );
  }

  const backdropUrl = tmdbService.getBackdropUrl(movie.backdrop_path, 'original');
  const posterUrl = tmdbService.getPosterUrl(movie.poster_path, 'w500');
  const title = movie.title;
  const releaseYear = movie.release_date ? new Date(movie.release_date).getFullYear() : 'TBA';
  const runtime = movie.runtime ? `${movie.runtime} min` : 'Unknown';
  const genres = movie.genres?.map(g => g.name).join(', ') || 'Unknown';
  const sortedCommunityReviews = getSortedReviews();

  const handleWatchTrailer = () => {
    if (trailerKey) {
      setGlobalTrailerKey(trailerKey);
      setMovieTitle(title);
      setIsTrailerOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-32 2xl:pb-12">
      <DesktopHeader />
      <MobileHeader title={title} />
      
      {/* Hero Section - Matching MovieDetail */}
      <div className="md:max-w-7xl md:mx-auto md:px-6 md:pt-6">
        <div className="relative overflow-hidden aspect-video md:rounded-2xl">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${backdropUrl})`, backgroundColor: 'hsl(var(--background))' }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-cinema-black/40 via-cinema-black/20 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-cinema-black/50 via-transparent to-transparent" />
          </div>
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background via-background/90 to-transparent pointer-events-none z-20" />
          <div className="absolute bottom-6 left-4 z-30 iphone-65:left-3">
            <img src={posterUrl} alt={title} className="w-24 h-36 iphone-65:w-28 iphone-65:h-42 iphone-67:w-32 iphone-67:h-48 rounded-lg shadow-cinematic object-cover border-2 border-white/20" />
          </div>
          <div className="absolute bottom-6 left-32 right-4 z-30 iphone-65:left-36 iphone-67:left-40">
            <div className="flex items-center space-x-2 iphone-65:space-x-3 mb-1 flex-wrap gap-y-1">
              <span className="text-cinema-gold font-semibold text-xs iphone-65:text-sm">TMDB {movie.vote_average.toFixed(1)}</span>
              <span className="text-white/80 text-xs iphone-65:text-sm">{releaseYear}</span>
              <span className="text-white/80 text-xs iphone-65:text-sm">{runtime}</span>
            </div>
            <h1 className="font-cinematic text-white mb-2 tracking-wide text-lg iphone-65:text-xl leading-tight">{title}</h1>
            <p className="text-white/70 mb-3 text-xs iphone-65:text-sm">{genres}</p>
          </div>
        </div>
      </div>

      {/* Synopsis Section */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 -mt-4 relative z-30">
        <div className="bg-black/40 backdrop-blur-sm rounded-lg p-4 border border-white/10">
          <p className="text-white leading-relaxed text-sm line-clamp-3">{movie.overview || "No synopsis available."}</p>
          {movie.overview && movie.overview.length > 120 && (
            <button onClick={() => setShowSynopsis(true)} className="mt-2 inline-flex items-center gap-1 text-cinema-gold hover:text-cinema-gold/80 transition-colors text-sm font-semibold">
              <MoreHorizontal className="h-4 w-4" />Read More
            </button>
          )}
        </div>
      </div>

      {/* Action Section */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 2xl:py-6">
        {/* Watch Trailer */}
        <div className="mb-3">
          {trailerKey ? (
            <Button className="w-full bg-cinema-red hover:bg-cinema-red/90 text-white font-semibold px-4 py-2.5 text-sm h-11" onClick={handleWatchTrailer}>
              <Play className="mr-2 h-4 w-4" />Watch Trailer
            </Button>
          ) : (
            <Button className="w-full bg-cinema-red hover:bg-cinema-red/90 text-white font-semibold px-4 py-2.5 text-sm h-11" disabled>
              <Play className="mr-2 h-4 w-4" />No Trailer
            </Button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-6 gap-1.5 mb-4 2xl:mb-6">
          <Button variant="outline" className={`flex flex-col items-center gap-0.5 h-auto py-2 2xl:py-3 border-border hover:bg-card touch-manipulation ${isMovieInWatchlist ? 'bg-cinema-gold border-cinema-gold text-cinema-black' : ''}`} onClick={() => requireAuth(() => toggleWatchlist(movieId, title, posterUrl))}>
            <Plus className="h-4 w-4 2xl:h-5 2xl:w-5" /><span className="text-[10px] 2xl:text-xs">Watchlist</span>
          </Button>
          <Button variant="outline" className={`flex flex-col items-center gap-0.5 h-auto py-2 2xl:py-3 border-border hover:bg-card touch-manipulation ${isMovieLiked ? 'bg-cinema-red border-cinema-red text-white' : ''}`} onClick={() => requireAuth(() => toggleLike(movieId, title, posterUrl))}>
            <Heart className={`h-4 w-4 2xl:h-5 2xl:w-5 ${isMovieLiked ? 'fill-current' : ''}`} /><span className="text-[10px] 2xl:text-xs">Favorites</span>
          </Button>
          <Button variant="outline" className={`flex flex-col items-center gap-0.5 h-auto py-2 2xl:py-3 border-border hover:bg-card touch-manipulation ${isMovieWatched ? 'bg-green-600 border-green-600 text-white' : ''}`} onClick={() => requireAuth(() => markAsWatched(movieId, title, posterUrl))}>
            <Eye className={`h-4 w-4 2xl:h-5 2xl:w-5 ${isMovieWatched ? 'fill-current' : ''}`} /><span className="text-[10px] 2xl:text-xs">Watched</span>
          </Button>
          <Button variant="outline" className="flex flex-col items-center gap-0.5 h-auto py-2 2xl:py-3 border-border hover:bg-card touch-manipulation" onClick={() => requireAuth(() => setShowLogModal(true))}>
            <BookOpen className="h-4 w-4 2xl:h-5 2xl:w-5" /><span className="text-[10px] 2xl:text-xs">Log</span>
          </Button>
          <Button variant="outline" className="flex flex-col items-center gap-0.5 h-auto py-2 2xl:py-3 border-border hover:bg-card touch-manipulation bg-primary/10 border-primary/30" disabled>
            <MessageCircle className="h-4 w-4 2xl:h-5 2xl:w-5" /><span className="text-[10px] 2xl:text-xs">Reviews</span>
          </Button>
          {user && (
            <AddToListButton movie={{ id: movieId, title, poster: movie.poster_path || undefined }} variant="outline" size="sm" className="flex flex-col items-center gap-0.5 h-auto py-2 2xl:py-3 border-border hover:bg-card touch-manipulation" />
          )}
        </div>

        {/* Rating Comparison Card */}
        <RatingComparisonCard
          mediaId={movieId}
          mediaType="movie"
          tmdbRating={movie.vote_average}
          userRating={userRating}
          onRatingChange={(rating) => requireAuth(() => setRating(movieId, rating, title, movie.poster_path))}
          mediaTitle={title}
          mediaPoster={movie.poster_path}
        />
      </div>

      {/* Reviews Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 space-y-6">
        {/* Community Reviews Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">
              Community Reviews
              <span className="text-sm font-normal text-muted-foreground ml-2">({communityReviews?.length || 0})</span>
            </h2>
            {communityReviews && communityReviews.length > 1 && (
              <Button variant="outline" size="sm" onClick={() => setShowSortSheet(true)} className="h-9 px-3 rounded-lg gap-1.5">
                <ArrowUpDown className="h-3.5 w-3.5" />
                <span className="text-xs">
                  {sortBy === 'recent' ? 'Recent' : sortBy === 'oldest' ? 'Oldest' : sortBy === 'highest' ? 'Highest' : 'Lowest'}
                </span>
              </Button>
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
                  <div key={review.id} className={`bg-card rounded-xl p-4 border ${isOwnReview ? 'border-primary/30 bg-primary/5' : 'border-border'}`}>
                    <div className="flex items-start gap-3">
                      <Link to={`/user/${review.profile?.username || review.user_id}`}>
                        <Avatar className="h-10 w-10 flex-shrink-0">
                          <AvatarImage src={review.profile?.avatar_url || undefined} />
                          <AvatarFallback className="bg-muted"><User className="h-5 w-5 text-muted-foreground" /></AvatarFallback>
                        </Avatar>
                      </Link>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <Link to={`/user/${review.profile?.username || review.user_id}`} className="font-medium text-foreground hover:underline">
                            {review.profile?.username || review.profile?.full_name || 'Anonymous'}
                          </Link>
                          {isOwnReview && <span className="text-xs px-1.5 py-0.5 bg-primary/20 text-primary rounded">You</span>}
                          {review.rating && (
                            <div className="flex items-center gap-1 text-cinema-red text-sm">
                              <Flame className="h-3.5 w-3.5 fill-current" /><span>{review.rating}/5</span>
                            </div>
                          )}
                          <span className="text-xs text-muted-foreground">{format(new Date(review.created_at), 'MMM d, yyyy')}</span>
                        </div>
                        {review.is_spoiler && !isSpoilerVisible ? (
                          <Button variant="outline" size="sm" onClick={() => revealSpoiler(review.id)} className="mt-2">
                            <AlertTriangle className="h-4 w-4 mr-1" />Show Spoiler
                          </Button>
                        ) : (
                          <div>
                            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                              {isLong && !isExpanded ? `${reviewText.slice(0, 300)}...` : reviewText}
                            </p>
                            {isLong && (
                              <Button variant="ghost" size="sm" onClick={() => toggleExpanded(review.id)} className="mt-1 h-auto p-0 text-muted-foreground hover:text-foreground">
                                {isExpanded ? <><ChevronUp className="h-4 w-4 mr-1" />Show less</> : <><ChevronDown className="h-4 w-4 mr-1" />Read more</>}
                              </Button>
                            )}
                          </div>
                        )}
                        <div className="mt-3"><ReviewLikes reviewId={review.id} compact /></div>
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
                <Button variant="outline" size="sm" onClick={() => setShowLogModal(true)}>Be the first to review</Button>
              )}
            </div>
          )}
        </div>

        {/* TMDB Reviews Section */}
        {tmdbReviews && tmdbReviews.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">
              TMDB Reviews <span className="text-sm font-normal text-muted-foreground ml-2">({tmdbReviews.length})</span>
            </h2>
            <div className="space-y-4">
              {tmdbReviews.map((review: Review) => (
                <div key={review.id} className="bg-card rounded-xl p-4 border border-border">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      {review.author_details.avatar_path ? (
                        <AvatarImage src={review.author_details.avatar_path.startsWith('/https') ? review.author_details.avatar_path.slice(1) : tmdbService.getProfileUrl(review.author_details.avatar_path)} />
                      ) : null}
                      <AvatarFallback className="bg-muted"><User className="h-5 w-5 text-muted-foreground" /></AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className="font-medium text-foreground">{review.author_details.username || review.author}</span>
                        {review.author_details.rating && (
                          <div className="flex items-center gap-1 text-cinema-gold text-sm">
                            <Star className="h-3.5 w-3.5 fill-current" /><span>{review.author_details.rating}/10</span>
                          </div>
                        )}
                        <span className="text-xs text-muted-foreground">{format(new Date(review.created_at), 'MMM d, yyyy')}</span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{formatReviewContent(review.content)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showLogModal && movie && (
        <LogMediaModal
          isOpen={showLogModal}
          onClose={() => { setShowLogModal(false); refetchCommunityReviews(); }}
          mediaId={movieId}
          mediaTitle={movie.title}
          mediaPoster={movie.poster_path}
          mediaType="movie"
          initialRating={userRating}
        />
      )}

      {showSynopsis && (
        <SynopsisModal isOpen={showSynopsis} onClose={() => setShowSynopsis(false)} title={title} synopsis={movie.overview || ""} posterUrl={posterUrl} />
      )}

      <MobileActionSheet
        isOpen={showSortSheet}
        onClose={() => setShowSortSheet(false)}
        title="Sort Reviews"
        options={[
          { value: 'recent', label: 'Most Recent' },
          { value: 'oldest', label: 'Oldest First' },
          { value: 'highest', label: 'Highest Rated' },
          { value: 'lowest', label: 'Lowest Rated' },
        ]}
        selectedValue={sortBy}
        onSelect={(v) => setSortBy(v as SortOption)}
      />

      <Navigation />
    </div>
  );
};

export default MovieReviews;
