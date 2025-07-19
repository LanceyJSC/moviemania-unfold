
import { useState, useEffect } from "react";
import { User, Settings, Calendar, Star, Trophy, Film, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

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
  const [activeSection, setActiveSection] = useState<'timeline' | 'settings'>('timeline');
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-background">
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
    </div>
  );
};

export default Profile;
