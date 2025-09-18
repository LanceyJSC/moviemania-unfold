import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Send, Trash2, AlertTriangle } from 'lucide-react';
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
import { toast } from 'sonner';

interface DiscussionThread {
  id: string;
  title: string;
  description: string;
  movie_title: string;
  movie_id: number;
  created_by: string;
  created_at: string;
  profiles: {
    username: string;
    avatar_url: string;
  };
}

interface Comment {
  id: string;
  content: string;
  user_id: string;
  parent_comment_id: string | null;
  created_at: string;
  profiles: {
    username: string;
    avatar_url: string;
  };
}

export default function DiscussionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const [discussion, setDiscussion] = useState<DiscussionThread | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    
    fetchDiscussion();
    fetchComments();
    
    // Set up real-time subscriptions
    const discussionSubscription = supabase
      .channel('discussion-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'discussion_threads',
          filter: `id=eq.${id}`
        },
        () => fetchDiscussion()
      )
      .subscribe();

    const commentsSubscription = supabase
      .channel('comments-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'discussion_comments',
          filter: `thread_id=eq.${id}`
        },
        () => fetchComments()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(discussionSubscription);
      supabase.removeChannel(commentsSubscription);
    };
  }, [id]);

  const fetchDiscussion = async () => {
    if (!id) return;
    
    try {
      const { data, error } = await supabase
        .from('discussion_threads')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      // Fetch creator profile separately
      if (data) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('username, avatar_url')
          .eq('id', data.created_by)
          .single();
        
        setDiscussion({
          ...data,
          profiles: profile || { username: 'Unknown', avatar_url: '' }
        });
      }
    } catch (error) {
      console.error('Error fetching discussion:', error);
      toast.error('Failed to load discussion');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    if (!id) return;
    
    try {
      const { data, error } = await supabase
        .from('discussion_comments')
        .select('*')
        .eq('thread_id', id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      if (data && data.length > 0) {
        // Fetch profiles for all comment authors
        const userIds = [...new Set(data.map(comment => comment.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .in('id', userIds);

        const commentsWithProfiles = data.map(comment => ({
          ...comment,
          profiles: profiles?.find(p => p.id === comment.user_id) || { username: 'Unknown', avatar_url: '' }
        }));
        
        setComments(commentsWithProfiles);
      } else {
        setComments([]);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleSubmitComment = async () => {
    if (!user || !newComment.trim() || !id) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('discussion_comments')
        .insert({
          thread_id: id,
          user_id: user.id,
          content: newComment.trim()
        });

      if (error) throw error;
      
      setNewComment('');
      toast.success('Comment added!');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDiscussion = async () => {
    if (!user || !id) return;

    setDeleting(true);
    try {
      // First delete all comments
      await supabase
        .from('discussion_comments')
        .delete()
        .eq('thread_id', id);

      // Then delete the discussion
      const { error } = await supabase
        .from('discussion_threads')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Discussion deleted successfully');
      navigate('/social');
    } catch (error) {
      console.error('Error deleting discussion:', error);
      toast.error('Failed to delete discussion');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-1/4"></div>
          <div className="h-8 bg-muted rounded w-3/4"></div>
          <div className="h-20 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!discussion) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Discussion not found</h1>
        <Button onClick={() => navigate('/social')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Social
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button 
        variant="ghost" 
        onClick={() => navigate('/social')}
        className="mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Social
      </Button>

      {/* Admin Controls */}
      {isAdmin && (
        <div className="mb-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={deleting}>
                <Trash2 className="w-4 h-4 mr-2" />
                {deleting ? 'Deleting...' : 'Delete Discussion'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  Delete Discussion
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this discussion? This action cannot be undone and will remove all comments.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteDiscussion} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete Discussion
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <Avatar className="w-8 h-8">
              <AvatarImage src={discussion.profiles?.avatar_url} />
              <AvatarFallback>
                {discussion.profiles?.username?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{discussion.profiles?.username}</span>
              <span className="text-xs text-muted-foreground">
                {new Date(discussion.created_at).toLocaleDateString()}
              </span>
            </div>
            {discussion.movie_title && (
              <Badge variant="secondary" className="ml-auto">
                {discussion.movie_title}
              </Badge>
            )}
          </div>
          <CardTitle className="text-2xl">{discussion.title}</CardTitle>
        </CardHeader>
        {discussion.description && (
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {discussion.description}
            </p>
          </CardContent>
        )}
      </Card>

      <div className="space-y-4 mb-6">
        <h3 className="text-lg font-semibold">
          Comments ({comments.length})
        </h3>
        
        {comments.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No comments yet. Be the first to join the discussion!
            </CardContent>
          </Card>
        ) : (
          comments.map((comment) => (
            <Card key={comment.id}>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={comment.profiles?.avatar_url} />
                    <AvatarFallback>
                      {comment.profiles?.username?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{comment.profiles?.username}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(comment.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {user && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <Textarea
                placeholder="Add your thoughts to the discussion..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={4}
              />
              <div className="flex justify-end">
                <Button 
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || submitting}
                >
                  <Send className="w-4 h-4 mr-2" />
                  {submitting ? 'Adding...' : 'Add Comment'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}