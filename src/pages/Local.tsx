import { useState, useEffect, lazy, Suspense } from 'react';
import { Navigation } from '@/components/Navigation';
import { CinemaCard } from '@/components/CinemaCard';
import { CinemaShowtimes } from '@/components/CinemaShowtimes';
import { ErrorBoundary } from '@/components/ErrorBoundary';
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
import { useDebounce } from '@/hooks/useDebounce';
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
  Target,
  Building
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

// Lazy-load the map to prevent initial crashes and heavy bundle cost
const LocalMapLazy = lazy(() => import('@/components/LocalMap').then(m => ({ default: m.LocalMap })));


const Local = () => {
  const navigate = useNavigate();
  const { cinemas: supabaseCinemas, isLoading: cinemasLoading, fetchNearbyCinemas } = useCinemas();
  const { cinemas: overpassCinemas, isLoading: overpassLoading, fetchOverpassCinemas } = useOverpassCinemas();
  const { coordinates, error, loading, getCurrentLocation, clearError } = useGeolocation();
  const { preferences, updateLocation } = useUserPreferences();
  const { locations: userLocations, saveLocation, deleteLocation } = useUserLocations();
  const { locations: filmingLocations, isLoading: filmingLoading, fetchFilmingLocations } = useFilmingLocations();
  const { celebrities, isLoading: celebritiesLoading, fetchLocalCelebrities } = useLocalCelebrities();

  const [radius, setRadius] = useState<number[]>([25]);
  const debouncedRadius = useDebounce(radius[0], 500);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualLocation, setManualLocation] = useState('');
  const [currentLocation, setCurrentLocation] = useState<string>('');
  const [currentCoords, setCurrentCoords] = useState<[number, number] | null>(null);
  const [trendingMovies, setTrendingMovies] = useState<any[]>([]);
  const [nowPlayingMovies, setNowPlayingMovies] = useState<any[]>([]);
  const [upcomingMovies, setUpcomingMovies] = useState<any[]>([]);
  const [popularTV, setPopularTV] = useState<any[]>([]);
  const [onTheAirTV, setOnTheAirTV] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('list');
  const [showCinemas, setShowCinemas] = useState(true);
  const [showFilming, setShowFilming] = useState(true);
  const [showCelebrities, setShowCelebrities] = useState(true);
  const [locationName, setLocationName] = useState('');
  const [showSaveLocation, setShowSaveLocation] = useState(false);
  const [autoAttempted, setAutoAttempted] = useState(false);
  const [selectedCinema, setSelectedCinema] = useState<any>(null);
  const [isShowtimesModalOpen, setIsShowtimesModalOpen] = useState(false);

  // Combine Supabase and Overpass cinemas
  const allCinemas = [...supabaseCinemas, ...overpassCinemas];
  const isAnyCinemaLoading = cinemasLoading || overpassLoading;

  // Auto-trigger location on component mount (once)
  useEffect(() => {
    if (!autoAttempted && !currentCoords && !error) {
      setAutoAttempted(true);
      if (preferences?.location_latitude && preferences?.location_longitude) {
        // Use saved location if available
        setCurrentCoords([preferences.location_latitude, preferences.location_longitude]);
        fetchLocationBasedContent(preferences.location_latitude, preferences.location_longitude);
        if (preferences.location_city) {
          setCurrentLocation(preferences.location_city);
        }
      } else {
        // Try to get current location
        getCurrentLocation();
      }
    }
  }, [autoAttempted, currentCoords, error, preferences, getCurrentLocation]);

  // Update coords when geolocation succeeds
  useEffect(() => {
    if (coordinates && !currentCoords) {
      setCurrentCoords([coordinates.latitude, coordinates.longitude]);
      fetchLocationBasedContent(coordinates.latitude, coordinates.longitude);
      reverseGeocode(coordinates.latitude, coordinates.longitude);
      // Save to preferences
      updateLocation(coordinates.latitude, coordinates.longitude, currentLocation);
    }
  }, [coordinates, currentCoords]);

  // Fetch whenever coordinates change (ensures first load pulls data reliably)
  useEffect(() => {
    if (currentCoords) {
      fetchLocationBasedContent(currentCoords[0], currentCoords[1]);
    }
  }, [currentCoords]);

  // Fetch content when radius changes (debounced)
  useEffect(() => {
    if (currentCoords) {
      fetchLocationBasedContent(currentCoords[0], currentCoords[1], debouncedRadius * 1.60934);
    }
  }, [debouncedRadius, currentCoords]);

  const fetchTrendingMovies = async () => {
    try {
      const [trending, nowPlaying, upcoming, tvPopular, tvOnAir] = await Promise.all([
        tmdbService.getTrendingMovies('week', true),
        tmdbService.getNowPlayingMovies(1, true),
        tmdbService.getUpcomingMovies(1, true),
        tmdbService.getPopularTVShows(1, true),
        tmdbService.getOnTheAirTVShows(1, true),
      ]);
      setTrendingMovies(trending.results.slice(0, 10));
      setNowPlayingMovies(nowPlaying.results.slice(0, 10));
      setUpcomingMovies(upcoming.results.slice(0, 10));
      setPopularTV(tvPopular.results.slice(0, 10));
      setOnTheAirTV(tvOnAir.results.slice(0, 10));
    } catch (error) {
      console.error('Error fetching local content:', error);
    }
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`;
      const response = await fetch(url, {
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'LocalCinemaApp/1.0'
        }
      });
      const data = await response.json();
      const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || 'Unknown Location';
      setCurrentLocation(city);
      
      // Update user preferences with location
      updateLocation(lat, lng, city);
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      setCurrentLocation('Unknown Location');
    }
  };

  const fetchLocationBasedContent = async (lat: number, lng: number, radiusOverrideKm?: number) => {
    // Convert miles to kilometers for API calls
    const radiusKm = typeof radiusOverrideKm === 'number' ? radiusOverrideKm : radius[0] * 1.60934;
    
    // Fetch everything in parallel for speed and reliability
    await Promise.all([
      fetchNearbyCinemas(lat, lng, radiusKm),
      fetchOverpassCinemas(lat, lng, radiusKm),
      fetchFilmingLocations(lat, lng, radiusKm, currentLocation || undefined),
      fetchLocalCelebrities(lat, lng, radiusKm, currentLocation || undefined)
    ]);
  };

  const handleGetLocation = () => {
    clearError();
    getCurrentLocation();
  };

  const handleManualLocationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualLocation.trim()) return;

    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(manualLocation)}&limit=1`);
      const data = await response.json();
      
      if (data.length > 0) {
        const location = data[0];
        const lat = parseFloat(location.lat);
        const lng = parseFloat(location.lon);
        
        setCurrentCoords([lat, lng]);
        setCurrentLocation(location.display_name.split(',')[0]);
        setShowManualInput(false);
        setManualLocation('');
        await fetchLocationBasedContent(lat, lng);
        
        // Update preferences
        updateLocation(lat, lng, location.display_name.split(',')[0]);
        
        toast.success('Location found successfully');
      } else {
        toast.error('Location not found. Please try a different search term.');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      toast.error('Error finding location. Please try again.');
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
    setSelectedCinema(cinema);
    setIsShowtimesModalOpen(true);
  };

  const handleFilmingLocationClick = (location: any) => {
    // Navigate to movie/show details or open modal
    if (location.tmdb_id && (location.type === 'movie' || location.type === 'tv')) {
      navigate(`/${location.type}/${location.tmdb_id}`);
    }
  };

  const handleCelebrityClick = (celebrity: any) => {
    // Navigate to actor details
    if (celebrity.tmdb_id) {
      navigate(`/actor/${celebrity.tmdb_id}`);
    }
  };

  const formatDistance = (distance?: number) => {
    if (!distance) return '';
    const miles = distance * 0.621371;
    return `${miles.toFixed(1)} mi`;
  };

  const getDataStatusText = () => {
    const cinemaCount = allCinemas.length;
    const filmingCount = filmingLocations.length;
    const celebrityCount = celebrities.length;
    
    return `${cinemaCount} cinemas • ${filmingCount} filming spots • ${celebrityCount} stars`;
  };

  // Fetch trending movies on mount
  useEffect(() => {
    fetchTrendingMovies();
  }, []);

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
          </div>
        </div>

        {/* Controls */}
        <div className="p-4 pt-0 space-y-4">
          {/* Radius Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Search Radius</label>
              <Badge variant="outline">{radius[0]} miles</Badge>
            </div>
            <Slider
              value={radius}
              onValueChange={setRadius}
              max={100}
              min={5}
              step={5}
              className="w-full"
            />
          </div>

          {/* Map Controls */}
          {viewMode === 'map' && (
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Switch
                  checked={showCinemas}
                  onCheckedChange={setShowCinemas}
                  id="show-cinemas"
                />
                <label htmlFor="show-cinemas" className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  Cinemas
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={showFilming}
                  onCheckedChange={setShowFilming}
                  id="show-filming"
                />
                <label htmlFor="show-filming" className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  Filming
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={showCelebrities}
                  onCheckedChange={setShowCelebrities}
                  id="show-celebrities"
                />
                <label htmlFor="show-celebrities" className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  Stars
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4">
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <div className="flex-1">
              <p className="text-sm font-medium text-destructive">Location Error</p>
              <p className="text-xs text-destructive/80">{error}</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => setShowManualInput(true)}>
              Enter Manually
            </Button>
          </div>
        </div>
      )}

      {/* Manual Location Input */}
      {showManualInput && (
        <div className="p-4">
          <Card>
            <CardContent className="p-4">
              <form onSubmit={handleManualLocationSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Enter Location</label>
                  <Input
                    value={manualLocation}
                    onChange={(e) => setManualLocation(e.target.value)}
                    placeholder="e.g., Los Angeles, CA or 90210"
                    className="w-full"
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    <MapPin className="h-4 w-4 mr-2" />
                    Search Location
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowManualInput(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Save Current Location */}
      {showSaveLocation && currentCoords && (
        <div className="p-4">
          <Card>
            <CardContent className="p-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Save This Location</label>
                  <Input
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    placeholder="e.g., Home, Work, etc."
                    className="w-full"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSaveCurrentLocation} className="flex-1">
                    <Bookmark className="h-4 w-4 mr-2" />
                    Save Location
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowSaveLocation(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Saved Locations */}
      {userLocations.length > 0 && (
        <div className="p-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Saved Locations</CardTitle>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setShowSaveLocation(true)}
                  disabled={!currentCoords}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {userLocations.map((location) => (
                  <div key={location.id} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 justify-start"
                      onClick={() => handleSavedLocationClick(location)}
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      {location.name}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteLocation(location.id)}
                      className="p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      {currentCoords && (
        <div className="flex-1">
          {/* Map View */}
          {viewMode === 'map' && (
            <div className="p-4">
              <ErrorBoundary
                fallback={
                  <div className="h-[400px] w-full rounded-lg border bg-muted/30 flex items-center justify-center">
                    <div className="text-center text-sm text-muted-foreground">
                      Map failed to load. Please try again or use List view.
                    </div>
                  </div>
                }
              >
                <Suspense
                  fallback={
                    <div className="h-[400px] w-full rounded-lg border bg-muted/30 animate-pulse" />
                  }
                >
                  <LocalMapLazy
                    center={currentCoords}
                    radius={radius[0] * 1.60934}
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
                </Suspense>
              </ErrorBoundary>
            </div>
          )}

          {/* List View */}
          {viewMode === 'list' && (
            <div className="p-4">
              <Tabs defaultValue="cinemas" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="cinemas" className="text-xs">
                    Cinemas ({allCinemas.length})
                  </TabsTrigger>
                  <TabsTrigger value="trending" className="text-xs">
                    Trending
                  </TabsTrigger>
                  <TabsTrigger value="filming" className="text-xs">
                    Filming ({filmingLocations.length})
                  </TabsTrigger>
                  <TabsTrigger value="celebrities" className="text-xs">
                    Stars ({celebrities.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="cinemas" className="mt-4">
                  {isAnyCinemaLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <Card key={i} className="animate-pulse">
                          <CardContent className="p-4">
                            <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-muted rounded w-1/2"></div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {allCinemas.length > 0 ? (
                        allCinemas.map((cinema) => (
                          <CinemaCard 
                            key={cinema.id}
                            cinema={cinema}
                            onShowtimes={handleCinemaClick}
                          />
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <Building className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                          <h3 className="text-lg font-semibold mb-2">No Cinemas Found</h3>
                          <p className="text-muted-foreground mb-4">
                            Try expanding your search radius or checking a different location.
                          </p>
                          <Button 
                            onClick={() => setRadius([Math.min(radius[0] + 10, 100)])}
                            variant="outline"
                          >
                            Expand Search Radius
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="trending" className="mt-4">
                  <div className="grid gap-4">
                    {trendingMovies.map((movie) => (
                      <Card key={movie.id} className="hover:shadow-md transition-shadow cursor-pointer"
                             onClick={() => navigate(`/movie/${movie.id}`)}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            {movie.poster_path && (
                              <img
                                src={tmdbService.getPosterUrl(movie.poster_path, 'w300')}
                                alt={movie.title}
                                className="w-16 h-24 object-cover rounded"
                              />
                            )}
                            <div className="flex-1">
                              <h3 className="font-semibold mb-1">{movie.title}</h3>
                              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                {movie.overview}
                              </p>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary">
                                  <Star className="h-3 w-3 mr-1" />
                                  {movie.vote_average.toFixed(1)}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(movie.release_date).getFullYear()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="filming" className="mt-4">
                  {filmingLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <Card key={i} className="animate-pulse">
                          <CardContent className="p-4">
                            <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-muted rounded w-1/2"></div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : filmingLocations.length > 0 ? (
                    <div className="grid gap-4">
                      {filmingLocations.map((location) => (
                        <Card key={location.id} className="hover:shadow-md transition-shadow cursor-pointer"
                              onClick={() => handleFilmingLocationClick(location)}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="font-semibold">{location.title}</h3>
                              {location.distance && (
                                <Badge variant="secondary">
                                  {formatDistance(location.distance)}
                                </Badge>
                              )}
                            </div>
                            {location.year && (
                              <p className="text-sm text-muted-foreground mb-1">({location.year})</p>
                            )}
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Camera className="h-4 w-4" />
                              <span>Filmed at {location.location}</span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Camera className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Filming Locations Found</h3>
                      <p className="text-muted-foreground">
                        Try expanding your search radius to discover more filming locations.
                      </p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="celebrities" className="mt-4">
                  {celebritiesLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <Card key={i} className="animate-pulse">
                          <CardContent className="p-4">
                            <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-muted rounded w-1/2"></div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : celebrities.length > 0 ? (
                    <div className="grid gap-4">
                      {celebrities.map((celebrity) => (
                        <Card key={celebrity.id} className="hover:shadow-md transition-shadow cursor-pointer"
                              onClick={() => handleCelebrityClick(celebrity)}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-3">
                                {celebrity.profile_path && (
                                  <img
                                    src={tmdbService.getProfileUrl(celebrity.profile_path, 'w185')}
                                    alt={celebrity.name}
                                    className="w-12 h-12 object-cover rounded-full"
                                  />
                                )}
                                <div>
                                  <h3 className="font-semibold">{celebrity.name}</h3>
                                  <p className="text-sm text-muted-foreground">
                                    {celebrity.known_for_department}
                                  </p>
                                </div>
                              </div>
                              {celebrity.distance && (
                                <Badge variant="secondary">
                                  {formatDistance(celebrity.distance)}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                              <Users className="h-4 w-4" />
                              <span>Born in {celebrity.birth_place}</span>
                            </div>
                            {celebrity.known_for && celebrity.known_for.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {celebrity.known_for.slice(0, 3).map((work, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {work}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Local Celebrities Found</h3>
                      <p className="text-muted-foreground">
                        Try expanding your search radius to discover celebrities from your area.
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      )}

      <Navigation />

      {/* Modals */}
      
      <CinemaShowtimes
        cinema={selectedCinema}
        isOpen={isShowtimesModalOpen}
        onClose={() => setIsShowtimesModalOpen(false)}
      />
    </div>
  );
};

export default Local;