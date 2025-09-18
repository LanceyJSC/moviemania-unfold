import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Cinema, CinemaShowtime } from '@/types/cinema';

export const useCinemas = () => {
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCinemas = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('cinemas')
        .select('*')
        .order('name');

      if (error) throw error;
      setCinemas(data || []);
    } catch (error) {
      console.error('Error fetching cinemas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNearbyCinemas = async (
    latitude: number,
    longitude: number,
    radiusKm: number = 50
  ) => {
    setIsLoading(true);
    try {
      // Calculate rough bounding box for initial filtering
      const latDelta = radiusKm / 111; // Roughly 111 km per degree of latitude
      const lonDelta = radiusKm / (111 * Math.cos((latitude * Math.PI) / 180));

      const { data, error } = await supabase
        .from('cinemas')
        .select('*')
        .gte('latitude', latitude - latDelta)
        .lte('latitude', latitude + latDelta)
        .gte('longitude', longitude - lonDelta)
        .lte('longitude', longitude + lonDelta);

      if (error) throw error;

      // Calculate actual distances and filter
      const cinemasWithDistance = (data || [])
        .map((cinema) => {
          const distance = calculateDistance(
            latitude,
            longitude,
            cinema.latitude,
            cinema.longitude
          );
          return { ...cinema, distance };
        })
        .filter((cinema) => cinema.distance <= radiusKm)
        .sort((a, b) => a.distance - b.distance);

      setCinemas(cinemasWithDistance);
    } catch (error) {
      console.error('Error fetching nearby cinemas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCinemaShowtimes = async (cinemaId: string) => {
    try {
      const { data, error } = await supabase
        .from('cinema_showtimes')
        .select('*')
        .eq('cinema_id', cinemaId)
        .gte('showtime', new Date().toISOString())
        .order('showtime');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching cinema showtimes:', error);
      return [];
    }
  };

  const fetchScrapedShowtimes = async (cinema: Cinema) => {
    try {
      const { data, error } = await supabase.functions.invoke('scrape-showtimes', {
        body: { cinema }
      });

      if (error) throw error;
      return data?.showtimes || [];
    } catch (error) {
      console.error('Error fetching scraped showtimes:', error);
      return [];
    }
  };

  useEffect(() => {
    fetchCinemas();
  }, []);

  return {
    cinemas,
    isLoading,
    fetchCinemas,
    fetchNearbyCinemas,
    fetchCinemaShowtimes,
    fetchScrapedShowtimes,
  };
};

// Helper function to calculate distance between two coordinates
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
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
  const d = R * c; // Distance in km
  return Math.round(d * 10) / 10; // Round to 1 decimal place
}