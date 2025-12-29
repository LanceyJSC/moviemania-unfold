import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { MobileInlineFilters } from "./MobileInlineFilters";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export interface FilterState {
  genres: number[];
  yearRange: [number, number];
  ratingRange: [number, number];
  runtimeRange: [number, number];
  sortBy: string;
  mood: string;
  tone: string;
  pacing: string;
}

interface InlineFiltersProps {
  onFiltersChange: (filters: FilterState) => void;
}

const GENRES_INITIAL = [
  { id: 28, name: "Action", emoji: "💥" },
  { id: 35, name: "Comedy", emoji: "😂" },
  { id: 27, name: "Horror", emoji: "👻" },
  { id: 10749, name: "Romance", emoji: "💕" },
  { id: 878, name: "Sci-Fi", emoji: "🚀" },
  { id: 12, name: "Adventure", emoji: "🗺️" },
  { id: 18, name: "Drama", emoji: "🎭" },
  { id: 53, name: "Thriller", emoji: "😱" },
];

const ALL_GENRES = [
  { id: 28, name: "Action", emoji: "💥" },
  { id: 12, name: "Adventure", emoji: "🗺️" },
  { id: 16, name: "Animation", emoji: "🎨" },
  { id: 35, name: "Comedy", emoji: "😂" },
  { id: 80, name: "Crime", emoji: "🔪" },
  { id: 99, name: "Documentary", emoji: "📹" },
  { id: 18, name: "Drama", emoji: "🎭" },
  { id: 10751, name: "Family", emoji: "👨‍👩‍👧" },
  { id: 14, name: "Fantasy", emoji: "🧙" },
  { id: 36, name: "History", emoji: "📜" },
  { id: 27, name: "Horror", emoji: "👻" },
  { id: 10402, name: "Music", emoji: "🎵" },
  { id: 9648, name: "Mystery", emoji: "🔍" },
  { id: 10749, name: "Romance", emoji: "💕" },
  { id: 878, name: "Sci-Fi", emoji: "🚀" },
  { id: 10770, name: "TV Movie", emoji: "📺" },
  { id: 53, name: "Thriller", emoji: "😱" },
  { id: 10752, name: "War", emoji: "⚔️" },
  { id: 37, name: "Western", emoji: "🤠" },
];

// Mood maps to genre combinations for better TMDB results
const MOOD_OPTIONS = [
  { value: "any", label: "Any Mood" },
  { value: "feel-good", label: "Feel-Good", genres: [35, 10751] }, // Comedy, Family
  { value: "intense", label: "Intense", genres: [28, 53] }, // Action, Thriller
  { value: "thought-provoking", label: "Thought-Provoking", genres: [18, 99] }, // Drama, Documentary
  { value: "emotional", label: "Emotional", genres: [18, 10749] }, // Drama, Romance
  { value: "uplifting", label: "Uplifting", genres: [35, 10751, 12] }, // Comedy, Family, Adventure
  { value: "dark", label: "Dark", genres: [27, 53, 80] }, // Horror, Thriller, Crime
  { value: "nostalgic", label: "Nostalgic", genres: [10751, 14] }, // Family, Fantasy
  { value: "inspiring", label: "Inspiring", genres: [18, 36] }, // Drama, History
];

const TONE_OPTIONS = [
  { value: "any", label: "Any Tone" },
  { value: "lighthearted", label: "Lighthearted", genres: [35, 10751] }, // Comedy, Family
  { value: "serious", label: "Serious", genres: [18, 36] }, // Drama, History
  { value: "satirical", label: "Satirical", genres: [35] }, // Comedy
  { value: "suspenseful", label: "Suspenseful", genres: [53, 9648] }, // Thriller, Mystery
  { value: "romantic", label: "Romantic", genres: [10749] }, // Romance
  { value: "gritty", label: "Gritty", genres: [80, 53] }, // Crime, Thriller
  { value: "whimsical", label: "Whimsical", genres: [14, 16] }, // Fantasy, Animation
];

const PACING_OPTIONS = [
  { value: "any", label: "Any Pacing" },
  { value: "slow", label: "Slow Burn" },
  { value: "moderate", label: "Moderate" },
  { value: "fast", label: "Fast-Paced" }
];

export const InlineFilters = ({ onFiltersChange }: InlineFiltersProps) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showAllGenres, setShowAllGenres] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    genres: [],
    yearRange: [1900, new Date().getFullYear()],
    ratingRange: [0, 10],
    runtimeRange: [0, 300],
    sortBy: "popularity.desc",
    mood: "any",
    tone: "any",
    pacing: "any"
  });

  const updateFiltersLocally = (newFilters: Partial<FilterState>) => {
    const updated = { ...filters, ...newFilters };
    setFilters(updated);
  };

  const handleDiscover = () => {
    onFiltersChange(filters);
  };

  const handleGenreClick = (genreId: number) => {
    const currentGenres = filters.genres;
    const newGenres = currentGenres.includes(genreId)
      ? currentGenres.filter(id => id !== genreId)
      : [...currentGenres, genreId];
    updateFiltersLocally({ genres: newGenres });
  };

  const toggleShowAllGenres = () => {
    setShowAllGenres(!showAllGenres);
  };


  const clearFilters = () => {
    const resetFilters: FilterState = {
      genres: [],
      yearRange: [1900, new Date().getFullYear()],
      ratingRange: [0, 10],
      runtimeRange: [0, 300],
      sortBy: "popularity.desc",
      mood: "any",
      tone: "any",
      pacing: "any"
    };
    setFilters(resetFilters);
    onFiltersChange(resetFilters);
  };

  const activeFilterCount = 
    filters.genres.length + 
    (filters.mood !== "any" ? 1 : 0) + 
    (filters.tone !== "any" ? 1 : 0) + 
    (filters.pacing !== "any" ? 1 : 0) + 
    (filters.yearRange[0] > 1900 || filters.yearRange[1] < new Date().getFullYear() ? 1 : 0) +
    (filters.ratingRange[0] > 0 || filters.ratingRange[1] < 10 ? 1 : 0);

  if (isMobile) {
    return <MobileInlineFilters onFiltersChange={onFiltersChange} />;
  }

  const displayGenres = showAllGenres ? ALL_GENRES : GENRES_INITIAL;

  return (
    <div className="space-y-8">
      {/* Genre Section */}
      <section>
        <div className="mb-4">
          <h3 className="font-cinematic text-lg text-foreground tracking-wide mb-1">EXPLORE BY GENRE</h3>
          <p className="text-muted-foreground text-sm">Jump into your favorite category</p>
        </div>
        
        <div className={cn(
          "grid gap-2 mb-3 transition-all duration-300",
          showAllGenres ? "grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8" : "grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8"
        )}>
          {displayGenres.map((genre) => {
            const isSelected = filters.genres.includes(genre.id);
            return (
              <button
                key={genre.id}
                onClick={() => handleGenreClick(genre.id)}
                className={cn(
                  "group flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border transition-all duration-200",
                  isSelected 
                    ? "bg-primary text-primary-foreground border-primary" 
                    : "bg-card hover:bg-card/80 border-border/40 hover:border-primary/40"
                )}
              >
                <span className="text-base">{genre.emoji}</span>
                <span className="font-medium text-xs">{genre.name}</span>
              </button>
            );
          })}
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleShowAllGenres}
          className="text-primary hover:text-primary/80 gap-1"
        >
          {showAllGenres ? "Show Less" : "View All"}
          <ChevronDown className={cn("h-4 w-4 transition-transform", showAllGenres && "rotate-180")} />
        </Button>
      </section>

      {/* Filters Section */}
      <section>
        <div className="mb-4">
          <h3 className="font-cinematic text-lg text-foreground tracking-wide mb-1">REFINE YOUR SEARCH</h3>
          <p className="text-muted-foreground text-sm">
            {activeFilterCount > 0 
              ? `${activeFilterCount} filter${activeFilterCount > 1 ? 's' : ''} active` 
              : 'Use filters to find exactly what you want'}
          </p>
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-primary hover:text-primary/80 mt-1 text-xs">
              Reset All Filters
            </Button>
          )}
        </div>

        {/* Slider Filters - All on one row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
          {/* Year Range */}
          <div className="bg-card/60 rounded-lg border border-border/50 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Year</span>
              <span className="text-sm text-primary font-semibold">{filters.yearRange[0]} – {filters.yearRange[1]}</span>
            </div>
            <Slider
              value={filters.yearRange}
              onValueChange={(value) => updateFiltersLocally({ yearRange: value as [number, number] })}
              min={1900}
              max={new Date().getFullYear()}
              step={1}
              className="w-full"
            />
          </div>

          {/* Rating */}
          <div className="bg-card/60 rounded-lg border border-border/50 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Rating</span>
              <span className="text-sm text-primary font-semibold">{filters.ratingRange[0].toFixed(1)} – {filters.ratingRange[1].toFixed(1)}</span>
            </div>
            <Slider
              value={filters.ratingRange}
              onValueChange={(value) => updateFiltersLocally({ ratingRange: value as [number, number] })}
              min={0}
              max={10}
              step={0.5}
              className="w-full"
            />
          </div>

          {/* Runtime */}
          <div className="bg-card/60 rounded-lg border border-border/50 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Runtime</span>
              <span className="text-sm text-primary font-semibold">{filters.runtimeRange[0]} – {filters.runtimeRange[1]}m</span>
            </div>
            <Slider
              value={filters.runtimeRange}
              onValueChange={(value) => updateFiltersLocally({ runtimeRange: value as [number, number] })}
              min={0}
              max={300}
              step={15}
              className="w-full"
            />
          </div>
        </div>

        {/* Advanced Filters - Mood, Tone, Pacing on one row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
          {/* Mood */}
          <div className="bg-card/60 rounded-lg border border-border/50 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Mood</span>
            </div>
            <Select value={filters.mood} onValueChange={(value) => updateFiltersLocally({ mood: value })}>
              <SelectTrigger className="h-9 bg-muted/40 border-border/30">
                <SelectValue placeholder="Any Mood" />
              </SelectTrigger>
              <SelectContent>
                {MOOD_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tone */}
          <div className="bg-card/60 rounded-lg border border-border/50 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Tone</span>
            </div>
            <Select value={filters.tone} onValueChange={(value) => updateFiltersLocally({ tone: value })}>
              <SelectTrigger className="h-9 bg-muted/40 border-border/30">
                <SelectValue placeholder="Any Tone" />
              </SelectTrigger>
              <SelectContent>
                {TONE_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Pacing */}
          <div className="bg-card/60 rounded-lg border border-border/50 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Pacing</span>
            </div>
            <Select value={filters.pacing} onValueChange={(value) => updateFiltersLocally({ pacing: value })}>
              <SelectTrigger className="h-9 bg-muted/40 border-border/30">
                <SelectValue placeholder="Any Pacing" />
              </SelectTrigger>
              <SelectContent>
                {PACING_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Discover Button - Single instance */}
        <div className="max-w-xs mx-auto">
          <Button 
            onClick={handleDiscover}
            className="w-full h-10 rounded-lg text-sm font-semibold"
          >
            <Search className="h-4 w-4 mr-2" />
            Discover
          </Button>
        </div>
      </section>
    </div>
  );
};