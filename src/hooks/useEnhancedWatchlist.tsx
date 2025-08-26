import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface EnhancedWatchlistItem {
  id: string;
  user_id: string;
  collection_id?: string;
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

export const useEnhancedWatchlist = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<EnhancedWatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchWatchlistItems();
    }
  }, [user]);

  const fetchWatchlistItems = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('enhanced_watchlist_items')
        .select('*')
        .eq('user_id', user.id)
        .order('added_at', { ascending: false });

      if (error) throw error;

      setItems((data || []) as EnhancedWatchlistItem[]);
    } catch (error) {
      console.error('Error fetching watchlist items:', error);
      toast.error('Failed to load watchlist items');
    } finally {
      setLoading(false);
    }
  };

  const addItem = async (
    movieId: number,
    movieTitle: string,
    moviePoster?: string,
    options?: {
      collectionId?: string;
      priority?: 'low' | 'medium' | 'high';
      personalNotes?: string;
      moodTags?: string[];
      expectedWatchDate?: string;
    }
  ) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('enhanced_watchlist_items')
        .insert({
          user_id: user.id,
          movie_id: movieId,
          movie_title: movieTitle,
          movie_poster: moviePoster,
          collection_id: options?.collectionId,
          priority: options?.priority || 'medium',
          personal_notes: options?.personalNotes,
          mood_tags: options?.moodTags || [],
          expected_watch_date: options?.expectedWatchDate
        })
        .select()
        .single();

      if (error) throw error;

      setItems(prev => [data as EnhancedWatchlistItem, ...prev]);
      toast.success(`Added "${movieTitle}" to enhanced watchlist!`);
      return data;
    } catch (error) {
      console.error('Error adding watchlist item:', error);
      toast.error('Failed to add item to watchlist');
      return null;
    }
  };

  const updateItem = async (
    id: string,
    updates: Partial<EnhancedWatchlistItem>
  ) => {
    try {
      const { error } = await supabase
        .from('enhanced_watchlist_items')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setItems(prev =>
        prev.map(item => item.id === id ? { ...item, ...updates } : item)
      );
      toast.success('Watchlist item updated!');
    } catch (error) {
      console.error('Error updating watchlist item:', error);
      toast.error('Failed to update item');
    }
  };

  const removeItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('enhanced_watchlist_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setItems(prev => prev.filter(item => item.id !== id));
      toast.success('Item removed from watchlist!');
    } catch (error) {
      console.error('Error removing watchlist item:', error);
      toast.error('Failed to remove item');
    }
  };

  const markAsWatched = async (id: string) => {
    try {
      const { error } = await supabase
        .from('enhanced_watchlist_items')
        .update({ 
          watched_at: new Date().toISOString(),
          progress_percent: 100 
        })
        .eq('id', id);

      if (error) throw error;

      setItems(prev =>
        prev.map(item => 
          item.id === id 
            ? { ...item, watched_at: new Date().toISOString(), progress_percent: 100 }
            : item
        )
      );
      toast.success('Marked as watched! 🎬');
    } catch (error) {
      console.error('Error marking as watched:', error);
      toast.error('Failed to mark as watched');
    }
  };

  const updateProgress = async (id: string, progressPercent: number) => {
    try {
      const { error } = await supabase
        .from('enhanced_watchlist_items')
        .update({ progress_percent: progressPercent })
        .eq('id', id);

      if (error) throw error;

      setItems(prev =>
        prev.map(item => 
          item.id === id ? { ...item, progress_percent: progressPercent } : item
        )
      );
    } catch (error) {
      console.error('Error updating progress:', error);
      toast.error('Failed to update progress');
    }
  };

  const getItemsByCollection = (collectionId?: string) => {
    return items.filter(item => item.collection_id === collectionId);
  };

  const getItemsByPriority = (priority: 'low' | 'medium' | 'high') => {
    return items.filter(item => item.priority === priority);
  };

  const getItemsByMoodTag = (moodTag: string) => {
    return items.filter(item => item.mood_tags.includes(moodTag));
  };

  const getWatchedItems = () => {
    return items.filter(item => item.watched_at);
  };

  const getUnwatchedItems = () => {
    return items.filter(item => !item.watched_at);
  };

  return {
    items,
    loading,
    addItem,
    updateItem,
    removeItem,
    markAsWatched,
    updateProgress,
    getItemsByCollection,
    getItemsByPriority,
    getItemsByMoodTag,
    getWatchedItems,
    getUnwatchedItems,
    refetch: fetchWatchlistItems
  };
};