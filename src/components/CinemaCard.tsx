import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, MapPin, Navigation, Phone, Globe } from 'lucide-react';

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
    const url = `https://maps.google.com/maps?daddr=${cinema.latitude},${cinema.longitude}`;
    window.open(url, '_blank');
  };

  const handleWebsite = () => {
    if (cinema.website) {
      window.open(cinema.website, '_blank');
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
            <Navigation className="h-4 w-4" />
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
          {cinema.website && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={handleWebsite}
            >
              <Globe className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};