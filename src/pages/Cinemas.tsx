import { useState, useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCinemas } from '@/hooks/useCinemas';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { 
  MapPin, 
  Phone, 
  Globe, 
  Navigation as NavigationIcon,
  Clock,
  ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Cinemas = () => {
  const navigate = useNavigate();
  const { cinemas, isLoading, fetchNearbyCinemas, fetchCinemas } = useCinemas();
  const { coordinates, error, loading, getCurrentLocation } = useGeolocation();
  const { preferences, updateLocation } = useUserPreferences();
  const [selectedCinema, setSelectedCinema] = useState<string | null>(null);

  useEffect(() => {
    if (preferences?.location_latitude && preferences?.location_longitude) {
      fetchNearbyCinemas(preferences.location_latitude, preferences.location_longitude);
    }
  }, [preferences]);

  useEffect(() => {
    if (coordinates) {
      updateLocation(coordinates.latitude, coordinates.longitude);
      fetchNearbyCinemas(coordinates.latitude, coordinates.longitude);
    }
  }, [coordinates]);

  const handleGetLocation = () => {
    getCurrentLocation();
  };

  const formatDistance = (distance?: number) => {
    if (!distance) return '';
    return `${distance} km away`;
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-2xl font-bold text-foreground">Find Cinemas</h1>
          <Button
            onClick={handleGetLocation}
            disabled={loading}
            size="sm"
            variant="outline"
            className="flex items-center gap-2"
          >
            <NavigationIcon className="h-4 w-4" />
            {loading ? 'Finding...' : 'Near Me'}
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Location Status */}
        {error && (
          <Card className="border-destructive/20">
            <CardContent className="p-4">
              <p className="text-sm text-destructive">{error}</p>
              <Button 
                onClick={handleGetLocation} 
                size="sm" 
                variant="outline" 
                className="mt-2"
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {coordinates && (
          <Card className="border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm text-primary">
                <MapPin className="h-4 w-4" />
                <span>Showing cinemas near your location</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cinemas List */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                    <div className="h-3 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/4"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : cinemas.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Cinemas Found</h3>
              <p className="text-muted-foreground mb-4">
                {coordinates 
                  ? "No cinemas found in your area. Try expanding your search radius."
                  : "Allow location access to find cinemas near you."
                }
              </p>
              {!coordinates && (
                <Button onClick={handleGetLocation} disabled={loading}>
                  Enable Location
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {cinemas.map((cinema) => (
              <Card key={cinema.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{cinema.name}</CardTitle>
                      {cinema.distance && (
                        <Badge variant="secondary" className="mt-1">
                          {formatDistance(cinema.distance)}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>{cinema.address}, {cinema.city}, {cinema.country}</span>
                    </div>
                    
                    {cinema.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <a href={`tel:${cinema.phone}`} className="hover:text-primary">
                          {cinema.phone}
                        </a>
                      </div>
                    )}
                    
                    {cinema.website && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Globe className="h-4 w-4" />
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
                  </div>
                  
                  <div className="mt-4 flex gap-2">
                    <Button 
                      onClick={() => navigate(`/cinema/${cinema.id}`)}
                      size="sm"
                      className="flex-1"
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      View Showtimes
                    </Button>
                    <Button 
                      onClick={() => {
                        const url = `https://maps.google.com/maps?daddr=${cinema.latitude},${cinema.longitude}`;
                        window.open(url, '_blank');
                      }}
                      size="sm"
                      variant="outline"
                    >
                      <NavigationIcon className="h-4 w-4 mr-2" />
                      Directions
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Navigation />
    </div>
  );
};

export default Cinemas;