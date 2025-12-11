
import { useState } from "react";
import { X, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface FilterState {
  genres: string[];
  yearRange: [number, number];
  ratingRange: [number, number];
  runtimeRange: [number, number];
  sortBy: string;
}

interface MobileAdvancedFiltersProps {
  onFiltersChange: (filters: FilterState) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const GENRES = [
  "Action", "Adventure", "Animation", "Comedy", "Crime", "Documentary",
  "Drama", "Family", "Fantasy", "History", "Horror", "Music",
  "Mystery", "Romance", "Science Fiction", "Thriller", "War", "Western"
];

const SORT_OPTIONS = [
  { value: "popularity.desc", label: "Most Popular" },
  { value: "release_date.desc", label: "Newest First" },
  { value: "release_date.asc", label: "Oldest First" },
  { value: "vote_average.desc", label: "Highest Rated" },
  { value: "vote_count.desc", label: "Most Voted" },
];

export const MobileAdvancedFilters = ({ onFiltersChange, isOpen, onToggle }: MobileAdvancedFiltersProps) => {
  const [filters, setFilters] = useState<FilterState>({
    genres: [],
    yearRange: [1990, 2024],
    ratingRange: [0, 10],
    runtimeRange: [60, 180],
    sortBy: "popularity.desc",
  });

  const [expandedSections, setExpandedSections] = useState({
    genres: true,
    year: false,
    rating: false,
    runtime: false,
  });

  const updateFilters = (newFilters: Partial<FilterState>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFiltersChange(updatedFilters);
  };

  const toggleGenre = (genre: string) => {
    const updatedGenres = filters.genres.includes(genre)
      ? filters.genres.filter(g => g !== genre)
      : [...filters.genres, genre];
    updateFilters({ genres: updatedGenres });
  };

  const clearFilters = () => {
    const defaultFilters: FilterState = {
      genres: [],
      yearRange: [1990, 2024],
      ratingRange: [0, 10],
      runtimeRange: [60, 180],
      sortBy: "popularity.desc",
    };
    setFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* iOS-style Header with Safe Area */}
      <div 
        className="sticky top-0 bg-background/95 backdrop-blur-xl border-b border-border"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="h-12 w-12 rounded-full touch-target focus-ring"
          >
            <X className="h-5 w-5" />
          </Button>
          <h1 className="font-cinematic text-xl tracking-wide text-foreground">
            Advanced Filters
          </h1>
          <Button
            variant="ghost"
            onClick={clearFilters}
            className="text-primary hover:text-primary/80 text-sm font-medium h-12 px-4 rounded-full"
          >
            Clear All
          </Button>
        </div>
      </div>

      {/* Content with Safe Area Bottom */}
      <div 
        className="p-4 space-y-6 overflow-y-auto"
        style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
      >
        {/* Sort By */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground">Sort By</h3>
          <Select value={filters.sortBy} onValueChange={(value) => updateFilters({ sortBy: value })}>
            <SelectTrigger className="h-14 bg-card/60 border-border/50 rounded-2xl text-base">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Genres - Mobile Grid */}
        <div className="space-y-3">
          <Button
            variant="ghost"
            onClick={() => toggleSection("genres")}
            className="w-full justify-between p-0 h-12 text-sm font-medium text-foreground rounded-xl"
          >
            Genres ({filters.genres.length} selected)
            {expandedSections.genres ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          
          {expandedSections.genres && (
            <div className="grid grid-cols-2 gap-3">
              {GENRES.map((genre) => (
                <Button
                  key={genre}
                  variant={filters.genres.includes(genre) ? "default" : "outline"}
                  onClick={() => toggleGenre(genre)}
                  className={cn(
                    "h-14 text-sm font-medium transition-all duration-200 active:scale-95 rounded-2xl",
                    "touch-target focus-ring",
                    filters.genres.includes(genre)
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-card/60 border-border/50 hover:bg-card/80"
                  )}
                >
                  {genre}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Year Range */}
        <div className="space-y-3">
          <Button
            variant="ghost"
            onClick={() => toggleSection("year")}
            className="w-full justify-between p-0 h-12 text-sm font-medium text-foreground rounded-xl"
          >
            Release Year ({filters.yearRange[0]} - {filters.yearRange[1]})
            {expandedSections.year ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          
          {expandedSections.year && (
            <div className="px-4 py-6 bg-card/40 rounded-2xl">
              <Slider
                value={filters.yearRange}
                onValueChange={(value) => updateFilters({ yearRange: value as [number, number] })}
                min={1950}
                max={2024}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-3">
                <span>1950</span>
                <span>2024</span>
              </div>
            </div>
          )}
        </div>

        {/* Rating Range */}
        <div className="space-y-3">
          <Button
            variant="ghost"
            onClick={() => toggleSection("rating")}
            className="w-full justify-between p-0 h-12 text-sm font-medium text-foreground rounded-xl"
          >
            Rating ({filters.ratingRange[0]} - {filters.ratingRange[1]})
            {expandedSections.rating ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          
          {expandedSections.rating && (
            <div className="px-4 py-6 bg-card/40 rounded-2xl">
              <Slider
                value={filters.ratingRange}
                onValueChange={(value) => updateFilters({ ratingRange: value as [number, number] })}
                min={0}
                max={10}
                step={0.1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-3">
                <span>0</span>
                <span>10</span>
              </div>
            </div>
          )}
        </div>

        {/* Runtime Range */}
        <div className="space-y-3">
          <Button
            variant="ghost"
            onClick={() => toggleSection("runtime")}
            className="w-full justify-between p-0 h-12 text-sm font-medium text-foreground rounded-xl"
          >
            Runtime ({filters.runtimeRange[0]} - {filters.runtimeRange[1]} min)
            {expandedSections.runtime ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          
          {expandedSections.runtime && (
            <div className="px-4 py-6 bg-card/40 rounded-2xl">
              <Slider
                value={filters.runtimeRange}
                onValueChange={(value) => updateFilters({ runtimeRange: value as [number, number] })}
                min={30}
                max={300}
                step={10}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-3">
                <span>30 min</span>
                <span>300 min</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
