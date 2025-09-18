import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, ExternalLink, MapPin } from 'lucide-react';
import { useCinemas } from '@/hooks/useCinemas';

interface Cinema {
  id: string;
  name: string;
  address: string;
  city: string;
  phone?: string;
  website?: string;
}

interface Showtime {
  id: string;
  movie_id: number;
  movie_title: string;
  showtime: string;
  ticket_price?: number;
  booking_url?: string;
}

interface CinemaShowtimesProps {
  cinema: Cinema | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CinemaShowtimes = ({ cinema, isOpen, onClose }: CinemaShowtimesProps) => {
  const { fetchCinemaShowtimes } = useCinemas();
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (cinema && isOpen) {
      loadShowtimes();
    }
  }, [cinema, isOpen]);

  const loadShowtimes = async () => {
    if (!cinema) return;
    
    setIsLoading(true);
    try {
      const times = await fetchCinemaShowtimes(cinema.id);
      setShowtimes(times);
    } catch (error) {
      console.error('Error loading showtimes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (datetime: string) => {
    return new Date(datetime).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (datetime: string) => {
    return new Date(datetime).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleBooking = (showtime: Showtime) => {
    if (showtime.booking_url) {
      window.open(showtime.booking_url, '_blank');
    }
  };

  if (!cinema) return null;

  // Group showtimes by movie and date
  const groupedShowtimes = showtimes.reduce((acc, showtime) => {
    const date = formatDate(showtime.showtime);
    const movieKey = `${showtime.movie_title}-${date}`;
    
    if (!acc[movieKey]) {
      acc[movieKey] = {
        movie_title: showtime.movie_title,
        date,
        times: []
      };
    }
    
    acc[movieKey].times.push(showtime);
    return acc;
  }, {} as Record<string, { movie_title: string; date: string; times: Showtime[] }>);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Showtimes at {cinema.name}
          </DialogTitle>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{cinema.address}, {cinema.city}</span>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-6 w-48" />
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : Object.keys(groupedShowtimes).length > 0 ? (
            Object.values(groupedShowtimes).map((movieGroup, index) => (
              <div key={index} className="space-y-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg">{movieGroup.movie_title}</h3>
                  <Badge variant="outline">{movieGroup.date}</Badge>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {movieGroup.times.map((showtime) => (
                    <Button
                      key={showtime.id}
                      variant="outline"
                      size="sm"
                      onClick={() => handleBooking(showtime)}
                      className="flex items-center gap-2"
                      disabled={!showtime.booking_url}
                    >
                      <span>{formatTime(showtime.showtime)}</span>
                      {showtime.ticket_price && (
                        <Badge variant="secondary" className="text-xs">
                          ${showtime.ticket_price}
                        </Badge>
                      )}
                      {showtime.booking_url && (
                        <ExternalLink className="h-3 w-3" />
                      )}
                    </Button>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Showtimes Available</h3>
              <p className="text-muted-foreground mb-4">
                No current showtimes found for this cinema. Check back later or contact the theater directly.
              </p>
              <div className="flex justify-center gap-2">
                {cinema.phone && (
                  <Button 
                    variant="outline" 
                    onClick={() => window.location.href = `tel:${cinema.phone}`}
                  >
                    Call Theater
                  </Button>
                )}
                {cinema.website && (
                  <Button 
                    variant="outline"
                    onClick={() => window.open(cinema.website, '_blank')}
                  >
                    Visit Website
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};