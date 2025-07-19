
import { useState, useEffect } from 'react';

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

export const useUserState = () => {
  const [userState, setUserState] = useState<UserState>(defaultUserState);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('cinescope-user-state');
    if (saved) {
      try {
        setUserState(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to parse user state from localStorage:', error);
      }
    }
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('cinescope-user-state', JSON.stringify(userState));
  }, [userState]);

  const toggleLike = (movieId: number) => {
    setUserState(prev => ({
      ...prev,
      likedMovies: prev.likedMovies.includes(movieId)
        ? prev.likedMovies.filter(id => id !== movieId)
        : [...prev.likedMovies, movieId]
    }));
  };

  const toggleWatchlist = (movieId: number) => {
    setUserState(prev => ({
      ...prev,
      watchlist: prev.watchlist.includes(movieId)
        ? prev.watchlist.filter(id => id !== movieId)
        : [...prev.watchlist, movieId]
    }));
  };

  const setRating = (movieId: number, rating: number) => {
    setUserState(prev => ({
      ...prev,
      ratings: { ...prev.ratings, [movieId]: rating }
    }));
  };

  const toggleCurrentlyWatching = (movieId: number) => {
    setUserState(prev => ({
      ...prev,
      currentlyWatching: prev.currentlyWatching.includes(movieId)
        ? prev.currentlyWatching.filter(id => id !== movieId)
        : [...prev.currentlyWatching, movieId]
    }));
  };

  return {
    userState,
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
