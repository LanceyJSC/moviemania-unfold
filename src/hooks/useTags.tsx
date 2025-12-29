import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface UserTag {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface MediaTag {
  id: string;
  user_id: string;
  tag_id: string;
  movie_id: number;
  media_type: string;
  created_at: string;
}

export const TAG_COLORS = [
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Slate', value: '#64748b' }
];

export const useTags = () => {
  const { user } = useAuth();
  const [tags, setTags] = useState<UserTag[]>([]);
  const [mediaTags, setMediaTags] = useState<MediaTag[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTags = async () => {
    if (!user) {
      setTags([]);
      setMediaTags([]);
      setLoading(false);
      return;
    }

    try {
      const [tagsResult, mediaTagsResult] = await Promise.all([
        supabase
          .from('user_tags')
          .select('*')
          .eq('user_id', user.id)
          .order('name'),
        supabase
          .from('media_tags')
          .select('*')
          .eq('user_id', user.id)
      ]);

      if (tagsResult.error) throw tagsResult.error;
      if (mediaTagsResult.error) throw mediaTagsResult.error;

      setTags(tagsResult.data || []);
      setMediaTags(mediaTagsResult.data || []);
    } catch (error) {
      console.error('Error fetching tags:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTag = async (name: string, color: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('user_tags')
        .insert({
          user_id: user.id,
          name,
          color
        })
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Tag created!');
      await fetchTags();
      return data;
    } catch (error) {
      console.error('Error creating tag:', error);
      toast.error('Failed to create tag');
      return null;
    }
  };

  const updateTag = async (id: string, updates: Partial<Pick<UserTag, 'name' | 'color'>>) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('user_tags')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      
      toast.success('Tag updated');
      await fetchTags();
      return true;
    } catch (error) {
      console.error('Error updating tag:', error);
      toast.error('Failed to update tag');
      return false;
    }
  };

  const deleteTag = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('user_tags')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      
      toast.success('Tag deleted');
      await fetchTags();
      return true;
    } catch (error) {
      console.error('Error deleting tag:', error);
      toast.error('Failed to delete tag');
      return false;
    }
  };

  const addTagToMedia = async (tagId: string, movieId: number, mediaType: string = 'movie') => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('media_tags')
        .insert({
          user_id: user.id,
          tag_id: tagId,
          movie_id: movieId,
          media_type: mediaType
        });

      if (error) throw error;
      
      await fetchTags();
      return true;
    } catch (error) {
      console.error('Error adding tag to media:', error);
      return false;
    }
  };

  const removeTagFromMedia = async (tagId: string, movieId: number, mediaType: string = 'movie') => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('media_tags')
        .delete()
        .eq('user_id', user.id)
        .eq('tag_id', tagId)
        .eq('movie_id', movieId)
        .eq('media_type', mediaType);

      if (error) throw error;
      
      await fetchTags();
      return true;
    } catch (error) {
      console.error('Error removing tag from media:', error);
      return false;
    }
  };

  const getTagsForMedia = (movieId: number, mediaType: string = 'movie') => {
    const mediaTagIds = mediaTags
      .filter(mt => mt.movie_id === movieId && mt.media_type === mediaType)
      .map(mt => mt.tag_id);
    return tags.filter(t => mediaTagIds.includes(t.id));
  };

  useEffect(() => {
    fetchTags();
  }, [user]);

  return {
    tags,
    mediaTags,
    loading,
    createTag,
    updateTag,
    deleteTag,
    addTagToMedia,
    removeTagFromMedia,
    getTagsForMedia,
    refetch: fetchTags
  };
};
