import { useSubscription, FeatureLimit } from '@/hooks/useSubscription';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';

/**
 * Hook to check feature limits before performing actions
 */
export const useFeatureLimits = () => {
  const { getLimit, isPro, canAccess } = useSubscription();
  const { toast } = useToast();
  const navigate = useNavigate();

  /**
   * Check if user can create more items of a type
   * @returns true if allowed, false if at limit
   */
  const checkLimit = useCallback((
    limitType: FeatureLimit,
    currentCount: number,
    options?: {
      showToast?: boolean;
      itemName?: string;
    }
  ): boolean => {
    const limit = getLimit(limitType);
    const isAtLimit = currentCount >= limit;

    if (isAtLimit && options?.showToast !== false) {
      const itemName = options?.itemName || limitType.replace('max_', '').replace('_', ' ');
      toast({
        title: `${itemName.charAt(0).toUpperCase() + itemName.slice(1)} limit reached`,
        description: `Free accounts can create up to ${limit} ${itemName}s. Upgrade to Pro for unlimited.`,
        variant: "destructive",
        action: (
          <button 
            onClick={() => navigate('/upgrade')}
            className="bg-primary text-primary-foreground px-3 py-1 rounded text-sm font-medium"
          >
            Upgrade
          </button>
        ),
      });
    }

    return !isAtLimit;
  }, [getLimit, toast, navigate]);

  /**
   * Get remaining count for a limit
   */
  const getRemainingCount = useCallback((
    limitType: FeatureLimit,
    currentCount: number
  ): number => {
    const limit = getLimit(limitType);
    return Math.max(0, limit - currentCount);
  }, [getLimit]);

  /**
   * Check if near limit (within 1 of max)
   */
  const isNearLimit = useCallback((
    limitType: FeatureLimit,
    currentCount: number
  ): boolean => {
    const limit = getLimit(limitType);
    return limit !== Infinity && currentCount >= limit - 1;
  }, [getLimit]);

  return {
    checkLimit,
    getRemainingCount,
    isNearLimit,
    getLimit,
    isPro,
    canAccess,
  };
};
