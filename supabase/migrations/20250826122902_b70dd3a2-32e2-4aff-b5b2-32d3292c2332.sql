-- Create user roles enum and table
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'member');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'member',
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  assigned_by UUID REFERENCES auth.users(id),
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

-- Create function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY 
    CASE role 
      WHEN 'admin' THEN 1
      WHEN 'moderator' THEN 2
      WHEN 'member' THEN 3
    END
  LIMIT 1;
$$;

-- RLS Policies for user_roles
CREATE POLICY "Users can view all roles" ON public.user_roles
  FOR SELECT USING (true);

CREATE POLICY "Only admins can manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Update movie_clubs policies to require admin role
DROP POLICY IF EXISTS "Users can create clubs" ON public.movie_clubs;
CREATE POLICY "Only admins can create clubs" ON public.movie_clubs
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Insert admin role for first user (you'll need to manually assign this)
-- This is just a placeholder - you'll need to update with actual user ID
-- INSERT INTO public.user_roles (user_id, role) 
-- VALUES ('YOUR_USER_ID_HERE', 'admin');

-- Enable realtime for discussions and comments
ALTER TABLE public.discussion_threads REPLICA IDENTITY FULL;
ALTER TABLE public.discussion_comments REPLICA IDENTITY FULL;

-- Add realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.discussion_threads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.discussion_comments;