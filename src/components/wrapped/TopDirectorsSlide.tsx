import React, { useEffect, useState } from 'react';
import { Clapperboard, Film } from 'lucide-react';

interface PersonData {
  id: number;
  name: string;
  profile_path: string | null;
  count: number;
}

interface TopDirectorsSlideProps {
  directors: PersonData[];
}

export const TopDirectorsSlide: React.FC<TopDirectorsSlideProps> = ({ directors }) => {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    setTimeout(() => setShowContent(true), 200);
  }, []);

  if (!directors || directors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-8 text-center">
        <Clapperboard className="h-16 w-16 text-muted-foreground mb-4" />
        <p className="text-xl text-muted-foreground">No director data yet</p>
        <p className="text-muted-foreground/60 mt-2">Watch more movies to discover your taste!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full px-6">
      {/* Title */}
      <div 
        className={`text-center mb-8 transition-all duration-500 ${
          showContent ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
        }`}
      >
        <Clapperboard className="h-8 w-8 text-purple-400 mx-auto mb-3" />
        <p className="text-muted-foreground text-sm mb-1">Your favorite</p>
        <h2 className="font-cinematic text-3xl text-purple-400">DIRECTORS</h2>
      </div>

      {/* Directors list */}
      <div className="w-full max-w-xs space-y-4">
        {directors.map((director, index) => (
          <div 
            key={director.id}
            className={`flex items-center gap-4 bg-card/50 backdrop-blur-sm rounded-xl p-4 border transition-all duration-500 ${
              index === 0 
                ? 'border-purple-500/50 ring-1 ring-purple-500/20' 
                : 'border-border'
            } ${
              showContent ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
            }`}
            style={{ transitionDelay: `${index * 150 + 300}ms` }}
          >
            {/* Rank */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
              index === 0 
                ? 'bg-purple-500 text-white' 
                : 'bg-muted text-muted-foreground'
            }`}>
              {index + 1}
            </div>

            {/* Photo */}
            <div className="w-12 h-12 rounded-full overflow-hidden bg-muted flex-shrink-0">
              {director.profile_path ? (
                <img 
                  src={`https://image.tmdb.org/t/p/w185${director.profile_path}`}
                  alt={director.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Clapperboard className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className={`font-medium truncate ${
                index === 0 ? 'text-purple-400' : 'text-foreground'
              }`}>
                {director.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {director.count} {director.count === 1 ? 'film' : 'films'}
              </p>
            </div>

            {/* Film icons */}
            <div className="flex -space-x-1">
              {Array.from({ length: Math.min(director.count, 3) }).map((_, i) => (
                <Film 
                  key={i} 
                  className={`h-4 w-4 ${
                    index === 0 ? 'text-purple-400' : 'text-muted-foreground'
                  }`} 
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Auteur badge */}
      {directors[0]?.count >= 2 && (
        <div 
          className={`mt-6 bg-purple-500/20 text-purple-300 rounded-full px-4 py-2 text-sm font-medium transition-all duration-500 delay-700 ${
            showContent ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
          }`}
        >
          🎬 Auteur Appreciator
        </div>
      )}
    </div>
  );
};
