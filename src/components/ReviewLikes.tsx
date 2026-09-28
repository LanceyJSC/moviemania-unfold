import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Send, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useReviewStats, usePatchReviewStats } from "@/hooks/useReviewStats";
import { commentSchema, validateInput } from "@/lib/validation";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface ReviewLikesProps {
  reviewId: string;
  /** All review ids in the surrounding list — lets every card share one batched stats fetch. */
  reviewIds?: string[];
  compact?: boolean;
  defaultOpen?: boolean;
}

interface ReviewComment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile?: { username: string | null; avatar_url: string | null } | null;
}

export const ReviewLikes = ({ reviewId, reviewIds, compact = false, defaultOpen = false }: ReviewLikesProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { get } = useReviewStats(reviewIds && reviewIds.length ? reviewIds : [reviewId]);
  const patch = usePatchReviewStats();
  const stat = get(reviewId);
  const [showComments, setShowComments] = useState(defaultOpen);
  const [newComment, setNewComment] = useState("");
  const [busy, setBusy] = useState(false);

  // Comment thread only loads once expanded
  const commentsKey = ["review-comments", reviewId];
  const { data: comments = [], isLoading: commentsLoading } = useQuery({
    queryKey: commentsKey,
    enabled: showComments,
    queryFn: async (): Promise<ReviewComment[]> => {
      const { data, error } = await supabase
        .from("review_comments")
        .select("id, user_id, content, created_at")
        .eq("review_id", reviewId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      const ids = [...new Set((data || []).map((c) => c.user_id))];
      const { data: profiles } = ids.length
        ? await supabase.from("profiles").select("id, username, avatar_url").in("id", ids)
        : { data: [] as any[] };
      const map = new Map((profiles || []).map((p: any) => [p.id, p]));
      return (data || []).map((c) => ({ ...c, profile: map.get(c.user_id) || null }));
    },
  });

  const toggleLike = async () => {
    if (!user) { navigate("/auth"); return; }
    const wasLiked = stat.liked;
    patch(reviewId, (s) => ({ ...s, liked: !wasLiked, likeCount: Math.max(0, s.likeCount + (wasLiked ? -1 : 1)) }));
    const { error } = wasLiked
      ? await supabase.from("review_likes").delete().eq("review_id", reviewId).eq("user_id", user.id)
      : await supabase.from("review_likes").insert({ review_id: reviewId, user_id: user.id });
    if (error) {
      patch(reviewId, (s) => ({ ...s, liked: wasLiked, likeCount: Math.max(0, s.likeCount + (wasLiked ? 1 : -1)) }));
      toast.error("Failed to update like");
    }
  };

  const addComment = async () => {
    if (!user || !newComment.trim() || busy) return;
    const v = validateInput(commentSchema, newComment.trim());
    if (!v.success) { toast.error(v.error || "Invalid comment"); return; }
    setBusy(true);
    const { data, error } = await supabase
      .from("review_comments")
      .insert({ user_id: user.id, review_id: reviewId, content: v.data as string })
      .select("id, user_id, content, created_at")
      .single();
    setBusy(false);
    if (error || !data) { toast.error("Failed to add comment"); return; }
    const { data: profile } = await supabase.from("profiles").select("username, avatar_url").eq("id", user.id).maybeSingle();
    qc.setQueryData<ReviewComment[]>(commentsKey, (old = []) => [...old, { ...data, profile }]);
    patch(reviewId, (s) => ({ ...s, commentCount: s.commentCount + 1 }));
    setNewComment("");
  };

  const deleteComment = async (id: string) => {
    if (!user) return;
    const prev = qc.getQueryData<ReviewComment[]>(commentsKey);
    qc.setQueryData<ReviewComment[]>(commentsKey, (old = []) => old.filter((c) => c.id !== id));
    patch(reviewId, (s) => ({ ...s, commentCount: Math.max(0, s.commentCount - 1) }));
    const { error } = await supabase.from("review_comments").delete().eq("id", id).eq("user_id", user.id);
    if (error) {
      qc.setQueryData(commentsKey, prev);
      patch(reviewId, (s) => ({ ...s, commentCount: s.commentCount + 1 }));
      toast.error("Failed to delete comment");
    }
  };

  const { likeCount, liked, commentCount } = stat;

  return (
    <div className={compact ? "space-y-3" : "space-y-4"}>
      <div className={compact ? "flex items-center gap-3" : "flex items-center gap-4"}>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleLike}
          className={cn("flex items-center gap-1", liked ? "text-cinema-red" : "text-muted-foreground hover:text-cinema-red")}
        >
          <Heart className={cn(compact ? "h-4 w-4" : "h-5 w-5", liked && "fill-current")} />
          <span>{compact ? likeCount : `${likeCount} ${likeCount === 1 ? "like" : "likes"}`}</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowComments((v) => !v)}
          className="text-muted-foreground hover:text-foreground"
        >
          <MessageCircle className={cn(compact ? "h-4 w-4" : "h-5 w-5", "mr-1")} />
          <span>{compact ? commentCount : `${commentCount} ${commentCount === 1 ? "comment" : "comments"}`}</span>
        </Button>
      </div>

      {showComments && (
        <div className="space-y-4 pl-4 border-l-2 border-muted">
          {commentsLoading && <div className="h-8 w-40 bg-muted rounded animate-pulse" />}
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <Link to={`/user/${comment.profile?.username || comment.user_id}`}>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={comment.profile?.avatar_url || undefined} />
                  <AvatarFallback>{comment.profile?.username?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                </Avatar>
              </Link>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Link to={`/user/${comment.profile?.username || comment.user_id}`} className="font-medium text-sm hover:underline">
                    {comment.profile?.username || "User"}
                  </Link>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                  </span>
                  {user?.id === comment.user_id && (
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => deleteComment(comment.id)} aria-label="Delete comment">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <p className="text-sm text-foreground mt-1 break-words">{comment.content}</p>
              </div>
            </div>
          ))}
          {!commentsLoading && comments.length === 0 && (
            <p className="text-xs text-muted-foreground">No comments yet.</p>
          )}
          {user && (
            <div className="flex gap-2">
              <Input
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addComment()}
                className="flex-1"
                maxLength={1000}
              />
              <Button size="icon" onClick={addComment} disabled={!newComment.trim() || busy} aria-label="Post comment">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
