
-- User follows (follow other users)
CREATE TABLE public.user_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL,
  following_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Review likes
CREATE TABLE public.review_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  review_id UUID REFERENCES public.user_reviews(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, review_id)
);

-- Review comments
CREATE TABLE public.review_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  review_id UUID REFERENCES public.user_reviews(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User lists (custom curated lists)
CREATE TABLE public.user_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- List items
CREATE TABLE public.list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID REFERENCES public.user_lists(id) ON DELETE CASCADE,
  movie_id INTEGER NOT NULL,
  movie_title TEXT NOT NULL,
  movie_poster TEXT,
  position INTEGER DEFAULT 0,
  notes TEXT,
  added_at TIMESTAMPTZ DEFAULT now()
);

-- List likes
CREATE TABLE public.list_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  list_id UUID REFERENCES public.user_lists(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, list_id)
);

-- Activity feed
CREATE TABLE public.activity_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  activity_type TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  movie_id INTEGER,
  movie_title TEXT,
  movie_poster TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add follower/following counts to profiles (for performance)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS follower_count INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;

-- Make movie_diary optionally public
ALTER TABLE public.movie_diary ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;

-- Enable RLS on all new tables
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.list_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;

-- user_follows policies
CREATE POLICY "Anyone can view follows" ON public.user_follows FOR SELECT USING (true);
CREATE POLICY "Users can follow others" ON public.user_follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow" ON public.user_follows FOR DELETE USING (auth.uid() = follower_id);

-- review_likes policies
CREATE POLICY "Anyone can view review likes" ON public.review_likes FOR SELECT USING (true);
CREATE POLICY "Users can like reviews" ON public.review_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike reviews" ON public.review_likes FOR DELETE USING (auth.uid() = user_id);

-- review_comments policies
CREATE POLICY "Anyone can view comments" ON public.review_comments FOR SELECT USING (true);
CREATE POLICY "Users can add comments" ON public.review_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON public.review_comments FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can update own comments" ON public.review_comments FOR UPDATE USING (auth.uid() = user_id);

-- user_lists policies
CREATE POLICY "Anyone can view public lists" ON public.user_lists FOR SELECT USING (is_public OR auth.uid() = user_id);
CREATE POLICY "Users can create lists" ON public.user_lists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own lists" ON public.user_lists FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own lists" ON public.user_lists FOR DELETE USING (auth.uid() = user_id);

-- list_items policies
CREATE POLICY "Anyone can view public list items" ON public.list_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.user_lists WHERE id = list_id AND (is_public OR user_id = auth.uid()))
);
CREATE POLICY "List owners can add items" ON public.list_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.user_lists WHERE id = list_id AND user_id = auth.uid())
);
CREATE POLICY "List owners can update items" ON public.list_items FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.user_lists WHERE id = list_id AND user_id = auth.uid())
);
CREATE POLICY "List owners can delete items" ON public.list_items FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.user_lists WHERE id = list_id AND user_id = auth.uid())
);

-- list_likes policies
CREATE POLICY "Anyone can view list likes" ON public.list_likes FOR SELECT USING (true);
CREATE POLICY "Users can like lists" ON public.list_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike lists" ON public.list_likes FOR DELETE USING (auth.uid() = user_id);

-- activity_feed policies
CREATE POLICY "Anyone can view activity" ON public.activity_feed FOR SELECT USING (true);
CREATE POLICY "Users can create own activity" ON public.activity_feed FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Update movie_diary policy for public entries
DROP POLICY IF EXISTS "Users can view own movie diary" ON public.movie_diary;
CREATE POLICY "Users can view diary entries" ON public.movie_diary FOR SELECT USING (auth.uid() = user_id OR is_public = true);

-- Function to update follower counts
CREATE OR REPLACE FUNCTION public.update_follow_counts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
    UPDATE profiles SET follower_count = follower_count + 1 WHERE id = NEW.following_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE profiles SET following_count = GREATEST(following_count - 1, 0) WHERE id = OLD.follower_id;
    UPDATE profiles SET follower_count = GREATEST(follower_count - 1, 0) WHERE id = OLD.following_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Trigger for follow counts
CREATE TRIGGER on_follow_change
  AFTER INSERT OR DELETE ON public.user_follows
  FOR EACH ROW EXECUTE FUNCTION public.update_follow_counts();

-- Index for performance
CREATE INDEX idx_user_follows_follower ON public.user_follows(follower_id);
CREATE INDEX idx_user_follows_following ON public.user_follows(following_id);
CREATE INDEX idx_activity_feed_user ON public.activity_feed(user_id);
CREATE INDEX idx_activity_feed_created ON public.activity_feed(created_at DESC);
CREATE INDEX idx_review_likes_review ON public.review_likes(review_id);
CREATE INDEX idx_list_items_list ON public.list_items(list_id);
