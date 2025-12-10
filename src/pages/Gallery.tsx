import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Film, Tv, Star, Clock, Heart, Eye, 
  Plus, Search, Trash2, Trophy, BookOpen
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useEnhancedWatchlist } from '@/hooks/useEnhancedWatchlist';
import { useFavorites } from '@/hooks/useFavorites';
import { useUserStats } from '@/hooks/useUserStats';
import { useDiary } from '@/hooks/useDiary';
import { useUserStateContext } from '@/contexts/UserStateContext';
import { tmdbService, Movie } from '@/lib/tmdb';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Navigation } from '@/components/Navigation';
import { MobileHeader } from '@/components/MobileHeader';
import { GalleryMediaCard } from '@/components/GalleryMediaCard';
import { TVShowGalleryCard } from '@/components/TVShowGalleryCard';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { toast } from 'sonner';

const IMAGE_BASE = 'https://image.tmdb.org/t/p/w185';

type MediaFilter = 'all' | 'movies' | 'tv';

const Gallery = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, loading: itemsLoading, removeItem, addItem } = useEnhancedWatchlist();
  const { favorites, loading: favoritesLoading, removeFavorite } = useFavorites();
  const { stats, recalculateStats } = useUserStats();
  const { movieDiary, tvDiary, isLoading: diaryLoading, deleteMovieDiaryEntry, deleteTVDiaryEntry } = useDiary();
  const { setRating, userState, refetch: refetchUserState } = useUserStateContext();
  const [movieSearchTerm, setMovieSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [ratedMovies, setRatedMovies] = useState<any[]>([]);
  const [ratedLoading, setRatedLoading] = useState(true);
  const [mediaFilter, setMediaFilter] = useState<MediaFilter>('all');

  // Recalculate stats on mount and when diary/ratings data changes
  useEffect(() => {
    if (user) {
      recalculateStats();
    }
  }, [user, movieDiary.length, tvDiary.length, ratedMovies.length]);

  // Load rated movies (watched) - also refresh when watchedItems changes
  useEffect(() => {
    const loadRatedMovies = async () => {
      if (!user) {
        setRatedLoading(false);
        return;
      }
      setRatedLoading(true);
      try {
        const { data } = await supabase
          .from('user_ratings')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        setRatedMovies(data || []);
      } catch (error) {
        console.error('Error loading rated movies:', error);
      } finally {
        setRatedLoading(false);
      }
    };
    loadRatedMovies();
  }, [user, userState.watchedItems]);

  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <MobileHeader title="Gallery" />
        <Navigation />
        <div className="container mx-auto px-4 py-20 text-center">
          <Film className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-2">Your Gallery</h1>
          <p className="text-muted-foreground mb-4">Sign in to track your movies and TV shows</p>
          <Button onClick={() => navigate('/auth')}>Sign In</Button>
        </div>
      </div>
    );
  }

  const handleMovieSearch = async () => {
    if (!movieSearchTerm.trim()) {
      toast.error('Please enter a movie title');
      return;
    }
    setIsSearching(true);
    try {
      const response = await tmdbService.searchMovies(movieSearchTerm);
      setSearchResults(response.results || []);
      if ((response.results || []).length === 0) {
        toast.info('No movies found');
      }
    } catch (error) {
      toast.error('Failed to search movies');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddToWatchlist = async (movie: Movie) => {
    const success = await addItem(movie.id, movie.title, movie.poster_path, { priority: 'medium' });
    if (success) {
      setSearchResults(prev => prev.filter(m => m.id !== movie.id));
      setMovieSearchTerm('');
    }
  };

  const getUnwatchedItems = () => {
    const unwatched = items.filter(item => !item.watched_at);
    if (mediaFilter === 'movies') return unwatched.filter(item => (item as any).media_type !== 'tv');
    if (mediaFilter === 'tv') return unwatched.filter(item => (item as any).media_type === 'tv');
    return unwatched;
  };

  const getFilteredFavorites = () => {
    if (mediaFilter === 'movies') return favorites.filter(item => (item as any).media_type !== 'tv');
    if (mediaFilter === 'tv') return favorites.filter(item => (item as any).media_type === 'tv');
    return favorites;
  };

  // Combine rated items with diary entries for "Watched" - diary entries are also watched
  const getWatchedItems = () => {
    // Create a map to deduplicate by movie_id
    const watchedMap = new Map<number, any>();
    
    // Add rated items
    ratedMovies.forEach(item => {
      watchedMap.set(item.movie_id, {
        id: item.id,
        movie_id: item.movie_id,
        movie_title: item.movie_title,
        movie_poster: item.movie_poster,
        rating: item.rating,
        media_type: item.media_type || 'movie',
        source: 'rating'
      });
    });
    
    // Add movie diary entries (if not already rated)
    movieDiary.forEach(entry => {
      if (!watchedMap.has(entry.movie_id)) {
        watchedMap.set(entry.movie_id, {
          id: entry.id,
          movie_id: entry.movie_id,
          movie_title: entry.movie_title,
          movie_poster: entry.movie_poster,
          rating: entry.rating,
          media_type: 'movie',
          source: 'diary'
        });
      } else if (entry.rating && entry.rating > (watchedMap.get(entry.movie_id)?.rating || 0)) {
        // Update rating if diary has higher rating
        const existing = watchedMap.get(entry.movie_id);
        watchedMap.set(entry.movie_id, { ...existing, rating: entry.rating });
      }
    });
    
    // Add TV diary entries (if not already rated)
    tvDiary.forEach(entry => {
      if (!watchedMap.has(entry.tv_id)) {
        watchedMap.set(entry.tv_id, {
          id: entry.id,
          movie_id: entry.tv_id,
          movie_title: entry.tv_title,
          movie_poster: entry.tv_poster,
          rating: entry.rating,
          media_type: 'tv',
          source: 'diary'
        });
      } else if (entry.rating && entry.rating > (watchedMap.get(entry.tv_id)?.rating || 0)) {
        const existing = watchedMap.get(entry.tv_id);
        watchedMap.set(entry.tv_id, { ...existing, rating: entry.rating });
      }
    });
    
    let items = Array.from(watchedMap.values());
    
    if (mediaFilter === 'movies') items = items.filter(item => item.media_type !== 'tv');
    if (mediaFilter === 'tv') items = items.filter(item => item.media_type === 'tv');
    
    return items;
  };

  const getCombinedDiary = () => {
    // Only include entries that have notes (actual diary content)
    const movies = movieDiary
      .filter(entry => entry.notes && entry.notes.trim().length > 0)
      .map(entry => ({ ...entry, type: 'movie' as const }));
    const tv = tvDiary
      .filter(entry => entry.notes && entry.notes.trim().length > 0)
      .map(entry => ({ ...entry, type: 'tv' as const }));
    
    let combined = [...movies, ...tv];
    
    if (mediaFilter === 'movies') combined = movies;
    if (mediaFilter === 'tv') combined = tv;
    
    // Deduplicate by movie_id/tv_id keeping the most recent entry
    const uniqueMap = new Map<string, typeof combined[0]>();
    combined.forEach(entry => {
      const key = entry.type === 'movie' 
        ? `movie-${(entry as any).movie_id}` 
        : `tv-${(entry as any).tv_id}`;
      const existing = uniqueMap.get(key);
      if (!existing || new Date(entry.watched_date) > new Date(existing.watched_date)) {
        uniqueMap.set(key, entry);
      }
    });
    
    return Array.from(uniqueMap.values()).sort((a, b) =>
      new Date(b.watched_date).getTime() - new Date(a.watched_date).getTime()
    );
  };

  const isLoading = itemsLoading || favoritesLoading || ratedLoading || diaryLoading;

  return (
    <div className="min-h-screen bg-background pb-24">
      <MobileHeader title="Gallery" />
      <Navigation />
      
      <div className="container mx-auto px-4 py-6">
        {/* Stats Section - Filtered by media type */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
          {mediaFilter === 'all' && (
            <>
              <Card className="p-3 text-center">
                <div className="flex items-center justify-center gap-1">
                  <Eye className="h-4 w-4 text-cinema-gold" />
                  <span className="text-xl font-bold text-foreground">
                    {(stats?.total_movies_watched || 0) + (stats?.total_tv_shows_watched || 0)}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">Total Watched</div>
              </Card>
              <Card className="p-3 text-center">
                <div className="text-xl font-bold text-foreground">
                  {((stats?.total_hours_watched || 0) + (stats?.total_tv_hours_watched || 0))}h
                </div>
                <div className="text-xs text-muted-foreground">Total Hours</div>
              </Card>
              <Card className="p-3 text-center">
                <div className="text-xl font-bold text-foreground">{stats?.average_rating?.toFixed(1) || '0.0'}</div>
                <div className="text-xs text-muted-foreground">Avg Rating</div>
              </Card>
              <Card className="p-3 text-center">
                <div className="flex items-center justify-center gap-1">
                  <Trophy className="h-4 w-4 text-primary" />
                  <span className="text-xl font-bold text-foreground">{stats?.level || 1}</span>
                </div>
                <div className="text-xs text-muted-foreground">Level</div>
              </Card>
            </>
          )}
          {mediaFilter === 'movies' && (
            <>
              <Card className="p-3 text-center">
                <div className="flex items-center justify-center gap-1">
                  <Film className="h-4 w-4 text-cinema-red" />
                  <span className="text-xl font-bold text-foreground">{stats?.total_movies_watched || 0}</span>
                </div>
                <div className="text-xs text-muted-foreground">Movies Watched</div>
              </Card>
              <Card className="p-3 text-center">
                <div className="text-xl font-bold text-foreground">{stats?.total_hours_watched || 0}h</div>
                <div className="text-xs text-muted-foreground">Movie Hours</div>
              </Card>
              <Card className="p-3 text-center">
                <div className="text-xl font-bold text-foreground">{stats?.average_rating?.toFixed(1) || '0.0'}</div>
                <div className="text-xs text-muted-foreground">Avg Rating</div>
              </Card>
              <Card className="p-3 text-center">
                <div className="flex items-center justify-center gap-1">
                  <Trophy className="h-4 w-4 text-primary" />
                  <span className="text-xl font-bold text-foreground">{stats?.level || 1}</span>
                </div>
                <div className="text-xs text-muted-foreground">Level</div>
              </Card>
            </>
          )}
          {mediaFilter === 'tv' && (
            <>
              <Card className="p-3 text-center">
                <div className="flex items-center justify-center gap-1">
                  <Tv className="h-4 w-4 text-primary" />
                  <span className="text-xl font-bold text-foreground">{stats?.total_tv_shows_watched || 0}</span>
                </div>
                <div className="text-xs text-muted-foreground">TV Shows Watched</div>
              </Card>
              <Card className="p-3 text-center">
                <div className="text-xl font-bold text-foreground">{stats?.total_tv_hours_watched || 0}h</div>
                <div className="text-xs text-muted-foreground">TV Hours</div>
              </Card>
              <Card className="p-3 text-center">
                <div className="text-xl font-bold text-foreground">{stats?.average_rating?.toFixed(1) || '0.0'}</div>
                <div className="text-xs text-muted-foreground">Avg Rating</div>
              </Card>
              <Card className="p-3 text-center">
                <div className="flex items-center justify-center gap-1">
                  <Trophy className="h-4 w-4 text-primary" />
                  <span className="text-xl font-bold text-foreground">{stats?.level || 1}</span>
                </div>
                <div className="text-xs text-muted-foreground">Level</div>
              </Card>
            </>
          )}
        </div>

        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold">My Gallery</h1>
            <p className="text-muted-foreground text-xs">Your personal collection</p>
          </div>
        </div>

        {/* Media Type Filter */}
        <div className="flex gap-2 mb-4">
          <Button
            size="sm"
            variant={mediaFilter === 'all' ? 'default' : 'outline'}
            onClick={() => setMediaFilter('all')}
            className="text-xs"
          >
            All
          </Button>
          <Button
            size="sm"
            variant={mediaFilter === 'movies' ? 'default' : 'outline'}
            onClick={() => setMediaFilter('movies')}
            className="text-xs"
          >
            <Film className="h-3 w-3 mr-1" />
            Movies
          </Button>
          <Button
            size="sm"
            variant={mediaFilter === 'tv' ? 'default' : 'outline'}
            onClick={() => setMediaFilter('tv')}
            className="text-xs"
          >
            <Tv className="h-3 w-3 mr-1" />
            TV Shows
          </Button>
        </div>

        <Tabs defaultValue="watchlist" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="watchlist" className="flex items-center gap-1 text-xs sm:text-sm">
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">Watchlist</span>
              <Badge variant="secondary" className="ml-1 text-xs">{getUnwatchedItems().length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="favorites" className="flex items-center gap-1 text-xs sm:text-sm">
              <Heart className="w-4 h-4" />
              <span className="hidden sm:inline">Favorites</span>
              <Badge variant="secondary" className="ml-1 text-xs">{getFilteredFavorites().length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="watched" className="flex items-center gap-1 text-xs sm:text-sm">
              <Eye className="w-4 h-4" />
              <span className="hidden sm:inline">Watched</span>
              <Badge variant="secondary" className="ml-1 text-xs">{getWatchedItems().length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="diary" className="flex items-center gap-1 text-xs sm:text-sm">
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Diary</span>
              <Badge variant="secondary" className="ml-1 text-xs">{getCombinedDiary().length}</Badge>
            </TabsTrigger>
          </TabsList>

          {/* Search Bar for adding movies */}
          <div className="flex items-center gap-2 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search movies to add..."
                value={movieSearchTerm}
                onChange={(e) => setMovieSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleMovieSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleMovieSearch} disabled={isSearching}>
              {isSearching ? <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" /> : <Plus className="h-4 w-4" />}
            </Button>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="border rounded-lg p-4 bg-card mb-6">
              <h3 className="font-semibold mb-3">Search Results</h3>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {searchResults.slice(0, 6).map(movie => (
                  <div key={movie.id} className="text-center">
                    <img src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`} alt={movie.title} className="w-full aspect-[2/3] object-cover rounded mb-2" />
                    <p className="text-xs font-medium mb-2 line-clamp-2">{movie.title}</p>
                    <Button size="sm" onClick={() => handleAddToWatchlist(movie)} className="w-full text-xs">Add</Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Watchlist Tab */}
          <TabsContent value="watchlist" className="space-y-4">
            {isLoading ? (
              <div className="space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>
            ) : getUnwatchedItems().length > 0 ? (
              <div className="space-y-3">
                {getUnwatchedItems().map(item => {
                  const itemMediaType = ((item as any).media_type || 'movie') as 'movie' | 'tv';
                  
                  if (itemMediaType === 'tv') {
                    return (
                      <TVShowGalleryCard
                        key={item.id}
                        id={item.id}
                        tvId={item.movie_id}
                        title={item.movie_title}
                        poster={item.movie_poster}
                        onDelete={async () => { await removeItem(item.id); refetchUserState(); }}
                      >
                        <p className="text-sm text-muted-foreground">
                          Added {format(new Date(item.added_at), 'MMMM d, yyyy')}
                        </p>
                      </TVShowGalleryCard>
                    );
                  }
                  
                  return (
                    <GalleryMediaCard
                      key={item.id}
                      id={item.id}
                      movieId={item.movie_id}
                      title={item.movie_title}
                      poster={item.movie_poster}
                      mediaType="movie"
                      onDelete={async () => { await removeItem(item.id); refetchUserState(); }}
                    >
                      <p className="text-sm text-muted-foreground">
                        Added {format(new Date(item.added_at), 'MMMM d, yyyy')}
                      </p>
                    </GalleryMediaCard>
                  );
                })}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No {mediaFilter === 'all' ? 'items' : mediaFilter} in your watchlist</p>
                <p className="text-sm text-muted-foreground mt-2">Add movies/shows using the + button on their pages!</p>
              </Card>
            )}
          </TabsContent>

          {/* Favorites Tab */}
          <TabsContent value="favorites" className="space-y-4">
            {isLoading ? (
              <div className="space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>
            ) : getFilteredFavorites().length > 0 ? (
              <div className="space-y-3">
                {getFilteredFavorites().map(item => {
                  const itemMediaType = ((item as any).media_type || 'movie') as 'movie' | 'tv';
                  
                  if (itemMediaType === 'tv') {
                    return (
                      <TVShowGalleryCard
                        key={item.id}
                        id={item.id}
                        tvId={item.movie_id}
                        title={item.movie_title}
                        poster={item.movie_poster}
                        onDelete={async () => { await removeFavorite(item.movie_id); refetchUserState(); }}
                      >
                        <div className="flex items-center gap-1">
                          <Heart className="h-4 w-4 text-cinema-red fill-cinema-red" />
                          <span className="text-sm text-muted-foreground">Favorited</span>
                        </div>
                      </TVShowGalleryCard>
                    );
                  }
                  
                  return (
                    <GalleryMediaCard
                      key={item.id}
                      id={item.id}
                      movieId={item.movie_id}
                      title={item.movie_title}
                      poster={item.movie_poster}
                      mediaType="movie"
                      onDelete={async () => { await removeFavorite(item.movie_id); refetchUserState(); }}
                    >
                      <div className="flex items-center gap-1">
                        <Heart className="h-4 w-4 text-cinema-red fill-cinema-red" />
                        <span className="text-sm text-muted-foreground">Favorited</span>
                      </div>
                    </GalleryMediaCard>
                  );
                })}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No favorite {mediaFilter === 'all' ? 'items' : mediaFilter} yet</p>
                <p className="text-sm text-muted-foreground mt-2">Like movies/shows using the ❤️ button!</p>
              </Card>
            )}
          </TabsContent>

          {/* Watched Tab - Shows rated movies/tv and diary entries */}
          <TabsContent value="watched" className="space-y-4">
            {isLoading ? (
              <div className="space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>
            ) : getWatchedItems().length > 0 ? (
              <div className="space-y-3">
                {getWatchedItems().map(item => {
                  if (item.media_type === 'tv') {
                    return (
                      <TVShowGalleryCard
                        key={`${item.source}-${item.id}`}
                        id={item.id}
                        tvId={item.movie_id}
                        title={item.movie_title}
                        poster={item.movie_poster}
                        userRating={item.rating}
                        onDelete={async () => {
                          if (item.source === 'rating') {
                            await supabase
                              .from('user_ratings')
                              .delete()
                              .eq('id', item.id);
                            const { data } = await supabase
                              .from('user_ratings')
                              .select('*')
                              .eq('user_id', user!.id)
                              .order('created_at', { ascending: false });
                            setRatedMovies(data || []);
                            refetchUserState();
                          } else {
                            await deleteTVDiaryEntry.mutateAsync(item.id);
                            await refetchUserState();
                          }
                        }}
                      >
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4 text-cinema-gold" />
                          <span className="text-sm text-muted-foreground">Watched</span>
                        </div>
                      </TVShowGalleryCard>
                    );
                  }
                  return (
                    <GalleryMediaCard
                      key={`${item.source}-${item.id}`}
                      id={item.id}
                      movieId={item.movie_id}
                      title={item.movie_title}
                      poster={item.movie_poster}
                      mediaType="movie"
                      userRating={item.rating}
                      onDelete={async () => {
                        if (item.source === 'rating') {
                          await supabase
                            .from('user_ratings')
                            .delete()
                            .eq('id', item.id);
                          const { data } = await supabase
                            .from('user_ratings')
                            .select('*')
                            .eq('user_id', user!.id)
                            .order('created_at', { ascending: false });
                          setRatedMovies(data || []);
                          refetchUserState();
                        } else {
                          await deleteMovieDiaryEntry.mutateAsync(item.id);
                          await refetchUserState();
                        }
                      }}
                    >
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4 text-cinema-gold" />
                        <span className="text-sm text-muted-foreground">Watched</span>
                      </div>
                    </GalleryMediaCard>
                  );
                })}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No watched {mediaFilter === 'all' ? 'items' : mediaFilter} yet</p>
                <p className="text-sm text-muted-foreground mt-2">Rate movies/shows using the ⭐ rating to mark them as watched!</p>
              </Card>
            )}
          </TabsContent>

          {/* Diary Tab - Combined Movies and TV */}
          <TabsContent value="diary" className="space-y-4">
            {isLoading ? (
              <div className="space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>
            ) : getCombinedDiary().length > 0 ? (
              <div className="space-y-3">
                {getCombinedDiary().map(entry => {
                  const isMovie = entry.type === 'movie';
                  const id = isMovie ? (entry as any).movie_id : (entry as any).tv_id;
                  const title = isMovie ? (entry as any).movie_title : (entry as any).tv_title;
                  const poster = isMovie ? (entry as any).movie_poster : (entry as any).tv_poster;
                  
                  if (!isMovie) {
                    return (
                      <TVShowGalleryCard
                        key={entry.id}
                        id={entry.id}
                        tvId={id}
                        title={title}
                        poster={poster}
                        userRating={entry.rating}
                        onDelete={async () => { await deleteTVDiaryEntry.mutateAsync(entry.id); await refetchUserState(); }}
                      >
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(entry.watched_date), 'MMMM d, yyyy')}
                        </p>
                        {((entry as any).season_number || (entry as any).episode_number) && (
                          <p className="text-xs text-muted-foreground">
                            S{(entry as any).season_number || '?'} E{(entry as any).episode_number || '?'}
                          </p>
                        )}
                        {entry.notes && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{entry.notes}</p>
                        )}
                      </TVShowGalleryCard>
                    );
                  }
                  
                  return (
                    <GalleryMediaCard
                      key={entry.id}
                      id={entry.id}
                      movieId={id}
                      title={title}
                      poster={poster}
                      mediaType="movie"
                      userRating={entry.rating}
                      onDelete={async () => { await deleteMovieDiaryEntry.mutateAsync(entry.id); await refetchUserState(); }}
                    >
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(entry.watched_date), 'MMMM d, yyyy')}
                      </p>
                      {entry.notes && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{entry.notes}</p>
                      )}
                    </GalleryMediaCard>
                  );
                })}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No diary entries yet</p>
                <p className="text-sm text-muted-foreground mt-2">Use the Log button on movie/TV pages to track when you watched!</p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Gallery;
