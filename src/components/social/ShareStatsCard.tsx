import { useState, useRef } from 'react';
import { Share2, Download, Copy, Check, Film, Star, Trophy, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ShareStatsCardProps {
  username: string;
  stats: {
    moviesWatched: number;
    totalRatings: number;
    averageRating: number;
    level: number;
    xp: number;
    achievements: number;
    watchHours: number;
  };
}

export const ShareStatsCard = ({ username, stats }: ShareStatsCardProps) => {
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const generateShareText = () => {
    return `🎬 My CineScope Stats

📊 ${stats.moviesWatched} movies watched
⭐ ${stats.averageRating.toFixed(1)} avg rating
🏆 Level ${stats.level} (${stats.xp} XP)
🎖️ ${stats.achievements} achievements
⏱️ ${stats.watchHours}+ hours watched

Check out my profile on CineScope!`;
  };

  const handleCopyStats = async () => {
    try {
      await navigator.clipboard.writeText(generateShareText());
      setCopied(true);
      toast.success('Stats copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${username}'s Movie Stats`,
          text: generateShareText(),
          url: window.location.href
        });
      } catch (error) {
        // User cancelled or error
        handleCopyStats();
      }
    } else {
      handleCopyStats();
    }
  };

  return (
    <Card className="bg-gradient-to-br from-card via-card to-primary/5 border-primary/20 overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            Share Your Stats
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats Preview Card */}
        <div 
          ref={cardRef}
          className="bg-gradient-to-br from-background to-muted p-6 rounded-xl border border-border/50"
        >
          <div className="text-center mb-4">
            <h3 className="text-lg font-bold text-primary">{username}'s Year in Movies</h3>
            <p className="text-xs text-muted-foreground">CineScope Stats</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-card/50 rounded-lg">
              <Film className="h-6 w-6 text-primary mx-auto mb-1" />
              <div className="text-2xl font-bold">{stats.moviesWatched}</div>
              <div className="text-xs text-muted-foreground">Movies Watched</div>
            </div>

            <div className="text-center p-3 bg-card/50 rounded-lg">
              <Star className="h-6 w-6 text-yellow-500 mx-auto mb-1" />
              <div className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</div>
              <div className="text-xs text-muted-foreground">Avg Rating</div>
            </div>

            <div className="text-center p-3 bg-card/50 rounded-lg">
              <Trophy className="h-6 w-6 text-purple-500 mx-auto mb-1" />
              <div className="text-2xl font-bold">Level {stats.level}</div>
              <div className="text-xs text-muted-foreground">{stats.xp} XP</div>
            </div>

            <div className="text-center p-3 bg-card/50 rounded-lg">
              <Clock className="h-6 w-6 text-green-500 mx-auto mb-1" />
              <div className="text-2xl font-bold">{stats.watchHours}h</div>
              <div className="text-xs text-muted-foreground">Watch Time</div>
            </div>
          </div>

          <div className="mt-4 text-center">
            <p className="text-xs text-muted-foreground">🎖️ {stats.achievements} achievements unlocked</p>
          </div>
        </div>

        {/* Share Buttons */}
        <div className="flex gap-2">
          <Button className="flex-1" onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button variant="outline" onClick={handleCopyStats}>
            {copied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
