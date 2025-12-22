import React, { useEffect, useState } from 'react';
import { Star, Tv } from 'lucide-react';

interface TopTVSlideProps {
  tvShow: {
    id: number;
    title: string;
    poster: string | null;
    rating: number;
    count?: number;
  } | null;
}

export const TopTVSlide: React.FC<TopTVSlideProps> = ({ tvShow }) => {
  const [showPoster, setShowPoster] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [glowIntensity, setGlowIntensity] = useState(0);

  useEffect(() => {
    const timer1 = setTimeout(() => setShowPoster(true), 200);
    const timer2 = setTimeout(() => setShowDetails(true), 600);
    
    // Pulsing glow effect
    const glowInterval = setInterval(() => {
      setGlowIntensity(prev => (prev + 1) % 100);
    }, 50);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearInterval(glowInterval);
    };
  }, []);

  if (!tvShow) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-8 text-center">
        <Tv className="h-16 w-16 text-muted-foreground mb-4" />
        <p className="text-xl text-muted-foreground">No TV shows watched yet</p>
        <p className="text-muted-foreground/60 mt-2">Start binging to see your top show!</p>
      </div>
    );
  }

  const glowOpacity = 0.2 + (Math.sin(glowIntensity * 0.1) * 0.15);

  return (
    <div className="flex flex-col items-center justify-center h-full px-8 relative">
      {/* Label */}
      <div 
        className={`flex items-center gap-2 mb-6 transition-all duration-500 ${
          showDetails ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
        }`}
      >
        <Tv className="h-5 w-5 text-blue-400" />
        <p className="text-blue-400 font-medium">Your Top TV Show</p>
      </div>

      {/* Poster with animated glow */}
      <div 
        className={`relative mb-6 transition-all duration-700 ${
          showPoster ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
        }`}
      >
        {/* Animated glow effect */}
        <div 
          className="absolute -inset-4 bg-blue-500 rounded-2xl blur-xl transition-opacity duration-200"
          style={{ opacity: glowOpacity }}
        />
        
        {/* Poster */}
        <div className="relative w-48 h-72 rounded-xl overflow-hidden shadow-2xl ring-2 ring-blue-500/50">
          {tvShow.poster ? (
            <img 
              src={`https://image.tmdb.org/t/p/w500${tvShow.poster}`}
              alt={tvShow.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <Tv className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
        </div>
      </div>

      {/* TV show title */}
      <h2 
        className={`font-cinematic text-2xl md:text-3xl text-center text-foreground mb-4 transition-all duration-500 delay-200 ${
          showDetails ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        {tvShow.title}
      </h2>

      {/* Rating and episode count */}
      <div 
        className={`flex items-center gap-4 transition-all duration-500 delay-400 ${
          showDetails ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
        }`}
      >
        <div className="flex items-center gap-2 bg-card/80 backdrop-blur-sm rounded-full px-4 py-2 border border-blue-500/30">
          <Star className="h-5 w-5 text-blue-400 fill-blue-400" />
          <span className="text-xl font-bold text-foreground">{tvShow.rating}/10</span>
        </div>
      </div>

      {/* Binge badge */}
      {tvShow.count && tvShow.count > 3 && (
        <div 
          className={`mt-4 bg-blue-500/20 text-blue-300 rounded-full px-4 py-1 text-sm font-medium transition-all duration-500 delay-600 ${
            showDetails ? 'opacity-100' : 'opacity-0'
          }`}
        >
          🔥 Binge Champion
        </div>
      )}
    </div>
  );
};
