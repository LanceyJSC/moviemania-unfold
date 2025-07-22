
import { useState, useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useCinemas } from '@/hooks/useCinemas';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { 
  MapPin, 
  Phone, 
  Globe, 
  Navigation as NavigationIcon,
  Clock,
  ExternalLink,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const Cinemas = () => {
  const navigate = useNavigate();
  const { cinemas, isLoading, fetchNearbyCinemas, fetchCinemas } = useCinemas();
  const { coordinates, error, loading, getCurrentLocation, clearError } = useGeolocation();
  const { preferences, updateLocation } = useUserPreferences();
  const [manualLocation, setManualLocation] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

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
    clearError();
    getCurrentLocation();
  };

  const handleManualLocationSubmit = async () => {
    if (!manualLocation.trim()) {
      toast.error('Please enter a location');
      return;
    }

    try {
      // Use browser's geocoding API (more reliable than external APIs)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(manualLocation)}&limit=1`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lng = parseFloat(data[0].lon);
          updateLocation(lat, lng);
          fetchNearbyCinemas(lat, lng);
          setShowManualInput(false);
          toast.success('Location updated successfully');
        } else {
          toast.error('Location not found. Please try a different search.');
        }
      } else {
        toast.error('Unable to search for location. Please try again.');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      toast.error('Failed to search for location. Please enable GPS instead.');
    }
  };

  const formatDistance = (distance?: number) => {
    if (!distance) return '';
    return `${distance} km away`;
  };

  const handleRetry = () => {
    if (coordinates || (preferences?.location_latitude && preferences?.location_longitude)) {
      // Retry fetching cinemas with existing coordinates
      const lat = coordinates?.latitude || preferences?.location_latitude!;
      const lng = coordinates?.longitude || preferences?.location_longitude!;
      fetchNearbyCinemas(lat, lng);
    } else {
      // Try to get location again
      handleGetLocation();
    }
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-2xl font-bold text-foreground">Find Cinemas</h1>
          <div className="flex items-center gap-2">
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
      </div>

      <div className="p-4 space-y-6">
        {/* Location Status */}
        {error && (
          <Card className="border-destructive/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-destructive mb-3">{error}</p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button onClick={handleGetLocation} size="sm" variant="outline">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Try Again
                    </Button>
                    <Button 
                      onClick={() => setShowManualInput(true)} 
                      size="sm" 
                      variant="outline"
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      Enter Location Manually
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Manual Location Input */}
        {showManualInput && (
          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                <h3 className="font-medium">Enter your location</h3>
                <div className="flex gap-2">
                  <Input
                    placeholder="City, address, or postal code"
                    value={manualLocation}
                    onChange={(e) => setManualLocation(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleManualLocationSubmit()}
                  />
                  <Button onClick={handleManualLocationSubmit} size="sm">
                    Search
                  </Button>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowManualInput(false)}
                >
                  Cancel
                </Button>
              </div>
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
                {coordinates || (preferences?.location_latitude && preferences?.location_longitude)
                  ? "No cinemas found in your area. This might be because cinema data is not yet available for your location."
                  : "Allow location access to find cinemas near you."
                }
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                {!coordinates && !(preferences?.location_latitude && preferences?.location_longitude) && (
                  <Button onClick={handleGetLocation} disabled={loading}>
                    Enable Location
                  </Button>
                )}
                <Button onClick={handleRetry} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry Search
                </Button>
                <Button 
                  onClick={() => setShowManualInput(true)} 
                  variant="outline"
                >
                  Enter Location Manually
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Cinema data is continuously being updated. Please check back later.
              </p>
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
