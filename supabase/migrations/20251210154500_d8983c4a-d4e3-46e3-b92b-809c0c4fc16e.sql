-- Add is_public column to tv_diary (movie_diary already has it)
ALTER TABLE public.tv_diary ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false;

-- Add is_public column to watchlist
ALTER TABLE public.watchlist ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false;

-- Add is_public column to user_ratings
ALTER TABLE public.user_ratings ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false;

-- Drop existing restrictive SELECT policies and create new ones that allow public viewing

-- tv_diary: Update SELECT policy
DROP POLICY IF EXISTS "Users can view own tv diary" ON public.tv_diary;
CREATE POLICY "Users can view tv diary entries"
ON public.tv_diary FOR SELECT
USING (auth.uid() = user_id OR is_public = true);

-- watchlist: Update SELECT policy
DROP POLICY IF EXISTS "Users can view own watchlist" ON public.watchlist;
CREATE POLICY "Users can view watchlist entries"
ON public.watchlist FOR SELECT
USING (auth.uid() = user_id OR is_public = true);

-- user_ratings: Update SELECT policy (keep auth requirement for non-owners)
DROP POLICY IF EXISTS "Ratings viewable by authenticated users" ON public.user_ratings;
CREATE POLICY "Users can view ratings"
ON public.user_ratings FOR SELECT
USING (auth.uid() = user_id OR (auth.uid() IS NOT NULL AND is_public = true));