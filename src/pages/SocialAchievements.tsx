import { useState, useEffect } from "react";
import { Award, Star, Film, Calendar, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MobileHeader } from "@/components/MobileHeader";
import { Navigation } from "@/components/Navigation";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Achievement {
  id: string;
  achievement_type: string;
  achievement_data: any;
  unlocked_at: string;
}

const achievementTypes = {
  movie_watched: {
    icon: Film,
    title: "Movie Buff",
    description: "Watch your first movie",
    color: "text-cinema-red"
  },
  rating_given: {
    icon: Star,
    title: "Critic",
    description: "Rate your first movie",
    color: "text-cinema-gold"
  },
  watchlist_created: {
    icon: Calendar,
    title: "Planner",
    description: "Add movies to your watchlist",
    color: "text-cinema-silver"
  },
  social_connection: {
    icon: TrendingUp,
    title: "Social Butterfly",
    description: "Connect with other users",
    color: "text-primary"
  }
};

export const SocialAchievements = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchAchievements();
    }
  }, [user]);

  const fetchAchievements = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', user.id)
        .order('unlocked_at', { ascending: false });

      if (error) throw error;

      setAchievements(data || []);
    } catch (error) {
      console.error('Error fetching achievements:', error);
      toast.error('Failed to load achievements');
    } finally {
      setIsLoading(false);
    }
  };

  const getAchievementDetails = (type: string) => {
    return achievementTypes[type as keyof typeof achievementTypes] || {
      icon: Award,
      title: "Achievement",
      description: "Special milestone reached",
      color: "text-muted-foreground"
    };
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      <MobileHeader title="Achievements" />
      
      <div className="container mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Progress Overview */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Award className="h-5 w-5" />
                Your Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">{achievements.length}</div>
                  <div className="text-sm text-muted-foreground">Unlocked</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">{Object.keys(achievementTypes).length}</div>
                  <div className="text-sm text-muted-foreground">Available</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Unlocked Achievements */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Unlocked Achievements</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading achievements...</p>
                </div>
              ) : achievements.length === 0 ? (
                <div className="text-center py-8">
                  <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No achievements unlocked yet. Start watching movies to earn your first badge!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {achievements.map((achievement) => {
                    const details = getAchievementDetails(achievement.achievement_type);
                    const IconComponent = details.icon;
                    
                    return (
                      <div key={achievement.id} className="flex items-center gap-3 p-4 bg-muted/20 rounded-lg">
                        <div className={`p-2 rounded-full bg-background ${details.color}`}>
                          <IconComponent className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-foreground">{details.title}</div>
                          <div className="text-sm text-muted-foreground">{details.description}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Unlocked {new Date(achievement.unlocked_at).toLocaleDateString()}
                          </div>
                        </div>
                        <Badge variant="outline">
                          Unlocked
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Available Achievements */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Available Achievements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(achievementTypes).map(([type, details]) => {
                  const isUnlocked = achievements.some(a => a.achievement_type === type);
                  const IconComponent = details.icon;
                  
                  return (
                    <div key={type} className={`flex items-center gap-3 p-4 bg-muted/20 rounded-lg ${!isUnlocked ? 'opacity-60' : ''}`}>
                      <div className={`p-2 rounded-full bg-background ${details.color}`}>
                        <IconComponent className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-foreground">{details.title}</div>
                        <div className="text-sm text-muted-foreground">{details.description}</div>
                      </div>
                      <Badge variant={isUnlocked ? "default" : "outline"}>
                        {isUnlocked ? "Unlocked" : "Locked"}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Navigation />
    </div>
  );
};