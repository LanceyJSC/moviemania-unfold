import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface FriendCompatibility {
  friendId: string;
  friendProfile: {
    username: string;
    full_name?: string;
    avatar_url?: string;
  };
  compatibilityScore: number;
  sharedGenres: string[];
  commonMovies: number;
  sharedRatings: { movieId: number; movieTitle: string; userRating: number; friendRating: number }[];
}

export const useFriendCompatibility = () => {
  const { user } = useAuth();
  const [compatibilities, setCompatibilities] = useState<FriendCompatibility[]>([]);
  const [loading, setLoading] = useState(true);

  const calculateCompatibility = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get user's friends
      const { data: connections } = await supabase
        .from('social_connections')
        .select('following_id')
        .eq('follower_id', user.id)
        .eq('status', 'accepted');

      if (!connections || connections.length === 0) {
        setCompatibilities([]);
        setLoading(false);
        return;
      }

      const friendIds = connections.map(c => c.following_id).filter(Boolean) as string[];

      // Get user's ratings
      const { data: userRatings } = await supabase
        .from('user_ratings')
        .select('movie_id, movie_title, rating')
        .eq('user_id', user.id);

      // Get user's liked movies for genre analysis
      const { data: userLikes } = await supabase
        .from('watchlist')
        .select('movie_id')
        .eq('user_id', user.id)
        .eq('list_type', 'liked');

      // Get friend profiles
      const { data: friendProfiles } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .in('id', friendIds);

      // Get friend ratings
      const { data: friendRatings } = await supabase
        .from('user_ratings')
        .select('user_id, movie_id, movie_title, rating')
        .in('user_id', friendIds);

      // Get friend likes
      const { data: friendLikes } = await supabase
        .from('watchlist')
        .select('user_id, movie_id')
        .in('user_id', friendIds)
        .eq('list_type', 'liked');

      const userMovieIds = new Set(userRatings?.map(r => r.movie_id) || []);
      const userLikedIds = new Set(userLikes?.map(l => l.movie_id) || []);

      // Calculate compatibility for each friend
      const results: FriendCompatibility[] = friendIds.map(friendId => {
        const profile = friendProfiles?.find(p => p.id === friendId);
        const friendMovieRatings = friendRatings?.filter(r => r.user_id === friendId) || [];
        const friendMovieLikes = friendLikes?.filter(l => l.user_id === friendId) || [];

        // Find common rated movies
        const sharedRatings: FriendCompatibility['sharedRatings'] = [];
        let ratingDifferenceSum = 0;
        let sharedRatedCount = 0;

        friendMovieRatings.forEach(fr => {
          const userRating = userRatings?.find(ur => ur.movie_id === fr.movie_id);
          if (userRating) {
            sharedRatings.push({
              movieId: fr.movie_id,
              movieTitle: fr.movie_title,
              userRating: userRating.rating,
              friendRating: fr.rating
            });
            ratingDifferenceSum += Math.abs(userRating.rating - fr.rating);
            sharedRatedCount++;
          }
        });

        // Find common liked movies
        const commonLikedMovies = friendMovieLikes.filter(fl => userLikedIds.has(fl.movie_id)).length;

        // Calculate compatibility score (0-100)
        let score = 50; // Base score

        // Boost for common likes (up to +30)
        score += Math.min(commonLikedMovies * 5, 30);

        // Boost for similar ratings (up to +20)
        if (sharedRatedCount > 0) {
          const avgDifference = ratingDifferenceSum / sharedRatedCount;
          score += Math.max(0, 20 - avgDifference * 4);
        }

        // Cap at 100
        score = Math.min(Math.round(score), 100);

        return {
          friendId,
          friendProfile: profile || { username: 'Unknown' },
          compatibilityScore: score,
          sharedGenres: [], // Would need TMDB API to get genres
          commonMovies: commonLikedMovies + sharedRatedCount,
          sharedRatings: sharedRatings.slice(0, 5)
        };
      });

      // Sort by compatibility score
      results.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

      // Cache results in taste_compatibility table
      for (const result of results) {
        await supabase
          .from('taste_compatibility')
          .upsert({
            user_id: user.id,
            friend_id: result.friendId,
            compatibility_score: result.compatibilityScore,
            shared_genres: result.sharedGenres,
            common_movies: result.commonMovies,
            last_calculated: new Date().toISOString()
          }, { onConflict: 'user_id,friend_id' });
      }

      setCompatibilities(results);
    } catch (error) {
      console.error('Error calculating compatibility:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    calculateCompatibility();
  }, [calculateCompatibility]);

  return { compatibilities, loading, refetch: calculateCompatibility };
};
