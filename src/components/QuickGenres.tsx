import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MovieGrid } from "@/components/MovieGrid";
import { cn } from "@/lib/utils";

interface Genre {
  id: number;
  name: string;
  emoji: string;
  color: string;
}

const genres: Genre[] = [
  { id: 28, name: "Action", emoji: "💥", color: "bg-red-500/20 text-red-400" },
  { id: 35, name: "Comedy", emoji: "😂", color: "bg-yellow-500/20 text-yellow-400" },
  { id: 27, name: "Horror", emoji: "👻", color: "bg-purple-500/20 text-purple-400" },
  { id: 10749, name: "Romance", emoji: "💕", color: "bg-pink-500/20 text-pink-400" },
  { id: 878, name: "Sci-Fi", emoji: "🚀", color: "bg-blue-500/20 text-blue-400" },
  { id: 12, name: "Adventure", emoji: "🗺️", color: "bg-green-500/20 text-green-400" },
  { id: 18, name: "Drama", emoji: "🎭", color: "bg-amber-500/20 text-amber-400" },
  { id: 53, name: "Thriller", emoji: "😰", color: "bg-cyan-500/20 text-cyan-400" },
  { id: 16, name: "Animation", emoji: "🎨", color: "bg-orange-500/20 text-orange-400" },
  { id: 14, name: "Fantasy", emoji: "🧙", color: "bg-indigo-500/20 text-indigo-400" },
  { id: 80, name: "Crime", emoji: "🔪", color: "bg-slate-500/20 text-slate-400" },
  { id: 9648, name: "Mystery", emoji: "🔍", color: "bg-violet-500/20 text-violet-400" },
];

export const QuickGenres = () => {
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);
  
  const displayedGenres = showAll ? genres : genres.slice(0, 6);

  const handleGenreClick = (genreId: number) => {
    if (selectedGenre === genreId) {
      setSelectedGenre(null); // Deselect if clicking same genre
    } else {
      setSelectedGenre(genreId);
    }
  };

  const selectedGenreName = genres.find(g => g.id === selectedGenre)?.name;

  return (
    <div className="space-y-4">
      <div className="px-4 flex items-center justify-between">
        <div>
          <h2 className="font-cinematic text-xl tracking-wide text-foreground">
            Explore by Genre
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {selectedGenre ? `Showing ${selectedGenreName} movies` : 'Find your perfect movie'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedGenre && (
            <Button
              variant="ghost"
              onClick={() => setSelectedGenre(null)}
              className="text-xs text-muted-foreground hover:text-foreground h-8 px-2"
            >
              Clear
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={() => setShowAll(!showAll)}
            className="text-primary hover:text-primary/80 text-sm font-medium h-8"
          >
            {showAll ? (
              <>Less <ChevronUp className="w-4 h-4 ml-1" /></>
            ) : (
              <>View All <ChevronDown className="w-4 h-4 ml-1" /></>
            )}
          </Button>
        </div>
      </div>
      
      {/* Genre grid - stays on page */}
      <div className="px-4">
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {displayedGenres.map((genre) => {
            const isSelected = selectedGenre === genre.id;
            return (
              <Button
                key={genre.id}
                variant="outline"
                onClick={() => handleGenreClick(genre.id)}
                className={cn(
                  "h-auto py-3 px-2 rounded-2xl",
                  "transition-all duration-200 active:scale-95",
                  "touch-target focus-ring min-h-[80px] min-w-[80px]",
                  isSelected 
                    ? "bg-cinema-red border-cinema-red text-white shadow-lg" 
                    : "bg-card/60 backdrop-blur-sm border-border/50 hover:bg-card/80 hover:border-primary/50"
                )}
              >
                <div className="flex flex-col items-center space-y-2">
                  <div className={cn(
                    "rounded-full w-10 h-10 flex items-center justify-center",
                    isSelected ? "bg-white/20" : genre.color,
                    "transition-transform duration-200"
                  )}>
                    <span className="text-lg" role="img" aria-label={genre.name}>
                      {genre.emoji}
                    </span>
                  </div>
                  <span className="text-xs font-medium text-center leading-tight">
                    {genre.name}
                  </span>
                </div>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Results appear inline when genre is selected */}
      {selectedGenre && (
        <div className="px-4 pt-4">
          <MovieGrid 
            title={`${selectedGenreName} Movies`}
            category="all"
            genre={selectedGenre}
          />
        </div>
      )}
    </div>
  );
};
