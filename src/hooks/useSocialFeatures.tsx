import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface Friend {
  friend_id: string;
  friend_username: string;
  friend_avatar_url: string;
  connection_date: string;
}

export interface WatchlistComparison {
  movie_id: number;
  movie_title: string;
  movie_poster: string;
  in_user_watchlist: boolean;
  in_friend_watchlist: boolean;
  user_list_type: string;
  friend_list_type: string;
}

export interface RatingComparison {
  movie_id: number;
  movie_title: string;
  user_rating: number;
  friend_rating: number;
  rating_difference: number;
}

export interface MoviePreference {
  id: string;
  movie_id: number;
  movie_title: string;
  movie_poster: string;
  preference: 'like' | 'dislike';
  created_at: string;
}

export const useSocialFeatures = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);

  // Fetch mutual friends
  const fetchFriends = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase.rpc('get_mutual_friends', {
        p_user_id: user.id
      });
      
      if (error) throw error;
      setFriends(data || []);
    } catch (error) {
      console.error('Error fetching friends:', error);
    }
  };

  // Send friend request
  const sendFriendRequest = async (targetUserId: string) => {
    if (!user) return { error: 'Not authenticated' };
    
    try {
      const { error } = await supabase
        .from('social_connections')
        .insert({
          follower_id: user.id,
          following_id: targetUserId,
          status: 'pending'
        });
      
      if (error) throw error;
      
      toast({
        title: "Friend request sent!",
        description: "Your friend request has been sent successfully."
      });
      
      return { error: null };
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send friend request",
        variant: "destructive"
      });
      return { error };
    }
  };

  // Accept friend request
  const acceptFriendRequest = async (requestId: string) => {
    try {
      // Update the original request to accepted
      const { error: error1 } = await supabase
        .from('social_connections')
        .update({ status: 'accepted' })
        .eq('id', requestId);
      
      if (error1) throw error1;
      
      // Create the reverse connection
      const { data: originalRequest } = await supabase
        .from('social_connections')
        .select('follower_id, following_id')
        .eq('id', requestId)
        .single();
      
      if (originalRequest) {
        const { error: error2 } = await supabase
          .from('social_connections')
          .insert({
            follower_id: originalRequest.following_id,
            following_id: originalRequest.follower_id,
            status: 'accepted'
          });
        
        if (error2) throw error2;
      }
      
      toast({
        title: "Friend request accepted!",
        description: "You are now friends."
      });
      
      fetchFriends();
      fetchPendingRequests();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to accept friend request",
        variant: "destructive"
      });
    }
  };

  // Fetch pending friend requests
  const fetchPendingRequests = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('social_connections')
        .select(`
          id,
          follower_id,
          created_at,
          profiles!social_connections_follower_id_fkey(username, avatar_url)
        `)
        .eq('following_id', user.id)
        .eq('status', 'pending');
      
      if (error) throw error;
      setPendingRequests(data || []);
    } catch (error) {
      console.error('Error fetching pending requests:', error);
    }
  };

  // Get friend watchlist comparison
  const getFriendWatchlistComparison = async (friendId: string): Promise<WatchlistComparison[]> => {
    if (!user) return [];
    
    try {
      const { data, error } = await supabase.rpc('get_friend_watchlist_comparison', {
        p_user_id: user.id,
        p_friend_id: friendId
      });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching watchlist comparison:', error);
      return [];
    }
  };

  // Get friend rating comparison
  const getFriendRatingComparison = async (friendId: string): Promise<RatingComparison[]> => {
    if (!user) return [];
    
    try {
      const { data, error } = await supabase.rpc('get_friend_rating_comparison', {
        p_user_id: user.id,
        p_friend_id: friendId
      });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching rating comparison:', error);
      return [];
    }
  };

  // Movie preference functions
  const saveMoviePreference = async (
    movieId: number,
    movieTitle: string,
    moviePoster: string,
    preference: 'like' | 'dislike'
  ) => {
    if (!user) return { error: 'Not authenticated' };
    
    try {
      const { error } = await supabase
        .from('movie_preferences')
        .upsert({
          user_id: user.id,
          movie_id: movieId,
          movie_title: movieTitle,
          movie_poster: moviePoster,
          preference
        });
      
      if (error) throw error;
      
      // If liked, add to watchlist
      if (preference === 'like') {
        await supabase
          .from('watchlist')
          .upsert({
            user_id: user.id,
            movie_id: movieId,
            movie_title: movieTitle,
            movie_poster: moviePoster,
            list_type: 'watchlist'
          });
      }
      
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  // Get user's movie preferences
  const getMoviePreferences = async (): Promise<MoviePreference[]> => {
    if (!user) return [];
    
    try {
      const { data, error } = await supabase
        .from('movie_preferences')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []).map(item => ({
        ...item,
        preference: item.preference as 'like' | 'dislike'
      }));
    } catch (error) {
      console.error('Error fetching movie preferences:', error);
      return [];
    }
  };

  // Search users by username
  const searchUsers = async (username: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .ilike('username', `%${username}%`)
        .limit(10);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  };

  useEffect(() => {
    if (user) {
      fetchFriends();
      fetchPendingRequests();
    }
  }, [user]);

  return {
    loading,
    friends,
    pendingRequests,
    sendFriendRequest,
    acceptFriendRequest,
    getFriendWatchlistComparison,
    getFriendRatingComparison,
    saveMoviePreference,
    getMoviePreferences,
    searchUsers,
    fetchFriends,
    fetchPendingRequests
  };
};