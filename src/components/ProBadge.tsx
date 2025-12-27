import { Crown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ProBadgeProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const ProBadge = ({ className, size = 'sm' }: ProBadgeProps) => {
  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-xs px-2 py-0.5',
    lg: 'text-sm px-2.5 py-1',
  };

  const iconSizes = {
    sm: 10,
    md: 12,
    lg: 14,
  };

  return (
    <Badge
      className={cn(
        'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 font-semibold gap-0.5',
        sizeClasses[size],
        className
      )}
    >
      <Crown size={iconSizes[size]} className="fill-current" />
      PRO
    </Badge>
  );
};
