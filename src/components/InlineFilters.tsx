import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Search, Sparkles, ArrowRight } from "lucide-react";
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
  { value: "any", label: "Any Pacing" },
  { value: "slow", label: "Slow Burn" },
  { value: "moderate", label: "Moderate" },
  { value: "fast", label: "Fast-Paced" }
];
const ERA_OPTIONS = [
  { value: "any", label: "Any Era" },
  { value: "classic", label: "Classic (Pre-1970)" },
  { value: "70s80s", label: "70s & 80s" },
  { value: "90s00s", label: "90s & 2000s" },
  { value: "modern", label: "Modern (2010+)" },
  { value: "recent", label: "Recent (2020+)" }
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
    filters.genres.length + 
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
    <div className="space-y-8">
      {/* Genre Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-cinematic text-xl text-foreground tracking-wide">EXPLORE BY GENRE</h3>
            <div className="w-12 h-0.5 bg-primary mt-1"></div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleViewAllGenres}
            className="text-primary hover:text-primary/80 gap-1"
          >
            View All
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {GENRES.map((genre) => (
            <button
              key={genre.id}
              onClick={() => handleGenreClick(genre.id)}
              className={cn(
                "flex items-center gap-1.5 py-1.5 px-3 rounded-full text-sm",
                "bg-card/80 border border-border/50",
                "hover:bg-card hover:border-primary/50",
                "transition-all duration-200 active:scale-95"
              )}
            >
              <span role="img" aria-label={genre.name}>{genre.emoji}</span>
              <span className="font-medium text-foreground">{genre.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Filters Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-cinematic text-xl text-foreground tracking-wide">REFINE YOUR SEARCH</h3>
            <div className="w-12 h-0.5 bg-primary mt-1"></div>
          </div>
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-primary hover:text-primary/80 gap-1">
              Reset Filters
            </Button>
          )}
        </div>

        {activeFilterCount > 0 && (
          <p className="text-muted-foreground text-sm mb-4">
            {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active
          </p>
        )}

        {/* Slider Filters */}
        <div className="space-y-4 mb-6">
          {/* Year Range */}
          <div className="bg-card/60 rounded-lg border border-border/50 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-foreground">Year Range</span>
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

          {/* Rating and Runtime side by side */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-card/60 rounded-lg border border-border/50 p-4">
              <div className="flex items-center justify-between mb-3">
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

            <div className="bg-card/60 rounded-lg border border-border/50 p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-foreground">Runtime</span>
                <span className="text-sm text-primary font-semibold">{filters.runtimeRange[0]} – {filters.runtimeRange[1]} min</span>
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
        </div>

        {/* Discover Button */}
        <Button 
          onClick={handleDiscover}
          className="w-full h-10 rounded-lg text-sm font-semibold mb-6"
        >
          <Search className="h-4 w-4 mr-2" />
          Discover Movies
        </Button>

        {/* Advanced Filters */}
        <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
          <CollapsibleTrigger className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer py-2">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">Advanced Filters</span>
            <ChevronDown className={cn("h-4 w-4 transition-transform duration-300", showAdvanced && "rotate-180")} />
          </CollapsibleTrigger>
          
          <CollapsibleContent className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
            <div className="pt-4 space-y-6">
              {/* Mood */}
              <div>
                <h4 className="text-sm font-medium text-foreground mb-3">Mood</h4>
                <div className="flex flex-wrap gap-2">
                  {MOODS.map(mood => (
                    <button
                      key={mood}
                      onClick={() => toggleMood(mood)}
                      className={cn(
                        "py-1.5 px-3 rounded-full text-sm font-medium transition-all duration-200 active:scale-95",
                        filters.mood.includes(mood) 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-card/80 border border-border/50 text-foreground hover:bg-card hover:border-primary/50"
                      )}
                    >
                      {mood}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tone */}
              <div>
                <h4 className="text-sm font-medium text-foreground mb-3">Tone</h4>
                <div className="flex flex-wrap gap-2">
                  {TONES.map(tone => (
                    <button
                      key={tone}
                      onClick={() => toggleTone(tone)}
                      className={cn(
                        "py-1.5 px-3 rounded-full text-sm font-medium transition-all duration-200 active:scale-95",
                        filters.tone.includes(tone) 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-card/80 border border-border/50 text-foreground hover:bg-card hover:border-primary/50"
                      )}
                    >
                      {tone}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dropdowns */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-2">Pacing</label>
                  <Select value={filters.pacing} onValueChange={(value) => updateFiltersLocally({ pacing: value })}>
                    <SelectTrigger className="h-9 bg-card/60 border-border/50 rounded-lg text-sm">
                      <SelectValue placeholder="Any Pacing" />
                    </SelectTrigger>
                    <SelectContent>
                      {PACING_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-2">Era</label>
                  <Select value={filters.era} onValueChange={(value) => updateFiltersLocally({ era: value })}>
                    <SelectTrigger className="h-9 bg-card/60 border-border/50 rounded-lg text-sm">
                      <SelectValue placeholder="Any Era" />
                    </SelectTrigger>
                    <SelectContent>
                      {ERA_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-2">Language</label>
                  <Select value={filters.language} onValueChange={(value) => updateFiltersLocally({ language: value })}>
                    <SelectTrigger className="h-9 bg-card/60 border-border/50 rounded-lg text-sm">
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
            </div>
          </CollapsibleContent>
        </Collapsible>
      </section>
    </div>
  );
};