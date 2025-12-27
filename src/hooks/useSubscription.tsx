import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type SubscriptionTier = 'free' | 'pro';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing';

interface Subscription {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  isInGracePeriod: boolean;
}

interface SubscriptionContextType {
  subscription: Subscription | null;
  loading: boolean;
  isPro: boolean;
  canAccess: (feature: ProFeature) => boolean;
  getLimit: (limit: FeatureLimit) => number;
  refresh: () => Promise<void>;
}

// Pro features that can be gated
export type ProFeature = 
  | 'unlimited_watchlists'
  | 'unlimited_lists'
  | 'list_reordering'
  | 'list_notes'
  | 'list_tags'
  | 'filter_mood'
  | 'filter_tone'
  | 'filter_pacing'
  | 'filter_era'
  | 'filter_language'
  | 'combine_filters'
  | 'save_filter_presets'
  | 'taste_profile'
  | 'genre_breakdown'
  | 'era_breakdown'
  | 'director_affinity'
  | 'taste_insights'
  | 'taste_comparison'
  | 'rating_history'
  | 're_rating_tracking'
  | 'taste_over_time'
  | 'export_pdf'
  | 'export_csv'
  | 'private_share_links'
  | 'print_views'
  | 'no_ads'
  | 'early_access'
  | 'priority_feedback';

// Numerical limits
export type FeatureLimit = 
  | 'max_watchlists'
  | 'max_lists';

// Feature configuration - centralized place to define what's Pro
const PRO_FEATURES: Set<ProFeature> = new Set([
  'unlimited_watchlists',
  'unlimited_lists',
  'list_reordering',
  'list_notes',
  'list_tags',
  'filter_mood',
  'filter_tone',
  'filter_pacing',
  'filter_era',
  'filter_language',
  'combine_filters',
  'save_filter_presets',
  'taste_profile',
  'genre_breakdown',
  'era_breakdown',
  'director_affinity',
  'taste_insights',
  'taste_comparison',
  'rating_history',
  're_rating_tracking',
  'taste_over_time',
  'export_pdf',
  'export_csv',
  'private_share_links',
  'print_views',
  'no_ads',
  'early_access',
  'priority_feedback',
]);

// Limits for free users
const FREE_LIMITS: Record<FeatureLimit, number> = {
  max_watchlists: 3,
  max_lists: 5,
};

// Limits for pro users (effectively unlimited)
const PRO_LIMITS: Record<FeatureLimit, number> = {
  max_watchlists: Infinity,
  max_lists: Infinity,
};

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

export const SubscriptionProvider = ({ children }: { children: React.ReactNode }) => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchSubscription = useCallback(async () => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching subscription:', error);
        // Default to free tier on error
        setSubscription({
          tier: 'free',
          status: 'active',
          stripeCustomerId: null,
          stripeSubscriptionId: null,
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
          isInGracePeriod: false,
        });
      } else if (data) {
        const gracePeriodEnd = data.grace_period_end ? new Date(data.grace_period_end) : null;
        const isInGracePeriod = gracePeriodEnd ? gracePeriodEnd > new Date() : false;
        
        setSubscription({
          tier: data.tier as SubscriptionTier,
          status: data.status as SubscriptionStatus,
          stripeCustomerId: data.stripe_customer_id,
          stripeSubscriptionId: data.stripe_subscription_id,
          currentPeriodEnd: data.current_period_end ? new Date(data.current_period_end) : null,
          cancelAtPeriodEnd: data.cancel_at_period_end || false,
          isInGracePeriod,
        });
      } else {
        // No subscription record - default to free
        setSubscription({
          tier: 'free',
          status: 'active',
          stripeCustomerId: null,
          stripeSubscriptionId: null,
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
          isInGracePeriod: false,
        });
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
      setSubscription({
        tier: 'free',
        status: 'active',
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        isInGracePeriod: false,
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  // Check if user has active Pro subscription
  const isPro = subscription?.tier === 'pro' && 
    (subscription.status === 'active' || 
     subscription.status === 'trialing' || 
     subscription.isInGracePeriod);

  // Check if user can access a specific feature
  const canAccess = useCallback((feature: ProFeature): boolean => {
    // If feature isn't in Pro set, it's free
    if (!PRO_FEATURES.has(feature)) return true;
    // Otherwise, user needs Pro
    return isPro;
  }, [isPro]);

  // Get limit for a feature
  const getLimit = useCallback((limit: FeatureLimit): number => {
    return isPro ? PRO_LIMITS[limit] : FREE_LIMITS[limit];
  }, [isPro]);

  const value: SubscriptionContextType = {
    subscription,
    loading,
    isPro,
    canAccess,
    getLimit,
    refresh: fetchSubscription,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};
