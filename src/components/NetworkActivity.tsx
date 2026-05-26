import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Users, Eye, Star, Heart, ListPlus, Bookmark } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useActivityFeed } from "@/hooks/useActivityFeed";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { SuggestedMembers } from "@/components/SuggestedMembers";

const ACTIVITY_META: Record<string, { label: string; icon: typeof Eye }> = {
  watched: { label: "watched", icon: Eye },
  rated: { label: "rated", icon: Star },
  favorited: { label: "favorited", icon: Heart },
  listed: { label: "added to a list", icon: ListPlus },
  watchlisted: { label: "watchlisted", icon: Bookmark },
  reviewed: { label: "reviewed", icon: Star },
};

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return `${Math.floor(d / 7)}w`;
};

export const NetworkActivity = () => {
  const { user } = useAuth();
  const { activities, loading } = useActivityFeed();

  const items = useMemo(() => {
    return activities
      .filter((a) => a.user_id !== user?.id && a.movie_id && a.movie_poster && ACTIVITY_META[a.activity_type])
      .slice(0, 12);
  }, [activities, user?.id]);

  if (!user) {
    return (
      <section className="mb-6 sm:mb-12">
        <div className="rounded-2xl border border-border bg-card/40 p-5 sm:p-8 text-center">
          <Users className="mx-auto mb-3 h-8 w-8 text-cinema-red" />
          <h2 className="font-cinematic text-xl sm:text-2xl tracking-wide text-foreground mb-2">
            SEE WHAT YOUR NETWORK IS WATCHING
          </h2>
          <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
            Follow other cinephiles and get a live feed of what they're rating, reviewing and adding to their lists.
          </p>
          <Button asChild className="bg-cinema-red hover:bg-cinema-red/90">
            <Link to="/auth">Join SceneBurn</Link>
          </Button>
        </div>
      </section>
    );
  }

  if (loading) return null;

  if (items.length === 0) {
    return (
      <section className="mb-6 sm:mb-12">
        <div className="rounded-2xl border border-border bg-card/40 p-5 sm:p-8 text-center">
          <Users className="mx-auto mb-3 h-8 w-8 text-cinema-red" />
          <h2 className="font-cinematic text-xl sm:text-2xl tracking-wide text-foreground mb-2">
            YOUR NETWORK IS QUIET
          </h2>
          <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
            Follow members to see what they're watching, rating and reviewing in real time.
          </p>
          <Button asChild variant="outline">
            <Link to="/members">Discover Members</Link>
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-6 sm:mb-12">
      <div className="flex items-center justify-between mb-3 sm:mb-5">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 sm:h-6 sm:w-6 text-cinema-red" />
          <h2 className="font-cinematic text-xl sm:text-2xl tracking-wide text-foreground">
            YOUR NETWORK
          </h2>
        </div>
        <Link to="/activity" className="text-xs sm:text-sm text-cinema-red hover:underline">
          View all
        </Link>
      </div>

      <div className="-mx-3 sm:mx-0 overflow-x-auto scrollbar-hide">
        <div className="flex gap-3 px-3 sm:px-0 pb-2">
          {items.map((a) => {
            const meta = ACTIVITY_META[a.activity_type];
            const Icon = meta.icon;
            const username = a.profile?.username || "Someone";
            const mediaType = a.target_type === "tv" ? "tv" : "movie";
            const href = `/${mediaType}/${a.movie_id}`;
            return (
              <Link
                key={a.id}
                to={href}
                className="group relative w-32 sm:w-36 shrink-0 overflow-hidden rounded-xl border border-border bg-card hover:border-cinema-red/60 transition-colors"
              >
                <div className="aspect-[2/3] bg-muted overflow-hidden">
                  {a.movie_poster && (
                    <img
                      src={`https://image.tmdb.org/t/p/w342${a.movie_poster}`}
                      alt={a.movie_title || ""}
                      loading="lazy"
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  )}
                </div>
                <div className="p-2">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={a.profile?.avatar_url || undefined} />
                      <AvatarFallback className="text-[9px]">
                        {username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <Link
                      to={`/user/${a.user_id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-[11px] font-medium text-foreground truncate hover:text-cinema-red"
                    >
                      {username}
                    </Link>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Icon className="h-3 w-3 text-cinema-red shrink-0" />
                    <span className="truncate">
                      {meta.label} · {timeAgo(a.created_at)}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};
