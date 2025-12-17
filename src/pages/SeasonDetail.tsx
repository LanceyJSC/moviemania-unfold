import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Calendar, Clock, Star, Play, Eye, BookOpen, Check, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileHeader } from "@/components/MobileHeader";
import { Navigation } from "@/components/Navigation";
import { LogMediaModal } from "@/components/LogMediaModal";
import { RatingInput } from "@/components/RatingInput";
import { WatchProviders } from "@/components/WatchProviders";
import { tmdbService, TVShow as TMDBTVShow } from "@/lib/tmdb";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useDiary } from "@/hooks/useDiary";

interface Episode {
  id: number;
  name: string;
  overview: string;
  still_path: string | null;
  air_date: string;
  episode_number: number;
  runtime: number | null;
  vote_average: number;
}

interface Season {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  air_date: string;
  episode_count: number;
  season_number: number;
  episodes: Episode[];
  images?: {
    backdrops: { file_path: string; vote_average: number }[];
  };
}


const SeasonDetail = () => {
  const { id, seasonNumber } = useParams<{ id: string; seasonNumber: string }>();
  const navigate = useNavigate();
  const [season, setSeason] = useState<Season | null>(null);
  const [tvShow, setTVShow] = useState<TMDBTVShow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [watchedEpisodes, setWatchedEpisodes] = useState<Set<string>>(new Set());
  const [episodeRatings, setEpisodeRatings] = useState<Record<string, number>>({});
  const [seasonRating, setSeasonRating] = useState<number>(0);
  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);
  const { user } = useAuth();
  const { tvDiary, refetchTVDiary } = useDiary();

  const requireAuth = (action: () => void) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    action();
  };

  useEffect(() => {
    const loadSeasonDetails = async () => {
      if (!id || !seasonNumber) return;
      
      setIsLoading(true);
      try {
        const tvShowData = await tmdbService.getTVShowDetails(Number(id));
        setTVShow(tvShowData);

        const seasonData = await tmdbService.getSeasonDetails(Number(id), Number(seasonNumber)) as Season;
        setSeason(seasonData);
      } catch (error) {
        console.error('Failed to load season details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSeasonDetails();
  }, [id, seasonNumber]);

  // Track which episodes are watched and their ratings from diary
  // Season rating is automatically calculated from episode ratings average
  useEffect(() => {
    if (!id || !seasonNumber) return;
    
    const tvId = Number(id);
    const seasonNum = Number(seasonNumber);
    
    const watched = new Set<string>();
    const ratings: Record<string, number> = {};
    const episodeRatingValues: number[] = [];
    
    tvDiary.forEach(entry => {
      if (entry.tv_id === tvId && entry.season_number === seasonNum) {
        if (entry.episode_number) {
          // Episode-level entry
          const key = `${seasonNum}-${entry.episode_number}`;
          watched.add(key);
          if (entry.rating) {
            ratings[key] = entry.rating;
            episodeRatingValues.push(entry.rating);
          }
        }
      }
    });
    
    setWatchedEpisodes(watched);
    setEpisodeRatings(ratings);
    
    // Calculate average from episode ratings
    if (episodeRatingValues.length > 0) {
      const average = Math.round(episodeRatingValues.reduce((a, b) => a + b, 0) / episodeRatingValues.length);
      setSeasonRating(average);
    } else {
      setSeasonRating(0);
    }
  }, [id, seasonNumber, tvDiary]);

  const handleRateSeason = async (rating: number) => {
    if (!user || !tvShow || !season) return;

    // RatingInput passes 0 when clearing (clicking same rating)
    const newRating = rating === 0 ? null : rating;

    // Check if season-level entry exists (episode_number is null)
    const { data: existingEntry } = await supabase
      .from('tv_diary')
      .select('id')
      .eq('user_id', user.id)
      .eq('tv_id', Number(id))
      .eq('season_number', season.season_number)
      .is('episode_number', null)
      .maybeSingle();

    if (existingEntry) {
      if (newRating === null) {
        // Delete the entry if removing rating
        const { error } = await supabase
          .from('tv_diary')
          .delete()
          .eq('id', existingEntry.id)
          .eq('user_id', user.id);
        
        if (error) {
          console.error('Failed to delete season rating:', error);
          return;
        }
      } else {
        // Update existing entry - include user_id for RLS
        const { error } = await supabase
          .from('tv_diary')
          .update({ rating: newRating })
          .eq('id', existingEntry.id)
          .eq('user_id', user.id);
        
        if (error) {
          console.error('Failed to update season rating:', error);
          return;
        }
      }
    } else if (newRating !== null) {
      // Create new season-level entry
      const { error } = await supabase
        .from('tv_diary')
        .insert({
          user_id: user.id,
          tv_id: Number(id),
          tv_title: tvShow.name,
          tv_poster: tvShow.poster_path,
          season_number: season.season_number,
          episode_number: null,
          runtime: 0, // Season entries don't track runtime
          rating: newRating,
          watched_date: new Date().toISOString().split('T')[0]
        });
      
      if (error) {
        console.error('Failed to add season rating:', error);
        return;
      }
    }

    setSeasonRating(newRating || 0);
    refetchTVDiary();
  };

  const isEpisodeWatched = (episodeNumber: number) => {
    return watchedEpisodes.has(`${seasonNumber}-${episodeNumber}`);
  };

  const handleMarkEpisodeWatched = async (episode: Episode) => {
    if (!user || !tvShow || !season) return;

    const key = `${season.season_number}-${episode.episode_number}`;
    
    // Check if entry already exists in database
    const { data: existingEntry, error: checkError } = await supabase
      .from('tv_diary')
      .select('id')
      .eq('user_id', user.id)
      .eq('tv_id', Number(id))
      .eq('season_number', season.season_number)
      .eq('episode_number', episode.episode_number)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (checkError) {
      console.error('Error checking episode entry:', checkError);
      return;
    }
    
    if (existingEntry) {
      // Entry exists - remove it (toggle off)
      const { error: deleteError } = await supabase
        .from('tv_diary')
        .delete()
        .eq('user_id', user.id)
        .eq('tv_id', Number(id))
        .eq('season_number', season.season_number)
        .eq('episode_number', episode.episode_number);
      
      if (deleteError) {
        console.error('Error deleting episode entry:', deleteError);
        return;
      }
      
      setWatchedEpisodes(prev => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
      setEpisodeRatings(prev => {
        const updated = { ...prev };
        delete updated[key];
        return updated;
      });
    } else {
      // No entry exists - create one
      const { error: insertError } = await supabase
        .from('tv_diary')
        .insert({
          user_id: user.id,
          tv_id: Number(id),
          tv_title: tvShow.name,
          tv_poster: tvShow.poster_path,
          season_number: season.season_number,
          episode_number: episode.episode_number,
          runtime: episode.runtime || 45,
          watched_date: new Date().toISOString().split('T')[0]
        });
      
      if (insertError) {
        console.error('Error inserting episode entry:', insertError);
        return;
      }
      
      setWatchedEpisodes(prev => new Set(prev).add(key));
    }
    
    refetchTVDiary();
  };

  const handleLogEpisode = (episode: Episode) => {
    setSelectedEpisode(episode);
    setShowLogModal(true);
  };

  const handleRateEpisode = async (episode: Episode, rating: number) => {
    if (!user || !tvShow || !season) return;

    const key = `${season.season_number}-${episode.episode_number}`;
    
    // RatingInput passes 0 when clearing (clicking same rating)
    const newRating = rating === 0 ? null : rating;

    // Check if entry exists
    const { data: existingEntry } = await supabase
      .from('tv_diary')
      .select('id')
      .eq('user_id', user.id)
      .eq('tv_id', Number(id))
      .eq('season_number', season.season_number)
      .eq('episode_number', episode.episode_number)
      .maybeSingle();

    if (existingEntry) {
      // Update existing entry - include user_id for RLS
      const { error } = await supabase
        .from('tv_diary')
        .update({ rating: newRating })
        .eq('id', existingEntry.id)
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Failed to update episode rating:', error);
        return;
      }
    } else {
      // Create new entry with rating
      const { error } = await supabase
        .from('tv_diary')
        .insert({
          user_id: user.id,
          tv_id: Number(id),
          tv_title: tvShow.name,
          tv_poster: tvShow.poster_path,
          season_number: season.season_number,
          episode_number: episode.episode_number,
          runtime: episode.runtime || 45,
          rating: newRating,
          watched_date: new Date().toISOString().split('T')[0]
        });
      
      if (error) {
        console.error('Failed to add episode rating:', error);
        return;
      }
      
      // Also mark as watched
      setWatchedEpisodes(prev => new Set(prev).add(key));
    }

    // Update local state
    setEpisodeRatings(prev => {
      if (newRating === null) {
        const updated = { ...prev };
        delete updated[key];
        return updated;
      }
      return { ...prev, [key]: newRating };
    });
    
    // Refetch diary to sync state
    refetchTVDiary();
  };

  const getEpisodeRating = (episodeNumber: number) => {
    return episodeRatings[`${seasonNumber}-${episodeNumber}`] || 0;
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

  if (!season || !tvShow) {
    return (
      <div className="min-h-screen bg-background">
        <MobileHeader title="Season Not Found" />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Season not found</h1>
            <Link to={`/tv/${id}`}>
              <Button>Back to TV Show</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const seasonPosterUrl = tmdbService.getPosterUrl(season.poster_path, 'w500');
  const watchedCount = watchedEpisodes.size;
  const totalEpisodes = season.episodes?.length || 0;
  
  const getSeasonBackdrop = () => {
    if (season.backdrop_path) {
      return tmdbService.getBackdropUrl(season.backdrop_path, 'original');
    }
    
    if (tvShow.images?.backdrops && tvShow.images.backdrops.length > 0) {
      const sortedBackdrops = tvShow.images.backdrops
        .sort((a, b) => b.vote_average - a.vote_average);
      
      const backdropIndex = (season.season_number - 1) % sortedBackdrops.length;
      const selectedBackdrop = sortedBackdrops[backdropIndex];
      
      return tmdbService.getBackdropUrl(selectedBackdrop.file_path, 'original');
    }
    
    return tmdbService.getBackdropUrl(tvShow.backdrop_path, 'original');
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      <MobileHeader title={season.name} />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden h-[50vh] rounded-b-2xl">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: `url(${getSeasonBackdrop()})`,
            backgroundColor: 'hsl(var(--background))'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-cinema-black/40 via-cinema-black/20 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-cinema-black/50 via-transparent to-transparent" />
        </div>

        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background via-background/90 to-transparent pointer-events-none z-20" />

        <div className="absolute bottom-6 left-4 z-30">
          <img 
            src={seasonPosterUrl} 
            alt={season.name}
            className="w-24 h-36 rounded-lg shadow-cinematic object-cover border-2 border-white/20"
          />
        </div>

        <div className="absolute bottom-6 left-32 right-4 z-30">
          <div className="flex items-center space-x-2 mb-1 flex-wrap gap-y-1">
            <span className="text-white/80 text-xs">{tvShow.name}</span>
            {season.air_date && (
              <span className="text-white/80 text-xs">
                {new Date(season.air_date).getFullYear()}
              </span>
            )}
            <span className="text-white/80 text-xs">
              {totalEpisodes} episode{totalEpisodes !== 1 ? 's' : ''}
            </span>
          </div>

          <h1 className="font-cinematic text-white mb-2 tracking-wide text-lg leading-tight">
            {season.name}
          </h1>
          
          {/* Progress indicator */}
          {user && (
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden max-w-32">
                <div 
                  className="h-full bg-cinema-gold transition-all duration-300"
                  style={{ width: `${totalEpisodes > 0 ? (watchedCount / totalEpisodes) * 100 : 0}%` }}
                />
              </div>
              <span className="text-white/80 text-xs">
                {watchedCount}/{totalEpisodes} watched
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Season Overview */}
      {season.overview && (
        <div className="container mx-auto px-4 -mt-4 relative z-30 mb-6">
          <div className="bg-black/40 backdrop-blur-sm rounded-lg p-4 border border-white/10">
            <p className="text-white leading-relaxed text-sm">
              {season.overview}
            </p>
          </div>
        </div>
      )}

      {/* Where to Watch */}
      <div className="container mx-auto px-4 mb-6">
        <WatchProviders mediaId={Number(id)} mediaType="tv" />
      </div>

      {/* Season Rating - Auto-calculated from episode ratings - Always visible */}
      <div className="container mx-auto px-4 mb-6">
        <div className="bg-card/50 rounded-lg p-4 border border-border/50">
          <div className="flex flex-col gap-3">
            <div>
              <h3 className="font-semibold text-foreground">Season Rating</h3>
              <p className="text-xs text-muted-foreground">
                {Object.keys(episodeRatings).length > 0 
                  ? `Average of ${Object.keys(episodeRatings).length} rated episode${Object.keys(episodeRatings).length !== 1 ? 's' : ''}`
                  : 'Rate episodes to calculate season average'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {seasonRating > 0 ? (
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 fill-cinema-gold text-cinema-gold" />
                  <span className="text-lg text-cinema-gold font-medium">
                    {seasonRating}/10
                  </span>
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">No ratings yet</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Episodes Section */}
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-cinematic text-foreground tracking-wide">
            EPISODES ({totalEpisodes})
          </h2>
        </div>

        <div className="space-y-4">
          {season.episodes?.map((episode) => {
            const watched = isEpisodeWatched(episode.episode_number);
            
            return (
              <div key={episode.id} className="group">
                <div className={`p-3 bg-card/30 rounded-lg border transition-all duration-200 hover:bg-card/50 ${
                  watched ? 'border-cinema-gold/50 bg-cinema-gold/5' : 'border-border/50 hover:border-cinema-red/50'
                }`}>
                  {/* Episode Header - Screenshot + Title Row */}
                  <div className="flex gap-3 mb-3">
                    {/* Episode Screenshot - Clickable to Episode Detail */}
                    <Link 
                      to={`/tv/${id}/season/${seasonNumber}/episode/${episode.episode_number}`}
                      className="flex-shrink-0 touch-manipulation"
                    >
                      <div className="relative w-20 h-12 rounded overflow-hidden bg-muted">
                        {episode.still_path ? (
                          <img 
                            src={tmdbService.getImageUrl(episode.still_path, 'w300')}
                            alt={episode.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <Play className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        <div className="absolute top-0.5 left-0.5 bg-black/80 text-white text-[10px] px-1 py-0.5 rounded">
                          {episode.episode_number}
                        </div>
                        {watched && (
                          <div className="absolute inset-0 bg-cinema-gold/20 flex items-center justify-center">
                            <Check className="h-5 w-5 text-cinema-gold" />
                          </div>
                        )}
                      </div>
                    </Link>

                    {/* Episode Title & Meta */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <Link 
                          to={`/tv/${id}/season/${seasonNumber}/episode/${episode.episode_number}`}
                          className="touch-manipulation flex-1 min-w-0"
                        >
                          <h3 className={`font-semibold text-sm transition-colors line-clamp-2 ${
                            watched ? 'text-cinema-gold' : 'text-foreground group-hover:text-cinema-red'
                          }`}>
                            {episode.name}
                          </h3>
                        </Link>
                        {episode.vote_average > 0 && (
                          <div className="flex items-center gap-0.5 text-cinema-gold text-xs flex-shrink-0">
                            <Star className="h-3 w-3 fill-current" />
                            <span>{episode.vote_average.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 text-muted-foreground text-xs mt-1">
                        {episode.air_date && (
                          <span>{new Date(episode.air_date).toLocaleDateString()}</span>
                        )}
                        {episode.runtime && (
                          <span className="flex items-center gap-0.5">
                            <Clock className="h-3 w-3" />
                            {episode.runtime}m
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Episode Description */}
                  <p className="text-muted-foreground text-xs line-clamp-2 leading-relaxed mb-3">
                    {episode.overview || "No description available."}
                  </p>

                  {/* Episode Rating */}
                  <div className="flex items-center gap-2 mb-3 overflow-x-auto">
                    <span className="text-xs text-muted-foreground flex-shrink-0">Rate:</span>
                    <RatingInput 
                      value={getEpisodeRating(episode.episode_number)} 
                      onChange={(rating) => requireAuth(() => handleRateEpisode(episode, rating))}
                      size="sm"
                    />
                    {getEpisodeRating(episode.episode_number) > 0 && (
                      <span className="text-xs text-cinema-gold flex-shrink-0">
                        {getEpisodeRating(episode.episode_number)}/10
                      </span>
                    )}
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={watched ? "default" : "outline"}
                      className={`text-xs h-9 px-2 flex-1 touch-manipulation active:scale-95 ${
                        watched 
                          ? 'bg-cinema-gold hover:bg-cinema-gold/90 text-cinema-black' 
                          : 'hover:border-cinema-gold hover:text-cinema-gold'
                      }`}
                      onClick={() => requireAuth(() => handleMarkEpisodeWatched(episode))}
                    >
                      <Eye className="h-3.5 w-3.5 mr-1" />
                      {watched ? 'Watched' : 'Mark'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-9 px-2 flex-1 hover:border-cinema-red hover:text-cinema-red touch-manipulation active:scale-95"
                      onClick={() => requireAuth(() => handleLogEpisode(episode))}
                    >
                      <BookOpen className="h-3.5 w-3.5 mr-1" />
                      Log
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-9 px-2 flex-1 hover:border-foreground hover:text-foreground touch-manipulation active:scale-95"
                      asChild
                    >
                      <Link to={`/tv/${id}/season/${seasonNumber}/episode/${episode.episode_number}`}>
                        <MessageCircle className="h-3.5 w-3.5 mr-1" />
                        Reviews
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Log Modal for Episode */}
      {selectedEpisode && tvShow && season && (
        <LogMediaModal
          isOpen={showLogModal}
          onClose={() => {
            setShowLogModal(false);
            setSelectedEpisode(null);
          }}
          mediaId={Number(id)}
          mediaTitle={`${tvShow.name} - S${season.season_number}E${selectedEpisode.episode_number}`}
          mediaPoster={tvShow.poster_path}
          mediaType="tv"
          seasonNumber={season.season_number}
          episodeNumber={selectedEpisode.episode_number}
        />
      )}

      <Navigation />
    </div>
  );
};

export default SeasonDetail;