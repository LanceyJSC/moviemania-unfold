import { useState } from "react";
import { X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

interface FilterState {
  genres: string[];
  yearRange: [number, number];
  ratingRange: [number, number];
  runtimeRange: [number, number];
  sortBy: string;
  mood: string;
  tone: string;
  pacing: string;
}

interface MobileAdvancedFiltersProps {
  onFiltersChange: (filters: FilterState) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const MOOD_OPTIONS = [
  { value: "any", label: "Any Mood" },
  { value: "feel-good", label: "Feel-Good" },
  { value: "intense", label: "Intense" },
  { value: "thought-provoking", label: "Thought-Provoking" },
  { value: "emotional", label: "Emotional" },
  { value: "uplifting", label: "Uplifting" },
  { value: "dark", label: "Dark" },
  { value: "nostalgic", label: "Nostalgic" },
  { value: "inspiring", label: "Inspiring" },
];

const TONE_OPTIONS = [
  { value: "any", label: "Any Tone" },
  { value: "lighthearted", label: "Lighthearted" },
  { value: "serious", label: "Serious" },
  { value: "satirical", label: "Satirical" },
  { value: "suspenseful", label: "Suspenseful" },
  { value: "romantic", label: "Romantic" },
  { value: "gritty", label: "Gritty" },
  { value: "whimsical", label: "Whimsical" },
];

const PACING_OPTIONS = [
  { value: "any", label: "Any Pacing" },
  { value: "slow", label: "Slow Burn" },
  { value: "moderate", label: "Moderate" },
  { value: "fast", label: "Fast-Paced" }
];

type SheetType = "mood" | "tone" | "pacing" | null;

export const MobileAdvancedFilters = ({ onFiltersChange, isOpen, onToggle }: MobileAdvancedFiltersProps) => {
  const [activeSheet, setActiveSheet] = useState<SheetType>(null);
  
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

  const updateFilters = (newFilters: Partial<FilterState>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFiltersChange(updatedFilters);
  };

  const clearFilters = () => {
    const defaultFilters: FilterState = {
      genres: [],
      yearRange: [1900, new Date().getFullYear()],
      ratingRange: [0, 10],
      runtimeRange: [0, 300],
      sortBy: "popularity.desc",
      mood: "any",
      tone: "any",
      pacing: "any"
    };
    setFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  };

  const isMoodModified = filters.mood !== "any";
  const isToneModified = filters.tone !== "any";
  const isPacingModified = filters.pacing !== "any";

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div 
        className="flex-shrink-0 bg-background/95 backdrop-blur-xl border-b border-border"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="icon" onClick={onToggle} className="h-12 w-12 rounded-full">
            <X className="h-5 w-5" />
          </Button>
          <h1 className="font-cinematic text-xl tracking-wide text-foreground">More Filters</h1>
          <Button variant="ghost" onClick={clearFilters} className="text-primary text-sm font-medium h-12 px-4 rounded-full">
            Clear
          </Button>
        </div>
      </div>

      {/* Filter Cards */}
      <div className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-3" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {/* Mood Card */}
        <button
          onClick={() => setActiveSheet("mood")}
          className={cn(
            "w-full flex items-center justify-between p-4 rounded-xl bg-card border transition-colors active:bg-card/80",
            isMoodModified ? "border-primary/50" : "border-border/50"
          )}
        >
          <div className="flex items-center gap-3">
            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-lg", isMoodModified ? "bg-primary/20" : "bg-muted")}>
              😊
            </div>
            <div className="text-left">
              <p className="font-medium text-foreground">Mood</p>
              <p className="text-sm text-muted-foreground">{MOOD_OPTIONS.find(o => o.value === filters.mood)?.label}</p>
            </div>
          </div>
        </button>

        {/* Tone Card */}
        <button
          onClick={() => setActiveSheet("tone")}
          className={cn(
            "w-full flex items-center justify-between p-4 rounded-xl bg-card border transition-colors active:bg-card/80",
            isToneModified ? "border-primary/50" : "border-border/50"
          )}
        >
          <div className="flex items-center gap-3">
            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-lg", isToneModified ? "bg-primary/20" : "bg-muted")}>
              🎭
            </div>
            <div className="text-left">
              <p className="font-medium text-foreground">Tone</p>
              <p className="text-sm text-muted-foreground">{TONE_OPTIONS.find(o => o.value === filters.tone)?.label}</p>
            </div>
          </div>
        </button>

        {/* Pacing Card */}
        <button
          onClick={() => setActiveSheet("pacing")}
          className={cn(
            "w-full flex items-center justify-between p-4 rounded-xl bg-card border transition-colors active:bg-card/80",
            isPacingModified ? "border-primary/50" : "border-border/50"
          )}
        >
          <div className="flex items-center gap-3">
            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-lg", isPacingModified ? "bg-primary/20" : "bg-muted")}>
              ⏱️
            </div>
            <div className="text-left">
              <p className="font-medium text-foreground">Pacing</p>
              <p className="text-sm text-muted-foreground">{PACING_OPTIONS.find(o => o.value === filters.pacing)?.label}</p>
            </div>
          </div>
        </button>
      </div>

      {/* Apply Button */}
      <div className="flex-shrink-0 p-4 border-t border-border bg-background" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
        <Button onClick={onToggle} className="w-full h-14 rounded-xl text-base font-medium">
          Apply Filters
        </Button>
      </div>

      {/* Mood Selection Sheet */}
      <Drawer open={activeSheet === "mood"} onOpenChange={(open) => !open && setActiveSheet(null)}>
        <DrawerContent className="bg-card border-t border-border max-h-[80vh]">
          <DrawerHeader className="text-center pb-2">
            <DrawerTitle className="flex items-center justify-center gap-2 text-lg">
              <span className="text-xl">😊</span> Mood
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-4 py-4 overflow-y-auto">
            <div className="space-y-2">
              {MOOD_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => { updateFilters({ mood: option.value }); setActiveSheet(null); }}
                  className={cn(
                    "w-full p-4 rounded-xl text-left font-medium transition-all active:scale-[0.98] flex items-center justify-between",
                    filters.mood === option.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  )}
                >
                  {option.label}
                  {filters.mood === option.value && <Check className="h-5 w-5" />}
                </button>
              ))}
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Tone Selection Sheet */}
      <Drawer open={activeSheet === "tone"} onOpenChange={(open) => !open && setActiveSheet(null)}>
        <DrawerContent className="bg-card border-t border-border max-h-[80vh]">
          <DrawerHeader className="text-center pb-2">
            <DrawerTitle className="flex items-center justify-center gap-2 text-lg">
              <span className="text-xl">🎭</span> Tone
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-4 py-4 overflow-y-auto">
            <div className="space-y-2">
              {TONE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => { updateFilters({ tone: option.value }); setActiveSheet(null); }}
                  className={cn(
                    "w-full p-4 rounded-xl text-left font-medium transition-all active:scale-[0.98] flex items-center justify-between",
                    filters.tone === option.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  )}
                >
                  {option.label}
                  {filters.tone === option.value && <Check className="h-5 w-5" />}
                </button>
              ))}
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Pacing Selection Sheet */}
      <Drawer open={activeSheet === "pacing"} onOpenChange={(open) => !open && setActiveSheet(null)}>
        <DrawerContent className="bg-card border-t border-border">
          <DrawerHeader className="text-center pb-2">
            <DrawerTitle className="flex items-center justify-center gap-2 text-lg">
              <span className="text-xl">⏱️</span> Pacing
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-4 py-4 space-y-2">
            {PACING_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => { updateFilters({ pacing: option.value }); setActiveSheet(null); }}
                className={cn(
                  "w-full p-4 rounded-xl text-left font-medium transition-all active:scale-[0.98] flex items-center justify-between",
                  filters.pacing === option.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                )}
              >
                {option.label}
                {filters.pacing === option.value && <Check className="h-5 w-5" />}
              </button>
            ))}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};
