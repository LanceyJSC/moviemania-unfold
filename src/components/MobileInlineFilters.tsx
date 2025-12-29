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
  mood: string[];
  tone: string[];
  pacing: string;
  era: string;
  language: string;
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
    mood: [],
    tone: [],
    pacing: "any",
    era: "any",
    language: "any"
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
    mood: string[];
    tone: string[];
    pacing: string;
    era: string;
    language: string;
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
      era: proFilters.era,
      language: proFilters.language,
    };
    setFilters(updated);
  };

  const activeFilterCount = 
    filters.mood.length + 
    filters.tone.length + 
    (filters.pacing !== "any" ? 1 : 0) + 
    (filters.era !== "any" ? 1 : 0) + 
    (filters.language !== "any" ? 1 : 0) +
    (filters.yearRange[0] > 1900 || filters.yearRange[1] < new Date().getFullYear() ? 1 : 0) +
    (filters.ratingRange[0] > 0 || filters.ratingRange[1] < 10 ? 1 : 0) +
    (filters.runtimeRange[0] > 0 || filters.runtimeRange[1] < 300 ? 1 : 0);

  const isYearModified = filters.yearRange[0] > 1900 || filters.yearRange[1] < new Date().getFullYear();
  const isRatingModified = filters.ratingRange[0] > 0 || filters.ratingRange[1] < 10;
  const isRuntimeModified = filters.runtimeRange[0] > 0 || filters.runtimeRange[1] < 300;

  return (
    <>
      <div className="space-y-5">
        {/* Explore by Genre */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-cinematic text-base tracking-wide text-foreground uppercase">
              Explore by Genre
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleViewAllGenres}
              className="text-primary hover:text-primary/80 font-medium text-sm h-8 px-2"
            >
              View All
            </Button>
          </div>
          
          <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
            <div className="flex gap-2.5 pb-1">
              {GENRES.map((genre) => (
                <button
                  key={genre.id}
                  onClick={() => handleGenreClick(genre.id)}
                  className="flex items-center gap-1.5 py-2.5 px-4 rounded-full whitespace-nowrap bg-card border border-border/60 hover:bg-card/80 hover:border-primary/50 active:scale-95 transition-all min-h-[44px] text-sm font-medium"
                >
                  <span className="text-base">{genre.emoji}</span>
                  <span className="text-foreground">{genre.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Filter Cards */}
        <div className="space-y-3">
          {/* Year Range Card */}
          <button
            onClick={() => openSliderSheet("year")}
            className={cn(
              "w-full flex items-center justify-between p-4 rounded-xl bg-card border transition-colors active:bg-card/80",
              isYearModified ? "border-primary/50" : "border-border/50"
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", isYearModified ? "bg-primary/20" : "bg-muted")}>
                <Calendar className={cn("h-5 w-5", isYearModified ? "text-primary" : "text-muted-foreground")} />
              </div>
              <div className="text-left">
                <p className="font-medium text-foreground">Year Range</p>
                <p className="text-sm text-muted-foreground">{filters.yearRange[0]} – {filters.yearRange[1]}</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </button>

          {/* Rating Range Card */}
          <button
            onClick={() => openSliderSheet("rating")}
            className={cn(
              "w-full flex items-center justify-between p-4 rounded-xl bg-card border transition-colors active:bg-card/80",
              isRatingModified ? "border-primary/50" : "border-border/50"
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", isRatingModified ? "bg-primary/20" : "bg-muted")}>
                <Star className={cn("h-5 w-5", isRatingModified ? "text-primary" : "text-muted-foreground")} />
              </div>
              <div className="text-left">
                <p className="font-medium text-foreground">Rating</p>
                <p className="text-sm text-muted-foreground">{filters.ratingRange[0].toFixed(1)} – {filters.ratingRange[1].toFixed(1)}</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </button>

          {/* Runtime Range Card */}
          <button
            onClick={() => openSliderSheet("runtime")}
            className={cn(
              "w-full flex items-center justify-between p-4 rounded-xl bg-card border transition-colors active:bg-card/80",
              isRuntimeModified ? "border-primary/50" : "border-border/50"
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", isRuntimeModified ? "bg-primary/20" : "bg-muted")}>
                <Clock className={cn("h-5 w-5", isRuntimeModified ? "text-primary" : "text-muted-foreground")} />
              </div>
              <div className="text-left">
                <p className="font-medium text-foreground">Runtime</p>
                <p className="text-sm text-muted-foreground">{filters.runtimeRange[0]} – {filters.runtimeRange[1]} min</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </button>

          {/* Pro Filters Card */}
          <button
            onClick={() => setShowAdvancedFilters(true)}
            className="w-full flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 active:from-amber-500/15 active:to-orange-500/15 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Crown className="h-5 w-5 text-amber-500" />
              </div>
              <div className="text-left">
                <p className="font-medium text-foreground">More Filters</p>
                <p className="text-sm text-muted-foreground">Mood • Tone • Pacing • Era</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="text-xs bg-amber-500/20 text-amber-500 border-0">
                  {activeFilterCount}
                </Badge>
              )}
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </button>

          {/* Discover Button */}
          <Button 
            onClick={handleDiscover}
            className="w-full h-14 rounded-xl text-base font-medium mt-4"
            size="lg"
          >
            <Search className="h-5 w-5 mr-2" />
            Discover Movies
          </Button>
        </div>
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
