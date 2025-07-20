import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { Loader2, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  className?: string;
  enabled?: boolean;
}

export const PullToRefresh = ({ 
  onRefresh, 
  children, 
  className,
  enabled = true 
}: PullToRefreshProps) => {
  const { isRefreshing, pullDistance, isPulling, isOverThreshold } = usePullToRefresh({
    onRefresh,
    enabled,
  });

  return (
    <div className={cn("relative", className)}>
      {/* Pull indicator */}
      <div 
        className={cn(
          "absolute top-0 left-0 right-0 flex items-center justify-center transition-all duration-200 z-10",
          "bg-gradient-to-b from-background to-background/90 rounded-b-lg shadow-sm",
          isPulling ? "translate-y-0" : "-translate-y-full"
        )}
        style={{ 
          height: Math.min(pullDistance * 0.8, 60),
          transform: `translateY(${isPulling ? pullDistance * 0.5 - 60 : -60}px)`
        }}
      >
        <div className={cn(
          "flex items-center gap-2 text-sm transition-all duration-200",
          isOverThreshold ? "text-primary" : "text-muted-foreground"
        )}>
          {isRefreshing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Refreshing...</span>
            </>
          ) : (
            <>
              <RotateCcw 
                className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  isOverThreshold && "rotate-180"
                )} 
              />
              <span>
                {isOverThreshold ? "Release to refresh" : "Pull to refresh"}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div 
        className="transition-transform duration-200"
        style={{ 
          transform: `translateY(${isPulling ? pullDistance * 0.3 : 0}px)` 
        }}
      >
        {children}
      </div>
    </div>
  );
};