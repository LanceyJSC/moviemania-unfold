import { useState } from "react";
import { X, Crown, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileActionSheet } from "@/components/MobileActionSheet";
import { cn } from "@/lib/utils";

interface FilterState {
  genres: string[];
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

interface MobileAdvancedFiltersProps {
  onFiltersChange: (filters: FilterState) => void;
  isOpen: boolean;
  onToggle: () => void;
}

// ONLY Pro-exclusive filter options - basic filters are in MobileInlineFilters
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

// This component is ONLY for Pro users and ONLY shows advanced filters
// Basic filters (Year, Rating, Runtime, Genres) are handled by MobileInlineFilters
export const MobileAdvancedFilters = ({ onFiltersChange, isOpen, onToggle }: MobileAdvancedFiltersProps) => {
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

  const [showPacingSheet, setShowPacingSheet] = useState(false);
  const [showEraSheet, setShowEraSheet] = useState(false);
  const [showLanguageSheet, setShowLanguageSheet] = useState(false);

  const updateFilters = (newFilters: Partial<FilterState>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFiltersChange(updatedFilters);
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
    const defaultFilters: FilterState = {
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
    setFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  };

  const activeCount = filters.mood.length + filters.tone.length + 
    (filters.pacing !== "any" ? 1 : 0) + 
    (filters.era !== "any" ? 1 : 0) + 
    (filters.language !== "any" ? 1 : 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div 
        className="flex-shrink-0 bg-background/95 backdrop-blur-xl border-b border-border"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="h-12 w-12 rounded-full"
          >
            <X className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-500" />
            <h1 className="font-cinematic text-xl tracking-wide text-foreground">
              Pro Filters
            </h1>
          </div>
          <Button
            variant="ghost"
            onClick={clearFilters}
            className="text-primary text-sm font-medium h-12 px-4 rounded-full"
          >
            Clear
          </Button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div 
        className="flex-1 overflow-y-auto overscroll-contain"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="p-4 space-y-6">
          {/* Mood */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">Mood</label>
            <div className="flex flex-wrap gap-2">
              {MOODS.map((mood) => (
                <button
                  key={mood}
                  onClick={() => toggleMood(mood)}
                  className={cn(
                    "px-4 py-2.5 rounded-full text-sm font-medium transition-all active:scale-95",
                    filters.mood.includes(mood)
                      ? "bg-amber-500 text-white"
                      : "bg-card border border-border/60 text-foreground"
                  )}
                >
                  {mood}
                </button>
              ))}
            </div>
          </div>

          {/* Tone */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">Tone</label>
            <div className="flex flex-wrap gap-2">
              {TONES.map((tone) => (
                <button
                  key={tone}
                  onClick={() => toggleTone(tone)}
                  className={cn(
                    "px-4 py-2.5 rounded-full text-sm font-medium transition-all active:scale-95",
                    filters.tone.includes(tone)
                      ? "bg-amber-500 text-white"
                      : "bg-card border border-border/60 text-foreground"
                  )}
                >
                  {tone}
                </button>
              ))}
            </div>
          </div>

          {/* Pacing */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">Pacing</label>
            <Button
              variant="outline"
              onClick={() => setShowPacingSheet(true)}
              className="w-full h-14 bg-card border-border/50 rounded-xl text-base justify-between px-4"
            >
              <span>{PACING_OPTIONS.find(o => o.value === filters.pacing)?.label || "Any Pacing"}</span>
              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>

          {/* Era */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">Era</label>
            <Button
              variant="outline"
              onClick={() => setShowEraSheet(true)}
              className="w-full h-14 bg-card border-border/50 rounded-xl text-base justify-between px-4"
            >
              <span>{ERA_OPTIONS.find(o => o.value === filters.era)?.label || "Any Era"}</span>
              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>

          {/* Language */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">Language</label>
            <Button
              variant="outline"
              onClick={() => setShowLanguageSheet(true)}
              className="w-full h-14 bg-card border-border/50 rounded-xl text-base justify-between px-4"
            >
              <span>{LANGUAGE_OPTIONS.find(o => o.value === filters.language)?.label || "Any Language"}</span>
              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>

          {/* Active Filters Summary */}
          {activeCount > 0 && (
            <div className="pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground text-center">
                {activeCount} filter{activeCount !== 1 ? 's' : ''} active
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Apply Button */}
      <div 
        className="flex-shrink-0 p-4 border-t border-border bg-background"
        style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
      >
        <Button 
          onClick={onToggle}
          className="w-full h-14 rounded-xl text-base font-medium"
        >
          Apply Filters
        </Button>
      </div>

      {/* Action Sheets */}
      <MobileActionSheet
        isOpen={showPacingSheet}
        onClose={() => setShowPacingSheet(false)}
        title="Pacing"
        options={PACING_OPTIONS}
        selectedValue={filters.pacing}
        onSelect={(value) => updateFilters({ pacing: value })}
      />

      <MobileActionSheet
        isOpen={showEraSheet}
        onClose={() => setShowEraSheet(false)}
        title="Era"
        options={ERA_OPTIONS}
        selectedValue={filters.era}
        onSelect={(value) => updateFilters({ era: value })}
      />

      <MobileActionSheet
        isOpen={showLanguageSheet}
        onClose={() => setShowLanguageSheet(false)}
        title="Language"
        options={LANGUAGE_OPTIONS}
        selectedValue={filters.language}
        onSelect={(value) => updateFilters({ language: value })}
      />
    </div>
  );
};
