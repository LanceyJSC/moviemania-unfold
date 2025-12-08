-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'member');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- Cinemas table
CREATE TABLE public.cinemas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  country TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  website TEXT,
  phone TEXT,
  chain TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.cinemas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cinemas are viewable by everyone" ON public.cinemas FOR SELECT USING (true);
CREATE POLICY "Admins can manage cinemas" ON public.cinemas FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Cinema showtimes table
CREATE TABLE public.cinema_showtimes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cinema_id UUID REFERENCES public.cinemas(id) ON DELETE CASCADE NOT NULL,
  movie_title TEXT NOT NULL,
  showtime TIMESTAMP WITH TIME ZONE NOT NULL,
  booking_url TEXT,
  ticket_price TEXT,
  scraped_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.cinema_showtimes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Showtimes are viewable by everyone" ON public.cinema_showtimes FOR SELECT USING (true);

-- Movie clubs table
CREATE TABLE public.movie_clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  genre TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.movie_clubs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public clubs viewable by everyone" ON public.movie_clubs FOR SELECT USING (is_public OR auth.uid() = created_by);
CREATE POLICY "Users can create clubs" ON public.movie_clubs FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Creators can update clubs" ON public.movie_clubs FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Creators can delete clubs" ON public.movie_clubs FOR DELETE USING (auth.uid() = created_by);

-- Club memberships table
CREATE TABLE public.club_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID REFERENCES public.movie_clubs(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (club_id, user_id)
);

ALTER TABLE public.club_memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Memberships viewable by members" ON public.club_memberships FOR SELECT USING (true);
CREATE POLICY "Users can join clubs" ON public.club_memberships FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave clubs" ON public.club_memberships FOR DELETE USING (auth.uid() = user_id);

-- Discussion threads table
CREATE TABLE public.discussion_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID REFERENCES public.movie_clubs(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  movie_id INTEGER,
  movie_title TEXT,
  movie_poster TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.discussion_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Threads viewable by everyone" ON public.discussion_threads FOR SELECT USING (true);
CREATE POLICY "Members can create threads" ON public.discussion_threads FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Creators can update threads" ON public.discussion_threads FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Creators can delete threads" ON public.discussion_threads FOR DELETE USING (auth.uid() = created_by);

-- Discussion comments table
CREATE TABLE public.discussion_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID REFERENCES public.discussion_threads(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.discussion_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Comments viewable by everyone" ON public.discussion_comments FOR SELECT USING (true);
CREATE POLICY "Users can create comments" ON public.discussion_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON public.discussion_comments FOR DELETE USING (auth.uid() = user_id);

-- User activities table
CREATE TABLE public.user_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  activity_type TEXT NOT NULL,
  movie_id INTEGER,
  movie_title TEXT,
  movie_poster TEXT,
  activity_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Activities viewable by everyone" ON public.user_activities FOR SELECT USING (true);
CREATE POLICY "Users can create own activities" ON public.user_activities FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User achievements table
CREATE TABLE public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  achievement_type TEXT NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, achievement_type)
);

ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Achievements viewable by everyone" ON public.user_achievements FOR SELECT USING (true);
CREATE POLICY "Users can unlock achievements" ON public.user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Social connections table
CREATE TABLE public.social_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  friend_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, friend_id)
);

ALTER TABLE public.social_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Connections viewable by participants" ON public.social_connections FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);
CREATE POLICY "Users can create connections" ON public.social_connections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own connections" ON public.social_connections FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = friend_id);
CREATE POLICY "Users can delete own connections" ON public.social_connections FOR DELETE USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Enhanced watchlist items table
CREATE TABLE public.enhanced_watchlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  movie_id INTEGER NOT NULL,
  movie_title TEXT NOT NULL,
  movie_poster TEXT,
  collection_id UUID,
  priority TEXT DEFAULT 'medium',
  notes TEXT,
  mood_tags TEXT[],
  progress_percent INTEGER DEFAULT 0,
  watched_at TIMESTAMP WITH TIME ZONE,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.enhanced_watchlist_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own watchlist" ON public.enhanced_watchlist_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own watchlist" ON public.enhanced_watchlist_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own watchlist" ON public.enhanced_watchlist_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete from watchlist" ON public.enhanced_watchlist_items FOR DELETE USING (auth.uid() = user_id);

-- Watchlist collections table
CREATE TABLE public.watchlist_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.enhanced_watchlist_items ADD CONSTRAINT fk_collection FOREIGN KEY (collection_id) REFERENCES public.watchlist_collections(id) ON DELETE SET NULL;

ALTER TABLE public.watchlist_collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own collections" ON public.watchlist_collections FOR SELECT USING (auth.uid() = user_id OR is_public);
CREATE POLICY "Users can manage own collections" ON public.watchlist_collections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own collections" ON public.watchlist_collections FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own collections" ON public.watchlist_collections FOR DELETE USING (auth.uid() = user_id);

-- User ratings table
CREATE TABLE public.user_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  movie_id INTEGER NOT NULL,
  movie_title TEXT NOT NULL,
  movie_poster TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 10),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, movie_id)
);

ALTER TABLE public.user_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ratings viewable by everyone" ON public.user_ratings FOR SELECT USING (true);
CREATE POLICY "Users can rate movies" ON public.user_ratings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update ratings" ON public.user_ratings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete ratings" ON public.user_ratings FOR DELETE USING (auth.uid() = user_id);

-- User stats table
CREATE TABLE public.user_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  movies_watched INTEGER DEFAULT 0,
  total_watch_time INTEGER DEFAULT 0,
  reviews_written INTEGER DEFAULT 0,
  average_rating DOUBLE PRECISION,
  favorite_genres TEXT[],
  activity_streak INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  experience_points INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Stats viewable by everyone" ON public.user_stats FOR SELECT USING (true);
CREATE POLICY "Users can manage own stats" ON public.user_stats FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own stats" ON public.user_stats FOR UPDATE USING (auth.uid() = user_id);

-- User preferences table
CREATE TABLE public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  preferred_genres TEXT[],
  preferred_actors TEXT[],
  preferred_directors TEXT[],
  location_latitude DOUBLE PRECISION,
  location_longitude DOUBLE PRECISION,
  location_city TEXT,
  location_country TEXT,
  notifications_enabled BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own preferences" ON public.user_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage preferences" ON public.user_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update preferences" ON public.user_preferences FOR UPDATE USING (auth.uid() = user_id);

-- User locations table
CREATE TABLE public.user_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own locations" ON public.user_locations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage locations" ON public.user_locations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete locations" ON public.user_locations FOR DELETE USING (auth.uid() = user_id);

-- Notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  data JSONB,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- Friend activities table
CREATE TABLE public.friend_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  friend_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  activity_type TEXT NOT NULL,
  movie_id INTEGER,
  movie_title TEXT,
  movie_poster TEXT,
  activity_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.friend_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view activities shared with them" ON public.friend_activities FOR SELECT USING (auth.uid() = friend_id OR auth.uid() = user_id);
CREATE POLICY "Users can create activities" ON public.friend_activities FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Friend suggestions table
CREATE TABLE public.friend_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  suggested_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  suggestion_type TEXT NOT NULL,
  shared_data JSONB,
  score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, suggested_user_id)
);

ALTER TABLE public.friend_suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own suggestions" ON public.friend_suggestions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can manage suggestions" ON public.friend_suggestions FOR ALL USING (true);

-- User reviews table
CREATE TABLE public.user_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  movie_id INTEGER NOT NULL,
  movie_title TEXT NOT NULL,
  movie_poster TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 10),
  review_text TEXT,
  is_spoiler BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reviews viewable by everyone" ON public.user_reviews FOR SELECT USING (true);
CREATE POLICY "Users can create reviews" ON public.user_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reviews" ON public.user_reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reviews" ON public.user_reviews FOR DELETE USING (auth.uid() = user_id);

-- Function to generate friend suggestions
CREATE OR REPLACE FUNCTION public.generate_friend_suggestions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- This is a placeholder function - implement suggestion logic as needed
  NULL;
END;
$$;

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name)
  VALUES (new.id, new.raw_user_meta_data ->> 'username', new.raw_user_meta_data ->> 'full_name');
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_watchlist_collections_updated_at BEFORE UPDATE ON public.watchlist_collections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON public.user_preferences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_reviews_updated_at BEFORE UPDATE ON public.user_reviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();