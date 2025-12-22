import React, { useEffect, useState } from 'react';
import { Clapperboard, Film, Heart, Sword, Laugh, Ghost, Rocket, Drama } from 'lucide-react';

interface GenreData {
  name: string;
  count: number;
  percentage: number;
}

interface TopGenreSlideProps {
  topGenre: GenreData | null;
  genres: GenreData[];
}

const genreIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  'Action': Sword,
  'Drama': Drama,
  'Comedy': Laugh,
  'Horror': Ghost,
  'Sci-Fi': Rocket,
  'Romance': Heart,
  'Thriller': Film
};

const genreColors: Record<string, string> = {
  'Action': 'text-red-500',
  'Drama': 'text-purple-500',
  'Comedy': 'text-yellow-500',
  'Horror': 'text-green-500',
  'Sci-Fi': 'text-blue-500',
  'Romance': 'text-pink-500',
  'Thriller': 'text-orange-500'
};

export const TopGenreSlide: React.FC<TopGenreSlideProps> = ({ topGenre, genres }) => {
  const [showTitle, setShowTitle] = useState(false);
  const [animatedPercentages, setAnimatedPercentages] = useState<number[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => setShowTitle(true), 200);
    
    // Animate percentages
    const percentages = genres.map(() => 0);
    const interval = setInterval(() => {
      let allComplete = true;
      const newPercentages = percentages.map((p, i) => {
        if (p < genres[i].percentage) {
          allComplete = false;
          return Math.min(p + 2, genres[i].percentage);
        }
        return p;
      });
      setAnimatedPercentages(newPercentages);
      if (allComplete) clearInterval(interval);
    }, 30);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [genres]);

  if (!topGenre || genres.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-8 text-center">
        <Clapperboard className="h-16 w-16 text-muted-foreground mb-4" />
        <p className="text-xl text-muted-foreground">No genres to show yet</p>
        <p className="text-muted-foreground/60 mt-2">Watch more to discover your taste!</p>
      </div>
    );
  }

  const TopIcon = genreIcons[topGenre.name] || Clapperboard;

  return (
    <div className="flex flex-col items-center justify-center h-full px-8">
      {/* Top genre highlight */}
      <div 
        className={`text-center mb-8 transition-all duration-700 ${
          showTitle ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
        }`}
      >
        <div className="relative inline-block mb-4">
          <TopIcon className={`h-16 w-16 ${genreColors[topGenre.name] || 'text-cinema-gold'}`} />
          <div className={`absolute inset-0 ${genreColors[topGenre.name]?.replace('text-', 'bg-') || 'bg-cinema-gold'} opacity-30 blur-xl rounded-full`} />
        </div>
        <p className="text-muted-foreground text-sm mb-2">You're a</p>
        <h2 className="font-cinematic text-4xl md:text-5xl text-foreground mb-2">
          {topGenre.name}
        </h2>
        <p className="text-muted-foreground">Enthusiast</p>
      </div>

      {/* Genre breakdown bars */}
      <div className="w-full max-w-xs space-y-3">
        {genres.slice(0, 5).map((genre, index) => {
          const Icon = genreIcons[genre.name] || Film;
          const colorClass = genreColors[genre.name] || 'text-cinema-gold';
          const bgClass = colorClass.replace('text-', 'bg-');
          
          return (
            <div 
              key={genre.name}
              className={`transition-all duration-500`}
              style={{ transitionDelay: `${index * 100 + 300}ms` }}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${colorClass}`} />
                  <span className="text-sm text-foreground">{genre.name}</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {animatedPercentages[index] || 0}%
                </span>
              </div>
              <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${bgClass} rounded-full transition-all duration-500`}
                  style={{ 
                    width: `${animatedPercentages[index] || 0}%`,
                    transitionDelay: `${index * 100}ms`
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
