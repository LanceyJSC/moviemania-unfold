import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useSubscription } from '@/hooks/useSubscription';
import { useTasteProfile } from '@/hooks/useTasteProfile';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { AvatarUpload } from '@/components/AvatarUpload';
import { ProfileEditor } from '@/components/ProfileEditor';
import { ProBadge } from '@/components/ProBadge';
import { TasteProfileCard } from '@/components/TasteProfileCard';
import { ProUpgradeModal } from '@/components/ProUpgradeModal';
import { ThemeCustomizer } from '@/components/ThemeCustomizer';
import { ImportData } from '@/components/ImportData';
import { LogOut, Settings, BarChart3, Award, MessageCircle, Sparkles, Download, Trash2, Loader2, Crown, Tags } from 'lucide-react';
import { TagManager } from '@/components/TagManager';
import { useNavigate, Link } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { MobileHeader } from '@/components/MobileHeader';
import { DesktopHeader } from '@/components/DesktopHeader';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const Profile = () => {
  const { user, signOut } = useAuth();
  const { role } = useUserRole();
  const { profile, updateProfile, loading } = useProfile();
  const { preferences, updatePreferences, isLoading: preferencesLoading } = useUserPreferences();
  const { isProUser } = useSubscription();
  const { profile: tasteProfile, loading: tasteLoading, error: tasteError } = useTasteProfile();
  const navigate = useNavigate();
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showProModal, setShowProModal] = useState(false);

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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 pb-24 2xl:pb-12">
      <DesktopHeader />
      <MobileHeader title="Settings" showBack={false} />

      <div className="px-4 md:px-6 pt-3 2xl:pt-4 max-w-7xl mx-auto">
        {/* Profile Header - Compact on mobile */}
        <div className="flex items-center gap-3 mb-6">
          <Avatar className="h-14 w-14 2xl:h-16 2xl:w-16">
            <AvatarImage src={profile.avatar_url} alt={profile.username} />
            <AvatarFallback className="text-lg 2xl:text-xl font-semibold bg-primary text-primary-foreground">
              {profile.username?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg 2xl:text-xl font-bold text-foreground">
                {profile.username}
              </h1>
              {isProUser && <ProBadge size="md" />}
            </div>
            <p className="text-muted-foreground text-xs 2xl:text-sm">@{profile.username}</p>
          </div>
        </div>

        {/* Quick Links - More compact on mobile */}
        <div className="grid grid-cols-4 gap-2 mb-4 2xl:mb-6">
          <Link to="/wrapped" className="touch-manipulation">
            <Card className="bg-gradient-to-br from-cinema-red/20 to-cinema-gold/20 border-cinema-gold/30 hover:border-cinema-gold/50 active:scale-95 transition-all">
              <CardContent className="p-3 2xl:p-4 text-center">
                <Sparkles className="h-5 w-5 2xl:h-6 2xl:w-6 text-cinema-gold mx-auto mb-1" />
                <p className="text-[10px] 2xl:text-xs font-medium text-foreground">Wrapped</p>
              </CardContent>
            </Card>
          </Link>
          <Link to="/stats" className="touch-manipulation">
            <Card className="bg-gradient-to-br from-blue-500/20 to-blue-500/5 border-blue-500/30 hover:border-blue-500/50 active:scale-95 transition-all">
              <CardContent className="p-3 2xl:p-4 text-center">
                <BarChart3 className="h-5 w-5 2xl:h-6 2xl:w-6 text-blue-500 mx-auto mb-1" />
                <p className="text-[10px] 2xl:text-xs font-medium text-foreground">Stats</p>
              </CardContent>
            </Card>
          </Link>
          <Link to="/achievements" className="touch-manipulation">
            <Card className="bg-gradient-to-br from-purple-500/20 to-purple-500/5 border-purple-500/30 hover:border-purple-500/50 active:scale-95 transition-all">
              <CardContent className="p-3 2xl:p-4 text-center">
                <Award className="h-5 w-5 2xl:h-6 2xl:w-6 text-purple-500 mx-auto mb-1" />
                <p className="text-[10px] 2xl:text-xs font-medium text-foreground">Badges</p>
              </CardContent>
            </Card>
          </Link>
          <Link to="/my-reviews" className="touch-manipulation">
            <Card className="bg-gradient-to-br from-green-500/20 to-green-500/5 border-green-500/30 hover:border-green-500/50 active:scale-95 transition-all">
              <CardContent className="p-3 2xl:p-4 text-center">
                <MessageCircle className="h-5 w-5 2xl:h-6 2xl:w-6 text-green-500 mx-auto mb-1" />
                <p className="text-[10px] 2xl:text-xs font-medium text-foreground">Reviews</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Pro Upgrade Card - Only show for free users */}
        {!isProUser && (
          <Link to="/pro" className="block mb-6">
            <Card className="bg-gradient-to-br from-amber-500/20 to-orange-500/10 border-amber-500/30 hover:border-amber-500/50 transition-all">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-amber-500/30 to-orange-500/30 flex items-center justify-center">
                  <Crown className="h-6 w-6 text-amber-500" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    Upgrade to Pro
                    <ProBadge size="sm" />
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Unlock unlimited lists, smart recommendations & more
                  </p>
                </div>
                <Sparkles className="h-5 w-5 text-amber-500" />
              </CardContent>
            </Card>
          </Link>
        )}

        {/* Taste Profile Card (compact) */}
        <TasteProfileCard
          profile={tasteProfile}
          loading={tasteLoading}
          error={tasteError}
          isProUser={isProUser}
          onUpgradeClick={() => setShowProModal(true)}
          compact
        />

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
              
              {/* Theme Customizer - Pro Feature */}
              <div className="pt-4 border-t border-border">
                <ThemeCustomizer />
              </div>
              
              {/* Tag Manager - Pro Feature */}
              <div className="pt-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium flex items-center gap-2">
                      <Tags className="h-4 w-4" />
                      Custom Tags
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Organize your media with custom labels
                    </p>
                  </div>
                  <TagManager />
                </div>
              </div>
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
              <div className="flex items-center justify-between py-2 border-b border-border">
                <div>
                  <p className="font-medium">Push Notifications</p>
                  <p className="text-sm text-muted-foreground">
                    Get notified about new releases and updates
                  </p>
                </div>
                <Switch
                  checked={preferences?.notifications_enabled ?? true}
                  onCheckedChange={async (checked) => {
                    try {
                      await updatePreferences({ notifications_enabled: checked });
                      toast.success(checked ? 'Notifications enabled' : 'Notifications disabled');
                    } catch {
                      toast.error('Failed to update preferences');
                    }
                  }}
                  disabled={preferencesLoading}
                />
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">
                    Receive email updates about your activity
                  </p>
                </div>
                <Switch
                  checked={preferences?.email_notifications ?? true}
                  onCheckedChange={async (checked) => {
                    try {
                      await updatePreferences({ email_notifications: checked });
                      toast.success(checked ? 'Email notifications enabled' : 'Email notifications disabled');
                    } catch {
                      toast.error('Failed to update preferences');
                    }
                  }}
                  disabled={preferencesLoading}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Data & Privacy</CardTitle>
              <CardDescription>Control your data and privacy settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-border">
                <div>
                  <p className="font-medium">Export Data</p>
                  <p className="text-sm text-muted-foreground">
                    Download a copy of your watchlist, ratings, and reviews
                  </p>
                </div>
                <div className="flex gap-2">
                  <ImportData />
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isExporting}
                    onClick={async () => {
                    if (!user) return;
                    setIsExporting(true);
                    try {
                      const [
                        { data: ratings },
                        { data: reviews },
                        { data: watchlist },
                        { data: movieDiary },
                        { data: tvDiary }
                      ] = await Promise.all([
                        supabase.from('user_ratings').select('*').eq('user_id', user.id),
                        supabase.from('user_reviews').select('*').eq('user_id', user.id),
                        supabase.from('enhanced_watchlist_items').select('*').eq('user_id', user.id),
                        supabase.from('movie_diary').select('*').eq('user_id', user.id),
                        supabase.from('tv_diary').select('*').eq('user_id', user.id)
                      ]);

                      const exportData = {
                        exportedAt: new Date().toISOString(),
                        profile: { username: profile?.username, email: user.email },
                        ratings: ratings || [],
                        reviews: reviews || [],
                        watchlist: watchlist || [],
                        movieDiary: movieDiary || [],
                        tvDiary: tvDiary || []
                      };

                      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `sceneburn-export-${new Date().toISOString().split('T')[0]}.json`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                      toast.success('Data exported successfully!');
                    } catch (error) {
                      console.error('Export error:', error);
                      toast.error('Failed to export data');
                    } finally {
                      setIsExporting(false);
                    }
                  }}
                >
                  {isExporting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </>
                  )}
                </Button>
                </div>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-destructive">Delete Account</p>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete your account and all data
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" disabled={isDeleting}>
                      {isDeleting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </>
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your account
                        and remove all your data including reviews, ratings, watchlists, and diary entries.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={async () => {
                          if (!user) return;
                          setIsDeleting(true);
                          try {
                            // Delete user data from all tables
                            await Promise.all([
                              supabase.from('user_ratings').delete().eq('user_id', user.id),
                              supabase.from('user_reviews').delete().eq('user_id', user.id),
                              supabase.from('enhanced_watchlist_items').delete().eq('user_id', user.id),
                              supabase.from('movie_diary').delete().eq('user_id', user.id),
                              supabase.from('tv_diary').delete().eq('user_id', user.id),
                              supabase.from('watchlist').delete().eq('user_id', user.id),
                              supabase.from('activity_feed').delete().eq('user_id', user.id),
                              supabase.from('user_follows').delete().eq('follower_id', user.id),
                              supabase.from('user_follows').delete().eq('following_id', user.id),
                              supabase.from('user_preferences').delete().eq('user_id', user.id),
                              supabase.from('user_stats').delete().eq('user_id', user.id),
                              supabase.from('profiles').delete().eq('id', user.id),
                            ]);
                            
                            toast.success('Account data deleted. Signing out...');
                            await signOut();
                          } catch (error) {
                            console.error('Delete error:', error);
                            toast.error('Failed to delete account. Please contact support.');
                          } finally {
                            setIsDeleting(false);
                          }
                        }}
                      >
                        Delete Account
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <ProUpgradeModal
        isOpen={showProModal}
        onClose={() => setShowProModal(false)}
        feature="Taste Profile"
        description="Get personalized insights from your ratings including your genre DNA, rating style, and more."
      />

      <Navigation />
    </div>
  );
};

export default Profile;