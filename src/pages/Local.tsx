import { useState, useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCinemas } from '@/hooks/useCinemas';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useFilmingLocations } from '@/hooks/useFilmingLocations';
import { useLocalCelebrities } from '@/hooks/useLocalCelebrities';
import { tmdbService } from '@/lib/tmdb';
import { 
  MapPin, 
  Navigation as NavigationIcon,
  Clock,
  ExternalLink,
  AlertCircle,
  RefreshCw,
  Star,
  Calendar,
  Film,
  Tv,
  Users,
  Camera,
  Award,
  Heart
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';


const Local = () => {
  const navigate = useNavigate();
  const { cinemas, isLoading: cinemasLoading, fetchNearbyCinemas } = useCinemas();
  const { coordinates, error, loading, getCurrentLocation, clearError } = useGeolocation();
  const { preferences, updateLocation } = useUserPreferences();
  const { locations: filmingLocations, isLoading: filmingLoading, fetchFilmingLocations } = useFilmingLocations();
  const { celebrities, isLoading: celebritiesLoading, fetchLocalCelebrities } = useLocalCelebrities();
  
  const [manualLocation, setManualLocation] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [radius, setRadius] = useState('25');
  const [currentLocation, setCurrentLocation] = useState<string>('');
  const [trendingMovies, setTrendingMovies] = useState<any[]>([]);

  useEffect(() => {
    fetchTrendingMovies();
  }, []);

  useEffect(() => {
    if (coordinates) {
      updateLocation(coordinates.latitude, coordinates.longitude);
      fetchLocationBasedContent(coordinates.latitude, coordinates.longitude);
      reverseGeocode(coordinates.latitude, coordinates.longitude);
    }
  }, [coordinates, radius]);

  useEffect(() => {
    if (preferences?.location_latitude && preferences?.location_longitude && !coordinates) {
      fetchLocationBasedContent(preferences.location_latitude, preferences.location_longitude);
      reverseGeocode(preferences.location_latitude, preferences.location_longitude);
    }
  }, [preferences, radius]);

  const fetchTrendingMovies = async () => {
    try {
      const movies = await tmdbService.getTrendingMovies();
      setTrendingMovies(movies.results?.slice(0, 6) || []);
    } catch (error) {
      console.error('Error fetching trending movies:', error);
    }
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`
      );
      
      if (response.ok) {
        const data = await response.json();
        const city = data.address?.city || data.address?.town || data.address?.village || 'Unknown Location';
        const country = data.address?.country || '';
        setCurrentLocation(`${city}${country ? ', ' + country : ''}`);
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      setCurrentLocation('Current Location');
    }
  };

  const fetchLocationBasedContent = async (lat: number, lng: number) => {
    // Convert miles to kilometers for API calls
    const radiusKm = parseInt(radius) * 1.60934;
    
    // Fetch nearby cinemas
    fetchNearbyCinemas(lat, lng, radiusKm);
    
    // Fetch filming locations and celebrities
    fetchFilmingLocations(lat, lng, radiusKm);
    fetchLocalCelebrities(lat, lng, radiusKm);
  };

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
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(manualLocation)}&limit=1`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lng = parseFloat(data[0].lon);
          updateLocation(lat, lng);
          fetchLocationBasedContent(lat, lng);
          reverseGeocode(lat, lng);
          setShowManualInput(false);
          toast.success('Location updated successfully');
        } else {
          toast.error('Location not found. Please try a different search.');
        }
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      toast.error('Unable to search for location. Please try again.');
    }
  };

  const formatDistance = (distance?: number) => {
    if (!distance) return '';
    // Convert km back to miles for display
    const miles = distance * 0.621371;
    return `${miles.toFixed(1)} mi away`;
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between p-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Local Cinema</h1>
            {currentLocation && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {currentLocation}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Select value={radius} onValueChange={setRadius}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 mi</SelectItem>
                <SelectItem value="10">10 mi</SelectItem>
                <SelectItem value="25">25 mi</SelectItem>
                <SelectItem value="50">50 mi</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={handleGetLocation}
              disabled={loading}
              size="sm"
              variant="outline"
            >
              <NavigationIcon className="h-4 w-4" />
              {loading ? 'Finding...' : 'Near Me'}
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* Location Status */}
        {error && (
          <Card className="border-destructive/20 mb-6">
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
          <Card className="mb-6">
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

        <Tabs defaultValue="cinemas" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="cinemas" className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Cinemas</span>
            </TabsTrigger>
            <TabsTrigger value="trending" className="flex items-center gap-1">
              <Star className="h-4 w-4" />
              <span className="hidden sm:inline">Trending</span>
            </TabsTrigger>
            <TabsTrigger value="filming" className="flex items-center gap-1">
              <Camera className="h-4 w-4" />
              <span className="hidden sm:inline">Filming</span>
            </TabsTrigger>
            <TabsTrigger value="celebrities" className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Stars</span>
            </TabsTrigger>
          </TabsList>

          {/* Cinemas Tab */}
          <TabsContent value="cinemas" className="space-y-4">
            {cinemasLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
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
                  <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Cinemas Found</h3>
                  <p className="text-muted-foreground mb-4">
                    No cinemas found within {radius} miles. Try increasing your search radius or check back later.
                  </p>
                  <Button onClick={() => setShowManualInput(true)} variant="outline">
                    Try Different Location
                  </Button>
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
                          <span>{cinema.address}, {cinema.city}</span>
                        </div>
                        
                        <div className="flex gap-2 mt-4">
                          <Button 
                            onClick={() => navigate(`/cinema/${cinema.id}`)}
                            size="sm"
                            className="flex-1"
                          >
                            <Clock className="h-4 w-4 mr-2" />
                            Showtimes
                          </Button>
                          <Button 
                            onClick={() => {
                              const url = `https://maps.google.com/maps?daddr=${cinema.latitude},${cinema.longitude}`;
                              window.open(url, '_blank');
                            }}
                            size="sm"
                            variant="outline"
                          >
                            <NavigationIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Trending Tab */}
          <TabsContent value="trending" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Trending Movies & Shows
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {trendingMovies.map((movie) => (
                    <Card 
                      key={movie.id} 
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => navigate(`/movie/${movie.id}`)}
                    >
                      <CardContent className="p-3">
                        <div className="aspect-[2/3] mb-2 rounded-lg overflow-hidden bg-muted">
                          {movie.poster_path ? (
                            <img 
                              src={tmdbService.getPosterUrl(movie.poster_path, 'w300')}
                              alt={movie.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Film className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <h4 className="text-sm font-medium line-clamp-2">{movie.title}</h4>
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="h-3 w-3 text-yellow-500" />
                          <span className="text-xs text-muted-foreground">
                            {movie.vote_average?.toFixed(1)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Filming Locations Tab */}
          <TabsContent value="filming" className="space-y-4">
            {filmingLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <div className="animate-pulse space-y-3">
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                        <div className="h-3 bg-muted rounded w-1/4"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filmingLocations.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Camera className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Filming Locations Found</h3>
                  <p className="text-muted-foreground mb-4">
                    No movies or TV shows found that were filmed within {radius} miles of your location. Try increasing your search radius.
                  </p>
                  <Button onClick={() => setShowManualInput(true)} variant="outline">
                    Try Different Location
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filmingLocations.map((location) => (
                  <Card key={location.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            {location.type === 'tv' ? <Tv className="h-5 w-5" /> : <Film className="h-5 w-5" />}
                            {location.title}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            {location.year && (
                              <Badge variant="outline">{location.year}</Badge>
                            )}
                            {location.distance && (
                              <Badge variant="secondary">
                                {formatDistance(location.distance)}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-start gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>Filmed at: {location.location}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Celebrities Tab */}
          <TabsContent value="celebrities" className="space-y-4">
            {celebritiesLoading ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <div className="animate-pulse flex gap-3">
                        <div className="w-12 h-12 bg-muted rounded-full"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-muted rounded w-1/2"></div>
                          <div className="h-3 bg-muted rounded w-3/4"></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : celebrities.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Local Stars Found</h3>
                  <p className="text-muted-foreground mb-4">
                    No famous actors, directors, or crew members found who were born within {radius} miles of your location. Try increasing your search radius.
                  </p>
                  <Button onClick={() => setShowManualInput(true)} variant="outline">
                    Try Different Location
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {celebrities.map((celebrity) => (
                  <Card key={celebrity.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex gap-3">
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                          <Star className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold">{celebrity.name}</h4>
                              <p className="text-sm text-muted-foreground">{celebrity.known_for_department}</p>
                            </div>
                            {celebrity.distance && (
                              <Badge variant="secondary" className="text-xs">
                                {formatDistance(celebrity.distance)}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-start gap-2 mt-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <span>Born in: {celebrity.birth_place}</span>
                          </div>
                          {celebrity.birth_date && (
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>{new Date(celebrity.birth_date).getFullYear()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Navigation />
    </div>
  );
};

export default Local;