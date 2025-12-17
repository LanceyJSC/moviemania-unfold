-- Fix security issues across all tables

-- 1. PROFILES: Keep readable by authenticated (needed for social features) - this is intentional for a social app
-- The current policy is appropriate for a Letterboxd-style social app where profiles are meant to be public

-- 2. USER_RATINGS: Respect is_public flag
DROP POLICY IF EXISTS "Anyone authenticated can view all ratings" ON public.user_ratings;
CREATE POLICY "Users can view own ratings or public ratings"
ON public.user_ratings
FOR SELECT
USING (auth.uid() = user_id OR is_public = true);

-- 3. RATINGS: This appears to be a legacy table - restrict to owner only
DROP POLICY IF EXISTS "Ratings viewable by authenticated users" ON public.ratings;
CREATE POLICY "Users can view own ratings only"
ON public.ratings
FOR SELECT
USING (auth.uid() = user_id);

-- 4. USER_REVIEWS: Reviews are meant to be public in a social app - keep as is
-- This is intentional for a Letterboxd-style social app

-- 5. REVIEW_LIKES: Require authentication
DROP POLICY IF EXISTS "Anyone can view review likes" ON public.review_likes;
CREATE POLICY "Authenticated users can view review likes"
ON public.review_likes
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- 6. REVIEW_COMMENTS: Require authentication
DROP POLICY IF EXISTS "Anyone can view comments" ON public.review_comments;
CREATE POLICY "Authenticated users can view comments"
ON public.review_comments
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- 7. LIST_LIKES: Require authentication
DROP POLICY IF EXISTS "Anyone can view list likes" ON public.list_likes;
CREATE POLICY "Authenticated users can view list likes"
ON public.list_likes
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- 8. USER_FOLLOWS: Require authentication (social graph should be protected)
DROP POLICY IF EXISTS "Anyone can view follows" ON public.user_follows;
CREATE POLICY "Authenticated users can view follows"
ON public.user_follows
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- 9. NOTIFICATIONS: Add DELETE policy
CREATE POLICY "Users can delete own notifications"
ON public.notifications
FOR DELETE
USING (auth.uid() = user_id);

-- 10. ACTIVITY_FEED: Add DELETE policy
CREATE POLICY "Users can delete own activity"
ON public.activity_feed
FOR DELETE
USING (auth.uid() = user_id);

-- 11. CINEMA_SHOWTIMES: Add admin management policies
CREATE POLICY "Admins can manage cinema showtimes"
ON public.cinema_showtimes
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));