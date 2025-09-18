import { useState } from 'react';
import { tmdbService } from '@/lib/tmdb';

interface FilmingLocation {
  id: string;
  title: string;
  type: 'movie' | 'tv';
  year?: number;
  location: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  poster_path?: string;
  tmdb_id?: number;
  distance?: number;
}

export const useFilmingLocations = () => {
  const [locations, setLocations] = useState<FilmingLocation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFilmingLocations = async (latitude: number, longitude: number, radiusKm: number) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Wikidata SPARQL query to find filming and narrative locations for both films and TV
      const sparqlQuery = `
PREFIX wd: <http://www.wikidata.org/entity/>
PREFIX wdt: <http://www.wikidata.org/prop/direct/>
PREFIX wikibase: <http://wikiba.se/ontology#>
PREFIX bd: <http://www.bigdata.com/rdf#>
PREFIX geo: <http://www.opengis.net/ont/geosparql#>

SELECT DISTINCT ?film ?filmLabel ?location ?locationLabel ?coords ?year ?type WHERE {
  {
    ?film wdt:P31/wdt:P279* wd:Q11424 .
    BIND("movie" as ?type)
  }
  UNION
  {
    ?film wdt:P31/wdt:P279* wd:Q5398426 .
    BIND("tv" as ?type)
  }
  {
    ?film wdt:P915 ?location .
  }
  UNION
  {
    ?film wdt:P840 ?location .
  }
  ?location wdt:P625 ?coords .
  OPTIONAL { ?film wdt:P577 ?date . BIND(YEAR(?date) as ?year) }
  SERVICE wikibase:around {
    ?location wdt:P625 ?coords .
    bd:serviceParam wikibase:center "Point(${longitude} ${latitude})"^^geo:wktLiteral .
    bd:serviceParam wikibase:radius "${radiusKm}" .
  }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en" . }
}
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

      const filmingLocations: FilmingLocation[] = results.map((result: any, index: number) => {
        const coordsStr = result.coords?.value;
        let coordinates = null;
        
        if (coordsStr) {
          // Parse "Point(lng lat)" format
          const match = coordsStr.match(/Point\(([^)]+)\)/);
          if (match) {
            const [lng, lat] = match[1].split(' ').map(Number);
            coordinates = { lat, lng };
            
            // Calculate distance
            const distance = calculateDistance(latitude, longitude, lat, lng);
            return {
              id: `filming-${index}`,
              title: result.filmLabel?.value || 'Unknown Film',
              type: (result.type?.value as 'movie' | 'tv') || 'movie',
              year: result.year?.value ? parseInt(result.year.value) : undefined,
              location: result.locationLabel?.value || 'Unknown Location',
              coordinates,
              distance: Math.round(distance * 10) / 10
            };
          }
        }

        return {
          id: `filming-${index}`,
          title: result.filmLabel?.value || 'Unknown Film',
          type: (result.type?.value as 'movie' | 'tv') || 'movie',
          year: result.year?.value ? parseInt(result.year.value) : undefined,
          location: result.locationLabel?.value || 'Unknown Location',
          coordinates,
        };
      }).filter(location => location.coordinates); // Only keep locations with valid coordinates

      // Enrich with TMDB posters
      const enrichedLocations = await Promise.all(
        filmingLocations.map(async (location) => {
          try {
            if (location.type === 'movie') {
              const searchResults = await tmdbService.searchMovies(location.title, location.year);
              if (searchResults.results && searchResults.results.length > 0) {
                const movie = searchResults.results[0];
                return {
                  ...location,
                  poster_path: movie.poster_path,
                  tmdb_id: movie.id
                };
              }
            } else if (location.type === 'tv') {
              const searchResults = await tmdbService.searchTVShows(location.title);
              if (searchResults.results && searchResults.results.length > 0) {
                const show = searchResults.results[0];
                return {
                  ...location,
                  poster_path: show.poster_path,
                  tmdb_id: show.id
                };
              }
            }
          } catch (error) {
            console.error('Error enriching location with TMDB:', error);
          }
          return location;
        })
      );

      setLocations(enrichedLocations.sort((a, b) => (a.distance || 0) - (b.distance || 0)));
      
    } catch (error) {
      console.error('Error fetching filming locations:', error);
      setError('Failed to load filming locations. Please try again.');
      setLocations([]);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    locations,
    isLoading,
    error,
    fetchFilmingLocations,
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