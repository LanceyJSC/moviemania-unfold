import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface UserLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  created_at: string;
}

export const useUserLocations = () => {
  const { user } = useAuth();
  const [locations, setLocations] = useState<UserLocation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchLocations = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_locations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLocations(data || []);
    } catch (error) {
      console.error('Error fetching user locations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveLocation = async (name: string, latitude: number, longitude: number) => {
    if (!user) {
      toast.error('Please log in to save locations');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_locations')
        .insert({
          user_id: user.id,
          name,
          latitude,
          longitude,
        })
        .select()
        .single();

      if (error) throw error;
      
      setLocations(prev => [data, ...prev]);
      toast.success(`Location "${name}" saved`);
      return data;
    } catch (error) {
      console.error('Error saving location:', error);
      toast.error('Failed to save location');
    }
  };

  const deleteLocation = async (locationId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_locations')
        .delete()
        .eq('id', locationId)
        .eq('user_id', user.id);

      if (error) throw error;
      
      setLocations(prev => prev.filter(loc => loc.id !== locationId));
      toast.success('Location deleted');
    } catch (error) {
      console.error('Error deleting location:', error);
      toast.error('Failed to delete location');
    }
  };

  useEffect(() => {
    fetchLocations();
  }, [user]);

  return {
    locations,
    isLoading,
    saveLocation,
    deleteLocation,
    refetch: fetchLocations,
  };
};