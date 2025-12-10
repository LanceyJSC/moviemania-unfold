-- Allow rating to be nullable for "watched but not rated" items
ALTER TABLE public.user_ratings ALTER COLUMN rating DROP NOT NULL;