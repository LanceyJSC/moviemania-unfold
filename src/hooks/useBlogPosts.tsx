import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  featured_image: string | null;
  author_id: string | null;
  status: string;
  published_at: string | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string[] | null;
  created_at: string;
  updated_at: string;
  author?: {
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

export const useBlogPosts = () => {
  return useQuery({
    queryKey: ['blog-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select(`
          *,
          author:profiles!blog_posts_author_id_fkey(username, full_name, avatar_url)
        `)
        .eq('status', 'published')
        .order('published_at', { ascending: false });
      
      if (error) throw error;
      return data as BlogPost[];
    }
  });
};

export const useBlogPost = (slug: string) => {
  return useQuery({
    queryKey: ['blog-post', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select(`
          *,
          author:profiles!blog_posts_author_id_fkey(username, full_name, avatar_url)
        `)
        .eq('slug', slug)
        .single();
      
      if (error) throw error;
      return data as BlogPost;
    },
    enabled: !!slug
  });
};

export const useAdminBlogPosts = () => {
  return useQuery({
    queryKey: ['admin-blog-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select(`
          *,
          author:profiles!blog_posts_author_id_fkey(username, full_name, avatar_url)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as BlogPost[];
    }
  });
};

export const useCreateBlogPost = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (post: Record<string, unknown>) => {
      const { data, error } = await supabase
        .from('blog_posts')
        .insert(post as any)
        .select()
        .single();
      
      if (error) throw error;
      return data as BlogPost;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blog-posts'] });
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
    }
  });
};

export const useUpdateBlogPost = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Record<string, unknown>) => {
      const { data, error } = await supabase
        .from('blog_posts')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as BlogPost;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-blog-posts'] });
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
      queryClient.invalidateQueries({ queryKey: ['blog-post', data.slug] });
    }
  });
};

export const useDeleteBlogPost = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blog-posts'] });
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
    }
  });
};
