import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface AverageRating {
  average: number | null;
  count: number;
}

export const useAverageUserRating = (mediaId: number, mediaType: 'movie' | 'tv' = 'movie') => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['average-user-rating', mediaId, mediaType],
    queryFn: async (): Promise<AverageRating> => {
      // Query user_ratings table for all ratings of this media
      const { data: ratings, error } = await supabase
        .from('user_ratings')
        .select('rating')
        .eq('movie_id', mediaId)
        .eq('media_type', mediaType)
        .not('rating', 'is', null);

      if (error) throw error;

      if (!ratings || ratings.length === 0) {
        return { average: null, count: 0 };
      }

      const validRatings = ratings.filter(r => r.rating !== null);
      const sum = validRatings.reduce((acc, r) => acc + (r.rating || 0), 0);
      const average = sum / validRatings.length;

      return {
        average: Math.round(average * 10) / 10, // Round to 1 decimal
        count: validRatings.length
      };
    },
    enabled: !!mediaId
  });

  return {
    average: data?.average ?? null,
    count: data?.count ?? 0,
    isLoading,
    error
  };
};
