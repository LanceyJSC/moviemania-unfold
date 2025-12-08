-- Add watchlist table (for useSupabaseUserState)
CREATE TABLE public.watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  movie_id INTEGER NOT NULL,
  movie_title TEXT NOT NULL,
  movie_poster TEXT,
  list_type TEXT NOT NULL DEFAULT 'watchlist', -- 'liked', 'watchlist', 'currently_watching'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, movie_id, list_type)
);

ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own watchlist" ON public.watchlist FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage watchlist" ON public.watchlist FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update watchlist" ON public.watchlist FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete from watchlist" ON public.watchlist FOR DELETE USING (auth.uid() = user_id);

-- Add ratings table (for useSupabaseUserState)
CREATE TABLE public.ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  movie_id INTEGER NOT NULL,
  movie_title TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 10),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, movie_id)
);

ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ratings viewable by all" ON public.ratings FOR SELECT USING (true);
CREATE POLICY "Users can rate" ON public.ratings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update ratings" ON public.ratings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete ratings" ON public.ratings FOR DELETE USING (auth.uid() = user_id);

-- Add movie_id to cinema_showtimes
ALTER TABLE public.cinema_showtimes ADD COLUMN movie_id INTEGER;

-- Add following_id column to social_connections for the Social page
ALTER TABLE public.social_connections ADD COLUMN following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add description column to discussion_threads
ALTER TABLE public.discussion_threads ADD COLUMN description TEXT;

-- Add parent_comment_id to discussion_comments
ALTER TABLE public.discussion_comments ADD COLUMN parent_comment_id UUID REFERENCES public.discussion_comments(id) ON DELETE CASCADE;