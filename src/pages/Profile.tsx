import { useState, useEffect } from "react";
import { User, Settings, Calendar, Star, Trophy, Film, LogOut, MapPin, Bell, Users, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navigation } from "@/components/Navigation";
import { MobileHeader } from "@/components/MobileHeader";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

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

const Profile = () => {
  const [activeSection, setActiveSection] = useState<'timeline' | 'features' | 'settings'>('timeline');
  const { user, signOut } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  const handleFeatureNavigation = (feature: string) => {
    switch (feature) {
      case 'notifications':
        navigate('/notifications');
        break;
      case 'cinemas':
        navigate('/cinemas');
        break;
      case 'watchlist':
        navigate('/watchlist');
        break;
      case 'social':
        toast.info('Social features are coming soon! Stay tuned for updates.', {
          description: 'Connect with friends, share reviews, and discover movies together.'
        });
        break;
      default:
        toast.error('Feature not found');
    }
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      <MobileHeader title="Profile" />
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center space-x-6">
            <div className="h-20 w-20 bg-cinema-red rounded-full flex items-center justify-center">
              <User className="h-10 w-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-cinematic text-foreground tracking-wide">
                 {user?.user_metadata?.full_name || user?.email || 'Movie Enthusiast'}
               </h1>
               <p className="text-muted-foreground">{user?.email}</p>
              <p className="text-sm text-muted-foreground">Member since {mockUserData.joinDate}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-4 mb-6">
              <Card className="bg-card border-border">
                <CardContent className="p-4 text-center">
                  <Film className="h-8 w-8 text-cinema-red mx-auto mb-2" />
                  <div className="text-2xl font-bold text-foreground">{mockUserData.stats.moviesWatched}</div>
                  <div className="text-sm text-muted-foreground">Movies Watched</div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardContent className="p-4 text-center">
                  <Calendar className="h-8 w-8 text-cinema-gold mx-auto mb-2" />
                  <div className="text-2xl font-bold text-foreground">{mockUserData.stats.totalHours}h</div>
                  <div className="text-sm text-muted-foreground">Total Hours</div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardContent className="p-4 text-center">
                  <Star className="h-8 w-8 text-cinema-gold mx-auto mb-2" />
                  <div className="text-2xl font-bold text-foreground">{mockUserData.stats.avgRating}</div>
                  <div className="text-sm text-muted-foreground">Avg Rating</div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardContent className="p-4 text-center">
                  <Trophy className="h-8 w-8 text-cinema-silver mx-auto mb-2" />
                  <div className="text-lg font-bold text-foreground">{mockUserData.stats.favoriteGenre}</div>
                  <div className="text-sm text-muted-foreground">Favorite Genre</div>
                </CardContent>
              </Card>
            </div>

            {/* Navigation */}
            <div className="space-y-2">
              <Button
                variant={activeSection === 'timeline' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setActiveSection('timeline')}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Movie Timeline
              </Button>
              
              <Button
                variant={activeSection === 'features' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setActiveSection('features')}
              >
                <Star className="h-4 w-4 mr-2" />
                Features & Social
              </Button>
              
              <Button
                variant={activeSection === 'settings' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setActiveSection('settings')}
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              
              <Button
                variant="ghost"
                className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={signOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            {activeSection === 'timeline' && (
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockUserData.recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-center space-x-4 p-4 bg-muted/20 rounded-lg">
                        <div className="flex-shrink-0">
                          {activity.type === 'watched' && <Film className="h-6 w-6 text-cinema-red" />}
                          {activity.type === 'liked' && <Star className="h-6 w-6 text-cinema-gold" />}
                          {activity.type === 'watchlist' && <Calendar className="h-6 w-6 text-cinema-silver" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-foreground font-medium">{activity.title}</p>
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <span className="capitalize">{activity.type}</span>
                            {activity.rating && (
                              <>
                                <span>•</span>
                                <div className="flex items-center">
                                  {Array.from({ length: activity.rating }).map((_, i) => (
                                    <Star key={i} className="h-3 w-3 text-cinema-gold fill-current" />
                                  ))}
                                </div>
                              </>
                            )}
                            <span>•</span>
                            <span>{activity.date}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {activeSection === 'features' && (
              <div className="space-y-6">
                {/* Quick Access Features */}
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-foreground">Quick Access</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button
                        variant="outline"
                        className="h-20 flex flex-col items-center gap-2 hover:bg-muted/50"
                        onClick={() => handleFeatureNavigation('notifications')}
                      >
                        <div className="relative">
                          <Bell className="h-6 w-6" />
                          {unreadCount > 0 && (
                            <Badge 
                              variant="destructive" 
                              className="absolute -top-2 -right-2 h-4 w-4 p-0 text-[8px] flex items-center justify-center rounded-full"
                            >
                              {unreadCount > 9 ? '9+' : unreadCount}
                            </Badge>
                          )}
                        </div>
                        <span className="text-sm">Notifications</span>
                      </Button>
                      
                      <Button
                        variant="outline"
                        className="h-20 flex flex-col items-center gap-2 hover:bg-muted/50"
                        onClick={() => handleFeatureNavigation('cinemas')}
                      >
                        <MapPin className="h-6 w-6" />
                        <span className="text-sm">Find Cinemas</span>
                      </Button>
                      
                      <Button
                        variant="outline"
                        className="h-20 flex flex-col items-center gap-2 hover:bg-muted/50"
                        onClick={() => handleFeatureNavigation('watchlist')}
                      >
                        <Film className="h-6 w-6" />
                        <span className="text-sm">My Watchlist</span>
                      </Button>
                      
                      <Button
                        variant="outline"
                        className="h-20 flex flex-col items-center gap-2 hover:bg-muted/50"
                        onClick={() => handleFeatureNavigation('social')}
                      >
                        <Users className="h-6 w-6" />
                        <span className="text-sm">Social Features</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Social Features Preview */}
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-foreground flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Social Features
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-sm text-muted-foreground mb-4">
                      Connect with other movie enthusiasts and share your passion for cinema.
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg opacity-60">
                        <Users className="h-5 w-5" />
                        <div>
                          <div className="font-medium">Friends & Following</div>
                          <div className="text-sm text-muted-foreground">Connect with friends and see what they're watching</div>
                        </div>
                        <Badge variant="outline">Coming Soon</Badge>
                      </div>
                      
                      <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg opacity-60">
                        <Film className="h-5 w-5" />
                        <div>
                          <div className="font-medium">Community Lists</div>
                          <div className="text-sm text-muted-foreground">Create and share movie collections</div>
                        </div>
                        <Badge variant="outline">Coming Soon</Badge>
                      </div>
                      
                      <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg opacity-60">
                        <Award className="h-5 w-5" />
                        <div>
                          <div className="font-medium">Achievements</div>
                          <div className="text-sm text-muted-foreground">Unlock badges for your movie journey</div>
                        </div>
                        <Badge variant="outline">Coming Soon</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recommendations Engine Preview */}
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-foreground flex items-center gap-2">
                      <Star className="h-5 w-5" />
                      Personalized Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground mb-4">
                      Get AI-powered movie recommendations based on your viewing history and preferences.
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg opacity-60">
                      <Star className="h-5 w-5" />
                      <div>
                        <div className="font-medium">Smart Recommendations</div>
                        <div className="text-sm text-muted-foreground">Because you liked X, you might like Y</div>
                      </div>
                      <Badge variant="outline">Coming Soon</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeSection === 'settings' && (
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Account Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-4">Authentication</h3>
                    <div className="space-y-3">
                      <Button className="w-full bg-cinema-red hover:bg-cinema-red/90">
                        Sign in with Google
                      </Button>
                      <Button variant="outline" className="w-full border-border hover:bg-card">
                        Sign in with Apple
                      </Button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-4">Preferences</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-foreground">Email Notifications</span>
                        <Button variant="outline" size="sm">Toggle</Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-foreground">Dark Theme</span>
                        <Button variant="outline" size="sm">Enabled</Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-foreground">Auto-play Trailers</span>
                        <Button variant="outline" size="sm">Toggle</Button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-4">Data</h3>
                    <div className="space-y-3">
                      <Button variant="outline" className="w-full border-border hover:bg-card">
                        Export My Data
                      </Button>
                      <Button variant="destructive" className="w-full">
                        Delete Account
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <Navigation />
    </div>
  );
};

export default Profile;
