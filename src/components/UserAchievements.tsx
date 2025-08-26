import { useState, useEffect } from 'react';
import { Trophy, Star, Film, Heart, Users, Calendar, Target, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useUserStats } from '@/hooks/useUserStats';
import { useSupabaseUserState } from '@/hooks/useSupabaseUserState';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: any;
  category: 'watching' | 'social' | 'rating' | 'collection';
  requirement: number;
  progress: number;
  unlocked: boolean;
  unlockedAt?: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

const rarityColors = {
  common: 'bg-gray-500',
  rare: 'bg-blue-500',
  epic: 'bg-purple-500',
  legendary: 'bg-yellow-500'
};

const rarityLabels = {
  common: 'Common',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary'
};

export const UserAchievements = () => {
  const { user } = useAuth();
  const { stats } = useUserStats();
  const { userState } = useSupabaseUserState();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [unlockedCount, setUnlockedCount] = useState(0);

  useEffect(() => {
    if (stats && userState) {
      generateAchievements();
    }
  }, [stats, userState]);

  const generateAchievements = async () => {
    if (!stats || !user) return;

    // Get friend count
    const { data: friendsData } = await supabase
      .from('social_connections')
      .select('id')
      .eq('follower_id', user.id)
      .eq('status', 'accepted');

    const friendCount = friendsData?.length || 0;

    const achievementDefinitions = [
      // Watching Achievements
      {
        id: 'first_movie',
        title: 'Movie Buff Beginner',
        description: 'Watch your first movie',
        icon: Film,
        category: 'watching' as const,
        requirement: 1,
        progress: stats.total_movies_watched,
        rarity: 'common' as const
      },
      {
        id: 'movie_marathon',
        title: 'Movie Marathon',
        description: 'Watch 10 movies',
        icon: Film,
        category: 'watching' as const,
        requirement: 10,
        progress: stats.total_movies_watched,
        rarity: 'common' as const
      },
      {
        id: 'cinema_enthusiast',
        title: 'Cinema Enthusiast',
        description: 'Watch 50 movies',
        icon: Film,
        category: 'watching' as const,
        requirement: 50,
        progress: stats.total_movies_watched,
        rarity: 'rare' as const
      },
      {
        id: 'movie_master',
        title: 'Movie Master',
        description: 'Watch 100 movies',
        icon: Trophy,
        category: 'watching' as const,
        requirement: 100,
        progress: stats.total_movies_watched,
        rarity: 'epic' as const
      },
      {
        id: 'legendary_viewer',
        title: 'Legendary Viewer',
        description: 'Watch 500 movies',
        icon: Award,
        category: 'watching' as const,
        requirement: 500,
        progress: stats.total_movies_watched,
        rarity: 'legendary' as const
      },

      // Rating Achievements
      {
        id: 'first_rating',
        title: 'First Critic',
        description: 'Rate your first movie',
        icon: Star,
        category: 'rating' as const,
        requirement: 1,
        progress: stats.total_ratings,
        rarity: 'common' as const
      },
      {
        id: 'active_critic',
        title: 'Active Critic',
        description: 'Rate 25 movies',
        icon: Star,
        category: 'rating' as const,
        requirement: 25,
        progress: stats.total_ratings,
        rarity: 'rare' as const
      },
      {
        id: 'super_critic',
        title: 'Super Critic',
        description: 'Rate 100 movies',
        icon: Star,
        category: 'rating' as const,
        requirement: 100,
        progress: stats.total_ratings,
        rarity: 'epic' as const
      },

      // Social Achievements
      {
        id: 'first_friend',
        title: 'Social Butterfly',
        description: 'Make your first friend',
        icon: Users,
        category: 'social' as const,
        requirement: 1,
        progress: friendCount,
        rarity: 'common' as const
      },
      {
        id: 'popular',
        title: 'Popular User',
        description: 'Have 10 friends',
        icon: Users,
        category: 'social' as const,
        requirement: 10,
        progress: friendCount,
        rarity: 'rare' as const
      },
      {
        id: 'social_star',
        title: 'Social Star',
        description: 'Have 25 friends',
        icon: Users,
        category: 'social' as const,
        requirement: 25,
        progress: friendCount,
        rarity: 'epic' as const
      },

      // Collection Achievements
      {
        id: 'collector',
        title: 'Movie Collector',
        description: 'Have 10 movies in your watchlist',
        icon: Heart,
        category: 'collection' as const,
        requirement: 10,
        progress: userState.watchlist.length,
        rarity: 'common' as const
      },
      {
        id: 'hoarder',
        title: 'Movie Hoarder',
        description: 'Have 50 movies in your watchlist',
        icon: Heart,
        category: 'collection' as const,
        requirement: 50,
        progress: userState.watchlist.length,
        rarity: 'rare' as const
      },
      {
        id: 'completionist',
        title: 'Completionist',
        description: 'Have 100 liked movies',
        icon: Heart,
        category: 'collection' as const,
        requirement: 100,
        progress: userState.likedMovies.length,
        rarity: 'epic' as const
      }
    ];

    // Check for unlocked achievements
    const { data: unlockedAchievements } = await supabase
      .from('user_achievements')
      .select('achievement_type, unlocked_at')
      .eq('user_id', user.id);

    const unlockedMap = new Map(
      unlockedAchievements?.map(ua => [ua.achievement_type, ua.unlocked_at]) || []
    );

    const processedAchievements = achievementDefinitions.map(def => ({
      ...def,
      unlocked: def.progress >= def.requirement || unlockedMap.has(def.id),
      unlockedAt: unlockedMap.get(def.id)
    }));

    // Check for newly unlocked achievements
    for (const achievement of processedAchievements) {
      if (achievement.progress >= achievement.requirement && !unlockedMap.has(achievement.id)) {
        // Unlock achievement
        await supabase
          .from('user_achievements')
          .insert({
            user_id: user.id,
            achievement_type: achievement.id,
            achievement_data: {
              title: achievement.title,
              description: achievement.description,
              rarity: achievement.rarity,
              category: achievement.category
            }
          });
      }
    }

    setAchievements(processedAchievements);
    setUnlockedCount(processedAchievements.filter(a => a.unlocked).length);
  };

  const achievementsByCategory = achievements.reduce((acc, achievement) => {
    if (!acc[achievement.category]) {
      acc[achievement.category] = [];
    }
    acc[achievement.category].push(achievement);
    return acc;
  }, {} as Record<string, Achievement[]>);

  const categoryLabels = {
    watching: 'Watching',
    social: 'Social',
    rating: 'Rating',
    collection: 'Collection'
  };

  const categoryIcons = {
    watching: Film,
    social: Users,
    rating: Star,
    collection: Heart
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2 flex items-center justify-center gap-2">
          <Trophy className="h-6 w-6 text-primary" />
          Your Achievements
        </h2>
        <p className="text-muted-foreground">
          {unlockedCount} of {achievements.length} achievements unlocked
        </p>
        <Progress 
          value={(unlockedCount / Math.max(achievements.length, 1)) * 100} 
          className="w-full max-w-md mx-auto mt-4"
        />
      </div>

      {/* Achievements by Category */}
      {Object.entries(achievementsByCategory).map(([category, categoryAchievements]) => {
        const CategoryIcon = categoryIcons[category as keyof typeof categoryIcons];
        
        return (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CategoryIcon className="h-5 w-5 text-primary" />
                {categoryLabels[category as keyof typeof categoryLabels]}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categoryAchievements.map(achievement => {
                  const Icon = achievement.icon;
                  const progressPercentage = Math.min((achievement.progress / achievement.requirement) * 100, 100);
                  
                  return (
                    <div
                      key={achievement.id}
                      className={`p-4 rounded-lg border transition-all ${
                        achievement.unlocked 
                          ? 'bg-primary/5 border-primary/20 shadow-sm' 
                          : 'bg-muted/20 border-border'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-full ${
                          achievement.unlocked ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                        }`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className={`font-medium ${
                              achievement.unlocked ? 'text-foreground' : 'text-muted-foreground'
                            }`}>
                              {achievement.title}
                            </h3>
                            <Badge 
                              variant="secondary" 
                              className={`text-xs ${rarityColors[achievement.rarity]} text-white`}
                            >
                              {rarityLabels[achievement.rarity]}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-3">
                            {achievement.description}
                          </p>
                          
                          {!achievement.unlocked && (
                            <div className="space-y-2">
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Progress</span>
                                <span>{achievement.progress}/{achievement.requirement}</span>
                              </div>
                              <Progress value={progressPercentage} className="h-2" />
                            </div>
                          )}
                          
                          {achievement.unlocked && achievement.unlockedAt && (
                            <p className="text-xs text-primary font-medium">
                              ✓ Unlocked on {new Date(achievement.unlockedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};