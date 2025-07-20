
import { useNavigate } from "react-router-dom";
import { Zap, Heart, Sword, Laugh, Ghost, Rocket } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const QuickGenres = () => {
  const navigate = useNavigate();

  const genres = [
    { id: 28, name: "Action", icon: Zap, color: "bg-red-500/20 text-red-400", emoji: "💥" },
    { id: 35, name: "Comedy", icon: Laugh, color: "bg-yellow-500/20 text-yellow-400", emoji: "😂" },
    { id: 27, name: "Horror", icon: Ghost, color: "bg-purple-500/20 text-purple-400", emoji: "👻" },
    { id: 10749, name: "Romance", icon: Heart, color: "bg-pink-500/20 text-pink-400", emoji: "💕" },
    { id: 878, name: "Sci-Fi", icon: Rocket, color: "bg-blue-500/20 text-blue-400", emoji: "🚀" },
    { id: 12, name: "Adventure", icon: Sword, color: "bg-green-500/20 text-green-400", emoji: "🗺️" }
  ];

  const handleGenreClick = (genreId: number) => {
    navigate(`/search?genre=${genreId}`);
  };

  return (
    <div className="space-y-4">
      <div className="px-4">
        <h2 className="font-cinematic text-xl tracking-wide text-foreground">
          Explore by Genre
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Find your perfect movie
        </p>
      </div>
      
      {/* Mobile-first horizontal scroll */}
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex space-x-3 px-4 pb-2">
          {genres.map((genre) => {
            const Icon = genre.icon;
            return (
              <Button
                key={genre.id}
                variant="outline"
                onClick={() => handleGenreClick(genre.id)}
                className={cn(
                  "flex-shrink-0 h-auto py-4 px-4 rounded-2xl",
                  "bg-card/60 backdrop-blur-sm border-border/50",
                  "hover:bg-card/80 hover:border-primary/50",
                  "transition-all duration-200 active:scale-95",
                  "touch-target focus-ring min-w-[80px]"
                )}
              >
                <div className="flex flex-col items-center space-y-2">
                  <div className={cn(
                    "rounded-full w-12 h-12 flex items-center justify-center",
                    genre.color,
                    "transition-transform duration-200 group-hover:scale-110"
                  )}>
                    <span className="text-xl" role="img" aria-label={genre.name}>
                      {genre.emoji}
                    </span>
                  </div>
                  <span className="text-xs font-medium text-foreground text-center whitespace-nowrap">
                    {genre.name}
                  </span>
                </div>
              </Button>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" className="h-2" />
      </ScrollArea>
    </div>
  );
};
