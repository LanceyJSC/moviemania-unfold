import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, User } from "lucide-react";
import { format } from "date-fns";

interface EpisodeCommunityReviewsProps {
  tvId: number;
  seasonNumber: number;
  episodeNumber: number;
}

interface EpisodeReview {
  id: string;
  notes: string;
  rating: number | null;
  watched_date: string;
  user_id: string;
  profile: {
    username: string | null;
    avatar_url: string | null;
  } | null;
}

export const EpisodeCommunityReviews = ({ 
  tvId, 
  seasonNumber, 
  episodeNumber 
}: EpisodeCommunityReviewsProps) => {
  const { data: reviews, isLoading } = useQuery({
    queryKey: ['episode-community-reviews', tvId, seasonNumber, episodeNumber],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tv_diary')
        .select(`
          id,
          notes,
          rating,
          watched_date,
          user_id
        `)
        .eq('tv_id', tvId)
        .eq('season_number', seasonNumber)
        .eq('episode_number', episodeNumber)
        .eq('is_public', true)
        .not('notes', 'is', null)
        .neq('notes', '')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching episode reviews:', error);
        return [];
      }

      console.log('Episode reviews found:', data?.length, 'for', tvId, seasonNumber, episodeNumber);

      // Fetch profiles for each review
      const reviewsWithProfiles: EpisodeReview[] = await Promise.all(
        (data || []).map(async (review) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', review.user_id)
            .maybeSingle();
          
          return {
            ...review,
            profile
          };
        })
      );

      // Filter out reviews with empty notes
      return reviewsWithProfiles.filter(r => r.notes && r.notes.trim() !== '');
    }
  });

  if (isLoading) {
    return (
      <div className="py-3 px-4">
        <div className="animate-pulse flex gap-3">
          <div className="w-8 h-8 rounded-full bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-muted rounded w-1/3" />
            <div className="h-3 bg-muted rounded w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!reviews || reviews.length === 0) {
    return (
      <div className="py-3 px-4 text-sm text-muted-foreground">
        No community reviews yet for this episode.
      </div>
    );
  }

  return (
    <div className="py-2 px-4 space-y-3">
      {reviews.map((review) => (
        <div 
          key={review.id} 
          className="flex gap-3 p-3 bg-background/50 rounded-lg border border-border/30"
        >
          <Avatar className="h-8 w-8 flex-shrink-0">
            {review.profile?.avatar_url ? (
              <AvatarImage src={review.profile.avatar_url} />
            ) : null}
            <AvatarFallback className="bg-muted">
              <User className="h-4 w-4 text-muted-foreground" />
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-medium text-sm text-foreground">
                {review.profile?.username || 'Anonymous'}
              </span>
              {review.rating && (
                <div className="flex items-center gap-1 text-cinema-gold text-xs">
                  <Star className="h-3 w-3 fill-current" />
                  <span>{review.rating}/10</span>
                </div>
              )}
              <span className="text-xs text-muted-foreground">
                • {format(new Date(review.watched_date), 'MMM d, yyyy')}
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {review.notes}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

// Hook to get the count of episode reviews for display in trigger
export const useEpisodeReviewCount = (
  tvId: number, 
  seasonNumber: number, 
  episodeNumber: number
) => {
  return useQuery({
    queryKey: ['episode-review-count', tvId, seasonNumber, episodeNumber],
    queryFn: async () => {
      const { data, count, error } = await supabase
        .from('tv_diary')
        .select('id', { count: 'exact' })
        .eq('tv_id', tvId)
        .eq('season_number', seasonNumber)
        .eq('episode_number', episodeNumber)
        .eq('is_public', true)
        .not('notes', 'is', null)
        .neq('notes', '');

      if (error) {
        console.error('Error fetching episode review count:', error);
        return 0;
      }

      console.log('Episode review count:', data?.length, 'for', tvId, seasonNumber, episodeNumber);
      return data?.length || 0;
    }
  });
};
