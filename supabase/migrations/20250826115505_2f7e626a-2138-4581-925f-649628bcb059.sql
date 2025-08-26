-- Create enhanced social features
CREATE TABLE public.friend_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  friend_id UUID NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('watched', 'liked', 'rated', 'added_to_watchlist', 'reviewed')),
  movie_id INTEGER NOT NULL,
  movie_title TEXT NOT NULL,
  movie_poster TEXT,
  activity_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.friend_activities ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view friend activities" 
ON public.friend_activities 
FOR SELECT 
USING (
  friend_id = auth.uid() AND 
  EXISTS (
    SELECT 1 FROM social_connections 
    WHERE follower_id = auth.uid() 
    AND following_id = friend_activities.user_id 
    AND status = 'accepted'
  )
);

CREATE POLICY "System can create friend activities" 
ON public.friend_activities 
FOR INSERT 
WITH CHECK (true);

-- Create watchlist collections for better organization
CREATE TABLE public.watchlist_collections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  color TEXT DEFAULT '#4F46E5',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.watchlist_collections ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage own collections" 
ON public.watchlist_collections 
FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view public collections" 
ON public.watchlist_collections 
FOR SELECT 
USING (is_public = true OR auth.uid() = user_id);

-- Create enhanced watchlist items with more features
CREATE TABLE public.enhanced_watchlist_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  collection_id UUID REFERENCES public.watchlist_collections(id) ON DELETE CASCADE,
  movie_id INTEGER NOT NULL,
  movie_title TEXT NOT NULL,
  movie_poster TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  personal_notes TEXT,
  mood_tags TEXT[] DEFAULT '{}',
  progress_percent INTEGER DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  expected_watch_date DATE,  
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  watched_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.enhanced_watchlist_items ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage own watchlist items" 
ON public.enhanced_watchlist_items 
FOR ALL 
USING (auth.uid() = user_id);

-- Create user stats tracking
CREATE TABLE public.user_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  total_movies_watched INTEGER DEFAULT 0,
  total_hours_watched INTEGER DEFAULT 0,
  total_ratings INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0,
  favorite_genres TEXT[] DEFAULT '{}',
  watching_streak INTEGER DEFAULT 0,
  last_activity_date DATE DEFAULT CURRENT_DATE,
  level INTEGER DEFAULT 1,
  experience_points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own stats" 
ON public.user_stats 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can manage user stats" 
ON public.user_stats 
FOR ALL 
USING (true);

-- Create movie discussion threads for social interaction
CREATE TABLE public.movie_discussions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  movie_id INTEGER NOT NULL,
  movie_title TEXT NOT NULL,
  created_by UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_spoiler BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.movie_discussions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view discussions" 
ON public.movie_discussions 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create discussions" 
ON public.movie_discussions 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own discussions" 
ON public.movie_discussions 
FOR UPDATE 
USING (auth.uid() = created_by);

-- Create watch parties for social viewing
CREATE TABLE public.watch_parties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  host_id UUID NOT NULL,
  movie_id INTEGER NOT NULL,
  movie_title TEXT NOT NULL,
  party_name TEXT NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  max_participants INTEGER DEFAULT 10,
  is_public BOOLEAN DEFAULT false,
  party_code TEXT UNIQUE DEFAULT substr(gen_random_uuid()::text, 1, 8),
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'ended', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.watch_parties ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view public parties and own parties" 
ON public.watch_parties 
FOR SELECT 
USING (is_public = true OR auth.uid() = host_id);

CREATE POLICY "Users can create own parties" 
ON public.watch_parties 
FOR INSERT 
WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Users can update own parties" 
ON public.watch_parties 
FOR UPDATE 
USING (auth.uid() = host_id);

-- Create watch party participants
CREATE TABLE public.watch_party_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  party_id UUID NOT NULL REFERENCES public.watch_parties(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT DEFAULT 'joined' CHECK (status IN ('joined', 'left', 'kicked')),
  UNIQUE(party_id, user_id)
);

-- Enable RLS
ALTER TABLE public.watch_party_participants ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage own participation" 
ON public.watch_party_participants 
FOR ALL 
USING (auth.uid() = user_id);

-- Create direct messages for social interaction
CREATE TABLE public.direct_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'movie_recommendation', 'watch_party_invite')),
  movie_data JSONB,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view messages they sent or received" 
ON public.direct_messages 
FOR SELECT 
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can send messages" 
ON public.direct_messages 
FOR INSERT 
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update messages they received" 
ON public.direct_messages 
FOR UPDATE 
USING (auth.uid() = recipient_id);

-- Create function to update user stats
CREATE OR REPLACE FUNCTION public.update_user_stats()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for user activities
CREATE TRIGGER update_stats_on_activity
AFTER INSERT ON public.user_activities
FOR EACH ROW EXECUTE FUNCTION public.update_user_stats();