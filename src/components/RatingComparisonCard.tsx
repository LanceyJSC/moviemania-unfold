import { Star, Users, User } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { RatingInput } from '@/components/RatingInput';
import { useAverageUserRating } from '@/hooks/useAverageUserRating';

interface RatingComparisonCardProps {
  mediaId: number;
  mediaType: 'movie' | 'tv';
  tmdbRating: number;
  userRating: number;
  onRatingChange: (rating: number) => void;
  mediaTitle: string;
  mediaPoster?: string;
}

export const RatingComparisonCard = ({
  mediaId,
  mediaType,
  tmdbRating,
  userRating,
  onRatingChange,
}: RatingComparisonCardProps) => {
  const { average: averageRating, count } = useAverageUserRating(mediaId, mediaType);

  return (
    <Card className="p-3 sm:p-4 bg-card/50 border-border/50 mb-6">
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {/* TMDB Score */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Star className="h-3 w-3 sm:h-4 sm:w-4 fill-cinema-gold text-cinema-gold" />
          </div>
          <div className="text-lg sm:text-2xl font-bold text-cinema-gold">
            {tmdbRating.toFixed(1)}
          </div>
          <div className="text-[10px] sm:text-xs text-muted-foreground mt-1">TMDB</div>
        </div>

        {/* Community Average */}
        <div className="text-center border-x border-border/50">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Users className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
          </div>
          <div className="text-lg sm:text-2xl font-bold text-primary">
            {averageRating ? averageRating.toFixed(1) : '—'}
          </div>
          <div className="text-[10px] sm:text-xs text-muted-foreground mt-1">
            {count > 0 ? `${count}` : 'Community'}
          </div>
        </div>

        {/* Your Rating */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <User className="h-3 w-3 sm:h-4 sm:w-4 text-foreground" />
          </div>
          <div className="text-lg sm:text-2xl font-bold text-foreground">
            {userRating > 0 ? userRating : '—'}
          </div>
          <div className="text-[10px] sm:text-xs text-muted-foreground mt-1">You</div>
        </div>
      </div>

      {/* Rating Input */}
      <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border/50">
        <div className="text-center">
          <span className="text-xs sm:text-sm text-muted-foreground mb-2 block">Rate this:</span>
          <RatingInput
            value={userRating}
            onChange={onRatingChange}
            max={10}
            size="sm"
          />
        </div>
      </div>
    </Card>
  );
};