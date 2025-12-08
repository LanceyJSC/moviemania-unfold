import { useState, useEffect } from 'react';
import { Trophy, Star, Sparkles, X } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AchievementUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  achievement: {
    title: string;
    description: string;
    xpReward?: number;
    rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  } | null;
}

const rarityColors = {
  common: 'from-gray-500 to-gray-600',
  rare: 'from-blue-500 to-blue-600',
  epic: 'from-purple-500 to-purple-600',
  legendary: 'from-yellow-500 to-amber-600'
};

const rarityGlows = {
  common: 'shadow-gray-500/50',
  rare: 'shadow-blue-500/50',
  epic: 'shadow-purple-500/50',
  legendary: 'shadow-yellow-500/50'
};

export const AchievementUnlockModal = ({ isOpen, onClose, achievement }: AchievementUnlockModalProps) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const [animationStage, setAnimationStage] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setAnimationStage(0);
      setShowConfetti(true);

      const timers = [
        setTimeout(() => setAnimationStage(1), 100),
        setTimeout(() => setAnimationStage(2), 500),
        setTimeout(() => setAnimationStage(3), 1000),
      ];

      return () => timers.forEach(clearTimeout);
    }
  }, [isOpen]);

  if (!achievement) return null;

  const rarity = achievement.rarity || 'common';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-background/95 backdrop-blur-xl border-none max-w-sm mx-auto overflow-hidden">
        {/* Confetti Effect */}
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {Array.from({ length: 50 }).map((_, i) => (
              <div
                key={i}
                className="absolute animate-confetti"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 0.5}s`,
                  animationDuration: `${2 + Math.random() * 2}s`,
                }}
              >
                <Sparkles 
                  className="h-3 w-3" 
                  style={{ 
                    color: ['#FFD700', '#FF6B6B', '#4ECDC4', '#A855F7', '#3B82F6'][Math.floor(Math.random() * 5)] 
                  }} 
                />
              </div>
            ))}
          </div>
        )}

        <div className="relative text-center py-8 px-4">
          {/* Close Button */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute top-2 right-2 z-10"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>

          {/* Achievement Icon */}
          <div
            className={cn(
              'relative mx-auto w-24 h-24 rounded-full flex items-center justify-center',
              'bg-gradient-to-br shadow-2xl transition-all duration-500',
              rarityColors[rarity],
              rarityGlows[rarity],
              animationStage >= 1 ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
            )}
          >
            <Trophy className="h-12 w-12 text-white animate-pulse" />
            
            {/* Glow rings */}
            <div className={cn(
              'absolute inset-0 rounded-full border-4 border-white/30 animate-ping',
              animationStage < 2 && 'opacity-0'
            )} />
            <div className={cn(
              'absolute -inset-2 rounded-full border-2 border-white/20 animate-pulse',
              animationStage < 2 && 'opacity-0'
            )} />
          </div>

          {/* Achievement Unlocked Text */}
          <div className={cn(
            'mt-6 transition-all duration-500',
            animationStage >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          )}>
            <p className="text-xs uppercase tracking-widest text-primary font-semibold mb-2">
              Achievement Unlocked!
            </p>
            <h2 className="text-2xl font-bold">{achievement.title}</h2>
            <p className="text-muted-foreground mt-2">{achievement.description}</p>
          </div>

          {/* XP Reward */}
          {achievement.xpReward && (
            <div className={cn(
              'mt-6 inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full transition-all duration-500',
              animationStage >= 3 ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
            )}>
              <Star className="h-5 w-5 text-yellow-500 fill-current" />
              <span className="font-bold text-primary">+{achievement.xpReward} XP</span>
            </div>
          )}

          {/* Rarity Badge */}
          <div className={cn(
            'mt-4 transition-all duration-500',
            animationStage >= 3 ? 'opacity-100' : 'opacity-0'
          )}>
            <span className={cn(
              'inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-white',
              `bg-gradient-to-r ${rarityColors[rarity]}`
            )}>
              {rarity}
            </span>
          </div>

          {/* Continue Button */}
          <Button
            className={cn(
              'mt-8 w-full transition-all duration-500',
              animationStage >= 3 ? 'opacity-100' : 'opacity-0'
            )}
            onClick={onClose}
          >
            Awesome!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
