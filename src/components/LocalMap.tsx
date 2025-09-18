import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, MapPin, Navigation, Camera, Users } from 'lucide-react';

// Fix for default markers in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons
const createCustomIcon = (color: string) => L.divIcon({
  className: 'custom-marker',
  html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const cinemaIcon = createCustomIcon('#3b82f6'); // blue
const filmingIcon = createCustomIcon('#10b981'); // green  
const celebrityIcon = createCustomIcon('#f59e0b'); // orange

interface MapProps {
  center: [number, number];
  radius: number;
  cinemas: any[];
  filmingLocations: any[];
  celebrities: any[];
  onCinemaClick: (cinema: any) => void;
  onFilmingLocationClick: (location: any) => void;
  onCelebrityClick: (celebrity: any) => void;
  showCinemas: boolean;
  showFilming: boolean;
  showCelebrities: boolean;
}

// Component to update map view when center changes
function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export const LocalMap = ({
  center,
  radius,
  cinemas,
  filmingLocations,
  celebrities,
  onCinemaClick,
  onFilmingLocationClick,
  onCelebrityClick,
  showCinemas,
  showFilming,
  showCelebrities
}: MapProps) => {
  const mapRef = useRef<L.Map | null>(null);

  // Calculate zoom level based on radius
  const getZoomLevel = (radiusKm: number) => {
    if (radiusKm <= 5) return 12;
    if (radiusKm <= 10) return 11;
    if (radiusKm <= 25) return 10;
    return 9;
  };

  const formatDistance = (distance?: number) => {
    if (!distance) return '';
    const miles = distance * 0.621371;
    return `${miles.toFixed(1)} mi`;
  };

  return (
    <div className="relative h-[400px] w-full rounded-lg overflow-hidden border">
      <MapContainer
        center={center}
        zoom={getZoomLevel(radius)}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
      >
        <ChangeView center={center} zoom={getZoomLevel(radius)} />
        
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Cinemas */}
        {showCinemas && cinemas.map((cinema) => (
          <Marker
            key={cinema.id}
            position={[cinema.latitude, cinema.longitude]}
            icon={cinemaIcon}
          >
            <Popup>
              <div className="p-2 min-w-[200px]">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-sm">{cinema.name}</h4>
                  {cinema.distance && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {formatDistance(cinema.distance)}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                  <MapPin className="h-3 w-3" />
                  <span>{cinema.address}, {cinema.city}</span>
                </div>
                <div className="flex gap-1">
                  <Button 
                    size="sm" 
                    className="text-xs h-7"
                    onClick={() => onCinemaClick(cinema)}
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    Showtimes
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="text-xs h-7"
                    onClick={() => {
                      const url = `https://maps.google.com/maps?daddr=${cinema.latitude},${cinema.longitude}`;
                      window.open(url, '_blank');
                    }}
                  >
                    <Navigation className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Filming Locations */}
        {showFilming && filmingLocations.map((location) => (
          <Marker
            key={location.id}
            position={[location.coordinates.lat, location.coordinates.lng]}
            icon={filmingIcon}
          >
            <Popup>
              <div className="p-2 min-w-[200px]">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-sm">{location.title}</h4>
                  {location.distance && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {formatDistance(location.distance)}
                    </Badge>
                  )}
                </div>
                {location.year && (
                  <p className="text-xs text-muted-foreground mb-1">({location.year})</p>
                )}
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                  <Camera className="h-3 w-3" />
                  <span>Filmed at {location.location}</span>
                </div>
                <Button 
                  size="sm" 
                  className="text-xs h-7 w-full"
                  onClick={() => onFilmingLocationClick(location)}
                >
                  View Details
                </Button>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Celebrities */}
        {showCelebrities && celebrities.map((celebrity) => (
          <Marker
            key={celebrity.id}
            position={[celebrity.birth_coordinates?.lat || 0, celebrity.birth_coordinates?.lng || 0]}
            icon={celebrityIcon}
          >
            <Popup>
              <div className="p-2 min-w-[200px]">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-sm">{celebrity.name}</h4>
                  {celebrity.distance && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {formatDistance(celebrity.distance)}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mb-1">{celebrity.known_for_department}</p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                  <Users className="h-3 w-3" />
                  <span>Born in {celebrity.birth_place}</span>
                </div>
                <Button 
                  size="sm" 
                  className="text-xs h-7 w-full"
                  onClick={() => onCelebrityClick(celebrity)}
                >
                  View Profile
                </Button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};