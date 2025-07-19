import { useState, useEffect } from "react";
import { Search as SearchIcon, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MovieCard } from "@/components/MovieCard";
import { AdvancedFilters } from "@/components/AdvancedFilters";
import { PhotoSearch } from "@/components/PhotoSearch";
import { Navigation } from "@/components/Navigation";
import { tmdbService } from "@/lib/tmdb";
import { useDebounce } from "@/hooks/useDebounce";

const Search = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState({});
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    const searchMovies = async () => {
      if (!debouncedSearchTerm) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const results = await tmdbService.searchMovies(debouncedSearchTerm);
        setSearchResults(results.results);
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setIsSearching(false);
      }
    };

    searchMovies();
  }, [debouncedSearchTerm]);

  const handleFilterChange = (filters: any) => {
    setSelectedFilters(filters);
    // Apply filters to searchResults here
  };

  const clearSearch = () => {
    setSearchTerm("");
    setSearchResults([]);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header and Search Input */}
      <div className="bg-cinema-charcoal/80 backdrop-blur-sm p-4 sticky top-0 z-40">
        <div className="container mx-auto flex items-center">
          <div className="relative flex-grow">
            <Input
              type="search"
              placeholder="Search for movies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rounded-full pl-10 pr-16"
            />
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSearch}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="ml-2 rounded-full"
          >
            <Filter className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="container mx-auto mt-4">
          <AdvancedFilters onChange={handleFilterChange} />
        </div>
      )}

      {/* Search Results */}
      <div className="container mx-auto mt-8">
        {isSearching && (
          <div className="text-center text-muted-foreground">Searching...</div>
        )}
        {!isSearching && searchResults.length === 0 && searchTerm && (
          <div className="text-center text-muted-foreground">No results found.</div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {searchResults.map((movie) => (
            <MovieCard key={movie.id} movie={movie} cardSize="small" />
          ))}
        </div>
      </div>
      
      {/* Mobile Navigation */}
      <Navigation />
    </div>
  );
};

export default Search;
