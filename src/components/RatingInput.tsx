import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

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
  max = 10, 
  size = 'md',
  disabled = false 
}: RatingInputProps) => {
  const isMobile = useIsMobile();
  
  // Smaller sizes on mobile to fit all 10 buttons
  const sizeClasses = {
    sm: isMobile ? 'h-7 w-7 text-xs' : 'h-6 w-6 text-xs',
    md: isMobile ? 'h-7 w-7 text-xs' : 'h-8 w-8 text-sm',
    lg: isMobile ? 'h-8 w-8 text-sm' : 'h-10 w-10 text-base'
  };

  return (
    <div className="flex gap-0.5 sm:gap-1 flex-wrap justify-center">
      {Array.from({ length: max }, (_, i) => i + 1).map((score) => (
        <button
          key={score}
          type="button"
          disabled={disabled}
          onClick={() => onChange(value === score ? 0 : score)}
          className={cn(
            'rounded-md font-semibold transition-all duration-200',
            sizeClasses[size],
            'flex items-center justify-center',
            score === value
              ? 'bg-cinema-gold text-cinema-black'
              : 'bg-muted text-muted-foreground hover:bg-muted/80',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          {score}
        </button>
      ))}
    </div>
  );
};
