-- Add media_type column to user_ratings
ALTER TABLE public.user_ratings ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT 'movie';

-- Add media_type column to enhanced_watchlist_items
ALTER TABLE public.enhanced_watchlist_items ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT 'movie';

-- Add media_type column to watchlist
ALTER TABLE public.watchlist ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT 'movie';

-- Add TV stats columns to user_stats
ALTER TABLE public.user_stats ADD COLUMN IF NOT EXISTS total_tv_shows_watched INTEGER DEFAULT 0;
ALTER TABLE public.user_stats ADD COLUMN IF NOT EXISTS total_tv_hours_watched INTEGER DEFAULT 0;