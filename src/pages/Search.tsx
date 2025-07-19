import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
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
  const [searchParams] = useSearchParams();
  const genreParam = searchParams.get('genre');
  
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState({});
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Handle genre-based search on component mount
  useEffect(() => {
    const handleGenreSearch = async () => {
      if (genreParam) {
        setIsSearching(true);
        try {
          const results = await tmdbService.discoverMovies({
            genre: parseInt(genreParam),
            page: 1
          });
          setSearchResults(results.results);
        } catch (error) {
          console.error("Genre search failed:", error);
        } finally {
          setIsSearching(false);
        }
      }
    };

    handleGenreSearch();
  }, [genreParam]);

  // Handle text-based search
  useEffect(() => {
    const searchMovies = async () => {
      if (!debouncedSearchTerm) {
        // If there's no search term but there's a genre param, keep genre results
        if (!genreParam) {
          setSearchResults([]);
        }
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
  }, [debouncedSearchTerm, genreParam]);

  const handleFilterChange = (filters: any) => {
    setSelectedFilters(filters);
    // Apply filters to searchResults here
  };

  const clearSearch = () => {
    setSearchTerm("");
    if (!genreParam) {
      setSearchResults([]);
    }
  };

  // Get genre name for display
  const getGenreName = (genreId: string) => {
    const genreMap: { [key: string]: string } = {
      '28': 'Action',
      '35': 'Comedy',
      '27': 'Horror',
      '10749': 'Romance',
      '878': 'Sci-Fi',
      '12': 'Adventure'
    };
    return genreMap[genreId] || 'Genre';
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header and Search Input */}
      <div className="bg-cinema-charcoal/80 backdrop-blur-sm p-4 sticky top-0 z-40">
        <div className="container mx-auto flex items-center">
          <div className="relative flex-grow">
            <Input
              type="search"
              placeholder={genreParam ? `Search in ${getGenreName(genreParam)} movies...` : "Search for movies..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rounded-full pl-10 pr-16 min-h-[44px]"
            />
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSearch}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 rounded-full min-h-[44px] min-w-[44px]"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="ml-2 rounded-full min-h-[44px] min-w-[44px]"
          >
            <Filter className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Genre Header */}
      {genreParam && !searchTerm && (
        <div className="container mx-auto px-4 py-6">
          <h2 className="text-2xl font-cinematic text-foreground tracking-wide">
            {getGenreName(genreParam).toUpperCase()} MOVIES
          </h2>
          <div className="w-16 h-0.5 bg-cinema-gold mt-2"></div>
        </div>
      )}

      {/* Advanced Filters */}
      {showFilters && (
        <div className="container mx-auto px-4 mt-4">
          <AdvancedFilters 
            onFiltersChange={handleFilterChange}
            isOpen={showFilters}
            onToggle={() => setShowFilters(!showFilters)}
          />
        </div>
      )}

      {/* Search Results */}
      <div className="container mx-auto px-4 mt-8">
        {isSearching && (
          <div className="text-center text-muted-foreground">Searching...</div>
        )}
        {!isSearching && searchResults.length === 0 && (searchTerm || genreParam) && (
          <div className="text-center text-muted-foreground">No results found.</div>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {searchResults.map((movie) => (
            <MovieCard key={movie.id} movie={movie} size="small" />
          ))}
        </div>
      </div>
      
      {/* Mobile Navigation */}
      <Navigation />
    </div>
  );
};

export default Search;
