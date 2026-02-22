-- Drop old unique constraint that only uses user_id + movie_id
ALTER TABLE public.user_reviews DROP CONSTRAINT user_reviews_user_id_movie_id_key;

-- Create new unique constraint that includes season and episode numbers
-- This allows separate reviews for: show-level (nulls), and each episode
CREATE UNIQUE INDEX user_reviews_user_media_unique 
ON public.user_reviews (user_id, movie_id, COALESCE(season_number, -1), COALESCE(episode_number, -1));