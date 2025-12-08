import { formatDistanceToNow } from 'date-fns';
import { Target, Trophy, Zap, Film, Star, Users, Clock, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface Challenge {
  id: string;
  title: string;
  description?: string;
  challengeType: string;
  targetCount: number;
  xpReward: number;
  endsAt: string;
  userProgress: number;
  completed: boolean;
}

interface WeeklyChallengesCardProps {
  challenges: Challenge[];
  loading?: boolean;
}

const challengeIcons: Record<string, any> = {
  watch_movies: Film,
  rate_movies: Star,
  make_friends: Users
};

export const WeeklyChallengesCard = ({ challenges, loading }: WeeklyChallengesCardProps) => {
  const completedCount = challenges.filter(c => c.completed).length;
  const totalXP = challenges.reduce((sum, c) => c.completed ? sum + c.xpReward : sum, 0);

  if (loading) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Weekly Challenges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-muted rounded-lg" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Weekly Challenges
          </CardTitle>
          <div className="flex items-center gap-2 text-sm">
            <Badge variant="outline" className="flex items-center gap-1">
              <Trophy className="h-3 w-3" />
              {completedCount}/{challenges.length}
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Zap className="h-3 w-3 text-yellow-500" />
              {totalXP} XP
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {challenges.length === 0 ? (
          <div className="text-center py-8">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No active challenges</p>
            <p className="text-sm text-muted-foreground mt-1">Check back next week!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {challenges.map((challenge) => {
              const Icon = challengeIcons[challenge.challengeType] || Target;
              const progressPercent = (challenge.userProgress / challenge.targetCount) * 100;

              return (
                <div
                  key={challenge.id}
                  className={cn(
                    'p-4 rounded-lg border transition-all',
                    challenge.completed
                      ? 'bg-primary/5 border-primary/30'
                      : 'bg-muted/20 border-border/50'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      'p-2 rounded-full',
                      challenge.completed ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    )}>
                      {challenge.completed ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <Icon className="h-5 w-5" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className={cn(
                          'font-medium',
                          challenge.completed && 'text-primary'
                        )}>
                          {challenge.title}
                        </h4>
                        <Badge variant="outline" className="text-xs">
                          +{challenge.xpReward} XP
                        </Badge>
                      </div>

                      {challenge.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {challenge.description}
                        </p>
                      )}

                      <div className="mt-3">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-muted-foreground">
                            {challenge.userProgress}/{challenge.targetCount}
                          </span>
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(challenge.endsAt), { addSuffix: true })}
                          </span>
                        </div>
                        <Progress 
                          value={Math.min(progressPercent, 100)} 
                          className={cn('h-2', challenge.completed && 'bg-primary/20')}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
