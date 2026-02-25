import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Star, User, AlertTriangle, ChevronDown, ChevronUp, ArrowUpDown, ChevronRight, Tv, Play, Heart, Plus, BookOpen, Eye, MessageCircle, MoreHorizontal, Flame } from "lucide-react";
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
import { tmdbService, TVShow, Review } from "@/lib/tmdb";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserStateContext } from "@/contexts/UserStateContext";
import { useTrailerContext } from "@/contexts/TrailerContext";
import { ReviewLikes } from "@/components/ReviewLikes";
import { format } from "date-fns";


interface EpisodeRatingEntry {
  tv_id: number;
  season_number: number | null;
  episode_number: number | null;
  rating: number | null;
  user_id: string;
  watched_date: string;
}

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
  const navigate = useNavigate();
  const [tvShow, setTVShow] = useState<TVShow | null>(null);
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
  

  const tvId = Number(id);

  // Fetch ALL users' episode ratings for this TV show
  const { data: allEpisodeRatings } = useQuery({
    queryKey: ['all-episode-ratings', tvId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tv_diary')
        .select('tv_id, season_number, episode_number, rating, user_id, watched_date')
        .eq('tv_id', tvId)
        .not('rating', 'is', null)
        .not('episode_number', 'is', null);
      if (error) throw error;
      return data as EpisodeRatingEntry[];
    },
    enabled: !!tvId,
  });

  const isTVShowLiked = isLiked(tvId);
  const isTVShowInWatchlist = isInWatchlist(tvId);
  const isTVShowWatched = isWatched(tvId);
  const userRating = getRating(tvId);

  const requireAuth = (action: () => void) => {
    if (!user) { navigate('/auth'); return; }
    action();
  };

  useEffect(() => {
    const loadTVShow = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const data = await tmdbService.getTVShowDetails(tvId);
        setTVShow(data);
        const trailer = data.videos?.results.find(v => v.type === 'Trailer' && v.site === 'YouTube');
        if (trailer) setTrailerKey(trailer.key);
      } catch (error) {
        console.error('Failed to load TV show:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadTVShow();
  }, [id, tvId]);

  const { data: tmdbReviews } = useQuery({
    queryKey: ['tv-reviews', tvId],
    queryFn: async () => {
      const response = await tmdbService.getTVShowReviews(tvId);
      return response.results;
    },
    enabled: !!tvId
  });

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

  const seriesReviews = allCommunityReviews?.filter(r => r.episode_number == null) || [];
  const episodeReviews = allCommunityReviews?.filter(r => r.episode_number != null) || [];

  const seasonReviewCounts = new Map<number, number>();
  for (const r of episodeReviews) {
    const s = r.season_number ?? 0;
    seasonReviewCounts.set(s, (seasonReviewCounts.get(s) || 0) + 1);
  }

  // Calculate season ratings from ALL users' tv_diary episode ratings
  const getSeasonRating = (seasonNumber: number) => {
    const ratings = (allEpisodeRatings || [])
      .filter(entry => entry.season_number === seasonNumber)
      .map(entry => entry.rating as number);
    
    if (ratings.length === 0) return null;
    return Math.round(ratings.reduce((a, b) => a + b, 0) / ratings.length);
  };

  // Get all episode ratings for a season (from ALL users)
  const getSeasonEpisodeRatings = (seasonNumber: number) => {
    return (allEpisodeRatings || [])
      .filter(entry => entry.season_number === seasonNumber)
      .sort((a, b) => (a.episode_number || 0) - (b.episode_number || 0));
  };

  // Merge seasons from reviews and ALL users' diary data
  const allSeasonNumbers = new Set<number>();
  for (const [s] of seasonReviewCounts) allSeasonNumbers.add(s);
  (allEpisodeRatings || [])
    .filter(entry => entry.season_number !== null && entry.season_number > 0)
    .forEach(entry => allSeasonNumbers.add(entry.season_number!));
  const allSeasonsWithData = [...allSeasonNumbers].sort((a, b) => a - b);

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
  const logoUrl = tvShow.images?.logos?.[0]?.file_path 
    ? tmdbService.getImageUrl(tvShow.images.logos[0].file_path, 'w500')
    : null;
  const releaseYear = tvShow.first_air_date ? new Date(tvShow.first_air_date).getFullYear() : 'TBA';
  const genres = tvShow.genres?.map(g => g.name).join(', ') || 'Unknown';
  const sortedCommunityReviews = getSortedReviews();

  const handleWatchTrailer = () => {
    if (trailerKey) {
      setGlobalTrailerKey(trailerKey);
      setMovieTitle(tvShow.name);
      setIsTrailerOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-32 md:pb-12">
      <DesktopHeader />
      <MobileHeader title={tvShow.name} />

      {/* Hero Section - Matching TVShowDetail */}
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
            <img src={posterUrl} alt={tvShow.name} className="w-24 h-36 iphone-65:w-28 iphone-65:h-42 iphone-67:w-32 iphone-67:h-48 rounded-lg shadow-cinematic object-cover border-2 border-white/20" />
          </div>
          <div className="absolute bottom-6 left-32 right-4 z-30 iphone-65:left-36 iphone-67:left-40">
            {logoUrl && (
              <div className="mb-3">
                <img src={logoUrl} alt={`${tvShow.name} logo`} className="h-8 iphone-65:h-10 iphone-67:h-12 max-w-36 iphone-65:max-w-44 iphone-67:max-w-48 object-contain" />
              </div>
            )}
            <div className="flex items-center space-x-2 iphone-65:space-x-3 mb-1 flex-wrap gap-y-1">
              <span className="text-cinema-gold font-semibold text-xs iphone-65:text-sm">TMDB {tvShow.vote_average.toFixed(1)}</span>
              <span className="text-white/80 text-xs iphone-65:text-sm">{releaseYear}</span>
              <span className="text-white/80 text-xs iphone-65:text-sm">TV Series</span>
              {tvShow.number_of_seasons && (
                <span className="text-white/80 text-xs iphone-65:text-sm">{tvShow.number_of_seasons} Season{tvShow.number_of_seasons > 1 ? 's' : ''}</span>
              )}
            </div>
            {!logoUrl && (
              <h1 className="font-cinematic text-white mb-2 tracking-wide text-lg iphone-65:text-xl leading-tight">{tvShow.name}</h1>
            )}
            <p className="text-white/70 mb-3 text-xs iphone-65:text-sm">{genres}</p>
          </div>
        </div>
      </div>

      {/* Synopsis Section */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 -mt-4 relative z-30">
        <div className="bg-black/40 backdrop-blur-sm rounded-lg p-4 border border-white/10">
          <p className="text-white leading-relaxed text-sm line-clamp-3">{tvShow.overview || "No synopsis available."}</p>
          {tvShow.overview && tvShow.overview.length > 120 && (
            <button onClick={() => setShowSynopsis(true)} className="mt-2 inline-flex items-center gap-1 text-cinema-gold hover:text-cinema-gold/80 transition-colors text-sm font-semibold">
              <MoreHorizontal className="h-4 w-4" />Read More
            </button>
          )}
        </div>
      </div>

      {/* Action Section */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6">
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
        <div className="grid grid-cols-6 gap-1.5 mb-4 md:mb-6">
          <Button variant="outline" className={`flex flex-col items-center gap-0.5 h-auto py-2 md:py-3 border-border hover:bg-card touch-manipulation ${isTVShowInWatchlist ? 'bg-cinema-gold border-cinema-gold text-cinema-black' : ''}`} onClick={() => requireAuth(() => toggleWatchlist(tvId, tvShow.name, posterUrl, 'tv'))}>
            <Plus className="h-4 w-4 md:h-5 md:w-5" /><span className="text-[10px] md:text-xs">Watchlist</span>
          </Button>
          <Button variant="outline" className={`flex flex-col items-center gap-0.5 h-auto py-2 md:py-3 border-border hover:bg-card touch-manipulation ${isTVShowLiked ? 'bg-cinema-red border-cinema-red text-white' : ''}`} onClick={() => requireAuth(() => toggleLike(tvId, tvShow.name, posterUrl, 'tv'))}>
            <Heart className={`h-4 w-4 md:h-5 md:w-5 ${isTVShowLiked ? 'fill-current' : ''}`} /><span className="text-[10px] md:text-xs">Favorites</span>
          </Button>
          <Button variant="outline" className={`flex flex-col items-center gap-0.5 h-auto py-2 md:py-3 border-border hover:bg-card touch-manipulation ${isTVShowWatched ? 'bg-green-600 border-green-600 text-white' : ''}`} onClick={() => requireAuth(() => markAsWatched(tvId, tvShow.name, posterUrl, 'tv'))}>
            <Eye className={`h-4 w-4 md:h-5 md:w-5 ${isTVShowWatched ? 'fill-current' : ''}`} /><span className="text-[10px] md:text-xs">Watched</span>
          </Button>
          <Button variant="outline" className="flex flex-col items-center gap-0.5 h-auto py-2 md:py-3 border-border hover:bg-card touch-manipulation" onClick={() => requireAuth(() => setShowLogModal(true))}>
            <BookOpen className="h-4 w-4 md:h-5 md:w-5" /><span className="text-[10px] md:text-xs">Log</span>
          </Button>
          <Button variant="outline" className="flex flex-col items-center gap-0.5 h-auto py-2 md:py-3 border-border hover:bg-card touch-manipulation bg-primary/10 border-primary/30" disabled>
            <MessageCircle className="h-4 w-4 md:h-5 md:w-5" /><span className="text-[10px] md:text-xs">Reviews</span>
          </Button>
          {user && (
            <AddToListButton movie={{ id: tvId, title: tvShow.name, poster: tvShow.poster_path || undefined }} variant="outline" size="sm" className="flex flex-col items-center gap-0.5 h-auto py-2 md:py-3 border-border hover:bg-card touch-manipulation" />
          )}
        </div>

        {/* Rating Comparison Card */}
        <RatingComparisonCard
          mediaId={tvId}
          mediaType="tv"
          tmdbRating={tvShow.vote_average}
          userRating={userRating}
          onRatingChange={(rating) => requireAuth(() => setRating(tvId, rating, tvShow.name, posterUrl, 'tv'))}
          mediaTitle={tvShow.name}
          mediaPoster={tvShow.poster_path}
        />
      </div>

        {/* Reviews Content */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 space-y-6">
        {/* Community Ratings by Season - shows all users' scored episodes */}
        {allSeasonsWithData.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Ratings by Season</h2>
            {allSeasonsWithData.map((seasonNum) => {
              const seasonRating = getSeasonRating(seasonNum);
              const seasonEpRatings = getSeasonEpisodeRatings(seasonNum);
              
              // Aggregate by episode: calculate average rating and count per episode
              const episodeMap = new Map<number, { totalRating: number; count: number }>();
              for (const ep of seasonEpRatings) {
                if (ep.episode_number == null) continue;
                const existing = episodeMap.get(ep.episode_number) || { totalRating: 0, count: 0 };
                existing.totalRating += ep.rating as number;
                existing.count += 1;
                episodeMap.set(ep.episode_number, existing);
              }
              const aggregatedEpisodes = [...episodeMap.entries()]
                .sort(([a], [b]) => a - b)
                .map(([epNum, data]) => ({
                  episode_number: epNum,
                  avgRating: Math.round((data.totalRating / data.count) * 10) / 10,
                  ratingCount: data.count,
                }));

              const season = tvShow.seasons?.find(s => s.season_number === seasonNum);
              const seasonPoster = season?.poster_path
                ? tmdbService.getPosterUrl(season.poster_path, 'w500')
                : posterUrl;

              return (
                <div key={seasonNum} className="bg-card rounded-xl border border-border overflow-hidden">
                  {/* Season Header */}
                  <Link to={`/tv/${tvId}/season/${seasonNum}/reviews`} className="block">
                    <div className="p-3 bg-muted/30 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-12 rounded overflow-hidden bg-muted shrink-0">
                          {seasonPoster ? (
                            <img src={seasonPoster} alt={`Season ${seasonNum}`} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Tv className="h-3 w-3 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div>
                          <span className="font-medium text-sm">Season {seasonNum}</span>
                          <p className="text-[11px] text-muted-foreground">
                            {aggregatedEpisodes.length} ep{aggregatedEpisodes.length !== 1 ? 's' : ''} rated
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {seasonRating && (
                          <span className="px-2 py-0.5 bg-cinema-red/20 rounded text-cinema-red text-xs font-semibold flex items-center gap-1">
                            <Flame className="h-3 w-3 fill-current" />
                            {seasonRating}/5
                          </span>
                        )}
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </Link>

                  {/* Episode List */}
                  {aggregatedEpisodes.length > 0 && (
                    <div className="divide-y divide-border">
                      {aggregatedEpisodes.map(ep => (
                        <div key={ep.episode_number} className="p-3 flex items-center justify-between">
                          <div>
                            <span className="text-sm">Episode {ep.episode_number}</span>
                            <p className="text-xs text-muted-foreground">
                              {ep.ratingCount} rating{ep.ratingCount !== 1 ? 's' : ''}
                            </p>
                          </div>
                          <span className="px-2 py-0.5 bg-cinema-red/20 rounded text-cinema-red text-xs font-semibold flex items-center gap-1">
                            <Flame className="h-3 w-3 fill-current" />
                            {ep.avgRating}/5
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Series-Level Community Reviews */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">
              Series Reviews <span className="text-sm font-normal text-muted-foreground ml-2">({seriesReviews.length})</span>
            </h2>
            {seriesReviews.length > 1 && (
              <Button variant="outline" size="sm" onClick={() => setShowSortSheet(true)} className="h-9 px-3 rounded-lg gap-1.5">
                <ArrowUpDown className="h-3.5 w-3.5" />
                <span className="text-xs">{sortBy === 'recent' ? 'Recent' : sortBy === 'oldest' ? 'Oldest' : sortBy === 'highest' ? 'Highest' : 'Lowest'}</span>
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
                              <Star className="h-3.5 w-3.5 fill-current" /><span>{review.rating}/10</span>
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
              {user && <Button variant="outline" size="sm" onClick={() => setShowLogModal(true)}>Be the first to review</Button>}
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
      {showLogModal && tvShow && (
        <LogMediaModal
          isOpen={showLogModal}
          onClose={() => { setShowLogModal(false); refetchCommunityReviews(); }}
          mediaId={tvId}
          mediaTitle={tvShow.name}
          mediaPoster={tvShow.poster_path}
          mediaType="tv"
          initialRating={userRating}
        />
      )}

      {showSynopsis && (
        <SynopsisModal isOpen={showSynopsis} onClose={() => setShowSynopsis(false)} title={tvShow.name} synopsis={tvShow.overview || ""} posterUrl={posterUrl} />
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
