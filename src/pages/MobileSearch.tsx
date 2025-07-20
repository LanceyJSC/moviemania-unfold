import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Search as SearchIcon, Filter, X, TrendingUp, Film, Tv, ArrowRight, Shuffle, Star, Clock, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MovieCard } from "@/components/MovieCard";
import { TVShowCard } from "@/components/TVShowCard";
import { IOSTabBar } from "@/components/IOSTabBar";
import { tmdbService } from "@/lib/tmdb";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";

const Search = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const genreParam = searchParams.get('genre');
  
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [trendingTVShows, setTrendingTVShows] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'movies' | 'tv'>('all');
  const [isFocused, setIsFocused] = useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Load trending content for default display
  useEffect(() => {
    const loadTrendingContent = async () => {
      try {
        const [moviesResult, tvResult] = await Promise.all([
          tmdbService.getTrendingMovies(undefined, true),
          tmdbService.getTrendingTVShows(undefined, true)
        ]);
        setTrendingMovies(moviesResult.results.slice(0, 12));
        setTrendingTVShows(tvResult.results.slice(0, 12));
      } catch (error) {
        console.error("Failed to load trending content:", error);
      }
    };

    loadTrendingContent();
  }, []);

  // Handle text-based search
  useEffect(() => {
    const searchContent = async () => {
      if (!debouncedSearchTerm) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const results = await tmdbService.searchMulti(debouncedSearchTerm);
        setSearchResults(results.results.slice(0, 20));
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setIsSearching(false);
      }
    };

    searchContent();
  }, [debouncedSearchTerm]);

  // Filter results based on active tab
  const filteredResults = searchResults.filter(item => {
    if (activeTab === 'movies') return item.media_type === 'movie';
    if (activeTab === 'tv') return item.media_type === 'tv';
    return true;
  });

  const renderMovieCard = (movie: any) => (
    <MovieCard
      key={`movie-${movie.id}`}
      movie={{
        id: movie.id,
        title: movie.title,
        poster: movie.poster_path,
        year: movie.release_date ? new Date(movie.release_date).getFullYear().toString() : "",
        rating: movie.vote_average ? movie.vote_average.toFixed(1) : "0"
      }}
    />
  );

  const renderTVCard = (show: any) => (
    <TVShowCard
      key={`tv-${show.id}`}
      tvShow={{
        id: show.id,
        title: show.name,
        poster: show.poster_path,
        year: show.first_air_date ? new Date(show.first_air_date).getFullYear().toString() : "",
        rating: show.vote_average ? show.vote_average.toFixed(1) : "0"
      }}
    />
  );

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* iOS-style header with safe area */}
      <div 
        className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border/50"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="px-4 py-4 space-y-4">
          {/* iOS-style search bar */}
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search movies and TV shows..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className={cn(
                "pl-10 pr-4 h-12 rounded-2xl bg-muted/50 border-0",
                "focus:bg-background focus:ring-2 focus:ring-primary/20",
                "text-base", // Prevents zoom on iOS
                isFocused && "bg-background"
              )}
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 rounded-full"
                onClick={() => setSearchTerm("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Tab selector - only show when searching */}
          {searchTerm && (
            <div className="flex bg-muted/50 rounded-2xl p-1">
              {[
                { key: 'all' as const, label: 'All' },
                { key: 'movies' as const, label: 'Movies' },
                { key: 'tv' as const, label: 'TV Shows' }
              ].map((tab) => (
                <Button
                  key={tab.key}
                  variant={activeTab === tab.key ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "flex-1 rounded-xl h-8 text-sm font-medium transition-all duration-200",
                    activeTab === tab.key 
                      ? "bg-background text-foreground shadow-sm" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 space-y-8">
        {/* Search Results */}
        {searchTerm ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground">
                {isSearching ? "Searching..." : `Results for "${searchTerm}"`}
              </h2>
              {filteredResults.length > 0 && (
                <span className="text-sm text-muted-foreground">
                  {filteredResults.length} found
                </span>
              )}
            </div>
            
            {isSearching ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="aspect-[2/3] bg-muted rounded-2xl" />
                    <div className="mt-2 space-y-1">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredResults.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredResults.map((item) => 
                  item.media_type === 'movie' ? renderMovieCard(item) : renderTVCard(item)
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <SearchIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium text-foreground mb-2">No results found</h3>
                <p className="text-sm text-muted-foreground">
                  Try searching with different keywords
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Trending Content */
          <div className="space-y-8">
            {/* Trending Movies */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-cinematic text-xl tracking-wide text-foreground">
                  Trending Movies
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/movies')}
                  className="text-primary hover:text-primary/80"
                >
                  View All
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {trendingMovies.map(renderMovieCard)}
              </div>
            </div>

            {/* Trending TV Shows */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-cinematic text-xl tracking-wide text-foreground">
                  Trending TV Shows
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/tv-shows')}
                  className="text-primary hover:text-primary/80"
                >
                  View All
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {trendingTVShows.map(renderTVCard)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* iOS Tab Bar */}
      <IOSTabBar />
    </div>
  );
};

export default Search;