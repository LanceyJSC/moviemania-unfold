import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCinemas } from '@/hooks/useCinemas';
import { 
  ArrowLeft,
  MapPin, 
  Phone, 
  Globe, 
  Navigation as NavigationIcon,
  Clock,
  ExternalLink,
  Ticket
} from 'lucide-react';

interface CinemaShowtime {
  id: string;
  cinema_id: string;
  movie_id?: number;
  movie_title: string;
  showtime: string;
  ticket_price?: string | number;
  booking_url?: string;
}

const CinemaDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { cinemas, fetchCinemaShowtimes } = useCinemas();
  const [cinema, setCinema] = useState<any>(null);
  const [showtimes, setShowtimes] = useState<CinemaShowtime[]>([]);
  const [isLoadingShowtimes, setIsLoadingShowtimes] = useState(false);

  useEffect(() => {
    if (id && cinemas.length > 0) {
      const foundCinema = cinemas.find(c => c.id === id);
      setCinema(foundCinema);
      
      if (foundCinema) {
        loadShowtimes();
      }
    }
  }, [id, cinemas]);

  const loadShowtimes = async () => {
    if (!id) return;
    
    setIsLoadingShowtimes(true);
    try {
      const data = await fetchCinemaShowtimes(id);
      setShowtimes(data);
    } catch (error) {
      console.error('Error loading showtimes:', error);
    } finally {
      setIsLoadingShowtimes(false);
    }
  };

  const formatShowtime = (datetime: string) => {
    const date = new Date(datetime);
    return {
      date: date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })
    };
  };

  const groupShowtimesByMovie = () => {
    const grouped: Record<string, CinemaShowtime[]> = {};
    showtimes.forEach(showtime => {
      const key = `${showtime.movie_id}-${showtime.movie_title}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(showtime);
    });
    return grouped;
  };

  if (!cinema) {
    return (
      <div className="min-h-screen bg-background pb-32 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading cinema details...</p>
        </div>
      </div>
    );
  }

  const groupedShowtimes = groupShowtimesByMovie();

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center gap-4 p-4">
          <Button
            onClick={() => navigate('/cinemas')}
            size="sm"
            variant="ghost"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold text-foreground truncate">{cinema.name}</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Cinema Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{cinema.name}</span>
              {cinema.distance && (
                <Badge variant="secondary">
                  {cinema.distance} km away
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
              <span>{cinema.address}, {cinema.city}, {cinema.country}</span>
            </div>
            
            {cinema.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a href={`tel:${cinema.phone}`} className="hover:text-primary">
                  {cinema.phone}
                </a>
              </div>
            )}
            
            {cinema.website && (
              <div className="flex items-center gap-2 text-sm">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <a 
                  href={cinema.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-primary flex items-center gap-1"
                >
                  Visit Website
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}

            <div className="pt-2">
              <Button 
                onClick={() => {
                  const url = `https://maps.google.com/maps?daddr=${cinema.latitude},${cinema.longitude}`;
                  window.open(url, '_blank');
                }}
                size="sm"
                variant="outline"
                className="w-full"
              >
                <NavigationIcon className="h-4 w-4 mr-2" />
                Get Directions
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Showtimes */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Current Showtimes
          </h2>
          
          {isLoadingShowtimes ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="animate-pulse space-y-3">
                      <div className="h-4 bg-muted rounded w-1/2"></div>
                      <div className="h-3 bg-muted rounded w-3/4"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : Object.keys(groupedShowtimes).length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Ticket className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Showtimes Available</h3>
                <p className="text-muted-foreground">
                  There are currently no upcoming showtimes at this cinema.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedShowtimes).map(([movieKey, movieShowtimes]) => {
                const firstShowtime = movieShowtimes[0];
                return (
                  <Card key={movieKey}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">
                        {firstShowtime.movie_title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {movieShowtimes.map((showtime) => {
                          const { date, time } = formatShowtime(showtime.showtime);
                          return (
                            <Button
                              key={showtime.id}
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (showtime.booking_url) {
                                  window.open(showtime.booking_url, '_blank');
                                } else {
                                  navigate(`/movie/${showtime.movie_id}`);
                                }
                              }}
                              className="h-auto p-3 flex flex-col items-center"
                            >
                              <div className="text-xs text-muted-foreground">{date}</div>
                              <div className="font-medium">{time}</div>
                              {showtime.ticket_price && (
                                <div className="text-xs text-primary">
                                  ${showtime.ticket_price}
                                </div>
                              )}
                            </Button>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Navigation />
    </div>
  );
};

export default CinemaDetail;