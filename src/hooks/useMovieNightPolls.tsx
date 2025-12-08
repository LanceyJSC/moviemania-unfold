import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PollOption {
  id: string;
  movieId: number;
  movieTitle: string;
  moviePoster?: string;
  addedBy: string;
  voteCount: number;
  hasVoted: boolean;
}

interface MovieNightPoll {
  id: string;
  title: string;
  createdBy: string;
  createdByProfile?: { username: string; avatar_url?: string };
  scheduledAt?: string;
  closesAt?: string;
  status: string;
  winnerMovieId?: number;
  options: PollOption[];
  totalVotes: number;
  createdAt: string;
}

export const useMovieNightPolls = () => {
  const { user } = useAuth();
  const [polls, setPolls] = useState<MovieNightPoll[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPolls = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get user's friends
      const { data: connections } = await supabase
        .from('social_connections')
        .select('following_id')
        .eq('follower_id', user.id)
        .eq('status', 'accepted');

      const friendIds = [user.id, ...(connections?.map(c => c.following_id).filter(Boolean) as string[] || [])];

      // Get polls created by user or friends
      const { data: pollsData, error } = await supabase
        .from('movie_night_polls')
        .select('*')
        .in('created_by', friendIds)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!pollsData || pollsData.length === 0) {
        setPolls([]);
        setLoading(false);
        return;
      }

      const pollIds = pollsData.map(p => p.id);
      const creatorIds = [...new Set(pollsData.map(p => p.created_by))];

      // Get options
      const { data: optionsData } = await supabase
        .from('movie_night_poll_options')
        .select('*')
        .in('poll_id', pollIds);

      // Get votes
      const { data: votesData } = await supabase
        .from('movie_night_poll_votes')
        .select('*')
        .in('poll_id', pollIds);

      // Get creator profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', creatorIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      const formattedPolls: MovieNightPoll[] = pollsData.map(poll => {
        const pollOptions = optionsData?.filter(o => o.poll_id === poll.id) || [];
        const pollVotes = votesData?.filter(v => v.poll_id === poll.id) || [];

        return {
          id: poll.id,
          title: poll.title,
          createdBy: poll.created_by,
          createdByProfile: profileMap.get(poll.created_by),
          scheduledAt: poll.scheduled_at || undefined,
          closesAt: poll.closes_at || undefined,
          status: poll.status,
          winnerMovieId: poll.winner_movie_id || undefined,
          options: pollOptions.map(option => ({
            id: option.id,
            movieId: option.movie_id,
            movieTitle: option.movie_title,
            moviePoster: option.movie_poster || undefined,
            addedBy: option.added_by,
            voteCount: pollVotes.filter(v => v.option_id === option.id).length,
            hasVoted: pollVotes.some(v => v.option_id === option.id && v.user_id === user.id)
          })),
          totalVotes: pollVotes.length,
          createdAt: poll.created_at
        };
      });

      setPolls(formattedPolls);
    } catch (error) {
      console.error('Error fetching polls:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createPoll = async (title: string, scheduledAt?: string, closesAt?: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('movie_night_polls')
        .insert({
          title,
          created_by: user.id,
          scheduled_at: scheduledAt,
          closes_at: closesAt,
          status: 'open'
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Movie night poll created!');
      fetchPolls();
      return data;
    } catch (error) {
      console.error('Error creating poll:', error);
      toast.error('Failed to create poll');
      return null;
    }
  };

  const addOption = async (pollId: string, movieId: number, movieTitle: string, moviePoster?: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('movie_night_poll_options')
        .insert({
          poll_id: pollId,
          movie_id: movieId,
          movie_title: movieTitle,
          movie_poster: moviePoster,
          added_by: user.id
        });

      if (error) throw error;

      toast.success('Option added!');
      fetchPolls();
      return true;
    } catch (error) {
      console.error('Error adding option:', error);
      toast.error('Failed to add option');
      return false;
    }
  };

  const vote = async (pollId: string, optionId: string) => {
    if (!user) return false;

    try {
      // Remove existing vote first (if any)
      await supabase
        .from('movie_night_poll_votes')
        .delete()
        .eq('poll_id', pollId)
        .eq('user_id', user.id);

      // Cast new vote
      const { error } = await supabase
        .from('movie_night_poll_votes')
        .insert({
          poll_id: pollId,
          option_id: optionId,
          user_id: user.id
        });

      if (error) throw error;

      toast.success('Vote cast!');
      fetchPolls();
      return true;
    } catch (error) {
      console.error('Error voting:', error);
      toast.error('Failed to vote');
      return false;
    }
  };

  const closePoll = async (pollId: string) => {
    if (!user) return false;

    try {
      const poll = polls.find(p => p.id === pollId);
      if (!poll) return false;

      // Find winner
      const winner = poll.options.reduce((prev, curr) => 
        curr.voteCount > prev.voteCount ? curr : prev
      , poll.options[0]);

      const { error } = await supabase
        .from('movie_night_polls')
        .update({
          status: 'closed',
          winner_movie_id: winner?.movieId
        })
        .eq('id', pollId);

      if (error) throw error;

      toast.success('Poll closed!');
      fetchPolls();
      return true;
    } catch (error) {
      console.error('Error closing poll:', error);
      toast.error('Failed to close poll');
      return false;
    }
  };

  useEffect(() => {
    fetchPolls();
  }, [fetchPolls]);

  return {
    polls,
    loading,
    createPoll,
    addOption,
    vote,
    closePoll,
    refetch: fetchPolls
  };
};
