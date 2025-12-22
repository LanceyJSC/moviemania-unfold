import React, { useEffect, useState } from 'react';
import { Star } from 'lucide-react';

interface RatingSlideProps {
  averageRating: number;
  totalRatings: number;
  highestRatedMovie: {
    id: number;
    title: string;
    poster: string | null;
    rating: number;
  } | null;
}

export const RatingSlide: React.FC<RatingSlideProps> = ({
  averageRating,
  totalRatings,
  highestRatedMovie
}) => {
  const [displayRating, setDisplayRating] = useState(0);
  const [showStars, setShowStars] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Animate rating number
    const duration = 1500;
    const step = averageRating / (duration / 16);
    let current = 0;
    const interval = setInterval(() => {
      current += step;
      if (current >= averageRating) {
        setDisplayRating(averageRating);
        clearInterval(interval);
      } else {
        setDisplayRating(Number(current.toFixed(1)));
      }
    }, 16);

    const timer1 = setTimeout(() => setShowStars(true), 500);
    const timer2 = setTimeout(() => setShowDetails(true), 1000);

    return () => {
      clearInterval(interval);
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [averageRating]);

  const fullStars = Math.floor(displayRating);
  const hasHalfStar = displayRating % 1 >= 0.5;

  return (
    <div className="flex flex-col items-center justify-center h-full px-8">
      {/* Label */}
      <p 
        className={`text-muted-foreground mb-4 transition-all duration-500 ${
          showStars ? 'opacity-100' : 'opacity-0'
        }`}
      >
        Your average rating
      </p>

      {/* Big rating number */}
      <div className="font-cinematic text-8xl md:text-9xl text-cinema-gold mb-4">
        {displayRating.toFixed(1)}
      </div>

      {/* Star visualization */}
      <div 
        className={`flex gap-1 mb-8 transition-all duration-700 ${
          showStars ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
        }`}
      >
        {Array.from({ length: 10 }).map((_, i) => (
          <Star
            key={i}
            className={`h-6 w-6 transition-all duration-300 ${
              i < fullStars 
                ? 'text-cinema-gold fill-cinema-gold' 
                : i === fullStars && hasHalfStar
                  ? 'text-cinema-gold fill-cinema-gold/50'
                  : 'text-muted-foreground/30'
            }`}
            style={{ 
              transitionDelay: `${i * 50}ms`,
              transform: showStars && i < fullStars ? 'scale(1.1)' : 'scale(1)'
            }}
          />
        ))}
      </div>

      {/* Total ratings */}
      <div 
        className={`text-center transition-all duration-500 delay-300 ${
          showDetails ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <p className="text-2xl font-bold text-foreground mb-1">
          {totalRatings} ratings
        </p>
        <p className="text-muted-foreground text-sm">
          given this period
        </p>
      </div>

      {/* Critic badge */}
      {totalRatings >= 10 && (
        <div 
          className={`mt-6 bg-cinema-gold/20 text-cinema-gold rounded-full px-4 py-2 text-sm font-medium transition-all duration-500 delay-500 ${
            showDetails ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
          }`}
        >
          ⭐ Certified Critic
        </div>
      )}

      {/* Highest rated movie preview */}
      {highestRatedMovie && (
        <div 
          className={`mt-6 flex items-center gap-3 bg-card/50 rounded-xl p-3 border border-border transition-all duration-500 delay-700 ${
            showDetails ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {highestRatedMovie.poster && (
            <img 
              src={`https://image.tmdb.org/t/p/w92${highestRatedMovie.poster}`}
              alt={highestRatedMovie.title}
              className="w-10 h-14 rounded object-cover"
            />
          )}
          <div>
            <p className="text-xs text-muted-foreground">Highest rated</p>
            <p className="text-sm font-medium text-foreground line-clamp-1">
              {highestRatedMovie.title}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
