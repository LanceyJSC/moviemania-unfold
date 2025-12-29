-- Smart list definitions for Pro users
CREATE TABLE public.smart_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  criteria JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.smart_lists ENABLE ROW LEVEL SECURITY;

-- RLS policies for smart_lists
CREATE POLICY "Users can view own smart lists"
ON public.smart_lists FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create smart lists"
ON public.smart_lists FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own smart lists"
ON public.smart_lists FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own smart lists"
ON public.smart_lists FOR DELETE
USING (auth.uid() = user_id);

-- Custom tags for media items
CREATE TABLE public.user_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#ef4444',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_tags ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_tags
CREATE POLICY "Users can view own tags"
ON public.user_tags FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create tags"
ON public.user_tags FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tags"
ON public.user_tags FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tags"
ON public.user_tags FOR DELETE
USING (auth.uid() = user_id);

-- Media tags junction table
CREATE TABLE public.media_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  tag_id UUID NOT NULL REFERENCES public.user_tags(id) ON DELETE CASCADE,
  movie_id INTEGER NOT NULL,
  media_type TEXT DEFAULT 'movie',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, tag_id, movie_id, media_type)
);

-- Enable RLS
ALTER TABLE public.media_tags ENABLE ROW LEVEL SECURITY;

-- RLS policies for media_tags
CREATE POLICY "Users can view own media tags"
ON public.media_tags FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create media tags"
ON public.media_tags FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own media tags"
ON public.media_tags FOR DELETE
USING (auth.uid() = user_id);

-- Add profile customization columns
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS theme_color TEXT DEFAULT 'default',
ADD COLUMN IF NOT EXISTS featured_badges TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS profile_effects TEXT DEFAULT 'none';

-- Create trigger for smart_lists updated_at
CREATE TRIGGER update_smart_lists_updated_at
BEFORE UPDATE ON public.smart_lists
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();