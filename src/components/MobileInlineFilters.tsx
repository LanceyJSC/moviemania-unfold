import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Star, Clock, Crown, ChevronRight, Check, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { MobileAdvancedFilters } from "./MobileAdvancedFilters";
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

interface MobileInlineFiltersProps {
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

type SliderType = "year" | "rating" | "runtime" | null;

// This component is ONLY rendered for Pro users - no internal Pro checks needed
export const MobileInlineFilters = ({ onFiltersChange }: MobileInlineFiltersProps) => {
  const navigate = useNavigate();
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [activeSlider, setActiveSlider] = useState<SliderType>(null);
  
  const [tempYearRange, setTempYearRange] = useState<[number, number]>([1900, new Date().getFullYear()]);
  const [tempRatingRange, setTempRatingRange] = useState<[number, number]>([0, 10]);
  const [tempRuntimeRange, setTempRuntimeRange] = useState<[number, number]>([0, 300]);
  
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

  // Store filters locally without triggering search immediately
  const updateFiltersLocally = (newFilters: Partial<FilterState>) => {
    const updated = { ...filters, ...newFilters };
    setFilters(updated);
  };

  // Trigger the actual search
  const handleDiscover = () => {
    onFiltersChange(filters);
  };

  const handleGenreClick = (genreId: number) => {
    navigate(`/search?genre=${genreId}`);
  };

  const handleViewAllGenres = () => {
    navigate("/genres");
  };

  const openSliderSheet = (type: SliderType) => {
    if (type === "year") setTempYearRange(filters.yearRange);
    if (type === "rating") setTempRatingRange(filters.ratingRange);
    if (type === "runtime") setTempRuntimeRange(filters.runtimeRange);
    setActiveSlider(type);
  };

  const applySliderValue = () => {
    if (activeSlider === "year") {
      updateFiltersLocally({ yearRange: tempYearRange });
    } else if (activeSlider === "rating") {
      updateFiltersLocally({ ratingRange: tempRatingRange });
    } else if (activeSlider === "runtime") {
      updateFiltersLocally({ runtimeRange: tempRuntimeRange });
    }
    setActiveSlider(null);
  };

  const handleProFiltersChange = (proFilters: {
    genres: string[];
    yearRange: [number, number];
    ratingRange: [number, number];
    runtimeRange: [number, number];
    sortBy: string;
    mood: string;
    tone: string;
    pacing: string;
  }) => {
    const updated: FilterState = {
      ...filters,
      yearRange: proFilters.yearRange,
      ratingRange: proFilters.ratingRange,
      runtimeRange: proFilters.runtimeRange,
      sortBy: proFilters.sortBy,
      mood: proFilters.mood,
      tone: proFilters.tone,
      pacing: proFilters.pacing,
    };
    setFilters(updated);
  };

  const activeFilterCount = 
    (filters.mood !== "any" ? 1 : 0) + 
    (filters.tone !== "any" ? 1 : 0) + 
    (filters.pacing !== "any" ? 1 : 0) + 
    (filters.yearRange[0] > 1900 || filters.yearRange[1] < new Date().getFullYear() ? 1 : 0) +
    (filters.ratingRange[0] > 0 || filters.ratingRange[1] < 10 ? 1 : 0) +
    (filters.runtimeRange[0] > 0 || filters.runtimeRange[1] < 300 ? 1 : 0);

  const isYearModified = filters.yearRange[0] > 1900 || filters.yearRange[1] < new Date().getFullYear();
  const isRatingModified = filters.ratingRange[0] > 0 || filters.ratingRange[1] < 10;
  const isRuntimeModified = filters.runtimeRange[0] > 0 || filters.runtimeRange[1] < 300;

  return (
    <>
      <div className="space-y-6">
        {/* Explore by Genre - Premium card design */}
        <div className="rounded-2xl bg-gradient-to-br from-card via-card to-muted/30 border border-border/40 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground text-base">
              Explore by Genre
            </h3>
            <Button
              variant="link"
              size="sm"
              onClick={handleViewAllGenres}
              className="text-primary hover:text-primary/80 font-medium text-sm h-auto p-0"
            >
              View All →
            </Button>
          </div>
          
          <div className="grid grid-cols-4 gap-2">
            {GENRES.map((genre) => (
              <button
                key={genre.id}
                onClick={() => handleGenreClick(genre.id)}
                className="group flex flex-col items-center justify-center gap-1 py-2.5 px-1.5 rounded-xl bg-muted/50 hover:bg-primary/10 border border-transparent hover:border-primary/30 active:scale-95 transition-all"
              >
                <span className="text-lg group-hover:scale-110 transition-transform">{genre.emoji}</span>
                <span className="text-foreground/80 text-[10px] font-medium text-center leading-tight">{genre.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Filters Section */}
        <div className="rounded-2xl bg-gradient-to-br from-card via-card to-muted/30 border border-border/40 p-4 shadow-sm space-y-3">
          <h3 className="font-semibold text-foreground text-base mb-3">
            Discovery Filters
          </h3>

          {/* Year Range */}
          <button
            onClick={() => openSliderSheet("year")}
            className={cn(
              "w-full flex items-center justify-between p-3.5 rounded-xl bg-muted/40 border transition-all active:scale-[0.98]",
              isYearModified ? "border-primary/40 bg-primary/5" : "border-transparent hover:border-border/60"
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-9 h-9 rounded-lg flex items-center justify-center",
                isYearModified ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
              )}>
                <Calendar className="h-4 w-4" />
              </div>
              <div className="text-left">
                <p className="font-medium text-foreground text-sm">Year</p>
                <p className="text-xs text-muted-foreground">{filters.yearRange[0]} – {filters.yearRange[1]}</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>

          {/* Rating Range */}
          <button
            onClick={() => openSliderSheet("rating")}
            className={cn(
              "w-full flex items-center justify-between p-3.5 rounded-xl bg-muted/40 border transition-all active:scale-[0.98]",
              isRatingModified ? "border-primary/40 bg-primary/5" : "border-transparent hover:border-border/60"
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-9 h-9 rounded-lg flex items-center justify-center",
                isRatingModified ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
              )}>
                <Star className="h-4 w-4" />
              </div>
              <div className="text-left">
                <p className="font-medium text-foreground text-sm">Rating</p>
                <p className="text-xs text-muted-foreground">{filters.ratingRange[0].toFixed(1)} – {filters.ratingRange[1].toFixed(1)}</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>

          {/* Runtime Range */}
          <button
            onClick={() => openSliderSheet("runtime")}
            className={cn(
              "w-full flex items-center justify-between p-3.5 rounded-xl bg-muted/40 border transition-all active:scale-[0.98]",
              isRuntimeModified ? "border-primary/40 bg-primary/5" : "border-transparent hover:border-border/60"
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-9 h-9 rounded-lg flex items-center justify-center",
                isRuntimeModified ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
              )}>
                <Clock className="h-4 w-4" />
              </div>
              <div className="text-left">
                <p className="font-medium text-foreground text-sm">Runtime</p>
                <p className="text-xs text-muted-foreground">{filters.runtimeRange[0]} – {filters.runtimeRange[1]} min</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>

          {/* More Filters (Mood, Tone, etc.) */}
          <button
            onClick={() => setShowAdvancedFilters(true)}
            className={cn(
              "w-full flex items-center justify-between p-3.5 rounded-xl bg-muted/40 border transition-all active:scale-[0.98]",
              activeFilterCount > 0 ? "border-primary/40 bg-primary/5" : "border-transparent hover:border-border/60"
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-9 h-9 rounded-lg flex items-center justify-center text-base",
                activeFilterCount > 0 ? "bg-primary/20" : "bg-muted"
              )}>
                ✨
              </div>
              <div className="text-left">
                <p className="font-medium text-foreground text-sm">More Options</p>
                <p className="text-xs text-muted-foreground">Mood, Tone, Pacing</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {activeFilterCount > 0 && (
                <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {activeFilterCount}
                </span>
              )}
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </button>
        </div>

        {/* Discover Button */}
        <Button 
          onClick={handleDiscover}
          className="w-full h-12 rounded-xl text-base font-semibold shadow-lg shadow-primary/20"
          size="lg"
        >
          <Search className="h-4 w-4 mr-2" />
          Discover
        </Button>
      </div>

      {/* Year Range Bottom Sheet */}
      <Drawer open={activeSlider === "year"} onOpenChange={(open) => !open && setActiveSlider(null)}>
        <DrawerContent className="bg-card border-t border-border">
          <DrawerHeader className="text-center pb-2">
            <DrawerTitle className="flex items-center justify-center gap-2 text-lg">
              <Calendar className="h-5 w-5 text-primary" />
              Year Range
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-6 py-4 space-y-6">
            <div className="flex justify-center gap-4 text-center">
              <div className="bg-muted/50 rounded-xl px-6 py-3">
                <p className="text-xs text-muted-foreground uppercase">From</p>
                <p className="text-2xl font-bold text-foreground">{tempYearRange[0]}</p>
              </div>
              <div className="flex items-center"><span className="text-muted-foreground">—</span></div>
              <div className="bg-muted/50 rounded-xl px-6 py-3">
                <p className="text-xs text-muted-foreground uppercase">To</p>
                <p className="text-2xl font-bold text-foreground">{tempYearRange[1]}</p>
              </div>
            </div>
            <div className="px-2 py-4">
              <Slider
                value={tempYearRange}
                onValueChange={(value) => setTempYearRange(value as [number, number])}
                min={1900}
                max={new Date().getFullYear()}
                step={1}
                thumbSize="large"
                className="w-full"
              />
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {[
                { label: "All Time", range: [1900, new Date().getFullYear()] as [number, number] },
                { label: "2020s", range: [2020, new Date().getFullYear()] as [number, number] },
                { label: "2010s", range: [2010, 2019] as [number, number] },
                { label: "2000s", range: [2000, 2009] as [number, number] },
              ].map((preset) => (
                <Button
                  key={preset.label}
                  variant="outline"
                  size="sm"
                  onClick={() => setTempYearRange(preset.range)}
                  className={cn(
                    "rounded-full h-9 px-4",
                    tempYearRange[0] === preset.range[0] && tempYearRange[1] === preset.range[1]
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border/60"
                  )}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>
          <DrawerFooter className="flex-row gap-3 pt-0">
            <DrawerClose asChild>
              <Button variant="outline" className="flex-1 h-12">Cancel</Button>
            </DrawerClose>
            <Button onClick={applySliderValue} className="flex-1 h-12">
              <Check className="h-4 w-4 mr-2" />Apply
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Rating Range Bottom Sheet */}
      <Drawer open={activeSlider === "rating"} onOpenChange={(open) => !open && setActiveSlider(null)}>
        <DrawerContent className="bg-card border-t border-border">
          <DrawerHeader className="text-center pb-2">
            <DrawerTitle className="flex items-center justify-center gap-2 text-lg">
              <Star className="h-5 w-5 text-primary" />
              Rating Range
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-6 py-4 space-y-6">
            <div className="flex justify-center gap-4 text-center">
              <div className="bg-muted/50 rounded-xl px-6 py-3">
                <p className="text-xs text-muted-foreground uppercase">Min</p>
                <p className="text-2xl font-bold text-foreground">{tempRatingRange[0].toFixed(1)}</p>
              </div>
              <div className="flex items-center"><span className="text-muted-foreground">—</span></div>
              <div className="bg-muted/50 rounded-xl px-6 py-3">
                <p className="text-xs text-muted-foreground uppercase">Max</p>
                <p className="text-2xl font-bold text-foreground">{tempRatingRange[1].toFixed(1)}</p>
              </div>
            </div>
            <div className="px-2 py-4">
              <Slider
                value={tempRatingRange}
                onValueChange={(value) => setTempRatingRange(value as [number, number])}
                min={0}
                max={10}
                step={0.5}
                thumbSize="large"
                className="w-full"
              />
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {[
                { label: "Any", range: [0, 10] as [number, number] },
                { label: "7+", range: [7, 10] as [number, number] },
                { label: "8+", range: [8, 10] as [number, number] },
                { label: "9+", range: [9, 10] as [number, number] },
              ].map((preset) => (
                <Button
                  key={preset.label}
                  variant="outline"
                  size="sm"
                  onClick={() => setTempRatingRange(preset.range)}
                  className={cn(
                    "rounded-full h-9 px-4",
                    tempRatingRange[0] === preset.range[0] && tempRatingRange[1] === preset.range[1]
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border/60"
                  )}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>
          <DrawerFooter className="flex-row gap-3 pt-0">
            <DrawerClose asChild>
              <Button variant="outline" className="flex-1 h-12">Cancel</Button>
            </DrawerClose>
            <Button onClick={applySliderValue} className="flex-1 h-12">
              <Check className="h-4 w-4 mr-2" />Apply
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Runtime Range Bottom Sheet */}
      <Drawer open={activeSlider === "runtime"} onOpenChange={(open) => !open && setActiveSlider(null)}>
        <DrawerContent className="bg-card border-t border-border">
          <DrawerHeader className="text-center pb-2">
            <DrawerTitle className="flex items-center justify-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-primary" />
              Runtime
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-6 py-4 space-y-6">
            <div className="flex justify-center gap-4 text-center">
              <div className="bg-muted/50 rounded-xl px-6 py-3">
                <p className="text-xs text-muted-foreground uppercase">Min</p>
                <p className="text-2xl font-bold text-foreground">{tempRuntimeRange[0]} min</p>
              </div>
              <div className="flex items-center"><span className="text-muted-foreground">—</span></div>
              <div className="bg-muted/50 rounded-xl px-6 py-3">
                <p className="text-xs text-muted-foreground uppercase">Max</p>
                <p className="text-2xl font-bold text-foreground">{tempRuntimeRange[1]} min</p>
              </div>
            </div>
            <div className="px-2 py-4">
              <Slider
                value={tempRuntimeRange}
                onValueChange={(value) => setTempRuntimeRange(value as [number, number])}
                min={0}
                max={300}
                step={15}
                thumbSize="large"
                className="w-full"
              />
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {[
                { label: "Any", range: [0, 300] as [number, number] },
                { label: "< 90 min", range: [0, 90] as [number, number] },
                { label: "90-120 min", range: [90, 120] as [number, number] },
                { label: "2+ hours", range: [120, 300] as [number, number] },
              ].map((preset) => (
                <Button
                  key={preset.label}
                  variant="outline"
                  size="sm"
                  onClick={() => setTempRuntimeRange(preset.range)}
                  className={cn(
                    "rounded-full h-9 px-4",
                    tempRuntimeRange[0] === preset.range[0] && tempRuntimeRange[1] === preset.range[1]
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border/60"
                  )}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>
          <DrawerFooter className="flex-row gap-3 pt-0">
            <DrawerClose asChild>
              <Button variant="outline" className="flex-1 h-12">Cancel</Button>
            </DrawerClose>
            <Button onClick={applySliderValue} className="flex-1 h-12">
              <Check className="h-4 w-4 mr-2" />Apply
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Advanced Filters Modal */}
      <MobileAdvancedFilters
        isOpen={showAdvancedFilters}
        onToggle={() => setShowAdvancedFilters(false)}
        onFiltersChange={handleProFiltersChange}
      />
    </>
  );
};
