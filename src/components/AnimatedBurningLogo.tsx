import React, { useState, useEffect } from 'react';
import sceneburnLogo from '@/assets/sceneburn-logo-full.png';

interface AnimatedBurningLogoProps {
  size?: number;
  className?: string;
  onAnimationComplete?: () => void;
}

const AnimatedBurningLogo: React.FC<AnimatedBurningLogoProps> = ({ 
  size = 200, 
  className = '',
  onAnimationComplete 
}) => {
  const [animationPhase, setAnimationPhase] = useState<'entrance' | 'burning' | 'complete'>('entrance');

  useEffect(() => {
    // Start burning after entrance
    const entranceTimer = setTimeout(() => {
      setAnimationPhase('burning');
    }, 600);

    // Complete animation
    const completeTimer = setTimeout(() => {
      setAnimationPhase('complete');
      onAnimationComplete?.();
    }, 3000);

    return () => {
      clearTimeout(entranceTimer);
      clearTimeout(completeTimer);
    };
  }, [onAnimationComplete]);

  return (
    <div 
      className={`relative ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Glow effect behind the flame */}
      <div 
        className="absolute inset-0 rounded-full animate-flame-glow"
        style={{
          background: 'radial-gradient(circle, hsl(var(--primary) / 0.4) 0%, transparent 70%)',
          filter: 'blur(20px)',
          transform: 'scale(1.5)',
        }}
      />

      {/* Main logo container */}
      <div className="relative w-full h-full">
        {/* The full logo - film strip will burn away */}
        <img
          src={sceneburnLogo}
          alt="SceneBurn"
          className={`
            w-full h-full object-contain
            ${animationPhase === 'entrance' ? 'animate-logo-entrance' : ''}
            ${animationPhase === 'burning' ? 'animate-film-burn' : ''}
            ${animationPhase === 'complete' ? 'opacity-100' : ''}
          `}
          style={{
            filter: animationPhase === 'complete' ? 'drop-shadow(0 0 20px hsl(var(--primary) / 0.6))' : undefined,
          }}
        />

        {/* Ember particles during burn */}
        {animationPhase === 'burning' && (
          <div className="absolute inset-0 pointer-events-none overflow-visible">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1.5 h-1.5 rounded-full animate-ember-float"
                style={{
                  left: `${30 + Math.random() * 40}%`,
                  top: `${40 + Math.random() * 30}%`,
                  background: `hsl(${20 + Math.random() * 25}, 100%, ${50 + Math.random() * 20}%)`,
                  boxShadow: '0 0 6px hsl(var(--primary))',
                  animationDelay: `${i * 0.15}s`,
                  animationDuration: `${0.8 + Math.random() * 0.6}s`,
                  '--tx': `${(Math.random() - 0.5) * 60}px`,
                  '--ty': `${-30 - Math.random() * 50}px`,
                } as React.CSSProperties}
              />
            ))}
          </div>
        )}

        {/* Burn line glow effect */}
        {animationPhase === 'burning' && (
          <div 
            className="absolute inset-0 pointer-events-none animate-burn-line"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, hsl(30, 100%, 60%) 48%, hsl(20, 100%, 50%) 50%, hsl(0, 100%, 30%) 52%, transparent 100%)',
              mixBlendMode: 'overlay',
              opacity: 0.8,
            }}
          />
        )}
      </div>

      {/* Flame flicker overlay */}
      <div 
        className="absolute inset-0 pointer-events-none animate-flame-flicker"
        style={{
          background: 'radial-gradient(ellipse at 50% 60%, hsl(var(--primary) / 0.2) 0%, transparent 50%)',
        }}
      />
    </div>
  );
};

export default AnimatedBurningLogo;
