import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, Calendar, MessageCircle, Film } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Navigation } from '@/components/Navigation';
import { MobileHeader } from '@/components/MobileHeader';
import { LogMediaModal } from '@/components/LogMediaModal';
import { tmdbService, TVShow as TMDBTVShow } from '@/lib/tmdb';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useDiary } from '@/hooks/useDiary';
import { format } from 'date-fns';

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

const EpisodeReviews = () => {
  const { id, seasonNumber, episodeNumber } = useParams<{ id: string; seasonNumber: string; episodeNumber: string }>();
  const { user } = useAuth();
  const { tvDiary, refetchTVDiary } = useDiary();
  const [tvShow, setTVShow] = useState<TMDBTVShow | null>(null);
  const [episode, setEpisode] = useState<Episode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showLogModal, setShowLogModal] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!id || !seasonNumber || !episodeNumber) return;
      
      setIsLoading(true);
      try {
        const tvShowData = await tmdbService.getTVShowDetails(Number(id));
        setTVShow(tvShowData);

        const seasonData = await tmdbService.getSeasonDetails(Number(id), Number(seasonNumber)) as { episodes?: Episode[] };
        const ep = seasonData.episodes?.find((e: Episode) => e.episode_number === Number(episodeNumber));
        setEpisode(ep || null);
      } catch (error) {
        console.error('Failed to load episode data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [id, seasonNumber, episodeNumber]);

  // Get reviews for this episode
  const episodeReviews = tvDiary.filter(entry => 
    entry.tv_id === Number(id) && 
    entry.season_number === Number(seasonNumber) && 
    entry.episode_number === Number(episodeNumber) && 
    entry.notes && 
    entry.notes.trim() !== ''
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <MobileHeader title="Loading..." />
        <Navigation />
        <div className="container mx-auto px-4 py-6 space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!tvShow || !episode) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <MobileHeader title="Episode Not Found" />
        <Navigation />
        <div className="container mx-auto px-4 py-20 text-center">
          <Film className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-2">Episode Not Found</h1>
          <Link to={`/tv/${id}/season/${seasonNumber}`}>
            <Button>Back to Season</Button>
          </Link>
        </div>
      </div>
    );
  }

  const stillUrl = episode.still_path 
    ? `https://image.tmdb.org/t/p/w500${episode.still_path}`
    : null;

  return (
    <div className="min-h-screen bg-background pb-24">
      <MobileHeader title={`Episode ${episodeNumber} Reviews`} />
      <Navigation />
      
      <div className="container mx-auto px-4 py-6">
        {/* Episode Info */}
        <Card className="p-4 mb-6">
          <div className="flex gap-4">
            {stillUrl ? (
              <img 
                src={stillUrl} 
                alt={episode.name}
                className="w-24 h-16 object-cover rounded"
              />
            ) : (
              <div className="w-24 h-16 bg-muted rounded flex items-center justify-center">
                <Film className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <Link 
                to={`/tv/${id}`}
                className="text-xs text-muted-foreground hover:underline"
              >
                {tvShow.name}
              </Link>
              <h1 className="font-semibold line-clamp-1">{episode.name}</h1>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                <span>S{seasonNumber} E{episodeNumber}</span>
                {episode.vote_average > 0 && (
                  <span className="flex items-center gap-1 text-cinema-gold">
                    <Star className="h-3 w-3 fill-current" />
                    {episode.vote_average.toFixed(1)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Write Review Button */}
        {user && (
          <Button 
            onClick={() => setShowLogModal(true)} 
            className="w-full mb-6"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Write a Review
          </Button>
        )}

        {/* Reviews List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">
            Reviews ({episodeReviews.length})
          </h2>
          
          {episodeReviews.length > 0 ? (
            episodeReviews.map((review) => (
              <Card key={review.id} className="p-4">
                <div className="flex items-center gap-2 flex-wrap mb-3">
                  {review.rating && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-cinema-gold/20 rounded text-cinema-gold font-semibold text-xs">
                      <Star className="h-3 w-3 fill-current" />
                      {review.rating}/10
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(review.watched_date), 'MMM d, yyyy')}
                  </span>
                </div>
                <p className="text-sm text-foreground/90 whitespace-pre-wrap">
                  {review.notes}
                </p>
              </Card>
            ))
          ) : (
            <Card className="p-8 text-center">
              <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No reviews yet for this episode.</p>
              {user && (
                <p className="text-sm text-muted-foreground mt-2">
                  Be the first to write a review!
                </p>
              )}
            </Card>
          )}
        </div>
      </div>

      {/* Log Modal */}
      {showLogModal && tvShow && (
        <LogMediaModal
          isOpen={showLogModal}
          onClose={() => {
            setShowLogModal(false);
            refetchTVDiary();
          }}
          mediaId={Number(id)}
          mediaTitle={tvShow.name}
          mediaPoster={tvShow.poster_path}
          mediaType="tv"
          seasonNumber={Number(seasonNumber)}
          episodeNumber={Number(episodeNumber)}
        />
      )}
    </div>
  );
};

export default EpisodeReviews;
