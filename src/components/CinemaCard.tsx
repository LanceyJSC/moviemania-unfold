import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, MapPin, Navigation as NavigationIcon, Phone, Globe, ExternalLink } from 'lucide-react';

interface Cinema {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  phone?: string;
  website?: string;
  distance?: number;
}

interface CinemaCardProps {
  cinema: Cinema;
  onShowtimes: (cinema: Cinema) => void;
}

export const CinemaCard = ({ cinema, onShowtimes }: CinemaCardProps) => {
  const formatDistance = (distance?: number) => {
    if (!distance) return '';
    const miles = distance * 0.621371;
    return `${miles.toFixed(1)} mi`;
  };

  const handleDirections = () => {
    // Use OpenStreetMap to avoid Google being blocked in sandboxed iframes
    const url = `https://www.openstreetmap.org/?mlat=${cinema.latitude}&mlon=${cinema.longitude}#map=16/${cinema.latitude}/${cinema.longitude}`;
    window.open(url, '_blank', 'noopener');
  };

  const handleWebsite = () => {
    if (cinema.website) {
      window.open(cinema.website, '_blank', 'noopener');
    } else {
      // Fallback: search the web for the cinema's official site
      const q = encodeURIComponent(`${cinema.name} ${cinema.city} official site`);
      window.open(`https://duckduckgo.com/?q=${q}`, '_blank', 'noopener');
    }
  };

  const handlePhone = () => {
    if (cinema.phone) {
      window.location.href = `tel:${cinema.phone}`;
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-lg leading-tight">{cinema.name}</h3>
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
              <MapPin className="h-4 w-4" />
              <span>{cinema.address}, {cinema.city}</span>
            </div>
          </div>
          {cinema.distance && (
            <Badge variant="secondary" className="ml-2">
              {formatDistance(cinema.distance)}
            </Badge>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          <Button 
            size="sm" 
            onClick={() => onShowtimes(cinema)}
            className="flex-1"
          >
            <Clock className="h-4 w-4 mr-2" />
            Show Times
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={handleDirections}
          >
            <NavigationIcon className="h-4 w-4" />
          </Button>
          {cinema.phone && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={handlePhone}
            >
              <Phone className="h-4 w-4" />
            </Button>
          )}
          <Button 
            size="sm" 
            variant="outline"
            onClick={handleWebsite}
          >
            {cinema.website ? <Globe className="h-4 w-4" /> : <ExternalLink className="h-4 w-4" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};