import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Search as SearchIcon, X, Film, Tv, Crown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MovieCard } from "@/components/MovieCard";
import { TVShowCard } from "@/components/TVShowCard";
import { InlineFilters } from "@/components/InlineFilters";
import { Navigation } from "@/components/Navigation";
import { MobileBrandHeader } from "@/components/MobileBrandHeader";
import { DesktopHeader } from "@/components/DesktopHeader";
import { ProUpgradeModal } from "@/components/ProUpgradeModal";
import { tmdbService } from "@/lib/tmdb";
import { useDebounce } from "@/hooks/useDebounce";
import { useSubscription } from "@/hooks/useSubscription";

const Search = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const genreParam = searchParams.get('genre');
  const { isProUser } = useSubscription();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'movies' | 'tv'>('all');
  const [showProModal, setShowProModal] = useState(false);
  const [filterResults, setFilterResults] = useState<any[]>([]);
  const [isFilterSearching, setIsFilterSearching] = useState(false);
  
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Handle genre-based search on component mount (Pro only)
  useEffect(() => {
    const handleGenreSearch = async () => {
      if (genreParam && isProUser) {
        setIsSearching(true);
        try {
          const pagePromises = [];
          for (let page = 1; page <= 5; page++) {
            pagePromises.push(
              tmdbService.discoverMovies({
                genre: parseInt(genreParam),
                page: page,
                sortBy: 'popularity.desc'
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
  }, [genreParam, isProUser]);

  // Handle text-based search with crew/director support
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
        // Use enhanced search that includes director/producer filmography
        const { results } = await tmdbService.searchWithCrew(debouncedSearchTerm);
        
        // Filter by active tab if needed
        let filteredResults = results;
        if (activeTab === 'movies') {
          filteredResults = results.filter((item: any) => 
            item.media_type === 'movie' || item.title
          );
        } else if (activeTab === 'tv') {
          filteredResults = results.filter((item: any) => 
            item.media_type === 'tv' || item.name
          );
        }
        
        setSearchResults(filteredResults);
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setIsSearching(false);
      }
    };

    searchContent();
  }, [debouncedSearchTerm, genreParam, activeTab]);

  const clearSearch = () => {
    setSearchTerm("");
    if (!genreParam) {
      setSearchResults([]);
    }
  };

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

  const renderMediaCard = (item: any) => {
    if (item.media_type === 'tv' || item.name) {
      return <TVShowCard key={item.id} tvShow={tmdbService.formatTVShowForCard(item)} />;
    } else {
      return <MovieCard key={item.id} movie={tmdbService.formatMovieForCard(item)} />;
    }
  };

  const handleFiltersChange = async (filters: any) => {
    const isDefault = 
      filters.genres.length === 0 &&
      filters.yearRange[0] === 1900 && filters.yearRange[1] === new Date().getFullYear() &&
      filters.ratingRange[0] === 0 && filters.ratingRange[1] === 10 &&
      filters.runtimeRange[0] === 0 && filters.runtimeRange[1] === 300 &&
      filters.mood === 'any' &&
      filters.tone === 'any' &&
      filters.pacing === 'any';
    
    if (isDefault) {
      setFilterResults([]);
      return;
    }

    setIsFilterSearching(true);
    try {
      const discoverParams: any = {
        sortBy: filters.sortBy || 'popularity.desc',
        page: 1
      };
      
      // Build genre list from explicit selection + mood/tone mappings
      let genreIds: number[] = [...(filters.genres || [])];
      
      // Map mood to genre IDs for better filtering
      const moodGenreMap: { [key: string]: number[] } = {
        'feel-good': [35, 10751], // Comedy, Family
        'intense': [28, 53], // Action, Thriller
        'thought-provoking': [18, 99], // Drama, Documentary
        'emotional': [18, 10749], // Drama, Romance
        'uplifting': [35, 10751, 12], // Comedy, Family, Adventure
        'dark': [27, 53, 80], // Horror, Thriller, Crime
        'nostalgic': [10751, 14], // Family, Fantasy
        'inspiring': [18, 36], // Drama, History
      };
      
      // Map tone to genre IDs
      const toneGenreMap: { [key: string]: number[] } = {
        'lighthearted': [35, 10751], // Comedy, Family
        'serious': [18, 36], // Drama, History
        'satirical': [35], // Comedy
        'suspenseful': [53, 9648], // Thriller, Mystery
        'romantic': [10749], // Romance
        'gritty': [80, 53], // Crime, Thriller
        'whimsical': [14, 16], // Fantasy, Animation
      };
      
      // Add mood genres if set
      if (filters.mood && filters.mood !== 'any') {
        const moodGenres = moodGenreMap[filters.mood];
        if (moodGenres) {
          genreIds = [...genreIds, ...moodGenres];
        }
      }
      
      // Add tone genres if set
      if (filters.tone && filters.tone !== 'any') {
        const toneGenres = toneGenreMap[filters.tone];
        if (toneGenres) {
          genreIds = [...genreIds, ...toneGenres];
        }
      }
      
      // Remove duplicates and set genre param
      if (genreIds.length > 0) {
        const uniqueGenres = [...new Set(genreIds)];
        discoverParams.genre = uniqueGenres.join(',');
      }
      
      // Apply year range filter
      if (filters.yearRange[0] > 1900 || filters.yearRange[1] < new Date().getFullYear()) {
        discoverParams.yearFrom = filters.yearRange[0];
        discoverParams.yearTo = filters.yearRange[1];
      }
      
      // Apply rating filter
      if (filters.ratingRange[0] > 0 || filters.ratingRange[1] < 10) {
        discoverParams.voteAverageFrom = filters.ratingRange[0];
        discoverParams.voteAverageTo = filters.ratingRange[1];
      }
      
      // Apply runtime filter (only if not using pacing)
      if (filters.runtimeRange[0] > 0 || filters.runtimeRange[1] < 300) {
        discoverParams.runtimeFrom = filters.runtimeRange[0];
        discoverParams.runtimeTo = filters.runtimeRange[1];
      }
      
      // Handle pacing filter - override runtime if set
      if (filters.pacing && filters.pacing !== 'any') {
        const pacingRanges: { [key: string]: [number, number] } = {
          'slow': [150, 300],
          'moderate': [90, 150],
          'fast': [60, 100]
        };
        const pacingRange = pacingRanges[filters.pacing];
        if (pacingRange) {
          discoverParams.runtimeFrom = pacingRange[0];
          discoverParams.runtimeTo = pacingRange[1];
        }
      }

      // Fetch based on active tab
      const pagePromises = [];
      const pagesToFetch = activeTab === 'all' ? 15 : 25; // Fewer pages for 'all' since we fetch both
      
      for (let page = 1; page <= pagesToFetch; page++) {
        if (activeTab === 'tv') {
          pagePromises.push(tmdbService.discoverTV({ ...discoverParams, page }));
        } else if (activeTab === 'movies') {
          pagePromises.push(tmdbService.discoverMovies({ ...discoverParams, page }));
        } else {
          // For 'all', fetch both movies and TV shows
          pagePromises.push(tmdbService.discoverMovies({ ...discoverParams, page }));
          pagePromises.push(tmdbService.discoverTV({ ...discoverParams, page }));
        }
      }
      
      const allResults = await Promise.all(pagePromises);
      const combinedResults = allResults.flatMap(result => result.results || []);
      
      // Deduplicate results by id (movies and TV can have same numeric IDs, so include type)
      const seen = new Set<string>();
      const uniqueResults = combinedResults.filter((item: any) => {
        const type = item.title ? 'movie' : 'tv';
        const key = `${type}-${item.id}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      
      // Sort by popularity
      uniqueResults.sort((a: any, b: any) => (b.popularity || 0) - (a.popularity || 0));
      
      setFilterResults(uniqueResults);
    } catch (error) {
      console.error("Filter search failed:", error);
    } finally {
      setIsFilterSearching(false);
    }
  };

  const hasResults = searchResults.length > 0;
  const showEmptyState = !searchTerm && !genreParam && !hasResults && filterResults.length === 0 && !isFilterSearching;
  const showProDiscovery = isProUser && !searchTerm && !genreParam;

  return (
    <div className="min-h-screen bg-background">
      <DesktopHeader />
      <MobileBrandHeader />
      
      <div className="px-4 2xl:px-6 pb-32 2xl:pb-12 space-y-4 2xl:space-y-6 max-w-7xl mx-auto">
        {/* Search Section */}
        <div className="pt-4 2xl:pt-6">
          {/* Title - Only on desktop or when no results */}
          {!searchTerm && !genreParam && filterResults.length === 0 && (
            <div className="hidden 2xl:block mb-6">
              <h1 className="font-cinematic text-3xl md:text-4xl text-foreground tracking-wider mb-2">
                DISCOVER
              </h1>
              <p className="text-muted-foreground">
                Find your next favorite movie or TV show
              </p>
            </div>
          )}
          
          {/* Search Input - Optimized for mobile */}
          <div className="relative">
            <Input
              type="search"
              placeholder="Search movies, TV shows..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rounded-xl pl-11 pr-10 h-12 2xl:h-14 text-base bg-card border-border/50 focus:border-primary/50"
            />
            <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSearch}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-10 w-10 rounded-full hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Media Type Tabs - Compact on mobile */}
        <div className="flex gap-1.5 bg-card/50 backdrop-blur-sm rounded-xl p-1 border border-border/30">
          <Button
            variant={activeTab === 'all' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('all')}
            className="flex-1 rounded-lg h-9 text-sm font-medium"
          >
            All
          </Button>
          <Button
            variant={activeTab === 'movies' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('movies')}
            className="flex-1 rounded-lg h-9 text-sm font-medium gap-1.5"
          >
            <Film className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Movies</span>
            <span className="sm:hidden">Films</span>
          </Button>
          <Button
            variant={activeTab === 'tv' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('tv')}
            className="flex-1 rounded-lg h-9 text-sm font-medium gap-1.5"
          >
            <Tv className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">TV Shows</span>
            <span className="sm:hidden">TV</span>
          </Button>
        </div>

        {/* Genre Header for Pro users */}
        {isProUser && genreParam && !searchTerm && (
          <div className="py-6">
            <div className="flex items-center gap-4">
              <div className="h-8 w-1 bg-primary rounded-full" />
              <div>
                <h2 className="text-2xl font-cinematic text-foreground tracking-wide">
                  {getGenreName(genreParam).toUpperCase()} MOVIES
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Explore the best in {getGenreName(genreParam).toLowerCase()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div>
        
        {/* Empty State for FREE users - Compact on mobile */}
        {showEmptyState && !isProUser && (
          <div className="py-8 2xl:py-12">
            <div className="text-center">
              <div className="w-16 h-16 2xl:w-20 2xl:h-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                <SearchIcon className="h-8 w-8 2xl:h-10 2xl:w-10 text-muted-foreground/50" />
              </div>
              <h2 className="text-xl 2xl:text-2xl font-semibold text-foreground mb-2">
                Start Searching
              </h2>
              <p className="text-sm text-muted-foreground mb-6 2xl:mb-10">
                Type above to find movies and TV shows
              </p>
              
              {/* Pro Upgrade Card - Compact on mobile */}
              <div className="bg-gradient-to-br from-card via-card to-primary/5 border border-border/50 rounded-xl 2xl:rounded-2xl p-5 2xl:p-8 text-left">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 2xl:w-10 2xl:h-10 rounded-lg 2xl:rounded-xl bg-primary/10 flex items-center justify-center">
                    <Sparkles className="h-4 w-4 2xl:h-5 2xl:w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-sm 2xl:text-base">Unlock Pro Discovery</h3>
                    <p className="text-xs 2xl:text-sm text-muted-foreground">Advanced filters</p>
                  </div>
                </div>
                <ul className="space-y-1.5 mb-4 2xl:mb-6 text-xs 2xl:text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <div className="w-1 h-1 2xl:w-1.5 2xl:h-1.5 rounded-full bg-primary" />
                    Browse by genre, mood, and era
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1 h-1 2xl:w-1.5 2xl:h-1.5 rounded-full bg-primary" />
                    Filter by rating and runtime
                  </li>
                </ul>
                <Button 
                  onClick={() => setShowProModal(true)}
                  className="w-full h-11 2xl:h-12 rounded-xl text-sm"
                  size="lg"
                >
                  <Crown className="h-4 w-4 mr-2" />
                  Upgrade to Pro
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* PRO USER: Discovery Experience */}
        {showProDiscovery && (
          <div className="space-y-6">
            <InlineFilters onFiltersChange={handleFiltersChange} activeTab={activeTab} />
            
            {/* Filter Results */}
            {isFilterSearching && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Discovering...</p>
                </div>
              </div>
            )}
            
            {!isFilterSearching && filterResults.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-6 w-1 bg-primary rounded-full" />
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Results</h2>
                    <p className="text-xs text-muted-foreground">{filterResults.length} found</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2 2xl:gap-4">
                  {filterResults.map((item) => renderMediaCard(item))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Search Results - Optimized grid for mobile */}
        {(searchTerm || genreParam) && (
          <div className="py-4 2xl:py-6">
            {isSearching ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Searching...</p>
                </div>
              </div>
            ) : !hasResults ? (
              <div className="text-center py-12">
                <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
                  <SearchIcon className="h-7 w-7 text-muted-foreground/50" />
                </div>
                <p className="text-sm text-muted-foreground">No results for "{searchTerm || getGenreName(genreParam)}"</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-6 w-1 bg-primary rounded-full" />
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">
                      {genreParam ? `${getGenreName(genreParam)} Movies` : 'Results'}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {searchResults.length} found
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2 2xl:gap-4">
                  {searchResults.map((item) => renderMediaCard(item))}
                </div>
              </div>
            )}
          </div>
        )}
        </div>
      </div>
      
      <Navigation />
      
      <ProUpgradeModal 
        isOpen={showProModal} 
        onClose={() => setShowProModal(false)}
        feature="Pro Discovery"
        description="Unlock advanced filters, genre browsing, and personalized recommendations"
      />
    </div>
  );
};

export default Search;