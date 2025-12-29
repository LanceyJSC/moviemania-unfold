import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Zap, Heart, Brain, Smile, Moon, Feather,
  Lock
} from 'lucide-react';
import { Button } from './ui/button';
import { useSubscription } from '@/hooks/useSubscription';
import { ProUpgradeModal } from './ProUpgradeModal';
import { ProBadge } from './ProBadge';
import { cn } from '@/lib/utils';

interface Mood {
  id: string;
  label: string;
  icon: React.ReactNode;
  genres: number[];
  keywords: string;
  gradient: string;
}

const MOODS: Mood[] = [
  {
    id: 'thrilling',
    label: 'Thrilling',
    icon: <Zap className="h-4 w-4" />,
    genres: [28, 53, 80], // Action, Thriller, Crime
    keywords: 'adrenaline, suspense, edge of seat',
    gradient: 'from-red-500/20 to-orange-500/20'
  },
  {
    id: 'heartwarming',
    label: 'Heartwarming',
    icon: <Heart className="h-4 w-4" />,
    genres: [10749, 18, 10751], // Romance, Drama, Family
    keywords: 'emotional, touching, feel-good',
    gradient: 'from-pink-500/20 to-rose-500/20'
  },
  {
    id: 'mind-bending',
    label: 'Mind-bending',
    icon: <Brain className="h-4 w-4" />,
    genres: [878, 9648, 53], // Sci-Fi, Mystery, Thriller
    keywords: 'twist, cerebral, thought-provoking',
    gradient: 'from-purple-500/20 to-indigo-500/20'
  },
  {
    id: 'feel-good',
    label: 'Feel-good',
    icon: <Smile className="h-4 w-4" />,
    genres: [35, 10751, 16], // Comedy, Family, Animation
    keywords: 'uplifting, happy, fun',
    gradient: 'from-yellow-500/20 to-amber-500/20'
  },
  {
    id: 'dark',
    label: 'Dark & Gritty',
    icon: <Moon className="h-4 w-4" />,
    genres: [27, 80, 53], // Horror, Crime, Thriller
    keywords: 'intense, noir, atmospheric',
    gradient: 'from-slate-500/20 to-zinc-500/20'
  },
  {
    id: 'light',
    label: 'Light & Fun',
    icon: <Feather className="h-4 w-4" />,
    genres: [35, 10402, 10749], // Comedy, Music, Romance
    keywords: 'easy watch, entertaining, casual',
    gradient: 'from-sky-500/20 to-cyan-500/20'
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
    // Navigate to movies page with mood filter
    const genreParams = mood.genres.join(',');
    navigate(`/movies?genres=${genreParams}&mood=${mood.id}`);
  };

  if (variant === 'cards') {
    return (
      <>
        <div className={cn("space-y-3", className)}>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-foreground">What's Your Mood?</h3>
            <ProBadge size="sm" />
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {MOODS.map((mood) => (
              <button
                key={mood.id}
                onClick={() => handleMoodClick(mood)}
                className={cn(
                  "relative p-4 rounded-xl border border-border/50 bg-gradient-to-br transition-all",
                  mood.gradient,
                  selectedMood === mood.id 
                    ? "border-cinema-red ring-2 ring-cinema-red/20" 
                    : "hover:border-foreground/20",
                  !isProUser && "opacity-70"
                )}
              >
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className="p-2 rounded-full bg-background/50">
                    {mood.icon}
                  </div>
                  <span className="font-medium text-sm">{mood.label}</span>
                </div>
                {!isProUser && (
                  <Lock className="absolute top-2 right-2 h-3 w-3 text-muted-foreground" />
                )}
              </button>
            ))}
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
      <div className={cn("flex gap-2 flex-wrap", className)}>
        {MOODS.map((mood) => (
          <Button
            key={mood.id}
            variant="outline"
            size="sm"
            onClick={() => handleMoodClick(mood)}
            className={cn(
              "gap-1.5 border-border/50",
              selectedMood === mood.id && "border-cinema-red bg-cinema-red/10",
              !isProUser && "opacity-70"
            )}
          >
            {mood.icon}
            {mood.label}
            {!isProUser && <Lock className="h-3 w-3 ml-1" />}
          </Button>
        ))}
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
