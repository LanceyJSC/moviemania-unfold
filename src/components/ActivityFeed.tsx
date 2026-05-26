import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useActivityFeed } from "@/hooks/useActivityFeed";
import { ActivityCard } from "@/components/ActivityCard";

interface ActivityFeedProps {
  userId?: string;
  limit?: number;
}

export const ActivityFeed = ({ userId, limit }: ActivityFeedProps) => {
  const { activities, loading } = useActivityFeed(userId);
  const displayActivities = limit ? activities.slice(0, limit) : activities;

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="p-4">
            <div className="flex items-start gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (displayActivities.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">No recent activity</p>
        <p className="text-sm text-muted-foreground mt-1">
          Follow members or start logging to see activity here
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {displayActivities.map((activity) => (
        <ActivityCard key={activity.id} activity={activity} />
      ))}
    </div>
  );
};

