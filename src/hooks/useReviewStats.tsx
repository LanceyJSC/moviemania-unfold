import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface ReviewStat {
  likeCount: number;
  liked: boolean;
  commentCount: number;
}

export type ReviewStatsMap = Record<string, ReviewStat>;

const EMPTY: ReviewStat = { likeCount: 0, liked: false, commentCount: 0 };

const keyFor = (ids: string[], userId?: string) =>
  ['review-stats', userId ?? 'anon', [...ids].sort().join(',')];

/**
 * One batched fetch of like counts, liked-by-me and comment counts for a list of reviews.
 * Cards that pass the same id list share a single request via react-query dedupe.
 */
export const useReviewStats = (reviewIds: string[]) => {
  const { user } = useAuth();
  const ids = [...new Set(reviewIds.filter(Boolean))];
  const query = useQuery({
    queryKey: keyFor(ids, user?.id),
    enabled: ids.length > 0,
    staleTime: 30_000,
    queryFn: async (): Promise<ReviewStatsMap> => {
      const [likesRes, commentsRes] = await Promise.all([
        supabase.from('review_likes').select('review_id, user_id').in('review_id', ids),
        supabase.from('review_comments').select('review_id').in('review_id', ids),
      ]);
      if (likesRes.error) throw likesRes.error;
      if (commentsRes.error) throw commentsRes.error;
      const map: ReviewStatsMap = {};
      ids.forEach((id) => (map[id] = { ...EMPTY }));
      likesRes.data?.forEach((l) => {
        const s = map[l.review_id];
        if (!s) return;
        s.likeCount++;
        if (user && l.user_id === user.id) s.liked = true;
      });
      commentsRes.data?.forEach((c) => {
        if (map[c.review_id]) map[c.review_id].commentCount++;
      });
      return map;
    },
  });
  const stats = query.data ?? {};
  return {
    stats,
    get: (id: string) => stats[id] ?? EMPTY,
    isLoading: query.isLoading && ids.length > 0,
  };
};

/** Patch a review's stats in every cached list that contains it (optimistic updates). */
export const usePatchReviewStats = () => {
  const qc = useQueryClient();
  return (reviewId: string, patch: (s: ReviewStat) => ReviewStat) => {
    qc.setQueriesData<ReviewStatsMap>({ queryKey: ['review-stats'] }, (old) => {
      if (!old || !old[reviewId]) return old;
      return { ...old, [reviewId]: patch(old[reviewId]) };
    });
  };
};
