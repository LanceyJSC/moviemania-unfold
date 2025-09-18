-- Fix RLS policies for discussion tables using correct column names
-- discussion_threads
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'discussion_threads' AND policyname = 'Admins can delete any threads'
  ) THEN
    CREATE POLICY "Admins can delete any threads"
    ON public.discussion_threads
    FOR DELETE
    USING (public.has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- discussion_comments  
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'discussion_comments' AND policyname = 'Admins can delete any comments'
  ) THEN
    CREATE POLICY "Admins can delete any comments"
    ON public.discussion_comments
    FOR DELETE
    USING (public.has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- Ensure realtime is properly configured
ALTER TABLE public.discussion_threads REPLICA IDENTITY FULL;
ALTER TABLE public.discussion_comments REPLICA IDENTITY FULL;

-- Add to realtime publication if not already present
DO $$ BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.discussion_threads;
  EXCEPTION WHEN duplicate_object THEN
    -- Table already in publication, ignore
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.discussion_comments;
  EXCEPTION WHEN duplicate_object THEN
    -- Table already in publication, ignore
  END;
END $$;

-- Helpful indexes for performance
CREATE INDEX IF NOT EXISTS idx_discussion_threads_created_at ON public.discussion_threads (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_discussion_comments_thread_id ON public.discussion_comments (thread_id);