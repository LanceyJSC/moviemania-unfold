import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, Star, Film, List, UserPlus, Eye } from "lucide-react";
import { useActivityFeed } from "@/hooks/useActivityFeed";
import { formatDistanceToNow } from "date-fns";
import { tmdbService } from "@/lib/tmdb";

interface ActivityFeedProps {
  userId?: string;
  limit?: number;
}

export const ActivityFeed = ({ userId, limit }: ActivityFeedProps) => {
  const { activities, loading } = useActivityFeed(userId);

  const displayActivities = limit ? activities.slice(0, limit) : activities;

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'watched':
        return <Eye className="h-4 w-4 text-green-500" />;
      case 'rated':
        return <Star className="h-4 w-4 text-yellow-500" />;
      case 'reviewed':
        return <Film className="h-4 w-4 text-blue-500" />;
      case 'liked':
        return <Heart className="h-4 w-4 text-red-500" />;
      case 'listed':
        return <List className="h-4 w-4 text-purple-500" />;
      case 'followed':
        return <UserPlus className="h-4 w-4 text-primary" />;
      default:
        return <Film className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getActivityText = (activity: any) => {
    switch (activity.activity_type) {
      case 'watched':
        return 'watched';
      case 'rated':
        return `rated ${activity.metadata?.rating ? `${activity.metadata.rating}/10` : ''}`;
      case 'reviewed':
        return 'reviewed';
      case 'liked':
        return 'liked a review of';
      case 'listed':
        return 'added to a list';
      case 'followed':
        return 'started following';
      default:
        return 'interacted with';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="p-4">
            <div className="flex items-start gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (displayActivities.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">No recent activity</p>
        <p className="text-sm text-muted-foreground mt-1">
          Start watching, rating, or reviewing movies to see activity here
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {displayActivities.map((activity) => (
        <Card key={activity.id} className="p-4 hover:bg-muted/50 transition-colors">
          <div className="flex items-start gap-3">
            <Link to={`/user/${activity.profile?.username || activity.user_id}`}>
              <Avatar className="h-10 w-10">
                <AvatarImage 
                  src={activity.profile?.avatar_url || undefined} 
                  alt={activity.profile?.username || 'User'} 
                />
                <AvatarFallback>
                  {activity.profile?.username?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </Link>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Link 
                  to={`/user/${activity.profile?.username || activity.user_id}`}
                  className="font-medium text-foreground hover:underline"
                >
                  {activity.profile?.username || 'User'}
                </Link>
                <span className="text-muted-foreground">
                  {getActivityText(activity)}
                </span>
                {activity.movie_title && (
                  <Link 
                    to={`/movie/${activity.movie_id}`}
                    className="font-medium text-foreground hover:underline truncate"
                  >
                    {activity.movie_title}
                  </Link>
                )}
              </div>
              
              <div className="flex items-center gap-2 mt-1">
                {getActivityIcon(activity.activity_type)}
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>

            {activity.movie_poster && (
              <Link to={`/movie/${activity.movie_id}`}>
                <img
                  src={tmdbService.getPosterUrl(activity.movie_poster, 'w300')}
                  alt={activity.movie_title || 'Movie poster'}
                  className="w-12 h-18 object-cover rounded"
                />
              </Link>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
};
