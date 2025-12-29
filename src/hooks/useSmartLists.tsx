import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface SmartListCriteria {
  type: 'unwatched_year' | 'highly_rated_no_review' | 'recently_added' | 'binge_worthy' | 'genre' | 'custom';
  year?: number;
  minRating?: number;
  daysAgo?: number;
  minSeasons?: number;
  genres?: number[];
}

export interface SmartList {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  criteria: SmartListCriteria;
  created_at: string;
  updated_at: string;
}

export const SMART_LIST_TEMPLATES = [
  {
    name: 'Unwatched from 2024',
    description: 'Movies in your watchlist released in 2024',
    criteria: { type: 'unwatched_year' as const, year: 2024 },
    icon: '📅'
  },
  {
    name: 'Loved but Not Reviewed',
    description: 'Movies you rated 4+ flames but haven\'t written a review for',
    criteria: { type: 'highly_rated_no_review' as const, minRating: 4 },
    icon: '✍️'
  },
  {
    name: 'Recently Added',
    description: 'Watchlist additions from the last 30 days',
    criteria: { type: 'recently_added' as const, daysAgo: 30 },
    icon: '🆕'
  },
  {
    name: 'Binge-Worthy Series',
    description: 'TV shows with 3+ seasons to marathon',
    criteria: { type: 'binge_worthy' as const, minSeasons: 3 },
    icon: '📺'
  }
];

export const useSmartLists = () => {
  const { user } = useAuth();
  const [smartLists, setSmartLists] = useState<SmartList[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSmartLists = async () => {
    if (!user) {
      setSmartLists([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('smart_lists')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Parse the criteria from JSON
      const parsedData = (data || []).map(list => ({
        ...list,
        criteria: list.criteria as SmartListCriteria
      }));
      
      setSmartLists(parsedData);
    } catch (error) {
      console.error('Error fetching smart lists:', error);
    } finally {
      setLoading(false);
    }
  };

  const createSmartList = async (name: string, description: string, criteria: SmartListCriteria) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('smart_lists')
        .insert({
          user_id: user.id,
          name,
          description,
          criteria: criteria as any
        })
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Smart list created!');
      await fetchSmartLists();
      return data;
    } catch (error) {
      console.error('Error creating smart list:', error);
      toast.error('Failed to create smart list');
      return null;
    }
  };

  const deleteSmartList = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('smart_lists')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      
      toast.success('Smart list deleted');
      await fetchSmartLists();
      return true;
    } catch (error) {
      console.error('Error deleting smart list:', error);
      toast.error('Failed to delete smart list');
      return false;
    }
  };

  useEffect(() => {
    fetchSmartLists();
  }, [user]);

  return {
    smartLists,
    loading,
    createSmartList,
    deleteSmartList,
    refetch: fetchSmartLists
  };
};
