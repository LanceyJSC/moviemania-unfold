import { useState } from 'react';
import { Heart, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ActivityReactionButtonProps {
  activityId: string;
  initialReactions?: number;
  hasReacted?: boolean;
  showCommentInput?: boolean;
}

export const ActivityReactionButton = ({
  activityId,
  initialReactions = 0,
  hasReacted = false,
  showCommentInput = false
}: ActivityReactionButtonProps) => {
  const { user } = useAuth();
  const [liked, setLiked] = useState(hasReacted);
  const [likeCount, setLikeCount] = useState(initialReactions);
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLike = async () => {
    if (!user) {
      toast.error('Please sign in to react');
      return;
    }

    setLoading(true);
    try {
      if (liked) {
        // Remove reaction
        await supabase
          .from('friend_reactions')
          .delete()
          .eq('activity_id', activityId)
          .eq('user_id', user.id)
          .eq('reaction_type', 'like');
        
        setLiked(false);
        setLikeCount(prev => Math.max(0, prev - 1));
      } else {
        // Add reaction
        await supabase
          .from('friend_reactions')
          .insert({
            activity_id: activityId,
            user_id: user.id,
            reaction_type: 'like'
          });
        
        setLiked(true);
        setLikeCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error toggling reaction:', error);
      toast.error('Failed to react');
    } finally {
      setLoading(false);
    }
  };

  const handleComment = async () => {
    if (!user || !comment.trim()) return;

    setLoading(true);
    try {
      await supabase
        .from('friend_reactions')
        .insert({
          activity_id: activityId,
          user_id: user.id,
          reaction_type: 'comment',
          comment: comment.trim()
        });
      
      toast.success('Comment added!');
      setComment('');
      setShowComment(false);
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        className={cn('h-8 px-2', liked && 'text-red-500')}
        onClick={handleLike}
        disabled={loading}
      >
        <Heart className={cn('h-4 w-4 mr-1', liked && 'fill-current')} />
        <span className="text-xs">{likeCount}</span>
      </Button>

      {showCommentInput && (
        <>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            onClick={() => setShowComment(!showComment)}
          >
            <MessageCircle className="h-4 w-4" />
          </Button>

          {showComment && (
            <div className="flex items-center gap-2 flex-1">
              <Input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Write a comment..."
                className="h-8 text-sm"
                onKeyPress={(e) => e.key === 'Enter' && handleComment()}
              />
              <Button
                size="sm"
                className="h-8"
                onClick={handleComment}
                disabled={loading || !comment.trim()}
              >
                Post
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
