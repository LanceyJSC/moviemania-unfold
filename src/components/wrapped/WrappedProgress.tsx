import React from 'react';
import { cn } from '@/lib/utils';

interface WrappedProgressProps {
  totalSlides: number;
  currentSlide: number;
  isPaused: boolean;
}

export const WrappedProgress: React.FC<WrappedProgressProps> = ({
  totalSlides,
  currentSlide,
  isPaused
}) => {
  return (
    <div className="flex gap-1 w-full px-4 pt-4">
      {Array.from({ length: totalSlides }).map((_, index) => (
        <div
          key={index}
          className="h-1 flex-1 rounded-full overflow-hidden bg-foreground/20"
        >
          <div
            className={cn(
              "h-full rounded-full transition-all duration-300",
              index < currentSlide 
                ? "bg-foreground w-full" 
                : index === currentSlide 
                  ? "bg-foreground animate-progress" 
                  : "bg-transparent w-0",
              isPaused && index === currentSlide && "animation-paused"
            )}
            style={{
              width: index < currentSlide ? '100%' : index === currentSlide ? '100%' : '0%',
              animationDuration: '5s',
              animationPlayState: isPaused ? 'paused' : 'running'
            }}
          />
        </div>
      ))}
    </div>
  );
};
