
-- Phase 2 & 3: Database enhancements for reviews, social features, and progress tracking

-- User reviews and ratings system
CREATE TABLE public.user_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  movie_id INTEGER NOT NULL,
  movie_title TEXT NOT NULL,
  movie_type TEXT NOT NULL DEFAULT 'movie', -- 'movie' or 'tv'
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  is_spoiler BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Social connections (friends/following system)
CREATE TABLE public.social_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID REFERENCES auth.users NOT NULL,
  following_id UUID REFERENCES auth.users NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'blocked'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

-- Watch progress tracking for TV shows
CREATE TABLE public.watch_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  movie_id INTEGER NOT NULL,
  movie_title TEXT NOT NULL,
  movie_type TEXT NOT NULL DEFAULT 'tv',
  season_number INTEGER,
  episode_number INTEGER,
  progress_percent INTEGER DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  last_watched TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed BOOLEAN DEFAULT false,
  UNIQUE(user_id, movie_id, season_number, episode_number)
);

-- User activity feed
CREATE TABLE public.user_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  activity_type TEXT NOT NULL, -- 'rating', 'review', 'watchlist_add', 'completed'
  movie_id INTEGER NOT NULL,
  movie_title TEXT NOT NULL,
  movie_type TEXT NOT NULL DEFAULT 'movie',
  metadata JSONB, -- Additional data like rating value, review text snippet
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Community lists (shared watchlists)
CREATE TABLE public.community_lists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  is_collaborative BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Community list items
CREATE TABLE public.community_list_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  list_id UUID REFERENCES public.community_lists ON DELETE CASCADE NOT NULL,
  movie_id INTEGER NOT NULL,
  movie_title TEXT NOT NULL,
  movie_type TEXT NOT NULL DEFAULT 'movie',
  movie_poster TEXT,
  added_by UUID REFERENCES auth.users NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(list_id, movie_id)
);

-- Review interactions (likes, reports)
CREATE TABLE public.review_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  review_id UUID REFERENCES public.user_reviews ON DELETE CASCADE NOT NULL,
  interaction_type TEXT NOT NULL, -- 'like', 'dislike', 'report'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, review_id, interaction_type)
);

-- Enable RLS on all new tables
ALTER TABLE public.user_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watch_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_interactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_reviews
CREATE POLICY "Users can view all reviews" ON public.user_reviews FOR SELECT USING (true);
CREATE POLICY "Users can create own reviews" ON public.user_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reviews" ON public.user_reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reviews" ON public.user_reviews FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for social_connections
CREATE POLICY "Users can view connections involving them" ON public.social_connections FOR SELECT USING (auth.uid() = follower_id OR auth.uid() = following_id);
CREATE POLICY "Users can create connections" ON public.social_connections FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can update own connections" ON public.social_connections FOR UPDATE USING (auth.uid() = follower_id OR auth.uid() = following_id);
CREATE POLICY "Users can delete own connections" ON public.social_connections FOR DELETE USING (auth.uid() = follower_id);

-- RLS Policies for watch_progress
CREATE POLICY "Users can view own progress" ON public.watch_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own progress" ON public.watch_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON public.watch_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own progress" ON public.watch_progress FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for user_activities
CREATE POLICY "Users can view activities from connections" ON public.user_activities FOR SELECT USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM public.social_connections 
    WHERE follower_id = auth.uid() AND following_id = user_activities.user_id AND status = 'accepted'
  )
);
CREATE POLICY "Users can create own activities" ON public.user_activities FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for community_lists
CREATE POLICY "Users can view public lists and own lists" ON public.community_lists FOR SELECT USING (is_public = true OR auth.uid() = user_id);
CREATE POLICY "Users can create own lists" ON public.community_lists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own lists" ON public.community_lists FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own lists" ON public.community_lists FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for community_list_items
CREATE POLICY "Users can view items from accessible lists" ON public.community_list_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.community_lists 
    WHERE id = community_list_items.list_id AND (is_public = true OR user_id = auth.uid())
  )
);
CREATE POLICY "Users can add items to accessible lists" ON public.community_list_items FOR INSERT WITH CHECK (
  auth.uid() = added_by AND
  EXISTS (
    SELECT 1 FROM public.community_lists 
    WHERE id = community_list_items.list_id AND (user_id = auth.uid() OR is_collaborative = true)
  )
);

-- RLS Policies for review_interactions
CREATE POLICY "Users can view all interactions" ON public.review_interactions FOR SELECT USING (true);
CREATE POLICY "Users can create own interactions" ON public.review_interactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own interactions" ON public.review_interactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own interactions" ON public.review_interactions FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_user_reviews_movie_id ON public.user_reviews(movie_id);
CREATE INDEX idx_user_reviews_user_id ON public.user_reviews(user_id);
CREATE INDEX idx_social_connections_follower ON public.social_connections(follower_id);
CREATE INDEX idx_social_connections_following ON public.social_connections(following_id);
CREATE INDEX idx_watch_progress_user_movie ON public.watch_progress(user_id, movie_id);
CREATE INDEX idx_user_activities_user_id ON public.user_activities(user_id);
CREATE INDEX idx_community_lists_public ON public.community_lists(is_public) WHERE is_public = true;
