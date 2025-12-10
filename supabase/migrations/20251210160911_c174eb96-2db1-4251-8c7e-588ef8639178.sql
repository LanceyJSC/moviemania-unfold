-- Drop the existing restrictive SELECT policy
DROP POLICY IF EXISTS "Users can view ratings" ON public.user_ratings;

-- Create a new policy that allows anyone authenticated to read all ratings (needed for calculating averages)
CREATE POLICY "Anyone authenticated can view all ratings" 
ON public.user_ratings 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Update existing ratings to be public
UPDATE public.user_ratings SET is_public = true WHERE is_public = false;