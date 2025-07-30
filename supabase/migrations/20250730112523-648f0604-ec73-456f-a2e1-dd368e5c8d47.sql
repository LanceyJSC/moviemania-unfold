-- Fix security warnings by setting search_path on functions
CREATE OR REPLACE FUNCTION public.get_mutual_friends(p_user_id UUID)
RETURNS TABLE (
  friend_id UUID,
  friend_username TEXT,
  friend_avatar_url TEXT,
  connection_date TIMESTAMP WITH TIME ZONE
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    CASE 
      WHEN sc1.follower_id = p_user_id THEN sc1.following_id
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
      WHEN sc1.follower_id = p_user_id THEN sc1.following_id
      ELSE sc1.follower_id
    END
  )
  WHERE (sc1.follower_id = p_user_id OR sc1.following_id = p_user_id)
    AND sc1.status = 'accepted'
    AND sc2.status = 'accepted';
$$;

-- Fix function to get friend's watchlist comparison
CREATE OR REPLACE FUNCTION public.get_friend_watchlist_comparison(p_user_id UUID, p_friend_id UUID)
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
SET search_path = public
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
  FULL OUTER JOIN watchlist fw ON uw.movie_id = fw.movie_id AND uw.user_id != fw.user_id
  WHERE (uw.user_id = p_user_id OR uw.user_id IS NULL)
    AND (fw.user_id = p_friend_id OR fw.user_id IS NULL)
    AND (uw.movie_id IS NOT NULL OR fw.movie_id IS NOT NULL);
$$;

-- Fix function to get friend's rating comparison
CREATE OR REPLACE FUNCTION public.get_friend_rating_comparison(p_user_id UUID, p_friend_id UUID)
RETURNS TABLE (
  movie_id INTEGER,
  movie_title TEXT,
  user_rating INTEGER,
  friend_rating INTEGER,
  rating_difference INTEGER
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    COALESCE(ur.movie_id, fr.movie_id) as movie_id,
    COALESCE(ur.movie_title, fr.movie_title) as movie_title,
    ur.rating as user_rating,
    fr.rating as friend_rating,
    ABS(COALESCE(ur.rating, 0) - COALESCE(fr.rating, 0)) as rating_difference
  FROM ratings ur
  FULL OUTER JOIN ratings fr ON ur.movie_id = fr.movie_id AND ur.user_id != fr.user_id
  WHERE (ur.user_id = p_user_id OR ur.user_id IS NULL)
    AND (fr.user_id = p_friend_id OR fr.user_id IS NULL)
    AND (ur.movie_id IS NOT NULL OR fr.movie_id IS NOT NULL)
  ORDER BY rating_difference DESC;
$$;

-- Fix handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'preferred_username',
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN NEW;
END;
$$;