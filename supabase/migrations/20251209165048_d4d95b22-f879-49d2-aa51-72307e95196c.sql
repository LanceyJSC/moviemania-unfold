-- Add runtime column to movie_diary (in minutes)
ALTER TABLE public.movie_diary ADD COLUMN IF NOT EXISTS runtime INTEGER DEFAULT NULL;

-- Add runtime column to tv_diary (in minutes per episode)
ALTER TABLE public.tv_diary ADD COLUMN IF NOT EXISTS runtime INTEGER DEFAULT NULL;