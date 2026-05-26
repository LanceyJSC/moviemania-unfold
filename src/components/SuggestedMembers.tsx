import { Link } from "react-router-dom";
import { Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FollowButton } from "@/components/FollowButton";
import { useSuggestedMembers } from "@/hooks/useSuggestedMembers";

interface Props {
  title?: string;
  limit?: number;
  variant?: "carousel" | "list";
}

export const SuggestedMembers = ({
  title = "Suggested members",
  limit = 8,
  variant = "carousel",
}: Props) => {
  const { members, loading } = useSuggestedMembers(limit);

  if (loading) {
    return (
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-44 w-40 shrink-0 rounded-xl" />
        ))}
      </div>
    );
  }

  if (members.length === 0) return null;

  if (variant === "list") {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Users className="h-4 w-4 text-cinema-red" />
          <h3 className="font-semibold text-sm">{title}</h3>
        </div>
        <ul className="space-y-3">
          {members.map((m) => (
            <li key={m.id} className="flex items-center gap-3">
              <Link to={`/user/${m.username || m.id}`} className="shrink-0">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={m.avatar_url || undefined} />
                  <AvatarFallback>{(m.username || "U").slice(0, 1).toUpperCase()}</AvatarFallback>
                </Avatar>
              </Link>
              <div className="min-w-0 flex-1">
                <Link
                  to={`/user/${m.username || m.id}`}
                  className="block truncate text-sm font-medium hover:text-cinema-red"
                >
                  {m.username || m.full_name || "User"}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {m.follower_count ?? 0} followers
                </p>
              </div>
              <FollowButton userId={m.id} size="sm" variant="outline" />
            </li>
          ))}
        </ul>
      </Card>
    );
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-cinema-red" />
          <h2 className="font-cinematic text-lg sm:text-xl tracking-wide text-foreground">
            {title.toUpperCase()}
          </h2>
        </div>
        <Link to="/members" className="text-xs sm:text-sm text-cinema-red hover:underline">
          See all
        </Link>
      </div>
      <div className="-mx-3 sm:mx-0 overflow-x-auto scrollbar-hide">
        <div className="flex gap-3 px-3 sm:px-0 pb-2">
          {members.map((m) => (
            <Card
              key={m.id}
              className="w-40 shrink-0 p-3 flex flex-col items-center text-center border-border hover:border-cinema-red/60 transition-colors"
            >
              <Link to={`/user/${m.username || m.id}`} className="flex flex-col items-center">
                <Avatar className="h-14 w-14 mb-2">
                  <AvatarImage src={m.avatar_url || undefined} />
                  <AvatarFallback>{(m.username || "U").slice(0, 1).toUpperCase()}</AvatarFallback>
                </Avatar>
                <p className="text-sm font-medium text-foreground truncate max-w-[8rem]">
                  {m.username || m.full_name || "User"}
                </p>
                <p className="text-[10px] text-muted-foreground mb-2">
                  {m.follower_count ?? 0} followers
                </p>
              </Link>
              <FollowButton userId={m.id} size="sm" className="w-full" />
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
