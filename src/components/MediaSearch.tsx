import { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { tmdbService } from "@/lib/tmdb";
import { MovieCard } from "@/components/MovieCard";
import { TVShowCard } from "@/components/TVShowCard";
import { useDebounce } from "@/hooks/useDebounce";

interface MediaSearchProps {
  type: "movie" | "tv";
  placeholder?: string;
}

export const MediaSearch = ({ type, placeholder }: MediaSearchProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    const search = async () => {
      if (!debouncedQuery.trim()) {
        setResults([]);
        return;
      }

      setIsSearching(true);
      try {
        if (type === "movie") {
          const response = await tmdbService.searchMovies(debouncedQuery);
          setResults(response.results.slice(0, 20));
        } else {
          const response = await tmdbService.searchTVShows(debouncedQuery);
          setResults(response.results.slice(0, 20));
        }
      } catch (error) {
        console.error("Search error:", error);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    search();
  }, [debouncedQuery, type]);

  const clearSearch = () => {
    setQuery("");
    setResults([]);
  };

  const defaultPlaceholder = type === "movie" ? "Search movies..." : "Search TV shows...";

  return (
    <div className="w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={placeholder || defaultPlaceholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 pr-10 h-11 bg-card/60 border-border/50 rounded-xl"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {query && (
        <div className="mt-6">
          {isSearching ? (
            <div className="text-center text-muted-foreground py-8">Searching...</div>
          ) : results.length > 0 ? (
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Search Results ({results.length})
              </h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
                {results.map((item) =>
                  type === "movie" ? (
                    <MovieCard
                      key={item.id}
                      movie={{
                        id: item.id,
                        title: item.title,
                        poster: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : "/placeholder.svg",
                        year: item.release_date?.split("-")[0] || "",
                        rating: item.vote_average?.toFixed(1) || "N/A",
                      }}
                    />
                  ) : (
                    <TVShowCard
                      key={item.id}
                      tvShow={{
                        id: item.id,
                        title: item.name,
                        poster: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : "/placeholder.svg",
                        year: item.first_air_date?.split("-")[0] || "",
                        rating: item.vote_average?.toFixed(1) || "N/A",
                      }}
                    />
                  )
                )}
              </div>
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No {type === "movie" ? "movies" : "TV shows"} found for "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};
