import { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Checkbox } from '@/components/ui/checkbox';
import { useDebounce } from '@/hooks/useDebounce';

interface SearchFilters {
  query: string;
  type: 'all' | 'movie' | 'tv' | 'person';
  genres: number[];
  yearRange: [number, number];
  ratingRange: [number, number];
  sortBy: 'popularity' | 'rating' | 'release_date' | 'title';
  sortOrder: 'desc' | 'asc';
}

interface AdvancedSearchProps {
  onSearch: (filters: SearchFilters) => void;
  isLoading?: boolean;
}

const GENRES = [
  { id: 28, name: 'Action' },
  { id: 12, name: 'Adventure' },
  { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' },
  { id: 80, name: 'Crime' },
  { id: 99, name: 'Documentary' },
  { id: 18, name: 'Drama' },
  { id: 10751, name: 'Family' },
  { id: 14, name: 'Fantasy' },
  { id: 36, name: 'History' },
  { id: 27, name: 'Horror' },
  { id: 10402, name: 'Music' },
  { id: 9648, name: 'Mystery' },
  { id: 10749, name: 'Romance' },
  { id: 878, name: 'Science Fiction' },
  { id: 10770, name: 'TV Movie' },
  { id: 53, name: 'Thriller' },
  { id: 10752, name: 'War' },
  { id: 37, name: 'Western' },
];

const currentYear = new Date().getFullYear();

export const AdvancedSearch = ({ onSearch, isLoading }: AdvancedSearchProps) => {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    type: 'all',
    genres: [],
    yearRange: [1900, currentYear],
    ratingRange: [0, 10],
    sortBy: 'popularity',
    sortOrder: 'desc',
  });
  const [showFilters, setShowFilters] = useState(false);

  const debouncedQuery = useDebounce(filters.query, 300);

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    if (key === 'query' || debouncedQuery) {
      onSearch(newFilters);
    }
  };

  const toggleGenre = (genreId: number) => {
    const newGenres = filters.genres.includes(genreId)
      ? filters.genres.filter(id => id !== genreId)
      : [...filters.genres, genreId];
    updateFilter('genres', newGenres);
  };

  const clearFilters = () => {
    const clearedFilters: SearchFilters = {
      query: filters.query, // Keep the query
      type: 'all',
      genres: [],
      yearRange: [1900, currentYear],
      ratingRange: [0, 10],
      sortBy: 'popularity',
      sortOrder: 'desc',
    };
    setFilters(clearedFilters);
    onSearch(clearedFilters);
  };

  const hasActiveFilters = filters.type !== 'all' || 
    filters.genres.length > 0 || 
    filters.yearRange[0] !== 1900 || 
    filters.yearRange[1] !== currentYear ||
    filters.ratingRange[0] !== 0 || 
    filters.ratingRange[1] !== 10 ||
    filters.sortBy !== 'popularity' || 
    filters.sortOrder !== 'desc';

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search movies, TV shows, and people..."
          value={filters.query}
          onChange={(e) => updateFilter('query', e.target.value)}
          className="pl-10 pr-12"
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="absolute right-1 top-1/2 transform -translate-y-1/2"
        >
          <Filter className="h-4 w-4" />
          {hasActiveFilters && (
            <Badge variant="destructive" className="ml-1 h-2 w-2 p-0" />
          )}
        </Button>
      </div>

      {/* Filters Panel */}
      <Collapsible open={showFilters} onOpenChange={setShowFilters}>
        <CollapsibleContent>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Advanced Filters</CardTitle>
                <div className="flex gap-2">
                  {hasActiveFilters && (
                    <Button variant="outline" size="sm" onClick={clearFilters}>
                      Clear All
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFilters(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Content Type */}
              <div className="space-y-2">
                <Label>Content Type</Label>
                <Select value={filters.type} onValueChange={(value: any) => updateFilter('type', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="movie">Movies</SelectItem>
                    <SelectItem value="tv">TV Shows</SelectItem>
                    <SelectItem value="person">People</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Genres */}
              <div className="space-y-3">
                <Label>Genres</Label>
                <div className="flex flex-wrap gap-2">
                  {GENRES.map((genre) => (
                    <Badge
                      key={genre.id}
                      variant={filters.genres.includes(genre.id) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleGenre(genre.id)}
                    >
                      {genre.name}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Year Range */}
              <div className="space-y-3">
                <Label>Release Year: {filters.yearRange[0]} - {filters.yearRange[1]}</Label>
                <Slider
                  value={filters.yearRange}
                  onValueChange={(value) => updateFilter('yearRange', value as [number, number])}
                  min={1900}
                  max={currentYear}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Rating Range */}
              <div className="space-y-3">
                <Label>Rating: {filters.ratingRange[0]} - {filters.ratingRange[1]}</Label>
                <Slider
                  value={filters.ratingRange}
                  onValueChange={(value) => updateFilter('ratingRange', value as [number, number])}
                  min={0}
                  max={10}
                  step={0.1}
                  className="w-full"
                />
              </div>

              {/* Sort Options */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Sort By</Label>
                  <Select value={filters.sortBy} onValueChange={(value: any) => updateFilter('sortBy', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="popularity">Popularity</SelectItem>
                      <SelectItem value="rating">Rating</SelectItem>
                      <SelectItem value="release_date">Release Date</SelectItem>
                      <SelectItem value="title">Title</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Order</Label>
                  <Select value={filters.sortOrder} onValueChange={(value: any) => updateFilter('sortOrder', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desc">Descending</SelectItem>
                      <SelectItem value="asc">Ascending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Apply Button */}
              <Button 
                className="w-full" 
                onClick={() => onSearch(filters)}
                disabled={isLoading}
              >
                {isLoading ? 'Searching...' : 'Apply Filters'}
              </Button>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.type !== 'all' && (
            <Badge variant="secondary">
              Type: {filters.type}
              <Button
                variant="ghost"
                size="sm"
                className="ml-1 h-auto p-0"
                onClick={() => updateFilter('type', 'all')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          {filters.genres.map(genreId => {
            const genre = GENRES.find(g => g.id === genreId);
            return genre ? (
              <Badge key={genreId} variant="secondary">
                {genre.name}
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-1 h-auto p-0"
                  onClick={() => toggleGenre(genreId)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ) : null;
          })}
        </div>
      )}
    </div>
  );
};