import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Crown, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  
  const genres = mediaType === 'tv' ? TV_GENRES : MOVIE_GENRES;
  const displayedGenres = isExpanded ? genres : genres.slice(0, 6);

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
      <div className="space-y-3">
        {showTitle && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground">Explore by Genre</h3>
              <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-xs">
                <Crown className="w-3 h-3 mr-1" />
                PRO
              </Badge>
            </div>
          </div>
        )}
        
        <div className="relative">
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 blur-sm opacity-50 pointer-events-none">
            {genres.slice(0, 6).map((genre) => (
              <Button
                key={genre.id}
                variant="outline"
                size="sm"
                className="h-auto py-2 px-3 rounded-xl bg-card/60 border-border/50"
              >
                <span className="mr-1">{genre.emoji}</span>
                <span className="text-xs truncate">{genre.name}</span>
              </Button>
            ))}
          </div>
          
          <div className="absolute inset-0 flex items-center justify-center">
            <Button
              onClick={onUpgradeClick}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
              size="sm"
            >
              <Lock className="w-4 h-4 mr-2" />
              Unlock Genre Filter
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {showTitle && (
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Explore by Genre</h3>
          <div className="flex items-center gap-2">
            {selectedGenres.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearGenres}
                className="text-xs text-muted-foreground hover:text-foreground h-7 px-2"
              >
                Clear ({selectedGenres.length})
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs text-primary h-7 px-2"
            >
              {isExpanded ? (
                <>Show Less <ChevronUp className="w-3 h-3 ml-1" /></>
              ) : (
                <>View All <ChevronDown className="w-3 h-3 ml-1" /></>
              )}
            </Button>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        {displayedGenres.map((genre) => {
          const isSelected = selectedGenres.includes(genre.id);
          return (
            <Button
              key={genre.id}
              variant={isSelected ? "default" : "outline"}
              size="sm"
              onClick={() => handleGenreClick(genre.id)}
              className={cn(
                "h-auto py-2 px-3 rounded-xl transition-all duration-200 active:scale-95",
                isSelected 
                  ? "bg-cinema-red text-white border-cinema-red shadow-md" 
                  : "bg-card/60 border-border/50 hover:bg-card/80 hover:border-primary/50"
              )}
            >
              <span className="mr-1">{genre.emoji}</span>
              <span className="text-xs truncate">{genre.name}</span>
            </Button>
          );
        })}
      </div>
      
      {/* Selected genres pills */}
      {selectedGenres.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedGenres.map(genreId => {
            const genre = genres.find(g => g.id === genreId);
            if (!genre) return null;
            return (
              <Badge
                key={genreId}
                variant="secondary"
                className="bg-cinema-red/20 text-cinema-red border-cinema-red/30 cursor-pointer hover:bg-cinema-red/30"
                onClick={() => handleGenreClick(genreId)}
              >
                {genre.emoji} {genre.name} ×
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
};
