import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { X, Filter, Crown, Lock } from "lucide-react";
import { MobileAdvancedFilters } from "./MobileAdvancedFilters";
import { ProUpgradeModal } from "./ProUpgradeModal";
import { useMediaQuery } from "@/hooks/use-mobile";
import { useSubscription } from "@/hooks/useSubscription";
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
  // Pro filters
  mood: string[];
  tone: string[];
  pacing: string;
  era: string;
  language: string;
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

// Pro-only filter options
const MOODS = ["Feel-Good", "Intense", "Thought-Provoking", "Emotional", "Uplifting", "Dark", "Nostalgic", "Inspiring"];
const TONES = ["Lighthearted", "Serious", "Satirical", "Suspenseful", "Romantic", "Gritty", "Whimsical"];
const PACING_OPTIONS = [
  { value: "", label: "Any Pacing" },
  { value: "slow", label: "Slow Burn" },
  { value: "moderate", label: "Moderate" },
  { value: "fast", label: "Fast-Paced" }
];
const ERA_OPTIONS = [
  { value: "", label: "Any Era" },
  { value: "classic", label: "Classic (Pre-1970)" },
  { value: "vintage", label: "Vintage (1970-1990)" },
  { value: "modern", label: "Modern (1990-2010)" },
  { value: "contemporary", label: "Contemporary (2010+)" }
];
const LANGUAGE_OPTIONS = [
  { value: "", label: "Any Language" },
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" },
  { value: "zh", label: "Chinese" },
  { value: "hi", label: "Hindi" },
  { value: "it", label: "Italian" }
];

export const AdvancedFilters = ({ onFiltersChange, isOpen, onToggle }: AdvancedFiltersProps) => {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { isProUser } = useSubscription();
  const [showProModal, setShowProModal] = useState(false);
  
  const [filters, setFilters] = useState<FilterState>({
    genres: [],
    yearRange: [1900, new Date().getFullYear()],
    ratingRange: [0, 10],
    runtimeRange: [0, 300],
    sortBy: "popularity.desc",
    mood: [],
    tone: [],
    pacing: "",
    era: "",
    language: ""
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

  const handleProFilterClick = (callback: () => void) => {
    if (!isProUser) {
      setShowProModal(true);
      return;
    }
    callback();
  };

  const toggleMood = (mood: string) => {
    handleProFilterClick(() => {
      const newMoods = filters.mood.includes(mood)
        ? filters.mood.filter(m => m !== mood)
        : [...filters.mood, mood];
      updateFilters({ mood: newMoods });
    });
  };

  const toggleTone = (tone: string) => {
    handleProFilterClick(() => {
      const newTones = filters.tone.includes(tone)
        ? filters.tone.filter(t => t !== tone)
        : [...filters.tone, tone];
      updateFilters({ tone: newTones });
    });
  };

  const clearFilters = () => {
    const resetFilters: FilterState = {
      genres: [],
      yearRange: [1900, new Date().getFullYear()],
      ratingRange: [0, 10],
      runtimeRange: [0, 300],
      sortBy: "popularity.desc",
      mood: [],
      tone: [],
      pacing: "",
      era: "",
      language: ""
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
    <>
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

        {/* Pro Filters Section */}
        <div className="border-t border-border pt-4 mt-4">
          <div className="flex items-center gap-2 mb-4">
            <Crown className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-semibold text-foreground">Pro Discovery</span>
            {!isProUser && <Lock className="h-3 w-3 text-muted-foreground" />}
          </div>

          {/* Mood */}
          <div className="mb-4">
            <label className="text-sm font-medium text-foreground mb-2 block">Mood</label>
            <div className="flex flex-wrap gap-2">
              {MOODS.map(mood => (
                <Badge
                  key={mood}
                  variant={filters.mood.includes(mood) ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer text-xs",
                    !isProUser && "opacity-60",
                    filters.mood.includes(mood) 
                      ? "bg-amber-500 hover:bg-amber-600" 
                      : "hover:border-amber-500/50"
                  )}
                  onClick={() => toggleMood(mood)}
                >
                  {mood}
                </Badge>
              ))}
            </div>
          </div>

          {/* Tone */}
          <div className="mb-4">
            <label className="text-sm font-medium text-foreground mb-2 block">Tone</label>
            <div className="flex flex-wrap gap-2">
              {TONES.map(tone => (
                <Badge
                  key={tone}
                  variant={filters.tone.includes(tone) ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer text-xs",
                    !isProUser && "opacity-60",
                    filters.tone.includes(tone) 
                      ? "bg-amber-500 hover:bg-amber-600" 
                      : "hover:border-amber-500/50"
                  )}
                  onClick={() => toggleTone(tone)}
                >
                  {tone}
                </Badge>
              ))}
            </div>
          </div>

          {/* Pacing */}
          <div className="mb-4">
            <label className="text-sm font-medium text-foreground mb-2 block">Pacing</label>
            <Select 
              value={filters.pacing} 
              onValueChange={(value) => handleProFilterClick(() => updateFilters({ pacing: value }))}
            >
              <SelectTrigger className={cn(!isProUser && "opacity-60")}>
                <SelectValue placeholder="Any Pacing" />
              </SelectTrigger>
              <SelectContent>
                {PACING_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Era */}
          <div className="mb-4">
            <label className="text-sm font-medium text-foreground mb-2 block">Era</label>
            <Select 
              value={filters.era} 
              onValueChange={(value) => handleProFilterClick(() => updateFilters({ era: value }))}
            >
              <SelectTrigger className={cn(!isProUser && "opacity-60")}>
                <SelectValue placeholder="Any Era" />
              </SelectTrigger>
              <SelectContent>
                {ERA_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Language */}
          <div className="mb-4">
            <label className="text-sm font-medium text-foreground mb-2 block">Language</label>
            <Select 
              value={filters.language} 
              onValueChange={(value) => handleProFilterClick(() => updateFilters({ language: value }))}
            >
              <SelectTrigger className={cn(!isProUser && "opacity-60")}>
                <SelectValue placeholder="Any Language" />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGE_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button variant="outline" onClick={clearFilters} className="w-full touch-target focus-ring">
          Clear All Filters
        </Button>
      </Card>

      <ProUpgradeModal
        isOpen={showProModal}
        onClose={() => setShowProModal(false)}
        feature="Advanced Discovery"
        description="Unlock powerful filters like Mood, Tone, Pacing, Era, and Language to discover your perfect movie match."
      />
    </>
  );
};
