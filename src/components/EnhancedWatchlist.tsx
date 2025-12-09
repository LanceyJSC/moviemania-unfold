import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Star, 
  Clock, 
  Tag,
  StickyNote,
  Palette,
  Eye,
  Trash2,
  Grid,
  List as ListIcon,
  Heart
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useWatchlistCollections } from '@/hooks/useWatchlistCollections';
import { useEnhancedWatchlist } from '@/hooks/useEnhancedWatchlist';
import { useFavorites } from '@/hooks/useFavorites';
import { tmdbService, Movie } from '@/lib/tmdb';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

type ViewMode = 'grid' | 'list';
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

interface CollectionFormData {
  name: string;
  description: string;
  color: string;
  isPublic: boolean;
}

export const EnhancedWatchlist = () => {
  const { collections, loading: collectionsLoading, createCollection } = useWatchlistCollections();
  const { 
    items, 
    loading: itemsLoading, 
    updateItem, 
    removeItem, 
    markAsWatched,
    addItem
  } = useEnhancedWatchlist();
  const { favorites, loading: favoritesLoading, removeFavorite } = useFavorites();
  
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [movieSearchTerm, setMovieSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [filterPriority, setFilterPriority] = useState<Priority | 'all'>('all');
  const [filterMood, setFilterMood] = useState<string>('all');
  const [showCreateCollection, setShowCreateCollection] = useState(false);
  const [activeTab, setActiveTab] = useState('to-watch');
  const [newCollection, setNewCollection] = useState<CollectionFormData>({
    name: '',
    description: '',
    color: '#4F46E5',
    isPublic: false
  });

  const handleCreateCollection = async () => {
    if (!newCollection.name.trim()) {
      toast.error('Collection name is required');
      return;
    }

    const created = await createCollection(
      newCollection.name,
      newCollection.description || undefined,
      newCollection.color,
      newCollection.isPublic
    );

    if (created) {
      setShowCreateCollection(false);
      setNewCollection({
        name: '',
        description: '',
        color: '#4F46E5',
        isPublic: false
      });
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
      const results = response.results || [];
      setSearchResults(results);
      if (results.length === 0) {
        toast.info('No movies found with that title');
      }
    } catch (error) {
      console.error('Error searching movies:', error);
      toast.error('Failed to search movies');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddToWatchlist = async (movie: Movie) => {
    const success = await addItem(
      movie.id,
      movie.title,
      movie.poster_path,
      { priority: 'medium' }
    );
    
    if (success) {
      setSearchResults(prev => prev.filter(m => m.id !== movie.id));
      setMovieSearchTerm('');
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.movie_title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = filterPriority === 'all' || item.priority === filterPriority;
    const matchesMood = filterMood === 'all' || item.mood_tags.includes(filterMood);
    
    return matchesSearch && matchesPriority && matchesMood;
  });

  const getUnwatchedItems = () => filteredItems.filter(item => !item.watched_at);
  const getWatchedItems = () => filteredItems.filter(item => item.watched_at);
  const getInProgressItems = () => filteredItems.filter(item => item.progress_percent > 0 && item.progress_percent < 100);

  if (collectionsLoading || itemsLoading || favoritesLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-48 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search movies to add to watchlist..."
                value={movieSearchTerm}
                onChange={(e) => setMovieSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleMovieSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleMovieSearch} disabled={isSearching}>
              {isSearching ? <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" /> : <Plus className="h-4 w-4" />}
              Add Movie
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <ListIcon className="h-4 w-4" />
          </Button>
          
          <Dialog open={showCreateCollection} onOpenChange={setShowCreateCollection}>
            <DialogTrigger asChild>
              <Button className="ml-2">
                <Plus className="h-4 w-4 mr-2" />
                New Collection
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Collection</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Collection name"
                  value={newCollection.name}
                  onChange={(e) => setNewCollection(prev => ({ ...prev, name: e.target.value }))}
                />
                <Textarea
                  placeholder="Description (optional)"
                  value={newCollection.description}
                  onChange={(e) => setNewCollection(prev => ({ ...prev, description: e.target.value }))}
                />
                <div className="flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  <input
                    type="color"
                    value={newCollection.color}
                    onChange={(e) => setNewCollection(prev => ({ ...prev, color: e.target.value }))}
                    className="w-12 h-8 rounded border"
                  />
                  <span className="text-sm text-muted-foreground">Collection color</span>
                </div>
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setShowCreateCollection(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateCollection}>
                    Create Collection
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Movie Search Results */}
      {searchResults.length > 0 && (
        <div className="border rounded-lg p-4 bg-card">
          <h3 className="font-semibold mb-3">Search Results</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {searchResults.map(movie => (
              <div key={movie.id} className="text-center">
                <img 
                  src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`}
                  alt={movie.title}
                  className="w-full aspect-[2/3] object-cover rounded mb-2"
                />
                <p className="text-sm font-medium mb-2 line-clamp-2">{movie.title}</p>
                <Button 
                  size="sm" 
                  onClick={() => handleAddToWatchlist(movie)}
                  className="w-full text-xs"
                >
                  Add to Watchlist
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs for different sections */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="to-watch" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">To Watch</span>
            <Badge variant="secondary" className="ml-1">{getUnwatchedItems().length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="favorites" className="flex items-center gap-2">
            <Heart className="h-4 w-4" />
            <span className="hidden sm:inline">Favorites</span>
            <Badge variant="secondary" className="ml-1">{favorites.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="in-progress" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">In Progress</span>
            <Badge variant="secondary" className="ml-1">{getInProgressItems().length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="watched" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            <span className="hidden sm:inline">Watched</span>
            <Badge variant="secondary" className="ml-1">{getWatchedItems().length}</Badge>
          </TabsTrigger>
        </TabsList>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search your movies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={filterPriority} onValueChange={(value: Priority | 'all') => setFilterPriority(value)}>
            <SelectTrigger className="w-full md:w-[160px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="high">High Priority</SelectItem>
              <SelectItem value="medium">Medium Priority</SelectItem>
              <SelectItem value="low">Low Priority</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterMood} onValueChange={setFilterMood}>
            <SelectTrigger className="w-full md:w-[160px]">
              <SelectValue placeholder="Mood" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Moods</SelectItem>
              {moodTags.map(mood => (
                <SelectItem key={mood} value={mood}>{mood}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Collections Grid */}
        {collections.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Tag className="h-5 w-5" />
              My Collections
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {collections.map(collection => (
                <Card key={collection.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: collection.color }}
                      />
                      <div className="flex-1">
                        <CardTitle className="text-lg">{collection.name}</CardTitle>
                        {collection.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {collection.description}
                          </p>
                        )}
                      </div>
                      {collection.is_public && (
                        <Badge variant="secondary" className="text-xs">
                          Public
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* To Watch Tab */}
        <TabsContent value="to-watch" className="space-y-4">
          {getUnwatchedItems().length > 0 ? (
            <div className="space-y-4">
              {getUnwatchedItems().map(item => (
                <Card key={item.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {item.movie_poster && (
                        <Link to={`/movie/${item.movie_id}`}>
                          <img 
                            src={`https://image.tmdb.org/t/p/w92${item.movie_poster}`}
                            alt={item.movie_title}
                            className="w-16 h-24 object-cover rounded hover:opacity-80 transition-opacity"
                          />
                        </Link>
                      )}
                      
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <Link to={`/movie/${item.movie_id}`}>
                            <h3 className="font-semibold text-lg hover:text-primary transition-colors">{item.movie_title}</h3>
                          </Link>
                          <div className="flex items-center gap-2">
                            <div 
                              className={`w-3 h-3 rounded-full ${priorityColors[item.priority]}`}
                              title={`${item.priority} priority`}
                            />
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => markAsWatched(item.id)}
                            >
                              Mark Watched
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => removeItem(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        {item.personal_notes && (
                          <div className="bg-muted/50 p-2 rounded text-sm">
                            <StickyNote className="h-4 w-4 inline mr-1" />
                            {item.personal_notes}
                          </div>
                        )}
                        
                        {item.mood_tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {item.mood_tags.map(tag => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                        
                        {item.progress_percent > 0 && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>Progress</span>
                              <span>{item.progress_percent}%</span>
                            </div>
                            <Progress value={item.progress_percent} className="h-2" />
                          </div>
                        )}
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
              <p className="text-sm text-muted-foreground mt-2">
                Add movies from movie pages using the + button!
              </p>
            </Card>
          )}
        </TabsContent>

        {/* Favorites Tab */}
        <TabsContent value="favorites" className="space-y-4">
          {favorites.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {favorites.map(item => (
                <div key={item.id} className="relative group">
                  <Link to={`/movie/${item.movie_id}`}>
                    {item.movie_poster ? (
                      <img 
                        src={`https://image.tmdb.org/t/p/w300${item.movie_poster}`}
                        alt={item.movie_title}
                        className="w-full aspect-[2/3] object-cover rounded-lg hover:opacity-80 transition-opacity"
                      />
                    ) : (
                      <div className="w-full aspect-[2/3] bg-muted rounded-lg flex items-center justify-center">
                        <Heart className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </Link>
                  <div className="absolute top-2 right-2">
                    <Heart className="h-5 w-5 text-cinema-red fill-cinema-red" />
                  </div>
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex flex-col items-center justify-center gap-2">
                    <p className="text-white text-sm font-medium text-center px-2">{item.movie_title}</p>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={(e) => {
                        e.preventDefault();
                        removeFavorite(item.movie_id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No favorite movies yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Like movies using the ❤️ button on movie pages!
              </p>
            </Card>
          )}
        </TabsContent>

        {/* In Progress Tab */}
        <TabsContent value="in-progress" className="space-y-4">
          {getInProgressItems().length > 0 ? (
            <div className="space-y-4">
              {getInProgressItems().map(item => (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {item.movie_poster && (
                        <Link to={`/movie/${item.movie_id}`}>
                          <img 
                            src={`https://image.tmdb.org/t/p/w92${item.movie_poster}`}
                            alt={item.movie_title}
                            className="w-16 h-24 object-cover rounded hover:opacity-80 transition-opacity"
                          />
                        </Link>
                      )}
                      <div className="flex-1">
                        <Link to={`/movie/${item.movie_id}`}>
                          <h3 className="font-semibold text-lg mb-2 hover:text-primary transition-colors">{item.movie_title}</h3>
                        </Link>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{item.progress_percent}%</span>
                          </div>
                          <Progress value={item.progress_percent} className="h-2" />
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => markAsWatched(item.id)}
                      >
                        Mark Complete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No movies in progress</p>
              <p className="text-sm text-muted-foreground mt-2">
                Movies you're currently watching will appear here
              </p>
            </Card>
          )}
        </TabsContent>

        {/* Watched Tab */}
        <TabsContent value="watched" className="space-y-4">
          {getWatchedItems().length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {getWatchedItems().map(item => (
                <div key={item.id} className="relative group">
                  <Link to={`/movie/${item.movie_id}`}>
                    {item.movie_poster && (
                      <img 
                        src={`https://image.tmdb.org/t/p/w300${item.movie_poster}`}
                        alt={item.movie_title}
                        className="w-full aspect-[2/3] object-cover rounded-lg hover:opacity-80 transition-opacity"
                      />
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
              <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No watched movies yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Mark movies as watched to track your viewing history
              </p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};