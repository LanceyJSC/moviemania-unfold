import React, { useEffect, useState } from 'react';
import { Lightbulb, Clock, Film, Calendar, Sparkles } from 'lucide-react';

interface TopContent {
  id: number;
  title: string;
  poster: string | null;
  rating: number;
  runtime?: number;
}

interface FunFacts {
  longestMovie: TopContent | null;
  shortestMovie: TopContent | null;
  firstMovie: TopContent | null;
  oldestMovie: { title: string; year: number } | null;
  newestMovie: { title: string; year: number } | null;
  totalCountries: number;
}

interface FunFactsSlideProps {
  facts: FunFacts;
  totalHours: number;
}

export const FunFactsSlide: React.FC<FunFactsSlideProps> = ({ facts, totalHours }) => {
  const [showContent, setShowContent] = useState(false);
  const [currentFact, setCurrentFact] = useState(0);

  const funFactsList = [
    facts.longestMovie && {
      icon: Clock,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/20',
      title: 'Longest Movie',
      value: facts.longestMovie.title,
      subtitle: `${Math.floor((facts.longestMovie.runtime || 0) / 60)}h ${(facts.longestMovie.runtime || 0) % 60}m`,
      poster: facts.longestMovie.poster
    },
    facts.shortestMovie && facts.shortestMovie.runtime !== facts.longestMovie?.runtime && {
      icon: Sparkles,
      color: 'text-pink-400',
      bgColor: 'bg-pink-500/20',
      title: 'Quick Watch',
      value: facts.shortestMovie.title,
      subtitle: `${facts.shortestMovie.runtime || 0} minutes`,
      poster: facts.shortestMovie.poster
    },
    facts.firstMovie && {
      icon: Calendar,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
      title: 'First Watch',
      value: facts.firstMovie.title,
      subtitle: 'Started your journey',
      poster: facts.firstMovie.poster
    },
    totalHours > 0 && {
      icon: Film,
      color: 'text-green-400',
      bgColor: 'bg-green-500/20',
      title: 'Time Well Spent',
      value: `${totalHours} hours`,
      subtitle: totalHours >= 24 
        ? `That's ${Math.floor(totalHours / 24)} full days!` 
        : 'Of pure entertainment',
      poster: null
    }
  ].filter(Boolean);

  useEffect(() => {
    setShowContent(true);
    
    // Cycle through facts
    if (funFactsList.length > 1) {
      const interval = setInterval(() => {
        setCurrentFact(prev => (prev + 1) % funFactsList.length);
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [funFactsList.length]);

  if (funFactsList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-8 text-center">
        <Lightbulb className="h-16 w-16 text-muted-foreground mb-4" />
        <p className="text-xl text-muted-foreground">Fun facts loading...</p>
        <p className="text-muted-foreground/60 mt-2">Watch more to unlock insights!</p>
      </div>
    );
  }

  const fact = funFactsList[currentFact];
  if (!fact) return null;

  const IconComponent = fact.icon;

  return (
    <div className="flex flex-col items-center justify-center h-full px-6">
      {/* Title */}
      <div 
        className={`text-center mb-8 transition-all duration-500 ${
          showContent ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
        }`}
      >
        <Lightbulb className="h-8 w-8 text-yellow-400 mx-auto mb-3" />
        <p className="text-muted-foreground text-sm mb-1">Did you know?</p>
        <h2 className="font-cinematic text-3xl text-yellow-400">FUN FACTS</h2>
      </div>

      {/* Fact card */}
      <div 
        key={currentFact}
        className={`w-full max-w-xs ${fact.bgColor} rounded-2xl p-6 border border-border transition-all duration-500 ${
          showContent ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
        }`}
      >
        <div className="flex items-start gap-4">
          {/* Poster or icon */}
          {fact.poster ? (
            <div className="w-16 h-24 rounded-lg overflow-hidden flex-shrink-0">
              <img 
                src={`https://image.tmdb.org/t/p/w154${fact.poster}`}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className={`w-12 h-12 rounded-xl ${fact.bgColor} flex items-center justify-center flex-shrink-0`}>
              <IconComponent className={`h-6 w-6 ${fact.color}`} />
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${fact.color} mb-1`}>{fact.title}</p>
            <p className="text-lg font-bold text-foreground line-clamp-2 mb-1">
              {fact.value}
            </p>
            <p className="text-xs text-muted-foreground">{fact.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Fact indicators */}
      {funFactsList.length > 1 && (
        <div className="flex gap-2 mt-6">
          {funFactsList.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentFact(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentFact 
                  ? 'bg-yellow-400 w-6' 
                  : 'bg-muted-foreground/30'
              }`}
            />
          ))}
        </div>
      )}

      {/* Trivia enthusiast badge */}
      <div 
        className={`mt-6 bg-yellow-500/20 text-yellow-300 rounded-full px-4 py-2 text-sm font-medium transition-all duration-500 delay-500 ${
          showContent ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
        }`}
      >
        💡 Movie Trivia Master
      </div>
    </div>
  );
};
