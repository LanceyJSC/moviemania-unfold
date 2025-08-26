import { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  MessageCircle, 
  Calendar,
  Trophy,
  Sparkles,
  Heart,
  Star,
  Flame,
  UserPlus,
  Check,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useMovieClubs } from '@/hooks/useMovieClubs';
import { CreateDiscussionDialog } from '@/components/CreateDiscussionDialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Discussion {
  id: string;
  title: string;
  movie_title: string;
  movie_id: number;
  created_by: string;
  comment_count: number;
  created_at: string;
  user_profile?: {
    username: string;
    avatar_url?: string;
  };
}

interface TopUser {
  id: string;
  username: string;
  avatar_url?: string;
  activity_count: number;
}

export const MovieClubHub = () => {
  const { 
    clubs, 
    suggestions, 
    loading, 
    joinClub, 
    leaveClub, 
    sendFriendRequest,
    refetch 
  } = useMovieClubs();
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);

  useEffect(() => {
    fetchDiscussions();
  }, []);

  const fetchDiscussions = async () => {
    try {
      // Fetch recent discussions from database
      const { data: discussionsData } = await supabase
        .from('discussion_threads')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (discussionsData) {
        // Get user profiles for discussions
        const userIds = discussionsData.map(d => d.created_by);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .in('id', userIds);

        const discussionsWithProfiles = discussionsData.map(discussion => ({
          ...discussion,
          comment_count: Math.floor(Math.random() * 50), // Mock comment count for now
          user_profile: profiles?.find(p => p.id === discussion.created_by)
        }));
        
        setDiscussions(discussionsWithProfiles);
      }

      // Mock top users data - in real app, this would come from user activity aggregation
      setTopUsers([
        {
          id: '1',
          username: 'MovieMaster2024',
          avatar_url: undefined,
          activity_count: 156
        },
        {
          id: '2',
          username: 'CinemaExplorer',
          avatar_url: undefined,
          activity_count: 134
        },
        {
          id: '3',
          username: 'FilmCritic',
          avatar_url: undefined,
          activity_count: 98
        }
      ]);

    } catch (error) {
      console.error('Error fetching discussions:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Natural Friend Discovery */}
      {suggestions.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              Discover Movie Friends
            </h2>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refetch}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {suggestions.map((suggestion) => (
              <Card key={suggestion.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={suggestion.avatar_url} />
                      <AvatarFallback>
                        {suggestion.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{suggestion.username}</h3>
                      {suggestion.full_name && (
                        <p className="text-sm text-muted-foreground">{suggestion.full_name}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <Badge variant="secondary" className="text-xs">
                      {suggestion.reason}
                    </Badge>
                  </div>
                  
                  <Button 
                    onClick={() => sendFriendRequest(suggestion.id)}
                    className="w-full"
                    size="sm"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Friend
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Movie Clubs */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Movie Clubs
          </h2>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Create Club
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clubs.map((club) => (
            <Card key={club.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{club.name}</CardTitle>
                    <Badge variant="secondary" className="mt-1 text-xs">
                      {club.genre}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-primary">
                      {(club.member_count || 0).toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">members</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {club.description}
                </p>
                {club.is_member ? (
                  <Button 
                    onClick={() => leaveClub(club.id)}
                    variant="outline"
                    className="w-full"
                    size="sm"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Member
                  </Button>
                ) : (
                  <Button 
                    onClick={() => joinClub(club.id)}
                    className="w-full"
                    size="sm"
                  >
                    Join Club
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Discussions */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <MessageCircle className="h-6 w-6 text-primary" />
            Recent Discussions
          </h2>
          <CreateDiscussionDialog onDiscussionCreated={fetchDiscussions} />
        </div>

        <div className="space-y-4">
          {discussions.map((discussion) => (
            <Card key={discussion.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={discussion.user_profile?.avatar_url} />
                    <AvatarFallback>
                      {discussion.user_profile?.username?.slice(0, 2).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground">{discussion.title}</h3>
                      <Badge variant="outline" className="text-xs">
                        {discussion.movie_title}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>by {discussion.user_profile?.username || 'Anonymous'}</span>
                      <span>{discussion.comment_count} replies</span>
                      <span>{new Date(discussion.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Community Leaderboard */}
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2 mb-6">
          <Trophy className="h-6 w-6 text-primary" />
          Top Contributors
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {topUsers.map((user, index) => (
            <Card key={user.id} className="text-center p-6">
              <div className="relative mb-4">
                <Avatar className="h-16 w-16 mx-auto">
                  <AvatarImage src={user.avatar_url} />
                  <AvatarFallback className="text-lg">
                    {user.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {index === 0 && (
                  <div className="absolute -top-2 -right-2 bg-yellow-500 text-white rounded-full p-1">
                    <Trophy className="h-4 w-4" />
                  </div>
                )}
                {index === 1 && (
                  <div className="absolute -top-2 -right-2 bg-gray-400 text-white rounded-full p-1">
                    <Star className="h-4 w-4" />
                  </div>
                )}
                {index === 2 && (
                  <div className="absolute -top-2 -right-2 bg-orange-500 text-white rounded-full p-1">
                    <Flame className="h-4 w-4" />
                  </div>
                )}
              </div>
              
              <h3 className="font-semibold text-foreground mb-1">{user.username}</h3>
              <div className="text-2xl font-bold text-primary mb-1">
                {user.activity_count}
              </div>
              <div className="text-sm text-muted-foreground">contributions</div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};