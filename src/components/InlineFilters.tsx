import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Crown, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { ProUpgradeModal } from "./ProUpgradeModal";
import { useSubscription } from "@/hooks/useSubscription";
import { cn } from "@/lib/utils";

export interface FilterState {
  genres: number[];
  yearRange: [number, number];
  ratingRange: [number, number];
  runtimeRange: [number, number];
  sortBy: string;
  mood: string[];
  tone: string[];
  pacing: string;
  era: string;
  language: string;
}

interface InlineFiltersProps {
  onFiltersChange: (filters: FilterState) => void;
}

// Genre cards with TMDB IDs
const GENRES = [
  { id: 28, name: "Action", emoji: "💥" },
  { id: 35, name: "Comedy", emoji: "😂" },
  { id: 27, name: "Horror", emoji: "👻" },
  { id: 10749, name: "Romance", emoji: "💕" },
  { id: 878, name: "Sci-Fi", emoji: "🚀" },
  { id: 12, name: "Adventure", emoji: "🗺️" },
];

// Pro-only filter options
const MOODS = ["Feel-Good", "Intense", "Thought-Provoking", "Emotional", "Uplifting", "Dark", "Nostalgic", "Inspiring"];
const TONES = ["Lighthearted", "Serious", "Satirical", "Suspenseful", "Romantic", "Gritty", "Whimsical"];
const PACING_OPTIONS = [
  { value: "any", label: "Any Pacing" },
  { value: "slow", label: "Slow Burn" },
  { value: "moderate", label: "Moderate" },
  { value: "fast", label: "Fast-Paced" }
];
const ERA_OPTIONS = [
  { value: "any", label: "Any Era" },
  { value: "classic", label: "Classic (Pre-1970)" },
  { value: "vintage", label: "Vintage (1970-1990)" },
  { value: "modern", label: "Modern (1990-2010)" },
  { value: "contemporary", label: "Contemporary (2010+)" }
];
const LANGUAGE_OPTIONS = [
  { value: "any", label: "Any Language" },
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

export const InlineFilters = ({ onFiltersChange }: InlineFiltersProps) => {
  const navigate = useNavigate();
  const { isProUser, loading } = useSubscription();
  const [showProModal, setShowProModal] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const [filters, setFilters] = useState<FilterState>({
    genres: [],
    yearRange: [1900, new Date().getFullYear()],
    ratingRange: [0, 10],
    runtimeRange: [0, 300],
    sortBy: "popularity.desc",
    mood: [],
    tone: [],
    pacing: "any",
    era: "any",
    language: "any"
  });

  const updateFilters = (newFilters: Partial<FilterState>) => {
    const updated = { ...filters, ...newFilters };
    setFilters(updated);
    onFiltersChange(updated);
  };

  const handleGenreClick = (genreId: number) => {
    if (!isProUser) {
      setShowProModal(true);
      return;
    }
    navigate(`/search?genre=${genreId}`);
  };

  const handleViewAllGenres = () => {
    if (!isProUser) {
      setShowProModal(true);
      return;
    }
    navigate("/genres");
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
      pacing: "any",
      era: "any",
      language: "any"
    };
    setFilters(resetFilters);
    onFiltersChange(resetFilters);
  };

  const activeFilterCount = 
    filters.genres.length + 
    filters.mood.length + 
    filters.tone.length + 
    (filters.pacing && filters.pacing !== "any" ? 1 : 0) + 
    (filters.era && filters.era !== "any" ? 1 : 0) + 
    (filters.language && filters.language !== "any" ? 1 : 0) +
    (filters.yearRange[0] > 1900 || filters.yearRange[1] < new Date().getFullYear() ? 1 : 0) +
    (filters.ratingRange[0] > 0 || filters.ratingRange[1] < 10 ? 1 : 0);

  // Show loading state
  if (loading) {
    return null;
  }

  return (
    <>
      <div className="space-y-6">
        {/* Explore by Genre Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-cinematic text-lg tracking-wide text-foreground uppercase flex items-center gap-2">
                Explore by Genre
                {!isProUser && <Lock className="h-4 w-4 text-muted-foreground" />}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">Find your perfect movie</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleViewAllGenres}
              className="text-primary hover:text-primary/80 font-medium"
            >
              View All
            </Button>
          </div>
          
          <div className="grid grid-cols-6 gap-2">
            {GENRES.map((genre) => (
              <button
                key={genre.id}
                onClick={() => handleGenreClick(genre.id)}
                className={cn(
                  "flex flex-col items-center gap-1 py-2 px-2 rounded-lg",
                  "bg-card/80 border border-border/50",
                  "hover:bg-card hover:border-primary/50",
                  "transition-all duration-200 active:scale-95",
                  !isProUser && "opacity-70"
                )}
              >
                <span className="text-base" role="img" aria-label={genre.name}>
                  {genre.emoji}
                </span>
                <span className="text-xs font-medium text-foreground text-center">
                  {genre.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Pro Discovery Filters - Always visible for Pro users */}
        <div className="bg-card/50 rounded-xl border border-border/50 p-4 space-y-4">
          {/* Header with active filter count */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-500" />
              <h3 className="font-cinematic text-lg tracking-wide text-foreground uppercase">
                Pro Discovery Filters
              </h3>
              {!isProUser && <Lock className="h-4 w-4 text-muted-foreground" />}
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {activeFilterCount} active
                </Badge>
              )}
            </div>
            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs h-8">
                Clear All
              </Button>
            )}
          </div>

          {/* Basic Filters Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Year Range */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Year: {filters.yearRange[0]} - {filters.yearRange[1]}
              </label>
              <Slider
                value={filters.yearRange}
                onValueChange={(value) => handleProFilterClick(() => updateFilters({ yearRange: value as [number, number] }))}
                min={1900}
                max={new Date().getFullYear()}
                step={1}
                className={cn("w-full", !isProUser && "opacity-60")}
              />
            </div>

            {/* Rating Range */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Rating: {filters.ratingRange[0].toFixed(1)} - {filters.ratingRange[1].toFixed(1)}
              </label>
              <Slider
                value={filters.ratingRange}
                onValueChange={(value) => handleProFilterClick(() => updateFilters({ ratingRange: value as [number, number] }))}
                min={0}
                max={10}
                step={0.5}
                className={cn("w-full", !isProUser && "opacity-60")}
              />
            </div>

            {/* Runtime Range */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Runtime: {filters.runtimeRange[0]} - {filters.runtimeRange[1]} min
              </label>
              <Slider
                value={filters.runtimeRange}
                onValueChange={(value) => handleProFilterClick(() => updateFilters({ runtimeRange: value as [number, number] }))}
                min={0}
                max={300}
                step={15}
                className={cn("w-full", !isProUser && "opacity-60")}
              />
            </div>
          </div>

          {/* Advanced Pro Filters */}
          <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
            <CollapsibleTrigger className="w-full">
              <div className="flex items-center justify-between w-full h-10 px-3 bg-gradient-to-r from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20 border border-amber-500/20 rounded-lg cursor-pointer transition-colors">
                <span className="text-sm font-medium">More Discovery Options</span>
                <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", showAdvanced && "rotate-180")} />
              </div>
            </CollapsibleTrigger>
            
            <CollapsibleContent className="pt-4 space-y-4">
              {/* Mood */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Mood</label>
                <div className="flex flex-wrap gap-2">
                  {MOODS.map(mood => (
                    <Badge
                      key={mood}
                      variant={filters.mood.includes(mood) ? "default" : "outline"}
                      className={cn(
                        "cursor-pointer transition-all text-xs py-1.5 px-3",
                        !isProUser && "opacity-60",
                        filters.mood.includes(mood) 
                          ? "bg-amber-500 hover:bg-amber-600 border-amber-500" 
                          : "border-amber-500/30 hover:border-amber-500/60 hover:bg-amber-500/10"
                      )}
                      onClick={() => toggleMood(mood)}
                    >
                      {mood}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Tone */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tone</label>
                <div className="flex flex-wrap gap-2">
                  {TONES.map(tone => (
                    <Badge
                      key={tone}
                      variant={filters.tone.includes(tone) ? "default" : "outline"}
                      className={cn(
                        "cursor-pointer transition-all text-xs py-1.5 px-3",
                        !isProUser && "opacity-60",
                        filters.tone.includes(tone) 
                          ? "bg-amber-500 hover:bg-amber-600 border-amber-500" 
                          : "border-amber-500/30 hover:border-amber-500/60 hover:bg-amber-500/10"
                      )}
                      onClick={() => toggleTone(tone)}
                    >
                      {tone}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Pacing, Era, Language Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pacing</label>
                  <Select 
                    value={filters.pacing} 
                    onValueChange={(value) => handleProFilterClick(() => updateFilters({ pacing: value }))}
                  >
                    <SelectTrigger className={cn("h-10 border-amber-500/30", !isProUser && "opacity-60")}>
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

                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Era</label>
                  <Select 
                    value={filters.era} 
                    onValueChange={(value) => handleProFilterClick(() => updateFilters({ era: value }))}
                  >
                    <SelectTrigger className={cn("h-10 border-amber-500/30", !isProUser && "opacity-60")}>
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

                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Language</label>
                  <Select 
                    value={filters.language} 
                    onValueChange={(value) => handleProFilterClick(() => updateFilters({ language: value }))}
                  >
                    <SelectTrigger className={cn("h-10 border-amber-500/30", !isProUser && "opacity-60")}>
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
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>

      <ProUpgradeModal
        isOpen={showProModal}
        onClose={() => setShowProModal(false)}
        feature="Advanced Discovery"
        description="Unlock powerful filters like Mood, Tone, Pacing, Era, and Language to discover your perfect movie match."
      />
    </>
  );
};