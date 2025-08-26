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
import { Progress } from '@/components/ui/progress';
import { MovieCard } from '@/components/MovieCard';
import { useWatchlistCollections } from '@/hooks/useWatchlistCollections';
import { useEnhancedWatchlist } from '@/hooks/useEnhancedWatchlist';
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
  const { 
    items, 
    loading: itemsLoading, 
    updateItem, 
    removeItem, 
    markAsWatched,
    updateProgress,
    getItemsByCollection,
    getItemsByPriority,
    getItemsByMoodTag
  } = useEnhancedWatchlist();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState<Priority | 'all'>('all');
  const [filterMood, setFilterMood] = useState<string>('all');
  const [showCreateCollection, setShowCreateCollection] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [newCollection, setNewCollection] = useState<CollectionFormData>({
    name: '',
    description: '',
    color: '#4F46E5',
    isPublic: false
  });

  const handleUpdateNotes = async (itemId: string, notes: string) => {
    await updateItem(itemId, { personal_notes: notes });
    setEditingItem(null);
  };

  const handleUpdateMoodTags = async (itemId: string, tags: string[]) => {
    await updateItem(itemId, { mood_tags: tags });
  };

  const handleUpdatePriority = async (itemId: string, priority: Priority) => {
    await updateItem(itemId, { priority });
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

  const filteredItems = items.filter(item => {
    const matchesSearch = item.movie_title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = filterPriority === 'all' || item.priority === filterPriority;
    const matchesMood = filterMood === 'all' || item.mood_tags.includes(filterMood);
    
    return matchesSearch && matchesPriority && matchesMood;
  });

  const getUnwatchedItems = () => filteredItems.filter(item => !item.watched_at);
  const getWatchedItems = () => filteredItems.filter(item => item.watched_at);
  const getInProgressItems = () => filteredItems.filter(item => item.progress_percent > 0 && item.progress_percent < 100);

  if (collectionsLoading || itemsLoading) {
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

      {/* Enhanced Watchlist Categories */}
      <div className="space-y-8">
        {/* Unwatched Items */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            To Watch ({getUnwatchedItems().length})
          </h2>
          {getUnwatchedItems().length > 0 ? (
            <div className="space-y-4">
              {getUnwatchedItems().map(item => (
                <Card key={item.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {item.movie_poster && (
                        <img 
                          src={`https://image.tmdb.org/t/p/w92${item.movie_poster}`}
                          alt={item.movie_title}
                          className="w-16 h-24 object-cover rounded"
                        />
                      )}
                      
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-lg">{item.movie_title}</h3>
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
              <p className="text-muted-foreground">No movies in your enhanced watchlist</p>
              <p className="text-sm text-muted-foreground mt-2">
                Add movies from movie pages to get started with smart organization!
              </p>
            </Card>
          )}
        </div>

        {/* In Progress */}
        {getInProgressItems().length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              In Progress ({getInProgressItems().length})
            </h2>
            <div className="space-y-4">
              {getInProgressItems().map(item => (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {item.movie_poster && (
                        <img 
                          src={`https://image.tmdb.org/t/p/w92${item.movie_poster}`}
                          alt={item.movie_title}
                          className="w-16 h-24 object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-2">{item.movie_title}</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{item.progress_percent}%</span>
                          </div>
                          <Progress value={item.progress_percent} className="h-2" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Watched Items */}
        {getWatchedItems().length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" />
              Watched ({getWatchedItems().length})
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {getWatchedItems().map(item => (
                <div key={item.id} className="relative group">
                  {item.movie_poster && (
                    <img 
                      src={`https://image.tmdb.org/t/p/w300${item.movie_poster}`}
                      alt={item.movie_title}
                      className="w-full aspect-[2/3] object-cover rounded-lg"
                    />
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                    <Badge className="bg-green-600">Watched</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};