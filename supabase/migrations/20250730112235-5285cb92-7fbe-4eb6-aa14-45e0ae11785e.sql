-- Create table for movie swipe preferences (Tinder-style)
CREATE TABLE public.movie_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  movie_id INTEGER NOT NULL,
  movie_title TEXT NOT NULL,
  movie_poster TEXT,
  preference TEXT NOT NULL CHECK (preference IN ('like', 'dislike')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, movie_id)
);

-- Enable RLS
ALTER TABLE public.movie_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own preferences" 
ON public.movie_preferences 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" 
ON public.movie_preferences 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" 
ON public.movie_preferences 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own preferences" 
ON public.movie_preferences 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to get mutual friends
CREATE OR REPLACE FUNCTION public.get_mutual_friends(user_id UUID)
RETURNS TABLE (
  friend_id UUID,
  friend_username TEXT,
  friend_avatar_url TEXT,
  connection_date TIMESTAMP WITH TIME ZONE
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT 
    CASE 
      WHEN sc1.follower_id = user_id THEN sc1.following_id
      ELSE sc1.follower_id
    END as friend_id,
    p.username as friend_username,
    p.avatar_url as friend_avatar_url,
    sc1.created_at as connection_date
  FROM social_connections sc1
  JOIN social_connections sc2 ON (
    (sc1.follower_id = sc2.following_id AND sc1.following_id = sc2.follower_id)
  )
  JOIN profiles p ON (
    p.id = CASE 
      WHEN sc1.follower_id = user_id THEN sc1.following_id
      ELSE sc1.follower_id
    END
  )
  WHERE (sc1.follower_id = user_id OR sc1.following_id = user_id)
    AND sc1.status = 'accepted'
    AND sc2.status = 'accepted';
$$;

-- Create function to get friend's watchlist comparison
CREATE OR REPLACE FUNCTION public.get_friend_watchlist_comparison(user_id UUID, friend_id UUID)
RETURNS TABLE (
  movie_id INTEGER,
  movie_title TEXT,
  movie_poster TEXT,
  in_user_watchlist BOOLEAN,
  in_friend_watchlist BOOLEAN,
  user_list_type TEXT,
  friend_list_type TEXT
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT 
    COALESCE(uw.movie_id, fw.movie_id) as movie_id,
    COALESCE(uw.movie_title, fw.movie_title) as movie_title,
    COALESCE(uw.movie_poster, fw.movie_poster) as movie_poster,
    (uw.movie_id IS NOT NULL) as in_user_watchlist,
    (fw.movie_id IS NOT NULL) as in_friend_watchlist,
    uw.list_type as user_list_type,
    fw.list_type as friend_list_type
  FROM watchlist uw
  FULL OUTER JOIN watchlist fw ON uw.movie_id = fw.movie_id
  WHERE (uw.user_id = user_id OR uw.user_id IS NULL)
    AND (fw.user_id = friend_id OR fw.user_id IS NULL)
    AND (uw.movie_id IS NOT NULL OR fw.movie_id IS NOT NULL);
$$;

-- Create function to get friend's rating comparison
CREATE OR REPLACE FUNCTION public.get_friend_rating_comparison(user_id UUID, friend_id UUID)
RETURNS TABLE (
  movie_id INTEGER,
  movie_title TEXT,
  user_rating INTEGER,
  friend_rating INTEGER,
  rating_difference INTEGER
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT 
    COALESCE(ur.movie_id, fr.movie_id) as movie_id,
    COALESCE(ur.movie_title, fr.movie_title) as movie_title,
    ur.rating as user_rating,
    fr.rating as friend_rating,
    ABS(COALESCE(ur.rating, 0) - COALESCE(fr.rating, 0)) as rating_difference
  FROM ratings ur
  FULL OUTER JOIN ratings fr ON ur.movie_id = fr.movie_id
  WHERE (ur.user_id = user_id OR ur.user_id IS NULL)
    AND (fr.user_id = friend_id OR fr.user_id IS NULL)
    AND (ur.movie_id IS NOT NULL OR fr.movie_id IS NOT NULL)
  ORDER BY rating_difference DESC;
$$;