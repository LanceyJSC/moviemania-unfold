DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user_subscription() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_follow_counts() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_on_follow() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_on_activity_like() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_on_activity_comment() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.generate_friend_suggestions(uuid) FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_pro_subscription(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_subscription_tier(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_pro_subscription(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_subscription_tier(uuid) TO authenticated;