import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Tv, Star, Trash2, ChevronRight, Pencil } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { tmdbService } from '@/lib/tmdb';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const IMAGE_BASE = 'https://image.tmdb.org/t/p/w185';

interface TVShowCollectionCardProps {
  id: string;
  tvId: number;
  title: string;
  poster: string | null;
  userRating?: number | null;
  onDelete: () => void;
  onEdit?: () => void;
  children?: React.ReactNode;
  defaultExpanded?: boolean;
}

export const TVShowCollectionCard = ({
  id,
  tvId,
  title,
  poster,
  userRating,
  onDelete,
  onEdit,
}: TVShowCollectionCardProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tmdbRating, setTmdbRating] = useState<number | null>(null);
  const [showTitle, setShowTitle] = useState(title);
  const [seasonCount, setSeasonCount] = useState(0);
  const [episodeCount, setEpisodeCount] = useState(0);
  const [seriesRating, setSeriesRating] = useState<number | null>(null);

  // Load counts and rating on mount
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      
      // Load diary counts
      const { data: diaryData } = await supabase
        .from('tv_diary')
        .select('season_number, episode_number')
        .eq('user_id', user.id)
        .eq('tv_id', tvId);

      if (diaryData) {
        const uniqueSeasons = new Set<number>();
        let episodes = 0;

        diaryData.forEach(entry => {
          if (entry.season_number) {
            uniqueSeasons.add(entry.season_number);
          }
          if (entry.episode_number) {
            episodes++;
          }
        });

        setSeasonCount(uniqueSeasons.size);
        setEpisodeCount(episodes);
      }

      // Load series-level rating
      const { data: ratingData } = await supabase
        .from('user_ratings')
        .select('rating')
        .eq('user_id', user.id)
        .eq('movie_id', tvId)
        .eq('media_type', 'tv')
        .maybeSingle();
      
      if (ratingData?.rating) {
        setSeriesRating(ratingData.rating);
      }
    };
    
    loadData();
  }, [user, tvId]);

  useEffect(() => {
    const fetchTmdbData = async () => {
      try {
        const details = await tmdbService.getTVShowDetails(tvId);
        setTmdbRating(details.vote_average);
        if (details.name) {
          setShowTitle(details.name);
        }
      } catch (error) {
        console.error('Failed to fetch TMDB data:', error);
      }
    };
    fetchTmdbData();
  }, [tvId]);

  const getPosterUrl = (posterPath: string | null) => {
    if (!posterPath) return null;
    if (posterPath.startsWith('http')) return posterPath;
    return `${IMAGE_BASE}${posterPath}`;
  };

  const displayRating = seriesRating || userRating;

  return (
    <Card className="overflow-hidden">
      {/* Main tappable area - navigates to TV detail */}
      <button
        onClick={() => navigate(`/tv/${tvId}`)}
        className="w-full p-4 text-left touch-manipulation active:bg-muted/50 transition-colors"
      >
        <div className="flex gap-4">
          {/* Poster */}
          {poster ? (
            <img 
              src={getPosterUrl(poster) || ''} 
              alt={title} 
              className="w-16 h-24 object-cover rounded flex-shrink-0" 
            />
          ) : (
            <div className="w-16 h-24 bg-muted rounded flex items-center justify-center flex-shrink-0">
              <Tv className="h-6 w-6 text-muted-foreground" />
            </div>
          )}

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Tv className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="font-semibold line-clamp-1">{showTitle}</span>
            </div>

            {/* Ratings row */}
            <div className="flex items-center gap-3 mb-2">
              {tmdbRating !== null && (
                <div className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-cinema-gold text-cinema-gold" />
                  <span className="text-sm text-muted-foreground">{tmdbRating.toFixed(1)}</span>
                </div>
              )}
              {displayRating && displayRating > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-cinema-gold/20 rounded text-cinema-gold font-semibold text-xs">
                  {displayRating}/10
                </span>
              )}
            </div>

            {/* Progress summary */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {seasonCount > 0 && (
                <span>{seasonCount} {seasonCount === 1 ? 'Season' : 'Seasons'}</span>
              )}
              {seasonCount > 0 && episodeCount > 0 && <span>•</span>}
              {episodeCount > 0 && (
                <span>{episodeCount} {episodeCount === 1 ? 'Episode' : 'Episodes'}</span>
              )}
              {seasonCount === 0 && episodeCount === 0 && (
                <span>No episodes logged</span>
              )}
            </div>
          </div>

          {/* Chevron indicator */}
          <div className="flex items-center flex-shrink-0">
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
      </button>

      {/* Action buttons - separate from main tap area */}
      <div className="flex items-center justify-end gap-1 px-4 pb-4 -mt-2">
        {onEdit && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="text-muted-foreground hover:text-foreground h-9 px-3 touch-manipulation"
          >
            <Pencil className="h-4 w-4 mr-1.5" />
            Edit
          </Button>
        )}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => e.stopPropagation()}
              className="text-destructive hover:text-destructive hover:bg-destructive/10 h-9 px-3 touch-manipulation"
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete "{showTitle}"?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete all data for this TV show including watched episodes, ratings, reviews, and diary entries.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={onDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Card>
  );
};
