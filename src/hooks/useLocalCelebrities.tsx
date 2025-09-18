import { useState } from 'react';
import { tmdbService } from '@/lib/tmdb';

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
  birth_coordinates?: { lat: number; lng: number };
}

export const useLocalCelebrities = () => {
  const [celebrities, setCelebrities] = useState<Celebrity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLocalCelebrities = async (latitude: number, longitude: number, radiusKm: number, cityName?: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Wikidata SPARQL query to find celebrities born in the area
      const sparqlQuery = `
PREFIX wd: <http://www.wikidata.org/entity/>
PREFIX wdt: <http://www.wikidata.org/prop/direct/>
PREFIX wikibase: <http://wikiba.se/ontology#>
PREFIX bd: <http://www.bigdata.com/rdf#>
PREFIX geo: <http://www.opengis.net/ont/geosparql#>

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
    wd:Q177220    # singer
    wd:Q639669    # musician
    wd:Q245068    # comedian
    wd:Q947873    # television presenter
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
LIMIT 100
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
          let lat: number | null = null;
          let lng: number | null = null;
          
          if (coordsStr) {
            // Parse "Point(lng lat)" format
            const match = coordsStr.match(/Point\(([^)]+)\)/);
            if (match) {
              const parts = match[1].split(' ').map(Number);
              lng = parts[0];
              lat = parts[1];
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
            known_for: [],
            birth_coordinates: lat !== null && lng !== null ? { lat, lng } : undefined
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

      // Enrich with TMDB profile images
      const enrichedCelebrities = await Promise.all(
        celebrityList.map(async (celebrity) => {
          try {
            const searchResults = await tmdbService.searchMulti(celebrity.name);
            if (searchResults.results && searchResults.results.length > 0) {
              // Find the person result
              const person = searchResults.results.find((result: any) => result.media_type === 'person') as any;
              if (person) {
                return {
                  ...celebrity,
                  profile_path: person.profile_path,
                  known_for: person.known_for?.map((item: any) => item.title || item.name).slice(0, 3) || []
                };
              }
            }
          } catch (error) {
            console.error('Error enriching celebrity with TMDB:', error);
          }
          return celebrity;
        })
      );

      if (enrichedCelebrities.length === 0 && cityName) {
        const safeCity = (cityName || '').replace(/"/g, '\"');
        const fallbackQuery = `
PREFIX wd: <http://www.wikidata.org/entity/>
PREFIX wdt: <http://www.wikidata.org/prop/direct/>
PREFIX wikibase: <http://wikiba.se/ontology#>
PREFIX bd: <http://www.bigdata.com/rdf#>
PREFIX geo: <http://www.opengis.net/ont/geosparql#>

SELECT DISTINCT ?person ?personLabel ?birthPlace ?birthPlaceLabel ?coords ?birthDate ?occupation ?occupationLabel WHERE {
  ?person wdt:P31 wd:Q5 ; wdt:P19 ?birthPlace ; wdt:P106 ?occupation .
  ?birthPlace wdt:P625 ?coords .
  VALUES ?occupation { wd:Q33999 wd:Q2526255 wd:Q3455803 wd:Q1053574 wd:Q28389 wd:Q177220 wd:Q639669 wd:Q245068 wd:Q947873 }
  OPTIONAL { ?person wdt:P569 ?birthDate . }
  FILTER(CONTAINS(LCASE(STR(?birthPlaceLabel)), LCASE("${safeCity}")))
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en" . }
}
ORDER BY ?personLabel
LIMIT 100`;
        const fbResp = await fetch(`https://query.wikidata.org/sparql?query=${encodeURIComponent(fallbackQuery)}&format=json`, {
          headers: { 'Accept': 'application/sparql-results+json', 'User-Agent': 'LocalCinemaApp/1.0' }
        });
        if (fbResp.ok) {
          const fbData = await fbResp.json();
          const fbResults = fbData.results?.bindings || [];
          const celebrityMap2 = new Map<string, Celebrity>();
          fbResults.forEach((result: any) => {
            const personUri = result.person?.value;
            const wikidataId = personUri?.split('/').pop();
            if (!celebrityMap2.has(personUri)) {
              const coordsStr = result.coords?.value;
              let distance: number | undefined = undefined;
              let lat: number | null = null;
              let lng: number | null = null;
              if (coordsStr) {
                const match = coordsStr.match(/Point\(([^)]+)\)/);
                if (match) {
                  const parts = match[1].split(' ').map(Number);
                  lng = parts[0];
                  lat = parts[1];
                  distance = Math.round(calculateDistance(latitude, longitude, lat, lng) * 10) / 10;
                }
              }
              celebrityMap2.set(personUri, {
                id: wikidataId || personUri,
                name: result.personLabel?.value || 'Unknown',
                known_for_department: mapOccupation(result.occupationLabel?.value || ''),
                birth_place: result.birthPlaceLabel?.value || 'Unknown Location',
                birth_date: result.birthDate?.value,
                wikidata_id: wikidataId,
                distance,
                known_for: [],
                birth_coordinates: lat !== null && lng !== null ? { lat, lng } : undefined
              });
            } else {
              const existing = celebrityMap2.get(personUri)!;
              const newOccupation = mapOccupation(result.occupationLabel?.value || '');
              if (!existing.known_for_department.includes(newOccupation)) {
                existing.known_for_department += `, ${newOccupation}`;
              }
            }
          });
          const celebList2 = Array.from(celebrityMap2.values()).sort((a, b) => (a.distance || 0) - (b.distance || 0));
          const enriched2 = await Promise.all(
            celebList2.map(async (celebrity) => {
              try {
                const searchResults = await tmdbService.searchMulti(celebrity.name);
                if (searchResults.results && searchResults.results.length > 0) {
                  const person: any = searchResults.results.find((r: any) => r.media_type === 'person');
                  if (person) {
                    return { ...celebrity, profile_path: person.profile_path, known_for: person.known_for?.map((i: any) => i.title || i.name).slice(0,3) || [] };
                  }
                }
              } catch (_) {}
              return celebrity;
            })
          );
          setCelebrities(enriched2);
        } else {
          setCelebrities(enrichedCelebrities);
        }
      } else {
        setCelebrities(enrichedCelebrities);
      }
      
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