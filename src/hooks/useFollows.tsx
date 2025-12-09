import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FollowData {
  follower_id: string;
  following_id: string;
  created_at: string;
}

export const useFollows = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [following, setFollowing] = useState<string[]>([]);
  const [followers, setFollowers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchFollows();
    } else {
      setFollowing([]);
      setFollowers([]);
      setLoading(false);
    }
  }, [user]);

  const fetchFollows = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const [followingRes, followersRes] = await Promise.all([
        supabase
          .from('user_follows')
          .select('following_id')
          .eq('follower_id', user.id),
        supabase
          .from('user_follows')
          .select('follower_id')
          .eq('following_id', user.id)
      ]);

      if (followingRes.error) throw followingRes.error;
      if (followersRes.error) throw followersRes.error;

      setFollowing(followingRes.data.map(f => f.following_id));
      setFollowers(followersRes.data.map(f => f.follower_id));
    } catch (error) {
      console.error('Error fetching follows:', error);
    } finally {
      setLoading(false);
    }
  };

  const followUser = async (targetUserId: string) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to follow users",
        variant: "destructive",
      });
      return;
    }

    if (targetUserId === user.id) {
      toast({
        title: "Can't follow yourself",
        description: "You cannot follow your own profile",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('user_follows')
        .insert({
          follower_id: user.id,
          following_id: targetUserId
        });

      if (error) throw error;

      setFollowing(prev => [...prev, targetUserId]);
      
      // Add to activity feed
      await supabase.from('activity_feed').insert({
        user_id: user.id,
        activity_type: 'followed',
        target_type: 'user',
        target_id: targetUserId
      });

      toast({
        title: "Following",
        description: "You are now following this user",
      });
    } catch (error) {
      console.error('Error following user:', error);
      toast({
        title: "Error",
        description: "Failed to follow user",
        variant: "destructive",
      });
    }
  };

  const unfollowUser = async (targetUserId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId);

      if (error) throw error;

      setFollowing(prev => prev.filter(id => id !== targetUserId));
      
      toast({
        title: "Unfollowed",
        description: "You have unfollowed this user",
      });
    } catch (error) {
      console.error('Error unfollowing user:', error);
      toast({
        title: "Error",
        description: "Failed to unfollow user",
        variant: "destructive",
      });
    }
  };

  const isFollowing = (userId: string) => following.includes(userId);
  const isFollowedBy = (userId: string) => followers.includes(userId);

  return {
    following,
    followers,
    loading,
    followUser,
    unfollowUser,
    isFollowing,
    isFollowedBy,
    refetch: fetchFollows
  };
};
