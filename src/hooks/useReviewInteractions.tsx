import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ReviewLike {
  id: string;
  user_id: string;
  review_id: string;
  created_at: string;
}

interface ReviewComment {
  id: string;
  user_id: string;
  review_id: string;
  content: string;
  created_at: string;
  profile?: {
    username: string | null;
    avatar_url: string | null;
  };
}

export const useReviewInteractions = (reviewId?: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [likes, setLikes] = useState<ReviewLike[]>([]);
  const [comments, setComments] = useState<ReviewComment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (reviewId) {
      fetchInteractions();
    }
  }, [reviewId]);

  const fetchInteractions = async () => {
    if (!reviewId) return;

    try {
      setLoading(true);
      
      const [likesRes, commentsRes] = await Promise.all([
        supabase
          .from('review_likes')
          .select('*')
          .eq('review_id', reviewId),
        supabase
          .from('review_comments')
          .select('*')
          .eq('review_id', reviewId)
          .order('created_at', { ascending: true })
      ]);

      if (likesRes.error) throw likesRes.error;
      if (commentsRes.error) throw commentsRes.error;

      setLikes(likesRes.data || []);
      
      // Fetch profiles for comments
      if (commentsRes.data && commentsRes.data.length > 0) {
        const userIds = [...new Set(commentsRes.data.map(c => c.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .in('id', userIds);
        
        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
        setComments(commentsRes.data.map(c => ({ ...c, profile: profileMap.get(c.user_id) })));
      } else {
        setComments([]);
      }
    } catch (error) {
      console.error('Error fetching review interactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleLike = async () => {
    if (!user || !reviewId) {
      toast({
        title: "Sign in required",
        description: "Please sign in to like reviews",
        variant: "destructive",
      });
      return;
    }

    const existingLike = likes.find(l => l.user_id === user.id);

    try {
      if (existingLike) {
        const { error } = await supabase
          .from('review_likes')
          .delete()
          .eq('id', existingLike.id);

        if (error) throw error;
        setLikes(prev => prev.filter(l => l.id !== existingLike.id));
      } else {
        const { data, error } = await supabase
          .from('review_likes')
          .insert({
            user_id: user.id,
            review_id: reviewId
          })
          .select()
          .single();

        if (error) throw error;
        setLikes(prev => [...prev, data]);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: "Error",
        description: "Failed to update like",
        variant: "destructive",
      });
    }
  };

  const addComment = async (content: string) => {
    if (!user || !reviewId) {
      toast({
        title: "Sign in required",
        description: "Please sign in to comment",
        variant: "destructive",
      });
      return;
    }

    if (!content.trim()) return;

    try {
      const { data, error } = await supabase
        .from('review_comments')
        .insert({
          user_id: user.id,
          review_id: reviewId,
          content: content.trim()
        })
        .select('*')
        .single();

      if (error) throw error;
      
      // Fetch profile for the comment
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .eq('id', user.id)
        .single();
      
      setComments(prev => [...prev, { ...data, profile }]);
      
      toast({
        title: "Comment added",
        description: "Your comment has been posted",
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      });
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('review_comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id);

      if (error) throw error;
      setComments(prev => prev.filter(c => c.id !== commentId));
      
      toast({
        title: "Comment deleted",
        description: "Your comment has been removed",
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: "Error",
        description: "Failed to delete comment",
        variant: "destructive",
      });
    }
  };

  const isLikedByUser = user ? likes.some(l => l.user_id === user.id) : false;

  return {
    likes,
    comments,
    loading,
    isLikedByUser,
    likeCount: likes.length,
    commentCount: comments.length,
    toggleLike,
    addComment,
    deleteComment,
    refetch: fetchInteractions
  };
};
