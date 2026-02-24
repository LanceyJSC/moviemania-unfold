import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Star, User, AlertTriangle, ChevronDown, ChevronUp, ArrowUpDown, ChevronRight, Tv } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MobileHeader } from "@/components/MobileHeader";
import { DesktopHeader } from "@/components/DesktopHeader";
import { Navigation } from "@/components/Navigation";
import { LogMediaModal } from "@/components/LogMediaModal";
import { MobileActionSheet } from "@/components/MobileActionSheet";
import { tmdbService, TVShow, Review } from "@/lib/tmdb";
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
  episode_number: number | null;
  season_number: number | null;
  profile: {
    username: string | null;
    avatar_url: string | null;
    full_name: string | null;
  } | null;
}

type SortOption = 'recent' | 'oldest' | 'highest' | 'lowest';

const TVShowReviews = () => {
  const { id } = useParams<{ id: string }>();
  const [tvShow, setTVShow] = useState<TVShow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showLogModal, setShowLogModal] = useState(false);
  const [expandedReviews, setExpandedReviews] = useState<Set<string>>(new Set());
  const [showSpoilers, setShowSpoilers] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [showSortSheet, setShowSortSheet] = useState(false);
  const { user } = useAuth();

  const tvId = Number(id);

  useEffect(() => {
    const loadTVShow = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const data = await tmdbService.getTVShowDetails(tvId);
        setTVShow(data);
      } catch (error) {
        console.error('Failed to load TV show:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadTVShow();
  }, [id, tvId]);

  // Fetch TMDB Reviews
  const { data: tmdbReviews } = useQuery({
    queryKey: ['tv-reviews', tvId],
    queryFn: async () => {
      const response = await tmdbService.getTVShowReviews(tvId);
      return response.results;
    },
    enabled: !!tvId
  });

  // Fetch ALL community reviews to separate series-level vs episode
  const { data: allCommunityReviews, refetch: refetchCommunityReviews } = useQuery({
    queryKey: ['community-reviews', tvId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_reviews')
        .select('id, user_id, review_text, rating, is_spoiler, created_at, episode_number, season_number')
        .eq('movie_id', tvId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const userIds = [...new Set(data.map((r) => r.user_id))];
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
    enabled: !!tvId
  });

  // Split into series-level and episode reviews
  const seriesReviews = allCommunityReviews?.filter(r => r.episode_number == null) || [];
  const episodeReviews = allCommunityReviews?.filter(r => r.episode_number != null) || [];

  // Group episode reviews by season for the season cards
  const seasonReviewCounts = new Map<number, number>();
  for (const r of episodeReviews) {
    const s = r.season_number ?? 0;
    seasonReviewCounts.set(s, (seasonReviewCounts.get(s) || 0) + 1);
  }
  const seasonsWithReviews = [...seasonReviewCounts.entries()].sort((a, b) => a[0] - b[0]);

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
    const sorted = [...seriesReviews];
    if (user) {
      const idx = sorted.findIndex(r => r.user_id === user.id);
      if (idx > 0) {
        const [userReview] = sorted.splice(idx, 1);
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!tvShow) {
    return (
      <div className="min-h-screen bg-background">
        <MobileHeader title="Not Found" />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">TV Show not found</h1>
            <Link to="/tv-shows"><Button>Back to TV Shows</Button></Link>
          </div>
        </div>
      </div>
    );
  }

  const backdropUrl = tmdbService.getBackdropUrl(tvShow.backdrop_path, 'original');
  const posterUrl = tmdbService.getPosterUrl(tvShow.poster_path, 'w500');
  const sortedCommunityReviews = getSortedReviews();

  return (
    <div className="min-h-screen bg-background pb-32 2xl:pb-12">
      <DesktopHeader />
      <MobileHeader title="Reviews" />

      {/* Hero Section */}
      <div className="md:max-w-7xl md:mx-auto md:px-6 md:pt-6">
        <div className="relative overflow-hidden aspect-video md:rounded-2xl">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${backdropUrl})`, backgroundColor: 'hsl(var(--background))' }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/20 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          </div>
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background via-background/90 to-transparent pointer-events-none z-20" />
          <div className="absolute bottom-6 left-4 z-30">
            <img src={posterUrl} alt={tvShow.name} className="w-24 h-36 rounded-lg shadow-lg object-cover border-2 border-white/20" />
          </div>
          <div className="absolute bottom-6 left-32 right-4 z-30">
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-amber-500 font-semibold text-xs">TMDB {tvShow.vote_average.toFixed(1)}</span>
              <span className="text-white/80 text-xs">TV Series</span>
            </div>
            <h1 className="font-bold text-white text-lg leading-tight">Reviews for {tvShow.name}</h1>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6 md:max-w-7xl md:mx-auto md:px-6">
        {/* Season Episode Reviews Section */}
        {seasonsWithReviews.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-3">Episode Reviews by Season</h2>
            <div className="space-y-2">
              {seasonsWithReviews.map(([seasonNum, count]) => {
                const season = tvShow.seasons?.find(s => s.season_number === seasonNum);
                const seasonPoster = season?.poster_path
                  ? tmdbService.getPosterUrl(season.poster_path, 'w500')
                  : null;

                return (
                  <Link key={seasonNum} to={`/tv/${tvId}/season/${seasonNum}/reviews`} className="block">
                    <div className="flex gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent/5 transition-colors">
                      <div className="w-12 h-[72px] rounded overflow-hidden bg-muted shrink-0">
                        {seasonPoster ? (
                          <img src={seasonPoster} alt={`Season ${seasonNum}`} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Tv className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 flex items-center">
                        <div>
                          <p className="text-sm font-medium text-foreground">Season {seasonNum}</p>
                          <p className="text-[11px] text-muted-foreground">{count} episode review{count !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                      <div className="shrink-0 flex items-center">
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Series-Level Community Reviews */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">
              Series Reviews
              <span className="text-sm font-normal text-muted-foreground ml-2">({seriesReviews.length})</span>
            </h2>
            {seriesReviews.length > 1 && (
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
                            <div className="flex items-center gap-1 text-amber-500 text-sm">
                              <Star className="h-3.5 w-3.5 fill-current" />
                              <span>{review.rating}/10</span>
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
              <p className="text-muted-foreground text-sm mb-2">No series reviews yet.</p>
              {user && (
                <Button variant="outline" size="sm" onClick={() => setShowLogModal(true)}>Be the first to review</Button>
              )}
            </div>
          )}
        </div>

        {/* TMDB Reviews */}
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
                          <div className="flex items-center gap-1 text-amber-500 text-sm">
                            <Star className="h-3.5 w-3.5 fill-current" />
                            <span>{review.author_details.rating}/10</span>
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

      {showLogModal && tvShow && (
        <LogMediaModal
          isOpen={showLogModal}
          onClose={() => { setShowLogModal(false); refetchCommunityReviews(); }}
          mediaId={tvId}
          mediaTitle={tvShow.name}
          mediaPoster={tvShow.poster_path}
          mediaType="tv"
        />
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

export default TVShowReviews;
