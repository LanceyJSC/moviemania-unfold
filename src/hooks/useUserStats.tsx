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
      // Count movies from diary
      const { count: movieCount } = await supabase
        .from('movie_diary')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Count TV shows from tv_diary
      const { count: tvCount } = await supabase
        .from('tv_diary')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Get all ratings to calculate average
      const { data: movieRatings } = await supabase
        .from('user_ratings')
        .select('rating, media_type')
        .eq('user_id', user.id);

      const { data: diaryRatings } = await supabase
        .from('movie_diary')
        .select('rating')
        .eq('user_id', user.id)
        .not('rating', 'is', null);

      const { data: tvDiaryRatings } = await supabase
        .from('tv_diary')
        .select('rating')
        .eq('user_id', user.id)
        .not('rating', 'is', null);

      // Calculate average rating from all sources
      const allRatings = [
        ...(movieRatings?.map(r => r.rating) || []),
        ...(diaryRatings?.map(r => r.rating) || []),
        ...(tvDiaryRatings?.map(r => r.rating) || [])
      ].filter(r => r !== null && r !== undefined);

      const avgRating = allRatings.length > 0 
        ? allRatings.reduce((a, b) => a + b, 0) / allRatings.length 
        : 0;

      // Estimate watch time (average 2 hours per movie, 45 min per TV entry)
      const movieHours = (movieCount || 0) * 2;
      const tvHours = Math.round((tvCount || 0) * 0.75);

      const updates = {
        total_movies_watched: movieCount || 0,
        total_tv_shows_watched: tvCount || 0,
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
