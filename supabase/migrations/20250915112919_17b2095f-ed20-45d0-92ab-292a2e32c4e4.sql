-- Enable RLS and create sane policies for public discussions
-- Discussions should be readable by everyone, writable by the creator, and manageable by admins

-- discussion_threads
ALTER TABLE public.discussion_threads ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'discussion_threads' AND polname = 'Anyone can view threads'
  ) THEN
    CREATE POLICY "Anyone can view threads"
    ON public.discussion_threads
    FOR SELECT
    USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'discussion_threads' AND polname = 'Authenticated can create threads'
  ) THEN
    CREATE POLICY "Authenticated can create threads"
    ON public.discussion_threads
    FOR INSERT
    WITH CHECK (auth.uid() = created_by);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'discussion_threads' AND polname = 'Owners or admins can update threads'
  ) THEN
    CREATE POLICY "Owners or admins can update threads"
    ON public.discussion_threads
    FOR UPDATE
    USING (auth.uid() = created_by OR public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'discussion_threads' AND polname = 'Owners or admins can delete threads'
  ) THEN
    CREATE POLICY "Owners or admins can delete threads"
    ON public.discussion_threads
    FOR DELETE
    USING (auth.uid() = created_by OR public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- discussion_comments
ALTER TABLE public.discussion_comments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'discussion_comments' AND polname = 'Anyone can view comments'
  ) THEN
    CREATE POLICY "Anyone can view comments"
    ON public.discussion_comments
    FOR SELECT
    USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'discussion_comments' AND polname = 'Authenticated can create comments'
  ) THEN
    CREATE POLICY "Authenticated can create comments"
    ON public.discussion_comments
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'discussion_comments' AND polname = 'Owners or admins can update comments'
  ) THEN
    CREATE POLICY "Owners or admins can update comments"
    ON public.discussion_comments
    FOR UPDATE
    USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'discussion_comments' AND polname = 'Owners or admins can delete comments'
  ) THEN
    CREATE POLICY "Owners or admins can delete comments"
    ON public.discussion_comments
    FOR DELETE
    USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- Ensure realtime emits full row data and tables are in publication
ALTER TABLE public.discussion_threads REPLICA IDENTITY FULL;
ALTER TABLE public.discussion_comments REPLICA IDENTITY FULL;

DO $$ BEGIN
  -- Add to realtime publication if not already present
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'discussion_threads'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.discussion_threads;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'discussion_comments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.discussion_comments;
  END IF;
END $$;

-- Helpful indexes for performance
CREATE INDEX IF NOT EXISTS idx_discussion_threads_created_at ON public.discussion_threads (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_discussion_comments_thread_id ON public.discussion_comments (thread_id);
