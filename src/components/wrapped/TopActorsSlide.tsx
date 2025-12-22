import React, { useEffect, useState } from 'react';
import { User, Star } from 'lucide-react';

interface PersonData {
  id: number;
  name: string;
  profile_path: string | null;
  count: number;
}

interface TopActorsSlideProps {
  actors: PersonData[];
}

export const TopActorsSlide: React.FC<TopActorsSlideProps> = ({ actors }) => {
  const [showContent, setShowContent] = useState(false);
  const [visibleActors, setVisibleActors] = useState<number[]>([]);

  useEffect(() => {
    setShowContent(true);
    
    // Stagger actor reveals
    actors.forEach((_, index) => {
      setTimeout(() => {
        setVisibleActors(prev => [...prev, index]);
      }, 300 + index * 200);
    });
  }, [actors]);

  if (!actors || actors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-8 text-center">
        <User className="h-16 w-16 text-muted-foreground mb-4" />
        <p className="text-xl text-muted-foreground">No actor data yet</p>
        <p className="text-muted-foreground/60 mt-2">Watch more movies to see your favorites!</p>
      </div>
    );
  }

  const topActor = actors[0];

  return (
    <div className="flex flex-col items-center justify-center h-full px-6">
      {/* Title */}
      <div 
        className={`text-center mb-6 transition-all duration-500 ${
          showContent ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
        }`}
      >
        <p className="text-muted-foreground text-sm mb-1">Your most watched</p>
        <h2 className="font-cinematic text-3xl text-cinema-gold">ACTORS</h2>
      </div>

      {/* Top actor highlight */}
      <div 
        className={`relative mb-8 transition-all duration-700 delay-200 ${
          showContent ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
        }`}
      >
        {/* Glow effect */}
        <div className="absolute -inset-3 bg-cinema-gold/30 rounded-full blur-xl animate-pulse" />
        
        {/* Avatar */}
        <div className="relative w-28 h-28 rounded-full overflow-hidden ring-4 ring-cinema-gold shadow-2xl">
          {topActor.profile_path ? (
            <img 
              src={`https://image.tmdb.org/t/p/w185${topActor.profile_path}`}
              alt={topActor.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <User className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
        </div>
        
        {/* Count badge */}
        <div className="absolute -bottom-2 -right-2 bg-cinema-gold text-background rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg shadow-lg">
          {topActor.count}
        </div>
      </div>

      {/* Top actor name */}
      <h3 
        className={`font-cinematic text-2xl text-foreground mb-1 transition-all duration-500 delay-300 ${
          showContent ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {topActor.name}
      </h3>
      <p 
        className={`text-cinema-gold text-sm mb-8 transition-all duration-500 delay-400 ${
          showContent ? 'opacity-100' : 'opacity-0'
        }`}
      >
        in {topActor.count} {topActor.count === 1 ? 'movie' : 'movies'}
      </p>

      {/* Other actors */}
      {actors.length > 1 && (
        <div className="flex gap-4">
          {actors.slice(1, 4).map((actor, index) => (
            <div 
              key={actor.id}
              className={`flex flex-col items-center transition-all duration-500 ${
                visibleActors.includes(index + 1) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              <div className="relative w-16 h-16 rounded-full overflow-hidden ring-2 ring-border mb-2">
                {actor.profile_path ? (
                  <img 
                    src={`https://image.tmdb.org/t/p/w185${actor.profile_path}`}
                    alt={actor.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <User className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 bg-foreground text-background rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                  {actor.count}
                </div>
              </div>
              <p className="text-xs text-muted-foreground text-center line-clamp-1 max-w-16">
                {actor.name.split(' ')[0]}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Fan badge */}
      {topActor.count >= 3 && (
        <div 
          className={`mt-6 bg-cinema-gold/20 text-cinema-gold rounded-full px-4 py-2 text-sm font-medium transition-all duration-500 delay-700 ${
            showContent ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
          }`}
        >
          <Star className="inline h-4 w-4 mr-1 fill-cinema-gold" />
          {topActor.name.split(' ')[0]} Super Fan!
        </div>
      )}
    </div>
  );
};
