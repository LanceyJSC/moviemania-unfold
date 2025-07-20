import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { StarRating } from './StarRating';
import { Heart, MessageCircle, CheckCircle, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface Activity {
  id: string;
  user_id: string;
  activity_type: 'rating' | 'review' | 'watchlist_add' | 'completed';
  movie_id: number;
  movie_title: string;
  movie_type: 'movie' | 'tv';
  metadata?: any;
  created_at: string;
  profiles?: {
    username: string;
    avatar_url: string;
  };
}

export const ActivityFeed = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchActivities = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      // Get activities from followed users
      const { data, error } = await supabase
        .from('user_activities')
        .select(`
          *,
          profiles:user_id(username, avatar_url)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setActivities((data || []) as unknown as Activity[]);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [user]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'rating':
        return <StarRating rating={1} maxRating={1} size="sm" />;
      case 'review':
        return <MessageCircle className="h-4 w-4 text-blue-500" />;
      case 'watchlist_add':
        return <Plus className="h-4 w-4 text-green-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-purple-500" />;
      default:
        return <Heart className="h-4 w-4" />;
    }
  };

  const getActivityText = (activity: Activity) => {
    const username = activity.profiles?.username || 'Someone';
    const movieTitle = activity.movie_title;
    
    switch (activity.activity_type) {
      case 'rating':
        const rating = activity.metadata?.rating;
        return (
          <span>
            <strong>{username}</strong> rated{' '}
            <button
              onClick={() => navigate(activity.movie_type === 'tv' ? `/tv/${activity.movie_id}` : `/movie/${activity.movie_id}`)}
              className="font-medium text-primary hover:underline"
            >
              {movieTitle}
            </button>
            {rating && (
              <span className="ml-2">
                <StarRating rating={rating} size="sm" />
              </span>
            )}
          </span>
        );
      case 'review':
        return (
          <span>
            <strong>{username}</strong> reviewed{' '}
            <button
              onClick={() => navigate(activity.movie_type === 'tv' ? `/tv/${activity.movie_id}` : `/movie/${activity.movie_id}`)}
              className="font-medium text-primary hover:underline"
            >
              {movieTitle}
            </button>
          </span>
        );
      case 'watchlist_add':
        return (
          <span>
            <strong>{username}</strong> added{' '}
            <button
              onClick={() => navigate(activity.movie_type === 'tv' ? `/tv/${activity.movie_id}` : `/movie/${activity.movie_id}`)}
              className="font-medium text-primary hover:underline"
            >
              {movieTitle}
            </button>{' '}
            to their watchlist
          </span>
        );
      case 'completed':
        const seasonEpisode = activity.metadata?.season_number && activity.metadata?.episode_number
          ? ` (S${activity.metadata.season_number}E${activity.metadata.episode_number})`
          : '';
        return (
          <span>
            <strong>{username}</strong> completed{' '}
            <button
              onClick={() => navigate(activity.movie_type === 'tv' ? `/tv/${activity.movie_id}` : `/movie/${activity.movie_id}`)}
              className="font-medium text-primary hover:underline"
            >
              {movieTitle}{seasonEpisode}
            </button>
          </span>
        );
      default:
        return <span><strong>{username}</strong> did something with <strong>{movieTitle}</strong></span>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Activity Feed</h2>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="p-4">
              <div className="animate-pulse flex items-start gap-3">
                <div className="w-8 h-8 bg-muted rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-muted rounded" />
                  <div className="h-3 w-1/2 bg-muted rounded" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Activity Feed</h2>
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">
            No recent activity. Follow some users to see their activity here!
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Activity Feed</h2>
      <div className="space-y-3">
        {activities.map((activity) => (
          <Card key={activity.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={activity.profiles?.avatar_url} />
                  <AvatarFallback>
                    {activity.profiles?.username?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {getActivityIcon(activity.activity_type)}
                    <Badge variant="outline" className="text-xs">
                      {activity.movie_type === 'tv' ? 'TV' : 'Movie'}
                    </Badge>
                  </div>
                  
                  <div className="text-sm">
                    {getActivityText(activity)}
                  </div>
                  
                  {activity.metadata?.review_snippet && (
                    <div className="mt-2 p-2 bg-muted/50 rounded text-xs italic">
                      "{activity.metadata.review_snippet}..."
                    </div>
                  )}
                  
                  <div className="text-xs text-muted-foreground mt-2">
                    {new Date(activity.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};