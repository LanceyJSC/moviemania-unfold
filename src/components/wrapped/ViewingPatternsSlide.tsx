import React, { useEffect, useState } from 'react';
import { Calendar, Flame, Clock, TrendingUp } from 'lucide-react';

interface ViewingPattern {
  busiestDay: string;
  busiestDayCount: number;
  favoriteTime: string;
  longestStreak: number;
}

interface ViewingPatternsSlideProps {
  patterns: ViewingPattern;
  totalMovies: number;
  totalEpisodes: number;
}

const dayEmojis: Record<string, string> = {
  'Monday': '😴',
  'Tuesday': '📺',
  'Wednesday': '🎬',
  'Thursday': '🍿',
  'Friday': '🎉',
  'Saturday': '🌟',
  'Sunday': '☕'
};

export const ViewingPatternsSlide: React.FC<ViewingPatternsSlideProps> = ({
  patterns,
  totalMovies,
  totalEpisodes
}) => {
  const [showContent, setShowContent] = useState(false);
  const [streakCount, setStreakCount] = useState(0);

  useEffect(() => {
    setShowContent(true);
    
    // Animate streak counter
    if (patterns.longestStreak > 0) {
      const step = patterns.longestStreak / 30;
      let current = 0;
      const interval = setInterval(() => {
        current += step;
        if (current >= patterns.longestStreak) {
          setStreakCount(patterns.longestStreak);
          clearInterval(interval);
        } else {
          setStreakCount(Math.floor(current));
        }
      }, 30);
      return () => clearInterval(interval);
    }
  }, [patterns.longestStreak]);

  return (
    <div className="flex flex-col items-center justify-center h-full px-6">
      {/* Title */}
      <div 
        className={`text-center mb-8 transition-all duration-500 ${
          showContent ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
        }`}
      >
        <TrendingUp className="h-8 w-8 text-green-400 mx-auto mb-3" />
        <p className="text-muted-foreground text-sm mb-1">Your</p>
        <h2 className="font-cinematic text-3xl text-green-400">VIEWING HABITS</h2>
      </div>

      {/* Busiest day card */}
      <div 
        className={`w-full max-w-xs bg-gradient-to-br from-green-500/20 to-transparent rounded-2xl p-6 border border-green-500/30 mb-4 transition-all duration-500 delay-200 ${
          showContent ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
        }`}
      >
        <div className="flex items-center gap-3 mb-3">
          <Calendar className="h-6 w-6 text-green-400" />
          <span className="text-sm text-muted-foreground">Favorite day to watch</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-cinematic text-3xl text-foreground">{patterns.busiestDay}</p>
            <p className="text-sm text-muted-foreground">
              {patterns.busiestDayCount} titles watched
            </p>
          </div>
          <span className="text-4xl">{dayEmojis[patterns.busiestDay] || '🎬'}</span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
        {/* Streak */}
        <div 
          className={`bg-card/50 backdrop-blur-sm rounded-xl p-4 border border-border transition-all duration-500 delay-400 ${
            showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <Flame className="h-5 w-5 text-orange-500 mb-2" />
          <p className="font-cinematic text-2xl text-foreground">{streakCount}</p>
          <p className="text-xs text-muted-foreground">Day Streak</p>
        </div>

        {/* Favorite time */}
        <div 
          className={`bg-card/50 backdrop-blur-sm rounded-xl p-4 border border-border transition-all duration-500 delay-500 ${
            showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <Clock className="h-5 w-5 text-blue-400 mb-2" />
          <p className="font-cinematic text-2xl text-foreground">{patterns.favoriteTime}</p>
          <p className="text-xs text-muted-foreground">Prime Time</p>
        </div>
      </div>

      {/* Weekly average */}
      {totalMovies + totalEpisodes > 7 && (
        <div 
          className={`mt-6 text-center transition-all duration-500 delay-600 ${
            showContent ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <p className="text-muted-foreground text-sm">Weekly average</p>
          <p className="font-cinematic text-2xl text-foreground">
            {Math.round((totalMovies + totalEpisodes) / 4)} titles
          </p>
        </div>
      )}

      {/* Dedication badge */}
      {patterns.busiestDayCount >= 5 && (
        <div 
          className={`mt-4 bg-green-500/20 text-green-300 rounded-full px-4 py-2 text-sm font-medium transition-all duration-500 delay-700 ${
            showContent ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
          }`}
        >
          📅 {patterns.busiestDay} Warrior
        </div>
      )}
    </div>
  );
};
