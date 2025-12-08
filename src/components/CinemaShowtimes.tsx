import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, ExternalLink, MapPin } from 'lucide-react';
import { useCinemas } from '@/hooks/useCinemas';
import type { Cinema } from '@/types/cinema';

interface Showtime {
  id: string;
  movie_id?: number;
  movie_title: string;
  showtime: string;
  ticket_price?: string | number;
  booking_url?: string;
}

interface CinemaShowtimesProps {
  cinema: Cinema | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CinemaShowtimes = ({ cinema, isOpen, onClose }: CinemaShowtimesProps) => {
  const { fetchCinemaShowtimes, fetchScrapedShowtimes } = useCinemas();
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (cinema && isOpen) {
      loadShowtimes();
    }
  }, [cinema, isOpen]);

  const isUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

  const loadShowtimes = async () => {
    if (!cinema) return;
    
    setIsLoading(true);
    try {
      let times: Showtime[] = [];
      
      // First try database for UUID cinemas
      if (isUUID(cinema.id)) {
        times = await fetchCinemaShowtimes(cinema.id);
      }
      
      // If no database results, try web scraping
      if (times.length === 0) {
        console.log('No database showtimes found, attempting web scraping...');
        const scrapedTimes = await fetchScrapedShowtimes(cinema);
        
        // Convert scraped format to expected format
        times = scrapedTimes.map((scraped: any, index: number) => ({
          id: `scraped-${index}`,
          movie_id: index,
          movie_title: scraped.movie_title,
          showtime: scraped.showtime,
          ticket_price: scraped.ticket_price ? parseFloat(scraped.ticket_price.replace(/[^\d.]/g, '')) : undefined,
          booking_url: scraped.booking_url
        }));
      }
      
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
      window.open(showtime.booking_url, '_blank', 'noopener');
    }
  };

  const openOSM = () => {
    if (!cinema) return;
    if (cinema.latitude && cinema.longitude) {
      const url = `https://www.openstreetmap.org/?mlat=${cinema.latitude}&mlon=${cinema.longitude}#map=16/${cinema.latitude}/${cinema.longitude}`;
      window.open(url, '_blank', 'noopener');
    } else {
      const q = encodeURIComponent(`${cinema.name} ${cinema.address} ${cinema.city}`);
      window.open(`https://www.openstreetmap.org/search?query=${q}`, '_blank', 'noopener');
    }
  };

  const searchWeb = () => {
    if (!cinema) return;
    const q = encodeURIComponent(`${cinema.name} ${cinema.city} showtimes tickets`);
    window.open(`https://duckduckgo.com/?q=${q}`, '_blank', 'noopener');
  };

  const copyAddress = async () => {
    if (!cinema) return;
    const text = `${cinema.name}, ${cinema.address}, ${cinema.city}${cinema.country ? ', ' + cinema.country : ''}`;
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      console.error('Clipboard write failed', e);
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
          <DialogDescription>
            Browse available showtimes, or open the map and the cinema website for tickets and details.
          </DialogDescription>
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
              <div className="flex flex-wrap justify-center gap-2">
                <Button variant="outline" onClick={openOSM}>
                  Open Map
                </Button>
                <Button variant="outline" onClick={searchWeb}>
                  Search Web
                </Button>
                <Button variant="outline" onClick={copyAddress}>
                  Copy Address
                </Button>
                {cinema.website && (
                  <Button 
                    variant="outline"
                    onClick={() => window.open(cinema.website!, '_blank', 'noopener')}
                  >
                    Visit Website
                  </Button>
                )}
                {!cinema.website && (
                  <Button 
                    variant="outline"
                    onClick={() => {
                      const q = encodeURIComponent(`${cinema.name} ${cinema.city} official site`);
                      window.open(`https://duckduckgo.com/?q=${q}`, '_blank', 'noopener');
                    }}
                  >
                    Find Website
                  </Button>
                )}
                {cinema.phone && (
                  <Button 
                    variant="outline" 
                    onClick={() => window.location.href = `tel:${cinema.phone}`}
                  >
                    Call Theater
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