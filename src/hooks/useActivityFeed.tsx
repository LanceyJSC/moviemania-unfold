import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface ActivityItem {
  id: string;
  user_id: string;
  activity_type: string;
  target_type: string | null;
  target_id: string | null;
  movie_id: number | null;
  movie_title: string | null;
  movie_poster: string | null;
  metadata: any;
  created_at: string;
  profile?: {
    username: string | null;
    avatar_url: string | null;
  };
}

export const useActivityFeed = (userId?: string) => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, [userId, user]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('activity_feed')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (userId) {
        query = query.eq('user_id', userId);
      } else if (user) {
        const { data: following } = await supabase
          .from('user_follows')
          .select('following_id')
          .eq('follower_id', user.id);

        if (following && following.length > 0) {
          const followingIds = following.map(f => f.following_id);
          query = query.in('user_id', [...followingIds, user.id]);
        } else {
          query = query.eq('user_id', user.id);
        }
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch profiles separately
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(a => a.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .in('id', userIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
        const activitiesWithProfiles = data.map(a => ({
          ...a,
          profile: profileMap.get(a.user_id)
        }));
        setActivities(activitiesWithProfiles);
      } else {
        setActivities([]);
      }
    } catch (error) {
      console.error('Error fetching activity feed:', error);
    } finally {
      setLoading(false);
    }
  };

  const logActivity = async (
    activityType: string,
    targetType?: string,
    targetId?: string,
    movie?: { id: number; title: string; poster?: string },
    metadata?: any
  ) => {
    if (!user) return;

    try {
      await supabase.from('activity_feed').insert({
        user_id: user.id,
        activity_type: activityType,
        target_type: targetType,
        target_id: targetId,
        movie_id: movie?.id,
        movie_title: movie?.title,
        movie_poster: movie?.poster,
        metadata
      });
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  };

  return {
    activities,
    loading,
    logActivity,
    refetch: fetchActivities
  };
};
