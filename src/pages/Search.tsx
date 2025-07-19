
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Search as SearchIcon, Filter, X, TrendingUp, Film } from "lucide-react";
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
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState({});
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Load trending movies for default content
  useEffect(() => {
    const loadTrendingMovies = async () => {
      try {
        const results = await tmdbService.getTrendingMovies();
        setTrendingMovies(results.results.slice(0, 8));
      } catch (error) {
        console.error("Failed to load trending movies:", error);
      }
    };

    loadTrendingMovies();
  }, []);

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

  const popularSearches = ['Marvel', 'Disney', 'Horror', 'Comedy', 'Action', 'Romance'];

  const handlePopularSearch = (term: string) => {
    setSearchTerm(term);
  };

  const showDefaultContent = !searchTerm && !genreParam && searchResults.length === 0;

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

      {/* Default Content - Search Suggestions */}
      {showDefaultContent && (
        <div className="container mx-auto px-4 mt-8 space-y-8">
          {/* Welcome Header */}
          <div className="text-center">
            <h1 className="font-cinematic text-4xl text-foreground tracking-wide mb-4">
              DISCOVER MOVIES
            </h1>
            <p className="text-muted-foreground text-lg mb-6">
              Search for your favorite films or explore what's trending
            </p>
            <div className="w-16 h-0.5 bg-cinema-red mx-auto"></div>
          </div>

          {/* Popular Searches */}
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-cinema-gold" />
              Popular Searches
            </h2>
            <div className="flex flex-wrap gap-2">
              {popularSearches.map((term) => (
                <Button
                  key={term}
                  variant="outline"
                  size="sm"
                  onClick={() => handlePopularSearch(term)}
                  className="rounded-full border-border hover:border-cinema-red hover:text-cinema-red"
                >
                  {term}
                </Button>
              ))}
            </div>
          </div>

          {/* Trending Movies */}
          {trendingMovies.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center">
                <Film className="h-5 w-5 mr-2 text-cinema-red" />
                Trending Now
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {trendingMovies.map((movie) => (
                  <MovieCard 
                    key={movie.id} 
                    movie={tmdbService.formatMovieForCard(movie)} 
                    size="small" 
                  />
                ))}
              </div>
            </div>
          )}
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
        {searchResults.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {searchResults.map((movie) => (
              <MovieCard 
                key={movie.id} 
                movie={tmdbService.formatMovieForCard(movie)} 
                size="small" 
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Mobile Navigation */}
      <Navigation />
    </div>
  );
};

export default Search;
