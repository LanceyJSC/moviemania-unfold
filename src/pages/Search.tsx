import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Search as SearchIcon, X, TrendingUp, Film, Tv, ArrowRight, Crown, Sparkles } from "lucide-react";
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
        // All users can filter by media type
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
    // Skip if all filters are at default values
    const isDefault = 
      filters.genres.length === 0 &&
      filters.yearRange[0] === 1900 && filters.yearRange[1] === new Date().getFullYear() &&
      filters.ratingRange[0] === 0 && filters.ratingRange[1] === 10 &&
      filters.runtimeRange[0] === 0 && filters.runtimeRange[1] === 300 &&
      filters.mood.length === 0 &&
      filters.tone.length === 0 &&
      filters.pacing === 'any' &&
      filters.era === 'any' &&
      filters.language === 'any';
    
    if (isDefault) {
      setFilterResults([]);
      return;
    }

    setIsFilterSearching(true);
    try {
      // Build discover query based on filters
      const discoverParams: any = {
        sortBy: filters.sortBy || 'popularity.desc',
        page: 1
      };
      
      if (filters.genres && filters.genres.length > 0) {
        discoverParams.genre = filters.genres[0];
      }
      
      if (filters.yearRange[0] > 1900 || filters.yearRange[1] < new Date().getFullYear()) {
        discoverParams.yearFrom = filters.yearRange[0];
        discoverParams.yearTo = filters.yearRange[1];
      }
      
      if (filters.ratingRange[0] > 0 || filters.ratingRange[1] < 10) {
        discoverParams.voteAverageFrom = filters.ratingRange[0];
        discoverParams.voteAverageTo = filters.ratingRange[1];
      }
      
      if (filters.runtimeRange[0] > 0 || filters.runtimeRange[1] < 300) {
        discoverParams.runtimeFrom = filters.runtimeRange[0];
        discoverParams.runtimeTo = filters.runtimeRange[1];
      }
      
      if (filters.language && filters.language !== 'any') {
        discoverParams.language = filters.language;
      }

      // Fetch multiple pages for more results
      const pagePromises = [];
      for (let page = 1; page <= 3; page++) {
        pagePromises.push(tmdbService.discoverMovies({ ...discoverParams, page }));
      }
      
      const allResults = await Promise.all(pagePromises);
      const combinedResults = allResults.flatMap(result => result.results);
      setFilterResults(combinedResults);
    } catch (error) {
      console.error("Filter search failed:", error);
    } finally {
      setIsFilterSearching(false);
    }
  };

  const hasResults = searchResults.length > 0;
  const showEmptyState = !searchTerm && !genreParam && !hasResults && filterResults.length === 0;

  return (
    <div className="min-h-screen bg-background pb-32 2xl:pb-12 max-h-screen overflow-y-auto">
      <DesktopHeader />
      <MobileBrandHeader />
      
      {/* Search Input - Always visible for everyone */}
      <div className="bg-card/50 backdrop-blur-sm border-b border-border/50">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="relative">
            <Input
              type="search"
              placeholder="Search for movies and TV shows..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rounded-2xl pl-12 pr-12 h-14 text-base bg-background border-border/50 focus:border-primary shadow-sm"
            />
            <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSearch}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-10 w-10 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Media Type Tabs when searching - Available to ALL users */}
      {searchTerm && (
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex space-x-2 bg-muted/30 rounded-xl p-1">
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
              className="flex-1 rounded-lg h-9 text-sm font-medium"
            >
              <Film className="h-4 w-4 mr-1.5" />
              Movies
            </Button>
            <Button
              variant={activeTab === 'tv' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('tv')}
              className="flex-1 rounded-lg h-9 text-sm font-medium"
            >
              <Tv className="h-4 w-4 mr-1.5" />
              TV Shows
            </Button>
          </div>
        </div>
      )}

      {/* PRO USERS ONLY: Genre Header */}
      {isProUser && genreParam && !searchTerm && (
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h2 className="text-2xl font-cinematic text-foreground tracking-wide">
            {getGenreName(genreParam).toUpperCase()} MOVIES
          </h2>
          <div className="w-16 h-0.5 bg-cinema-gold mt-2"></div>
        </div>
      )}

      {/* Empty State - Different for Pro vs Free */}
      {showEmptyState && (
        <div className="px-4 md:px-6 mt-8 max-w-7xl mx-auto">
          {isProUser ? (
            // PRO USER: Full discovery experience
            <div className="space-y-10">
              <div className="text-center">
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
                  <Crown className="h-4 w-4" />
                  <span className="text-sm font-medium">Pro Discovery</span>
                </div>
                <h1 className="font-cinematic text-3xl md:text-4xl text-foreground tracking-wide mb-3">
                  DISCOVER YOUR NEXT FAVORITE
                </h1>
                <p className="text-muted-foreground max-w-lg mx-auto">
                  Use the advanced filters below to find exactly what you're looking for
                </p>
              </div>

              {/* Pro Discovery Filters */}
              <InlineFilters onFiltersChange={handleFiltersChange} />
              
              {/* Filter Results */}
              {isFilterSearching && (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              )}
              {!isFilterSearching && filterResults.length > 0 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">Discovery Results</h2>
                    <p className="text-sm text-muted-foreground mt-1">{filterResults.length} results</p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-5">
                    {filterResults.map((item) => renderMediaCard(item))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            // FREE USER: Simple search prompt
            <div className="text-center py-16">
              <div className="max-w-md mx-auto">
                <SearchIcon className="h-16 w-16 text-muted-foreground/30 mx-auto mb-6" />
                <h2 className="text-2xl font-semibold text-foreground mb-3">
                  Search for Movies & TV Shows
                </h2>
                <p className="text-muted-foreground mb-8">
                  Type in the search box above to find your favorite content
                </p>
                
                {/* Upgrade CTA */}
                <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-2xl p-6">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <span className="font-semibold text-foreground">Unlock Pro Discovery</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Get advanced filters, genre browsing, and personalized recommendations
                  </p>
                  <Button 
                    onClick={() => setShowProModal(true)}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Crown className="h-4 w-4 mr-2" />
                    Upgrade to Pro
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Search Results */}
      {(searchTerm || genreParam) && (
        <div className="px-4 md:px-6 mt-6 pb-8 max-w-7xl mx-auto">
          {isSearching ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : !hasResults ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No results found for "{searchTerm || getGenreName(genreParam)}"</p>
            </div>
          ) : (
            <div>
              {/* Results Header */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-foreground">
                  {genreParam ? `${getGenreName(genreParam)} Movies` : 'Search Results'}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                </p>
              </div>
              
              {/* Results Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-5">
                {searchResults.map((item) => renderMediaCard(item))}
              </div>
            </div>
          )}
        </div>
      )}
      
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
