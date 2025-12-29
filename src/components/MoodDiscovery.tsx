import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Zap, Heart, Brain, Smile, Moon, Feather,
  Lock, Crown
} from 'lucide-react';
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
}

const MOODS: Mood[] = [
  {
    id: 'thrilling',
    label: 'Thrilling',
    emoji: '⚡',
    genres: [28, 53, 80],
    keywords: 'adrenaline, suspense, edge of seat'
  },
  {
    id: 'heartwarming',
    label: 'Heartwarming',
    emoji: '💖',
    genres: [10749, 18, 10751],
    keywords: 'emotional, touching, feel-good'
  },
  {
    id: 'mind-bending',
    label: 'Mind-bending',
    emoji: '🧠',
    genres: [878, 9648, 53],
    keywords: 'twist, cerebral, thought-provoking'
  },
  {
    id: 'feel-good',
    label: 'Feel-good',
    emoji: '😊',
    genres: [35, 10751, 16],
    keywords: 'uplifting, happy, fun'
  },
  {
    id: 'dark',
    label: 'Dark & Gritty',
    emoji: '🌙',
    genres: [27, 80, 53],
    keywords: 'intense, noir, atmospheric'
  },
  {
    id: 'light',
    label: 'Light & Fun',
    emoji: '🪶',
    genres: [35, 10402, 10749],
    keywords: 'easy watch, entertaining, casual'
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

  // Pro locked state - matches InlineGenreFilter locked style
  if (!isProUser) {
    return (
      <>
        <div className={cn("space-y-3", className)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground">Discover by Mood</h3>
              <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-xs">
                <Crown className="w-3 h-3 mr-1" />
                PRO
              </Badge>
            </div>
          </div>
          
          <div className="relative">
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2 blur-sm opacity-50 pointer-events-none">
              {MOODS.map((mood) => (
                <Button
                  key={mood.id}
                  variant="outline"
                  size="sm"
                  className="h-auto py-2 px-3 rounded-xl bg-card/60 border-border/50"
                >
                  <span className="mr-1">{mood.emoji}</span>
                  <span className="text-xs truncate">{mood.label}</span>
                </Button>
              ))}
            </div>
            
            <div className="absolute inset-0 flex items-center justify-center">
              <Button
                onClick={() => setShowUpgradeModal(true)}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                size="sm"
              >
                <Lock className="w-4 h-4 mr-2" />
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
      <div className={cn("space-y-3", className)}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Discover by Mood</h3>
          {selectedMood && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearMood}
              className="text-xs text-muted-foreground hover:text-foreground h-7 px-2"
            >
              Clear
            </Button>
          )}
        </div>
        
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {MOODS.map((mood) => {
            const isSelected = selectedMood === mood.id;
            return (
              <Button
                key={mood.id}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                onClick={() => handleMoodClick(mood)}
                className={cn(
                  "h-auto py-2 px-3 rounded-xl transition-all duration-200 active:scale-95",
                  isSelected 
                    ? "bg-cinema-red text-white border-cinema-red shadow-md" 
                    : "bg-card/60 border-border/50 hover:bg-card/80 hover:border-primary/50"
                )}
              >
                <span className="mr-1">{mood.emoji}</span>
                <span className="text-xs truncate">{mood.label}</span>
              </Button>
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
