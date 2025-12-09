import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface UserState {
  likedMovies: number[];
  watchlist: number[];
  ratings: Record<number, number>;
  currentlyWatching: number[];
}

const defaultUserState: UserState = {
  likedMovies: [],
  watchlist: [],
  ratings: {},
  currentlyWatching: []
};

export const useSupabaseUserState = () => {
  const { user, session } = useAuth();
  const [userState, setUserState] = useState<UserState>(defaultUserState);
  const [isLoading, setIsLoading] = useState(false);

  // Load user data when user is authenticated
  useEffect(() => {
    if (session?.user) {
      loadUserData();
    } else {
      setUserState(defaultUserState);
    }
  }, [session?.user]);

  const loadUserData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Load from enhanced_watchlist_items (unified table)
      const { data: enhancedData } = await supabase
        .from('enhanced_watchlist_items')
        .select('movie_id, priority, watched_at, mood_tags')
        .eq('user_id', user.id);

      // Load from watchlist (for liked movies)
      const { data: watchlistData } = await supabase
        .from('watchlist')
        .select('movie_id, list_type')
        .eq('user_id', user.id);

      // Load ratings
      const { data: ratingsData } = await supabase
        .from('ratings')
        .select('movie_id, rating')
        .eq('user_id', user.id);

      const likedMovies = watchlistData
        ?.filter(item => item.list_type === 'liked')
        .map(item => item.movie_id) || [];
      
      // Movies in enhanced watchlist are in the "watchlist"
      const watchlist = enhancedData?.map(item => item.movie_id) || [];
      
      const currentlyWatching = watchlistData
        ?.filter(item => item.list_type === 'currently_watching')
        .map(item => item.movie_id) || [];

      const ratings = ratingsData?.reduce((acc, item) => {
        acc[item.movie_id] = item.rating;
        return acc;
      }, {} as Record<number, number>) || {};

      setUserState({
        likedMovies,
        watchlist,
        currentlyWatching,
        ratings
      });
    } catch (error) {
      console.error('Error loading user data:', error);
      toast.error('Failed to load your data');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to log activity
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

  const toggleLike = async (movieId: number, movieTitle: string, moviePoster?: string) => {
    if (!user) {
      toast.error('Please sign in to like movies');
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
        toast.success('Removed from favorites');
      } else {
        await supabase
          .from('watchlist')
          .insert({
            user_id: user.id,
            movie_id: movieId,
            movie_title: movieTitle,
            movie_poster: moviePoster,
            list_type: 'liked'
          });
        
        setUserState(prev => ({
          ...prev,
          likedMovies: [...prev.likedMovies, movieId]
        }));
        
        // Log activity
        await logActivity('liked', { id: movieId, title: movieTitle, poster: moviePoster });
        toast.success('Added to favorites ❤️');
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Failed to update favorites');
    }
  };

  const toggleWatchlist = async (movieId: number, movieTitle: string, moviePoster?: string) => {
    if (!user) {
      toast.error('Please sign in to add to watchlist');
      return;
    }

    const isInWatchlist = userState.watchlist.includes(movieId);
    
    try {
      if (isInWatchlist) {
        // Remove from enhanced_watchlist_items
        await supabase
          .from('enhanced_watchlist_items')
          .delete()
          .eq('user_id', user.id)
          .eq('movie_id', movieId);
        
        setUserState(prev => ({
          ...prev,
          watchlist: prev.watchlist.filter(id => id !== movieId)
        }));
        toast.success('Removed from watchlist');
      } else {
        // Add to enhanced_watchlist_items
        await supabase
          .from('enhanced_watchlist_items')
          .insert({
            user_id: user.id,
            movie_id: movieId,
            movie_title: movieTitle,
            movie_poster: moviePoster,
            priority: 'medium',
            mood_tags: []
          });
        
        setUserState(prev => ({
          ...prev,
          watchlist: [...prev.watchlist, movieId]
        }));
        
        // Log activity
        await logActivity('listed', { id: movieId, title: movieTitle, poster: moviePoster });
        toast.success('Added to watchlist ✓');
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
        toast.success('Removed from currently watching');
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
        
        // Log activity
        await logActivity('watched', { id: movieId, title: movieTitle, poster: moviePoster });
        toast.success('Marked as currently watching 🎬');
      }
    } catch (error) {
      console.error('Error toggling currently watching:', error);
      toast.error('Failed to update currently watching status');
    }
  };

  const setRating = async (movieId: number, rating: number, movieTitle: string, moviePoster?: string) => {
    if (!user) {
      toast.error('Please sign in to rate movies');
      return;
    }

    try {
      await supabase
        .from('ratings')
        .upsert({
          user_id: user.id,
          movie_id: movieId,
          movie_title: movieTitle,
          rating: rating
        });

      setUserState(prev => ({
        ...prev,
        ratings: { ...prev.ratings, [movieId]: rating }
      }));
      
      // Log activity
      await logActivity('rated', { id: movieId, title: movieTitle, poster: moviePoster }, { rating });
      toast.success(`Rated ${rating} star${rating > 1 ? 's' : ''} ⭐`);
    } catch (error) {
      console.error('Error setting rating:', error);
      toast.error('Failed to save rating');
    }
  };

  return {
    userState,
    isLoading,
    toggleLike,
    toggleWatchlist,
    setRating,
    toggleCurrentlyWatching,
    isLiked: (movieId: number) => userState.likedMovies.includes(movieId),
    isInWatchlist: (movieId: number) => userState.watchlist.includes(movieId),
    isCurrentlyWatching: (movieId: number) => userState.currentlyWatching.includes(movieId),
    getRating: (movieId: number) => userState.ratings[movieId] || 0
  };
};