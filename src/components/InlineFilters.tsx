import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Crown } from "lucide-react";
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
import { MobileInlineFilters } from "./MobileInlineFilters";
import { useIsMobile } from "@/hooks/use-mobile";
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

const GENRES = [
  { id: 28, name: "Action", emoji: "💥" },
  { id: 35, name: "Comedy", emoji: "😂" },
  { id: 27, name: "Horror", emoji: "👻" },
  { id: 10749, name: "Romance", emoji: "💕" },
  { id: 878, name: "Sci-Fi", emoji: "🚀" },
  { id: 12, name: "Adventure", emoji: "🗺️" },
];

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

// This component is ONLY rendered for Pro users - no internal Pro checks needed
export const InlineFilters = ({ onFiltersChange }: InlineFiltersProps) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
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
    navigate(`/search?genre=${genreId}`);
  };

  const handleViewAllGenres = () => {
    navigate("/genres");
  };

  const toggleMood = (mood: string) => {
    const newMoods = filters.mood.includes(mood)
      ? filters.mood.filter(m => m !== mood)
      : [...filters.mood, mood];
    updateFilters({ mood: newMoods });
  };

  const toggleTone = (tone: string) => {
    const newTones = filters.tone.includes(tone)
      ? filters.tone.filter(t => t !== tone)
      : [...filters.tone, tone];
    updateFilters({ tone: newTones });
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
    (filters.pacing !== "any" ? 1 : 0) + 
    (filters.era !== "any" ? 1 : 0) + 
    (filters.language !== "any" ? 1 : 0) +
    (filters.yearRange[0] > 1900 || filters.yearRange[1] < new Date().getFullYear() ? 1 : 0) +
    (filters.ratingRange[0] > 0 || filters.ratingRange[1] < 10 ? 1 : 0);

  // Render mobile version on mobile devices
  if (isMobile) {
    return <MobileInlineFilters onFiltersChange={onFiltersChange} />;
  }

  return (
    <div className="space-y-6">
      {/* Explore by Genre */}
      <div className="bg-card/60 backdrop-blur-sm rounded-2xl border border-border/40 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎬</span>
            <h3 className="font-semibold text-lg text-foreground">Explore by Genre</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleViewAllGenres}
            className="text-primary hover:text-primary/80"
          >
            View All
          </Button>
        </div>
        
        <div className="flex flex-wrap gap-3">
          {GENRES.map((genre) => (
            <button
              key={genre.id}
              onClick={() => handleGenreClick(genre.id)}
              className="flex items-center gap-2 py-2.5 px-4 rounded-xl bg-background/80 border border-border/60 hover:bg-primary/10 hover:border-primary/40 transition-all"
            >
              <span className="text-lg">{genre.emoji}</span>
              <span className="font-medium text-foreground">{genre.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Pro Discovery Filters */}
      <div className="bg-gradient-to-br from-amber-500/5 via-card/60 to-orange-500/5 backdrop-blur-sm rounded-2xl border border-amber-500/20 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Crown className="h-5 w-5 text-amber-500" />
            <h3 className="font-semibold text-lg text-foreground">Pro Discovery Filters</h3>
            {activeFilterCount > 0 && (
              <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30">
                {activeFilterCount} active
              </Badge>
            )}
          </div>
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
              Clear All
            </Button>
          )}
        </div>

        {/* Slider Filters */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-background/50 rounded-xl p-4 border border-border/30">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">Year</span>
              <span className="text-sm font-semibold text-foreground">{filters.yearRange[0]} - {filters.yearRange[1]}</span>
            </div>
            <Slider
              value={filters.yearRange}
              onValueChange={(value) => updateFilters({ yearRange: value as [number, number] })}
              min={1900}
              max={new Date().getFullYear()}
              step={1}
              className="w-full"
            />
          </div>

          <div className="bg-background/50 rounded-xl p-4 border border-border/30">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">Rating</span>
              <span className="text-sm font-semibold text-foreground">{filters.ratingRange[0].toFixed(1)} - {filters.ratingRange[1].toFixed(1)}</span>
            </div>
            <Slider
              value={filters.ratingRange}
              onValueChange={(value) => updateFilters({ ratingRange: value as [number, number] })}
              min={0}
              max={10}
              step={0.5}
              className="w-full"
            />
          </div>

          <div className="bg-background/50 rounded-xl p-4 border border-border/30">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">Runtime</span>
              <span className="text-sm font-semibold text-foreground">{filters.runtimeRange[0]} - {filters.runtimeRange[1]} min</span>
            </div>
            <Slider
              value={filters.runtimeRange}
              onValueChange={(value) => updateFilters({ runtimeRange: value as [number, number] })}
              min={0}
              max={300}
              step={15}
              className="w-full"
            />
          </div>
        </div>

        {/* Advanced Filters Collapsible */}
        <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-center gap-2 w-full h-10 bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/20 rounded-xl cursor-pointer transition-all">
              <span className="text-sm font-medium text-foreground">More Options</span>
              <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", showAdvanced && "rotate-180")} />
            </div>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="pt-6 space-y-5">
            {/* Mood */}
            <div className="bg-background/50 rounded-xl p-4 border border-border/30">
              <label className="text-sm font-medium text-foreground mb-3 block">Mood</label>
              <div className="flex flex-wrap gap-2">
                {MOODS.map(mood => (
                  <button
                    key={mood}
                    onClick={() => toggleMood(mood)}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                      filters.mood.includes(mood) 
                        ? "bg-amber-500 text-white" 
                        : "bg-muted/50 text-foreground hover:bg-amber-500/10"
                    )}
                  >
                    {mood}
                  </button>
                ))}
              </div>
            </div>

            {/* Tone */}
            <div className="bg-background/50 rounded-xl p-4 border border-border/30">
              <label className="text-sm font-medium text-foreground mb-3 block">Tone</label>
              <div className="flex flex-wrap gap-2">
                {TONES.map(tone => (
                  <button
                    key={tone}
                    onClick={() => toggleTone(tone)}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                      filters.tone.includes(tone) 
                        ? "bg-amber-500 text-white" 
                        : "bg-muted/50 text-foreground hover:bg-amber-500/10"
                    )}
                  >
                    {tone}
                  </button>
                ))}
              </div>
            </div>

            {/* Dropdowns */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-background/50 rounded-xl p-4 border border-border/30">
                <label className="text-sm font-medium text-foreground mb-2 block">Pacing</label>
                <Select value={filters.pacing} onValueChange={(value) => updateFilters({ pacing: value })}>
                  <SelectTrigger className="h-10 bg-background border-border/50">
                    <SelectValue placeholder="Any Pacing" />
                  </SelectTrigger>
                  <SelectContent>
                    {PACING_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-background/50 rounded-xl p-4 border border-border/30">
                <label className="text-sm font-medium text-foreground mb-2 block">Era</label>
                <Select value={filters.era} onValueChange={(value) => updateFilters({ era: value })}>
                  <SelectTrigger className="h-10 bg-background border-border/50">
                    <SelectValue placeholder="Any Era" />
                  </SelectTrigger>
                  <SelectContent>
                    {ERA_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-background/50 rounded-xl p-4 border border-border/30">
                <label className="text-sm font-medium text-foreground mb-2 block">Language</label>
                <Select value={filters.language} onValueChange={(value) => updateFilters({ language: value })}>
                  <SelectTrigger className="h-10 bg-background border-border/50">
                    <SelectValue placeholder="Any Language" />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGE_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
};
