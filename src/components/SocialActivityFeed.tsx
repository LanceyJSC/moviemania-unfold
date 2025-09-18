import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { 
  Heart, 
  Star, 
  List, 
  Eye, 
  MessageCircle, 
  Film,
  User,
  Users,
  RefreshCw 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useSocialActivity } from '@/hooks/useSocialActivity';
import { Link } from 'react-router-dom';

const activityIcons = {
  watched: Film,
  liked: Heart,
  rated: Star,
  added_to_watchlist: List,
  reviewed: MessageCircle,
};

const activityColors = {
  watched: 'text-green-500',
  liked: 'text-red-500',
  rated: 'text-yellow-500',
  added_to_watchlist: 'text-blue-500',
  reviewed: 'text-purple-500',
};

const activityLabels = {
  watched: 'watched',
  liked: 'liked',
  rated: 'rated',
  added_to_watchlist: 'added to watchlist',
  reviewed: 'reviewed',
};

export const SocialActivityFeed = () => {
  const { activities, loading, refetch } = useSocialActivity();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Friend Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-4 bg-muted/20 rounded-lg animate-pulse">
                <div className="w-10 h-10 bg-muted rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5 text-primary" />
          Friend Activity
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="h-8 px-3"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-2">No friend activity yet</p>
            <p className="text-sm text-muted-foreground">
              Connect with friends to see their movie activities here!
            </p>
            <Link to="/social">
              <Button className="mt-4" size="sm">
                Find Friends
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {activities.map((activity) => {
              const Icon = activityIcons[activity.activity_type];
              const colorClass = activityColors[activity.activity_type];
              const label = activityLabels[activity.activity_type];

              return (
                <div key={activity.id} className="flex items-start space-x-4 p-4 bg-muted/20 rounded-lg hover:bg-muted/30 transition-colors">
                  <Avatar className="h-10 w-10">
                    <AvatarImage 
                      src={activity.user_profile?.avatar_url} 
                      alt={activity.user_profile?.username} 
                    />
                    <AvatarFallback>
                      <User className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-foreground truncate">
                        {activity.user_profile?.full_name || activity.user_profile?.username}
                      </p>
                      <Icon className={`h-4 w-4 ${colorClass}`} />
                      <span className="text-sm text-muted-foreground">{label}</span>
                    </div>
                    
                    <Link to={`/movie/${activity.movie_id}`}>
                      <p className="text-sm font-medium text-primary hover:underline cursor-pointer mb-2">
                        {activity.movie_title}
                      </p>
                    </Link>

                    {/* Show rating if it's a rating activity */}
                    {activity.activity_type === 'rated' && activity.activity_data?.rating && (
                      <div className="flex items-center gap-1 mb-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${
                              i < activity.activity_data.rating
                                ? 'text-yellow-500 fill-current'
                                : 'text-muted-foreground'
                            }`}
                          />
                        ))}
                        <span className="text-xs text-muted-foreground ml-1">
                          {activity.activity_data.rating}/5
                        </span>
                      </div>
                    )}

                    {/* Show review excerpt if it's a review activity */}
                    {activity.activity_type === 'reviewed' && activity.activity_data?.review && (
                      <p className="text-xs text-muted-foreground italic line-clamp-2 mb-2">
                        "{activity.activity_data.review}"
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                      </p>
                      
                      {activity.activity_type === 'watched' && (
                        <Badge variant="secondary" className="text-xs">
                          <Film className="h-3 w-3 mr-1" />
                          Completed
                        </Badge>
                      )}
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