import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  Calendar, Film, Tv, Star, Edit2, Trash2, Clock, Heart, Eye, 
  Plus, Search, Grid, List as ListIcon, Tag, StickyNote, Palette
} from 'lucide-react';
import { useDiary, MovieDiaryEntry, TVDiaryEntry } from '@/hooks/useDiary';
import { useAuth } from '@/hooks/useAuth';
import { useWatchlistCollections } from '@/hooks/useWatchlistCollections';
import { useEnhancedWatchlist } from '@/hooks/useEnhancedWatchlist';
import { useFavorites } from '@/hooks/useFavorites';
import { tmdbService, Movie } from '@/lib/tmdb';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DiaryEntryModal from '@/components/DiaryEntryModal';
import { Navigation } from '@/components/Navigation';
import { MobileHeader } from '@/components/MobileHeader';
import { toast } from 'sonner';

const IMAGE_BASE = 'https://image.tmdb.org/t/p/w185';

type Priority = 'low' | 'medium' | 'high';

const priorityColors = {
  low: 'bg-green-500',
  medium: 'bg-yellow-500',
  high: 'bg-red-500'
};

const moodTags = [
  'Action-packed', 'Romantic', 'Mindless Fun', 'Thought-provoking',
  'Feel-good', 'Tearjerker', 'Thrilling', 'Comedy Gold', 'Artistic',
  'Family Time', 'Date Night', 'Solo Watch', 'Weekend Binge'
];

const Gallery = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { movieDiary, tvDiary, isLoading: diaryLoading, deleteMovieDiaryEntry, deleteTVDiaryEntry } = useDiary();
  const { collections, loading: collectionsLoading, createCollection } = useWatchlistCollections();
  const { items, loading: itemsLoading, removeItem, markAsWatched, addItem } = useEnhancedWatchlist();
  const { favorites, loading: favoritesLoading, removeFavorite } = useFavorites();
  
  const [editingEntry, setEditingEntry] = useState<MovieDiaryEntry | TVDiaryEntry | null>(null);
  const [entryType, setEntryType] = useState<'movie' | 'tv'>('movie');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [movieSearchTerm, setMovieSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [filterPriority, setFilterPriority] = useState<Priority | 'all'>('all');
  const [showCreateCollection, setShowCreateCollection] = useState(false);
  const [newCollection, setNewCollection] = useState({ name: '', description: '', color: '#4F46E5' });

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

  const handleEdit = (entry: MovieDiaryEntry | TVDiaryEntry, type: 'movie' | 'tv') => {
    setEditingEntry(entry);
    setEntryType(type);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, type: 'movie' | 'tv') => {
    if (type === 'movie') {
      await deleteMovieDiaryEntry.mutateAsync(id);
    } else {
      await deleteTVDiaryEntry.mutateAsync(id);
    }
  };

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

  const handleCreateCollection = async () => {
    if (!newCollection.name.trim()) {
      toast.error('Collection name is required');
      return;
    }
    await createCollection(newCollection.name, newCollection.description || undefined, newCollection.color, false);
    setShowCreateCollection(false);
    setNewCollection({ name: '', description: '', color: '#4F46E5' });
  };

  const groupByDate = <T extends { watched_date: string }>(entries: T[]) => {
    const grouped: Record<string, T[]> = {};
    entries.forEach((entry) => {
      const date = entry.watched_date;
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(entry);
    });
    return grouped;
  };

  const renderRating = (rating: number | null) => {
    if (!rating) return null;
    return (
      <div className="flex items-center gap-1">
        <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
        <span className="text-xs">{rating}/10</span>
      </div>
    );
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.movie_title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = filterPriority === 'all' || item.priority === filterPriority;
    return matchesSearch && matchesPriority;
  });

  const getUnwatchedItems = () => filteredItems.filter(item => !item.watched_at);
  const getWatchedItems = () => filteredItems.filter(item => item.watched_at);
  const getInProgressItems = () => filteredItems.filter(item => item.progress_percent > 0 && item.progress_percent < 100);

  const isLoading = diaryLoading || collectionsLoading || itemsLoading || favoritesLoading;

  const MovieDiaryList = () => {
    const grouped = groupByDate(movieDiary);
    const dates = Object.keys(grouped).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    if (movieDiary.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <Film className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No movies in your diary yet</p>
          <p className="text-sm">Start tracking movies you watch!</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {dates.map((date) => (
          <div key={date}>
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-primary" />
              <h3 className="font-medium">{format(new Date(date), 'EEEE, MMMM d, yyyy')}</h3>
            </div>
            <div className="grid gap-3">
              {grouped[date].map((entry) => (
                <Card key={entry.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex">
                      <div 
                        className="w-20 h-28 bg-muted flex-shrink-0 cursor-pointer"
                        onClick={() => navigate(`/movie/${entry.movie_id}`)}
                      >
                        {entry.movie_poster ? (
                          <img src={`${IMAGE_BASE}${entry.movie_poster}`} alt={entry.movie_title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Film className="w-8 h-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 p-3 flex flex-col">
                        <div className="flex items-start justify-between">
                          <h4 className="font-medium line-clamp-1 cursor-pointer hover:text-primary" onClick={() => navigate(`/movie/${entry.movie_id}`)}>
                            {entry.movie_title}
                          </h4>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(entry, 'movie')}>
                              <Edit2 className="w-3 h-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(entry.id, 'movie')}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        {renderRating(entry.rating)}
                        {entry.notes && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{entry.notes}</p>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const TVDiaryList = () => {
    const grouped = groupByDate(tvDiary);
    const dates = Object.keys(grouped).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    if (tvDiary.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <Tv className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No TV shows in your diary yet</p>
          <p className="text-sm">Start tracking shows you watch!</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {dates.map((date) => (
          <div key={date}>
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-primary" />
              <h3 className="font-medium">{format(new Date(date), 'EEEE, MMMM d, yyyy')}</h3>
            </div>
            <div className="grid gap-3">
              {grouped[date].map((entry) => (
                <Card key={entry.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex">
                      <div className="w-20 h-28 bg-muted flex-shrink-0 cursor-pointer" onClick={() => navigate(`/tv/${entry.tv_id}`)}>
                        {entry.tv_poster ? (
                          <img src={`${IMAGE_BASE}${entry.tv_poster}`} alt={entry.tv_title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Tv className="w-8 h-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 p-3 flex flex-col">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium line-clamp-1 cursor-pointer hover:text-primary" onClick={() => navigate(`/tv/${entry.tv_id}`)}>
                              {entry.tv_title}
                            </h4>
                            {(entry.season_number || entry.episode_number) && (
                              <div className="flex gap-1 mt-1">
                                {entry.season_number && <Badge variant="outline" className="text-xs">S{entry.season_number}</Badge>}
                                {entry.episode_number && <Badge variant="outline" className="text-xs">E{entry.episode_number}</Badge>}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(entry, 'tv')}>
                              <Edit2 className="w-3 h-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(entry.id, 'tv')}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        {renderRating(entry.rating)}
                        {entry.notes && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{entry.notes}</p>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <MobileHeader title="Gallery" />
      <Navigation />
      
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">My Gallery</h1>
            <p className="text-muted-foreground text-sm">Your personal movie & TV collection</p>
          </div>
        </div>

        <Tabs defaultValue="watchlist" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
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
              <Badge variant="secondary" className="ml-1 text-xs">{getWatchedItems().length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="movies" className="flex items-center gap-1 text-xs sm:text-sm">
              <Film className="w-4 h-4" />
              <span className="hidden sm:inline">Movies</span>
              <Badge variant="secondary" className="ml-1 text-xs">{movieDiary.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="tv" className="flex items-center gap-1 text-xs sm:text-sm">
              <Tv className="w-4 h-4" />
              <span className="hidden sm:inline">TV</span>
              <Badge variant="secondary" className="ml-1 text-xs">{tvDiary.length}</Badge>
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
            <Dialog open={showCreateCollection} onOpenChange={setShowCreateCollection}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Tag className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Collection</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Collection</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input placeholder="Collection name" value={newCollection.name} onChange={(e) => setNewCollection(prev => ({ ...prev, name: e.target.value }))} />
                  <Textarea placeholder="Description (optional)" value={newCollection.description} onChange={(e) => setNewCollection(prev => ({ ...prev, description: e.target.value }))} />
                  <div className="flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    <input type="color" value={newCollection.color} onChange={(e) => setNewCollection(prev => ({ ...prev, color: e.target.value }))} className="w-12 h-8 rounded border" />
                  </div>
                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setShowCreateCollection(false)}>Cancel</Button>
                    <Button onClick={handleCreateCollection}>Create</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
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
              <div className="space-y-3">
                {getUnwatchedItems().map(item => (
                  <Card key={item.id} className="overflow-hidden">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        {item.movie_poster && (
                          <Link to={`/movie/${item.movie_id}`}>
                            <img src={`https://image.tmdb.org/t/p/w92${item.movie_poster}`} alt={item.movie_title} className="w-14 h-20 object-cover rounded" />
                          </Link>
                        )}
                        <div className="flex-1 min-w-0">
                          <Link to={`/movie/${item.movie_id}`}>
                            <h3 className="font-medium hover:text-primary truncate">{item.movie_title}</h3>
                          </Link>
                          <div className="flex items-center gap-2 mt-1">
                            <div className={`w-2 h-2 rounded-full ${priorityColors[item.priority]}`} />
                            <span className="text-xs text-muted-foreground capitalize">{item.priority}</span>
                          </div>
                          {item.mood_tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {item.mood_tags.slice(0, 2).map(tag => (
                                <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" onClick={() => markAsWatched(item.id)}>Watched</Button>
                          <Button size="icon" variant="ghost" onClick={() => removeItem(item.id)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
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
                        <img src={`https://image.tmdb.org/t/p/w300${item.movie_poster}`} alt={item.movie_title} className="w-full aspect-[2/3] object-cover rounded-lg" />
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

          {/* Watched Tab */}
          <TabsContent value="watched" className="space-y-4">
            {isLoading ? (
              <div className="grid grid-cols-3 md:grid-cols-6 gap-4">{[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="aspect-[2/3] w-full" />)}</div>
            ) : getWatchedItems().length > 0 ? (
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {getWatchedItems().map(item => (
                  <div key={item.id} className="relative group">
                    <Link to={`/movie/${item.movie_id}`}>
                      {item.movie_poster && (
                        <img src={`https://image.tmdb.org/t/p/w300${item.movie_poster}`} alt={item.movie_title} className="w-full aspect-[2/3] object-cover rounded-lg" />
                      )}
                    </Link>
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <Badge className="bg-green-600">Watched</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No watched movies yet</p>
                <p className="text-sm text-muted-foreground mt-2">Mark movies as watched to track your history</p>
              </Card>
            )}
          </TabsContent>

          {/* Movies Diary Tab */}
          <TabsContent value="movies">
            {isLoading ? (
              <div className="space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-28 w-full" />)}</div>
            ) : (
              <MovieDiaryList />
            )}
          </TabsContent>

          {/* TV Diary Tab */}
          <TabsContent value="tv">
            {isLoading ? (
              <div className="space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-28 w-full" />)}</div>
            ) : (
              <TVDiaryList />
            )}
          </TabsContent>
        </Tabs>

        {/* Collections */}
        {collections.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Tag className="h-5 w-5" />
              My Collections
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {collections.map(collection => (
                <Card key={collection.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: collection.color }} />
                      <CardTitle className="text-sm">{collection.name}</CardTitle>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      <DiaryEntryModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingEntry(null); }}
        entry={editingEntry}
        type={entryType}
      />
    </div>
  );
};

export default Gallery;