import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface MovieDiaryEntry {
  id: string;
  user_id: string;
  movie_id: number;
  movie_title: string;
  movie_poster: string | null;
  watched_date: string;
  notes: string | null;
  rating: number | null;
  runtime?: number | null;
  created_at: string;
}

export interface TVDiaryEntry {
  id: string;
  user_id: string;
  tv_id: number;
  tv_title: string;
  tv_poster: string | null;
  season_number: number | null;
  episode_number: number | null;
  watched_date: string;
  notes: string | null;
  rating: number | null;
  runtime?: number | null;
  created_at: string;
}

export const useDiary = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const movieDiaryQuery = useQuery({
    queryKey: ['movie-diary', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('movie_diary')
        .select('*')
        .eq('user_id', user.id)
        .order('watched_date', { ascending: false });
      if (error) throw error;
      return data as MovieDiaryEntry[];
    },
    enabled: !!user?.id,
  });

  const tvDiaryQuery = useQuery({
    queryKey: ['tv-diary', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('tv_diary')
        .select('*')
        .eq('user_id', user.id)
        .order('watched_date', { ascending: false });
      if (error) throw error;
      return data as TVDiaryEntry[];
    },
    enabled: !!user?.id,
  });

  const addMovieDiaryEntry = useMutation({
    mutationFn: async (entry: Omit<MovieDiaryEntry, 'id' | 'user_id' | 'created_at'>) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('movie_diary')
        .insert({ ...entry, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movie-diary'] });
      toast.success('Added to movie diary');
    },
    onError: (error) => {
      toast.error('Failed to add to diary');
      console.error(error);
    },
  });

  const addTVDiaryEntry = useMutation({
    mutationFn: async (entry: Omit<TVDiaryEntry, 'id' | 'user_id' | 'created_at'>) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('tv_diary')
        .insert({ ...entry, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tv-diary'] });
      toast.success('Added to TV diary');
    },
    onError: (error) => {
      toast.error('Failed to add to diary');
      console.error(error);
    },
  });

  const updateMovieDiaryEntry = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<MovieDiaryEntry> & { id: string }) => {
      const { data, error } = await supabase
        .from('movie_diary')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movie-diary'] });
      toast.success('Diary entry updated');
    },
  });

  const updateTVDiaryEntry = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TVDiaryEntry> & { id: string }) => {
      const { data, error } = await supabase
        .from('tv_diary')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tv-diary'] });
      toast.success('Diary entry updated');
    },
  });

  const deleteMovieDiaryEntry = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('movie_diary')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movie-diary'] });
      toast.success('Entry deleted');
    },
  });

  const deleteTVDiaryEntry = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tv_diary')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tv-diary'] });
      toast.success('Entry deleted');
    },
  });

  return {
    movieDiary: movieDiaryQuery.data || [],
    tvDiary: tvDiaryQuery.data || [],
    isLoading: movieDiaryQuery.isLoading || tvDiaryQuery.isLoading,
    addMovieDiaryEntry,
    addTVDiaryEntry,
    updateMovieDiaryEntry,
    updateTVDiaryEntry,
    deleteMovieDiaryEntry,
    deleteTVDiaryEntry,
  };
};
