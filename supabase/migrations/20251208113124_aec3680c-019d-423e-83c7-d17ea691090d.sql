-- Create community_lists table
CREATE TABLE IF NOT EXISTS public.community_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  is_collaborative BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.community_lists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own lists" ON public.community_lists FOR SELECT USING (auth.uid() = user_id OR is_public);
CREATE POLICY "Users can create lists" ON public.community_lists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own lists" ON public.community_lists FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own lists" ON public.community_lists FOR DELETE USING (auth.uid() = user_id);

-- Create community_list_items table
CREATE TABLE IF NOT EXISTS public.community_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID REFERENCES public.community_lists(id) ON DELETE CASCADE NOT NULL,
  movie_id INTEGER NOT NULL,
  movie_title TEXT NOT NULL,
  movie_poster TEXT,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.community_list_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "List items viewable if list is viewable" ON public.community_list_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.community_lists WHERE id = list_id AND (user_id = auth.uid() OR is_public))
);
CREATE POLICY "List owners can manage items" ON public.community_list_items FOR ALL USING (
  EXISTS (SELECT 1 FROM public.community_lists WHERE id = list_id AND user_id = auth.uid())
);

-- Drop old constraint and add new one for social_connections (include follower_id and following_id)
ALTER TABLE public.social_connections DROP CONSTRAINT IF EXISTS social_connections_user_id_friend_id_key;
ALTER TABLE public.social_connections ADD CONSTRAINT social_connections_follower_following_unique UNIQUE (follower_id, following_id);

-- Update generate_friend_suggestions to accept parameter
DROP FUNCTION IF EXISTS public.generate_friend_suggestions();
CREATE OR REPLACE FUNCTION public.generate_friend_suggestions(p_user_id UUID DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- This is a placeholder - suggestions are generated in application code
  NULL;
END;
$$;