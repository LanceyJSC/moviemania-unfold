import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

interface UserReview {
  id: string;
  movie_id: number;
  movie_title: string;
  movie_type: 'movie' | 'tv';
  rating?: number;
  review_text?: string;
  is_spoiler: boolean;
  helpful_count: number;
  created_at: string;
  updated_at: string;
}

interface WatchProgress {
  id: string;
  movie_id: number;
  movie_title: string;
  movie_type: 'movie' | 'tv';
  season_number?: number;
  episode_number?: number;
  progress_percent: number;
  last_watched: string;
  completed: boolean;
}

interface SocialConnection {
  id: string;
  follower_id: string;
  following_id: string;
  status: 'pending' | 'accepted' | 'blocked';
  created_at: string;
}

interface UserActivity {
  id: string;
  user_id: string;
  activity_type: 'rating' | 'review' | 'watchlist_add' | 'completed';
  movie_id: number;
  movie_title: string;
  movie_type: 'movie' | 'tv';
  metadata?: any;
  created_at: string;
}

interface EnhancedUserState {
  reviews: UserReview[];
  watchProgress: WatchProgress[];
  socialConnections: SocialConnection[];
  activities: UserActivity[];
  friends: string[];
  followers: string[];
  following: string[];
}

const defaultState: EnhancedUserState = {
  reviews: [],
  watchProgress: [],
  socialConnections: [],
  activities: [],
  friends: [],
  followers: [],
  following: [],
};

export const useEnhancedUserState = () => {
  const { user } = useAuth();
  const [state, setState] = useState<EnhancedUserState>(defaultState);
  const [isLoading, setIsLoading] = useState(true);

  const loadEnhancedData = async () => {
    if (!user) {
      setState(defaultState);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Load user reviews
      const { data: reviews } = await supabase
        .from('user_reviews')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Load watch progress
      const { data: watchProgress } = await supabase
        .from('watch_progress')
        .select('*')
        .eq('user_id', user.id)
        .order('last_watched', { ascending: false });

      // Load social connections
      const { data: socialConnections } = await supabase
        .from('social_connections')
        .select('*')
        .or(`follower_id.eq.${user.id},following_id.eq.${user.id}`);

      // Load activities
      const { data: activities } = await supabase
        .from('user_activities')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      const connections = socialConnections || [];
      const friends = connections
        .filter(conn => conn.status === 'accepted')
        .map(conn => conn.follower_id === user.id ? conn.following_id : conn.follower_id);
      
      const followers = connections
        .filter(conn => conn.status === 'accepted' && conn.following_id === user.id)
        .map(conn => conn.follower_id);

      const following = connections
        .filter(conn => conn.status === 'accepted' && conn.follower_id === user.id)
        .map(conn => conn.following_id);

      setState({
        reviews: (reviews || []) as UserReview[],
        watchProgress: (watchProgress || []) as WatchProgress[],
        socialConnections: connections as SocialConnection[],
        activities: (activities || []) as UserActivity[],
        friends,
        followers,
        following,
      });
    } catch (error) {
      console.error('Error loading enhanced user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEnhancedData();
  }, [user]);

  // Submit a review
  const submitReview = async (
    movieId: number,
    movieTitle: string,
    movieType: 'movie' | 'tv',
    rating?: number,
    reviewText?: string,
    isSpoiler: boolean = false
  ) => {
    if (!user) return;

    try {
      const reviewData = {
        user_id: user.id,
        movie_id: movieId,
        movie_title: movieTitle,
        movie_type: movieType,
        rating,
        review_text: reviewText,
        is_spoiler: isSpoiler,
      };

      const { data, error } = await supabase
        .from('user_reviews')
        .upsert(reviewData, { onConflict: 'user_id,movie_id' })
        .select()
        .single();

      if (error) throw error;

      // Create activity
      await supabase.from('user_activities').insert({
        user_id: user.id,
        activity_type: rating ? 'rating' : 'review',
        movie_id: movieId,
        movie_title: movieTitle,
        movie_type: movieType,
        metadata: { rating, review_snippet: reviewText?.substring(0, 100) },
      });

      await loadEnhancedData();
      return data;
    } catch (error) {
      console.error('Error submitting review:', error);
      throw error;
    }
  };

  // Update watch progress
  const updateWatchProgress = async (
    movieId: number,
    movieTitle: string,
    movieType: 'movie' | 'tv',
    progressPercent: number,
    seasonNumber?: number,
    episodeNumber?: number,
    completed: boolean = false
  ) => {
    if (!user) return;

    try {
      const progressData = {
        user_id: user.id,
        movie_id: movieId,
        movie_title: movieTitle,
        movie_type: movieType,
        season_number: seasonNumber,
        episode_number: episodeNumber,
        progress_percent: progressPercent,
        completed,
        last_watched: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('watch_progress')
        .upsert(progressData, { 
          onConflict: 'user_id,movie_id,season_number,episode_number' 
        })
        .select()
        .single();

      if (error) throw error;

      if (completed) {
        await supabase.from('user_activities').insert({
          user_id: user.id,
          activity_type: 'completed',
          movie_id: movieId,
          movie_title: movieTitle,
          movie_type: movieType,
          metadata: { season_number: seasonNumber, episode_number: episodeNumber },
        });
      }

      await loadEnhancedData();
      return data;
    } catch (error) {
      console.error('Error updating watch progress:', error);
      throw error;
    }
  };

  // Follow/unfollow user
  const toggleFollow = async (targetUserId: string) => {
    if (!user) return;

    try {
      const existingConnection = state.socialConnections.find(
        conn => conn.follower_id === user.id && conn.following_id === targetUserId
      );

      if (existingConnection) {
        await supabase
          .from('social_connections')
          .delete()
          .eq('id', existingConnection.id);
      } else {
        await supabase
          .from('social_connections')
          .insert({
            follower_id: user.id,
            following_id: targetUserId,
            status: 'accepted', // Auto-accept for now
          });
      }

      await loadEnhancedData();
    } catch (error) {
      console.error('Error toggling follow:', error);
      throw error;
    }
  };

  // Helper functions
  const getUserRating = (movieId: number) => {
    return state.reviews.find(r => r.movie_id === movieId)?.rating;
  };

  const getUserReview = (movieId: number) => {
    return state.reviews.find(r => r.movie_id === movieId);
  };

  const getWatchProgress = (movieId: number, seasonNumber?: number, episodeNumber?: number) => {
    return state.watchProgress.find(p => 
      p.movie_id === movieId && 
      (!seasonNumber || p.season_number === seasonNumber) &&
      (!episodeNumber || p.episode_number === episodeNumber)
    );
  };

  const isFollowing = (userId: string) => {
    return state.following.includes(userId);
  };

  const getContinueWatching = () => {
    return state.watchProgress
      .filter(p => !p.completed && p.progress_percent > 0)
      .sort((a, b) => new Date(b.last_watched).getTime() - new Date(a.last_watched).getTime())
      .slice(0, 10);
  };

  return {
    state,
    isLoading,
    submitReview,
    updateWatchProgress,
    toggleFollow,
    getUserRating,
    getUserReview,
    getWatchProgress,
    isFollowing,
    getContinueWatching,
    refreshData: loadEnhancedData,
  };
};