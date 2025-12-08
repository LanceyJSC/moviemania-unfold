import { useState } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import { Vote, Calendar, Trophy, User, Check, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface PollOption {
  id: string;
  movieId: number;
  movieTitle: string;
  moviePoster?: string;
  voteCount: number;
  hasVoted: boolean;
}

interface MovieNightPollCardProps {
  id: string;
  title: string;
  createdByProfile?: { username: string; avatar_url?: string };
  scheduledAt?: string;
  closesAt?: string;
  status: string;
  options: PollOption[];
  totalVotes: number;
  createdAt: string;
  onVote: (pollId: string, optionId: string) => void;
  onClose?: (pollId: string) => void;
  isCreator: boolean;
}

export const MovieNightPollCard = ({
  id,
  title,
  createdByProfile,
  scheduledAt,
  closesAt,
  status,
  options,
  totalVotes,
  createdAt,
  onVote,
  onClose,
  isCreator
}: MovieNightPollCardProps) => {
  const [voting, setVoting] = useState(false);
  const isOpen = status === 'open';
  const userVoted = options.some(o => o.hasVoted);
  const winningOption = options.reduce((prev, curr) => 
    curr.voteCount > prev.voteCount ? curr : prev
  , options[0]);

  const handleVote = async (optionId: string) => {
    setVoting(true);
    await onVote(id, optionId);
    setVoting(false);
  };

  return (
    <Card className={cn(
      'bg-card/50 backdrop-blur-sm border-border/50 overflow-hidden',
      !isOpen && 'opacity-80'
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Vote className="h-5 w-5 text-primary" />
              {title}
            </CardTitle>
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <Avatar className="h-5 w-5">
                <AvatarImage src={createdByProfile?.avatar_url} />
                <AvatarFallback className="text-xs">
                  <User className="h-3 w-3" />
                </AvatarFallback>
              </Avatar>
              <span>by {createdByProfile?.username}</span>
              <span>•</span>
              <span>{formatDistanceToNow(new Date(createdAt), { addSuffix: true })}</span>
            </div>
          </div>
          <Badge variant={isOpen ? 'default' : 'secondary'}>
            {isOpen ? 'Open' : 'Closed'}
          </Badge>
        </div>

        {(scheduledAt || closesAt) && (
          <div className="flex items-center gap-4 mt-3 text-sm">
            {scheduledAt && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Movie Night: {format(new Date(scheduledAt), 'MMM d, h:mm a')}</span>
              </div>
            )}
            {closesAt && isOpen && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Closes {formatDistanceToNow(new Date(closesAt), { addSuffix: true })}</span>
              </div>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        {options.map((option) => {
          const percentage = totalVotes > 0 ? (option.voteCount / totalVotes) * 100 : 0;
          const isWinner = !isOpen && option.id === winningOption?.id;

          return (
            <button
              key={option.id}
              onClick={() => isOpen && !voting && handleVote(option.id)}
              disabled={!isOpen || voting}
              className={cn(
                'w-full p-3 rounded-lg border transition-all text-left relative overflow-hidden',
                isOpen && 'hover:border-primary cursor-pointer',
                option.hasVoted && 'border-primary bg-primary/5',
                isWinner && 'border-yellow-500 bg-yellow-500/10',
                !isOpen && !isWinner && 'opacity-60'
              )}
            >
              <div className="relative z-10 flex items-center gap-3">
                {option.moviePoster && (
                  <img
                    src={`https://image.tmdb.org/t/p/w92${option.moviePoster}`}
                    alt={option.movieTitle}
                    className="w-10 h-14 object-cover rounded"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{option.movieTitle}</span>
                    {isWinner && <Trophy className="h-4 w-4 text-yellow-500" />}
                    {option.hasVoted && <Check className="h-4 w-4 text-primary" />}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                    <span>{option.voteCount} votes</span>
                    <span>({percentage.toFixed(0)}%)</span>
                  </div>
                </div>
              </div>

              {/* Progress bar background */}
              <div 
                className="absolute inset-0 bg-primary/10 transition-all"
                style={{ width: `${percentage}%` }}
              />
            </button>
          );
        })}

        <div className="flex items-center justify-between pt-2 text-sm">
          <span className="text-muted-foreground">{totalVotes} total votes</span>
          {isCreator && isOpen && onClose && (
            <Button variant="outline" size="sm" onClick={() => onClose(id)}>
              Close Poll
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
