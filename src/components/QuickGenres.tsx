
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface QuickGenresProps {
  mediaType?: 'movie' | 'tv';
}

export const QuickGenres = ({ mediaType = 'movie' }: QuickGenresProps) => {
  const navigate = useNavigate();

  // Same 6 genres, but with correct IDs for each media type
  const movieGenres = [
    { id: 28, name: "Action", color: "bg-red-500/20 text-red-400", emoji: "💥" },
    { id: 35, name: "Comedy", color: "bg-yellow-500/20 text-yellow-400", emoji: "😂" },
    { id: 27, name: "Horror", color: "bg-purple-500/20 text-purple-400", emoji: "👻" },
    { id: 10749, name: "Romance", color: "bg-pink-500/20 text-pink-400", emoji: "💕" },
    { id: 878, name: "Sci-Fi", color: "bg-blue-500/20 text-blue-400", emoji: "🚀" },
    { id: 12, name: "Adventure", color: "bg-green-500/20 text-green-400", emoji: "🗺️" }
  ];

  // TV uses different genre IDs from TMDB
  const tvGenres = [
    { id: 10759, name: "Action", color: "bg-red-500/20 text-red-400", emoji: "💥" },
    { id: 35, name: "Comedy", color: "bg-yellow-500/20 text-yellow-400", emoji: "😂" },
    { id: 9648, name: "Mystery", color: "bg-purple-500/20 text-purple-400", emoji: "🔮" },
    { id: 18, name: "Drama", color: "bg-pink-500/20 text-pink-400", emoji: "🎭" },
    { id: 10765, name: "Sci-Fi", color: "bg-blue-500/20 text-blue-400", emoji: "🚀" },
    { id: 10759, name: "Adventure", color: "bg-green-500/20 text-green-400", emoji: "🗺️" }
  ];

  const genres = mediaType === 'tv' ? tvGenres : movieGenres;

  const handleGenreClick = (genreId: number) => {
    navigate(`/search?genre=${genreId}&type=${mediaType}`);
  };

  const handleViewAllClick = () => {
    navigate(`/genres?type=${mediaType}`);
  };

  return (
    <div className="space-y-4">
      <div className="px-4 flex items-center justify-between">
        <div>
          <h2 className="font-cinematic text-xl tracking-wide text-foreground">
            Explore by Genre
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Find your perfect {mediaType === 'tv' ? 'show' : 'movie'}
          </p>
        </div>
        <Button
          variant="ghost"
          onClick={handleViewAllClick}
          className="text-primary hover:text-primary/80 text-sm font-medium"
        >
          View All
        </Button>
      </div>
      
      <div className="px-4">
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {genres.map((genre, index) => (
            <Button
              key={`${genre.id}-${index}`}
              variant="outline"
              onClick={() => handleGenreClick(genre.id)}
              className={cn(
                "h-auto py-3 px-2 rounded-2xl",
                "bg-card/60 backdrop-blur-sm border-border/50",
                "hover:bg-card/80 hover:border-primary/50",
                "transition-all duration-200 active:scale-95",
                "touch-target focus-ring min-h-[80px] min-w-[80px]"
              )}
            >
              <div className="flex flex-col items-center space-y-2">
                <div className={cn(
                  "rounded-full w-10 h-10 flex items-center justify-center",
                  genre.color,
                  "transition-transform duration-200 group-hover:scale-110"
                )}>
                  <span className="text-lg" role="img" aria-label={genre.name}>
                    {genre.emoji}
                  </span>
                </div>
                <span className="text-xs font-medium text-foreground text-center leading-tight">
                  {genre.name}
                </span>
              </div>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};
