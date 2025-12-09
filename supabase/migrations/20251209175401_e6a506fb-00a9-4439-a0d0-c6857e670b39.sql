-- Fix 1: Profiles table - restrict SELECT to authenticated users only
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles viewable by authenticated users" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Fix 2: user_stats table - restrict SELECT to owner only
DROP POLICY IF EXISTS "Stats viewable by everyone" ON public.user_stats;
CREATE POLICY "Users can view own stats" 
ON public.user_stats 
FOR SELECT 
USING (auth.uid() = user_id);

-- Fix 3: activity_feed table - restrict to owner or followers
DROP POLICY IF EXISTS "Anyone can view activity" ON public.activity_feed;
CREATE POLICY "Activity viewable by owner or followers" 
ON public.activity_feed 
FOR SELECT 
USING (
  (auth.uid() = user_id) OR 
  (EXISTS (SELECT 1 FROM user_follows WHERE following_id = activity_feed.user_id AND follower_id = auth.uid()))
);

-- Fix 4: user_ratings table - restrict to authenticated users
DROP POLICY IF EXISTS "Ratings viewable by everyone" ON public.user_ratings;
CREATE POLICY "Ratings viewable by authenticated users" 
ON public.user_ratings 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Fix 5: ratings table - restrict to authenticated users  
DROP POLICY IF EXISTS "Ratings viewable by all" ON public.ratings;
CREATE POLICY "Ratings viewable by authenticated users" 
ON public.ratings 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Fix 6: user_locations - add UPDATE policy
CREATE POLICY "Users can update own locations" 
ON public.user_locations 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Fix 7: user_reviews - restrict to authenticated users
DROP POLICY IF EXISTS "Reviews viewable by everyone" ON public.user_reviews;
CREATE POLICY "Reviews viewable by authenticated users" 
ON public.user_reviews 
FOR SELECT 
USING (auth.uid() IS NOT NULL);