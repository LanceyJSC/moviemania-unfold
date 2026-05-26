import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface SuggestedMember {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  follower_count: number | null;
}

export const useSuggestedMembers = (limit = 8) => {
  const { user } = useAuth();
  const [members, setMembers] = useState<SuggestedMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        let excluded: string[] = [];
        if (user) {
          const { data: follows } = await supabase
            .from("user_follows")
            .select("following_id")
            .eq("follower_id", user.id);
          excluded = [user.id, ...(follows?.map((f) => f.following_id) ?? [])];
        }

        let query = supabase
          .from("profiles")
          .select("id, username, full_name, avatar_url, bio, follower_count")
          .not("username", "is", null)
          .order("follower_count", { ascending: false, nullsFirst: false })
          .limit(limit);

        if (excluded.length > 0) {
          query = query.not("id", "in", `(${excluded.join(",")})`);
        }

        const { data } = await query;
        setMembers((data as SuggestedMember[]) || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.id, limit]);

  return { members, loading };
};
