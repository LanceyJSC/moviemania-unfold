import { cn } from '@/lib/utils';

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
  const sizeClasses = {
    sm: 'h-6 min-w-[24px] text-[10px]',
    md: 'h-7 min-w-[28px] text-xs',
    lg: 'h-8 min-w-[32px] text-sm'
  };

  return (
    <div className="flex gap-1 flex-wrap justify-center">
      {Array.from({ length: max }, (_, i) => i + 1).map((score) => (
        <button
          key={score}
          type="button"
          disabled={disabled}
          onClick={() => onChange(value === score ? 0 : score)}
          className={cn(
            'rounded font-semibold transition-all duration-200 touch-manipulation',
            sizeClasses[size],
            'flex items-center justify-center px-1',
            score === value
              ? 'bg-cinema-gold text-cinema-black'
              : 'bg-muted text-muted-foreground active:bg-muted/70',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          {score}
        </button>
      ))}
    </div>
  );
};
