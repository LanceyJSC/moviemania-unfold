-- Add club_id to discussion_threads to support club-specific discussions
ALTER TABLE public.discussion_threads
ADD COLUMN IF NOT EXISTS club_id uuid;

-- Optional: create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_discussion_threads_club_id ON public.discussion_threads (club_id);

-- No RLS change needed: existing policies already allow public SELECT and inserts by creator.
