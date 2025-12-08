-- Make friend_id nullable since we're using follower_id and following_id instead
ALTER TABLE public.social_connections ALTER COLUMN friend_id DROP NOT NULL;

-- Set a default value for friend_id to avoid null constraint issues
UPDATE public.social_connections SET friend_id = following_id WHERE friend_id IS NULL;