import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { MobileHeader } from "@/components/MobileHeader";
import { Navigation } from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Film, Star, List, Heart, Eye, Bookmark, MessageSquare } from "lucide-react";
import { FollowButton } from "@/components/FollowButton";
import { ActivityFeed } from "@/components/ActivityFeed";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { tmdbService } from "@/lib/tmdb";

interface UserProfileData {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  follower_count: number;
  following_count: number;
  created_at: string;
}

interface DiaryEntry {
  id: string;
  movie_id: number;
  movie_title: string;
  movie_poster: string | null;
  rating: number | null;
  watched_date: string;
}

interface UserList {
  id: string;
  name: string;
  description: string | null;
  is_public: boolean;
}

interface WatchedItem {
  id: string;
  movie_id: number;
  movie_title: string;
  movie_poster: string | null;
  rating: number | null;
  media_type: string;
}

interface FavoriteItem {
  id: string;
  movie_id: number;
  movie_title: string;
  movie_poster: string | null;
  media_type: string;
}

interface WatchlistItem {
  id: string;
  movie_id: number;
  movie_title: string;
  movie_poster: string | null;
  media_type: string;
}

interface ReviewItem {
  id: string;
  movie_id: number;
  movie_title: string;
  movie_poster: string | null;
  rating: number | null;
  review_text: string | null;
  is_spoiler: boolean;
  created_at: string;
}

const UserProfile = () => {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [diary, setDiary] = useState<DiaryEntry[]>([]);
  const [lists, setLists] = useState<UserList[]>([]);
  const [watched, setWatched] = useState<WatchedItem[]>([]);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [watchlistItems, setWatchlistItems] = useState<WatchlistItem[]>([]);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("activity");

  useEffect(() => {
    if (username) {
      fetchProfile();
    }
  }, [username]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      
      // Fetch profile by username or id
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .or(`username.eq.${username},id.eq.${username}`)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch public diary entries
      const { data: diaryData } = await supabase
        .from('movie_diary')
        .select('*')
        .eq('user_id', profileData.id)
        .eq('is_public', true)
        .order('watched_date', { ascending: false })
        .limit(12);

      setDiary(diaryData || []);

      // Fetch public lists
      const { data: listsData } = await supabase
        .from('user_lists')
        .select('*')
        .eq('user_id', profileData.id)
        .eq('is_public', true)
        .order('updated_at', { ascending: false });

      setLists(listsData || []);

      // Fetch public watched items (from user_ratings)
      const { data: watchedData } = await supabase
        .from('user_ratings')
        .select('*')
        .eq('user_id', profileData.id)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(24);

      setWatched(watchedData || []);

      // Fetch public favorites (from watchlist with list_type = 'liked')
      const { data: favoritesData } = await supabase
        .from('watchlist')
        .select('*')
        .eq('user_id', profileData.id)
        .eq('list_type', 'liked')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(24);

      setFavorites(favoritesData || []);

      // Fetch public watchlist items
      const { data: watchlistData } = await supabase
        .from('watchlist')
        .select('*')
        .eq('user_id', profileData.id)
        .eq('list_type', 'watchlist')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(24);

      setWatchlistItems(watchlistData || []);

      // Fetch public reviews
      const { data: reviewsData } = await supabase
        .from('user_reviews')
        .select('*')
        .eq('user_id', profileData.id)
        .order('created_at', { ascending: false })
        .limit(24);

      setReviews(reviewsData || []);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <MobileHeader title="Profile" />
        <div className="px-4 pt-4">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-20 w-20 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
          </Card>
        </div>
        <Navigation />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <MobileHeader title="Profile" />
        <div className="px-4 pt-4">
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">User not found</p>
          </Card>
        </div>
        <Navigation />
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === profile.id;

  return (
    <div className="min-h-screen bg-background pb-24">
      <MobileHeader title="Profile" />
      
      <div className="px-4 pt-4 pb-8">
        {/* Profile Header */}
        <Card className="p-6 mb-6">
          <div className="flex items-start gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="text-2xl">
                {profile.username?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="font-cinematic text-xl text-foreground">
                    {profile.username || 'User'}
                  </h1>
                  {profile.full_name && (
                    <p className="text-muted-foreground">{profile.full_name}</p>
                  )}
                </div>
                
                {!isOwnProfile && (
                  <FollowButton userId={profile.id} />
                )}
                
                {isOwnProfile && (
                  <Link to="/profile">
                    <Badge variant="outline">Edit Profile</Badge>
                  </Link>
                )}
              </div>
              
              <div className="flex items-center gap-4 mt-3">
                <div className="text-center">
                  <p className="font-semibold text-foreground">{profile.follower_count}</p>
                  <p className="text-xs text-muted-foreground">Followers</p>
                </div>
                <div className="text-center">
                  <p className="font-semibold text-foreground">{profile.following_count}</p>
                  <p className="text-xs text-muted-foreground">Following</p>
                </div>
                <div className="text-center">
                  <p className="font-semibold text-foreground">{diary.length}</p>
                  <p className="text-xs text-muted-foreground">Films</p>
                </div>
              </div>
              
              {profile.bio && (
                <p className="text-sm text-muted-foreground mt-3">{profile.bio}</p>
              )}
            </div>
          </div>
        </Card>

        {/* Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start mb-4 overflow-x-auto">
            <TabsTrigger value="activity" className="flex items-center gap-1">
              <Heart className="h-4 w-4" />
              Activity
            </TabsTrigger>
            <TabsTrigger value="watched" className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              Watched
            </TabsTrigger>
            <TabsTrigger value="favorites" className="flex items-center gap-1">
              <Heart className="h-4 w-4" />
              Favorites
            </TabsTrigger>
            <TabsTrigger value="watchlist" className="flex items-center gap-1">
              <Bookmark className="h-4 w-4" />
              Watchlist
            </TabsTrigger>
            <TabsTrigger value="reviews" className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              Reviews
            </TabsTrigger>
            <TabsTrigger value="diary" className="flex items-center gap-1">
              <Film className="h-4 w-4" />
              Diary
            </TabsTrigger>
            <TabsTrigger value="lists" className="flex items-center gap-1">
              <List className="h-4 w-4" />
              Lists
            </TabsTrigger>
          </TabsList>

          <TabsContent value="activity">
            <ActivityFeed userId={profile.id} />
          </TabsContent>

          <TabsContent value="watched">
            {watched.length === 0 ? (
              <Card className="p-8 text-center">
                <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No public watched items</p>
              </Card>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {watched.map((item) => (
                  <Link key={item.id} to={item.media_type === 'tv' ? `/tv/${item.movie_id}` : `/movie/${item.movie_id}`}>
                    <div className="relative group">
                      <img
                        src={item.movie_poster 
                          ? tmdbService.getPosterUrl(item.movie_poster, 'w300')
                          : '/placeholder.svg'
                        }
                        alt={item.movie_title}
                        className="w-full aspect-[2/3] object-cover rounded-lg"
                      />
                      {item.rating && (
                        <div className="absolute bottom-1 right-1 bg-background/80 backdrop-blur-sm rounded px-1.5 py-0.5 flex items-center gap-0.5">
                          <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                          <span className="text-xs font-medium">{item.rating}</span>
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="favorites">
            {favorites.length === 0 ? (
              <Card className="p-8 text-center">
                <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No public favorites</p>
              </Card>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {favorites.map((item) => (
                  <Link key={item.id} to={item.media_type === 'tv' ? `/tv/${item.movie_id}` : `/movie/${item.movie_id}`}>
                    <div className="relative group">
                      <img
                        src={item.movie_poster 
                          ? tmdbService.getPosterUrl(item.movie_poster, 'w300')
                          : '/placeholder.svg'
                        }
                        alt={item.movie_title}
                        className="w-full aspect-[2/3] object-cover rounded-lg"
                      />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="watchlist">
            {watchlistItems.length === 0 ? (
              <Card className="p-8 text-center">
                <Bookmark className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No public watchlist items</p>
              </Card>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {watchlistItems.map((item) => (
                  <Link key={item.id} to={item.media_type === 'tv' ? `/tv/${item.movie_id}` : `/movie/${item.movie_id}`}>
                    <div className="relative group">
                      <img
                        src={item.movie_poster 
                          ? tmdbService.getPosterUrl(item.movie_poster, 'w300')
                          : '/placeholder.svg'
                        }
                        alt={item.movie_title}
                        className="w-full aspect-[2/3] object-cover rounded-lg"
                      />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="reviews">
            {reviews.length === 0 ? (
              <Card className="p-8 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No reviews yet</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <Link key={review.id} to={`/movie/${review.movie_id}`}>
                    <Card className="p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex gap-3">
                        <img
                          src={review.movie_poster 
                            ? tmdbService.getPosterUrl(review.movie_poster, 'w300')
                            : '/placeholder.svg'
                          }
                          alt={review.movie_title}
                          className="w-12 h-18 object-cover rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-foreground truncate">{review.movie_title}</h3>
                            {review.rating && (
                              <div className="flex items-center gap-0.5 shrink-0">
                                <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                                <span className="text-xs font-medium">{review.rating}</span>
                              </div>
                            )}
                          </div>
                          {review.is_spoiler ? (
                            <p className="text-sm text-muted-foreground italic mt-1">Contains spoilers</p>
                          ) : (
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                              {review.review_text}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(review.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="diary">
            {diary.length === 0 ? (
              <Card className="p-8 text-center">
                <Film className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No public diary entries</p>
              </Card>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {diary.map((entry) => (
                  <Link key={entry.id} to={`/movie/${entry.movie_id}`}>
                    <div className="relative group">
                      <img
                        src={entry.movie_poster 
                          ? tmdbService.getPosterUrl(entry.movie_poster, 'w300')
                          : '/placeholder.svg'
                        }
                        alt={entry.movie_title}
                        className="w-full aspect-[2/3] object-cover rounded-lg"
                      />
                      {entry.rating && (
                        <div className="absolute bottom-1 right-1 bg-background/80 backdrop-blur-sm rounded px-1.5 py-0.5 flex items-center gap-0.5">
                          <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                          <span className="text-xs font-medium">{entry.rating}</span>
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="lists">
            {lists.length === 0 ? (
              <Card className="p-8 text-center">
                <List className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No public lists yet</p>
              </Card>
            ) : (
              <div className="grid gap-3">
                {lists.map((list) => (
                  <Link key={list.id} to={`/lists/${list.id}`}>
                    <Card className="p-4 hover:bg-muted/50 transition-colors">
                      <h3 className="font-medium text-foreground">{list.name}</h3>
                      {list.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {list.description}
                        </p>
                      )}
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Navigation />
    </div>
  );
};

export default UserProfile;
