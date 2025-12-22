import React, { useEffect, useState } from 'react';
import { Film, Tv } from 'lucide-react';

interface TotalWatchedSlideProps {
  totalMovies: number;
  totalEpisodes: number;
}

export const TotalWatchedSlide: React.FC<TotalWatchedSlideProps> = ({
  totalMovies,
  totalEpisodes
}) => {
  const [movieCount, setMovieCount] = useState(0);
  const [episodeCount, setEpisodeCount] = useState(0);
  const [showCards, setShowCards] = useState(false);

  useEffect(() => {
    setShowCards(true);
    
    // Animate movie count
    const movieDuration = 1500;
    const movieStep = totalMovies / (movieDuration / 16);
    let currentMovies = 0;
    const movieInterval = setInterval(() => {
      currentMovies += movieStep;
      if (currentMovies >= totalMovies) {
        setMovieCount(totalMovies);
        clearInterval(movieInterval);
      } else {
        setMovieCount(Math.floor(currentMovies));
      }
    }, 16);

    // Animate episode count
    const episodeDuration = 1500;
    const episodeStep = totalEpisodes / (episodeDuration / 16);
    let currentEpisodes = 0;
    const episodeInterval = setInterval(() => {
      currentEpisodes += episodeStep;
      if (currentEpisodes >= totalEpisodes) {
        setEpisodeCount(totalEpisodes);
        clearInterval(episodeInterval);
      } else {
        setEpisodeCount(Math.floor(currentEpisodes));
      }
    }, 16);

    return () => {
      clearInterval(movieInterval);
      clearInterval(episodeInterval);
    };
  }, [totalMovies, totalEpisodes]);

  const total = totalMovies + totalEpisodes;

  return (
    <div className="flex flex-col items-center justify-center h-full px-8">
      {/* Main number */}
      <div className={`text-center mb-12 transition-all duration-700 ${showCards ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
        <p className="text-muted-foreground text-lg mb-2">You watched</p>
        <p className="font-cinematic text-8xl md:text-9xl text-cinema-gold">
          {total}
        </p>
        <p className="text-2xl text-foreground font-medium">
          {total === 1 ? 'title' : 'titles'}
        </p>
      </div>

      {/* Split cards */}
      <div className="grid grid-cols-2 gap-6 w-full max-w-sm">
        {/* Movies */}
        <div 
          className={`bg-gradient-to-br from-cinema-red/20 to-transparent rounded-2xl p-6 border border-cinema-red/30 text-center transition-all duration-500 delay-300 ${
            showCards ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <Film className="h-8 w-8 text-cinema-red mx-auto mb-3" />
          <p className="font-cinematic text-4xl text-foreground mb-1">
            {movieCount}
          </p>
          <p className="text-muted-foreground text-sm">Movies</p>
        </div>

        {/* Episodes */}
        <div 
          className={`bg-gradient-to-br from-blue-500/20 to-transparent rounded-2xl p-6 border border-blue-500/30 text-center transition-all duration-500 delay-500 ${
            showCards ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <Tv className="h-8 w-8 text-blue-500 mx-auto mb-3" />
          <p className="font-cinematic text-4xl text-foreground mb-1">
            {episodeCount}
          </p>
          <p className="text-muted-foreground text-sm">Episodes</p>
        </div>
      </div>

      {/* Fun comparison */}
      {total > 5 && (
        <p 
          className={`text-muted-foreground text-center mt-8 text-sm transition-all duration-500 delay-700 ${
            showCards ? 'opacity-100' : 'opacity-0'
          }`}
        >
          That's more than most people watch! 🎬
        </p>
      )}
    </div>
  );
};
