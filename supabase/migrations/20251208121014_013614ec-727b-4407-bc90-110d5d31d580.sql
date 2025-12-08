-- Create movie diary table
CREATE TABLE public.movie_diary (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  movie_id INTEGER NOT NULL,
  movie_title TEXT NOT NULL,
  movie_poster TEXT,
  watched_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 10),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create TV diary table
CREATE TABLE public.tv_diary (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tv_id INTEGER NOT NULL,
  tv_title TEXT NOT NULL,
  tv_poster TEXT,
  season_number INTEGER,
  episode_number INTEGER,
  watched_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 10),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.movie_diary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tv_diary ENABLE ROW LEVEL SECURITY;

-- Movie diary policies
CREATE POLICY "Users can view own movie diary" ON public.movie_diary FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can add to movie diary" ON public.movie_diary FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own movie diary" ON public.movie_diary FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete from movie diary" ON public.movie_diary FOR DELETE USING (auth.uid() = user_id);

-- TV diary policies
CREATE POLICY "Users can view own tv diary" ON public.tv_diary FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can add to tv diary" ON public.tv_diary FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tv diary" ON public.tv_diary FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete from tv diary" ON public.tv_diary FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_movie_diary_user_id ON public.movie_diary(user_id);
CREATE INDEX idx_movie_diary_watched_date ON public.movie_diary(watched_date DESC);
CREATE INDEX idx_tv_diary_user_id ON public.tv_diary(user_id);
CREATE INDEX idx_tv_diary_watched_date ON public.tv_diary(watched_date DESC);