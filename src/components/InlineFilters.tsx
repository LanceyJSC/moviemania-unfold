import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Search } from "lucide-react";
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
  { id: 18, name: "Drama", emoji: "🎭" },
  { id: 53, name: "Thriller", emoji: "😱" },
];

const MOODS = ["Feel-Good", "Intense", "Thought-Provoking", "Emotional", "Uplifting", "Dark", "Nostalgic", "Inspiring"];
const TONES = ["Lighthearted", "Serious", "Satirical", "Suspenseful", "Romantic", "Gritty", "Whimsical"];
const PACING_OPTIONS = [
  { value: "any", label: "Any" },
  { value: "slow", label: "Slow Burn" },
  { value: "moderate", label: "Moderate" },
  { value: "fast", label: "Fast-Paced" }
];
const ERA_OPTIONS = [
  { value: "any", label: "Any" },
  { value: "classic", label: "Pre-1970" },
  { value: "70s80s", label: "70s-80s" },
  { value: "90s00s", label: "90s-2000s" },
  { value: "modern", label: "2010+" },
  { value: "recent", label: "2020+" }
];
const LANGUAGE_OPTIONS = [
  { value: "any", label: "Any" },
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" }
];

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

  const updateFiltersLocally = (newFilters: Partial<FilterState>) => {
    const updated = { ...filters, ...newFilters };
    setFilters(updated);
  };

  const handleDiscover = () => {
    onFiltersChange(filters);
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
    updateFiltersLocally({ mood: newMoods });
  };

  const toggleTone = (tone: string) => {
    const newTones = filters.tone.includes(tone)
      ? filters.tone.filter(t => t !== tone)
      : [...filters.tone, tone];
    updateFiltersLocally({ tone: newTones });
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
    filters.mood.length + 
    filters.tone.length + 
    (filters.pacing !== "any" ? 1 : 0) + 
    (filters.era !== "any" ? 1 : 0) + 
    (filters.language !== "any" ? 1 : 0) +
    (filters.yearRange[0] > 1900 || filters.yearRange[1] < new Date().getFullYear() ? 1 : 0) +
    (filters.ratingRange[0] > 0 || filters.ratingRange[1] < 10 ? 1 : 0);

  if (isMobile) {
    return <MobileInlineFilters onFiltersChange={onFiltersChange} />;
  }

  return (
    <div className="space-y-6">
      {/* Genres - Compact horizontal scroll style */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1">
          {GENRES.map((genre) => (
            <button
              key={genre.id}
              onClick={() => handleGenreClick(genre.id)}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all whitespace-nowrap"
            >
              <span>{genre.emoji}</span>
              <span className="text-sm font-medium text-foreground">{genre.name}</span>
            </button>
          ))}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleViewAllGenres}
          className="text-primary shrink-0"
        >
          All Genres
        </Button>
      </div>

      {/* Main Filters Card */}
      <div className="bg-card/50 rounded-xl border border-border/40 p-5">
        {/* Sliders Row */}
        <div className="grid grid-cols-3 gap-8 mb-5">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Year</span>
              <span className="text-foreground font-medium">{filters.yearRange[0]}–{filters.yearRange[1]}</span>
            </div>
            <Slider
              value={filters.yearRange}
              onValueChange={(value) => updateFiltersLocally({ yearRange: value as [number, number] })}
              min={1900}
              max={new Date().getFullYear()}
              step={1}
            />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Rating</span>
              <span className="text-foreground font-medium">{filters.ratingRange[0]}–{filters.ratingRange[1]}</span>
            </div>
            <Slider
              value={filters.ratingRange}
              onValueChange={(value) => updateFiltersLocally({ ratingRange: value as [number, number] })}
              min={0}
              max={10}
              step={0.5}
            />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Runtime</span>
              <span className="text-foreground font-medium">{filters.runtimeRange[0]}–{filters.runtimeRange[1]}m</span>
            </div>
            <Slider
              value={filters.runtimeRange}
              onValueChange={(value) => updateFiltersLocally({ runtimeRange: value as [number, number] })}
              min={0}
              max={300}
              step={15}
            />
          </div>
        </div>

        {/* Action Row */}
        <div className="flex items-center gap-3">
          <Button onClick={handleDiscover} className="flex-1 h-10">
            <Search className="h-4 w-4 mr-2" />
            Discover
          </Button>
          
          <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                More
                <ChevronDown className={cn("h-3 w-3 transition-transform", showAdvanced && "rotate-180")} />
              </Button>
            </CollapsibleTrigger>
          </Collapsible>
          
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
              Clear
            </Button>
          )}
        </div>

        {/* Advanced Filters - Clean horizontal layout */}
        <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
          <CollapsibleContent className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
            <div className="pt-5 mt-5 border-t border-border/30 space-y-4">
              {/* Quick Selects Row */}
              <div className="flex items-center gap-4">
                <Select value={filters.pacing} onValueChange={(value) => updateFiltersLocally({ pacing: value })}>
                  <SelectTrigger className="w-32 h-9 text-sm">
                    <SelectValue placeholder="Pacing" />
                  </SelectTrigger>
                  <SelectContent>
                    {PACING_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filters.era} onValueChange={(value) => updateFiltersLocally({ era: value })}>
                  <SelectTrigger className="w-32 h-9 text-sm">
                    <SelectValue placeholder="Era" />
                  </SelectTrigger>
                  <SelectContent>
                    {ERA_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filters.language} onValueChange={(value) => updateFiltersLocally({ language: value })}>
                  <SelectTrigger className="w-32 h-9 text-sm">
                    <SelectValue placeholder="Language" />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGE_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Mood & Tone - Compact pills */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground uppercase tracking-wide mr-1">Mood:</span>
                {MOODS.map(mood => (
                  <button
                    key={mood}
                    onClick={() => toggleMood(mood)}
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium transition-all",
                      filters.mood.includes(mood) 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    {mood}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground uppercase tracking-wide mr-1">Tone:</span>
                {TONES.map(tone => (
                  <button
                    key={tone}
                    onClick={() => toggleTone(tone)}
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium transition-all",
                      filters.tone.includes(tone) 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    {tone}
                  </button>
                ))}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
};