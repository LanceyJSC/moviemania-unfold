import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSubscription } from '@/hooks/useSubscription';

interface WatchlistCollection {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  is_public: boolean;
  color: string;
  created_at: string;
  updated_at: string;
}

interface WatchlistItem {
  id: string;
  user_id: string;
  collection_id: string;
  movie_id: number;
  movie_title: string;
  movie_poster?: string;
  priority: 'low' | 'medium' | 'high';
  personal_notes?: string;
  mood_tags: string[];
  progress_percent: number;
  expected_watch_date?: string;
  added_at: string;
  watched_at?: string;
}

export const useWatchlistCollections = () => {
  const { user } = useAuth();
  const { getLimit, isPro } = useSubscription();
  const [collections, setCollections] = useState<WatchlistCollection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchCollections();
    }
  }, [user]);

  const fetchCollections = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('watchlist_collections')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setCollections(data || []);
    } catch (error) {
      console.error('Error fetching collections:', error);
      toast.error('Failed to load collections');
    } finally {
      setLoading(false);
    }
  };

  const createCollection = async (
    name: string,
    description?: string,
    color = '#4F46E5',
    isPublic = false
  ) => {
    if (!user) return null;

    // Check watchlist collection limit for free users
    const maxWatchlists = getLimit('max_watchlists');
    if (collections.length >= maxWatchlists) {
      toast.error(`Free accounts can create up to ${maxWatchlists} watchlist collections. Upgrade to Pro for unlimited.`);
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('watchlist_collections')
        .insert({
          user_id: user.id,
          name,
          description,
          color,
          is_public: isPublic
        })
        .select()
        .single();

      if (error) throw error;

      setCollections(prev => [data, ...prev]);
      toast.success(`Collection "${name}" created!`);
      return data;
    } catch (error) {
      console.error('Error creating collection:', error);
      toast.error('Failed to create collection');
      return null;
    }
  };

  const updateCollection = async (
    id: string,
    updates: Partial<WatchlistCollection>
  ) => {
    try {
      const { error } = await supabase
        .from('watchlist_collections')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setCollections(prev =>
        prev.map(col => col.id === id ? { ...col, ...updates } : col)
      );
      toast.success('Collection updated!');
    } catch (error) {
      console.error('Error updating collection:', error);
      toast.error('Failed to update collection');
    }
  };

  const deleteCollection = async (id: string) => {
    try {
      const { error } = await supabase
        .from('watchlist_collections')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCollections(prev => prev.filter(col => col.id !== id));
      toast.success('Collection deleted!');
    } catch (error) {
      console.error('Error deleting collection:', error);
      toast.error('Failed to delete collection');
    }
  };

  // Computed values for limit checking
  const maxWatchlists = getLimit('max_watchlists');
  const isAtLimit = collections.length >= maxWatchlists;
  const remainingCount = Math.max(0, maxWatchlists - collections.length);

  return {
    collections,
    loading,
    createCollection,
    updateCollection,
    deleteCollection,
    refetch: fetchCollections,
    // Limit info
    isPro,
    isAtLimit,
    remainingCount,
    maxWatchlists,
  };
};