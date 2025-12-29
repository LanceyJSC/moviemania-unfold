import { Flame, Crown, Zap, Clock, Film, Tv, Sparkles, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { TasteProfile } from '@/hooks/useTasteProfile';
import { cn } from '@/lib/utils';

interface TasteProfileCardProps {
  profile: TasteProfile | null;
  loading: boolean;
  error: string | null;
  isProUser: boolean;
  onUpgradeClick?: () => void;
  compact?: boolean;
}

const RATING_STYLE_CONFIG = {
  generous: { label: 'Generous Critic', color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: '❤️' },
  balanced: { label: 'Balanced Reviewer', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: '⚖️' },
  tough: { label: 'Tough Critic', color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: '🔥' }
};

const VELOCITY_CONFIG = {
  binger: { label: 'Power Binger', icon: <Zap className="w-3 h-3" /> },
  moderate: { label: 'Steady Viewer', icon: <Film className="w-3 h-3" /> },
  savorer: { label: 'Slow Savorer', icon: <Clock className="w-3 h-3" /> }
};

export const TasteProfileCard = ({ 
  profile, 
  loading, 
  error, 
  isProUser, 
  onUpgradeClick,
  compact = false 
}: TasteProfileCardProps) => {
  
  // Loading state
  if (loading) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Locked state for non-Pro users
  if (!isProUser) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5" />
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="w-5 h-5 text-amber-400" />
            Your Taste Profile
            <Badge variant="outline" className="ml-auto bg-amber-500/10 text-amber-400 border-amber-500/30 text-xs">
              <Crown className="w-3 h-3 mr-1" />
              PRO
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* Blurred preview */}
            <div className="blur-sm opacity-50 pointer-events-none">
              <div className="flex flex-wrap gap-2 mb-4">
                {['Action', 'Drama', 'Thriller'].map(genre => (
                  <div key={genre} className="h-8 px-4 rounded-full bg-muted" />
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="h-12 rounded-lg bg-muted" />
                <div className="h-12 rounded-lg bg-muted" />
              </div>
            </div>
            
            {/* Unlock overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Lock className="w-8 h-8 text-amber-400 mb-2" />
              <p className="text-sm text-muted-foreground text-center mb-3">
                Unlock personalized insights from your ratings
              </p>
              <Button 
                onClick={onUpgradeClick}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                size="sm"
              >
                <Crown className="w-4 h-4 mr-2" />
                Upgrade to Pro
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error or no data state
  if (error || !profile) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="w-5 h-5 text-amber-400" />
            Your Taste Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            {error || 'Unable to generate profile'}
          </p>
        </CardContent>
      </Card>
    );
  }

  const styleConfig = RATING_STYLE_CONFIG[profile.ratingStyle];
  const velocityConfig = VELOCITY_CONFIG[profile.viewingVelocity];

  // Compact version for Profile page
  if (compact) {
    return (
      <Card className="bg-gradient-to-br from-amber-500/10 via-card/50 to-orange-500/10 backdrop-blur-sm border-amber-500/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span className="font-semibold">Taste Profile</span>
            <Badge variant="outline" className={cn("ml-auto text-xs", styleConfig.color)}>
              {styleConfig.icon} {styleConfig.label}
            </Badge>
          </div>
          
          {/* Genre DNA preview */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {profile.genreDNA.slice(0, 4).map((genre, i) => (
              <Badge 
                key={genre.genreId} 
                variant="secondary"
                className="text-xs"
                style={{ 
                  opacity: 1 - (i * 0.15),
                  background: `hsl(var(--primary) / ${0.3 - i * 0.05})`
                }}
              >
                {genre.genre} {genre.percentage}%
              </Badge>
            ))}
          </div>
          
          {/* Quick stats */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Flame className="w-3 h-3 text-amber-400" />
              {profile.avgRating.toFixed(1)} avg
            </span>
            <span className="flex items-center gap-1">
              {velocityConfig.icon}
              {velocityConfig.label}
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Full version for Stats page
  return (
    <Card className="bg-gradient-to-br from-amber-500/10 via-card/50 to-orange-500/10 backdrop-blur-sm border-amber-500/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" />
          Your Taste DNA
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Rating Style Badge */}
        <div className="flex items-center justify-between">
          <Badge variant="outline" className={cn("text-sm py-1 px-3", styleConfig.color)}>
            {styleConfig.icon} {styleConfig.label}
          </Badge>
          <span className="text-muted-foreground text-sm">
            {profile.totalRated} rated • {profile.avgRating.toFixed(1)} avg
          </span>
        </div>

        {/* Genre DNA Visualization */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Genre Breakdown</h4>
          <div className="space-y-2">
            {profile.genreDNA.map((genre) => (
              <div key={genre.genreId} className="flex items-center gap-3">
                <span className="text-sm w-20 truncate">{genre.genre}</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
                    style={{ width: `${genre.percentage}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-16 text-right">
                  {genre.percentage}% • {genre.avgRating}★
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Mood Signature */}
        {profile.moodSignature.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Mood Signature</h4>
            <div className="flex flex-wrap gap-2">
              {profile.moodSignature.map((mood) => (
                <Badge key={mood} variant="secondary" className="bg-primary/10">
                  {mood}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Era & Velocity */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground mb-1">Era Preference</p>
            <p className="font-medium">
              {profile.eraPreference[0]?.decade || 'Mixed'} Cinema
            </p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground mb-1">Viewing Pace</p>
            <p className="font-medium flex items-center gap-1">
              {velocityConfig.icon}
              {velocityConfig.label}
            </p>
          </div>
        </div>

        {/* Runtime Sweet Spot */}
        <div className="p-3 rounded-lg bg-muted/50">
          <p className="text-xs text-muted-foreground mb-1">Runtime Sweet Spot</p>
          <p className="font-medium">
            ~{profile.runtimePreference.sweetSpot} minutes
            <span className="text-muted-foreground text-sm ml-2">
              (range: {profile.runtimePreference.min}-{profile.runtimePreference.max}min)
            </span>
          </p>
        </div>

        {/* Guilty Pleasures */}
        {profile.guiltyPleasures.length > 0 && (
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <p className="text-xs text-amber-400 mb-1">🤫 Guilty Pleasures</p>
            <p className="text-sm">
              You secretly love <span className="font-medium">{profile.guiltyPleasures.join(' & ')}</span> — 
              you rate them higher than your watch frequency suggests!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
