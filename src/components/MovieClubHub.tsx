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
  RefreshCw,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";
import { useMovieClubs } from "@/hooks/useMovieClubs";
import { useUserRole } from "@/hooks/useUserRole";
import { CreateClubDialog } from "./CreateClubDialog";
import { CreateDiscussionDialog } from "./CreateDiscussionDialog";
import { ClubDetailModal } from "./ClubDetailModal";
import { useNavigate } from "react-router-dom";
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
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const navigate = useNavigate();
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
  const [selectedClub, setSelectedClub] = useState<any>(null);
  const [showClubDetail, setShowClubDetail] = useState(false);
  const [deletingClub, setDeletingClub] = useState<string | null>(null);

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

        // Get comment counts for each discussion
        const discussionIds = discussionsData.map(d => d.id);
        const { data: commentCounts } = await supabase
          .from('discussion_comments')
          .select('thread_id')
          .in('thread_id', discussionIds);

        // Count comments per discussion
        const commentCountMap = commentCounts?.reduce((acc: Record<string, number>, comment) => {
          acc[comment.thread_id] = (acc[comment.thread_id] || 0) + 1;
          return acc;
        }, {}) || {};

        const discussionsWithProfiles = discussionsData.map(discussion => ({
          ...discussion,
          comment_count: commentCountMap[discussion.id] || 0,
          user_profile: profiles?.find(p => p.id === discussion.created_by)
        }));
        
        setDiscussions(discussionsWithProfiles);
      }

      // Fetch top users from actual user activity data
      const { data: activityData } = await supabase
        .from('user_activities')
        .select('user_id, profiles!inner(username, avatar_url)')
        .order('created_at', { ascending: false });

      if (activityData) {
        // Count activities per user
        const userActivityCount: Record<string, { profile: any, count: number }> = {};
        
        activityData.forEach(activity => {
          const userId = activity.user_id;
          if (activity.profiles) {
            if (!userActivityCount[userId]) {
              userActivityCount[userId] = { 
                profile: activity.profiles, 
                count: 0 
              };
            }
            userActivityCount[userId].count++;
          }
        });

        // Get top 3 users by activity count
        const topUsersData = Object.entries(userActivityCount)
          .sort(([,a], [,b]) => b.count - a.count)
          .slice(0, 3)
          .map(([userId, data]) => ({
            id: userId,
            username: data.profile.username,
            avatar_url: data.profile.avatar_url,
            activity_count: data.count
          }));

        setTopUsers(topUsersData);
      } else {
        // Fallback to recent users if no activity data
        const { data: recentUsers } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .order('created_at', { ascending: false })
          .limit(3);

        if (recentUsers) {
          setTopUsers(recentUsers.map(user => ({
            ...user,
            activity_count: 0
          })));
        }
      }

    } catch (error) {
      console.error('Error fetching discussions:', error);
    }
  };

  const handleDeleteClub = async (clubId: string) => {
    setDeletingClub(clubId);
    try {
      // Delete club memberships first
      await supabase
        .from('club_memberships')
        .delete()
        .eq('club_id', clubId);

      // Then delete the club
      const { error } = await supabase
        .from('movie_clubs')
        .delete()
        .eq('id', clubId);

      if (error) throw error;
      
      toast.success('Club deleted successfully');
      refetch();
    } catch (error) {
      console.error('Error deleting club:', error);
      toast.error('Failed to delete club');
    } finally {
      setDeletingClub(null);
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
          {isAdmin && <CreateClubDialog onClubCreated={refetch} />}
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
                  <div className="space-y-2">
                    <Button 
                      onClick={() => {
                        setSelectedClub(club);
                        setShowClubDetail(true);
                      }}
                      className="w-full"
                      size="sm"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Enter Club
                    </Button>
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => leaveClub(club.id)}
                        variant="outline"
                        className="flex-1"
                        size="sm"
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Leave Club
                      </Button>
                      {isAdmin && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="destructive"
                              size="sm"
                              disabled={deletingClub === club.id}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle className="flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-destructive" />
                                Delete Club
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{club.name}"? This action cannot be undone and will remove all club data.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeleteClub(club.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete Club
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
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
            <Card 
              key={discussion.id} 
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/discussion/${discussion.id}`)}
            >
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

      <ClubDetailModal
        club={selectedClub}
        isOpen={showClubDetail}
        onClose={() => setShowClubDetail(false)}
        onLeaveClub={leaveClub}
      />
    </div>
  );
};