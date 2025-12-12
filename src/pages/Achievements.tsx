import { useState, useEffect } from "react";
import { ArrowLeft, Award, Film, Tv, Star, Clock, TrendingUp, Heart, MessageCircle, Users, Zap, Crown, Target, Flame } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Navigation } from "@/components/Navigation";
import { MobileHeader } from "@/components/MobileHeader";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  requirement: number;
  current: number;
  category: 'movies' | 'tv' | 'social' | 'engagement';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  unlocked: boolean;
}

const TIER_COLORS = {
  bronze: 'from-amber-700/30 to-amber-900/20 border-amber-700/50',
  silver: 'from-gray-400/30 to-gray-600/20 border-gray-400/50',
  gold: 'from-yellow-500/30 to-yellow-700/20 border-yellow-500/50',
  platinum: 'from-cyan-400/30 to-cyan-600/20 border-cyan-400/50'
};

const TIER_ICON_COLORS = {
  bronze: 'text-amber-600',
  silver: 'text-gray-400',
  gold: 'text-yellow-500',
  platinum: 'text-cyan-400'
};

export const Achievements = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    moviesWatched: 0,
    tvEpisodes: 0,
    reviews: 0,
    ratings: 0,
    following: 0,
    streak: 0,
    totalHours: 0
  });

  useEffect(() => {
    if (user) {
      loadAchievements();
    }
  }, [user]);

  const loadAchievements = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      // Fetch all relevant counts
      const [
        { count: movieCount },
        { count: tvCount },
        { count: reviewCount },
        { count: ratingCount },
        { count: followingCount },
        { data: userStats },
        { data: movieDiary },
        { data: tvDiary }
      ] = await Promise.all([
        supabase.from('movie_diary').select('id', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('tv_diary').select('id', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('user_reviews').select('id', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('user_ratings').select('id', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('user_follows').select('id', { count: 'exact' }).eq('follower_id', user.id),
        supabase.from('user_stats').select('watching_streak').eq('user_id', user.id).single(),
        supabase.from('movie_diary').select('runtime').eq('user_id', user.id),
        supabase.from('tv_diary').select('runtime').eq('user_id', user.id)
      ]);

      const moviesWatched = movieCount || 0;
      const tvEpisodes = tvCount || 0;
      const reviews = reviewCount || 0;
      const ratings = ratingCount || 0;
      const following = followingCount || 0;
      const streak = userStats?.watching_streak || 0;
      
      const movieHours = movieDiary?.reduce((sum, e) => sum + ((e.runtime || 120) / 60), 0) || 0;
      const tvHours = tvDiary?.reduce((sum, e) => sum + ((e.runtime || 45) / 60), 0) || 0;
      const totalHours = Math.round(movieHours + tvHours);

      setStats({ moviesWatched, tvEpisodes, reviews, ratings, following, streak, totalHours });

      // Define all badges
      const allBadges: Badge[] = [
        // Movie Badges
        {
          id: 'first-movie',
          name: 'First Steps',
          description: 'Watch your first movie',
          icon: <Film className="h-6 w-6" />,
          requirement: 1,
          current: moviesWatched,
          category: 'movies',
          tier: 'bronze',
          unlocked: moviesWatched >= 1
        },
        {
          id: 'movie-enthusiast',
          name: 'Movie Enthusiast',
          description: 'Watch 25 movies',
          icon: <Film className="h-6 w-6" />,
          requirement: 25,
          current: moviesWatched,
          category: 'movies',
          tier: 'silver',
          unlocked: moviesWatched >= 25
        },
        {
          id: 'cinephile',
          name: 'Cinephile',
          description: 'Watch 100 movies',
          icon: <Film className="h-6 w-6" />,
          requirement: 100,
          current: moviesWatched,
          category: 'movies',
          tier: 'gold',
          unlocked: moviesWatched >= 100
        },
        {
          id: 'film-master',
          name: 'Film Master',
          description: 'Watch 500 movies',
          icon: <Crown className="h-6 w-6" />,
          requirement: 500,
          current: moviesWatched,
          category: 'movies',
          tier: 'platinum',
          unlocked: moviesWatched >= 500
        },

        // TV Badges
        {
          id: 'tv-starter',
          name: 'TV Starter',
          description: 'Watch 10 TV episodes',
          icon: <Tv className="h-6 w-6" />,
          requirement: 10,
          current: tvEpisodes,
          category: 'tv',
          tier: 'bronze',
          unlocked: tvEpisodes >= 10
        },
        {
          id: 'binge-watcher',
          name: 'Binge Watcher',
          description: 'Watch 50 TV episodes',
          icon: <Tv className="h-6 w-6" />,
          requirement: 50,
          current: tvEpisodes,
          category: 'tv',
          tier: 'silver',
          unlocked: tvEpisodes >= 50
        },
        {
          id: 'series-addict',
          name: 'Series Addict',
          description: 'Watch 200 TV episodes',
          icon: <Tv className="h-6 w-6" />,
          requirement: 200,
          current: tvEpisodes,
          category: 'tv',
          tier: 'gold',
          unlocked: tvEpisodes >= 200
        },

        // Engagement Badges
        {
          id: 'first-review',
          name: 'Critic',
          description: 'Write your first review',
          icon: <MessageCircle className="h-6 w-6" />,
          requirement: 1,
          current: reviews,
          category: 'engagement',
          tier: 'bronze',
          unlocked: reviews >= 1
        },
        {
          id: 'prolific-reviewer',
          name: 'Prolific Reviewer',
          description: 'Write 25 reviews',
          icon: <MessageCircle className="h-6 w-6" />,
          requirement: 25,
          current: reviews,
          category: 'engagement',
          tier: 'silver',
          unlocked: reviews >= 25
        },
        {
          id: 'top-critic',
          name: 'Top Critic',
          description: 'Write 100 reviews',
          icon: <MessageCircle className="h-6 w-6" />,
          requirement: 100,
          current: reviews,
          category: 'engagement',
          tier: 'gold',
          unlocked: reviews >= 100
        },
        {
          id: 'rating-rookie',
          name: 'Rating Rookie',
          description: 'Rate 10 titles',
          icon: <Star className="h-6 w-6" />,
          requirement: 10,
          current: ratings,
          category: 'engagement',
          tier: 'bronze',
          unlocked: ratings >= 10
        },
        {
          id: 'rating-pro',
          name: 'Rating Pro',
          description: 'Rate 100 titles',
          icon: <Star className="h-6 w-6" />,
          requirement: 100,
          current: ratings,
          category: 'engagement',
          tier: 'gold',
          unlocked: ratings >= 100
        },

        // Social Badges
        {
          id: 'social-butterfly',
          name: 'Social Butterfly',
          description: 'Follow 5 users',
          icon: <Users className="h-6 w-6" />,
          requirement: 5,
          current: following,
          category: 'social',
          tier: 'bronze',
          unlocked: following >= 5
        },
        {
          id: 'community-member',
          name: 'Community Member',
          description: 'Follow 25 users',
          icon: <Users className="h-6 w-6" />,
          requirement: 25,
          current: following,
          category: 'social',
          tier: 'silver',
          unlocked: following >= 25
        },

        // Streak Badges
        {
          id: 'streak-starter',
          name: 'Getting Started',
          description: 'Maintain a 3-day streak',
          icon: <Flame className="h-6 w-6" />,
          requirement: 3,
          current: streak,
          category: 'engagement',
          tier: 'bronze',
          unlocked: streak >= 3
        },
        {
          id: 'streak-week',
          name: 'Week Warrior',
          description: 'Maintain a 7-day streak',
          icon: <Flame className="h-6 w-6" />,
          requirement: 7,
          current: streak,
          category: 'engagement',
          tier: 'silver',
          unlocked: streak >= 7
        },
        {
          id: 'streak-month',
          name: 'Monthly Master',
          description: 'Maintain a 30-day streak',
          icon: <Flame className="h-6 w-6" />,
          requirement: 30,
          current: streak,
          category: 'engagement',
          tier: 'gold',
          unlocked: streak >= 30
        },

        // Watch Time Badges
        {
          id: 'time-10',
          name: 'Time Invested',
          description: 'Watch 10 hours of content',
          icon: <Clock className="h-6 w-6" />,
          requirement: 10,
          current: totalHours,
          category: 'movies',
          tier: 'bronze',
          unlocked: totalHours >= 10
        },
        {
          id: 'time-100',
          name: 'Dedicated Viewer',
          description: 'Watch 100 hours of content',
          icon: <Clock className="h-6 w-6" />,
          requirement: 100,
          current: totalHours,
          category: 'movies',
          tier: 'silver',
          unlocked: totalHours >= 100
        },
        {
          id: 'time-500',
          name: 'Marathon Runner',
          description: 'Watch 500 hours of content',
          icon: <Clock className="h-6 w-6" />,
          requirement: 500,
          current: totalHours,
          category: 'movies',
          tier: 'gold',
          unlocked: totalHours >= 500
        },
      ];

      setBadges(allBadges);
    } catch (error) {
      console.error('Error loading achievements:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const unlockedCount = badges.filter(b => b.unlocked).length;
  const totalBadges = badges.length;

  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-32">
        <MobileHeader title="Achievements" />
        <div className="container mx-auto px-4 py-8">
          <Card className="bg-card border-border">
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">
                <Link to="/auth" className="text-cinema-gold hover:underline">Sign in</Link> to view your achievements.
              </p>
            </CardContent>
          </Card>
        </div>
        <Navigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <MobileHeader title="Achievements" />
      
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center gap-4 p-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold text-foreground">Achievements</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Progress Overview */}
        <Card className="bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-cinema-gold/20 border-purple-500/30">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/30 rounded-lg">
                  <Award className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Badge Collection</p>
                  <p className="text-sm text-muted-foreground">{unlockedCount} of {totalBadges} unlocked</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-cinema-gold">{Math.round((unlockedCount / totalBadges) * 100)}%</p>
            </div>
            <Progress value={(unlockedCount / totalBadges) * 100} className="h-2" />
          </CardContent>
        </Card>

        {/* Unlocked Badges */}
        {badges.filter(b => b.unlocked).length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Award className="h-5 w-5 text-cinema-gold" />
              Unlocked
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {badges.filter(b => b.unlocked).map(badge => (
                <Card 
                  key={badge.id} 
                  className={`bg-gradient-to-br ${TIER_COLORS[badge.tier]} border`}
                >
                  <CardContent className="p-4">
                    <div className={`mb-2 ${TIER_ICON_COLORS[badge.tier]}`}>
                      {badge.icon}
                    </div>
                    <p className="font-semibold text-foreground text-sm">{badge.name}</p>
                    <p className="text-xs text-muted-foreground">{badge.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* In Progress Badges */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-muted-foreground" />
            In Progress
          </h2>
          <div className="space-y-3">
            {badges.filter(b => !b.unlocked).slice(0, 8).map(badge => {
              const progress = Math.min(100, (badge.current / badge.requirement) * 100);
              return (
                <Card key={badge.id} className="bg-card border-border">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg bg-muted/50 text-muted-foreground`}>
                        {badge.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-foreground text-sm">{badge.name}</p>
                          <span className="text-xs text-muted-foreground">
                            {badge.current}/{badge.requirement}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{badge.description}</p>
                        <Progress value={progress} className="h-1.5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      <Navigation />
    </div>
  );
};

export default Achievements;
