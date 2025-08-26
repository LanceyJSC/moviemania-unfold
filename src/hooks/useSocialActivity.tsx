import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SocialActivity {
  id: string;
  user_id: string;
  friend_id: string;
  activity_type: string;
  movie_id: number;
  movie_title: string;
  movie_poster?: string;
  activity_data: any;
  created_at: string;
  // Joined data from profiles
  user_profile?: {
    username: string;
    full_name?: string;
    avatar_url?: string;
  };
}

export const useSocialActivity = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<SocialActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchFriendActivities();
      setupRealtimeSubscription();
    }
  }, [user]);

  const fetchFriendActivities = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('friend_activities')
        .select('*')
        .eq('friend_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Get user profiles separately
      const userIds = [...new Set(data?.map(activity => activity.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      const activitiesWithProfiles = data?.map(activity => ({
        ...activity,
        user_profile: profileMap.get(activity.user_id)
      })) || [];

      setActivities(activitiesWithProfiles);
    } catch (error) {
      console.error('Error fetching friend activities:', error);
      toast.error('Failed to load friend activities');
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!user) return;
    
    const channel = supabase
      .channel('friend-activities')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'friend_activities',
          filter: `friend_id=eq.${user.id}`,
        },
        (payload) => {
          // Fetch full activity with profile data
          fetchFriendActivities();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const createActivity = async (
    activity_type: string,
    movie_id: number,
    movie_title: string,
    movie_poster?: string,
    activity_data: any = {}
  ) => {
    if (!user) return;

    try {
      // Get user's friends to notify them
      const { data: connections } = await supabase
        .from('social_connections')
        .select('following_id')
        .eq('follower_id', user.id)
        .eq('status', 'accepted');

      if (connections && connections.length > 0) {
        // Create activity entries for each friend
        const activitiesToCreate = connections.map(conn => ({
          user_id: user.id,
          friend_id: conn.following_id,
          activity_type,
          movie_id,
          movie_title,
          movie_poster,
          activity_data
        }));

        const { error } = await supabase
          .from('friend_activities')
          .insert(activitiesToCreate);

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error creating social activity:', error);
    }
  };

  return {
    activities,
    loading,
    createActivity,
    refetch: fetchFriendActivities
  };
};