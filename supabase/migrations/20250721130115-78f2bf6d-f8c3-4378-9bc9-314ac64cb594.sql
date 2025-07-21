
-- Create cinema-related tables
CREATE TABLE public.cinemas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  phone TEXT,
  website TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.cinema_showtimes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cinema_id UUID NOT NULL REFERENCES public.cinemas(id) ON DELETE CASCADE,
  movie_id INTEGER NOT NULL,
  movie_title TEXT NOT NULL,
  showtime TIMESTAMP WITH TIME ZONE NOT NULL,
  ticket_price DECIMAL(10, 2),
  booking_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('release', 'streaming', 'social', 'reminder', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user preferences table
CREATE TABLE public.user_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_genres TEXT[],
  preferred_actors TEXT[],
  preferred_directors TEXT[],
  location_latitude DECIMAL(10, 8),
  location_longitude DECIMAL(11, 8),
  location_city TEXT,
  location_country TEXT,
  notifications_enabled BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT false,
  push_notifications BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create user achievements table
CREATE TABLE public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL,
  achievement_data JSONB,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_type)
);

-- Create discussion threads table
CREATE TABLE public.discussion_threads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  movie_id INTEGER NOT NULL,
  movie_title TEXT NOT NULL,
  movie_type TEXT NOT NULL DEFAULT 'movie',
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create discussion comments table
CREATE TABLE public.discussion_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id UUID NOT NULL REFERENCES public.discussion_threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_comment_id UUID REFERENCES public.discussion_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create streaming platforms table
CREATE TABLE public.streaming_platforms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  website_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create movie streaming availability table
CREATE TABLE public.movie_streaming_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  movie_id INTEGER NOT NULL,
  movie_title TEXT NOT NULL,
  platform_id UUID NOT NULL REFERENCES public.streaming_platforms(id) ON DELETE CASCADE,
  available_from TIMESTAMP WITH TIME ZONE,
  available_until TIMESTAMP WITH TIME ZONE,
  streaming_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(movie_id, platform_id)
);

-- Enable RLS on all new tables
ALTER TABLE public.cinemas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cinema_showtimes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streaming_platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movie_streaming_availability ENABLE ROW LEVEL SECURITY;

-- RLS Policies for cinemas (public read access)
CREATE POLICY "Anyone can view cinemas" ON public.cinemas FOR SELECT USING (true);

-- RLS Policies for cinema showtimes (public read access)
CREATE POLICY "Anyone can view showtimes" ON public.cinema_showtimes FOR SELECT USING (true);

-- RLS Policies for notifications
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "System can create notifications" ON public.notifications FOR INSERT WITH CHECK (true);

-- RLS Policies for user preferences
CREATE POLICY "Users can view own preferences" ON public.user_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own preferences" ON public.user_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own preferences" ON public.user_preferences FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for user achievements
CREATE POLICY "Users can view own achievements" ON public.user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can create achievements" ON public.user_achievements FOR INSERT WITH CHECK (true);

-- RLS Policies for discussion threads
CREATE POLICY "Anyone can view discussion threads" ON public.discussion_threads FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create threads" ON public.discussion_threads FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update own threads" ON public.discussion_threads FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Users can delete own threads" ON public.discussion_threads FOR DELETE USING (auth.uid() = created_by);

-- RLS Policies for discussion comments
CREATE POLICY "Anyone can view discussion comments" ON public.discussion_comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create comments" ON public.discussion_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comments" ON public.discussion_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON public.discussion_comments FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for streaming platforms (public read access)
CREATE POLICY "Anyone can view streaming platforms" ON public.streaming_platforms FOR SELECT USING (true);

-- RLS Policies for movie streaming availability (public read access)
CREATE POLICY "Anyone can view streaming availability" ON public.movie_streaming_availability FOR SELECT USING (true);

-- Insert some initial streaming platforms
INSERT INTO public.streaming_platforms (name, logo_url, website_url) VALUES
('Netflix', 'https://images.justwatch.com/icon/207360008/s100/netflix.png', 'https://www.netflix.com'),
('Disney+', 'https://images.justwatch.com/icon/147638351/s100/disney-plus.png', 'https://www.disneyplus.com'),
('Amazon Prime Video', 'https://images.justwatch.com/icon/52449861/s100/amazon-prime-video.png', 'https://www.amazon.com/prime/video'),
('HBO Max', 'https://images.justwatch.com/icon/190848813/s100/hbo-max.png', 'https://www.hbomax.com'),
('Hulu', 'https://images.justwatch.com/icon/2123439/s100/hulu.png', 'https://www.hulu.com'),
('Apple TV+', 'https://images.justwatch.com/icon/152862153/s100/apple-tv-plus.png', 'https://tv.apple.com'),
('Paramount+', 'https://images.justwatch.com/icon/207360008/s100/paramount-plus.png', 'https://www.paramountplus.com');

-- Create indexes for better performance
CREATE INDEX idx_cinemas_location ON public.cinemas(latitude, longitude);
CREATE INDEX idx_cinema_showtimes_cinema_id ON public.cinema_showtimes(cinema_id);
CREATE INDEX idx_cinema_showtimes_movie_id ON public.cinema_showtimes(movie_id);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_user_preferences_user_id ON public.user_preferences(user_id);
CREATE INDEX idx_discussion_threads_movie_id ON public.discussion_threads(movie_id);
CREATE INDEX idx_discussion_comments_thread_id ON public.discussion_comments(thread_id);
CREATE INDEX idx_movie_streaming_availability_movie_id ON public.movie_streaming_availability(movie_id);
