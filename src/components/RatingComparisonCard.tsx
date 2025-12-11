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
    <Card className="p-4 bg-card/50 border-border/50">
      <div className="grid grid-cols-3 gap-4">
        {/* TMDB Score */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Star className="h-4 w-4 fill-cinema-gold text-cinema-gold" />
          </div>
          <div className="text-2xl font-bold text-cinema-gold">
            {tmdbRating.toFixed(1)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">TMDB</div>
        </div>

        {/* Community Average */}
        <div className="text-center border-x border-border/50">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Users className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl font-bold text-primary">
            {averageRating ? averageRating.toFixed(1) : '—'}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {count > 0 ? `${count} ${count === 1 ? 'rating' : 'ratings'}` : 'Community'}
          </div>
        </div>

        {/* Your Rating */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <User className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-bold text-foreground">
            {userRating > 0 ? userRating : '—'}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Your Rating</div>
        </div>
      </div>

      {/* Rating Input */}
      <div className="mt-4 pt-4 border-t border-border/50">
        <div className="flex items-center justify-center gap-2">
          <span className="text-sm text-muted-foreground">Rate:</span>
          <RatingInput
            value={userRating}
            onChange={onRatingChange}
            max={10}
            size="md"
          />
        </div>
      </div>
    </Card>
  );
};