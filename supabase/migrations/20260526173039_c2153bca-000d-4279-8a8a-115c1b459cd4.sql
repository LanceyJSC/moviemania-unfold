
-- activity_likes
CREATE TABLE public.activity_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (activity_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.activity_likes TO authenticated;
GRANT ALL ON public.activity_likes TO service_role;
ALTER TABLE public.activity_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view activity likes"
  ON public.activity_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can like activities"
  ON public.activity_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike activities"
  ON public.activity_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX idx_activity_likes_activity ON public.activity_likes(activity_id);

-- activity_comments
CREATE TABLE public.activity_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid NOT NULL,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activity_comments TO authenticated;
GRANT ALL ON public.activity_comments TO service_role;
ALTER TABLE public.activity_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view activity comments"
  ON public.activity_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can add activity comments"
  ON public.activity_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own activity comments"
  ON public.activity_comments FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own activity comments"
  ON public.activity_comments FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX idx_activity_comments_activity ON public.activity_comments(activity_id);

-- Allow inserting notifications via triggers (system-generated)
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
CREATE POLICY "System can create notifications"
  ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);

-- Trigger: notify on new follow
CREATE OR REPLACE FUNCTION public.notify_on_follow()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  follower_name text;
BEGIN
  SELECT COALESCE(username, 'Someone') INTO follower_name
  FROM public.profiles WHERE id = NEW.follower_id;
  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES (
    NEW.following_id,
    'follow',
    'New follower',
    follower_name || ' started following you',
    jsonb_build_object('follower_id', NEW.follower_id, 'username', follower_name)
  );
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_on_follow ON public.user_follows;
CREATE TRIGGER trg_notify_on_follow
AFTER INSERT ON public.user_follows
FOR EACH ROW EXECUTE FUNCTION public.notify_on_follow();

-- Trigger: notify on activity like
CREATE OR REPLACE FUNCTION public.notify_on_activity_like()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  liker_name text;
  target_user uuid;
  target_movie text;
BEGIN
  SELECT user_id, movie_title INTO target_user, target_movie
  FROM public.activity_feed WHERE id = NEW.activity_id;
  IF target_user IS NULL OR target_user = NEW.user_id THEN
    RETURN NEW;
  END IF;
  SELECT COALESCE(username, 'Someone') INTO liker_name
  FROM public.profiles WHERE id = NEW.user_id;
  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES (
    target_user,
    'activity_like',
    'New like',
    liker_name || ' liked your activity' || COALESCE(' on ' || target_movie, ''),
    jsonb_build_object('activity_id', NEW.activity_id, 'liker_id', NEW.user_id, 'username', liker_name)
  );
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_on_activity_like ON public.activity_likes;
CREATE TRIGGER trg_notify_on_activity_like
AFTER INSERT ON public.activity_likes
FOR EACH ROW EXECUTE FUNCTION public.notify_on_activity_like();

-- Trigger: notify on activity comment
CREATE OR REPLACE FUNCTION public.notify_on_activity_comment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  commenter_name text;
  target_user uuid;
  target_movie text;
BEGIN
  SELECT user_id, movie_title INTO target_user, target_movie
  FROM public.activity_feed WHERE id = NEW.activity_id;
  IF target_user IS NULL OR target_user = NEW.user_id THEN
    RETURN NEW;
  END IF;
  SELECT COALESCE(username, 'Someone') INTO commenter_name
  FROM public.profiles WHERE id = NEW.user_id;
  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES (
    target_user,
    'activity_comment',
    'New comment',
    commenter_name || ' commented on your activity' || COALESCE(' on ' || target_movie, ''),
    jsonb_build_object('activity_id', NEW.activity_id, 'commenter_id', NEW.user_id, 'username', commenter_name)
  );
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_on_activity_comment ON public.activity_comments;
CREATE TRIGGER trg_notify_on_activity_comment
AFTER INSERT ON public.activity_comments
FOR EACH ROW EXECUTE FUNCTION public.notify_on_activity_comment();
