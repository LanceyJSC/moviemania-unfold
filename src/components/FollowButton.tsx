import { Button } from "@/components/ui/button";
import { UserPlus, UserMinus, Loader2 } from "lucide-react";
import { useFollows } from "@/hooks/useFollows";
import { useAuth } from "@/hooks/useAuth";

interface FollowButtonProps {
  userId: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export const FollowButton = ({ 
  userId, 
  variant = "default",
  size = "default",
  className = ""
}: FollowButtonProps) => {
  const { user } = useAuth();
  const { isFollowing, followUser, unfollowUser, loading } = useFollows();

  // Don't show button for own profile
  if (user?.id === userId) return null;

  const following = isFollowing(userId);

  const handleClick = async () => {
    if (following) {
      await unfollowUser(userId);
    } else {
      await followUser(userId);
    }
  };

  if (loading) {
    return (
      <Button variant={variant} size={size} disabled className={className}>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  return (
    <Button
      variant={following ? "outline" : variant}
      size={size}
      onClick={handleClick}
      className={`touch-manipulation active:scale-95 min-h-[44px] ${className}`}
    >
      {following ? (
        <>
          <UserMinus className="h-4 w-4 mr-2" />
          Following
        </>
      ) : (
        <>
          <UserPlus className="h-4 w-4 mr-2" />
          Follow
        </>
      )}
    </Button>
  );
};
