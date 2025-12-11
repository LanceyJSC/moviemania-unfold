import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { X, Filter } from "lucide-react";
import { MobileAdvancedFilters } from "./MobileAdvancedFilters";
import { useMediaQuery } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface AdvancedFiltersProps {
  onFiltersChange: (filters: FilterState) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export interface FilterState {
  genres: string[];
  yearRange: [number, number];
  ratingRange: [number, number];
  runtimeRange: [number, number];
  sortBy: string;
}

const GENRES = [
  "Action", "Adventure", "Animation", "Comedy", "Crime", "Documentary",
  "Drama", "Family", "Fantasy", "History", "Horror", "Music", "Mystery",
  "Romance", "Science Fiction", "TV Movie", "Thriller", "War", "Western"
];

const SORT_OPTIONS = [
  { value: "popularity.desc", label: "Most Popular" },
  { value: "vote_average.desc", label: "Highest Rated" },
  { value: "release_date.desc", label: "Newest" },
  { value: "release_date.asc", label: "Oldest" },
  { value: "title.asc", label: "A-Z" },
  { value: "title.desc", label: "Z-A" }
];

export const AdvancedFilters = ({ onFiltersChange, isOpen, onToggle }: AdvancedFiltersProps) => {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [filters, setFilters] = useState<FilterState>({
    genres: [],
    yearRange: [1900, new Date().getFullYear()],
    ratingRange: [0, 10],
    runtimeRange: [0, 300],
    sortBy: "popularity.desc"
  });

  const updateFilters = (newFilters: Partial<FilterState>) => {
    const updated = { ...filters, ...newFilters };
    setFilters(updated);
    onFiltersChange(updated);
  };

  const toggleGenre = (genre: string) => {
    const newGenres = filters.genres.includes(genre)
      ? filters.genres.filter(g => g !== genre)
      : [...filters.genres, genre];
    updateFilters({ genres: newGenres });
  };

  const clearFilters = () => {
    const resetFilters: FilterState = {
      genres: [],
      yearRange: [1900, new Date().getFullYear()],
      ratingRange: [0, 10],
      runtimeRange: [0, 300],
      sortBy: "popularity.desc"
    };
    setFilters(resetFilters);
    onFiltersChange(resetFilters);
  };

  // Use mobile component on small screens
  if (isMobile) {
    return <MobileAdvancedFilters onFiltersChange={onFiltersChange} isOpen={isOpen} onToggle={onToggle} />;
  }

  if (!isOpen) {
    return (
      <Button 
        variant="outline" 
        onClick={onToggle}
        className="fixed top-20 right-4 z-50 border-border hover:bg-card touch-target focus-ring"
      >
        <Filter className="h-4 w-4 mr-2" />
        Filters
      </Button>
    );
  }

  return (
    <Card className="fixed top-20 right-4 w-80 p-4 z-50 bg-card border border-border max-h-[80vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Advanced Filters</h3>
        <Button variant="ghost" size="sm" onClick={onToggle} className="touch-target focus-ring">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Sort By */}
      <div className="mb-6">
        <label className="text-sm font-medium text-foreground mb-2 block">Sort By</label>
        <Select value={filters.sortBy} onValueChange={(value) => updateFilters({ sortBy: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Genres */}
      <div className="mb-6">
        <label className="text-sm font-medium text-foreground mb-2 block">Genres</label>
        <div className="flex flex-wrap gap-2">
          {GENRES.map(genre => (
            <Badge
              key={genre}
              variant={filters.genres.includes(genre) ? "default" : "outline"}
              className={cn(
                "cursor-pointer hover:bg-primary/90 text-xs touch-target focus-ring",
                "min-h-[var(--touch-target)] min-w-[var(--touch-target)] flex items-center justify-center"
              )}
              onClick={() => toggleGenre(genre)}
            >
              {genre}
            </Badge>
          ))}
        </div>
      </div>

      {/* Year Range */}
      <div className="mb-6">
        <label className="text-sm font-medium text-foreground mb-2 block">
          Release Year: {filters.yearRange[0]} - {filters.yearRange[1]}
        </label>
        <Slider
          value={filters.yearRange}
          onValueChange={(value) => updateFilters({ yearRange: value as [number, number] })}
          min={1900}
          max={new Date().getFullYear()}
          step={1}
          className="w-full"
        />
      </div>

      {/* Rating Range */}
      <div className="mb-6">
        <label className="text-sm font-medium text-foreground mb-2 block">
          Rating: {filters.ratingRange[0]} - {filters.ratingRange[1]}
        </label>
        <Slider
          value={filters.ratingRange}
          onValueChange={(value) => updateFilters({ ratingRange: value as [number, number] })}
          min={0}
          max={10}
          step={0.1}
          className="w-full"
        />
      </div>

      {/* Runtime Range */}
      <div className="mb-6">
        <label className="text-sm font-medium text-foreground mb-2 block">
          Runtime: {filters.runtimeRange[0]} - {filters.runtimeRange[1]} minutes
        </label>
        <Slider
          value={filters.runtimeRange}
          onValueChange={(value) => updateFilters({ runtimeRange: value as [number, number] })}
          min={0}
          max={300}
          step={5}
          className="w-full"
        />
      </div>

      <Button variant="outline" onClick={clearFilters} className="w-full touch-target focus-ring">
        Clear All Filters
      </Button>
    </Card>
  );
};