import { useState, useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { LocalMap } from '@/components/LocalMap';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { useCinemas } from '@/hooks/useCinemas';
import { useOverpassCinemas } from '@/hooks/useOverpassCinemas';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useUserLocations } from '@/hooks/useUserLocations';
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
  Camera,
  Users,
  Film,
  Tv,
  Award,
  MapIcon,
  List,
  Settings,
  Plus,
  Trash2,
  Bookmark,
  Target
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const Local = () => {
  const navigate = useNavigate();
  const { cinemas: supabaseCinemas, isLoading: cinemasLoading, fetchNearbyCinemas } = useCinemas();
  const { cinemas: overpassCinemas, isLoading: overpassLoading, fetchOverpassCinemas } = useOverpassCinemas();
  const { coordinates, error, loading, getCurrentLocation, clearError } = useGeolocation();
  const { preferences, updateLocation } = useUserPreferences();
  const { locations: userLocations, saveLocation, deleteLocation } = useUserLocations();
  const { locations: filmingLocations, isLoading: filmingLoading, fetchFilmingLocations } = useFilmingLocations();
  const { celebrities, isLoading: celebritiesLoading, fetchLocalCelebrities } = useLocalCelebrities();
  
  const [manualLocation, setManualLocation] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [radius, setRadius] = useState([25]); // Slider expects array
  const [currentLocation, setCurrentLocation] = useState<string>('');
  const [currentCoords, setCurrentCoords] = useState<[number, number] | null>(null);
  const [trendingMovies, setTrendingMovies] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [showCinemas, setShowCinemas] = useState(true);
  const [showFilming, setShowFilming] = useState(true);
  const [showCelebrities, setShowCelebrities] = useState(true);
  const [locationName, setLocationName] = useState('');
  const [showSaveLocation, setShowSaveLocation] = useState(false);
  const [autoAttempted, setAutoAttempted] = useState(false);

  // Combine Supabase and Overpass cinemas
  const allCinemas = [...supabaseCinemas, ...overpassCinemas];
  const isAnyCinemaLoading = cinemasLoading || overpassLoading;

  useEffect(() => {
    fetchTrendingMovies();
    
    // Auto-attempt geolocation on mount if not already done
    if (!autoAttempted && !coordinates && !preferences?.location_latitude) {
      setAutoAttempted(true);
      const timer = setTimeout(() => {
        getCurrentLocation();
        // If geolocation is slow, show manual input after 5 seconds
        const fallbackTimer = setTimeout(() => {
          if (!coordinates) {
            setShowManualInput(true);
            toast.info('Enter your location manually to see local content');
          }
        }, 5000);
        
        return () => clearTimeout(fallbackTimer);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (coordinates) {
      updateLocation(coordinates.latitude, coordinates.longitude);
      setCurrentCoords([coordinates.latitude, coordinates.longitude]);
      fetchLocationBasedContent(coordinates.latitude, coordinates.longitude);
      reverseGeocode(coordinates.latitude, coordinates.longitude);
    }
  }, [coordinates, radius]);

  useEffect(() => {
    if (preferences?.location_latitude && preferences?.location_longitude && !coordinates) {
      setCurrentCoords([preferences.location_latitude, preferences.location_longitude]);
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
    const radiusKm = radius[0] * 1.60934;
    
    // Fetch everything in parallel for speed and reliability
    await Promise.all([
      fetchNearbyCinemas(lat, lng, radiusKm),
      fetchOverpassCinemas(lat, lng, radiusKm),
      fetchFilmingLocations(lat, lng, radiusKm),
      fetchLocalCelebrities(lat, lng, radiusKm)
    ]);
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
          setCurrentCoords([lat, lng]);
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

  const handleSavedLocationClick = async (location: any) => {
    setCurrentCoords([location.latitude, location.longitude]);
    await fetchLocationBasedContent(location.latitude, location.longitude);
    reverseGeocode(location.latitude, location.longitude);
    toast.success(`Switched to ${location.name}`);
  };

  const handleSaveCurrentLocation = async () => {
    if (!currentCoords || !locationName.trim()) {
      toast.error('Please enter a name for this location');
      return;
    }
    
    await saveLocation(locationName, currentCoords[0], currentCoords[1]);
    setLocationName('');
    setShowSaveLocation(false);
  };

  const handleCinemaClick = (cinema: any) => {
    if (cinema.id.startsWith('overpass-')) {
      // For OpenStreetMap cinemas, show directions or info
      const url = `https://maps.google.com/maps?daddr=${cinema.latitude},${cinema.longitude}`;
      window.open(url, '_blank');
    } else {
      // For Supabase cinemas, navigate to showtimes
      navigate(`/cinema/${cinema.id}`);
    }
  };

  const handleFilmingLocationClick = (location: any) => {
    if (location.tmdb_id) {
      navigate(location.type === 'tv' ? `/tv/${location.tmdb_id}` : `/movie/${location.tmdb_id}`);
    } else {
      toast.info(`${location.title} was filmed at ${location.location}`);
    }
  };

  const handleCelebrityClick = (celebrity: any) => {
    toast.info(`${celebrity.name} - ${celebrity.known_for_department} born in ${celebrity.birth_place}`);
  };

  const formatDistance = (distance?: number) => {
    if (!distance) return '';
    // Convert km to miles for display
    const miles = distance * 0.621371;
    return `${miles.toFixed(1)} mi`;
  };

  const getDataStatusText = () => {
    const cinemaCount = allCinemas.length;
    const filmingCount = filmingLocations.length;
    const celebrityCount = celebrities.length;
    
    return `${cinemaCount} cinemas • ${filmingCount} filming spots • ${celebrityCount} stars`;
  };

  if (!currentCoords && !loading && !error && !showManualInput) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pb-32">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-6 text-center">
            <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Find Local Cinema Content</h2>
            <p className="text-muted-foreground mb-6">
              Discover cinemas, filming locations, and celebrities near you
            </p>
            <div className="space-y-3">
              <Button onClick={handleGetLocation} className="w-full" disabled={loading}>
                <NavigationIcon className="h-4 w-4 mr-2" />
                {loading ? 'Finding Location...' : 'Use My Location'}
              </Button>
              <Button 
                onClick={() => setShowManualInput(true)} 
                variant="outline" 
                className="w-full"
              >
                <MapPin className="h-4 w-4 mr-2" />
                Enter Location Manually
              </Button>
            </div>
          </CardContent>
        </Card>
        <Navigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between p-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">Local Cinema</h1>
            {currentLocation && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {currentLocation}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {getDataStatusText()}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
              <Button
                size="sm"
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                className="h-8 w-8 p-0"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'map' ? 'default' : 'ghost'}
                className="h-8 w-8 p-0"
                onClick={() => setViewMode('map')}
              >
                <MapIcon className="h-4 w-4" />
              </Button>
            </div>

            <Button
              onClick={handleGetLocation}
              disabled={loading}
              size="sm"
              variant="outline"
            >
              <NavigationIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Radius Slider */}
        <div className="px-4 pb-4">
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground min-w-[60px]">Radius:</span>
            <Slider
              value={radius}
              onValueChange={setRadius}
              max={50}
              min={5}
              step={5}
              className="flex-1"
            />
            <Badge variant="secondary" className="min-w-[60px] justify-center">
              {radius[0]} mi
            </Badge>
          </div>
        </div>

        {/* Map Controls */}
        {viewMode === 'map' && currentCoords && (
          <div className="px-4 pb-4">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <Switch checked={showCinemas} onCheckedChange={setShowCinemas} />
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  Cinemas
                </label>
                <label className="flex items-center gap-2">
                  <Switch checked={showFilming} onCheckedChange={setShowFilming} />
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  Filming
                </label>
                <label className="flex items-center gap-2">
                  <Switch checked={showCelebrities} onCheckedChange={setShowCelebrities} />
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  Stars
                </label>
              </div>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => setShowSaveLocation(true)}
              >
                <Bookmark className="h-4 w-4 mr-1" />
                Save
              </Button>
            </div>
          </div>
        )}
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

        {/* Save Location Dialog */}
        {showSaveLocation && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="space-y-3">
                <h3 className="font-medium">Save this location</h3>
                <div className="flex gap-2">
                  <Input
                    placeholder="Location name (e.g., Home, Work)"
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSaveCurrentLocation()}
                  />
                  <Button onClick={handleSaveCurrentLocation} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowSaveLocation(false)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Saved Locations */}
        {userLocations.length > 0 && (
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Bookmark className="h-4 w-4" />
                Saved Locations
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex gap-2 flex-wrap">
                {userLocations.map((location) => (
                  <div key={location.id} className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSavedLocationClick(location)}
                    >
                      {location.name}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-destructive"
                      onClick={() => deleteLocation(location.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Map View */}
        {viewMode === 'map' && currentCoords && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <LocalMap
                center={currentCoords}
                radius={radius[0] * 1.60934} // Convert to km
                cinemas={allCinemas}
                filmingLocations={filmingLocations}
                celebrities={celebrities}
                onCinemaClick={handleCinemaClick}
                onFilmingLocationClick={handleFilmingLocationClick}
                onCelebrityClick={handleCelebrityClick}
                showCinemas={showCinemas}
                showFilming={showFilming}
                showCelebrities={showCelebrities}
              />
            </CardContent>
          </Card>
        )}

        {/* List View */}
        {viewMode === 'list' && (
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

            <TabsContent value="cinemas" className="space-y-4">
              {isAnyCinemaLoading ? (
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
              ) : allCinemas.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No Cinemas Found</h3>
                    <p className="text-muted-foreground mb-4">
                      No cinemas found within {radius[0]} miles. Try increasing your search radius.
                    </p>
                    <Button onClick={() => setShowManualInput(true)} variant="outline">
                      Try Different Location
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {allCinemas.map((cinema) => (
                    <Card key={cinema.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                              {cinema.name}
                              {cinema.id.startsWith('overpass-') && (
                                <Badge variant="outline" className="text-xs">
                                  OSM
                                </Badge>
                              )}
                            </CardTitle>
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
                              onClick={() => handleCinemaClick(cinema)}
                              size="sm"
                              className="flex-1"
                            >
                              {cinema.id.startsWith('overpass-') ? (
                                <>
                                  <NavigationIcon className="h-4 w-4 mr-2" />
                                  Directions
                                </>
                              ) : (
                                <>
                                  <Clock className="h-4 w-4 mr-2" />
                                  Showtimes
                                </>
                              )}
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
                      No movies or TV shows found that were filmed within {radius[0]} miles of your location.
                    </p>
                    <Button onClick={() => setShowManualInput(true)} variant="outline">
                      Try Different Location
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {filmingLocations.map((location) => (
                    <Card 
                      key={location.id} 
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleFilmingLocationClick(location)}
                    >
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          {location.poster_path ? (
                            <div className="w-16 h-24 flex-shrink-0 rounded overflow-hidden bg-muted">
                              <img 
                                src={tmdbService.getPosterUrl(location.poster_path, 'w300')}
                                alt={location.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-16 h-24 flex-shrink-0 rounded bg-muted flex items-center justify-center">
                              {location.type === 'tv' ? (
                                <Tv className="h-6 w-6 text-muted-foreground" />
                              ) : (
                                <Film className="h-6 w-6 text-muted-foreground" />
                              )}
                            </div>
                          )}
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-semibold text-sm line-clamp-1">{location.title}</h4>
                              {location.distance && (
                                <Badge variant="secondary" className="ml-2 text-xs">
                                  {formatDistance(location.distance)}
                                </Badge>
                              )}
                            </div>
                            
                            {location.year && (
                              <p className="text-xs text-muted-foreground mb-1">({location.year})</p>
                            )}
                            
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                              <Camera className="h-3 w-3" />
                              <span className="line-clamp-1">Filmed at {location.location}</span>
                            </div>

                            <Badge variant="outline" className="text-xs">
                              {location.type === 'tv' ? 'TV Show' : 'Movie'}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="celebrities" className="space-y-4">
              {celebritiesLoading ? (
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
              ) : celebrities.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No Local Celebrities Found</h3>
                    <p className="text-muted-foreground mb-4">
                      No film/TV celebrities found that were born within {radius[0]} miles of your location.
                    </p>
                    <Button onClick={() => setShowManualInput(true)} variant="outline">
                      Try Different Location
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {celebrities.map((celebrity) => (
                    <Card 
                      key={celebrity.id} 
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleCelebrityClick(celebrity)}
                    >
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          {celebrity.profile_path ? (
                            <div className="w-16 h-16 flex-shrink-0 rounded-full overflow-hidden bg-muted">
                              <img 
                                src={tmdbService.getProfileUrl(celebrity.profile_path, 'w185')}
                                alt={celebrity.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-16 h-16 flex-shrink-0 rounded-full bg-muted flex items-center justify-center">
                              <Users className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-semibold text-sm">{celebrity.name}</h4>
                              {celebrity.distance && (
                                <Badge variant="secondary" className="ml-2 text-xs">
                                  {formatDistance(celebrity.distance)}
                                </Badge>
                              )}
                            </div>
                            
                            <p className="text-xs text-muted-foreground mb-1">
                              {celebrity.known_for_department}
                            </p>
                            
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                              <MapPin className="h-3 w-3" />
                              <span>Born in {celebrity.birth_place}</span>
                            </div>

                            {celebrity.birth_date && (
                              <p className="text-xs text-muted-foreground">
                                {new Date(celebrity.birth_date).getFullYear()}
                              </p>
                            )}

                            {celebrity.known_for && celebrity.known_for.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {celebrity.known_for.slice(0, 2).map((work, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {work}
                                  </Badge>
                                ))}
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
        )}
      </div>

      <Navigation />
    </div>
  );
};

export default Local;
