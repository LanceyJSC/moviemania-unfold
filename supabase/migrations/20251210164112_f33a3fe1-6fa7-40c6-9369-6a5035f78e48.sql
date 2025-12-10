-- Add unique constraint on user_id and movie_id for user_reviews table
-- This allows proper upsert functionality
ALTER TABLE public.user_reviews 
ADD CONSTRAINT user_reviews_user_id_movie_id_key UNIQUE (user_id, movie_id);