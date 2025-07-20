import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  className?: string;
}

export const StarRating = ({
  rating,
  maxRating = 5,
  size = 'md',
  interactive = false,
  onRatingChange,
  className,
}: StarRatingProps) => {
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const handleStarClick = (starRating: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(starRating);
    }
  };

  return (
    <div className={cn("flex gap-1", className)}>
      {Array.from({ length: maxRating }).map((_, index) => {
        const starRating = index + 1;
        const isFilled = starRating <= rating;
        const isHalfFilled = starRating - 0.5 <= rating && rating < starRating;

        return (
          <button
            key={index}
            type="button"
            onClick={() => handleStarClick(starRating)}
            disabled={!interactive}
            className={cn(
              "relative transition-colors",
              interactive && "hover:scale-110 cursor-pointer",
              !interactive && "cursor-default"
            )}
          >
            <Star
              className={cn(
                sizeClasses[size],
                "transition-colors",
                isFilled || isHalfFilled
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-muted-foreground"
              )}
            />
            {isHalfFilled && (
              <Star
                className={cn(
                  sizeClasses[size],
                  "absolute inset-0 fill-yellow-400 text-yellow-400"
                )}
                style={{
                  clipPath: 'polygon(0 0, 50% 0, 50% 100%, 0 100%)'
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
};