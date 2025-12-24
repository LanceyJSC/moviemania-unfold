
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Search as SearchIcon, Filter, X, TrendingUp, Film, Tv, ArrowRight, Star, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MovieCard } from "@/components/MovieCard";
import { TVShowCard } from "@/components/TVShowCard";
import { AdvancedFilters } from "@/components/AdvancedFilters";

import { QuickGenres } from "@/components/QuickGenres";
import { Navigation } from "@/components/Navigation";
import { MobileBrandHeader } from "@/components/MobileBrandHeader";
import { DesktopHeader } from "@/components/DesktopHeader";
import { tmdbService } from "@/lib/tmdb";
import { useDebounce } from "@/hooks/useDebounce";

const Search = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const genreParam = searchParams.get('genre');
  
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [trendingTVShows, setTrendingTVShows] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState({});
  const [activeTab, setActiveTab] = useState<'all' | 'movies' | 'tv'>('all');
  const [sortBy, setSortBy] = useState<'popularity' | 'rating' | 'release_date' | 'title'>('popularity');
  
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Load trending content for default display
  useEffect(() => {
    const loadTrendingContent = async () => {
      try {
        const [moviesResult, tvResult] = await Promise.all([
          tmdbService.getTrendingMovies(undefined, true),
          tmdbService.getTrendingTVShows(undefined, true)
        ]);
        setTrendingMovies(moviesResult.results.slice(0, 6));
        setTrendingTVShows(tvResult.results.slice(0, 6));
      } catch (error) {
        console.error("Failed to load trending content:", error);
      }
    };

    loadTrendingContent();
  }, []);

  // Handle genre-based search on component mount
  useEffect(() => {
    const handleGenreSearch = async () => {
      if (genreParam) {
        setIsSearching(true);
        try {
          let sortParam = 'popularity.desc';
          if (sortBy === 'rating') sortParam = 'vote_average.desc';
          if (sortBy === 'release_date') sortParam = 'release_date.desc';
          if (sortBy === 'title') sortParam = 'title.asc';

          // Fetch multiple pages to get more results (up to 5 pages = 100 results)
          const pagePromises = [];
          for (let page = 1; page <= 5; page++) {
            pagePromises.push(
              tmdbService.discoverMovies({
                genre: parseInt(genreParam),
                page: page,
                sortBy: sortParam
              })
            );
          }

          const allResults = await Promise.all(pagePromises);
          const combinedResults = allResults.flatMap(result => result.results);
          setSearchResults(combinedResults);
        } catch (error) {
          console.error("Genre search failed:", error);
        } finally {
          setIsSearching(false);
        }
      }
    };

    handleGenreSearch();
  }, [genreParam, sortBy]);

  // Handle text-based search
  useEffect(() => {
    const searchContent = async () => {
      if (!debouncedSearchTerm) {
        if (!genreParam) {
          setSearchResults([]);
        }
        return;
      }

      setIsSearching(true);
      try {
        let results;
        if (activeTab === 'movies') {
          results = await tmdbService.searchMovies(debouncedSearchTerm);
        } else if (activeTab === 'tv') {
          results = await tmdbService.searchTVShows(debouncedSearchTerm);
        } else {
          results = await tmdbService.searchMulti(debouncedSearchTerm);
        }
        setSearchResults(results.results);
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setIsSearching(false);
      }
    };

    searchContent();
  }, [debouncedSearchTerm, genreParam, activeTab]);

  const handleFilterChange = async (filters: any) => {
    console.log("Filters changed:", filters);
    setSelectedFilters(filters);
    
    // Apply filters to search results
    if (genreParam || searchTerm) {
      setIsSearching(true);
      try {
        if (genreParam) {
          // Apply filters to genre search - fetch multiple pages
          const pagePromises = [];
          for (let page = 1; page <= 5; page++) {
            pagePromises.push(
              tmdbService.discoverMovies({
                genre: parseInt(genreParam),
                page: page,
                sortBy: filters.sortBy || 'popularity.desc',
                rating: filters.ratingRange?.[0] || 0,
                year: filters.yearRange?.[0] || 1900
              })
            );
          }
          const allResults = await Promise.all(pagePromises);
          const combinedResults = allResults.flatMap(result => result.results);
          setSearchResults(combinedResults);
        } else if (searchTerm) {
          // For text search, apply sort but note: TMDB search API doesn't support all filters
          let results;
          if (activeTab === 'movies') {
            results = await tmdbService.searchMovies(searchTerm);
          } else if (activeTab === 'tv') {
            results = await tmdbService.searchTVShows(searchTerm);
          } else {
            results = await tmdbService.searchMulti(searchTerm);
          }
          
          // Client-side filtering for search results (limited but better than nothing)
          let filteredResults = results.results;
          
          if (filters.ratingRange && filters.ratingRange[0] > 0) {
            filteredResults = filteredResults.filter((item: any) => 
              item.vote_average >= filters.ratingRange[0]
            );
          }
          
          if (filters.yearRange && filters.yearRange[0] > 1900) {
            filteredResults = filteredResults.filter((item: any) => {
              const year = item.release_date ? new Date(item.release_date).getFullYear() : 
                           item.first_air_date ? new Date(item.first_air_date).getFullYear() : 0;
              return year >= filters.yearRange[0] && year <= filters.yearRange[1];
            });
          }
          
          setSearchResults(filteredResults);
        }
      } catch (error) {
        console.error("Failed to apply filters:", error);
      } finally {
        setIsSearching(false);
      }
    }
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

  const handleViewAllTrending = () => {
    navigate('/category/trending');
  };

  const showDefaultContent = !searchTerm && !genreParam && searchResults.length === 0;

  const renderMediaCard = (item: any) => {
    if (item.media_type === 'tv' || item.name) {
      return <TVShowCard key={item.id} tvShow={tmdbService.formatTVShowForCard(item)} />;
    } else {
      return <MovieCard key={item.id} movie={tmdbService.formatMovieForCard(item)} />;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-32 lg:pb-12 max-h-screen overflow-y-auto">
      <DesktopHeader />
      <MobileBrandHeader />
      
      {/* Search Input */}
      <div className="bg-cinema-charcoal/80 backdrop-blur-sm p-4 sticky top-0 lg:top-16 z-40">
        <div className="space-y-4 max-w-7xl mx-auto">
          {/* Search Input Row */}
          <div className="flex items-center gap-2">
            <div className="relative flex-grow">
              <Input
                type="search"
                placeholder={genreParam ? `Search in ${getGenreName(genreParam)} movies...` : "Search for movies and TV shows..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="rounded-full pl-10 pr-16 h-12 text-base bg-card/60 border-border/50"
              />
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSearch}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 rounded-full touch-target"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="rounded-full h-12 w-12 touch-target focus-ring"
            >
              <Filter className="h-5 w-5" />
            </Button>
          </div>

          {/* Mobile-First Control Tabs - Single Line */}
          {searchTerm && (
            <div className="flex justify-between space-x-1 bg-muted/30 rounded-2xl p-1">
              <Button
                variant={activeTab === 'all' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('all')}
                className="flex-1 rounded-xl h-9 text-sm font-medium"
              >
                All
              </Button>
              <Button
                variant={activeTab === 'movies' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('movies')}
                className="flex-1 rounded-xl h-9 text-sm font-medium"
              >
                <Film className="h-4 w-4 mr-1" />
                Movies
              </Button>
              <Button
                variant={activeTab === 'tv' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('tv')}
                className="flex-1 rounded-xl h-9 text-sm font-medium"
              >
                <Tv className="h-4 w-4 mr-1" />
                TV
              </Button>
            </div>
          )}

          {/* Mobile-First Sort Controls - Single Line */}
          {(searchTerm || genreParam) && (
            <div className="flex justify-between space-x-1 bg-muted/20 rounded-xl p-1">
              <Button
                variant={sortBy === 'popularity' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSortBy('popularity')}
                className="flex-1 rounded-lg h-8 text-xs font-medium"
              >
                <TrendingUp className="h-3 w-3 mr-1" />
                Pop
              </Button>
              <Button
                variant={sortBy === 'rating' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSortBy('rating')}
                className="flex-1 rounded-lg h-8 text-xs font-medium"
              >
                <Star className="h-3 w-3 mr-1" />
                Rate
              </Button>
              <Button
                variant={sortBy === 'release_date' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSortBy('release_date')}
                className="flex-1 rounded-lg h-8 text-xs font-medium"
              >
                <Clock className="h-3 w-3 mr-1" />
                New
              </Button>
              <Button
                variant={sortBy === 'title' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSortBy('title')}
                className="flex-1 rounded-lg h-8 text-xs font-medium"
              >
                A-Z
              </Button>
            </div>
          )}
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
      <AdvancedFilters 
        onFiltersChange={handleFilterChange}
        isOpen={showFilters}
        onToggle={() => setShowFilters(!showFilters)}
      />

      {/* Default Content - Discovery Hub */}
      {showDefaultContent && (
        <div className="px-4 md:px-6 mt-8 space-y-12 max-w-7xl mx-auto">
          {/* Welcome Header */}
          <div className="text-center">
            <h1 className="font-cinematic text-4xl text-foreground tracking-wide mb-4">
              DISCOVER MOVIES & TV SHOWS
            </h1>
            <p className="text-muted-foreground text-lg mb-6">
              Search for your favorite films and series or explore what's trending
            </p>
            <div className="w-16 h-0.5 bg-cinema-red mx-auto"></div>
          </div>

          {/* Quick Genre Exploration */}
          <QuickGenres />

          {/* Popular Searches */}
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-cinema-gold" />
              Popular Searches
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              {popularSearches.map((term) => (
                <Button
                  key={term}
                  variant="outline"
                  size="sm"
                  onClick={() => handlePopularSearch(term)}
                  className="rounded-xl h-12 border-border hover:border-cinema-red hover:text-cinema-red touch-target"
                >
                  {term}
                </Button>
              ))}
            </div>
          </div>

          {/* Trending Movies */}
          {trendingMovies.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-foreground flex items-center">
                  <Film className="h-5 w-5 mr-2 text-cinema-red" />
                  Trending Movies
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleViewAllTrending}
                  className="flex items-center gap-2 text-cinema-red hover:text-cinema-red/80 hover:bg-cinema-red/10"
                >
                  View All
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
               <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                {trendingMovies.map((movie) => (
                  <MovieCard 
                    key={movie.id} 
                    movie={tmdbService.formatMovieForCard(movie)} 
                  />
                ))}
              </div>
            </div>
          )}

          {/* Trending TV Shows */}
          {trendingTVShows.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-foreground flex items-center">
                  <Tv className="h-5 w-5 mr-2 text-cinema-red" />
                  Trending TV Shows
                </h2>
              </div>
               <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                {trendingTVShows.map((tvShow) => (
                  <TVShowCard 
                    key={tvShow.id} 
                    tvShow={tmdbService.formatTVShowForCard(tvShow)} 
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}


      {/* Search Results */}
      <div className="px-4 md:px-6 mt-8 pb-8 max-w-7xl mx-auto">
        {isSearching && (
          <div className="text-center text-muted-foreground">Searching...</div>
        )}
        {!isSearching && searchResults.length === 0 && (searchTerm || genreParam) && (
          <div className="text-center text-muted-foreground">No results found.</div>
        )}
        {searchResults.length > 0 && (
          <div className="bg-gradient-to-br from-cinema-black via-cinema-charcoal to-cinema-black">
            {/* Movie/TV Page Style Header */}
            <div className="bg-background/95 backdrop-blur-sm border-b border-border px-4 md:px-6 py-6">
              <div className="container mx-auto">
                <h1 className="font-cinematic text-3xl md:text-4xl text-foreground tracking-wide mb-2">
                  {genreParam ? `${getGenreName(genreParam).toUpperCase()} MOVIES` : "SEARCH RESULTS"}
                </h1>
                <div className="w-20 h-1 bg-cinema-gold mb-4"></div>
                <p className="text-muted-foreground">
                  Showing {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            
            {/* Results Grid - Movies Page Style */}
            <div className="container mx-auto px-4 md:px-6 py-8">
               <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                {searchResults.map((item) => renderMediaCard(item))}
              </div>
            </div>
          </div>
        )}
      </div>
      
      <Navigation />
    </div>
  );
};

export default Search;
