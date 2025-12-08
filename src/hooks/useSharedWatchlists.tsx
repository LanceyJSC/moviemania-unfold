import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SharedWatchlistItem {
  id: string;
  movieId: number;
  movieTitle: string;
  moviePoster?: string;
  addedBy: string;
  addedByProfile?: { username: string; avatar_url?: string };
  votes: number;
  addedAt: string;
}

interface SharedWatchlist {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  createdByProfile?: { username: string; avatar_url?: string };
  isPublic: boolean;
  members: { userId: string; role: string; profile?: { username: string; avatar_url?: string } }[];
  items: SharedWatchlistItem[];
  createdAt: string;
}

export const useSharedWatchlists = () => {
  const { user } = useAuth();
  const [watchlists, setWatchlists] = useState<SharedWatchlist[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWatchlists = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get watchlists user created or is a member of
      const { data: memberOf } = await supabase
        .from('shared_watchlist_members')
        .select('watchlist_id')
        .eq('user_id', user.id);

      const memberWatchlistIds = memberOf?.map(m => m.watchlist_id) || [];

      const { data: listsData, error } = await supabase
        .from('shared_watchlists')
        .select('*')
        .or(`created_by.eq.${user.id},id.in.(${memberWatchlistIds.join(',') || 'null'})`);

      if (error) throw error;

      if (!listsData || listsData.length === 0) {
        setWatchlists([]);
        setLoading(false);
        return;
      }

      const watchlistIds = listsData.map(l => l.id);
      const creatorIds = [...new Set(listsData.map(l => l.created_by))];

      // Get all members
      const { data: membersData } = await supabase
        .from('shared_watchlist_members')
        .select('*')
        .in('watchlist_id', watchlistIds);

      // Get all items
      const { data: itemsData } = await supabase
        .from('shared_watchlist_items')
        .select('*')
        .in('watchlist_id', watchlistIds)
        .order('added_at', { ascending: false });

      // Get all relevant profiles
      const allUserIds = [...new Set([
        ...creatorIds,
        ...(membersData?.map(m => m.user_id) || []),
        ...(itemsData?.map(i => i.added_by) || [])
      ])];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', allUserIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      const formattedWatchlists: SharedWatchlist[] = listsData.map(list => ({
        id: list.id,
        name: list.name,
        description: list.description || undefined,
        createdBy: list.created_by,
        createdByProfile: profileMap.get(list.created_by),
        isPublic: list.is_public || false,
        members: (membersData?.filter(m => m.watchlist_id === list.id) || []).map(m => ({
          userId: m.user_id,
          role: m.role,
          profile: profileMap.get(m.user_id)
        })),
        items: (itemsData?.filter(i => i.watchlist_id === list.id) || []).map(i => ({
          id: i.id,
          movieId: i.movie_id,
          movieTitle: i.movie_title,
          moviePoster: i.movie_poster || undefined,
          addedBy: i.added_by,
          addedByProfile: profileMap.get(i.added_by),
          votes: i.votes || 0,
          addedAt: i.added_at
        })),
        createdAt: list.created_at
      }));

      setWatchlists(formattedWatchlists);
    } catch (error) {
      console.error('Error fetching shared watchlists:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createWatchlist = async (name: string, description?: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('shared_watchlists')
        .insert({
          name,
          description,
          created_by: user.id,
          is_public: false
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Shared watchlist created!');
      fetchWatchlists();
      return data;
    } catch (error) {
      console.error('Error creating shared watchlist:', error);
      toast.error('Failed to create watchlist');
      return null;
    }
  };

  const addMovieToWatchlist = async (watchlistId: string, movieId: number, movieTitle: string, moviePoster?: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('shared_watchlist_items')
        .insert({
          watchlist_id: watchlistId,
          movie_id: movieId,
          movie_title: movieTitle,
          movie_poster: moviePoster,
          added_by: user.id
        });

      if (error) throw error;

      toast.success('Movie added to shared watchlist!');
      fetchWatchlists();
      return true;
    } catch (error) {
      console.error('Error adding movie:', error);
      toast.error('Failed to add movie');
      return false;
    }
  };

  const inviteFriend = async (watchlistId: string, friendId: string) => {
    try {
      const { error } = await supabase
        .from('shared_watchlist_members')
        .insert({
          watchlist_id: watchlistId,
          user_id: friendId,
          role: 'member'
        });

      if (error) throw error;

      toast.success('Friend invited to watchlist!');
      fetchWatchlists();
      return true;
    } catch (error) {
      console.error('Error inviting friend:', error);
      toast.error('Failed to invite friend');
      return false;
    }
  };

  useEffect(() => {
    fetchWatchlists();
  }, [fetchWatchlists]);

  return {
    watchlists,
    loading,
    createWatchlist,
    addMovieToWatchlist,
    inviteFriend,
    refetch: fetchWatchlists
  };
};
