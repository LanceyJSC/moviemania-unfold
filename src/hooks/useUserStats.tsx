import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UserStats {
  id: string;
  user_id: string;
  total_movies_watched: number;
  total_hours_watched: number;
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

  useEffect(() => {
    if (user) {
      fetchUserStats();
    } else {
      setStats(null);
      setLoading(false);
    }
  }, [user]);

  const fetchUserStats = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Try to get existing stats
      let { data: existingStats, error } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      // If no stats exist, create initial stats
      if (!existingStats) {
        const { data: newStats, error: createError } = await supabase
          .from('user_stats')
          .upsert({
            user_id: user.id,
            total_movies_watched: 0,
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
      toast.error('Failed to load user statistics');
    } finally {
      setLoading(false);
    }
  };

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
    refetch: fetchUserStats
  };
};