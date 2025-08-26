-- Fix the function search path issue
CREATE OR REPLACE FUNCTION public.update_user_stats()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  -- Update user stats when activities happen
  INSERT INTO public.user_stats (user_id, total_movies_watched, experience_points, last_activity_date)
  VALUES (NEW.user_id, 1, 10, CURRENT_DATE)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    total_movies_watched = user_stats.total_movies_watched + 1,
    experience_points = user_stats.experience_points + 10,
    last_activity_date = CURRENT_DATE,
    level = GREATEST(1, (user_stats.experience_points + 10) / 100),
    updated_at = now();
    
  RETURN NEW;
END;
$$;