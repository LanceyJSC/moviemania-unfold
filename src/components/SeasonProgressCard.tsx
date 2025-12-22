import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Eye, Check, Loader2, EyeOff, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { tmdbService } from '@/lib/tmdb';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Season {
  id: number;
  name: string;
  poster_path: string | null;
  season_number: number;
  episode_count: number;
  air_date?: string;
}

interface SeasonProgressCardProps {
  tvShowId: number;
  tvShowName: string;
  tvShowPoster: string | null;
  season: Season;
  watchedEpisodes: number;
  seasonRating?: number | null;
  onProgressUpdate?: () => void;
}

export const SeasonProgressCard = ({
  tvShowId,
  tvShowName,
  tvShowPoster,
  season,
  watchedEpisodes,
  seasonRating,
  onProgressUpdate,
}: SeasonProgressCardProps) => {
  const { user } = useAuth();
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [isUnmarkingAll, setIsUnmarkingAll] = useState(false);
  
  const totalEpisodes = season.episode_count;
  const progress = totalEpisodes > 0 ? (watchedEpisodes / totalEpisodes) * 100 : 0;
  const isComplete = watchedEpisodes >= totalEpisodes;
  const hasAnyWatched = watchedEpisodes > 0;

  const handleMarkAllWatched = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user || isMarkingAll) return;
    
    setIsMarkingAll(true);
    try {
      // Fetch season details to get all episodes
      const seasonDetails = await tmdbService.getSeasonDetails(tvShowId, season.season_number) as { episodes?: { episode_number: number; runtime?: number }[] };
      const episodes = seasonDetails.episodes || [];
      
      // Get existing entries for this season
      const { data: existing } = await supabase
        .from('tv_diary')
        .select('episode_number')
        .eq('user_id', user.id)
        .eq('tv_id', tvShowId)
        .eq('season_number', season.season_number)
        .not('episode_number', 'is', null);
      
      const existingEpisodes = new Set(existing?.map(e => e.episode_number) || []);
      
      // Find episodes not yet watched
      const unwatchedEpisodes = episodes.filter(ep => !existingEpisodes.has(ep.episode_number));
      
      if (unwatchedEpisodes.length > 0) {
        // Insert all unwatched episodes
        const inserts = unwatchedEpisodes.map(ep => ({
          user_id: user.id,
          tv_id: tvShowId,
          tv_title: tvShowName,
          tv_poster: tvShowPoster,
          season_number: season.season_number,
          episode_number: ep.episode_number,
          runtime: ep.runtime || 45,
          watched_date: new Date().toISOString().split('T')[0]
        }));
        
        await supabase.from('tv_diary').insert(inserts);
      }
      
      onProgressUpdate?.();
    } catch (error) {
      console.error('Failed to mark all watched:', error);
    } finally {
      setIsMarkingAll(false);
    }
  };

  const handleUnmarkAllWatched = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user || isUnmarkingAll) return;
    
    setIsUnmarkingAll(true);
    try {
      // Delete all episode entries for this season
      await supabase
        .from('tv_diary')
        .delete()
        .eq('user_id', user.id)
        .eq('tv_id', tvShowId)
        .eq('season_number', season.season_number)
        .not('episode_number', 'is', null);
      
      onProgressUpdate?.();
    } catch (error) {
      console.error('Failed to unmark all watched:', error);
    } finally {
      setIsUnmarkingAll(false);
    }
  };

  return (
    <Link 
      to={`/tv/${tvShowId}/season/${season.season_number}`}
      className="group block"
    >
      <div className={`flex items-center gap-4 p-4 rounded-lg border transition-all duration-200 hover:bg-card/70 ${
        isComplete 
          ? 'bg-cinema-gold/5 border-cinema-gold/30' 
          : 'bg-card/50 border-border hover:border-cinema-red'
      }`}>
        {/* Season Poster */}
        <div className="relative flex-shrink-0">
          <img 
            src={tmdbService.getPosterUrl(season.poster_path, 'w300')}
            alt={season.name}
            className="w-16 h-24 rounded object-cover"
          />
          {isComplete && (
            <div className="absolute inset-0 bg-cinema-gold/20 rounded flex items-center justify-center">
              <Check className="h-6 w-6 text-cinema-gold" />
            </div>
          )}
        </div>
        
        {/* Season Info */}
        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold transition-colors ${
            isComplete ? 'text-cinema-gold' : 'text-foreground group-hover:text-cinema-red'
          }`}>
            {season.name}
          </h3>
          
          {/* Progress Bar */}
          <div className="mt-2 mb-1">
            <Progress 
              value={progress} 
              className="h-2"
            />
          </div>
          
          <span className="text-muted-foreground text-sm">
            {watchedEpisodes}/{totalEpisodes} episodes
          </span>
          
          {/* Season Rating */}
          {seasonRating && seasonRating > 0 && (
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs text-muted-foreground">Season Rating:</span>
              <span className="text-cinema-red font-semibold text-sm flex items-center gap-1">
                <Flame className="h-3 w-3 fill-current" />
                {seasonRating}/5
              </span>
            </div>
          )}
          
          {/* Year */}
          {season.air_date && (
            <p className="text-muted-foreground text-xs mt-1">
              {new Date(season.air_date).getFullYear()}
            </p>
          )}
          
          {/* Mark All / Unmark All Watched Buttons */}
          {user && (
            <div className="flex flex-wrap gap-2 mt-2 pointer-events-auto relative z-10">
              {!isComplete && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-10 px-3 hover:bg-cinema-gold hover:text-cinema-black hover:border-cinema-gold touch-manipulation active:scale-95"
                  onClick={handleMarkAllWatched}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleMarkAllWatched(e as unknown as React.MouseEvent);
                  }}
                  disabled={isMarkingAll || isUnmarkingAll}
                >
                  {isMarkingAll ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Eye className="h-4 w-4 mr-1" />
                  )}
                  Mark All
                </Button>
              )}
              {hasAnyWatched && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-10 px-3 hover:bg-destructive hover:text-destructive-foreground hover:border-destructive touch-manipulation active:scale-95"
                  onClick={handleUnmarkAllWatched}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleUnmarkAllWatched(e as unknown as React.MouseEvent);
                  }}
                  disabled={isMarkingAll || isUnmarkingAll}
                >
                  {isUnmarkingAll ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <EyeOff className="h-4 w-4 mr-1" />
                  )}
                  Clear All
                </Button>
              )}
            </div>
          )}
        </div>
        
        <ChevronRight className={`h-5 w-5 flex-shrink-0 transition-colors ${
          isComplete ? 'text-cinema-gold' : 'text-muted-foreground group-hover:text-cinema-red'
        }`} />
      </div>
    </Link>
  );
};