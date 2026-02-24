-- Allow authenticated users to view all tv_diary ratings (for community averages)
-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can view tv diary entries" ON public.tv_diary;

-- Create new policy: users can view their own entries OR any entry's rating data
-- We allow all authenticated users to SELECT from tv_diary so community ratings work
CREATE POLICY "Authenticated users can view tv diary entries"
ON public.tv_diary
FOR SELECT
USING (auth.uid() IS NOT NULL);