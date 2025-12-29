import { useState } from "react";
import { X, ChevronRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
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

type SheetType = "mood" | "tone" | "pacing" | "era" | "language" | null;

export const MobileAdvancedFilters = ({ onFiltersChange, isOpen, onToggle }: MobileAdvancedFiltersProps) => {
  const [activeSheet, setActiveSheet] = useState<SheetType>(null);
  const [tempMoods, setTempMoods] = useState<string[]>([]);
  const [tempTones, setTempTones] = useState<string[]>([]);
  
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
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFiltersChange(updatedFilters);
  };

  const openSheet = (type: SheetType) => {
    if (type === "mood") setTempMoods([...filters.mood]);
    if (type === "tone") setTempTones([...filters.tone]);
    setActiveSheet(type);
  };

  const applyMoods = () => {
    updateFilters({ mood: tempMoods });
    setActiveSheet(null);
  };

  const applyTones = () => {
    updateFilters({ tone: tempTones });
    setActiveSheet(null);
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

  const getMoodSummary = () => {
    if (filters.mood.length === 0) return "Any Mood";
    if (filters.mood.length === 1) return filters.mood[0];
    return `${filters.mood.length} selected`;
  };

  const getToneSummary = () => {
    if (filters.tone.length === 0) return "Any Tone";
    if (filters.tone.length === 1) return filters.tone[0];
    return `${filters.tone.length} selected`;
  };

  const isMoodModified = filters.mood.length > 0;
  const isToneModified = filters.tone.length > 0;
  const isPacingModified = filters.pacing !== "any";
  const isEraModified = filters.era !== "any";
  const isLanguageModified = filters.language !== "any";

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

      {/* Filter Cards - Matching MobileInlineFilters style */}
      <div className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-3" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {/* Mood Card */}
        <button
          onClick={() => openSheet("mood")}
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
              <p className="text-sm text-muted-foreground">{getMoodSummary()}</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </button>

        {/* Tone Card */}
        <button
          onClick={() => openSheet("tone")}
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
              <p className="text-sm text-muted-foreground">{getToneSummary()}</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </button>

        {/* Pacing Card */}
        <button
          onClick={() => openSheet("pacing")}
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
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </button>

        {/* Era Card */}
        <button
          onClick={() => openSheet("era")}
          className={cn(
            "w-full flex items-center justify-between p-4 rounded-xl bg-card border transition-colors active:bg-card/80",
            isEraModified ? "border-primary/50" : "border-border/50"
          )}
        >
          <div className="flex items-center gap-3">
            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-lg", isEraModified ? "bg-primary/20" : "bg-muted")}>
              📅
            </div>
            <div className="text-left">
              <p className="font-medium text-foreground">Era</p>
              <p className="text-sm text-muted-foreground">{ERA_OPTIONS.find(o => o.value === filters.era)?.label}</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </button>

        {/* Language Card */}
        <button
          onClick={() => openSheet("language")}
          className={cn(
            "w-full flex items-center justify-between p-4 rounded-xl bg-card border transition-colors active:bg-card/80",
            isLanguageModified ? "border-primary/50" : "border-border/50"
          )}
        >
          <div className="flex items-center gap-3">
            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-lg", isLanguageModified ? "bg-primary/20" : "bg-muted")}>
              🌍
            </div>
            <div className="text-left">
              <p className="font-medium text-foreground">Language</p>
              <p className="text-sm text-muted-foreground">{LANGUAGE_OPTIONS.find(o => o.value === filters.language)?.label}</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
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
              {MOODS.map((mood) => (
                <button
                  key={mood}
                  onClick={() => setTempMoods(prev => prev.includes(mood) ? prev.filter(m => m !== mood) : [...prev, mood])}
                  className={cn(
                    "w-full p-4 rounded-xl text-left font-medium transition-all active:scale-[0.98] flex items-center justify-between",
                    tempMoods.includes(mood)
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  )}
                >
                  {mood}
                  {tempMoods.includes(mood) && <Check className="h-5 w-5" />}
                </button>
              ))}
            </div>
          </div>
          <DrawerFooter className="flex-row gap-3 pt-0">
            <DrawerClose asChild>
              <Button variant="outline" className="flex-1 h-12">Cancel</Button>
            </DrawerClose>
            <Button onClick={applyMoods} className="flex-1 h-12">
              <Check className="h-4 w-4 mr-2" />Apply
            </Button>
          </DrawerFooter>
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
              {TONES.map((tone) => (
                <button
                  key={tone}
                  onClick={() => setTempTones(prev => prev.includes(tone) ? prev.filter(t => t !== tone) : [...prev, tone])}
                  className={cn(
                    "w-full p-4 rounded-xl text-left font-medium transition-all active:scale-[0.98] flex items-center justify-between",
                    tempTones.includes(tone)
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  )}
                >
                  {tone}
                  {tempTones.includes(tone) && <Check className="h-5 w-5" />}
                </button>
              ))}
            </div>
          </div>
          <DrawerFooter className="flex-row gap-3 pt-0">
            <DrawerClose asChild>
              <Button variant="outline" className="flex-1 h-12">Cancel</Button>
            </DrawerClose>
            <Button onClick={applyTones} className="flex-1 h-12">
              <Check className="h-4 w-4 mr-2" />Apply
            </Button>
          </DrawerFooter>
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

      {/* Era Selection Sheet */}
      <Drawer open={activeSheet === "era"} onOpenChange={(open) => !open && setActiveSheet(null)}>
        <DrawerContent className="bg-card border-t border-border">
          <DrawerHeader className="text-center pb-2">
            <DrawerTitle className="flex items-center justify-center gap-2 text-lg">
              <span className="text-xl">📅</span> Era
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-4 py-4 space-y-2">
            {ERA_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => { updateFilters({ era: option.value }); setActiveSheet(null); }}
                className={cn(
                  "w-full p-4 rounded-xl text-left font-medium transition-all active:scale-[0.98] flex items-center justify-between",
                  filters.era === option.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                )}
              >
                {option.label}
                {filters.era === option.value && <Check className="h-5 w-5" />}
              </button>
            ))}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Language Selection Sheet */}
      <Drawer open={activeSheet === "language"} onOpenChange={(open) => !open && setActiveSheet(null)}>
        <DrawerContent className="bg-card border-t border-border max-h-[80vh]">
          <DrawerHeader className="text-center pb-2">
            <DrawerTitle className="flex items-center justify-center gap-2 text-lg">
              <span className="text-xl">🌍</span> Language
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-4 py-4 space-y-2 overflow-y-auto">
            {LANGUAGE_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => { updateFilters({ language: option.value }); setActiveSheet(null); }}
                className={cn(
                  "w-full p-4 rounded-xl text-left font-medium transition-all active:scale-[0.98] flex items-center justify-between",
                  filters.language === option.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                )}
              >
                {option.label}
                {filters.language === option.value && <Check className="h-5 w-5" />}
              </button>
            ))}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};