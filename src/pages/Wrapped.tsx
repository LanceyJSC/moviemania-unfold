import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pause, Play, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useWrappedData, WrappedPeriod } from '@/hooks/useWrappedData';
import { WrappedProgress } from '@/components/wrapped/WrappedProgress';
import { IntroSlide } from '@/components/wrapped/IntroSlide';
import { TotalWatchedSlide } from '@/components/wrapped/TotalWatchedSlide';
import { HoursWatchedSlide } from '@/components/wrapped/HoursWatchedSlide';
import { TopMovieSlide } from '@/components/wrapped/TopMovieSlide';
import { TopTVSlide } from '@/components/wrapped/TopTVSlide';
import { TopActorsSlide } from '@/components/wrapped/TopActorsSlide';
import { TopDirectorsSlide } from '@/components/wrapped/TopDirectorsSlide';
import { TopGenreSlide } from '@/components/wrapped/TopGenreSlide';
import { ViewingPatternsSlide } from '@/components/wrapped/ViewingPatternsSlide';
import { FunFactsSlide } from '@/components/wrapped/FunFactsSlide';
import { RatingSlide } from '@/components/wrapped/RatingSlide';
import { ShareableCard } from '@/components/wrapped/ShareableCard';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const periods: { value: WrappedPeriod; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'all-time', label: 'All Time' }
];

const gradients: Record<number, string> = {
  0: 'from-cinema-red/40 via-background to-background', // Intro
  1: 'from-cinema-gold/30 via-background to-background', // Total watched
  2: 'from-blue-600/30 via-background to-background', // Hours
  3: 'from-cinema-red/40 via-background to-cinema-gold/20', // Top movie
  4: 'from-blue-500/30 via-background to-purple-500/20', // Top TV
  5: 'from-cinema-gold/40 via-background to-orange-500/20', // Top Actors
  6: 'from-purple-600/30 via-background to-background', // Top Directors
  7: 'from-pink-600/30 via-background to-background', // Genre
  8: 'from-green-600/30 via-background to-background', // Viewing Patterns
  9: 'from-yellow-600/30 via-background to-background', // Fun Facts
  10: 'from-cinema-gold/40 via-background to-background', // Rating
  11: 'from-cinema-red/30 via-cinema-gold/20 to-background' // Share
};

const Wrapped = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [period, setPeriod] = useState<WrappedPeriod>('all-time');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const { data, loading } = useWrappedData(period);

  const totalSlides = 12;

  // Auto-advance slides
  useEffect(() => {
    if (isPaused || loading) return;
    
    const timer = setInterval(() => {
      setCurrentSlide(prev => {
        if (prev >= totalSlides - 1) {
          setIsPaused(true);
          return prev;
        }
        return prev + 1;
      });
    }, 5000);

    return () => clearInterval(timer);
  }, [isPaused, loading, currentSlide]);

  // Reset slides when period changes
  useEffect(() => {
    setCurrentSlide(0);
    setIsPaused(false);
  }, [period]);

  // Navigation handlers
  const goNext = useCallback(() => {
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide(prev => prev + 1);
    }
  }, [currentSlide]);

  const goPrev = useCallback(() => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  }, [currentSlide]);

  const handleTap = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;

    if (x < width / 3) {
      goPrev();
    } else if (x > (width * 2) / 3) {
      goNext();
    } else {
      setIsPaused(prev => !prev);
    }
  }, [goNext, goPrev]);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cinema-gold mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your wrapped...</p>
          <p className="text-muted-foreground/50 text-sm mt-2">Fetching your movie journey...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center">
        <div className="text-center px-8">
          <p className="text-xl text-muted-foreground mb-4">No data available</p>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>
    );
  }

  const renderSlide = () => {
    switch (currentSlide) {
      case 0:
        return (
          <IntroSlide 
            period={period} 
            memberSince={data.memberSince}
            daysMember={data.daysMember}
          />
        );
      case 1:
        return (
          <TotalWatchedSlide 
            totalMovies={data.totalMovies}
            totalEpisodes={data.totalEpisodes}
          />
        );
      case 2:
        return <HoursWatchedSlide totalHours={data.totalHours} />;
      case 3:
        return <TopMovieSlide movie={data.topMovie} />;
      case 4:
        return <TopTVSlide tvShow={data.topTVShow} />;
      case 5:
        return <TopActorsSlide actors={data.topActors} />;
      case 6:
        return <TopDirectorsSlide directors={data.topDirectors} />;
      case 7:
        return (
          <TopGenreSlide 
            topGenre={data.topGenre}
            genres={data.genres}
          />
        );
      case 8:
        return (
          <ViewingPatternsSlide 
            patterns={data.viewingPatterns}
            totalMovies={data.totalMovies}
            totalEpisodes={data.totalEpisodes}
          />
        );
      case 9:
        return (
          <FunFactsSlide 
            facts={data.funFacts}
            totalHours={data.totalHours}
          />
        );
      case 10:
        return (
          <RatingSlide 
            averageRating={data.averageRating}
            totalRatings={data.totalRatings}
            highestRatedMovie={data.highestRatedMovie}
          />
        );
      case 11:
        return <ShareableCard data={data} />;
      default:
        return null;
    }
  };

  return (
    <div 
      className={cn(
        "fixed inset-0 bg-gradient-to-b transition-all duration-700",
        gradients[currentSlide] || gradients[0]
      )}
    >
      {/* Top controls */}
      <div className="absolute top-0 left-0 right-0 z-50 pt-2">
        <WrappedProgress 
          totalSlides={totalSlides}
          currentSlide={currentSlide}
          isPaused={isPaused}
        />
        
        <div className="flex items-center justify-between px-4 py-3">
          {/* Close button - larger and more prominent */}
          <button 
            onClick={() => navigate('/profile')}
            className="p-3 rounded-full bg-background/40 backdrop-blur-md hover:bg-background/60 transition-colors shadow-lg border border-foreground/10"
          >
            <X className="h-6 w-6 text-foreground" />
          </button>

          {/* Period selector */}
          <div className="flex gap-1 bg-background/20 backdrop-blur-sm rounded-full p-1">
            {periods.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                  period === p.value 
                    ? p.value === 'all-time'
                      ? "bg-cinema-gold text-background"
                      : "bg-foreground text-background"
                    : "text-foreground/70 hover:text-foreground"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Pause/Play button */}
          <button 
            onClick={() => setIsPaused(prev => !prev)}
            className="p-2 rounded-full bg-background/20 backdrop-blur-sm hover:bg-background/40 transition-colors"
          >
            {isPaused ? (
              <Play className="h-5 w-5 text-foreground" />
            ) : (
              <Pause className="h-5 w-5 text-foreground" />
            )}
          </button>
        </div>
      </div>

      {/* Main content area - tappable */}
      <div 
        className="h-full pt-24 pb-8 cursor-pointer"
        onClick={handleTap}
      >
        {renderSlide()}
      </div>

      {/* Navigation hint */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-8 text-muted-foreground/30 text-xs pointer-events-none">
        <span>← Prev</span>
        <span>Tap to pause</span>
        <span>Next →</span>
      </div>
    </div>
  );
};

export default Wrapped;
