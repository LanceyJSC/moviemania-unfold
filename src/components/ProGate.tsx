import React from 'react';
import { useSubscription, ProFeature } from '@/hooks/useSubscription';
import { UpgradePrompt } from './UpgradePrompt';

interface ProGateProps {
  feature: ProFeature;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showPrompt?: boolean;
}

/**
 * Wrapper component to gate Pro features.
 * If user has access, renders children.
 * If not, renders fallback or upgrade prompt.
 */
export const ProGate: React.FC<ProGateProps> = ({ 
  feature, 
  children, 
  fallback,
  showPrompt = true 
}) => {
  const { canAccess, loading } = useSubscription();

  if (loading) {
    return null; // Or a skeleton loader
  }

  if (canAccess(feature)) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (showPrompt) {
    return <UpgradePrompt feature={feature} />;
  }

  return null;
};

/**
 * Hook version for conditional rendering in components
 */
export const useProFeature = (feature: ProFeature) => {
  const { canAccess, loading, isPro } = useSubscription();
  
  return {
    hasAccess: canAccess(feature),
    loading,
    isPro,
  };
};
