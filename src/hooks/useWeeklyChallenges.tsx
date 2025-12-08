import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Challenge {
  id: string;
  title: string;
  description?: string;
  challengeType: string;
  targetCount: number;
  xpReward: number;
  startsAt: string;
  endsAt: string;
  userProgress: number;
  completed: boolean;
  completedAt?: string;
}

export const useWeeklyChallenges = () => {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChallenges = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      const now = new Date().toISOString();

      // Get active challenges
      const { data: challengesData, error } = await supabase
        .from('weekly_challenges')
        .select('*')
        .lte('starts_at', now)
        .gte('ends_at', now)
        .order('ends_at', { ascending: true });

      if (error) throw error;

      if (!challengesData || challengesData.length === 0) {
        // Create default challenges if none exist
        await createDefaultChallenges();
        setChallenges([]);
        setLoading(false);
        return;
      }

      const challengeIds = challengesData.map(c => c.id);

      // Get user progress
      const { data: progressData } = await supabase
        .from('user_challenge_progress')
        .select('*')
        .eq('user_id', user.id)
        .in('challenge_id', challengeIds);

      const progressMap = new Map(progressData?.map(p => [p.challenge_id, p]) || []);

      const formattedChallenges: Challenge[] = challengesData.map(challenge => {
        const progress = progressMap.get(challenge.id);
        return {
          id: challenge.id,
          title: challenge.title,
          description: challenge.description || undefined,
          challengeType: challenge.challenge_type,
          targetCount: challenge.target_count,
          xpReward: challenge.xp_reward,
          startsAt: challenge.starts_at,
          endsAt: challenge.ends_at,
          userProgress: progress?.current_count || 0,
          completed: !!progress?.completed_at,
          completedAt: progress?.completed_at || undefined
        };
      });

      setChallenges(formattedChallenges);
    } catch (error) {
      console.error('Error fetching challenges:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createDefaultChallenges = async () => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    const defaultChallenges = [
      {
        title: 'Movie Marathon',
        description: 'Watch 3 movies this week',
        challenge_type: 'watch_movies',
        target_count: 3,
        xp_reward: 150,
        starts_at: startOfWeek.toISOString(),
        ends_at: endOfWeek.toISOString()
      },
      {
        title: 'Rate & Review',
        description: 'Rate 5 movies this week',
        challenge_type: 'rate_movies',
        target_count: 5,
        xp_reward: 100,
        starts_at: startOfWeek.toISOString(),
        ends_at: endOfWeek.toISOString()
      },
      {
        title: 'Social Butterfly',
        description: 'Connect with 2 new friends',
        challenge_type: 'make_friends',
        target_count: 2,
        xp_reward: 200,
        starts_at: startOfWeek.toISOString(),
        ends_at: endOfWeek.toISOString()
      }
    ];

    try {
      await supabase.from('weekly_challenges').insert(defaultChallenges);
    } catch (error) {
      console.error('Error creating default challenges:', error);
    }
  };

  const updateProgress = async (challengeType: string, increment: number = 1) => {
    if (!user) return;

    try {
      // Find matching active challenge
      const challenge = challenges.find(c => c.challengeType === challengeType && !c.completed);
      if (!challenge) return;

      const newProgress = Math.min(challenge.userProgress + increment, challenge.targetCount);
      const completed = newProgress >= challenge.targetCount;

      const { error } = await supabase
        .from('user_challenge_progress')
        .upsert({
          user_id: user.id,
          challenge_id: challenge.id,
          current_count: newProgress,
          completed_at: completed ? new Date().toISOString() : null
        }, { onConflict: 'user_id,challenge_id' });

      if (error) throw error;

      if (completed) {
        // Award XP - fetch current XP first then update
        const { data: currentStats } = await supabase
          .from('user_stats')
          .select('experience_points')
          .eq('user_id', user.id)
          .single();

        const currentXP = currentStats?.experience_points || 0;
        await supabase
          .from('user_stats')
          .update({
            experience_points: currentXP + challenge.xpReward
          })
          .eq('user_id', user.id);

        toast.success(`Challenge completed! +${challenge.xpReward} XP`);
      }

      fetchChallenges();
    } catch (error) {
      console.error('Error updating challenge progress:', error);
    }
  };

  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  return {
    challenges,
    loading,
    updateProgress,
    refetch: fetchChallenges
  };
};
