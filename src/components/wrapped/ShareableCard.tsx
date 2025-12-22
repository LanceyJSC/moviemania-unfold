import React, { useRef, useState } from 'react';
import { Share2, Download, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WrappedData, WrappedPeriod } from '@/hooks/useWrappedData';
import { toast } from '@/hooks/use-toast';

interface ShareableCardProps {
  data: WrappedData;
}

const periodLabels: Record<WrappedPeriod, string> = {
  'today': 'Daily',
  'week': 'Weekly',
  'month': 'Monthly',
  'all-time': 'All Time'
};

export const ShareableCard: React.FC<ShareableCardProps> = ({ data }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const shareText = `🎬 My SceneBurn ${periodLabels[data.period]} Wrapped!\n\n` +
      `📽️ ${data.totalMovies} movies • ${data.totalEpisodes} episodes\n` +
      `⏱️ ${data.totalHours} hours watched\n` +
      `🔥 ${data.averageRating}/5 average rating\n` +
      `${data.topGenre ? `🎭 ${data.topGenre.name} lover` : ''}\n\n` +
      `#SceneBurnWrapped`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My SceneBurn Wrapped',
          text: shareText
        });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      toast({
        title: "Copied to clipboard!",
        description: "Share your wrapped on social media"
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full px-4">
      {/* Card */}
      <div 
        ref={cardRef}
        className="w-full max-w-sm bg-gradient-to-br from-cinema-red via-background to-cinema-gold/20 rounded-3xl p-6 shadow-2xl border border-cinema-gold/30 relative overflow-hidden"
      >
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-cinema-gold/10 rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-cinema-red/20 rounded-full blur-xl" />
        
        {/* Content */}
        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-cinema-gold" />
              <span className="font-cinematic text-lg text-foreground">SCENEBURN</span>
            </div>
            <span className="text-cinema-gold text-sm font-medium">
              {periodLabels[data.period]} Wrapped
            </span>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-background/50 backdrop-blur-sm rounded-xl p-4 text-center">
              <p className="font-cinematic text-3xl text-cinema-red">{data.totalMovies}</p>
              <p className="text-xs text-muted-foreground">Movies</p>
            </div>
            <div className="bg-background/50 backdrop-blur-sm rounded-xl p-4 text-center">
              <p className="font-cinematic text-3xl text-blue-400">{data.totalEpisodes}</p>
              <p className="text-xs text-muted-foreground">Episodes</p>
            </div>
            <div className="bg-background/50 backdrop-blur-sm rounded-xl p-4 text-center">
              <p className="font-cinematic text-3xl text-cinema-gold">{data.totalHours}</p>
              <p className="text-xs text-muted-foreground">Hours</p>
            </div>
            <div className="bg-background/50 backdrop-blur-sm rounded-xl p-4 text-center">
              <p className="font-cinematic text-3xl text-cinema-red">{data.averageRating}<span className="text-lg text-muted-foreground">/5</span></p>
              <p className="text-xs text-muted-foreground">Avg 🔥</p>
            </div>
          </div>

          {/* Top content */}
          {data.topMovie && (
            <div className="flex items-center gap-3 bg-background/30 rounded-xl p-3 mb-4">
              {data.topMovie.poster && (
                <img 
                  src={`https://image.tmdb.org/t/p/w92${data.topMovie.poster}`}
                  alt={data.topMovie.title}
                  className="w-12 h-16 rounded-lg object-cover"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-cinema-gold mb-1">Top Movie</p>
                <p className="text-sm font-medium text-foreground line-clamp-2">
                  {data.topMovie.title}
                </p>
              </div>
            </div>
          )}

          {/* Genre badge */}
          {data.topGenre && (
            <div className="text-center">
              <span className="inline-block bg-cinema-gold/20 text-cinema-gold rounded-full px-4 py-1 text-sm font-medium">
                🎭 {data.topGenre.name} Lover
              </span>
            </div>
          )}

          {/* Member since (for all-time) */}
          {data.period === 'all-time' && data.daysMember > 0 && (
            <p className="text-center text-muted-foreground text-xs mt-4">
              Member for {data.daysMember} days
            </p>
          )}
        </div>
      </div>

      {/* Share button */}
      <Button 
        onClick={handleShare}
        className="mt-6 bg-cinema-gold hover:bg-cinema-gold/80 text-background font-medium rounded-full px-8"
        size="lg"
      >
        {copied ? (
          <>
            <Check className="h-5 w-5 mr-2" />
            Copied!
          </>
        ) : (
          <>
            <Share2 className="h-5 w-5 mr-2" />
            Share Your Wrapped
          </>
        )}
      </Button>

      <p className="text-muted-foreground/50 text-xs mt-4">
        #SceneBurnWrapped
      </p>
    </div>
  );
};
