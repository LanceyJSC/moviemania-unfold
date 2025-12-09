import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Send, Trash2 } from "lucide-react";
import { useReviewInteractions } from "@/hooks/useReviewInteractions";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";

interface ReviewLikesProps {
  reviewId: string;
  compact?: boolean;
}

export const ReviewLikes = ({ reviewId, compact = false }: ReviewLikesProps) => {
  const { user } = useAuth();
  const { 
    isLikedByUser, 
    likeCount, 
    commentCount, 
    comments, 
    toggleLike, 
    addComment, 
    deleteComment,
    loading 
  } = useReviewInteractions(reviewId);
  
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;
    await addComment(newComment);
    setNewComment("");
  };

  if (loading) {
    return (
      <div className="flex items-center gap-4 animate-pulse">
        <div className="h-8 w-16 bg-muted rounded" />
        <div className="h-8 w-16 bg-muted rounded" />
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleLike}
          className={isLikedByUser ? "text-red-500" : "text-muted-foreground"}
        >
          <Heart className={`h-4 w-4 mr-1 ${isLikedByUser ? "fill-current" : ""}`} />
          {likeCount}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowComments(!showComments)}
          className="text-muted-foreground"
        >
          <MessageCircle className="h-4 w-4 mr-1" />
          {commentCount}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleLike}
          className={`flex items-center gap-1 ${isLikedByUser ? "text-red-500" : "text-muted-foreground hover:text-red-500"}`}
        >
          <Heart className={`h-5 w-5 ${isLikedByUser ? "fill-current" : ""}`} />
          <span>{likeCount} {likeCount === 1 ? 'like' : 'likes'}</span>
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowComments(!showComments)}
          className="text-muted-foreground hover:text-foreground"
        >
          <MessageCircle className="h-5 w-5 mr-1" />
          <span>{commentCount} {commentCount === 1 ? 'comment' : 'comments'}</span>
        </Button>
      </div>

      {showComments && (
        <div className="space-y-4 pl-4 border-l-2 border-muted">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <Link to={`/user/${comment.profile?.username || comment.user_id}`}>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={comment.profile?.avatar_url || undefined} />
                  <AvatarFallback>
                    {comment.profile?.username?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Link 
                    to={`/user/${comment.profile?.username || comment.user_id}`}
                    className="font-medium text-sm hover:underline"
                  >
                    {comment.profile?.username || 'User'}
                  </Link>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                  </span>
                  {user?.id === comment.user_id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteComment(comment.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <p className="text-sm text-foreground mt-1">{comment.content}</p>
              </div>
            </div>
          ))}

          {user && (
            <div className="flex gap-2">
              <Input
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment()}
                className="flex-1"
              />
              <Button
                size="icon"
                onClick={handleSubmitComment}
                disabled={!newComment.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
