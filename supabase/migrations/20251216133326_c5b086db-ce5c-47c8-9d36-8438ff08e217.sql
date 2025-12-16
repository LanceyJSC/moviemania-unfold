-- Drop the existing permissive SELECT policy
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;

-- Create a secure SELECT policy - users can only view their own roles
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Ensure RLS is enabled
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create policy that ONLY allows existing admins to manage OTHER users' roles (not their own)
-- This prevents self-promotion attacks
CREATE POLICY "Only admins can manage other users roles"
ON public.user_roles
FOR ALL
USING (
  public.has_role(auth.uid(), 'admin'::app_role) AND auth.uid() != user_id
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role) AND auth.uid() != user_id
);