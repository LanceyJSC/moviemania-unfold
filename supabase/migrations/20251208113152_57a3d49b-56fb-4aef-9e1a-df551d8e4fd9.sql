-- Make user_id nullable since we're using follower_id instead
ALTER TABLE public.social_connections ALTER COLUMN user_id DROP NOT NULL;