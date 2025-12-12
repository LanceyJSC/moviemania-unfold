import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export interface UserState {
  likedMovies: number[];
  watchlist: number[];
  ratings: Record<number, number>;
  currentlyWatching: number[];
  watchedItems: number[];
}

const defaultUserState: UserState = {
  likedMovies: [],
  watchlist: [],
  ratings: {},
  currentlyWatching: [],
  watchedItems: []
};

export type MediaType = 'movie' | 'tv';

interface UserStateContextType {
  userState: UserState;
  isLoading: boolean;
  toggleLike: (movieId: number, movieTitle: string, moviePoster?: string, mediaType?: MediaType) => Promise<void>;
  toggleWatchlist: (movieId: number, movieTitle: string, moviePoster?: string, mediaType?: MediaType) => Promise<void>;
  setRating: (movieId: number, rating: number, movieTitle: string, moviePoster?: string, mediaType?: MediaType) => Promise<void>;
  toggleCurrentlyWatching: (movieId: number, movieTitle: string, moviePoster?: string) => Promise<void>;
  markAsWatched: (movieId: number, movieTitle: string, moviePoster?: string, mediaType?: MediaType) => Promise<void>;
  isLiked: (movieId: number) => boolean;
  isInWatchlist: (movieId: number) => boolean;
  isCurrentlyWatching: (movieId: number) => boolean;
  isWatched: (movieId: number) => boolean;
  getRating: (movieId: number) => number;
  updateRatingLocally: (movieId: number, rating: number) => void;
  refetch: () => Promise<void>;
}

const UserStateContext = createContext<UserStateContextType | undefined>(undefined);

export const useUserStateContext = () => {
  const context = useContext(UserStateContext);
  if (context === undefined) {
    throw new Error('useUserStateContext must be used within a UserStateProvider');
  }
  return context;
};

export const UserStateProvider = ({ children }: { children: ReactNode }) => {
  const { user, session } = useAuth();
  const queryClient = useQueryClient();
  const [userState, setUserState] = useState<UserState>(defaultUserState);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (session?.user) {
      loadUserData();
    } else {
      setUserState(defaultUserState);
    }
  }, [session?.user?.id]);

  const loadUserData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data: enhancedData } = await supabase
        .from('enhanced_watchlist_items')
        .select('movie_id, priority, watched_at, mood_tags')
        .eq('user_id', user.id);

      const { data: watchlistData } = await supabase
        .from('watchlist')
        .select('movie_id, list_type')
        .eq('user_id', user.id);

      const { data: ratingsData } = await supabase
        .from('ratings')
        .select('movie_id, rating')
        .eq('user_id', user.id);

      const { data: userRatingsData } = await supabase
        .from('user_ratings')
        .select('movie_id')
        .eq('user_id', user.id);

      const likedMovies = watchlistData
        ?.filter(item => item.list_type === 'liked')
        .map(item => item.movie_id) || [];
      
      const watchlist = enhancedData?.map(item => item.movie_id) || [];
      
      const currentlyWatching = watchlistData
        ?.filter(item => item.list_type === 'currently_watching')
        .map(item => item.movie_id) || [];

      const ratings = ratingsData?.reduce((acc, item) => {
        acc[item.movie_id] = item.rating;
        return acc;
      }, {} as Record<number, number>) || {};

      const watchedItems = userRatingsData?.map(item => item.movie_id) || [];

      console.log('[UserStateContext] loadUserData - likedMovies:', likedMovies);
      console.log('[UserStateContext] loadUserData - watchlist:', watchlist);
      console.log('[UserStateContext] loadUserData - watchlistData raw:', watchlistData);

      setUserState({
        likedMovies,
        watchlist,
        currentlyWatching,
        ratings,
        watchedItems
      });
    } catch (error) {
      console.error('Error loading user data:', error);
      toast.error('Failed to load your data');
    } finally {
      setIsLoading(false);
    }
  };

  const logActivity = async (
    activityType: string,
    movie: { id: number; title: string; poster?: string },
    metadata?: any
  ) => {
    if (!user) return;
    
    try {
      await supabase.from('activity_feed').insert({
        user_id: user.id,
        activity_type: activityType,
        movie_id: movie.id,
        movie_title: movie.title,
        movie_poster: movie.poster,
        metadata
      });
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  };

  const toggleLike = async (movieId: number, movieTitle: string, moviePoster?: string, mediaType: MediaType = 'movie') => {
    if (!user) {
      toast.error('Please sign in to like');
      return;
    }

    const isLiked = userState.likedMovies.includes(movieId);
    
    try {
      if (isLiked) {
        await supabase
          .from('watchlist')
          .delete()
          .eq('user_id', user.id)
          .eq('movie_id', movieId)
          .eq('list_type', 'liked');
        
        setUserState(prev => ({
          ...prev,
          likedMovies: prev.likedMovies.filter(id => id !== movieId)
        }));
      } else {
        await supabase
          .from('watchlist')
          .insert({
            user_id: user.id,
            movie_id: movieId,
            movie_title: movieTitle,
            movie_poster: moviePoster,
            list_type: 'liked',
            media_type: mediaType
          });
        
        setUserState(prev => ({
          ...prev,
          likedMovies: [...prev.likedMovies, movieId]
        }));
        
        await logActivity('liked', { id: movieId, title: movieTitle, poster: moviePoster }, { media_type: mediaType });
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Failed to update favorites');
    }
  };

  const toggleWatchlist = async (movieId: number, movieTitle: string, moviePoster?: string, mediaType: MediaType = 'movie') => {
    if (!user) {
      toast.error('Please sign in to add to watchlist');
      return;
    }

    const isInWatchlist = userState.watchlist.includes(movieId);
    
    try {
      if (isInWatchlist) {
        await supabase
          .from('enhanced_watchlist_items')
          .delete()
          .eq('user_id', user.id)
          .eq('movie_id', movieId);
        
        setUserState(prev => ({
          ...prev,
          watchlist: prev.watchlist.filter(id => id !== movieId)
        }));
      } else {
        await supabase
          .from('enhanced_watchlist_items')
          .insert({
            user_id: user.id,
            movie_id: movieId,
            movie_title: movieTitle,
            movie_poster: moviePoster,
            priority: 'medium',
            mood_tags: [],
            media_type: mediaType
          });
        
        setUserState(prev => ({
          ...prev,
          watchlist: [...prev.watchlist, movieId]
        }));
        
        await logActivity('listed', { id: movieId, title: movieTitle, poster: moviePoster }, { media_type: mediaType });
      }
    } catch (error) {
      console.error('Error toggling watchlist:', error);
      toast.error('Failed to update watchlist');
    }
  };

  const toggleCurrentlyWatching = async (movieId: number, movieTitle: string, moviePoster?: string) => {
    if (!user) {
      toast.error('Please sign in to mark as currently watching');
      return;
    }

    const isCurrentlyWatching = userState.currentlyWatching.includes(movieId);
    
    try {
      if (isCurrentlyWatching) {
        await supabase
          .from('watchlist')
          .delete()
          .eq('user_id', user.id)
          .eq('movie_id', movieId)
          .eq('list_type', 'currently_watching');
        
        setUserState(prev => ({
          ...prev,
          currentlyWatching: prev.currentlyWatching.filter(id => id !== movieId)
        }));
      } else {
        await supabase
          .from('watchlist')
          .insert({
            user_id: user.id,
            movie_id: movieId,
            movie_title: movieTitle,
            movie_poster: moviePoster,
            list_type: 'currently_watching'
          });
        
        setUserState(prev => ({
          ...prev,
          currentlyWatching: [...prev.currentlyWatching, movieId]
        }));
        
        await logActivity('watched', { id: movieId, title: movieTitle, poster: moviePoster });
      }
    } catch (error) {
      console.error('Error toggling currently watching:', error);
      toast.error('Failed to update currently watching status');
    }
  };

  const setRating = async (movieId: number, rating: number, movieTitle: string, moviePoster?: string, mediaType: MediaType = 'movie') => {
    if (!user) {
      toast.error('Please sign in to rate');
      return;
    }

    try {
      // If rating is 0, remove the rating
      if (rating === 0) {
        await supabase
          .from('ratings')
          .delete()
          .eq('user_id', user.id)
          .eq('movie_id', movieId);

        await supabase
          .from('user_ratings')
          .delete()
          .eq('user_id', user.id)
          .eq('movie_id', movieId);

        setUserState(prev => {
          const newRatings = { ...prev.ratings };
          delete newRatings[movieId];
          return { 
            ...prev, 
            ratings: newRatings,
            watchedItems: prev.watchedItems.filter(id => id !== movieId)
          };
        });
        
        // Invalidate the average rating query so it updates immediately when cleared
        queryClient.invalidateQueries({ queryKey: ['average-user-rating', movieId, mediaType] });
      } else {
        await supabase
          .from('ratings')
          .upsert({
            user_id: user.id,
            movie_id: movieId,
            movie_title: movieTitle,
            rating: rating
          });

        await supabase
          .from('user_ratings')
          .upsert({
            user_id: user.id,
            movie_id: movieId,
            movie_title: movieTitle,
            movie_poster: moviePoster,
            rating: rating,
            media_type: mediaType,
            is_public: true
          }, { onConflict: 'user_id,movie_id' });

        // Remove from watchlist since it's now watched/rated
        await supabase
          .from('enhanced_watchlist_items')
          .delete()
          .eq('user_id', user.id)
          .eq('movie_id', movieId);

        setUserState(prev => ({
          ...prev,
          ratings: { ...prev.ratings, [movieId]: rating },
          watchedItems: prev.watchedItems.includes(movieId) ? prev.watchedItems : [...prev.watchedItems, movieId],
          watchlist: prev.watchlist.filter(id => id !== movieId)
        }));
        
        // Invalidate the average rating query so it updates immediately
        queryClient.invalidateQueries({ queryKey: ['average-user-rating', movieId, mediaType] });
        
        await logActivity('rated', { id: movieId, title: movieTitle, poster: moviePoster }, { rating, media_type: mediaType });
      }
    } catch (error) {
      console.error('Error setting rating:', error);
      toast.error('Failed to save rating');
    }
  };

  const markAsWatched = async (movieId: number, movieTitle: string, moviePoster?: string, mediaType: MediaType = 'movie') => {
    if (!user) {
      toast.error('Please sign in to mark as watched');
      return;
    }

    const isCurrentlyWatched = userState.watchedItems.includes(movieId);
    
    try {
      if (isCurrentlyWatched) {
        // Remove from watched
        await supabase
          .from('user_ratings')
          .delete()
          .eq('user_id', user.id)
          .eq('movie_id', movieId);
        
        setUserState(prev => ({
          ...prev,
          watchedItems: prev.watchedItems.filter(id => id !== movieId)
        }));
      } else {
        // Add to watched (with null rating to indicate watched but not rated)
        await supabase
          .from('user_ratings')
          .upsert({
            user_id: user.id,
            movie_id: movieId,
            movie_title: movieTitle,
            movie_poster: moviePoster,
            rating: null,
            media_type: mediaType,
            is_public: true
          }, { onConflict: 'user_id,movie_id' });
        
        // Also remove from watchlist if it's there
        await supabase
          .from('enhanced_watchlist_items')
          .delete()
          .eq('user_id', user.id)
          .eq('movie_id', movieId);
        
        setUserState(prev => ({
          ...prev,
          watchedItems: [...prev.watchedItems, movieId],
          watchlist: prev.watchlist.filter(id => id !== movieId)
        }));
        
        await logActivity('watched', { id: movieId, title: movieTitle, poster: moviePoster }, { media_type: mediaType });
      }
    } catch (error) {
      console.error('Error marking as watched:', error);
      toast.error('Failed to update watched status');
    }
  };

  // Immediate local update for ratings (called by LogMediaModal for instant UI feedback)
  const updateRatingLocally = (movieId: number, rating: number) => {
    setUserState(prev => {
      if (rating === 0) {
        const newRatings = { ...prev.ratings };
        delete newRatings[movieId];
        return { ...prev, ratings: newRatings };
      }
      return {
        ...prev,
        ratings: { ...prev.ratings, [movieId]: rating },
        watchedItems: prev.watchedItems.includes(movieId) ? prev.watchedItems : [...prev.watchedItems, movieId],
        watchlist: prev.watchlist.filter(id => id !== movieId)
      };
    });
  };

  const value: UserStateContextType = {
    userState,
    isLoading,
    toggleLike,
    toggleWatchlist,
    setRating,
    toggleCurrentlyWatching,
    markAsWatched,
    isLiked: (movieId: number) => userState.likedMovies.includes(movieId),
    isInWatchlist: (movieId: number) => userState.watchlist.includes(movieId),
    isCurrentlyWatching: (movieId: number) => userState.currentlyWatching.includes(movieId),
    isWatched: (movieId: number) => userState.watchedItems.includes(movieId),
    getRating: (movieId: number) => userState.ratings[movieId] || 0,
    updateRatingLocally,
    refetch: loadUserData
  };

  return (
    <UserStateContext.Provider value={value}>
      {children}
    </UserStateContext.Provider>
  );
};
