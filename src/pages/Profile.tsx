import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AvatarUpload } from '@/components/AvatarUpload';
import { ProfileEditor } from '@/components/ProfileEditor';
import { LogOut, Settings, BarChart3, Award, MessageCircle } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { MobileHeader } from '@/components/MobileHeader';
import { DesktopHeader } from '@/components/DesktopHeader';
import { useUserRole } from '@/hooks/useUserRole';

const Profile = () => {
  const { user, signOut } = useAuth();
  const { role } = useUserRole();
  const { profile, updateProfile, loading } = useProfile();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 pb-24 md:pb-12">
      <DesktopHeader />
      <MobileHeader title="Settings" showBack={false} />

      <div className="px-4 md:px-6 pt-4 max-w-7xl mx-auto">
        {/* Profile Header */}
        <div className="flex items-center gap-4 mb-8">
          <Avatar className="h-16 w-16">
            <AvatarImage src={profile.avatar_url} alt={profile.username} />
            <AvatarFallback className="text-xl font-semibold bg-primary text-primary-foreground">
              {profile.username?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {profile.username}
            </h1>
            <p className="text-muted-foreground text-sm">@{profile.username}</p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Link to="/stats" className="touch-manipulation">
            <Card className="bg-gradient-to-br from-blue-500/20 to-blue-500/5 border-blue-500/30 hover:border-blue-500/50 active:scale-95 transition-all">
              <CardContent className="p-4 text-center">
                <BarChart3 className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                <p className="text-xs font-medium text-foreground">Stats</p>
              </CardContent>
            </Card>
          </Link>
          <Link to="/achievements" className="touch-manipulation">
            <Card className="bg-gradient-to-br from-purple-500/20 to-purple-500/5 border-purple-500/30 hover:border-purple-500/50 active:scale-95 transition-all">
              <CardContent className="p-4 text-center">
                <Award className="h-6 w-6 text-purple-500 mx-auto mb-2" />
                <p className="text-xs font-medium text-foreground">Badges</p>
              </CardContent>
            </Card>
          </Link>
          <Link to="/my-reviews" className="touch-manipulation">
            <Card className="bg-gradient-to-br from-green-500/20 to-green-500/5 border-green-500/30 hover:border-green-500/50 active:scale-95 transition-all">
              <CardContent className="p-4 text-center">
                <MessageCircle className="h-6 w-6 text-green-500 mx-auto mb-2" />
                <p className="text-xs font-medium text-foreground">Reviews</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Settings Content */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Account Settings</h2>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Profile</CardTitle>
              <CardDescription>Manage your profile information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <AvatarUpload
                currentAvatarUrl={profile.avatar_url}
                userId={user?.id || ''}
                onAvatarUpdate={(url) => updateProfile({ avatar_url: url })}
              />
              <ProfileEditor
                initialUsername={profile.username}
                currentProfile={profile}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Account</CardTitle>
              <CardDescription>Manage your account security</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-border">
                <div>
                  <p className="font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
              </div>
              {role && (
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <div>
                    <p className="font-medium">Role</p>
                    <p className="text-sm text-muted-foreground capitalize">{role}</p>
                  </div>
                </div>
              )}
              <div className="flex flex-col gap-3 pt-2">
                <Button 
                  variant="destructive" 
                  onClick={signOut}
                  className="w-full sm:w-auto h-12 touch-manipulation active:scale-95"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Preferences</CardTitle>
              <CardDescription>Customize your app experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="py-2 border-b border-border">
                <p className="font-medium">Notification Settings</p>
                <p className="text-sm text-muted-foreground">
                  Manage how you receive updates about new releases and more.
                </p>
              </div>
              <div className="py-2">
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
              <div className="py-2 border-b border-border">
                <p className="font-medium">Export Data</p>
                <p className="text-sm text-muted-foreground">
                  Download a copy of your watchlist, ratings, and reviews.
                </p>
              </div>
              <div className="py-2">
                <p className="font-medium text-destructive">Delete Account</p>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all associated data.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Navigation />
    </div>
  );
};

export default Profile;