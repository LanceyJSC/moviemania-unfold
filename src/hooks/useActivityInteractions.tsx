import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Comment {
  id: string;
  activity_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile?: { username: string | null; avatar_url: string | null };
}

export const useActivityInteractions = (activityId: string) => {
  const { user } = useAuth();
  const [likeCount, setLikeCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [{ data: likes }, { data: cmts }] = await Promise.all([
      supabase.from("activity_likes").select("user_id").eq("activity_id", activityId),
      supabase
        .from("activity_comments")
        .select("*")
        .eq("activity_id", activityId)
        .order("created_at", { ascending: true }),
    ]);
    setLikeCount(likes?.length ?? 0);
    setLiked(!!likes?.some((l) => l.user_id === user?.id));

    if (cmts && cmts.length > 0) {
      const userIds = [...new Set(cmts.map((c) => c.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", userIds);
      const pmap = new Map(profiles?.map((p) => [p.id, p]) || []);
      setComments(cmts.map((c) => ({ ...c, profile: pmap.get(c.user_id) })));
    } else {
      setComments([]);
    }
    setLoading(false);
  }, [activityId, user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleLike = async () => {
    if (!user) return;
    if (liked) {
      setLiked(false);
      setLikeCount((c) => Math.max(0, c - 1));
      await supabase
        .from("activity_likes")
        .delete()
        .eq("activity_id", activityId)
        .eq("user_id", user.id);
    } else {
      setLiked(true);
      setLikeCount((c) => c + 1);
      await supabase.from("activity_likes").insert({ activity_id: activityId, user_id: user.id });
    }
  };

  const addComment = async (content: string) => {
    if (!user || !content.trim()) return;
    const { data } = await supabase
      .from("activity_comments")
      .insert({ activity_id: activityId, user_id: user.id, content: content.trim() })
      .select()
      .single();
    if (data) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .eq("id", user.id)
        .maybeSingle();
      setComments((prev) => [...prev, { ...data, profile: profile || undefined }]);
    }
  };

  const deleteComment = async (id: string) => {
    if (!user) return;
    setComments((prev) => prev.filter((c) => c.id !== id));
    await supabase.from("activity_comments").delete().eq("id", id).eq("user_id", user.id);
  };

  return { likeCount, liked, comments, loading, toggleLike, addComment, deleteComment };
};
