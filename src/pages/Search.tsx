import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Search as SearchIcon, Filter, X, TrendingUp, Film, Tv, ArrowRight, Shuffle, Star, Clock, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MovieCard } from "@/components/MovieCard";
import { TVShowCard } from "@/components/TVShowCard";
import { AdvancedFilters } from "@/components/AdvancedFilters";
import { PhotoSearch } from "@/components/PhotoSearch";
import { QuickGenres } from "@/components/QuickGenres";
import { Navigation } from "@/components/Navigation";
import { MobileHeader } from "@/components/MobileHeader";
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
  const [showPhotoSearch, setShowPhotoSearch] = useState(false);
  const [isSurpriseMode, setIsSurpriseMode] = useState(false);
  const [originalSurpriseResults, setOriginalSurpriseResults] = useState([]);
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
      // Don't search if we're in surprise mode, no search term, or search term is surprise-related
      if (!debouncedSearchTerm || isSurpriseMode || debouncedSearchTerm.includes("Surprise")) {
        if (!genreParam && !isSurpriseMode) {
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
  }, [debouncedSearchTerm, genreParam, activeTab, isSurpriseMode]);

  // Handle sorting and tab changes for surprise mode
  useEffect(() => {
    if (isSurpriseMode && originalSurpriseResults.length > 0) {
      // Start with original surprise results, not filtered ones
      let sortedResults = [...originalSurpriseResults];
      
      // Apply activeTab filter to original results
      if (activeTab === 'movies') {
        sortedResults = sortedResults.filter(item => item.media_type === 'movie' || (item.title && !item.name));
      } else if (activeTab === 'tv') {
        sortedResults = sortedResults.filter(item => item.media_type === 'tv' || (item.name && !item.title));
      }
      // 'all' shows everything, no filtering needed
      
      // Apply sorting based on current sortBy state
      console.log("Applying sort in surprise mode:", sortBy, "to", sortedResults.length, "items");
      if (sortBy === 'rating') {
        sortedResults.sort((a: any, b: any) => (b.vote_average || 0) - (a.vote_average || 0));
      } else if (sortBy === 'release_date') {
        sortedResults.sort((a: any, b: any) => {
          const dateA = a.release_date || a.first_air_date || '1900-01-01';
          const dateB = b.release_date || b.first_air_date || '1900-01-01';
          return new Date(dateB).getTime() - new Date(dateA).getTime();
        });
      } else if (sortBy === 'title') {
        sortedResults.sort((a: any, b: any) => {
          const titleA = a.title || a.name || '';
          const titleB = b.title || b.name || '';
          return titleA.localeCompare(titleB);
        });
      } else if (sortBy === 'popularity') {
        sortedResults.sort((a: any, b: any) => (b.popularity || 0) - (a.popularity || 0));
      }
      
      setSearchResults(sortedResults);
      
      // Update search term to reflect current state
      const tabText = activeTab === 'movies' ? 'Movies Only' : 
                     activeTab === 'tv' ? 'TV Shows Only' : 
                     'Mixed Content';
      const sortText = sortBy === 'rating' ? ' (By Rating)' :
                       sortBy === 'release_date' ? ' (By Date)' :
                       sortBy === 'title' ? ' (A-Z)' :
                       ' (By Popularity)';
      setSearchTerm(`Random Surprise Mix! (${tabText}${sortText})`);
    }
  }, [sortBy, activeTab, originalSurpriseResults]); // Use originalSurpriseResults as dependency

  const handleFilterChange = async (filters: any) => {
    console.log("Filters changed:", filters);
    setSelectedFilters(filters);
    
    // Apply filters to search results
    if (genreParam || searchTerm || isSurpriseMode) {
      setIsSearching(true);
      try {
        if (isSurpriseMode) {
          // Re-run surprise me with new filters
          await handleSurpriseMe();
          return; // Exit early since handleSurpriseMe handles the loading state
        } else if (genreParam) {
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
        } else if (searchTerm && !searchTerm.includes("Surprise")) {
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
    setIsSurpriseMode(false); // Exit surprise mode
    setOriginalSurpriseResults([]); // Clear original results
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

  const handlePhotoSearchMovie = (movie: any) => {
    // Simulate finding the movie and showing it in results
    setSearchResults([movie]);
    setShowPhotoSearch(false);
  };

  const handleSurpriseMe = async () => {
    console.log("Surprise Me clicked!");
    setIsSearching(true);
    setIsSurpriseMode(true);
    
    // Clear search term immediately to prevent useEffect interference
    setSearchTerm("");
    
    try {
      // Get truly random content from the entire database
      // TMDB has thousands of pages, so we'll pick random pages
      const randomMoviePage = Math.floor(Math.random() * 100) + 1; // Random page 1-100
      const randomTVPage = Math.floor(Math.random() * 100) + 1;
      
      console.log("Fetching random pages - Movies:", randomMoviePage, "TV:", randomTVPage);
      
      let combinedResults: any[] = [];

      // Apply activeTab filter to determine what to fetch
      if (activeTab === 'movies') {
        // Only movies
        const moviesResult = await tmdbService.discoverMovies({ 
          page: randomMoviePage,
          sortBy: 'popularity.desc'
        });
        const shuffledMovies = [...moviesResult.results].sort(() => Math.random() - 0.5).slice(0, 10);
        combinedResults = shuffledMovies.map(movie => ({ ...movie, media_type: 'movie' }));
      } else if (activeTab === 'tv') {
        // Only TV shows
        const tvResult = await tmdbService.getPopularTVShows(randomTVPage);
        const shuffledTV = [...tvResult.results].sort(() => Math.random() - 0.5).slice(0, 10);
        combinedResults = shuffledTV.map(tv => ({ ...tv, media_type: 'tv' }));
      } else {
        // All - mixed content (5 movies + 5 TV shows)
        const [moviesResult, tvResult] = await Promise.all([
          tmdbService.discoverMovies({ 
            page: randomMoviePage,
            sortBy: 'popularity.desc'
          }),
          tmdbService.getPopularTVShows(randomTVPage)
        ]);
        
        const shuffledMovies = [...moviesResult.results].sort(() => Math.random() - 0.5).slice(0, 5);
        const shuffledTV = [...tvResult.results].sort(() => Math.random() - 0.5).slice(0, 5);
        
        const moviesWithType = shuffledMovies.map(movie => ({ ...movie, media_type: 'movie' }));
        const tvWithType = shuffledTV.map(tv => ({ ...tv, media_type: 'tv' }));
        
        combinedResults = [...moviesWithType, ...tvWithType].sort(() => Math.random() - 0.5);
      }
      
      console.log("Raw results before filters:", combinedResults.length);
      
      // Apply advanced filters from AdvancedFilters component
      if (selectedFilters && Object.keys(selectedFilters).length > 0) {
        console.log("Applying advanced filters to surprise results:", selectedFilters);
        
        // Apply rating filter
        if ((selectedFilters as any).ratingRange && (selectedFilters as any).ratingRange[0] > 0) {
          combinedResults = combinedResults.filter((item: any) => 
            item.vote_average >= (selectedFilters as any).ratingRange[0]
          );
        }
        
        // Apply year filter
        if ((selectedFilters as any).yearRange && (selectedFilters as any).yearRange[0] > 1900) {
          combinedResults = combinedResults.filter((item: any) => {
            const year = item.release_date ? new Date(item.release_date).getFullYear() : 
                         item.first_air_date ? new Date(item.first_air_date).getFullYear() : 0;
            return year >= (selectedFilters as any).yearRange[0] && year <= (selectedFilters as any).yearRange[1];
          });
        }
      }

      // Apply sortBy state (from the sort buttons)
      console.log("Applying sort:", sortBy);
      if (sortBy === 'rating') {
        combinedResults.sort((a: any, b: any) => b.vote_average - a.vote_average);
      } else if (sortBy === 'release_date') {
        combinedResults.sort((a: any, b: any) => {
          const dateA = a.release_date || a.first_air_date || '1900-01-01';
          const dateB = b.release_date || b.first_air_date || '1900-01-01';
          return new Date(dateB).getTime() - new Date(dateA).getTime();
        });
      } else if (sortBy === 'title') {
        combinedResults.sort((a: any, b: any) => {
          const titleA = a.title || a.name || '';
          const titleB = b.title || b.name || '';
          return titleA.localeCompare(titleB);
        });
      }
      // popularity is already the default sort from API
      
      console.log("Final surprise results after all filters:", combinedResults.length);
      
      // Store original results for tab/sort filtering
      setOriginalSurpriseResults(combinedResults);
      setSearchResults(combinedResults);
      
      // Set appropriate search term based on active tab
      const tabText = activeTab === 'movies' ? '10 Movies' : 
                     activeTab === 'tv' ? '10 TV Shows' : 
                     '5 Movies + 5 TV Shows';
      setSearchTerm(`Random Surprise Mix! (${tabText})`);
      
      // Clear genre filter when using surprise me
      if (genreParam) {
        navigate('/search');
      }
    } catch (error) {
      console.error("Failed to get surprise items:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const showDefaultContent = !searchTerm && !genreParam && searchResults.length === 0 && !isSurpriseMode;

  const renderMediaCard = (item: any) => {
    if (item.media_type === 'tv' || item.name) {
      return <TVShowCard key={item.id} tvShow={tmdbService.formatTVShowForCard(item)} />;
    } else {
      return <MovieCard key={item.id} movie={tmdbService.formatMovieForCard(item)} />;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-32 max-h-screen overflow-y-auto">
      <MobileHeader title="Search" />
      
      {/* Mobile-Optimized Header and Search Input */}
      <div className="bg-cinema-charcoal/80 backdrop-blur-sm p-4 sticky top-0 z-40">
        <div className="container mx-auto space-y-4">
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

          {/* Mobile-First Control Tabs */}
          {(searchTerm || isSurpriseMode) && (
            <div className="grid grid-cols-3 gap-2 bg-muted/30 rounded-2xl p-1">
              <Button
                variant={activeTab === 'all' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('all')}
                className="rounded-xl h-10 text-sm font-medium"
              >
                All
              </Button>
              <Button
                variant={activeTab === 'movies' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('movies')}
                className="rounded-xl h-10 text-sm font-medium"
              >
                <Film className="h-4 w-4 mr-1" />
                Movies
              </Button>
              <Button
                variant={activeTab === 'tv' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('tv')}
                className="rounded-xl h-10 text-sm font-medium"
              >
                <Tv className="h-4 w-4 mr-1" />
                TV
              </Button>
            </div>
          )}

          {/* Mobile-First Sort and Action Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* Sort Controls - Mobile Grid */}
            {(searchTerm || genreParam || isSurpriseMode) && (
              <div className="flex-1 min-w-0">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 bg-muted/20 rounded-xl p-1">
                  <Button
                    variant={sortBy === 'popularity' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setSortBy('popularity')}
                    className="rounded-lg h-9 text-xs font-medium"
                  >
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Popular
                  </Button>
                  <Button
                    variant={sortBy === 'rating' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setSortBy('rating')}
                    className="rounded-lg h-9 text-xs font-medium"
                  >
                    <Star className="h-3 w-3 mr-1" />
                    Rating
                  </Button>
                  <Button
                    variant={sortBy === 'release_date' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setSortBy('release_date')}
                    className="rounded-lg h-9 text-xs font-medium"
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    Recent
                  </Button>
                  <Button
                    variant={sortBy === 'title' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setSortBy('title')}
                    className="rounded-lg h-9 text-xs font-medium"
                  >
                    A-Z
                  </Button>
                </div>
              </div>
            )}

            {/* Action Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSurpriseMe}
              className="rounded-full h-10 px-4 border-primary/30 text-primary hover:bg-primary/10 hover:border-primary touch-target"
            >
              <Shuffle className="h-4 w-4 mr-1" />
              Surprise!
            </Button>
          </div>
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
        <div className="container mx-auto px-4 mt-8 space-y-12">
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
               <div className="poster-grid-responsive">
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

      {/* Photo Search Component */}
      <PhotoSearch 
        onMovieFound={handlePhotoSearchMovie}
        isOpen={showPhotoSearch}
        onToggle={() => setShowPhotoSearch(!showPhotoSearch)}
      />

      {/* Search Results */}
      <div className="container mx-auto px-4 mt-8 pb-8">
        {isSearching && (
          <div className="text-center text-muted-foreground">Searching...</div>
        )}
        {!isSearching && searchResults.length === 0 && (searchTerm || genreParam) && !searchTerm.includes("(Surprise Pick!)") && (
          <div className="text-center text-muted-foreground">No results found.</div>
        )}
        {searchResults.length > 0 && (
          <div className="bg-gradient-to-br from-cinema-black via-cinema-charcoal to-cinema-black">
            {/* Movie/TV Page Style Header */}
            <div className="bg-background/95 backdrop-blur-sm border-b border-border px-4 md:px-6 py-6">
              <div className="container mx-auto">
                <h1 className="font-cinematic text-3xl md:text-4xl text-foreground tracking-wide mb-2">
                  {searchTerm && searchTerm.includes("Surprise") ? "YOUR SURPRISE MIX" : 
                   genreParam ? `${getGenreName(genreParam).toUpperCase()} MOVIES` : 
                   "SEARCH RESULTS"}
                </h1>
                <div className="w-20 h-1 bg-cinema-gold mb-4"></div>
                <p className="text-muted-foreground">
                  {searchTerm && searchTerm.includes("Surprise") ? "A perfect mix of movies and TV shows picked just for you!" : 
                   `Showing ${searchResults.length} result${searchResults.length !== 1 ? 's' : ''}`}
                </p>
              </div>
            </div>
            
            {/* Results Grid - Movies Page Style */}
            <div className="container mx-auto px-4 md:px-6 py-8">
               <div className="poster-grid-responsive">
                {searchResults.map((item) => renderMediaCard(item))}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Mobile Navigation */}
      <Navigation />
    </div>
  );
};

export default Search;
