import { useState, useEffect } from "react";
import { User, Settings, Calendar, Star, Trophy, Film, LogOut, ArrowLeft, Edit3, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { IOSTabBar } from "@/components/IOSTabBar";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

// Mock user data - will be replaced with real user data later
const mockUserData = {
  name: "Movie Enthusiast",
  email: "user@example.com",
  joinDate: "January 2024",
  stats: {
    moviesWatched: 127,
    totalHours: 254,
    avgRating: 4.2,
    favoriteGenre: "Sci-Fi"
  },
  recentActivity: [
    { id: 1, type: "watched", title: "The Dark Knight", rating: 5, date: "2 days ago" },
    { id: 2, type: "liked", title: "Inception", date: "5 days ago" },
    { id: 3, type: "watchlist", title: "Dune: Part Two", date: "1 week ago" },
    { id: 4, type: "watched", title: "Oppenheimer", rating: 4, date: "2 weeks ago" }
  ]
};

export const cleanupAuthState = () => {
  // Remove all Supabase auth keys from localStorage
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      localStorage.removeItem(key);
    }
  });
  // Remove from sessionStorage if in use
  Object.keys(sessionStorage || {}).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      sessionStorage.removeItem(key);
    }
  });
};

const Profile = () => {
  const [scrollY, setScrollY] = useState(0);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  // Handle scroll for header blur effect
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  const handleSignOut = async () => {
    try {
      // Clean up auth state
      cleanupAuthState();
      // Attempt global sign out (fallback if it fails)
      try {
        await signOut();
      } catch (err) {
        // Ignore errors
      }
      // Force page reload for a clean state
      window.location.href = '/auth';
    } catch (error) {
      console.error('Sign out error:', error);
      // Force navigation even if signOut fails
      window.location.href = '/auth';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'watched': return <Film className="h-4 w-4" />;
      case 'liked': return <Star className="h-4 w-4" />;
      case 'watchlist': return <Trophy className="h-4 w-4" />;
      default: return <Film className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'watched': return 'bg-primary/20 text-primary';
      case 'liked': return 'bg-yellow-500/20 text-yellow-600';
      case 'watchlist': return 'bg-green-500/20 text-green-600';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* iOS-style Header with Dynamic Blur */}
      <div 
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          scrollY > 100 
            ? "bg-background/95 backdrop-blur-xl border-b border-border/50" 
            : "bg-transparent"
        )}
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="flex items-center justify-between px-4 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className={cn(
              "rounded-full h-10 w-10 p-0 transition-colors",
              scrollY > 100 ? "text-foreground" : "text-white bg-black/30 backdrop-blur-sm"
            )}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          {scrollY > 100 && (
            <div className="text-center">
              <span className="font-medium text-foreground text-sm">Profile</span>
            </div>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {}}
            className={cn(
              "rounded-full h-10 w-10 p-0 transition-colors",
              scrollY > 100 ? "text-foreground" : "text-white bg-black/30 backdrop-blur-sm"
            )}
          >
            <Edit3 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Hero Profile Section */}
      <div className="relative overflow-hidden">
        <div className="h-[40vh] bg-gradient-to-br from-primary/20 via-primary/10 to-background">
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/80" />
        </div>

        {/* Profile Info Overlay */}
        <div className="absolute inset-x-0 bottom-0 p-6 space-y-4">
          <div className="flex items-end gap-4">
            {/* Avatar */}
            <Avatar className="w-20 h-20 border-4 border-white/20 shadow-lg">
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-semibold">
                {mockUserData.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>

            {/* Info */}
            <div className="flex-1 text-white pb-2">
              <h1 className="font-cinematic text-2xl tracking-wide">
                {mockUserData.name}
              </h1>
              <p className="text-white/80 text-sm">
                {user?.email || mockUserData.email}
              </p>
              <p className="text-white/60 text-xs mt-1">
                Member since {mockUserData.joinDate}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4 bg-card/60 backdrop-blur-sm border-border/50 text-center">
            <div className="text-2xl font-bold text-primary mb-1">
              {mockUserData.stats.moviesWatched}
            </div>
            <div className="text-xs text-muted-foreground">Movies Watched</div>
          </Card>
          
          <Card className="p-4 bg-card/60 backdrop-blur-sm border-border/50 text-center">
            <div className="text-2xl font-bold text-primary mb-1">
              {mockUserData.stats.totalHours}h
            </div>
            <div className="text-xs text-muted-foreground">Total Hours</div>
          </Card>
          
          <Card className="p-4 bg-card/60 backdrop-blur-sm border-border/50 text-center">
            <div className="text-2xl font-bold text-primary mb-1">
              {mockUserData.stats.avgRating}/5
            </div>
            <div className="text-xs text-muted-foreground">Avg Rating</div>
          </Card>
          
          <Card className="p-4 bg-card/60 backdrop-blur-sm border-border/50 text-center">
            <div className="text-sm font-semibold text-primary mb-1">
              {mockUserData.stats.favoriteGenre}
            </div>
            <div className="text-xs text-muted-foreground">Favorite Genre</div>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="bg-card/60 backdrop-blur-sm border-border/50">
          <div className="p-4 space-y-1">
            <h3 className="font-semibold text-foreground mb-3">Quick Actions</h3>
            
            <Button
              variant="ghost"
              className="w-full justify-between h-12 px-4 rounded-xl"
              onClick={() => navigate('/watchlist')}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <Trophy className="h-4 w-4 text-primary" />
                </div>
                <span className="font-medium">My Watchlist</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-between h-12 px-4 rounded-xl"
              onClick={() => {}}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
                  <Star className="h-4 w-4 text-yellow-600" />
                </div>
                <span className="font-medium">My Ratings</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-between h-12 px-4 rounded-xl"
              onClick={() => {}}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                </div>
                <span className="font-medium">Settings</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-card/60 backdrop-blur-sm border-border/50">
          <div className="p-4">
            <h3 className="font-semibold text-foreground mb-4">Recent Activity</h3>
            
            <div className="space-y-3">
              {mockUserData.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", getActivityColor(activity.type))}>
                    {getActivityIcon(activity.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground text-sm truncate">
                        {activity.title}
                      </span>
                      {activity.rating && (
                        <Badge variant="secondary" className="text-xs">
                          ⭐ {activity.rating}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground capitalize">
                      {activity.type} • {activity.date}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Sign Out */}
        <Card className="bg-card/60 backdrop-blur-sm border-border/50">
          <div className="p-4">
            <Button
              variant="ghost"
              className="w-full justify-start h-12 px-4 rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleSignOut}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center">
                  <LogOut className="h-4 w-4" />
                </div>
                <span className="font-medium">Sign Out</span>
              </div>
            </Button>
          </div>
        </Card>
      </div>

      {/* iOS Tab Bar */}
      <IOSTabBar />
    </div>
  );
};

export default Profile;