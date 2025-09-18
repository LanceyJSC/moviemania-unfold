import { useState } from 'react';

interface Celebrity {
  id: string;
  name: string;
  known_for_department: string;
  profile_path?: string;
  birth_place?: string;
  birth_date?: string;
  known_for?: string[];
  wikidata_id?: string;
  distance?: number;
}

export const useLocalCelebrities = () => {
  const [celebrities, setCelebrities] = useState<Celebrity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLocalCelebrities = async (latitude: number, longitude: number, radiusKm: number) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Wikidata SPARQL query to find celebrities born in the area
      const sparqlQuery = `
        SELECT DISTINCT ?person ?personLabel ?birthPlace ?birthPlaceLabel ?coords ?birthDate ?occupation ?occupationLabel WHERE {
          ?person wdt:P31 wd:Q5 ;              # human
                  wdt:P19 ?birthPlace ;         # place of birth
                  wdt:P106 ?occupation .        # occupation
          
          ?birthPlace wdt:P625 ?coords .        # coordinates of birth place
          
          # Filter by film/TV related occupations
          VALUES ?occupation {
            wd:Q33999     # actor
            wd:Q2526255   # film director
            wd:Q3455803   # director
            wd:Q1053574   # film producer
            wd:Q28389     # screenwriter
            wd:Q483501    # artist
            wd:Q177220    # singer
            wd:Q639669    # musician
          }
          
          OPTIONAL { ?person wdt:P569 ?birthDate . }
          
          # Get location coordinates and filter by distance
          SERVICE wikibase:around {
            ?birthPlace wdt:P625 ?coords .
            bd:serviceParam wikibase:center "Point(${longitude} ${latitude})"^^geo:wktLiteral .
            bd:serviceParam wikibase:radius "${radiusKm}" .
          }
          
          SERVICE wikibase:label { bd:serviceParam wikibase:language "en" . }
        }
        ORDER BY ?personLabel
        LIMIT 30
      `;

      const encodedQuery = encodeURIComponent(sparqlQuery);
      const wikidataUrl = `https://query.wikidata.org/sparql?query=${encodedQuery}&format=json`;
      
      const response = await fetch(wikidataUrl, {
        headers: {
          'Accept': 'application/sparql-results+json',
          'User-Agent': 'LocalCinemaApp/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`Wikidata API error: ${response.status}`);
      }

      const data = await response.json();
      const results = data.results?.bindings || [];

      // Group results by person to avoid duplicates
      const celebrityMap = new Map<string, Celebrity>();

      results.forEach((result: any) => {
        const personUri = result.person?.value;
        const wikidataId = personUri?.split('/').pop();
        
        if (!celebrityMap.has(personUri)) {
          const coordsStr = result.coords?.value;
          let distance = null;
          
          if (coordsStr) {
            // Parse "Point(lng lat)" format
            const match = coordsStr.match(/Point\(([^)]+)\)/);
            if (match) {
              const [lng, lat] = match[1].split(' ').map(Number);
              distance = calculateDistance(latitude, longitude, lat, lng);
            }
          }

          celebrityMap.set(personUri, {
            id: wikidataId || personUri,
            name: result.personLabel?.value || 'Unknown',
            known_for_department: mapOccupation(result.occupationLabel?.value || ''),
            birth_place: result.birthPlaceLabel?.value || 'Unknown Location',
            birth_date: result.birthDate?.value,
            wikidata_id: wikidataId,
            distance: distance ? Math.round(distance * 10) / 10 : undefined,
            known_for: []
          });
        } else {
          // Add additional occupations
          const existing = celebrityMap.get(personUri)!;
          const newOccupation = mapOccupation(result.occupationLabel?.value || '');
          if (!existing.known_for_department.includes(newOccupation)) {
            existing.known_for_department += `, ${newOccupation}`;
          }
        }
      });

      const celebrityList = Array.from(celebrityMap.values())
        .sort((a, b) => (a.distance || 0) - (b.distance || 0));

      setCelebrities(celebrityList);
      
    } catch (error) {
      console.error('Error fetching local celebrities:', error);
      setError('Failed to load local celebrities. Please try again.');
      setCelebrities([]);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    celebrities,
    isLoading,
    error,
    fetchLocalCelebrities,
  };
};

// Helper function to map Wikidata occupations to more user-friendly terms
function mapOccupation(occupation: string): string {
  const occupationMap: { [key: string]: string } = {
    'actor': 'Actor',
    'film director': 'Director',
    'director': 'Director',
    'film producer': 'Producer',
    'screenwriter': 'Writer',
    'singer': 'Singer',
    'musician': 'Musician',
    'artist': 'Artist'
  };

  return occupationMap[occupation.toLowerCase()] || occupation;
}

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