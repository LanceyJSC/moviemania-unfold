import { cn } from '@/lib/utils';
import { Flame } from 'lucide-react';

// Flame colors progressing from cool to hot
const flameColors = {
  1: { active: 'text-amber-400', fill: 'fill-amber-400' },      // Warm ember
  2: { active: 'text-orange-500', fill: 'fill-orange-500' },    // Orange flame
  3: { active: 'text-orange-600', fill: 'fill-orange-600' },    // Deep orange
  4: { active: 'text-red-500', fill: 'fill-red-500' },          // Red hot
  5: { active: 'text-red-600', fill: 'fill-red-600' },          // Blazing red
};

const getFlameStyle = (score: number, isActive: boolean) => {
  if (!isActive) return { colorClass: 'text-muted-foreground/30', fillClass: '' };
  const colors = flameColors[score as keyof typeof flameColors] || flameColors[5];
  return { colorClass: colors.active, fillClass: colors.fill };
};

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
      {Array.from({ length: max }, (_, i) => i + 1).map((score) => {
        const isActive = score <= value;
        const { colorClass, fillClass } = getFlameStyle(score, isActive);
        
        return (
          <button
            key={score}
            type="button"
            disabled={disabled}
            onClick={() => onChange(value === score ? 0 : score)}
            className={cn(
              'rounded-full transition-all duration-200 touch-manipulation flex items-center justify-center',
              sizeClasses[size],
              colorClass,
              !isActive && 'hover:text-muted-foreground/60',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            <Flame 
              className={cn(
                iconSizes[size],
                isActive && fillClass
              )} 
            />
          </button>
        );
      })}
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
      {Array.from({ length: max }, (_, i) => i + 1).map((score) => {
        const isActive = score <= rating;
        const { colorClass, fillClass } = getFlameStyle(score, isActive);
        
        return (
          <Flame
            key={score}
            className={cn(
              iconSizes[size],
              colorClass,
              isActive && fillClass
            )}
          />
        );
      })}
    </div>
  );
};

// Simple text display for flame rating
export const FlameRatingText = ({ rating }: { rating: number }) => {
  const { colorClass } = getFlameStyle(rating, true);
  
  return (
    <span className={cn("inline-flex items-center gap-1", colorClass)}>
      <Flame className="h-3.5 w-3.5 fill-current" />
      <span className="font-semibold">{rating}/5</span>
    </span>
  );
};