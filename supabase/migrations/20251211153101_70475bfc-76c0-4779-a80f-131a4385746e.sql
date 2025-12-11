-- Drop the media_type column from user_reviews
ALTER TABLE public.user_reviews DROP COLUMN IF EXISTS media_type;

-- Drop the index if it exists
DROP INDEX IF EXISTS idx_user_reviews_media_type;