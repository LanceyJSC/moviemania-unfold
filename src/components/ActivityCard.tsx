import { useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, MessageCircle, Star, Eye, Film, List, UserPlus, Bookmark, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tmdbService } from "@/lib/tmdb";
import { useAuth } from "@/hooks/useAuth";
import { useActivityInteractions } from "@/hooks/useActivityInteractions";
import { cn } from "@/lib/utils";

interface ActivityItem {
  id: string;
  user_id: string;
  activity_type: string;
  target_type: string | null;
  movie_id: number | null;
  movie_title: string | null;
  movie_poster: string | null;
  metadata: any;
  created_at: string;
  profile?: { username: string | null; avatar_url: string | null };
}

const ICONS: Record<string, typeof Eye> = {
  watched: Eye,
  rated: Star,
  reviewed: Film,
  liked: Heart,
  listed: List,
  followed: UserPlus,
  watchlisted: Bookmark,
};

const verb = (a: ActivityItem) => {
  switch (a.activity_type) {
    case "watched": return "watched";
    case "rated": return `rated ${a.metadata?.rating ? `${a.metadata.rating}/5 🔥` : ""}`;
    case "reviewed": return "reviewed";
    case "liked": return "liked";
    case "listed": return "added to a list";
    case "followed": return "started following";
    case "logged": return "logged";
    case "watchlisted": return "watchlisted";
    default: return "interacted with";
  }
};

export const ActivityCard = ({ activity }: { activity: ActivityItem }) => {
  const { user } = useAuth();
  const { likeCount, liked, comments, toggleLike, addComment, deleteComment } =
    useActivityInteractions(activity.id);
  const [showComments, setShowComments] = useState(false);
  const [draft, setDraft] = useState("");

  const Icon = ICONS[activity.activity_type] || Film;
  const mediaType = (activity.metadata?.media_type || activity.target_type) === "tv" ? "tv" : "movie";
  const season = activity.metadata?.season_number;
  const episode = activity.metadata?.episode_number;
  const mediaHref = !activity.movie_id
    ? "#"
    : mediaType === "tv" && season != null && episode != null
      ? `/tv/${activity.movie_id}/season/${season}/episode/${episode}`
      : `/${mediaType}/${activity.movie_id}`;
  const userHref = `/user/${activity.profile?.username || activity.user_id}`;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    await addComment(draft);
    setDraft("");
    setShowComments(true);
  };

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <Link to={userHref} className="shrink-0">
          <Avatar className="h-10 w-10">
            <AvatarImage src={activity.profile?.avatar_url || undefined} />
            <AvatarFallback>
              {(activity.profile?.username || "U").slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap text-sm">
            <Link to={userHref} className="font-medium text-foreground hover:text-cinema-red">
              {activity.profile?.username || "User"}
            </Link>
            <span className="text-muted-foreground">{verb(activity)}</span>
            {activity.movie_title && (
              <Link to={mediaHref} className="font-medium text-foreground hover:text-cinema-red truncate">
                {activity.movie_title}
              </Link>
            )}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Icon className="h-3.5 w-3.5 text-cinema-red" />
            <span>{formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}</span>
          </div>
        </div>

        {activity.movie_poster && (
          <Link to={mediaHref} className="shrink-0">
            <img
              src={tmdbService.getPosterUrl(activity.movie_poster, "w300")}
              alt={activity.movie_title || ""}
              className="w-12 h-18 object-cover rounded"
              loading="lazy"
            />
          </Link>
        )}
      </div>

      <div className="mt-3 flex items-center gap-1 border-t border-border pt-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleLike}
          disabled={!user}
          className={cn("gap-1.5 h-8", liked && "text-cinema-red")}
        >
          <Heart className={cn("h-4 w-4", liked && "fill-current")} />
          <span className="text-xs">{likeCount}</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowComments((v) => !v)}
          className="gap-1.5 h-8"
        >
          <MessageCircle className="h-4 w-4" />
          <span className="text-xs">{comments.length}</span>
        </Button>
      </div>

      {showComments && (
        <div className="mt-3 space-y-3">
          {comments.map((c) => (
            <div key={c.id} className="flex items-start gap-2">
              <Avatar className="h-7 w-7">
                <AvatarImage src={c.profile?.avatar_url || undefined} />
                <AvatarFallback className="text-[10px]">
                  {(c.profile?.username || "U").slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 rounded-lg bg-muted/40 px-3 py-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-foreground">
                    {c.profile?.username || "User"}
                  </span>
                  {user?.id === c.user_id && (
                    <button
                      onClick={() => deleteComment(c.id)}
                      className="text-muted-foreground hover:text-cinema-red"
                      aria-label="Delete comment"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
                <p className="text-sm text-foreground break-words">{c.content}</p>
              </div>
            </div>
          ))}

          {user && (
            <form onSubmit={submit} className="flex gap-2">
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Add a comment…"
                className="h-9 text-sm"
                maxLength={500}
              />
              <Button type="submit" size="sm" disabled={!draft.trim()} className="h-9">
                Post
              </Button>
            </form>
          )}
        </div>
      )}
    </Card>
  );
};
