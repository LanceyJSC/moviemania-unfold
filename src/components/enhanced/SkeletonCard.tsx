import { cn } from "@/lib/utils";

interface SkeletonCardProps {
  className?: string;
  variant?: 'movie' | 'hero' | 'list';
}

export const SkeletonCard = ({ className, variant = 'movie' }: SkeletonCardProps) => {
  if (variant === 'hero') {
    return (
      <div className={cn("relative w-full", className)}>
        <div className="aspect-[16/9] bg-muted animate-pulse rounded-lg" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent rounded-lg" />
        <div className="absolute bottom-6 left-6 space-y-3">
          <div className="h-8 w-64 bg-muted animate-pulse rounded" />
          <div className="h-4 w-96 bg-muted animate-pulse rounded" />
          <div className="flex gap-2">
            <div className="h-10 w-24 bg-muted animate-pulse rounded" />
            <div className="h-10 w-32 bg-muted animate-pulse rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <div className={cn("flex gap-4 p-4", className)}>
        <div className="w-16 h-24 bg-muted animate-pulse rounded" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-3/4 bg-muted animate-pulse rounded" />
          <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
          <div className="h-4 w-2/3 bg-muted animate-pulse rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="aspect-[2/3] bg-muted animate-pulse rounded-lg" />
      <div className="space-y-2">
        <div className="h-4 w-full bg-muted animate-pulse rounded" />
        <div className="h-3 w-2/3 bg-muted animate-pulse rounded" />
      </div>
    </div>
  );
};

export const SkeletonGrid = ({ 
  count = 8, 
  variant = 'movie',
  className 
}: { 
  count?: number; 
  variant?: 'movie' | 'hero' | 'list';
  className?: string;
}) => {
  if (variant === 'hero') {
    return <SkeletonCard variant="hero" className={className} />;
  }

  if (variant === 'list') {
    return (
      <div className={cn("space-y-2", className)}>
        {Array.from({ length: count }).map((_, i) => (
          <SkeletonCard key={i} variant="list" />
        ))}
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} variant="movie" />
      ))}
    </div>
  );
};