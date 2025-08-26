import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface MovieClub {
  id: string;
  name: string;
  description?: string;
  genre: string;
  created_by: string;
  is_public: boolean;
  created_at: string;
  member_count?: number;
  is_member?: boolean;
}

export interface FriendSuggestion {
  id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  suggestion_type: string;
  shared_data: any;
  score: number;
  reason: string;
}

export const useMovieClubs = () => {
  const { user } = useAuth();
  const [clubs, setClubs] = useState<MovieClub[]>([]);
  const [suggestions, setSuggestions] = useState<FriendSuggestion[]>([]);
  const [userMemberships, setUserMemberships] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchClubsAndSuggestions();
    }
  }, [user]);

  const fetchClubsAndSuggestions = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Generate fresh friend suggestions
      await supabase.rpc('generate_friend_suggestions', { p_user_id: user.id });

      // Fetch movie clubs
      const { data: clubsData, error: clubsError } = await supabase
        .from('movie_clubs')
        .select('*')
        .eq('is_public', true);

      if (clubsError) throw clubsError;

      // Get user's current memberships
      const { data: memberships, error: membershipsError } = await supabase
        .from('club_memberships')
        .select('club_id')
        .eq('user_id', user.id);

      if (membershipsError) throw membershipsError;

      const memberClubIds = memberships?.map(m => m.club_id) || [];
      setUserMemberships(memberClubIds);

      // Count members for each club
      const clubsWithCounts = await Promise.all(
        (clubsData || []).map(async (club) => {
          const { count } = await supabase
            .from('club_memberships')
            .select('*', { count: 'exact', head: true })
            .eq('club_id', club.id);

          return {
            ...club,
            member_count: count || 0,
            is_member: memberClubIds.includes(club.id)
          };
        })
      );

      setClubs(clubsWithCounts);

      // Fetch friend suggestions with profiles
      const { data: suggestionsData, error: suggestionsError } = await supabase
        .from('friend_suggestions')
        .select('*')
        .eq('user_id', user.id)
        .order('score', { ascending: false })
        .limit(6);

      if (suggestionsError) throw suggestionsError;

      // Get profiles for suggested users
      if (suggestionsData && suggestionsData.length > 0) {
        const suggestedUserIds = suggestionsData.map(s => s.suggested_user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url')
          .in('id', suggestedUserIds);

        const formattedSuggestions = suggestionsData.map(suggestion => {
          const profile = profiles?.find(p => p.id === suggestion.suggested_user_id);
          return {
            id: profile?.id || '',
            username: profile?.username || '',
            full_name: profile?.full_name,
            avatar_url: profile?.avatar_url,
            suggestion_type: suggestion.suggestion_type,
            shared_data: suggestion.shared_data,
            score: suggestion.score,
            reason: formatSuggestionReason(suggestion)
          };
        }).filter(s => s.id); // Filter out any suggestions without valid profiles

        setSuggestions(formattedSuggestions);
      }

    } catch (error) {
      console.error('Error fetching clubs and suggestions:', error);
      toast.error('Failed to load community data');
    } finally {
      setLoading(false);
    }
  };

  const formatSuggestionReason = (suggestion: any): string => {
    const { suggestion_type, shared_data } = suggestion;
    
    switch (suggestion_type) {
      case 'similar_movies':
        const movieCount = shared_data?.count || 0;
        return `${movieCount} shared liked movie${movieCount !== 1 ? 's' : ''}`;
      case 'same_club':
        const clubCount = shared_data?.count || 0;
        return `${clubCount} shared movie club${clubCount !== 1 ? 's' : ''}`;
      default:
        return 'Similar movie interests';
    }
  };

  const joinClub = async (clubId: string) => {
    if (!user) {
      toast.error('Please sign in to join clubs');
      return;
    }

    try {
      console.log('Joining club:', clubId);
      const { error } = await supabase
        .from('club_memberships')
        .insert({
          club_id: clubId,
          user_id: user.id
        });

      console.log('Join club result:', error);

      if (error) {
        if (error.code === '23505') { // Unique violation
          toast.info('You are already a member of this club!');
          return;
        }
        throw error;
      }

      toast.success('Successfully joined the club! 🎬');
      
      // Update local state
      setClubs(prev => prev.map(club => 
        club.id === clubId 
          ? { ...club, is_member: true, member_count: (club.member_count || 0) + 1 }
          : club
      ));
    } catch (error) {
      console.error('Error joining club:', error);
      toast.error('Failed to join club');
    }
  };

  const leaveClub = async (clubId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('club_memberships')
        .delete()
        .eq('club_id', clubId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      setUserMemberships(prev => prev.filter(id => id !== clubId));
      setClubs(prev => prev.map(club => 
        club.id === clubId 
          ? { ...club, is_member: false, member_count: Math.max(0, (club.member_count || 0) - 1) }
          : club
      ));

      toast.success('Left the club');
    } catch (error) {
      console.error('Error leaving club:', error);
      toast.error('Failed to leave club');
    }
  };

  const sendFriendRequest = async (targetUserId: string) => {
    if (!user) {
      toast.error('Please sign in to send friend requests');
      return;
    }

    try {
      const { error } = await supabase
        .from('social_connections')
        .insert({
          follower_id: user.id,
          following_id: targetUserId,
          status: 'pending'
        });

      if (error) {
        if (error.code === '23505') { // Unique violation - already connected
          toast.info('Friend request already sent or you are already friends!');
          return;
        }
        throw error;
      }

      // Remove from suggestions
      setSuggestions(prev => prev.filter(s => s.id !== targetUserId));
      toast.success('Friend request sent! 🚀');
    } catch (error) {
      console.error('Error sending friend request:', error);
      toast.error('Failed to send friend request');
    }
  };

  return {
    clubs,
    suggestions,
    userMemberships,
    loading,
    joinClub,
    leaveClub,
    sendFriendRequest,
    refetch: fetchClubsAndSuggestions
  };
};