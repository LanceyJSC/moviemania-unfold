import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Film, Star, Clock, Heart, Eye, 
  Plus, Search, Trash2, Trophy, BookOpen
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useEnhancedWatchlist } from '@/hooks/useEnhancedWatchlist';
import { useFavorites } from '@/hooks/useFavorites';
import { useUserStats } from '@/hooks/useUserStats';
import { useDiary } from '@/hooks/useDiary';
import { tmdbService, Movie } from '@/lib/tmdb';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Navigation } from '@/components/Navigation';
import { MobileHeader } from '@/components/MobileHeader';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

const IMAGE_BASE = 'https://image.tmdb.org/t/p/w185';

const Gallery = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, loading: itemsLoading, removeItem, addItem } = useEnhancedWatchlist();
  const { favorites, loading: favoritesLoading, removeFavorite } = useFavorites();
  const { stats } = useUserStats();
  const { movieDiary, isLoading: diaryLoading, deleteMovieDiaryEntry } = useDiary();
  
  const [movieSearchTerm, setMovieSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [ratedMovies, setRatedMovies] = useState<any[]>([]);
  const [ratedLoading, setRatedLoading] = useState(true);

  // Load rated movies (watched)
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
  }, [user]);

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

  const getUnwatchedItems = () => items.filter(item => !item.watched_at);

  const isLoading = itemsLoading || favoritesLoading || ratedLoading || diaryLoading;

  return (
    <div className="min-h-screen bg-background pb-24">
      <MobileHeader title="Gallery" />
      <Navigation />
      
      <div className="container mx-auto px-4 py-6">
        {/* Stats Section */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          <Card className="p-3 text-center">
            <div className="text-xl font-bold text-foreground">{stats?.total_movies_watched || 0}</div>
            <div className="text-xs text-muted-foreground">Movies</div>
          </Card>
          <Card className="p-3 text-center">
            <div className="text-xl font-bold text-foreground">{Math.round((stats?.total_hours_watched || 0))}h</div>
            <div className="text-xs text-muted-foreground">Hours</div>
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
        </div>

        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold">My Gallery</h1>
            <p className="text-muted-foreground text-xs">Your personal collection</p>
          </div>
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
              <Badge variant="secondary" className="ml-1 text-xs">{favorites.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="watched" className="flex items-center gap-1 text-xs sm:text-sm">
              <Eye className="w-4 h-4" />
              <span className="hidden sm:inline">Watched</span>
              <Badge variant="secondary" className="ml-1 text-xs">{ratedMovies.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="diary" className="flex items-center gap-1 text-xs sm:text-sm">
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Diary</span>
              <Badge variant="secondary" className="ml-1 text-xs">{movieDiary.length}</Badge>
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
              <div className="space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-28 w-full" />)}</div>
            ) : getUnwatchedItems().length > 0 ? (
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {getUnwatchedItems().map(item => (
                  <div key={item.id} className="relative group">
                    <Link to={`/movie/${item.movie_id}`}>
                      {item.movie_poster ? (
                        <img src={`${IMAGE_BASE}${item.movie_poster}`} alt={item.movie_title} className="w-full aspect-[2/3] object-cover rounded-lg" />
                      ) : (
                        <div className="w-full aspect-[2/3] bg-muted rounded-lg flex items-center justify-center">
                          <Film className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </Link>
                    <div className="absolute top-2 right-2">
                      <Plus className="h-5 w-5 text-cinema-gold fill-cinema-gold" />
                    </div>
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex flex-col items-center justify-center gap-2 p-2">
                      <p className="text-white text-xs font-medium text-center line-clamp-2">{item.movie_title}</p>
                      <Button size="sm" variant="destructive" onClick={() => removeItem(item.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No movies in your watchlist</p>
                <p className="text-sm text-muted-foreground mt-2">Add movies using the + button on movie pages!</p>
              </Card>
            )}
          </TabsContent>

          {/* Favorites Tab */}
          <TabsContent value="favorites" className="space-y-4">
            {isLoading ? (
              <div className="grid grid-cols-3 md:grid-cols-6 gap-4">{[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="aspect-[2/3] w-full" />)}</div>
            ) : favorites.length > 0 ? (
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {favorites.map(item => (
                  <div key={item.id} className="relative group">
                    <Link to={`/movie/${item.movie_id}`}>
                      {item.movie_poster ? (
                        <img src={`${IMAGE_BASE}${item.movie_poster}`} alt={item.movie_title} className="w-full aspect-[2/3] object-cover rounded-lg" />
                      ) : (
                        <div className="w-full aspect-[2/3] bg-muted rounded-lg flex items-center justify-center"><Heart className="h-8 w-8 text-muted-foreground" /></div>
                      )}
                    </Link>
                    <div className="absolute top-2 right-2"><Heart className="h-5 w-5 text-cinema-red fill-cinema-red" /></div>
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex flex-col items-center justify-center gap-2 p-2">
                      <p className="text-white text-xs font-medium text-center line-clamp-2">{item.movie_title}</p>
                      <Button size="sm" variant="destructive" onClick={() => removeFavorite(item.movie_id)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No favorite movies yet</p>
                <p className="text-sm text-muted-foreground mt-2">Like movies using the ❤️ button!</p>
              </Card>
            )}
          </TabsContent>

          {/* Watched Tab - Shows rated movies */}
          <TabsContent value="watched" className="space-y-4">
            {isLoading ? (
              <div className="grid grid-cols-3 md:grid-cols-6 gap-4">{[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="aspect-[2/3] w-full" />)}</div>
            ) : ratedMovies.length > 0 ? (
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {ratedMovies.map(item => (
                  <div key={item.id} className="relative group">
                    <Link to={`/movie/${item.movie_id}`}>
                      {item.movie_poster ? (
                        <img src={`${IMAGE_BASE}${item.movie_poster}`} alt={item.movie_title} className="w-full aspect-[2/3] object-cover rounded-lg" />
                      ) : (
                        <div className="w-full aspect-[2/3] bg-muted rounded-lg flex items-center justify-center">
                          <Film className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </Link>
                    <div className="absolute top-2 right-2 bg-black/70 rounded-full px-2 py-1 flex items-center gap-1">
                      <Star className="h-3 w-3 text-cinema-gold fill-cinema-gold" />
                      <span className="text-xs text-white font-medium">{item.rating}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No watched movies yet</p>
                <p className="text-sm text-muted-foreground mt-2">Rate movies using the ⭐ rating to mark them as watched!</p>
              </Card>
            )}
          </TabsContent>

          {/* Diary Tab */}
          <TabsContent value="diary" className="space-y-4">
            {isLoading ? (
              <div className="space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>
            ) : movieDiary.length > 0 ? (
              <div className="space-y-3">
                {movieDiary.map(entry => (
                  <Card key={entry.id} className="p-4">
                    <div className="flex gap-4">
                      <Link to={`/movie/${entry.movie_id}`}>
                        {entry.movie_poster ? (
                          <img src={`${IMAGE_BASE}${entry.movie_poster}`} alt={entry.movie_title} className="w-16 h-24 object-cover rounded" />
                        ) : (
                          <div className="w-16 h-24 bg-muted rounded flex items-center justify-center">
                            <Film className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link to={`/movie/${entry.movie_id}`} className="font-semibold hover:underline line-clamp-1">
                          {entry.movie_title}
                        </Link>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(entry.watched_date), 'MMMM d, yyyy')}
                        </p>
                        {entry.rating && (
                          <div className="flex items-center gap-1 mt-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-3 w-3 ${star <= entry.rating! ? 'fill-cinema-gold text-cinema-gold' : 'text-muted-foreground'}`}
                              />
                            ))}
                          </div>
                        )}
                        {entry.notes && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{entry.notes}</p>
                        )}
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-destructive hover:text-destructive"
                        onClick={() => deleteMovieDiaryEntry.mutate(entry.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No diary entries yet</p>
                <p className="text-sm text-muted-foreground mt-2">Use the Log button on movie pages to track when you watched!</p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Gallery;