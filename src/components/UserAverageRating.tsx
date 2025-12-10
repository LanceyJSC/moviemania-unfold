import { Star, Users } from 'lucide-react';
import { useAverageUserRating } from '@/hooks/useAverageUserRating';
import { Skeleton } from '@/components/ui/skeleton';

interface UserAverageRatingProps {
  mediaId: number;
  mediaType: 'movie' | 'tv';
}

export const UserAverageRating = ({ mediaId, mediaType }: UserAverageRatingProps) => {
  const { average, count, isLoading } = useAverageUserRating(mediaId, mediaType);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-20" />
      </div>
    );
  }

  if (average === null || count === 0) {
    return (
      <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
        <Users className="h-4 w-4" />
        <span>No user ratings yet</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <Users className="h-4 w-4 text-primary" />
      <span className="text-primary font-semibold">{average.toFixed(1)}</span>
      <span className="text-muted-foreground text-sm">({count} {count === 1 ? 'rating' : 'ratings'})</span>
    </div>
  );
};
