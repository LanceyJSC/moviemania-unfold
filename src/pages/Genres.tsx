import { useNavigate } from "react-router-dom";
import { Search, Film, Tv, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { MobileHeader } from "@/components/MobileHeader";
import { DesktopHeader } from "@/components/DesktopHeader";
import { Navigation } from "@/components/Navigation";
import { MovieCard } from "@/components/MovieCard";
import { SEOHead } from "@/components/SEOHead";
import { tmdbService } from "@/lib/tmdb";

const MOVIE_GENRES = [
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
  { id: 10770, name: "TV Movie", emoji: "📺" },
  { id: 53, name: "Thriller", emoji: "⚡" },
  { id: 10752, name: "War", emoji: "⚔️" },
  { id: 37, name: "Western", emoji: "🤠" }
];

const TV_GENRES = [
  { id: 10759, name: "Action & Adventure", emoji: "⚔️" },
  { id: 16, name: "Animation", emoji: "🎨" },
  { id: 35, name: "Comedy", emoji: "😂" },
  { id: 80, name: "Crime", emoji: "🔍" },
  { id: 99, name: "Documentary", emoji: "📚" },
  { id: 18, name: "Drama", emoji: "🎭" },
  { id: 10751, name: "Family", emoji: "👨‍👩‍👧‍👦" },
  { id: 10762, name: "Kids", emoji: "🧸" },
  { id: 9648, name: "Mystery", emoji: "🔮" },
  { id: 10763, name: "News", emoji: "📰" },
  { id: 10764, name: "Reality", emoji: "🎪" },
  { id: 10765, name: "Sci-Fi & Fantasy", emoji: "🚀" },
  { id: 10766, name: "Soap", emoji: "💭" },
  { id: 10767, name: "Talk", emoji: "💬" },
  { id: 10768, name: "War & Politics", emoji: "🏛️" },
  { id: 37, name: "Western", emoji: "🤠" }
];

interface GenreContent {
  genreId: number;
  genreName: string;
  emoji: string;
  items: any[];
  mediaType: string;
}

export default function Genres() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"movies" | "tv">("movies");
  const [genreContents, setGenreContents] = useState<GenreContent[]>([]);
  const [loading, setLoading] = useState(true);

  const currentGenres = activeTab === "movies" ? MOVIE_GENRES : TV_GENRES;
  const filteredGenres = currentGenres.filter(genre =>
    genre.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Load content for each genre
  useEffect(() => {
    const loadGenreContent = async () => {
      setLoading(true);
      try {
        const genresToLoad = currentGenres.slice(0, 6); // Load first 6 genres
        const promises = genresToLoad.map(async (genre) => {
          const result = await tmdbService.discoverMovies({ genre: genre.id, page: 1 });
          return {
            genreId: genre.id,
            genreName: genre.name,
            emoji: genre.emoji,
            items: result.results.slice(0, 6),
            mediaType: activeTab
          };
        });
        const results = await Promise.all(promises);
        setGenreContents(results);
      } catch (error) {
        console.error("Failed to load genre content:", error);
      } finally {
        setLoading(false);
      }
    };

    loadGenreContent();
  }, [activeTab]);

  const handleGenreClick = (genreId: number) => {
    const searchParams = new URLSearchParams();
    searchParams.set("genre", genreId.toString());
    if (activeTab === "tv") {
      searchParams.set("type", "tv");
    }
    navigate(`/search?${searchParams.toString()}`);
  };

  return (
    <div className="min-h-screen bg-background pb-32 2xl:pb-12 overflow-y-auto">
      <SEOHead 
        title="Explore Genres - Action, Comedy, Horror, Sci-Fi & More | SceneBurn"
        description="Browse movies and TV shows by genre. Find the best action, comedy, horror, sci-fi, drama, and more on SceneBurn."
        url="/genres"
      />
      <DesktopHeader />
      <MobileHeader title="Browse Genres" />
      
      {/* Header Section - Compact on mobile */}
      <div className="max-w-7xl mx-auto px-4 pt-4 2xl:pt-6 pb-3">
        <h1 className="font-cinematic text-2xl 2xl:text-3xl text-foreground tracking-wide mb-1">
          EXPLORE BY GENRE
        </h1>
        <div className="w-12 h-0.5 bg-cinema-red mb-2"></div>
        <p className="text-muted-foreground text-sm">Discover movies and TV shows</p>
      </div>

      {/* Search and Tabs - Compact on mobile */}
      <div className="max-w-7xl mx-auto px-4 space-y-3 mb-4 2xl:mb-6">
        {/* Search bar */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search genres..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-card/60 border-border/50 focus:border-primary/50 h-10"
          />
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1.5">
          <Button
            variant={activeTab === "movies" ? "default" : "outline"}
            onClick={() => setActiveTab("movies")}
            size="sm"
            className="gap-1.5 h-9"
          >
            <Film className="h-3.5 w-3.5" />
            Movies
          </Button>
          <Button
            variant={activeTab === "tv" ? "default" : "outline"}
            onClick={() => setActiveTab("tv")}
            size="sm"
            className="gap-1.5 h-9"
          >
            <Tv className="h-3.5 w-3.5" />
            TV
          </Button>
        </div>

        {/* Genre Pills - Horizontal scroll on mobile */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 2xl:flex-wrap 2xl:overflow-visible 2xl:mx-0 2xl:px-0">
          {filteredGenres.map((genre) => (
            <button
              key={genre.id}
              onClick={() => handleGenreClick(genre.id)}
              className={cn(
                "flex-shrink-0 flex items-center gap-1 py-1.5 px-2.5 rounded-full text-xs 2xl:text-sm",
                "bg-card/80 border border-border/50",
                "hover:bg-card hover:border-primary/50",
                "transition-all duration-200 active:scale-95 touch-manipulation"
              )}
            >
              <span role="img" aria-label={genre.name}>{genre.emoji}</span>
              <span className="font-medium text-foreground">{genre.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Genre Content Sections */}
      <div className="max-w-7xl mx-auto px-4 space-y-6 2xl:space-y-10">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground text-sm">Loading genres...</div>
        ) : (
          genreContents.map((genreContent) => (
            <div key={genreContent.genreId} className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base 2xl:text-xl font-semibold text-foreground flex items-center gap-1.5">
                  <span>{genreContent.emoji}</span>
                  {genreContent.genreName}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleGenreClick(genreContent.genreId)}
                  className="text-primary hover:text-primary/80 gap-1 text-xs h-8"
                >
                  View All
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 2xl:gap-4">
                {genreContent.items.map((item) => (
                  <MovieCard 
                    key={item.id} 
                    movie={tmdbService.formatMovieForCard(item)}
                    variant="grid"
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
      
      <Navigation />
    </div>
  );
}