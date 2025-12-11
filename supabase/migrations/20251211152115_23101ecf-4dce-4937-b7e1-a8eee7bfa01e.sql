-- Add media_type column to user_reviews to distinguish movie vs TV reviews
ALTER TABLE public.user_reviews 
ADD COLUMN IF NOT EXISTS media_type text DEFAULT 'movie';

-- Add an index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_user_reviews_media_type ON public.user_reviews(media_type);