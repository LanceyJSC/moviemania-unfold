import { useState, useEffect } from 'react';
import { 
  Users, 
  MessageSquare, 
  Calendar,
  Crown,
  UserMinus,
  Settings
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreateDiscussionDialog } from '@/components/CreateDiscussionDialog';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { MovieClub } from '@/hooks/useMovieClubs';

interface ClubMember {
  id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  role: string;
  joined_at: string;
}

interface ClubDiscussion {
  id: string;
  title: string;
  movie_title?: string;
  created_by: string;
  created_at: string;
  user_profile?: {
    username: string;
    avatar_url?: string;
  };
}

interface ClubDetailModalProps {
  club: MovieClub | null;
  isOpen: boolean;
  onClose: () => void;
  onLeaveClub?: (clubId: string) => void;
}

export const ClubDetailModal = ({ 
  club, 
  isOpen, 
  onClose, 
  onLeaveClub 
}: ClubDetailModalProps) => {
  const { user } = useAuth();
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [discussions, setDiscussions] = useState<ClubDiscussion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && club) {
      fetchClubData();
    }
  }, [isOpen, club]);

  const fetchClubData = async () => {
    if (!club) return;

    setLoading(true);
    try {
      // Fetch club members
      const { data: memberData, error: memberError } = await supabase
        .from('club_memberships')
        .select('*')
        .eq('club_id', club.id)
        .order('joined_at', { ascending: true });

      if (memberError) throw memberError;

      // Get profiles for members separately
      if (memberData && memberData.length > 0) {
        const userIds = memberData.map(m => m.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url')
          .in('id', userIds);

        const formattedMembers = memberData.map(member => {
          const profile = profiles?.find(p => p.id === member.user_id);
          return {
            id: profile?.id || '',
            username: profile?.username || 'Unknown',
            full_name: profile?.full_name,
            avatar_url: profile?.avatar_url,
            role: member.role || 'member',
            joined_at: member.joined_at
          };
        });

        setMembers(formattedMembers);
      }

      // Fetch club-related discussions
      const { data: clubDiscussions } = await supabase
        .from('discussion_threads')
        .select('*')
        .eq('club_id', club.id)
        .order('created_at', { ascending: false });

      if (clubDiscussions && clubDiscussions.length > 0) {
        // Get user profiles for discussions
        const discussionUserIds = clubDiscussions.map(d => d.created_by);
        const { data: discussionProfiles } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .in('id', discussionUserIds);

        const discussionsWithProfiles = clubDiscussions.map(discussion => ({
          ...discussion,
          user_profile: discussionProfiles?.find(p => p.id === discussion.created_by) || {
            username: 'Unknown',
            avatar_url: undefined
          }
        }));
        
        setDiscussions(discussionsWithProfiles);
      } else {
        setDiscussions([]);
      }

    } catch (error) {
      console.error('Error fetching club data:', error);
      toast.error('Failed to load club details');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveClub = async () => {
    if (!club || !onLeaveClub) return;
    onLeaveClub(club.id);
    onClose();
  };

  if (!club) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">{club.name}</DialogTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary">{club.genre}</Badge>
                <div className="text-sm text-muted-foreground">
                  {club.member_count || 0} members
                </div>
              </div>
            </div>
            {club.is_member && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleLeaveClub}
              >
                <UserMinus className="h-4 w-4 mr-2" />
                Leave Club
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <p className="text-muted-foreground">{club.description}</p>

          <Tabs defaultValue="members" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="members">Members</TabsTrigger>
              <TabsTrigger value="discussions">Discussions</TabsTrigger>
            </TabsList>
            
            <TabsContent value="members" className="space-y-4">
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-16 bg-muted rounded animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {members.map((member) => (
                    <Card key={member.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={member.avatar_url} />
                            <AvatarFallback>
                              {member.username.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{member.username}</h3>
                              {member.role === 'admin' && (
                                <Crown className="h-4 w-4 text-yellow-500" />
                              )}
                            </div>
                            {member.full_name && (
                              <p className="text-sm text-muted-foreground">
                                {member.full_name}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              Joined {new Date(member.joined_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="discussions" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Club Discussions</h3>
                <CreateDiscussionDialog 
                  clubId={club.id}
                  onDiscussionCreated={fetchClubData}
                />
              </div>
              
              <div className="space-y-2">
                {discussions.map((discussion) => (
                  <Card key={discussion.id} className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={discussion.user_profile?.avatar_url} />
                          <AvatarFallback>
                            {discussion.user_profile?.username?.slice(0, 2).toUpperCase() || 'A'}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <h4 className="font-semibold mb-1">{discussion.title}</h4>
                          {discussion.movie_title && (
                            <Badge variant="outline" className="text-xs mb-2">
                              {discussion.movie_title}
                            </Badge>
                          )}
                          <div className="text-sm text-muted-foreground">
                            by {discussion.user_profile?.username} • {new Date(discussion.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};