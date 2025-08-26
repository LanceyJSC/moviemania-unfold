import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Star, 
  Clock, 
  Calendar,
  Tag,
  StickyNote,
  Palette,
  Eye,
  Trash2,
  Edit3,
  Grid,
  List as ListIcon
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { MovieCard } from '@/components/MovieCard';
import { useWatchlistCollections } from '@/hooks/useWatchlistCollections';
import { useSupabaseUserState } from '@/hooks/useSupabaseUserState';
import { tmdbService, Movie } from '@/lib/tmdb';
import { toast } from 'sonner';

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
  const { userState } = useSupabaseUserState();
  const [movies, setMovies] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState<Priority | 'all'>('all');
  const [filterMood, setFilterMood] = useState<string>('all');
  const [showCreateCollection, setShowCreateCollection] = useState(false);
  const [newCollection, setNewCollection] = useState<CollectionFormData>({
    name: '',
    description: '',
    color: '#4F46E5',
    isPublic: false
  });

  useEffect(() => {
    loadMovieDetails();
  }, [userState]);

  const loadMovieDetails = async () => {
    try {
      const allMovieIds = [
        ...userState.watchlist,
        ...userState.likedMovies,
        ...userState.currentlyWatching
      ];
      
      const uniqueIds = [...new Set(allMovieIds)];
      const moviePromises = uniqueIds.map(id => 
        tmdbService.getMovieDetails(id).catch(() => null)
      );
      
      const movieDetails = await Promise.all(moviePromises);
      const validMovies = movieDetails
        .filter(Boolean)
        .map(movie => tmdbService.formatMovieForCard(movie as Movie));
      
      setMovies(validMovies);
    } catch (error) {
      console.error('Failed to load movie details:', error);
      toast.error('Failed to load movies');
    }
  };

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

  const getMoviesByType = (type: 'watchlist' | 'liked' | 'currentlyWatching') => {
    const relevantIds = type === 'watchlist' ? userState.watchlist :
                       type === 'liked' ? userState.likedMovies :
                       userState.currentlyWatching;
    
    return movies.filter(movie => relevantIds.includes(movie.id));
  };

  const filteredMovies = movies.filter(movie => {
    const matchesSearch = movie.title.toLowerCase().includes(searchTerm.toLowerCase());
    // For now, we'll show all movies regardless of priority/mood filters
    // These would be implemented with the enhanced watchlist items table
    return matchesSearch;
  });

  if (collectionsLoading) {
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
          <h1 className="text-3xl font-bold text-foreground">Smart Watchlist</h1>
          <p className="text-muted-foreground">Organize your movies with collections, priorities, and smart filters</p>
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

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
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
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Tag className="h-5 w-5" />
            My Collections
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
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

      {/* Traditional Categories */}
      <div className="space-y-8">
        {/* Watch Later */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Watch Later ({getMoviesByType('watchlist').length})
          </h2>
          {getMoviesByType('watchlist').length > 0 ? (
            <div className={viewMode === 'grid' ? 'poster-grid-responsive' : 'space-y-4'}>
              {getMoviesByType('watchlist').map(movie => (
                <div key={movie.id} className="relative group">
                  <MovieCard movie={movie} />
                </div>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No movies in your watchlist</p>
            </Card>
          )}
        </div>

        {/* Liked Movies */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" />
            Liked Movies ({getMoviesByType('liked').length})
          </h2>
          {getMoviesByType('liked').length > 0 ? (
            <div className={viewMode === 'grid' ? 'poster-grid-responsive' : 'space-y-4'}>
              {getMoviesByType('liked').map(movie => (
                <div key={movie.id} className="relative group">
                  <MovieCard movie={movie} />
                </div>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No liked movies yet</p>
            </Card>
          )}
        </div>

        {/* Currently Watching */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            Currently Watching ({getMoviesByType('currentlyWatching').length})
          </h2>
          {getMoviesByType('currentlyWatching').length > 0 ? (
            <div className={viewMode === 'grid' ? 'poster-grid-responsive' : 'space-y-4'}>
              {getMoviesByType('currentlyWatching').map(movie => (
                <div key={movie.id} className="relative group">
                  <MovieCard movie={movie} />
                </div>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No movies currently watching</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};