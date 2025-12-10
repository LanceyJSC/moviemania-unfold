import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UserStats {
  id: string;
  user_id: string;
  total_movies_watched: number;
  total_tv_shows_watched: number;
  total_hours_watched: number;
  total_tv_hours_watched: number;
  total_ratings: number;
  average_rating: number;
  favorite_genres: string[];
  watching_streak: number;
  last_activity_date: string;
  level: number;
  experience_points: number;
  created_at: string;
  updated_at: string;
}

export const useUserStats = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserStats = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      let { data: existingStats, error } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (!existingStats) {
        const { data: newStats, error: createError } = await supabase
          .from('user_stats')
          .upsert({
            user_id: user.id,
            total_movies_watched: 0,
            total_tv_shows_watched: 0,
            total_hours_watched: 0,
            total_tv_hours_watched: 0,
            experience_points: 0,
            level: 1
          })
          .select()
          .single();

        if (createError) throw createError;
        existingStats = newStats;
      }

      setStats(existingStats);
    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchUserStats();
    } else {
      setStats(null);
      setLoading(false);
    }
  }, [user, fetchUserStats]);

  const recalculateStats = useCallback(async () => {
    if (!user) return;

    try {
      // Get movie diary entries with runtime
      const { data: movieDiary } = await supabase
        .from('movie_diary')
        .select('movie_id, runtime, rating')
        .eq('user_id', user.id);

      // Get TV diary entries with runtime
      const { data: tvDiary } = await supabase
        .from('tv_diary')
        .select('tv_id, runtime, rating')
        .eq('user_id', user.id);

      // Get user_ratings (includes watched items without diary entries)
      const { data: userRatings } = await supabase
        .from('user_ratings')
        .select('movie_id, rating, media_type')
        .eq('user_id', user.id);

      // Create sets to track unique watched items
      const watchedMovieIds = new Set<number>();
      const watchedTvIds = new Set<number>();
      
      // Track which items have runtime from diary
      const movieRuntimeMap = new Map<number, number>();
      const tvRuntimeMap = new Map<number, number>();

      // Add diary entries to watched sets and runtime maps
      movieDiary?.forEach(entry => {
        watchedMovieIds.add(entry.movie_id);
        movieRuntimeMap.set(entry.movie_id, entry.runtime || 120);
      });
      tvDiary?.forEach(entry => {
        watchedTvIds.add(entry.tv_id);
        tvRuntimeMap.set(entry.tv_id, entry.runtime || 45);
      });

      // Add user_ratings entries to watched sets (with estimated runtime if not in diary)
      userRatings?.forEach(entry => {
        if (entry.media_type === 'tv') {
          watchedTvIds.add(entry.movie_id);
          // If not already in diary, add estimated runtime
          if (!tvRuntimeMap.has(entry.movie_id)) {
            tvRuntimeMap.set(entry.movie_id, 45); // Default 45 min per episode
          }
        } else {
          watchedMovieIds.add(entry.movie_id);
          // If not already in diary, add estimated runtime
          if (!movieRuntimeMap.has(entry.movie_id)) {
            movieRuntimeMap.set(entry.movie_id, 120); // Default 2 hours per movie
          }
        }
      });

      const movieCount = watchedMovieIds.size;
      const tvCount = watchedTvIds.size;

      // Calculate total movie hours from all watched movies
      let movieMinutes = 0;
      movieRuntimeMap.forEach(runtime => {
        movieMinutes += runtime;
      });
      const movieHours = Math.round(movieMinutes / 60);

      // Calculate total TV hours from all watched TV
      let tvMinutes = 0;
      tvRuntimeMap.forEach(runtime => {
        tvMinutes += runtime;
      });
      const tvHours = Math.round(tvMinutes / 60);

      // Calculate average rating from all sources (combine diary and user_ratings, deduplicate)
      const ratingMap = new Map<string, number>();
      
      // Add diary ratings (keyed by movie_id + type)
      movieDiary?.forEach(entry => {
        if (entry.rating !== null) {
          ratingMap.set(`movie-${entry.movie_id}`, entry.rating);
        }
      });
      tvDiary?.forEach(entry => {
        if (entry.rating !== null) {
          ratingMap.set(`tv-${entry.tv_id}`, entry.rating);
        }
      });
      
      // Add/override with user_ratings (these are more recent)
      userRatings?.forEach(entry => {
        if (entry.rating !== null) {
          const key = `${entry.media_type || 'movie'}-${entry.movie_id}`;
          ratingMap.set(key, entry.rating);
        }
      });

      const allRatings = Array.from(ratingMap.values());
      const avgRating = allRatings.length > 0 
        ? allRatings.reduce((a, b) => a + b, 0) / allRatings.length 
        : 0;

      const updates = {
        total_movies_watched: movieCount,
        total_tv_shows_watched: tvCount,
        total_hours_watched: movieHours,
        total_tv_hours_watched: tvHours,
        total_ratings: allRatings.length,
        average_rating: Math.round(avgRating * 10) / 10,
        last_activity_date: new Date().toISOString()
      };

      const { error } = await supabase
        .from('user_stats')
        .update(updates)
        .eq('user_id', user.id);

      if (error) throw error;

      setStats(prev => prev ? { ...prev, ...updates } : null);
    } catch (error) {
      console.error('Error recalculating stats:', error);
    }
  }, [user]);

  const updateStats = async (updates: Partial<UserStats>) => {
    if (!user || !stats) return;

    try {
      const { error } = await supabase
        .from('user_stats')
        .update(updates)
        .eq('user_id', user.id);

      if (error) throw error;

      setStats(prev => prev ? { ...prev, ...updates } : null);
    } catch (error) {
      console.error('Error updating user stats:', error);
      toast.error('Failed to update statistics');
    }
  };

  const addExperience = async (points: number) => {
    if (!stats) return;

    const newPoints = stats.experience_points + points;
    const newLevel = Math.max(1, Math.floor(newPoints / 100) + 1);

    await updateStats({
      experience_points: newPoints,
      level: newLevel
    });

    if (newLevel > stats.level) {
      toast.success(`🎉 Level up! You're now level ${newLevel}!`);
    }
  };

  return {
    stats,
    loading,
    updateStats,
    addExperience,
    recalculateStats,
    refetch: fetchUserStats
  };
};
