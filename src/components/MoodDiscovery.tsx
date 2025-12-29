import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Crown } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useSubscription } from '@/hooks/useSubscription';
import { ProUpgradeModal } from './ProUpgradeModal';
import { cn } from '@/lib/utils';

interface Mood {
  id: string;
  label: string;
  emoji: string;
  genres: number[];
  keywords: string;
  gradient: string;
  shadowColor: string;
}

const MOODS: Mood[] = [
  {
    id: 'thrilling',
    label: 'Thrilling',
    emoji: '⚡',
    genres: [28, 53, 80],
    keywords: 'adrenaline, suspense, edge of seat',
    gradient: 'from-orange-500 to-red-600',
    shadowColor: 'shadow-orange-500/30'
  },
  {
    id: 'heartwarming',
    label: 'Heartwarming',
    emoji: '💖',
    genres: [10749, 18, 10751],
    keywords: 'emotional, touching, feel-good',
    gradient: 'from-pink-500 to-rose-600',
    shadowColor: 'shadow-pink-500/30'
  },
  {
    id: 'mind-bending',
    label: 'Mind-bending',
    emoji: '🧠',
    genres: [878, 9648, 53],
    keywords: 'twist, cerebral, thought-provoking',
    gradient: 'from-purple-500 to-indigo-600',
    shadowColor: 'shadow-purple-500/30'
  },
  {
    id: 'feel-good',
    label: 'Feel-good',
    emoji: '😊',
    genres: [35, 10751, 16],
    keywords: 'uplifting, happy, fun',
    gradient: 'from-yellow-400 to-orange-500',
    shadowColor: 'shadow-yellow-500/30'
  },
  {
    id: 'dark',
    label: 'Dark & Gritty',
    emoji: '🌙',
    genres: [27, 80, 53],
    keywords: 'intense, noir, atmospheric',
    gradient: 'from-slate-600 to-zinc-800',
    shadowColor: 'shadow-slate-500/30'
  },
  {
    id: 'light',
    label: 'Light & Fun',
    emoji: '🪶',
    genres: [35, 10402, 10749],
    keywords: 'easy watch, entertaining, casual',
    gradient: 'from-cyan-400 to-blue-500',
    shadowColor: 'shadow-cyan-500/30'
  }
];

interface MoodDiscoveryProps {
  variant?: 'pills' | 'cards';
  className?: string;
}

export const MoodDiscovery = ({ variant = 'pills', className }: MoodDiscoveryProps) => {
  const navigate = useNavigate();
  const { isProUser } = useSubscription();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleMoodClick = (mood: Mood) => {
    if (!isProUser) {
      setShowUpgradeModal(true);
      return;
    }

    setSelectedMood(mood.id);
    const genreParams = mood.genres.join(',');
    navigate(`/movies?genres=${genreParams}&mood=${mood.id}`);
  };

  const clearMood = () => {
    setSelectedMood(null);
  };

  // Pro locked state
  if (!isProUser) {
    return (
      <>
        <div className={cn("space-y-2", className)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">Discover by Mood</h3>
              <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-[10px] px-1.5 py-0">
                <Crown className="w-2.5 h-2.5 mr-0.5" />
                PRO
              </Badge>
            </div>
          </div>
          
          <div className="relative">
            <div className="flex gap-2 overflow-hidden blur-sm opacity-40 pointer-events-none">
              {MOODS.map((mood) => (
                <div
                  key={mood.id}
                  className={cn(
                    "flex-shrink-0 w-20 h-20 rounded-xl bg-gradient-to-br flex flex-col items-center justify-center gap-1",
                    mood.gradient
                  )}
                >
                  <span className="text-2xl">{mood.emoji}</span>
                  <span className="text-[10px] font-medium text-white/90">{mood.label}</span>
                </div>
              ))}
            </div>
            
            <div className="absolute inset-0 flex items-center justify-center">
              <Button
                onClick={() => setShowUpgradeModal(true)}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg"
                size="sm"
              >
                <Lock className="w-3.5 h-3.5 mr-1.5" />
                Unlock Mood Filter
              </Button>
            </div>
          </div>
        </div>

        <ProUpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          feature="Mood Discovery"
          description="Discover movies that match your current mood with our intelligent mood-based recommendations."
        />
      </>
    );
  }

  return (
    <>
      <div className={cn("space-y-2", className)}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Discover by Mood</h3>
          {selectedMood && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearMood}
              className="text-xs text-muted-foreground hover:text-foreground h-6 px-2"
            >
              Clear
            </Button>
          )}
        </div>
        
        {/* Horizontal scrolling mood cards */}
        <div 
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide snap-x snap-mandatory -mx-4 px-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {MOODS.map((mood) => {
            const isSelected = selectedMood === mood.id;
            return (
              <button
                key={mood.id}
                onClick={() => handleMoodClick(mood)}
                className={cn(
                  "flex-shrink-0 w-20 h-20 rounded-xl bg-gradient-to-br flex flex-col items-center justify-center gap-1 transition-all duration-200 snap-start touch-manipulation",
                  mood.gradient,
                  isSelected 
                    ? `ring-2 ring-white ring-offset-2 ring-offset-background scale-105 shadow-lg ${mood.shadowColor}` 
                    : "hover:scale-105 active:scale-95"
                )}
              >
                <span className="text-2xl drop-shadow-md">{mood.emoji}</span>
                <span className="text-[10px] font-medium text-white/90 drop-shadow-sm">{mood.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <ProUpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        feature="Mood Discovery"
        description="Discover movies that match your current mood with our intelligent mood-based recommendations."
      />
    </>
  );
};
