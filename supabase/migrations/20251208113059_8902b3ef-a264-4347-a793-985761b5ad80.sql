-- Fix user_stats table to match expected type
ALTER TABLE public.user_stats 
  ADD COLUMN IF NOT EXISTS total_movies_watched INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_hours_watched INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_ratings INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS watching_streak INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_activity_date TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();

-- Add achievement_data to user_achievements
ALTER TABLE public.user_achievements ADD COLUMN IF NOT EXISTS achievement_data JSONB;

-- Add follower_id to social_connections for compatibility
ALTER TABLE public.social_connections ADD COLUMN IF NOT EXISTS follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create watch_parties table
CREATE TABLE IF NOT EXISTS public.watch_parties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  movie_title TEXT NOT NULL,
  party_name TEXT NOT NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  max_participants INTEGER DEFAULT 10,
  status TEXT NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.watch_parties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Watch parties are viewable by everyone" ON public.watch_parties FOR SELECT USING (true);
CREATE POLICY "Hosts can manage their parties" ON public.watch_parties FOR ALL USING (auth.uid() = host_id);

-- Create watch_party_participants table
CREATE TABLE IF NOT EXISTS public.watch_party_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id UUID REFERENCES public.watch_parties(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (party_id, user_id)
);

ALTER TABLE public.watch_party_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants viewable by everyone" ON public.watch_party_participants FOR SELECT USING (true);
CREATE POLICY "Users can join parties" ON public.watch_party_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave parties" ON public.watch_party_participants FOR DELETE USING (auth.uid() = user_id);