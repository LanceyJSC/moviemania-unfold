import { useState } from "react";
import { Sliders, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { MovieCard } from "@/components/MovieCard";
import { tmdbService } from "@/lib/tmdb";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MOOD_OPTIONS = [
  { value: "feel-good", label: "Feel-Good", emoji: "😊" },
  { value: "intense", label: "Intense", emoji: "😰" },
  { value: "thought-provoking", label: "Thought-Provoking", emoji: "🤔" },
  { value: "heartwarming", label: "Heartwarming", emoji: "🥰" },
  { value: "dark", label: "Dark", emoji: "🖤" },
  { value: "uplifting", label: "Uplifting", emoji: "✨" }
];

const TONE_OPTIONS = [
  { value: "lighthearted", label: "Lighthearted", emoji: "🎈" },
  { value: "serious", label: "Serious", emoji: "😐" },
  { value: "satirical", label: "Satirical", emoji: "😏" },
  { value: "gritty", label: "Gritty", emoji: "🔥" },
  { value: "whimsical", label: "Whimsical", emoji: "🦋" },
  { value: "melancholic", label: "Melancholic", emoji: "🌧️" }
];

const PACING_OPTIONS = [
  { value: "slow-burn", label: "Slow Burn" },
  { value: "moderate", label: "Moderate" },
  { value: "fast-paced", label: "Fast-Paced" }
];

const ERA_OPTIONS = [
  { value: "classic", label: "Classic (Pre-1970)" },
  { value: "vintage", label: "Vintage (1970-1990)" },
  { value: "modern", label: "Modern (1990-2010)" },
  { value: "contemporary", label: "Contemporary (2010+)" }
];

const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" },
  { value: "hi", label: "Hindi" }
];

const ALL_GENRES = [
  { id: 28, name: "Action", emoji: "💥" },
  { id: 12, name: "Adventure", emoji: "🗺️" },
  { id: 16, name: "Animation", emoji: "🎨" },
  { id: 35, name: "Comedy", emoji: "😂" },
  { id: 80, name: "Crime", emoji: "🔍" },
  { id: 99, name: "Documentary", emoji: "📚" },
  { id: 18, name: "Drama", emoji: "🎭" },
  { id: 10751, name: "Family", emoji: "👨‍👩‍👧‍👦" },
  { id: 14, name: "Fantasy", emoji: "🧙" },
  { id: 36, name: "History", emoji: "🏛️" },
  { id: 27, name: "Horror", emoji: "👻" },
  { id: 10402, name: "Music", emoji: "🎵" },
  { id: 9648, name: "Mystery", emoji: "🔮" },
  { id: 10749, name: "Romance", emoji: "💕" },
  { id: 878, name: "Sci-Fi", emoji: "🚀" },
  { id: 53, name: "Thriller", emoji: "⚡" },
  { id: 10752, name: "War", emoji: "⚔️" },
  { id: 37, name: "Western", emoji: "🤠" }
];

export function ProDiscoveryFilters() {
  const isMobile = useIsMobile();
  
  // Filter states
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [yearRange, setYearRange] = useState<[number, number]>([1970, 2025]);
  const [ratingRange, setRatingRange] = useState<[number, number]>([0, 10]);
  const [runtimeRange, setRuntimeRange] = useState<[number, number]>([0, 240]);
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [selectedTones, setSelectedTones] = useState<string[]>([]);
  const [pacing, setPacing] = useState<string>("");
  const [era, setEra] = useState<string>("");
  const [language, setLanguage] = useState<string>("");
  
  // UI states
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveryResults, setDiscoveryResults] = useState<any[]>([]);
  
  // Mobile drawer states
  const [yearDrawerOpen, setYearDrawerOpen] = useState(false);
  const [ratingDrawerOpen, setRatingDrawerOpen] = useState(false);
  const [runtimeDrawerOpen, setRuntimeDrawerOpen] = useState(false);
  const [tempYearRange, setTempYearRange] = useState<[number, number]>([1970, 2025]);
  const [tempRatingRange, setTempRatingRange] = useState<[number, number]>([0, 10]);
  const [tempRuntimeRange, setTempRuntimeRange] = useState<[number, number]>([0, 240]);

  const toggleGenre = (genreId: number) => {
    setSelectedGenres(prev => 
      prev.includes(genreId) 
        ? prev.filter(id => id !== genreId)
        : [...prev, genreId]
    );
  };

  const toggleMood = (mood: string) => {
    setSelectedMoods(prev =>
      prev.includes(mood)
        ? prev.filter(m => m !== mood)
        : [...prev, mood]
    );
  };

  const toggleTone = (tone: string) => {
    setSelectedTones(prev =>
      prev.includes(tone)
        ? prev.filter(t => t !== tone)
        : [...prev, tone]
    );
  };

  const handleDiscover = async () => {
    setIsDiscovering(true);
    try {
      // Build discovery params
      const params: any = { page: 1 };
      
      if (selectedGenres.length > 0) {
        params.genre = selectedGenres[0]; // TMDB only supports one genre at a time in this endpoint
      }
      if (yearRange[0] !== 1970 || yearRange[1] !== 2025) {
        params.year = { min: yearRange[0], max: yearRange[1] };
      }
      if (ratingRange[0] !== 0 || ratingRange[1] !== 10) {
        params.rating = { min: ratingRange[0], max: ratingRange[1] };
      }
      if (runtimeRange[0] !== 0 || runtimeRange[1] !== 240) {
        params.runtime = { min: runtimeRange[0], max: runtimeRange[1] };
      }
      if (language) {
        params.language = language;
      }

      const results = await tmdbService.discoverMovies(params);
      setDiscoveryResults(results.results || []);
    } catch (error) {
      console.error("Discovery failed:", error);
    } finally {
      setIsDiscovering(false);
    }
  };

  const hasActiveFilters = selectedGenres.length > 0 || 
    yearRange[0] !== 1970 || yearRange[1] !== 2025 ||
    ratingRange[0] !== 0 || ratingRange[1] !== 10 ||
    runtimeRange[0] !== 0 || runtimeRange[1] !== 240 ||
    selectedMoods.length > 0 || selectedTones.length > 0 ||
    pacing || era || language;

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center gap-2">
        <Sliders className="h-5 w-5 text-cinema-red" />
        <h2 className="font-cinematic text-xl text-foreground tracking-wide">
          ADVANCED DISCOVERY
        </h2>
        <Badge variant="secondary" className="bg-cinema-red/20 text-cinema-red border-0 text-xs">
          PRO
        </Badge>
      </div>
      <div className="w-12 h-0.5 bg-cinema-red"></div>

      {/* All Genres */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Genres
        </h3>
        <div className="flex flex-wrap gap-2">
          {ALL_GENRES.map((genre) => (
            <button
              key={genre.id}
              onClick={() => toggleGenre(genre.id)}
              className={cn(
                "flex items-center gap-1.5 py-1.5 px-3 rounded-full text-sm",
                "border transition-all duration-200 active:scale-95",
                selectedGenres.includes(genre.id)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card/80 border-border/50 hover:bg-card hover:border-primary/50"
              )}
            >
              <span role="img" aria-label={genre.name}>{genre.emoji}</span>
              <span className="font-medium">{genre.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Range Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Year Range */}
        {isMobile ? (
          <button
            onClick={() => {
              setTempYearRange(yearRange);
              setYearDrawerOpen(true);
            }}
            className="rounded-2xl bg-card border border-border/40 p-4 text-left"
          >
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Year</h3>
            <p className="text-foreground font-medium">{yearRange[0]} - {yearRange[1]}</p>
          </button>
        ) : (
          <div className="rounded-2xl bg-card border border-border/40 p-4 space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">Year</h3>
            <Slider
              value={yearRange}
              onValueChange={(value) => setYearRange(value as [number, number])}
              min={1900}
              max={2025}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{yearRange[0]}</span>
              <span>{yearRange[1]}</span>
            </div>
          </div>
        )}

        {/* Rating Range */}
        {isMobile ? (
          <button
            onClick={() => {
              setTempRatingRange(ratingRange);
              setRatingDrawerOpen(true);
            }}
            className="rounded-2xl bg-card border border-border/40 p-4 text-left"
          >
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Rating</h3>
            <p className="text-foreground font-medium">{ratingRange[0]} - {ratingRange[1]}</p>
          </button>
        ) : (
          <div className="rounded-2xl bg-card border border-border/40 p-4 space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">Rating</h3>
            <Slider
              value={ratingRange}
              onValueChange={(value) => setRatingRange(value as [number, number])}
              min={0}
              max={10}
              step={0.5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{ratingRange[0]}</span>
              <span>{ratingRange[1]}</span>
            </div>
          </div>
        )}

        {/* Runtime Range */}
        {isMobile ? (
          <button
            onClick={() => {
              setTempRuntimeRange(runtimeRange);
              setRuntimeDrawerOpen(true);
            }}
            className="rounded-2xl bg-card border border-border/40 p-4 text-left"
          >
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Runtime</h3>
            <p className="text-foreground font-medium">{runtimeRange[0]} - {runtimeRange[1]} min</p>
          </button>
        ) : (
          <div className="rounded-2xl bg-card border border-border/40 p-4 space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">Runtime</h3>
            <Slider
              value={runtimeRange}
              onValueChange={(value) => setRuntimeRange(value as [number, number])}
              min={0}
              max={240}
              step={10}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{runtimeRange[0]} min</span>
              <span>{runtimeRange[1]} min</span>
            </div>
          </div>
        )}
      </div>

      {/* Advanced Filters Toggle */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
      >
        {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        <span className="text-sm font-medium">
          {showAdvanced ? "Hide" : "Show"} Advanced Options
        </span>
      </button>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
          {/* Mood */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Mood
            </h3>
            <div className="flex flex-wrap gap-2">
              {MOOD_OPTIONS.map((mood) => (
                <button
                  key={mood.value}
                  onClick={() => toggleMood(mood.value)}
                  className={cn(
                    "flex items-center gap-1.5 py-1.5 px-3 rounded-full text-sm",
                    "border transition-all duration-200 active:scale-95",
                    selectedMoods.includes(mood.value)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card/80 border-border/50 hover:bg-card hover:border-primary/50"
                  )}
                >
                  <span>{mood.emoji}</span>
                  <span className="font-medium">{mood.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tone */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Tone
            </h3>
            <div className="flex flex-wrap gap-2">
              {TONE_OPTIONS.map((tone) => (
                <button
                  key={tone.value}
                  onClick={() => toggleTone(tone.value)}
                  className={cn(
                    "flex items-center gap-1.5 py-1.5 px-3 rounded-full text-sm",
                    "border transition-all duration-200 active:scale-95",
                    selectedTones.includes(tone.value)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card/80 border-border/50 hover:bg-card hover:border-primary/50"
                  )}
                >
                  <span>{tone.emoji}</span>
                  <span className="font-medium">{tone.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Dropdowns Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Pacing */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Pacing
              </h3>
              <Select value={pacing} onValueChange={setPacing}>
                <SelectTrigger className="bg-card border-border/50">
                  <SelectValue placeholder="Any pacing" />
                </SelectTrigger>
                <SelectContent>
                  {PACING_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Era */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Era
              </h3>
              <Select value={era} onValueChange={setEra}>
                <SelectTrigger className="bg-card border-border/50">
                  <SelectValue placeholder="Any era" />
                </SelectTrigger>
                <SelectContent>
                  {ERA_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Language */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Language
              </h3>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="bg-card border-border/50">
                  <SelectValue placeholder="Any language" />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* Discover Button */}
      <Button
        onClick={handleDiscover}
        disabled={isDiscovering}
        className="w-full md:w-auto bg-cinema-red hover:bg-cinema-red/90 text-white h-12 px-8 rounded-xl"
      >
        {isDiscovering ? "Discovering..." : "Discover Movies"}
      </Button>

      {/* Discovery Results */}
      {discoveryResults.length > 0 && (
        <div className="space-y-4 pt-4">
          <h3 className="font-cinematic text-xl text-foreground tracking-wide">
            DISCOVERY RESULTS
          </h3>
          <div className="w-12 h-0.5 bg-cinema-red"></div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {discoveryResults.map((movie) => (
              <MovieCard key={movie.id} movie={tmdbService.formatMovieForCard(movie)} />
            ))}
          </div>
        </div>
      )}

      {/* Mobile Drawers */}
      <Drawer open={yearDrawerOpen} onOpenChange={setYearDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Year Range</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 py-6 space-y-6">
            <Slider
              value={tempYearRange}
              onValueChange={(value) => setTempYearRange(value as [number, number])}
              min={1900}
              max={2025}
              step={1}
            />
            <div className="flex justify-between text-lg font-medium">
              <span>{tempYearRange[0]}</span>
              <span>{tempYearRange[1]}</span>
            </div>
          </div>
          <DrawerFooter>
            <Button
              onClick={() => {
                setYearRange(tempYearRange);
                setYearDrawerOpen(false);
              }}
              className="bg-cinema-red hover:bg-cinema-red/90"
            >
              Apply
            </Button>
            <DrawerClose asChild>
              <Button variant="outline">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <Drawer open={ratingDrawerOpen} onOpenChange={setRatingDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Rating Range</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 py-6 space-y-6">
            <Slider
              value={tempRatingRange}
              onValueChange={(value) => setTempRatingRange(value as [number, number])}
              min={0}
              max={10}
              step={0.5}
            />
            <div className="flex justify-between text-lg font-medium">
              <span>{tempRatingRange[0]}</span>
              <span>{tempRatingRange[1]}</span>
            </div>
          </div>
          <DrawerFooter>
            <Button
              onClick={() => {
                setRatingRange(tempRatingRange);
                setRatingDrawerOpen(false);
              }}
              className="bg-cinema-red hover:bg-cinema-red/90"
            >
              Apply
            </Button>
            <DrawerClose asChild>
              <Button variant="outline">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <Drawer open={runtimeDrawerOpen} onOpenChange={setRuntimeDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Runtime Range</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 py-6 space-y-6">
            <Slider
              value={tempRuntimeRange}
              onValueChange={(value) => setTempRuntimeRange(value as [number, number])}
              min={0}
              max={240}
              step={10}
            />
            <div className="flex justify-between text-lg font-medium">
              <span>{tempRuntimeRange[0]} min</span>
              <span>{tempRuntimeRange[1]} min</span>
            </div>
          </div>
          <DrawerFooter>
            <Button
              onClick={() => {
                setRuntimeRange(tempRuntimeRange);
                setRuntimeDrawerOpen(false);
              }}
              className="bg-cinema-red hover:bg-cinema-red/90"
            >
              Apply
            </Button>
            <DrawerClose asChild>
              <Button variant="outline">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}