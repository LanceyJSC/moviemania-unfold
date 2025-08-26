-- Fix discussion_threads to allow null movie_id for general discussions
ALTER TABLE public.discussion_threads 
ALTER COLUMN movie_id DROP NOT NULL;