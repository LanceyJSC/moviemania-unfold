import React, { useEffect, useState } from 'react';
import { Star, Trophy } from 'lucide-react';

interface TopMovieSlideProps {
  movie: {
    id: number;
    title: string;
    poster: string | null;
    rating: number;
  } | null;
  label?: string;
}

export const TopMovieSlide: React.FC<TopMovieSlideProps> = ({ movie, label = "Your Top Movie" }) => {
  const [showPoster, setShowPoster] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => setShowPoster(true), 200);
    const timer2 = setTimeout(() => setShowDetails(true), 600);
    const timer3 = setTimeout(() => setShowConfetti(true), 400);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  if (!movie) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-8 text-center">
        <Trophy className="h-16 w-16 text-muted-foreground mb-4" />
        <p className="text-xl text-muted-foreground">No movies watched yet</p>
        <p className="text-muted-foreground/60 mt-2">Start watching to see your top movie!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full px-8 relative overflow-hidden">
      {/* Confetti particles */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-20px',
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            >
              <div 
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: ['#FFD700', '#E50914', '#00D4FF', '#FF6B6B', '#4ECDC4'][Math.floor(Math.random() * 5)]
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Label */}
      <div 
        className={`flex items-center gap-2 mb-6 transition-all duration-500 ${
          showDetails ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
        }`}
      >
        <Trophy className="h-5 w-5 text-cinema-gold" />
        <p className="text-cinema-gold font-medium">{label}</p>
      </div>

      {/* Poster with glow */}
      <div 
        className={`relative mb-6 transition-all duration-700 ${
          showPoster ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
        }`}
      >
        {/* Glow effect */}
        <div className="absolute -inset-4 bg-cinema-gold/30 rounded-2xl blur-xl animate-pulse" />
        
        {/* Poster */}
        <div className="relative w-48 h-72 rounded-xl overflow-hidden shadow-2xl ring-2 ring-cinema-gold/50">
          {movie.poster ? (
            <img 
              src={`https://image.tmdb.org/t/p/w500${movie.poster}`}
              alt={movie.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <Trophy className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
        </div>
      </div>

      {/* Movie title */}
      <h2 
        className={`font-cinematic text-2xl md:text-3xl text-center text-foreground mb-4 transition-all duration-500 delay-200 ${
          showDetails ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        {movie.title}
      </h2>

      {/* Rating */}
      <div 
        className={`flex items-center gap-2 bg-card/80 backdrop-blur-sm rounded-full px-4 py-2 border border-cinema-gold/30 transition-all duration-500 delay-400 ${
          showDetails ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
        }`}
      >
        <Star className="h-5 w-5 text-cinema-gold fill-cinema-gold" />
        <span className="text-xl font-bold text-foreground">{movie.rating}/10</span>
      </div>
    </div>
  );
};
