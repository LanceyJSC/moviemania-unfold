import { cn } from '@/lib/utils';
import { Flame } from 'lucide-react';

interface RatingInputProps {
  value: number;
  onChange: (rating: number) => void;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

export const RatingInput = ({ 
  value, 
  onChange, 
  max = 5, 
  size = 'md',
  disabled = false 
}: RatingInputProps) => {
  const sizeClasses = {
    sm: 'h-7 w-7',
    md: 'h-8 w-8',
    lg: 'h-10 w-10'
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  return (
    <div className="flex gap-1 justify-center">
      {Array.from({ length: max }, (_, i) => i + 1).map((score) => (
        <button
          key={score}
          type="button"
          disabled={disabled}
          onClick={() => onChange(value === score ? 0 : score)}
          className={cn(
            'rounded-full transition-all duration-200 touch-manipulation flex items-center justify-center',
            sizeClasses[size],
            score <= value
              ? 'text-cinema-red'
              : 'text-muted-foreground/40 hover:text-muted-foreground/60',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <Flame 
            className={cn(
              iconSizes[size],
              score <= value && 'fill-current'
            )} 
          />
        </button>
      ))}
    </div>
  );
};

// Helper component to display a flame rating (read-only)
export const FlameRating = ({ 
  rating, 
  max = 5,
  size = 'sm',
  showEmpty = false 
}: { 
  rating: number; 
  max?: number;
  size?: 'xs' | 'sm' | 'md';
  showEmpty?: boolean;
}) => {
  const iconSizes = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-5 w-5'
  };

  if (!showEmpty && rating === 0) return null;

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => i + 1).map((score) => (
        <Flame
          key={score}
          className={cn(
            iconSizes[size],
            score <= rating
              ? 'text-cinema-red fill-cinema-red'
              : 'text-muted-foreground/30'
          )}
        />
      ))}
    </div>
  );
};

// Simple text display for flame rating
export const FlameRatingText = ({ rating }: { rating: number }) => {
  return (
    <span className="inline-flex items-center gap-1 text-cinema-red">
      <Flame className="h-3.5 w-3.5 fill-current" />
      <span className="font-semibold">{rating}/5</span>
    </span>
  );
};