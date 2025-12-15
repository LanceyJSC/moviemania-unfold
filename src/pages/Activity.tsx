import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { MobileHeader } from "@/components/MobileHeader";
import { Navigation } from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Activity as ActivityIcon, Users } from "lucide-react";
import { ActivityFeed } from "@/components/ActivityFeed";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PullToRefresh } from "@/components/PullToRefresh";

const Activity = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
  }, [queryClient]);

  return (
    <PullToRefresh onRefresh={handleRefresh} className="min-h-screen bg-background pb-24">
      <MobileHeader title="Activity" />
      
      <div className="px-4 pt-4 pb-8">
        <div className="flex items-center gap-3 mb-6">
          <ActivityIcon className="h-8 w-8 text-cinema-red" />
          <h1 className="font-cinematic text-2xl text-foreground">Activity</h1>
        </div>

        {!user ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground mb-4">
              Sign in to see activity from people you follow
            </p>
            <Link to="/auth">
              <Button>Sign In</Button>
            </Link>
          </Card>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                Recent activity from you and people you follow
              </p>
              <Link to="/members">
                <Button variant="outline" size="sm">
                  <Users className="h-4 w-4 mr-2" />
                  Find Members
                </Button>
              </Link>
            </div>
            <ActivityFeed />
          </>
        )}
      </div>

      <Navigation />
    </PullToRefresh>
  );
};

export default Activity;
