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
    sm: 'h-6 w-6 text-[10px]',
    md: 'h-7 w-7 text-xs',
    lg: 'h-8 w-8 text-sm'
  };

  return (
    <div className="flex gap-0.5 flex-wrap">
      {Array.from({ length: max }, (_, i) => i + 1).map((score) => (
        <button
          key={score}
          type="button"
          disabled={disabled}
          onClick={() => onChange(value === score ? 0 : score)}
          className={cn(
            'rounded font-semibold transition-all duration-200',
            sizeClasses[size],
            'flex items-center justify-center flex-shrink-0',
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
