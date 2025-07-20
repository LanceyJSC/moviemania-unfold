import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useState } from "react";

const MOVIE_GENRES = [
  { id: 28, name: "Action", emoji: "💥", color: "bg-red-500/20 text-red-400" },
  { id: 12, name: "Adventure", emoji: "🗺️", color: "bg-green-500/20 text-green-400" },
  { id: 16, name: "Animation", emoji: "🎨", color: "bg-purple-500/20 text-purple-400" },
  { id: 35, name: "Comedy", emoji: "😂", color: "bg-yellow-500/20 text-yellow-400" },
  { id: 80, name: "Crime", emoji: "🔍", color: "bg-gray-500/20 text-gray-400" },
  { id: 99, name: "Documentary", emoji: "📚", color: "bg-blue-500/20 text-blue-400" },
  { id: 18, name: "Drama", emoji: "🎭", color: "bg-indigo-500/20 text-indigo-400" },
  { id: 10751, name: "Family", emoji: "👨‍👩‍👧‍👦", color: "bg-pink-500/20 text-pink-400" },
  { id: 14, name: "Fantasy", emoji: "🧙", color: "bg-violet-500/20 text-violet-400" },
  { id: 36, name: "History", emoji: "🏛️", color: "bg-amber-500/20 text-amber-400" },
  { id: 27, name: "Horror", emoji: "👻", color: "bg-red-700/20 text-red-300" },
  { id: 10402, name: "Music", emoji: "🎵", color: "bg-cyan-500/20 text-cyan-400" },
  { id: 9648, name: "Mystery", emoji: "🔮", color: "bg-emerald-500/20 text-emerald-400" },
  { id: 10749, name: "Romance", emoji: "💕", color: "bg-rose-500/20 text-rose-400" },
  { id: 878, name: "Sci-Fi", emoji: "🚀", color: "bg-blue-600/20 text-blue-300" },
  { id: 10770, name: "TV Movie", emoji: "📺", color: "bg-slate-500/20 text-slate-400" },
  { id: 53, name: "Thriller", emoji: "⚡", color: "bg-orange-500/20 text-orange-400" },
  { id: 10752, name: "War", emoji: "⚔️", color: "bg-red-800/20 text-red-200" },
  { id: 37, name: "Western", emoji: "🤠", color: "bg-yellow-700/20 text-yellow-300" }
];

const TV_GENRES = [
  { id: 10759, name: "Action & Adventure", emoji: "⚔️", color: "bg-red-500/20 text-red-400" },
  { id: 16, name: "Animation", emoji: "🎨", color: "bg-purple-500/20 text-purple-400" },
  { id: 35, name: "Comedy", emoji: "😂", color: "bg-yellow-500/20 text-yellow-400" },
  { id: 80, name: "Crime", emoji: "🔍", color: "bg-gray-500/20 text-gray-400" },
  { id: 99, name: "Documentary", emoji: "📚", color: "bg-blue-500/20 text-blue-400" },
  { id: 18, name: "Drama", emoji: "🎭", color: "bg-indigo-500/20 text-indigo-400" },
  { id: 10751, name: "Family", emoji: "👨‍👩‍👧‍👦", color: "bg-pink-500/20 text-pink-400" },
  { id: 10762, name: "Kids", emoji: "🧸", color: "bg-green-500/20 text-green-400" },
  { id: 9648, name: "Mystery", emoji: "🔮", color: "bg-emerald-500/20 text-emerald-400" },
  { id: 10763, name: "News", emoji: "📰", color: "bg-blue-600/20 text-blue-300" },
  { id: 10764, name: "Reality", emoji: "🎪", color: "bg-orange-500/20 text-orange-400" },
  { id: 10765, name: "Sci-Fi & Fantasy", emoji: "🚀", color: "bg-violet-500/20 text-violet-400" },
  { id: 10766, name: "Soap", emoji: "💭", color: "bg-rose-500/20 text-rose-400" },
  { id: 10767, name: "Talk", emoji: "💬", color: "bg-cyan-500/20 text-cyan-400" },
  { id: 10768, name: "War & Politics", emoji: "🏛️", color: "bg-red-700/20 text-red-300" },
  { id: 37, name: "Western", emoji: "🤠", color: "bg-yellow-700/20 text-yellow-300" }
];

export default function Genres() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"movies" | "tv">("movies");

  const currentGenres = activeTab === "movies" ? MOVIE_GENRES : TV_GENRES;
  const filteredGenres = currentGenres.filter(genre =>
    genre.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleGenreClick = (genreId: number) => {
    const searchParams = new URLSearchParams();
    searchParams.set("genre", genreId.toString());
    if (activeTab === "tv") {
      searchParams.set("type", "tv");
    }
    navigate(`/search?${searchParams.toString()}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* iOS-style header with safe area */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between p-4 pt-[calc(1rem+env(safe-area-inset-top))]">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="touch-target focus-ring"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-cinematic text-xl tracking-wide text-foreground">
            Browse Genres
          </h1>
          <div className="w-10" /> {/* Spacer for center alignment */}
        </div>

        {/* Search bar */}
        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search genres..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card/60 border-border/50 focus:border-primary/50 h-12"
            />
          </div>
        </div>

        {/* Tab switcher */}
        <div className="px-4 pb-4">
          <div className="flex bg-card/40 rounded-xl p-1">
            <Button
              variant={activeTab === "movies" ? "default" : "ghost"}
              onClick={() => setActiveTab("movies")}
              className={cn(
                "flex-1 h-10 rounded-lg transition-all duration-200",
                activeTab === "movies" 
                  ? "bg-primary text-primary-foreground shadow-md" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Movies
            </Button>
            <Button
              variant={activeTab === "tv" ? "default" : "ghost"}
              onClick={() => setActiveTab("tv")}
              className={cn(
                "flex-1 h-10 rounded-lg transition-all duration-200",
                activeTab === "tv" 
                  ? "bg-primary text-primary-foreground shadow-md" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              TV Shows
            </Button>
          </div>
        </div>
      </div>

      {/* Genre grid */}
      <div className="p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <div className="grid grid-cols-2 gap-3 iphone-65:gap-4">
          {filteredGenres.map((genre) => (
            <Button
              key={genre.id}
              variant="outline"
              onClick={() => handleGenreClick(genre.id)}
              className={cn(
                "h-auto p-4 rounded-2xl border-border/50",
                "bg-card/60 backdrop-blur-sm hover:bg-card/80",
                "hover:border-primary/50 transition-all duration-200",
                "active:scale-95 touch-target focus-ring"
              )}
            >
              <div className="flex flex-col items-center space-y-3 w-full">
                <div className={cn(
                  "rounded-full w-16 h-16 flex items-center justify-center",
                  genre.color,
                  "transition-transform duration-200 group-hover:scale-110"
                )}>
                  <span className="text-3xl" role="img" aria-label={genre.name}>
                    {genre.emoji}
                  </span>
                </div>
                <span className="text-sm font-medium text-foreground text-center leading-tight">
                  {genre.name}
                </span>
              </div>
            </Button>
          ))}
        </div>

        {filteredGenres.length === 0 && searchQuery && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No genres found matching "{searchQuery}"</p>
          </div>
        )}
      </div>
    </div>
  );
}