import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Tv, MessageCircle, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { MobileHeader } from "@/components/MobileHeader";
import { DesktopHeader } from "@/components/DesktopHeader";
import { Navigation } from "@/components/Navigation";
import { tmdbService, TVShow } from "@/lib/tmdb";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

const IMAGE_BASE = 'https://image.tmdb.org/t/p/';

const SeasonReviews = () => {
  const { id, seasonNumber } = useParams<{ id: string; seasonNumber: string }>();
  const [tvShow, setTVShow] = useState<TVShow | null>(null);
  const [seasonData, setSeasonData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const tvId = Number(id);
  const seasonNum = Number(seasonNumber);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const [show, season] = await Promise.all([
          tmdbService.getTVShowDetails(tvId),
          tmdbService.getSeasonDetails(tvId, seasonNum),
        ]);
        setTVShow(show);
        setSeasonData(season);
      } catch (error) {
        console.error('Failed to load:', error);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id, tvId, seasonNum]);

  // Fetch episode review counts for this season
  const { data: episodeReviewCounts } = useQuery({
    queryKey: ['season-episode-review-counts', tvId, seasonNum],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_reviews')
        .select('episode_number')
        .eq('movie_id', tvId)
        .eq('media_type', 'tv')
        .eq('season_number', seasonNum)
        .not('episode_number', 'is', null);

      if (error) throw error;

      const counts = new Map<number, number>();
      for (const r of data) {
        if (r.episode_number != null) {
          counts.set(r.episode_number, (counts.get(r.episode_number) || 0) + 1);
        }
      }
      return counts;
    },
    enabled: !!tvId && !!seasonNum,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background 2xl:pb-12">
        <DesktopHeader />
        <MobileHeader title="Loading..." />
        <div className="px-4 py-6 space-y-3 md:max-w-7xl md:mx-auto md:px-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-lg" />)}
        </div>
        <Navigation />
      </div>
    );
  }

  if (!tvShow || !seasonData) {
    return (
      <div className="min-h-screen bg-background 2xl:pb-12">
        <DesktopHeader />
        <MobileHeader title="Not Found" />
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Season not found</p>
        </div>
        <Navigation />
      </div>
    );
  }

  
  const seasonPosterUrl = tmdbService.getPosterUrl(seasonData.poster_path, 'w500');
  
  const getSeasonBackdrop = () => {
    if (seasonData.backdrop_path) {
      return tmdbService.getBackdropUrl(seasonData.backdrop_path, 'original');
    }
    if (tvShow.images?.backdrops && tvShow.images.backdrops.length > 0) {
      const sortedBackdrops = tvShow.images.backdrops
        .sort((a: any, b: any) => b.vote_average - a.vote_average);
      const backdropIndex = (seasonNum - 1) % sortedBackdrops.length;
      return tmdbService.getBackdropUrl(sortedBackdrops[backdropIndex].file_path, 'original');
    }
    return tmdbService.getBackdropUrl(tvShow.backdrop_path, 'original');
  };
  const backdropUrl = getSeasonBackdrop();

  const episodes = seasonData.episodes || [];
  // Only show episodes that have reviews
  const episodesWithReviews = episodes.filter(
    (ep: any) => episodeReviewCounts?.has(ep.episode_number)
  );

  return (
    <div className="min-h-screen bg-background pb-32 2xl:pb-12">
      <DesktopHeader />
      <MobileHeader title={`Season ${seasonNum} Reviews`} />

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
            <img src={seasonPosterUrl} alt={`Season ${seasonNum}`} className="w-24 h-36 rounded-lg shadow-lg object-cover border-2 border-white/20" />
          </div>
          <div className="absolute bottom-6 left-32 right-4 z-30">
            <span className="text-xs text-white/80">{tvShow.name}</span>
            <h1 className="font-bold text-white text-lg leading-tight">
              Season {seasonNum} · Episode Reviews
            </h1>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6 md:max-w-7xl md:mx-auto md:px-6">
        <h2 className="text-lg font-semibold text-foreground uppercase tracking-wider">
          Episodes ({episodesWithReviews.length})
        </h2>

        {episodesWithReviews.length > 0 ? (
          <div className="space-y-3">
            {episodesWithReviews.map((ep: any) => {
              const reviewCount = episodeReviewCounts?.get(ep.episode_number) || 0;
              const stillUrl = ep.still_path
                ? `${IMAGE_BASE}w300${ep.still_path}`
                : null;

              return (
                <Link
                  key={ep.episode_number}
                  to={`/tv/${tvId}/season/${seasonNum}/episode/${ep.episode_number}`}
                  className="block"
                >
                  <Card className="p-3 hover:bg-accent/5 transition-colors">
                    <div className="flex gap-3">
                      <div className="w-24 h-14 rounded overflow-hidden bg-muted shrink-0 relative">
                        {stillUrl ? (
                          <img src={stillUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Tv className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        <div className="absolute top-0.5 left-0.5 bg-black/70 text-white text-[10px] font-bold px-1 rounded">
                          {ep.episode_number}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          S{seasonNum}E{ep.episode_number} · {ep.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {ep.air_date && new Date(ep.air_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                          {ep.runtime && ` · ${ep.runtime}m`}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <MessageCircle className="h-3 w-3 text-muted-foreground" />
                          <span className="text-[11px] text-muted-foreground">
                            {reviewCount} review{reviewCount !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                      <div className="shrink-0 flex items-center">
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        ) : (
          <Card className="p-8 text-center border-dashed">
            <MessageCircle className="h-14 w-14 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No episode reviews for this season yet.</p>
          </Card>
        )}
      </div>

      <Navigation />
    </div>
  );
};

export default SeasonReviews;
