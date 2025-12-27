import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type SubscriptionTier = 'free' | 'pro';

export const useSubscription = () => {
  const [tier, setTier] = useState<SubscriptionTier>('free');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchSubscription = useCallback(async () => {
    if (!user) {
      setTier('free');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('tier, status, grace_period_end')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching subscription:', error);
        setTier('free');
      } else if (data) {
        // Check if subscription is active
        const isActive = 
          data.status === 'active' || 
          data.status === 'trialing' ||
          (data.status === 'past_due' && data.grace_period_end && new Date(data.grace_period_end) > new Date());
        
        setTier(isActive ? data.tier : 'free');
      } else {
        setTier('free');
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
      setTier('free');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const upgradeToPro = async (): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'You must be logged in to upgrade' };
    }

    try {
      const { error } = await supabase
        .from('user_subscriptions')
        .upsert({
          user_id: user.id,
          tier: 'pro',
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (error) {
        console.error('Error upgrading to pro:', error);
        return { success: false, error: error.message };
      }

      setTier('pro');
      return { success: true };
    } catch (error) {
      console.error('Error upgrading to pro:', error);
      return { success: false, error: 'Failed to upgrade subscription' };
    }
  };

  const isProUser = tier === 'pro';

  return {
    tier,
    loading,
    isProUser,
    upgradeToPro,
    refetch: fetchSubscription
  };
};

// Standalone helper for quick pro checks (useful in components that don't need full hook)
export const checkIsProUser = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('has_pro_subscription', { _user_id: userId });
    if (error) {
      console.error('Error checking pro status:', error);
      return false;
    }
    return data ?? false;
  } catch {
    return false;
  }
};
