import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AvatarUpload } from '@/components/AvatarUpload';
import { ProfileEditor } from '@/components/ProfileEditor';
import { 
  Calendar, 
  Clock, 
  Star, 
  Trophy, 
  Users, 
  Bell, 
  MapPin, 
  List,
  Sparkles,
  Heart,
  LogOut,
  User,
  Settings,
  UserPlus,
  Grid3X3,
  Film
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { MobileHeader } from '@/components/MobileHeader';

// Mock user data - will be replaced with real user data later
const mockUserData = {
  level: 5,
  points: 1247,
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
  const [activeSection, setActiveSection] = useState('timeline');
  const { user, signOut } = useAuth();
  const { profile, loading, updateProfile } = useProfile();
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
        navigate('/social/friends');
        break;
      default:
        break;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center">
        <p className="text-muted-foreground">Profile not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      {/* Mobile Header */}
      <div className="block lg:hidden">
        <MobileHeader title={profile.username} showBack={false} />
      </div>

      <div className="container mx-auto px-4 md:px-6 pt-4 md:pt-8 pb-24">
        {/* Navigation Buttons */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button
            variant={activeSection === 'timeline' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveSection('timeline')}
            className="flex items-center gap-2"
          >
            <Clock className="h-4 w-4" />
            Timeline
          </Button>
          <Button
            variant={activeSection === 'features' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveSection('features')}
            className="flex items-center gap-2"
          >
            <Grid3X3 className="h-4 w-4" />
            Features
          </Button>
          <Button
            variant={activeSection === 'friends' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveSection('friends')}
            className="flex items-center gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Friends
          </Button>
          <Button
            variant={activeSection === 'settings' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveSection('settings')}
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Settings
          </Button>
        </div>

        {/* Profile Header */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-6 mb-8">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 md:h-24 md:w-24">
              <AvatarImage src={profile.avatar_url} alt={profile.username} />
              <AvatarFallback className="text-xl font-semibold bg-primary text-primary-foreground">
                {profile.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                {profile.full_name || profile.username}
              </h1>
              <p className="text-muted-foreground">@{profile.username}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary" className="text-xs">
                  <Trophy className="w-3 h-3 mr-1" />
                  Level {mockUserData.level}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <Star className="w-3 h-3 mr-1" />
                  {mockUserData.points} points
                </Badge>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-foreground">{mockUserData.stats.moviesWatched}</div>
              <div className="text-xs text-muted-foreground">Movies</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-foreground">{mockUserData.stats.totalHours}h</div>
              <div className="text-xs text-muted-foreground">Hours</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-foreground">{mockUserData.stats.avgRating}</div>
              <div className="text-xs text-muted-foreground">Avg Rating</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-lg font-bold text-foreground">{mockUserData.stats.favoriteGenre}</div>
              <div className="text-xs text-muted-foreground">Top Genre</div>
            </Card>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {activeSection === 'timeline' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockUserData.recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center space-x-4 p-4 bg-muted/20 rounded-lg">
                      <div className="flex-shrink-0">
                        {activity.type === 'watched' && <Film className="h-6 w-6 text-primary" />}
                        {activity.type === 'liked' && <Heart className="h-6 w-6 text-red-500" />}
                        {activity.type === 'watchlist' && <List className="h-6 w-6 text-blue-500" />}
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
                                  <Star key={i} className="h-3 w-3 text-yellow-500 fill-current" />
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

          {activeSection === 'friends' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" />
                Friends & Social
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="cursor-pointer hover:shadow-md transition-shadow" 
                      onClick={() => navigate('/social/friends')}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <Users className="h-8 w-8 text-primary" />
                      <div>
                        <CardTitle className="text-lg">Find Friends</CardTitle>
                        <CardDescription>Discover and connect with friends</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                <Card className="cursor-pointer hover:shadow-md transition-shadow" 
                      onClick={() => navigate('/social/lists')}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <List className="h-8 w-8 text-primary" />
                      <div>
                        <CardTitle className="text-lg">Social Lists</CardTitle>
                        <CardDescription>Create and share movie lists</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                <Card className="cursor-pointer hover:shadow-md transition-shadow" 
                      onClick={() => navigate('/social/achievements')}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <Trophy className="h-8 w-8 text-primary" />
                      <div>
                        <CardTitle className="text-lg">Achievements</CardTitle>
                        <CardDescription>Your movie watching achievements</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                <Card className="cursor-pointer hover:shadow-md transition-shadow" 
                      onClick={() => navigate('/recommendations')}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <Sparkles className="h-8 w-8 text-primary" />
                      <div>
                        <CardTitle className="text-lg">Recommendations</CardTitle>
                        <CardDescription>Personalized movie suggestions</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </div>
            </div>
          )}

          {activeSection === 'features' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                App Features
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="cursor-pointer hover:shadow-md transition-shadow" 
                      onClick={() => handleFeatureNavigation('notifications')}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <Bell className="h-8 w-8 text-primary" />
                      <div>
                        <CardTitle className="text-lg">Notifications</CardTitle>
                        <CardDescription>Stay updated with the latest</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                <Card className="cursor-pointer hover:shadow-md transition-shadow" 
                      onClick={() => handleFeatureNavigation('cinemas')}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <MapPin className="h-8 w-8 text-primary" />
                      <div>
                        <CardTitle className="text-lg">Cinemas</CardTitle>
                        <CardDescription>Find nearby theaters</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                <Card className="cursor-pointer hover:shadow-md transition-shadow" 
                      onClick={() => handleFeatureNavigation('watchlist')}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <List className="h-8 w-8 text-primary" />
                      <div>
                        <CardTitle className="text-lg">Watchlist</CardTitle>
                        <CardDescription>Your saved movies & shows</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                <Card className="cursor-pointer hover:shadow-md transition-shadow" 
                      onClick={() => navigate('/discover/movies')}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <Star className="h-8 w-8 text-primary" />
                      <div>
                        <CardTitle className="text-lg">Discover</CardTitle>
                        <CardDescription>Find new movies to watch</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </div>
            </div>
          )}

          {activeSection === 'settings' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                Account Settings
              </h2>
              
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Profile</CardTitle>
                    <CardDescription>Manage your profile information</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <AvatarUpload
                      currentAvatarUrl={profile.avatar_url}
                      username={profile.username}
                      onAvatarUpdate={(url) => updateProfile({ avatar_url: url })}
                    />
                    <ProfileEditor
                      initialUsername={profile.username}
                      initialFullName={profile.full_name}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Authentication</CardTitle>
                    <CardDescription>Manage your account security</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Email</p>
                        <p className="text-sm text-muted-foreground">{user?.email}</p>
                      </div>
                    </div>
                    <Button 
                      variant="destructive" 
                      onClick={signOut}
                      className="w-full sm:w-auto"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Preferences</CardTitle>
                    <CardDescription>Customize your app experience</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <p className="font-medium">Notification Settings</p>
                      <p className="text-sm text-muted-foreground">
                        Manage how you receive updates about new releases, friend activity, and more.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="font-medium">Movie Preferences</p>
                      <p className="text-sm text-muted-foreground">
                        Set your favorite genres, actors, and viewing preferences for better recommendations.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Data & Privacy</CardTitle>
                    <CardDescription>Control your data and privacy settings</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <p className="font-medium">Export Data</p>
                      <p className="text-sm text-muted-foreground">
                        Download a copy of your watchlist, ratings, and activity data.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="font-medium">Delete Account</p>
                      <p className="text-sm text-muted-foreground">
                        Permanently delete your account and all associated data.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>

      <Navigation />
    </div>
  );
};

export default Profile;