-- Fix discussion_threads to allow null movie_id for general discussions
ALTER TABLE public.discussion_threads 
ALTER COLUMN movie_id DROP NOT NULL;

-- Add some test users and data for friend discovery
-- This will help users see the system working

-- First, let's add a test profile if it doesn't exist
INSERT INTO public.profiles (id, username, full_name, avatar_url) 
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'movie_lover_2024',
  'Alex MovieFan',
  NULL
) ON CONFLICT (id) DO NOTHING;

-- Add some liked movies for the test user to create suggestions
INSERT INTO public.watchlist (user_id, movie_id, movie_title, list_type) VALUES
('11111111-1111-1111-1111-111111111111', 10191, 'How to Train Your Dragon', 'liked'),
('11111111-1111-1111-1111-111111111111', 38365, 'Grown Ups', 'liked'),
('11111111-1111-1111-1111-111111111111', 299536, 'Avengers: Infinity War', 'liked')
ON CONFLICT DO NOTHING;

-- Add the test user to a club to create club-based suggestions
INSERT INTO public.club_memberships (club_id, user_id) 
SELECT id, '11111111-1111-1111-1111-111111111111'
FROM public.movie_clubs 
WHERE name = 'Horror Movie Fans'
LIMIT 1
ON CONFLICT DO NOTHING;