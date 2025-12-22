import React, { useEffect, useState } from 'react';
import { WrappedPeriod } from '@/hooks/useWrappedData';
import AnimatedBurningLogo from '@/components/AnimatedBurningLogo';

interface IntroSlideProps {
  period: WrappedPeriod;
  memberSince: Date | null;
  daysMember: number;
}

const periodLabels: Record<WrappedPeriod, string> = {
  'today': 'Daily',
  'week': 'Weekly',
  'month': 'Monthly',
  'all-time': 'All Time'
};

export const IntroSlide: React.FC<IntroSlideProps> = ({ period, memberSince, daysMember }) => {
  const [showTitle, setShowTitle] = useState(false);
  const [showSubtitle, setShowSubtitle] = useState(false);
  const [showMember, setShowMember] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => setShowTitle(true), 300);
    const timer2 = setTimeout(() => setShowSubtitle(true), 800);
    const timer3 = setTimeout(() => setShowMember(true), 1300);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8">
      {/* Animated burning logo */}
      <div className="mb-8">
        <AnimatedBurningLogo size={160} />
      </div>

      {/* Main title */}
      <h1 
        className={`font-cinematic text-5xl md:text-7xl tracking-wider mb-4 transition-all duration-700 delay-100 ${
          showTitle ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <span className="text-foreground">YOUR</span>
        <br />
        <span className="text-cinema-red">{periodLabels[period].toUpperCase()}</span>
        <br />
        <span className="text-foreground">WRAPPED</span>
      </h1>

      {/* Subtitle */}
      <p 
        className={`text-muted-foreground text-lg md:text-xl mb-8 transition-all duration-700 delay-300 ${
          showSubtitle ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        Your cinematic journey awaits
      </p>

      {/* Member since (for all-time) */}
      {period === 'all-time' && memberSince && (
        <div 
          className={`bg-card/50 backdrop-blur-sm rounded-2xl px-6 py-4 border border-cinema-gold/30 transition-all duration-700 delay-500 ${
            showMember ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
          }`}
        >
          <p className="text-cinema-gold text-sm font-medium">Member for</p>
          <p className="text-3xl font-bold text-foreground">{daysMember} days</p>
        </div>
      )}

      {/* Tap hint */}
      <p className="absolute bottom-20 text-muted-foreground/50 text-sm animate-pulse">
        Tap to continue
      </p>
    </div>
  );
};
