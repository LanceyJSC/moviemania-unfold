import { useState } from 'react';

interface OverpassCinema {
  id: string;
  name: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  distance?: number;
}

export const useOverpassCinemas = () => {
  const [cinemas, setCinemas] = useState<OverpassCinema[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOverpassCinemas = async (latitude: number, longitude: number, radiusKm: number) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Overpass API query for cinemas within radius
      const overpassQuery = `
        [out:json][timeout:25];
        (
          node["amenity"="cinema"](around:${radiusKm * 1000},${latitude},${longitude});
          way["amenity"="cinema"](around:${radiusKm * 1000},${latitude},${longitude});
          relation["amenity"="cinema"](around:${radiusKm * 1000},${latitude},${longitude});
        );
        out center;
      `;

      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `data=${encodeURIComponent(overpassQuery)}`,
      });

      if (!response.ok) {
        throw new Error(`Overpass API error: ${response.status}`);
      }

      const data = await response.json();
      
      const overpassCinemas: OverpassCinema[] = data.elements
        .filter((element: any) => element.tags?.name) // Only include cinemas with names
        .map((element: any, index: number) => {
          const lat = element.lat || element.center?.lat || 0;
          const lng = element.lon || element.center?.lon || 0;
          
          const distance = calculateDistance(latitude, longitude, lat, lng);
          
          return {
            id: `overpass-${element.id || index}`,
            name: element.tags.name,
            address: element.tags['addr:street'] 
              ? `${element.tags['addr:housenumber'] || ''} ${element.tags['addr:street']}`.trim()
              : 'Address not available',
            city: element.tags['addr:city'] || element.tags['addr:town'] || 'Unknown',
            latitude: lat,
            longitude: lng,
            distance: Math.round(distance * 10) / 10
          };
        })
        .filter((cinema: OverpassCinema) => cinema.distance <= radiusKm)
        .sort((a: OverpassCinema, b: OverpassCinema) => a.distance! - b.distance!);

      setCinemas(overpassCinemas);
      
    } catch (error) {
      console.error('Error fetching Overpass cinemas:', error);
      setError('Failed to load additional cinema data from OpenStreetMap');
      setCinemas([]);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    cinemas,
    isLoading,
    error,
    fetchOverpassCinemas,
  };
};

// Helper function to calculate distance between two coordinates
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}