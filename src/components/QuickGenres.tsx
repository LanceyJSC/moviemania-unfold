import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MovieGrid } from "@/components/MovieGrid";
import { cn } from "@/lib/utils";

interface Genre {
  id: number;
  name: string;
  emoji: string;
}

// Same genres as InlineGenreFilter for consistency
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

export const QuickGenres = () => {
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const displayedGenres = isExpanded ? MOVIE_GENRES : MOVIE_GENRES.slice(0, 6);

  const handleGenreClick = (genreId: number) => {
    if (selectedGenres.includes(genreId)) {
      setSelectedGenres(selectedGenres.filter(id => id !== genreId));
    } else {
      setSelectedGenres([...selectedGenres, genreId]);
    }
  };

  const clearGenres = () => {
    setSelectedGenres([]);
  };

  const selectedGenreNames = selectedGenres
    .map(id => MOVIE_GENRES.find(g => g.id === id)?.name)
    .filter(Boolean)
    .join(", ");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-cinematic text-xl tracking-wide text-foreground">
            Explore by Genre
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {selectedGenres.length > 0 
              ? `Showing ${selectedGenreNames}` 
              : 'Find your perfect movie'}
          </p>
        </div>
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
      
      {/* Genre grid - same style as InlineGenreFilter */}
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
            const genre = MOVIE_GENRES.find(g => g.id === genreId);
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

      {/* Results appear inline when genre is selected */}
      {selectedGenres.length > 0 && (
        <div className="pt-4">
          <MovieGrid 
            title="Filtered Movies"
            category="all"
            genres={selectedGenres}
          />
        </div>
      )}
    </div>
  );
};
