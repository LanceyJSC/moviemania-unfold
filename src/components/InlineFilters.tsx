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
import { MobileInlineFilters } from "./MobileInlineFilters";
import { useSubscription } from "@/hooks/useSubscription";
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
  const isMobile = useIsMobile();
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

  // Render mobile version on mobile devices
  if (isMobile) {
    return <MobileInlineFilters onFiltersChange={onFiltersChange} />;
  }

  return (
    <>
      <div className="space-y-8">
        {/* Explore by Genre Section - Clean Card */}
        <div className="bg-card/60 backdrop-blur-sm rounded-2xl border border-border/40 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <span className="text-xl">🎬</span>
              </div>
              <div>
                <h3 className="font-semibold text-lg text-foreground">Explore by Genre</h3>
                <p className="text-sm text-muted-foreground">Find your perfect movie</p>
              </div>
              {!isProUser && <Lock className="h-4 w-4 text-muted-foreground ml-2" />}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleViewAllGenres}
              className="text-primary border-primary/30 hover:bg-primary/10"
            >
              View All Genres
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-3">
            {GENRES.map((genre) => (
              <button
                key={genre.id}
                onClick={() => handleGenreClick(genre.id)}
                className={cn(
                  "flex items-center gap-2 py-2.5 px-4 rounded-xl",
                  "bg-background/80 border border-border/60",
                  "hover:bg-primary/10 hover:border-primary/40 hover:shadow-md",
                  "transition-all duration-200 active:scale-[0.98]",
                  !isProUser && "opacity-70"
                )}
              >
                <span className="text-lg" role="img" aria-label={genre.name}>{genre.emoji}</span>
                <span className="font-medium text-foreground">{genre.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Pro Discovery Filters - Premium Card */}
        <div className="bg-gradient-to-br from-amber-500/5 via-card/60 to-orange-500/5 backdrop-blur-sm rounded-2xl border border-amber-500/20 p-6 shadow-sm">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                <Crown className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg text-foreground">Pro Discovery Filters</h3>
                  {!isProUser && <Lock className="h-4 w-4 text-muted-foreground" />}
                </div>
                <p className="text-sm text-muted-foreground">Fine-tune your search with advanced options</p>
              </div>
              {activeFilterCount > 0 && (
                <Badge className="ml-2 bg-amber-500/20 text-amber-600 border-amber-500/30">
                  {activeFilterCount} active
                </Badge>
              )}
            </div>
            {activeFilterCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearFilters} 
                className="text-muted-foreground hover:text-foreground"
              >
                Clear All
              </Button>
            )}
          </div>

          {/* Slider Filters - Clean Grid */}
          <div className="grid grid-cols-3 gap-6 mb-6">
            {/* Year Range Card */}
            <div className="bg-background/50 rounded-xl p-4 border border-border/30">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-muted-foreground">Year</span>
                <span className="text-sm font-semibold text-foreground bg-muted/50 px-2 py-0.5 rounded">
                  {filters.yearRange[0]} - {filters.yearRange[1]}
                </span>
              </div>
              <Slider
                value={filters.yearRange}
                onValueChange={(value) => handleProFilterClick(() => updateFilters({ yearRange: value as [number, number] }))}
                min={1900}
                max={new Date().getFullYear()}
                step={1}
                className={cn("w-full", !isProUser && "opacity-60")}
              />
            </div>

            {/* Rating Range Card */}
            <div className="bg-background/50 rounded-xl p-4 border border-border/30">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-muted-foreground">Rating</span>
                <span className="text-sm font-semibold text-foreground bg-muted/50 px-2 py-0.5 rounded">
                  {filters.ratingRange[0].toFixed(1)} - {filters.ratingRange[1].toFixed(1)}
                </span>
              </div>
              <Slider
                value={filters.ratingRange}
                onValueChange={(value) => handleProFilterClick(() => updateFilters({ ratingRange: value as [number, number] }))}
                min={0}
                max={10}
                step={0.5}
                className={cn("w-full", !isProUser && "opacity-60")}
              />
            </div>

            {/* Runtime Range Card */}
            <div className="bg-background/50 rounded-xl p-4 border border-border/30">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-muted-foreground">Runtime</span>
                <span className="text-sm font-semibold text-foreground bg-muted/50 px-2 py-0.5 rounded">
                  {filters.runtimeRange[0]} - {filters.runtimeRange[1]} min
                </span>
              </div>
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
              <div className="flex items-center justify-center gap-2 w-full h-11 bg-gradient-to-r from-amber-500/10 to-orange-500/10 hover:from-amber-500/15 hover:to-orange-500/15 border border-amber-500/20 rounded-xl cursor-pointer transition-all hover:shadow-sm">
                <span className="text-sm font-medium text-foreground">More Discovery Options</span>
                <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200", showAdvanced && "rotate-180")} />
              </div>
            </CollapsibleTrigger>
            
            <CollapsibleContent className="pt-6 space-y-6">
              {/* Mood Section */}
              <div className="bg-background/50 rounded-xl p-4 border border-border/30">
                <label className="text-sm font-medium text-foreground mb-3 block">Mood</label>
                <div className="flex flex-wrap gap-2">
                  {MOODS.map(mood => (
                    <button
                      key={mood}
                      onClick={() => toggleMood(mood)}
                      className={cn(
                        "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                        !isProUser && "opacity-60",
                        filters.mood.includes(mood) 
                          ? "bg-amber-500 text-white shadow-md" 
                          : "bg-muted/50 text-foreground hover:bg-amber-500/10 border border-transparent hover:border-amber-500/30"
                      )}
                    >
                      {mood}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tone Section */}
              <div className="bg-background/50 rounded-xl p-4 border border-border/30">
                <label className="text-sm font-medium text-foreground mb-3 block">Tone</label>
                <div className="flex flex-wrap gap-2">
                  {TONES.map(tone => (
                    <button
                      key={tone}
                      onClick={() => toggleTone(tone)}
                      className={cn(
                        "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                        !isProUser && "opacity-60",
                        filters.tone.includes(tone) 
                          ? "bg-amber-500 text-white shadow-md" 
                          : "bg-muted/50 text-foreground hover:bg-amber-500/10 border border-transparent hover:border-amber-500/30"
                      )}
                    >
                      {tone}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dropdowns Row */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-background/50 rounded-xl p-4 border border-border/30">
                  <label className="text-sm font-medium text-foreground mb-2 block">Pacing</label>
                  <Select 
                    value={filters.pacing} 
                    onValueChange={(value) => handleProFilterClick(() => updateFilters({ pacing: value }))}
                  >
                    <SelectTrigger className={cn("h-11 bg-background border-border/50", !isProUser && "opacity-60")}>
                      <SelectValue placeholder="Any Pacing" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      {PACING_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="bg-background/50 rounded-xl p-4 border border-border/30">
                  <label className="text-sm font-medium text-foreground mb-2 block">Era</label>
                  <Select 
                    value={filters.era} 
                    onValueChange={(value) => handleProFilterClick(() => updateFilters({ era: value }))}
                  >
                    <SelectTrigger className={cn("h-11 bg-background border-border/50", !isProUser && "opacity-60")}>
                      <SelectValue placeholder="Any Era" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      {ERA_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="bg-background/50 rounded-xl p-4 border border-border/30">
                  <label className="text-sm font-medium text-foreground mb-2 block">Language</label>
                  <Select 
                    value={filters.language} 
                    onValueChange={(value) => handleProFilterClick(() => updateFilters({ language: value }))}
                  >
                    <SelectTrigger className={cn("h-11 bg-background border-border/50", !isProUser && "opacity-60")}>
                      <SelectValue placeholder="Any Language" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
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