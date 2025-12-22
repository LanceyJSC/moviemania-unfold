import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface HoursWatchedSlideProps {
  totalHours: number;
}

export const HoursWatchedSlide: React.FC<HoursWatchedSlideProps> = ({ totalHours }) => {
  const [displayHours, setDisplayHours] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    setShowContent(true);
    
    // Animate hours count
    const duration = 2000;
    const step = totalHours / (duration / 16);
    let current = 0;
    const interval = setInterval(() => {
      current += step;
      if (current >= totalHours) {
        setDisplayHours(totalHours);
        clearInterval(interval);
      } else {
        setDisplayHours(Math.floor(current));
      }
    }, 16);

    // Animate progress circle
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 2;
      });
    }, 20);

    return () => {
      clearInterval(interval);
      clearInterval(progressInterval);
    };
  }, [totalHours]);

  // Convert to days and hours for display
  const days = Math.floor(totalHours / 24);
  const remainingHours = totalHours % 24;

  // Fun comparison
  const getComparison = () => {
    if (totalHours >= 48) return `That's ${Math.floor(totalHours / 2)} Marvel movies!`;
    if (totalHours >= 24) return "A whole day of entertainment!";
    if (totalHours >= 12) return "Half a day well spent!";
    if (totalHours >= 6) return "A nice movie marathon!";
    return "Just getting started!";
  };

  const circumference = 2 * Math.PI * 80;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center h-full px-8">
      {/* Circular progress */}
      <div 
        className={`relative mb-8 transition-all duration-700 ${
          showContent ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
        }`}
      >
        <svg className="w-48 h-48 transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="96"
            cy="96"
            r="80"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-muted/20"
          />
          {/* Progress circle */}
          <circle
            cx="96"
            cy="96"
            r="80"
            stroke="url(#gradient)"
            strokeWidth="8"
            fill="transparent"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-100"
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--cinema-gold))" />
              <stop offset="100%" stopColor="hsl(var(--cinema-red))" />
            </linearGradient>
          </defs>
        </svg>
        
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Clock className="h-6 w-6 text-cinema-gold mb-2" />
          <p className="font-cinematic text-4xl text-foreground">
            {displayHours}
          </p>
          <p className="text-muted-foreground text-sm">hours</p>
        </div>
      </div>

      {/* Time breakdown */}
      {days > 0 && (
        <div 
          className={`text-center mb-6 transition-all duration-500 delay-300 ${
            showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <p className="text-2xl text-foreground font-medium">
            {days} day{days !== 1 ? 's' : ''}{remainingHours > 0 ? ` ${remainingHours} hours` : ''}
          </p>
          <p className="text-muted-foreground">of pure cinema</p>
        </div>
      )}

      {/* Fun comparison */}
      <div 
        className={`bg-card/50 backdrop-blur-sm rounded-2xl px-6 py-4 border border-cinema-gold/20 transition-all duration-500 delay-500 ${
          showContent ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
        }`}
      >
        <p className="text-center text-foreground font-medium">
          {getComparison()}
        </p>
      </div>
    </div>
  );
};
