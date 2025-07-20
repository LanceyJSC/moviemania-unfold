import { useEnhancedUserState } from '@/hooks/useEnhancedUserState';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Play, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

export const ContinueWatching = () => {
  const { getContinueWatching, isLoading } = useEnhancedUserState();
  const navigate = useNavigate();
  const continueWatching = getContinueWatching();

  if (isLoading || continueWatching.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Continue Watching</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {continueWatching.map((item) => (
          <Card 
            key={`${item.movie_id}-${item.season_number}-${item.episode_number}`}
            className="group cursor-pointer hover:shadow-lg transition-all duration-200"
            onClick={() => {
              if (item.movie_type === 'tv') {
                navigate(`/tv/${item.movie_id}`);
              } else {
                navigate(`/movie/${item.movie_id}`);
              }
            }}
          >
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm truncate">
                      {item.movie_title}
                    </h3>
                    {item.season_number && item.episode_number && (
                      <p className="text-xs text-muted-foreground">
                        S{item.season_number}E{item.episode_number}
                      </p>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {item.progress_percent}% complete
                    </span>
                    <span className="text-muted-foreground">
                      {new Date(item.last_watched).toLocaleDateString()}
                    </span>
                  </div>
                  <Progress value={item.progress_percent} className="h-2" />
                </div>

                <Button 
                  size="sm" 
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Handle continue watching action
                  }}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};