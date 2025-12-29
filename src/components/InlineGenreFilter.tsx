import { useState, useRef } from "react";
import { ChevronRight, Crown, Lock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

interface Genre {
  id: number;
  name: string;
  emoji: string;
}

const MOVIE_GENRES: Genre[] = [
  { id: 28, name: "Action", emoji: "💥" },
  { id: 12, name: "Adventure", emoji: "🗺️" },
  { id: 16, name: "Animation", emoji: "🎨" },
  { id: 35, name: "Comedy", emoji: "😂" },
  { id: 80, name: "Crime", emoji: "🔪" },
  { id: 99, name: "Documentary", emoji: "📹" },
  { id: 18, name: "Drama", emoji: "🎭" },
  { id: 10751, name: "Family", emoji: "👨‍👩‍👧" },
  { id: 14, name: "Fantasy", emoji: "🧙" },
  { id: 36, name: "History", emoji: "📜" },
  { id: 27, name: "Horror", emoji: "👻" },
  { id: 10402, name: "Music", emoji: "🎵" },
  { id: 9648, name: "Mystery", emoji: "🔍" },
  { id: 10749, name: "Romance", emoji: "💕" },
  { id: 878, name: "Sci-Fi", emoji: "🚀" },
  { id: 10770, name: "TV Movie", emoji: "📺" },
  { id: 53, name: "Thriller", emoji: "😰" },
  { id: 10752, name: "War", emoji: "⚔️" },
  { id: 37, name: "Western", emoji: "🤠" },
];

const TV_GENRES: Genre[] = [
  { id: 10759, name: "Action & Adventure", emoji: "💥" },
  { id: 16, name: "Animation", emoji: "🎨" },
  { id: 35, name: "Comedy", emoji: "😂" },
  { id: 80, name: "Crime", emoji: "🔪" },
  { id: 99, name: "Documentary", emoji: "📹" },
  { id: 18, name: "Drama", emoji: "🎭" },
  { id: 10751, name: "Family", emoji: "👨‍👩‍👧" },
  { id: 10762, name: "Kids", emoji: "🧒" },
  { id: 9648, name: "Mystery", emoji: "🔍" },
  { id: 10763, name: "News", emoji: "📰" },
  { id: 10764, name: "Reality", emoji: "📷" },
  { id: 10765, name: "Sci-Fi & Fantasy", emoji: "🚀" },
  { id: 10766, name: "Soap", emoji: "💔" },
  { id: 10767, name: "Talk", emoji: "🎙️" },
  { id: 10768, name: "War & Politics", emoji: "⚔️" },
  { id: 37, name: "Western", emoji: "🤠" },
];

interface InlineGenreFilterProps {
  selectedGenres: number[];
  onGenreChange: (genres: number[]) => void;
  mediaType: 'movie' | 'tv' | 'all';
  isProUser: boolean;
  onUpgradeClick?: () => void;
  initialExpanded?: boolean;
  showTitle?: boolean;
}

export const InlineGenreFilter = ({
  selectedGenres,
  onGenreChange,
  mediaType,
  isProUser,
  onUpgradeClick,
  initialExpanded = false,
  showTitle = true
}: InlineGenreFilterProps) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const genres = mediaType === 'tv' ? TV_GENRES : MOVIE_GENRES;

  const handleGenreClick = (genreId: number) => {
    if (!isProUser) {
      onUpgradeClick?.();
      return;
    }
    
    if (selectedGenres.includes(genreId)) {
      onGenreChange(selectedGenres.filter(id => id !== genreId));
    } else {
      onGenreChange([...selectedGenres, genreId]);
    }
  };

  const clearGenres = () => {
    onGenreChange([]);
  };

  // Pro locked state
  if (!isProUser) {
    return (
      <div className="space-y-2">
        {showTitle && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">Explore by Genre</h3>
              <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-[10px] px-1.5 py-0">
                <Crown className="w-2.5 h-2.5 mr-0.5" />
                PRO
              </Badge>
            </div>
          </div>
        )}
        
        <div className="relative">
          <div className="flex gap-1.5 overflow-hidden blur-sm opacity-40 pointer-events-none">
            {genres.slice(0, 8).map((genre) => (
              <div
                key={genre.id}
                className="flex-shrink-0 px-2.5 py-1.5 rounded-full bg-card/80 border border-border/50 flex items-center gap-1"
              >
                <span className="text-sm">{genre.emoji}</span>
                <span className="text-xs text-foreground">{genre.name}</span>
              </div>
            ))}
          </div>
          
          <div className="absolute inset-0 flex items-center justify-center">
            <Button
              onClick={onUpgradeClick}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg"
              size="sm"
            >
              <Lock className="w-3.5 h-3.5 mr-1.5" />
              Unlock Genre Filter
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {showTitle && (
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Explore by Genre</h3>
          <div className="flex items-center gap-1.5">
            {selectedGenres.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearGenres}
                className="text-xs text-muted-foreground hover:text-foreground h-6 px-2"
              >
                Clear ({selectedGenres.length})
              </Button>
            )}
            <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
              <DrawerTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-primary h-6 px-2"
                >
                  View All <ChevronRight className="w-3 h-3 ml-0.5" />
                </Button>
              </DrawerTrigger>
              <DrawerContent className="max-h-[85vh]">
                <DrawerHeader className="pb-2">
                  <DrawerTitle className="flex items-center justify-between">
                    <span>All Genres</span>
                    {selectedGenres.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearGenres}
                        className="text-xs text-muted-foreground"
                      >
                        Clear All
                      </Button>
                    )}
                  </DrawerTitle>
                </DrawerHeader>
                <div className="px-4 pb-8 grid grid-cols-2 gap-2 overflow-y-auto">
                  {genres.map((genre) => {
                    const isSelected = selectedGenres.includes(genre.id);
                    return (
                      <button
                        key={genre.id}
                        onClick={() => handleGenreClick(genre.id)}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all duration-200 text-left",
                          isSelected 
                            ? "bg-cinema-red text-white" 
                            : "bg-card/80 border border-border/50 hover:bg-card"
                        )}
                      >
                        <span className="text-lg">{genre.emoji}</span>
                        <span className="text-sm font-medium truncate">{genre.name}</span>
                      </button>
                    );
                  })}
                </div>
              </DrawerContent>
            </Drawer>
          </div>
        </div>
      )}
      
      {/* Horizontal scrolling genre pills */}
      <div 
        ref={scrollRef}
        className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {genres.slice(0, 10).map((genre) => {
          const isSelected = selectedGenres.includes(genre.id);
          return (
            <button
              key={genre.id}
              onClick={() => handleGenreClick(genre.id)}
              className={cn(
                "flex-shrink-0 px-2.5 py-1.5 rounded-full flex items-center gap-1 transition-all duration-200 touch-manipulation active:scale-95",
                isSelected 
                  ? "bg-cinema-red text-white shadow-sm" 
                  : "bg-card/80 border border-border/50 text-foreground hover:bg-card hover:border-border"
              )}
            >
              <span className="text-sm">{genre.emoji}</span>
              <span className="text-xs font-medium whitespace-nowrap">{genre.name}</span>
            </button>
          );
        })}
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="flex-shrink-0 px-2.5 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center gap-1 transition-all duration-200 touch-manipulation active:scale-95 hover:bg-primary/20"
        >
          <span className="text-xs font-medium">More</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
      
      {/* Selected genres pills */}
      {selectedGenres.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedGenres.map(genreId => {
            const genre = genres.find(g => g.id === genreId);
            if (!genre) return null;
            return (
              <Badge
                key={genreId}
                variant="secondary"
                className="bg-cinema-red/15 text-cinema-red border-cinema-red/30 cursor-pointer hover:bg-cinema-red/25 text-xs px-2 py-0.5"
                onClick={() => handleGenreClick(genreId)}
              >
                {genre.emoji} {genre.name}
                <X className="w-3 h-3 ml-1" />
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
};
