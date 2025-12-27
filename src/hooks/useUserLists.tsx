import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSubscription } from '@/hooks/useSubscription';

export const FREE_LIST_LIMIT = 3;

interface UserList {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

interface ListItem {
  id: string;
  list_id: string;
  movie_id: number;
  movie_title: string;
  movie_poster: string | null;
  position: number;
  notes: string | null;
  added_at: string;
}

export const useUserLists = (userId?: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isProUser, loading: subscriptionLoading } = useSubscription();
  const [lists, setLists] = useState<UserList[]>([]);
  const [loading, setLoading] = useState(true);

  const targetUserId = userId || user?.id;
  
  // List limit helpers
  const canCreateList = isProUser || lists.length < FREE_LIST_LIMIT;
  const remainingLists = isProUser ? Infinity : Math.max(0, FREE_LIST_LIMIT - lists.length);

  useEffect(() => {
    if (targetUserId) {
      fetchLists();
    } else {
      setLists([]);
      setLoading(false);
    }
  }, [targetUserId]);

  const fetchLists = async () => {
    if (!targetUserId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_lists')
        .select('*')
        .eq('user_id', targetUserId)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setLists(data || []);
    } catch (error) {
      console.error('Error fetching lists:', error);
    } finally {
      setLoading(false);
    }
  };

  const createList = async (name: string, description?: string, isPublic: boolean = true): Promise<{ data: UserList | null; limitReached?: boolean }> => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to create lists",
        variant: "destructive",
      });
      return { data: null };
    }

    // Check list limit for free users
    if (!isProUser && lists.length >= FREE_LIST_LIMIT) {
      return { data: null, limitReached: true };
    }

    try {
      const { data, error } = await supabase
        .from('user_lists')
        .insert({
          user_id: user.id,
          name,
          description,
          is_public: isPublic
        })
        .select()
        .single();

      if (error) throw error;

      setLists(prev => [data, ...prev]);
      
      toast({
        title: "List created",
        description: `"${name}" has been created`,
      });

      return { data };
    } catch (error) {
      console.error('Error creating list:', error);
      toast({
        title: "Error",
        description: "Failed to create list",
        variant: "destructive",
      });
      return { data: null };
    }
  };

  const updateList = async (listId: string, updates: Partial<UserList>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_lists')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', listId)
        .eq('user_id', user.id);

      if (error) throw error;

      setLists(prev => prev.map(list => 
        list.id === listId ? { ...list, ...updates } : list
      ));
      
      toast({
        title: "List updated",
        description: "Your list has been updated",
      });
    } catch (error) {
      console.error('Error updating list:', error);
      toast({
        title: "Error",
        description: "Failed to update list",
        variant: "destructive",
      });
    }
  };

  const deleteList = async (listId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_lists')
        .delete()
        .eq('id', listId)
        .eq('user_id', user.id);

      if (error) throw error;

      setLists(prev => prev.filter(list => list.id !== listId));
      
      toast({
        title: "List deleted",
        description: "Your list has been deleted",
      });
    } catch (error) {
      console.error('Error deleting list:', error);
      toast({
        title: "Error",
        description: "Failed to delete list",
        variant: "destructive",
      });
    }
  };

  const addToList = async (listId: string, movie: { id: number; title: string; poster?: string }) => {
    if (!user) return;

    try {
      // Get current max position
      const { data: existingItems } = await supabase
        .from('list_items')
        .select('position')
        .eq('list_id', listId)
        .order('position', { ascending: false })
        .limit(1);

      const nextPosition = existingItems && existingItems.length > 0 
        ? existingItems[0].position + 1 
        : 0;

      const { error } = await supabase
        .from('list_items')
        .insert({
          list_id: listId,
          movie_id: movie.id,
          movie_title: movie.title,
          movie_poster: movie.poster,
          position: nextPosition
        });

      if (error) throw error;

      // Update list timestamp
      await supabase
        .from('user_lists')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', listId);

      // Add to activity feed
      await supabase.from('activity_feed').insert({
        user_id: user.id,
        activity_type: 'listed',
        target_type: 'movie',
        target_id: listId,
        movie_id: movie.id,
        movie_title: movie.title,
        movie_poster: movie.poster
      });

      toast({
        title: "Added to list",
        description: `"${movie.title}" has been added`,
      });
    } catch (error) {
      console.error('Error adding to list:', error);
      toast({
        title: "Error",
        description: "Failed to add to list",
        variant: "destructive",
      });
    }
  };

  const removeFromList = async (listId: string, movieId: number) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('list_items')
        .delete()
        .eq('list_id', listId)
        .eq('movie_id', movieId);

      if (error) throw error;

      toast({
        title: "Removed from list",
        description: "Movie has been removed from the list",
      });
    } catch (error) {
      console.error('Error removing from list:', error);
      toast({
        title: "Error",
        description: "Failed to remove from list",
        variant: "destructive",
      });
    }
  };

  const getListItems = async (listId: string): Promise<ListItem[]> => {
    try {
      const { data, error } = await supabase
        .from('list_items')
        .select('*')
        .eq('list_id', listId)
        .order('position', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching list items:', error);
      return [];
    }
  };

  return {
    lists,
    loading: loading || subscriptionLoading,
    createList,
    updateList,
    deleteList,
    addToList,
    removeFromList,
    getListItems,
    refetch: fetchLists,
    // Subscription-based limits
    isProUser,
    canCreateList,
    remainingLists,
    listLimit: FREE_LIST_LIMIT
  };
};
