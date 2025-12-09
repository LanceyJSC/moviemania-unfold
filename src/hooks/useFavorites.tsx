import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface FavoriteItem {
  id: string;
  user_id: string;
  movie_id: number;
  movie_title: string;
  movie_poster?: string;
  created_at: string;
}

export const useFavorites = () => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchFavorites();
    } else {
      setFavorites([]);
      setLoading(false);
    }
  }, [user]);

  const fetchFavorites = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('watchlist')
        .select('*')
        .eq('user_id', user.id)
        .eq('list_type', 'liked')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setFavorites((data || []) as FavoriteItem[]);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      toast.error('Failed to load favorites');
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (movieId: number) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('watchlist')
        .delete()
        .eq('user_id', user.id)
        .eq('movie_id', movieId)
        .eq('list_type', 'liked');

      if (error) throw error;

      setFavorites(prev => prev.filter(item => item.movie_id !== movieId));
      toast.success('Removed from favorites');
    } catch (error) {
      console.error('Error removing favorite:', error);
      toast.error('Failed to remove from favorites');
    }
  };

  return {
    favorites,
    loading,
    removeFavorite,
    refetch: fetchFavorites
  };
};