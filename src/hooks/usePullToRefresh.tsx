import { useEffect, useRef, useState } from 'react';

interface PullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
  resistance?: number;
  enabled?: boolean;
}

export const usePullToRefresh = ({
  onRefresh,
  threshold = 80,
  resistance = 2.5,
  enabled = true,
}: PullToRefreshOptions) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const currentY = useRef(0);
  const isDragging = useRef(false);

  const handleTouchStart = (e: TouchEvent) => {
    if (!enabled || window.scrollY > 5) return;
    
    startY.current = e.touches[0].clientY;
    isDragging.current = false;
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!enabled || startY.current === 0) return;

    currentY.current = e.touches[0].clientY;
    const diff = currentY.current - startY.current;

    if (diff > 0 && window.scrollY === 0) {
      isDragging.current = true;
      const distance = Math.min(diff / resistance, threshold * 1.5);
      setPullDistance(distance);
      
      if (distance > 10) {
        e.preventDefault();
      }
    }
  };

  const handleTouchEnd = async () => {
    if (!enabled || !isDragging.current) {
      resetPull();
      return;
    }

    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setIsRefreshing(false);
      }
    }
    
    resetPull();
  };

  const resetPull = () => {
    startY.current = 0;
    currentY.current = 0;
    isDragging.current = false;
    setPullDistance(0);
  };

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, pullDistance, threshold, isRefreshing]);

  return {
    isRefreshing,
    pullDistance,
    isPulling: isDragging.current && pullDistance > 0,
    isOverThreshold: pullDistance >= threshold,
  };
};