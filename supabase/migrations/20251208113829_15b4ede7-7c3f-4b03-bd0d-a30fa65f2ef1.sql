
-- Clean up and enhance social features

-- Add friend_reactions table for activity likes/comments
CREATE TABLE public.friend_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  activity_id UUID NOT NULL REFERENCES public.friend_activities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  reaction_type TEXT NOT NULL DEFAULT 'like',
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add shared_watchlists table for collaborative lists
CREATE TABLE public.shared_watchlists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add shared_watchlist_members table
CREATE TABLE public.shared_watchlist_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  watchlist_id UUID NOT NULL REFERENCES public.shared_watchlists(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add shared_watchlist_items table
CREATE TABLE public.shared_watchlist_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  watchlist_id UUID NOT NULL REFERENCES public.shared_watchlists(id) ON DELETE CASCADE,
  movie_id INTEGER NOT NULL,
  movie_title TEXT NOT NULL,
  movie_poster TEXT,
  added_by UUID NOT NULL,
  votes INTEGER DEFAULT 0,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add movie_night_polls table
CREATE TABLE public.movie_night_polls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  created_by UUID NOT NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  closes_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'open',
  winner_movie_id INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add movie_night_poll_options table
CREATE TABLE public.movie_night_poll_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID NOT NULL REFERENCES public.movie_night_polls(id) ON DELETE CASCADE,
  movie_id INTEGER NOT NULL,
  movie_title TEXT NOT NULL,
  movie_poster TEXT,
  added_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add movie_night_poll_votes table
CREATE TABLE public.movie_night_poll_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID NOT NULL REFERENCES public.movie_night_polls(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES public.movie_night_poll_options(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(poll_id, user_id)
);

-- Add taste_compatibility table for caching compatibility scores
CREATE TABLE public.taste_compatibility (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  friend_id UUID NOT NULL,
  compatibility_score INTEGER DEFAULT 0,
  shared_genres TEXT[],
  common_movies INTEGER DEFAULT 0,
  last_calculated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, friend_id)
);

-- Add weekly_challenges table
CREATE TABLE public.weekly_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  challenge_type TEXT NOT NULL,
  target_count INTEGER DEFAULT 1,
  xp_reward INTEGER DEFAULT 100,
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add user_challenge_progress table
CREATE TABLE public.user_challenge_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  challenge_id UUID NOT NULL REFERENCES public.weekly_challenges(id) ON DELETE CASCADE,
  current_count INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, challenge_id)
);

-- Enable RLS on all new tables
ALTER TABLE public.friend_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_watchlist_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_watchlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movie_night_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movie_night_poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movie_night_poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taste_compatibility ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_challenge_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for friend_reactions
CREATE POLICY "Users can view reactions on activities they can see" ON public.friend_reactions
  FOR SELECT USING (true);
CREATE POLICY "Users can create reactions" ON public.friend_reactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own reactions" ON public.friend_reactions
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for shared_watchlists
CREATE POLICY "Users can view shared watchlists they're part of" ON public.shared_watchlists
  FOR SELECT USING (
    auth.uid() = created_by OR 
    is_public OR 
    EXISTS (SELECT 1 FROM shared_watchlist_members WHERE watchlist_id = id AND user_id = auth.uid())
  );
CREATE POLICY "Users can create shared watchlists" ON public.shared_watchlists
  FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Creators can update shared watchlists" ON public.shared_watchlists
  FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Creators can delete shared watchlists" ON public.shared_watchlists
  FOR DELETE USING (auth.uid() = created_by);

-- RLS Policies for shared_watchlist_members
CREATE POLICY "Members can view membership" ON public.shared_watchlist_members
  FOR SELECT USING (true);
CREATE POLICY "Creators can add members" ON public.shared_watchlist_members
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM shared_watchlists WHERE id = watchlist_id AND created_by = auth.uid())
    OR auth.uid() = user_id
  );
CREATE POLICY "Users can leave watchlists" ON public.shared_watchlist_members
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for shared_watchlist_items
CREATE POLICY "Members can view items" ON public.shared_watchlist_items
  FOR SELECT USING (true);
CREATE POLICY "Members can add items" ON public.shared_watchlist_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM shared_watchlist_members WHERE watchlist_id = shared_watchlist_items.watchlist_id AND user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM shared_watchlists WHERE id = shared_watchlist_items.watchlist_id AND created_by = auth.uid())
  );
CREATE POLICY "Adders can remove items" ON public.shared_watchlist_items
  FOR DELETE USING (auth.uid() = added_by);

-- RLS Policies for movie_night_polls
CREATE POLICY "Users can view polls they created or are invited to" ON public.movie_night_polls
  FOR SELECT USING (true);
CREATE POLICY "Users can create polls" ON public.movie_night_polls
  FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Creators can update polls" ON public.movie_night_polls
  FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Creators can delete polls" ON public.movie_night_polls
  FOR DELETE USING (auth.uid() = created_by);

-- RLS Policies for poll options
CREATE POLICY "Users can view poll options" ON public.movie_night_poll_options
  FOR SELECT USING (true);
CREATE POLICY "Users can add options" ON public.movie_night_poll_options
  FOR INSERT WITH CHECK (auth.uid() = added_by);

-- RLS Policies for poll votes
CREATE POLICY "Users can view votes" ON public.movie_night_poll_votes
  FOR SELECT USING (true);
CREATE POLICY "Users can vote" ON public.movie_night_poll_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can change vote" ON public.movie_night_poll_votes
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for taste_compatibility
CREATE POLICY "Users can view own compatibility" ON public.taste_compatibility
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);
CREATE POLICY "System can manage compatibility" ON public.taste_compatibility
  FOR ALL USING (true);

-- RLS Policies for weekly_challenges
CREATE POLICY "Everyone can view challenges" ON public.weekly_challenges
  FOR SELECT USING (true);

-- RLS Policies for user_challenge_progress
CREATE POLICY "Users can view own progress" ON public.user_challenge_progress
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can track progress" ON public.user_challenge_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update progress" ON public.user_challenge_progress
  FOR UPDATE USING (auth.uid() = user_id);
