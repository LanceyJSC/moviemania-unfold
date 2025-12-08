import { useState } from 'react';
import { Heart, Star, Film, ChevronDown, ChevronUp, Percent } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FriendCompatibilityCardProps {
  friendId: string;
  profile: {
    username: string;
    full_name?: string;
    avatar_url?: string;
  };
  compatibilityScore: number;
  commonMovies: number;
  sharedRatings: { movieId: number; movieTitle: string; userRating: number; friendRating: number }[];
}

export const FriendCompatibilityCard = ({
  profile,
  compatibilityScore,
  commonMovies,
  sharedRatings
}: FriendCompatibilityCardProps) => {
  const [expanded, setExpanded] = useState(false);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Perfect Match!';
    if (score >= 60) return 'Great Match';
    if (score >= 40) return 'Good Match';
    return 'Different Tastes';
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50 overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14 border-2 border-primary/30">
            <AvatarImage src={profile.avatar_url} alt={profile.username} />
            <AvatarFallback className="bg-primary/20 text-primary">
              {profile.username?.charAt(0).toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate">
              {profile.full_name || profile.username}
            </h3>
            <p className="text-sm text-muted-foreground">@{profile.username}</p>
          </div>

          <div className="text-center">
            <div className={cn('text-2xl font-bold flex items-center gap-1', getScoreColor(compatibilityScore))}>
              {compatibilityScore}
              <Percent className="h-4 w-4" />
            </div>
            <p className="text-xs text-muted-foreground">Match</p>
          </div>
        </div>

        <div className="mt-4">
          <Progress value={compatibilityScore} className="h-2" />
          <p className={cn('text-sm mt-2 text-center font-medium', getScoreColor(compatibilityScore))}>
            {getScoreLabel(compatibilityScore)}
          </p>
        </div>

        <div className="flex items-center justify-center gap-4 mt-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Film className="h-4 w-4" />
            <span>{commonMovies} shared</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4" />
            <span>{sharedRatings.length} rated together</span>
          </div>
        </div>

        {sharedRatings.length > 0 && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-4"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-2" />
                  Hide Comparisons
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-2" />
                  Compare Ratings
                </>
              )}
            </Button>

            {expanded && (
              <div className="mt-4 space-y-3">
                {sharedRatings.map((rating) => (
                  <div key={rating.movieId} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <span className="text-sm font-medium truncate flex-1 mr-4">{rating.movieTitle}</span>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-center">
                        <span className="text-muted-foreground">You</span>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-500 fill-current" />
                          <span className="font-semibold">{rating.userRating}</span>
                        </div>
                      </div>
                      <div className="text-center">
                        <span className="text-muted-foreground">Them</span>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-500 fill-current" />
                          <span className="font-semibold">{rating.friendRating}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
