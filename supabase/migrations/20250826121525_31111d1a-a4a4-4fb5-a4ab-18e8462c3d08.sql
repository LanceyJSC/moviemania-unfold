-- Create movie clubs table
CREATE TABLE public.movie_clubs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  genre TEXT NOT NULL,
  created_by UUID NOT NULL,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create club memberships table
CREATE TABLE public.club_memberships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id UUID NOT NULL,
  user_id UUID NOT NULL,
  role TEXT DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(club_id, user_id)
);

-- Create activity-based friend suggestions table
CREATE TABLE public.friend_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  suggested_user_id UUID NOT NULL,
  suggestion_type TEXT NOT NULL, -- 'similar_movies', 'same_club', 'mutual_friends', 'activity_based'
  shared_data JSONB DEFAULT '{}',
  score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, suggested_user_id)
);

-- Enable RLS
ALTER TABLE public.movie_clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friend_suggestions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for movie_clubs
CREATE POLICY "Anyone can view public clubs" 
ON public.movie_clubs 
FOR SELECT 
USING (is_public = true);

CREATE POLICY "Users can create clubs" 
ON public.movie_clubs 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Club creators can update their clubs" 
ON public.movie_clubs 
FOR UPDATE 
USING (auth.uid() = created_by);

-- RLS Policies for club_memberships
CREATE POLICY "Users can view club memberships" 
ON public.club_memberships 
FOR SELECT 
USING (true);

CREATE POLICY "Users can join clubs" 
ON public.club_memberships 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave clubs" 
ON public.club_memberships 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for friend_suggestions
CREATE POLICY "Users can view their suggestions" 
ON public.friend_suggestions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can create suggestions" 
ON public.friend_suggestions 
FOR INSERT 
WITH CHECK (true);

-- Insert some starter movie clubs
INSERT INTO public.movie_clubs (name, description, genre, created_by) VALUES
('Horror Movie Fans', 'For those who love a good scare! Discuss the latest horror releases and classic scary movies.', 'Horror', '00000000-0000-0000-0000-000000000000'),
('Rom-Com Lovers', 'Feel-good movies that warm the heart. Share your favorite romantic comedies and find your next date night movie.', 'Romance', '00000000-0000-0000-0000-000000000000'),
('Sci-Fi Enthusiasts', 'Exploring the future through cinema. From space operas to dystopian futures, discuss all things sci-fi.', 'Science Fiction', '00000000-0000-0000-0000-000000000000'),
('Marvel & DC Universe', 'Superhero movie discussions, theories, and reviews. Which universe reigns supreme?', 'Action', '00000000-0000-0000-0000-000000000000'),
('Indie Film Society', 'Celebrating independent cinema and hidden gems. Discover movies you never knew existed.', 'Independent', '00000000-0000-0000-0000-000000000000'),
('Animation Station', 'Not just for kids! Discuss Pixar, Studio Ghibli, and all forms of animated storytelling.', 'Animation', '00000000-0000-0000-0000-000000000000');

-- Function to generate friend suggestions based on activity
CREATE OR REPLACE FUNCTION public.generate_friend_suggestions(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Clear existing suggestions for this user
  DELETE FROM public.friend_suggestions WHERE user_id = p_user_id;
  
  -- Suggestion 1: Users who liked similar movies
  INSERT INTO public.friend_suggestions (user_id, suggested_user_id, suggestion_type, shared_data, score)
  SELECT 
    p_user_id,
    w2.user_id,
    'similar_movies',
    jsonb_build_object('shared_movies', array_agg(w1.movie_title), 'count', count(*)),
    count(*)::integer
  FROM watchlist w1
  JOIN watchlist w2 ON w1.movie_id = w2.movie_id AND w1.user_id != w2.user_id
  WHERE w1.user_id = p_user_id 
    AND w1.list_type = 'liked' 
    AND w2.list_type = 'liked'
    AND w2.user_id != p_user_id
    AND NOT EXISTS (
      SELECT 1 FROM social_connections sc 
      WHERE ((sc.follower_id = p_user_id AND sc.following_id = w2.user_id) 
         OR (sc.following_id = p_user_id AND sc.follower_id = w2.user_id))
    )
  GROUP BY w2.user_id
  HAVING count(*) >= 2
  ON CONFLICT (user_id, suggested_user_id) DO UPDATE SET
    shared_data = EXCLUDED.shared_data,
    score = EXCLUDED.score;
    
  -- Suggestion 2: Users in same movie clubs
  INSERT INTO public.friend_suggestions (user_id, suggested_user_id, suggestion_type, shared_data, score)
  SELECT 
    p_user_id,
    cm2.user_id,
    'same_club',
    jsonb_build_object('shared_clubs', array_agg(mc.name), 'count', count(*)),
    count(*)::integer + 5 -- Bonus points for club overlap
  FROM club_memberships cm1
  JOIN club_memberships cm2 ON cm1.club_id = cm2.club_id AND cm1.user_id != cm2.user_id
  JOIN movie_clubs mc ON cm1.club_id = mc.id
  WHERE cm1.user_id = p_user_id 
    AND cm2.user_id != p_user_id
    AND NOT EXISTS (
      SELECT 1 FROM social_connections sc 
      WHERE ((sc.follower_id = p_user_id AND sc.following_id = cm2.user_id) 
         OR (sc.following_id = p_user_id AND sc.follower_id = cm2.user_id))
    )
  GROUP BY cm2.user_id
  ON CONFLICT (user_id, suggested_user_id) DO UPDATE SET
    shared_data = EXCLUDED.shared_data,
    score = EXCLUDED.score;
    
  -- Suggestion 3: Users with similar activity patterns (recent reviewers/raters)
  PERFORM 1; -- Placeholder for additional suggestion logic
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;