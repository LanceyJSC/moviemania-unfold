import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search as SearchIcon, Film, Tv, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MobileBrandHeader } from "@/components/MobileBrandHeader";
import { DesktopHeader } from "@/components/DesktopHeader";
import { Navigation } from "@/components/Navigation";
import { MovieCard } from "@/components/MovieCard";
import { TVShowCard } from "@/components/TVShowCard";
import { ProDiscoveryFilters } from "@/components/ProDiscoveryFilters";
import { ProUpgradeModal } from "@/components/ProUpgradeModal";
import { useSubscription } from "@/hooks/useSubscription";
import { useDebounce } from "@/hooks/useDebounce";
import { tmdbService } from "@/lib/tmdb";

const POPULAR_GENRES = [
  { id: 28, name: "Action", emoji: "💥" },
  { id: 35, name: "Comedy", emoji: "😂" },
  { id: 27, name: "Horror", emoji: "👻" },
  { id: 10749, name: "Romance", emoji: "💕" },
  { id: 878, name: "Sci-Fi", emoji: "🚀" },
  { id: 12, name: "Adventure", emoji: "🗺️" },
  { id: 18, name: "Drama", emoji: "🎭" },
  { id: 53, name: "Thriller", emoji: "⚡" }
];

export default function Search() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isProUser, loading: subscriptionLoading } = useSubscription();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"movies" | "tv">("movies");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showProModal, setShowProModal] = useState(false);
  
  const debouncedSearchTerm = useDebounce(searchTerm, 400);

  // Handle search
  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedSearchTerm.trim()) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        if (activeTab === "movies") {
          const results = await tmdbService.searchMovies(debouncedSearchTerm);
          setSearchResults(results.results || []);
        } else {
          const results = await tmdbService.searchTVShows(debouncedSearchTerm);
          setSearchResults(results.results || []);
        }
      } catch (error) {
        console.error("Search failed:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    performSearch();
  }, [debouncedSearchTerm, activeTab]);

  // Handle genre from URL params
  useEffect(() => {
    const genreId = searchParams.get("genre");
    if (genreId) {
      // If there's a genre param, load movies for that genre
      const loadGenreMovies = async () => {
        setIsSearching(true);
        try {
          const results = await tmdbService.discoverMovies({ genre: parseInt(genreId), page: 1 });
          setSearchResults(results.results || []);
        } catch (error) {
          console.error("Failed to load genre movies:", error);
        } finally {
          setIsSearching(false);
        }
      };
      loadGenreMovies();
    }
  }, [searchParams]);

  const handleGenreClick = (genreId: number) => {
    navigate(`/search?genre=${genreId}`);
  };

  const handleViewAllGenres = () => {
    navigate("/genres");
  };

  const renderMediaCard = (item: any) => {
    if (activeTab === "movies") {
      return <MovieCard key={item.id} movie={tmdbService.formatMovieForCard(item)} />;
    }
    return <TVShowCard key={item.id} tvShow={tmdbService.formatTVShowForCard(item)} />;
  };

  return (
    <div className="min-h-screen bg-background pb-32 2xl:pb-12 overflow-y-auto">
      <DesktopHeader />
      <MobileBrandHeader />

      <div className="max-w-7xl mx-auto px-4 pt-6">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="font-cinematic text-3xl text-foreground tracking-wide mb-2">
            SEARCH
          </h1>
          <div className="w-16 h-0.5 bg-cinema-red mb-4"></div>
          <p className="text-muted-foreground">Find movies and TV shows</p>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-2xl mb-6">
          <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search for movies, TV shows..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 h-12 text-base bg-card/60 border-border/50 focus:border-primary/50 rounded-xl"
          />
        </div>

        {/* Media Type Tabs - Show when searching */}
        {searchTerm && (
          <div className="flex gap-2 mb-6">
            <Button
              variant={activeTab === "movies" ? "default" : "outline"}
              onClick={() => setActiveTab("movies")}
              size="sm"
              className="gap-2"
            >
              <Film className="h-4 w-4" />
              Movies
            </Button>
            <Button
              variant={activeTab === "tv" ? "default" : "outline"}
              onClick={() => setActiveTab("tv")}
              size="sm"
              className="gap-2"
            >
              <Tv className="h-4 w-4" />
              TV Shows
            </Button>
          </div>
        )}

        {/* Search Results */}
        {searchTerm && (
          <div className="mb-10">
            {isSearching ? (
              <div className="text-center py-12 text-muted-foreground">
                Searching...
              </div>
            ) : searchResults.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {searchResults.map(renderMediaCard)}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                No results found for "{searchTerm}"
              </div>
            )}
          </div>
        )}

        {/* Popular Genres Section - Show when not searching */}
        {!searchTerm && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-cinematic text-xl text-foreground tracking-wide">
                  POPULAR GENRES
                </h2>
                <div className="w-12 h-0.5 bg-cinema-red mt-2"></div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleViewAllGenres}
                className="text-primary hover:text-primary/80 gap-1"
              >
                View All
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {POPULAR_GENRES.map((genre) => (
                <button
                  key={genre.id}
                  onClick={() => handleGenreClick(genre.id)}
                  className={cn(
                    "flex items-center gap-1.5 py-1.5 px-3 rounded-full text-sm",
                    "bg-card/80 border border-border/50",
                    "hover:bg-card hover:border-primary/50",
                    "transition-all duration-200 active:scale-95"
                  )}
                >
                  <span role="img" aria-label={genre.name}>{genre.emoji}</span>
                  <span className="font-medium text-foreground">{genre.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Pro Discovery Filters - Only for Pro Users */}
        {!subscriptionLoading && isProUser && !searchTerm && (
          <ProDiscoveryFilters />
        )}
      </div>

      <Navigation />
      
      <ProUpgradeModal
        isOpen={showProModal}
        onClose={() => setShowProModal(false)}
        feature="Advanced Discovery"
      />
    </div>
  );
}