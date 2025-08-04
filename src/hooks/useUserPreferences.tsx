import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

interface UserPreferences {
  id?: string;
  user_id: string;
  preferred_genres?: string[];
  preferred_actors?: string[];
  preferred_directors?: string[];
  location_latitude?: number;
  location_longitude?: number;
  location_city?: string;
  location_country?: string;
  notifications_enabled?: boolean;
  email_notifications?: boolean;
  push_notifications?: boolean;
}

export const useUserPreferences = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPreferences = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      setPreferences(data);
    } catch (error) {
      console.error('Error fetching user preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreferences = async (updates: Partial<UserPreferences>) => {
    if (!user) return;

    try {
      // First try to get existing preferences
      const { data: existing } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      let result;
      
      if (existing) {
        // Update existing record
        const { data, error } = await supabase
          .from('user_preferences')
          .update(updates)
          .eq('user_id', user.id)
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      } else {
        // Insert new record
        const { data, error } = await supabase
          .from('user_preferences')
          .insert({
            user_id: user.id,
            ...updates,
          })
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      }

      setPreferences(result);
      return result;
    } catch (error) {
      console.error('Error updating user preferences:', error);
      throw error;
    }
  };

  const updateLocation = async (
    latitude: number,
    longitude: number,
    city?: string,
    country?: string
  ) => {
    return updatePreferences({
      location_latitude: latitude,
      location_longitude: longitude,
      location_city: city,
      location_country: country,
    });
  };

  useEffect(() => {
    if (user) {
      fetchPreferences();
    }
  }, [user]);

  return {
    preferences,
    isLoading,
    updatePreferences,
    updateLocation,
    refetch: fetchPreferences,
  };
};