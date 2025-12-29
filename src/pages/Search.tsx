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
      const discoverParams: any = {
        sortBy: filters.sortBy || 'popularity.desc',
        page: 1
      };
      
      if (filters.genres && filters.genres.length > 0) {
        discoverParams.genre = filters.genres[0];
      }
      
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
      
      // Apply mood genre if set and no explicit genre selected
      if (filters.mood && filters.mood !== 'any' && !discoverParams.genre) {
        const moodGenres = moodGenreMap[filters.mood];
        if (moodGenres && moodGenres.length > 0) {
          discoverParams.genre = moodGenres[0];
        }
      }
      
      // Apply tone genre if set and no explicit genre selected
      if (filters.tone && filters.tone !== 'any' && !discoverParams.genre) {
        const toneGenres = toneGenreMap[filters.tone];
        if (toneGenres && toneGenres.length > 0) {
          discoverParams.genre = toneGenres[0];
        }
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
      
      // Handle pacing filter - map to runtime ranges
      if (filters.pacing && filters.pacing !== 'any') {
        const pacingRanges: { [key: string]: [number, number] } = {
          'slow': [150, 300],
          'moderate': [90, 150],
          'fast': [60, 100]
        };
        const pacingRange = pacingRanges[filters.pacing];
        if (pacingRange && !discoverParams.runtimeFrom) {
          discoverParams.runtimeFrom = pacingRange[0];
          discoverParams.runtimeTo = pacingRange[1];
        }
      }

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
  const showEmptyState = !searchTerm && !genreParam && !hasResults && filterResults.length === 0 && !isFilterSearching;
  const showProDiscovery = isProUser && !searchTerm && !genreParam;

  return (
    <div className="min-h-screen bg-background pb-32 2xl:pb-12">
      <DesktopHeader />
      <MobileBrandHeader />
      
      {/* Hero Search Section */}
      <div className="relative overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.08),transparent_70%)]" />
        
        <div className="relative max-w-7xl mx-auto px-4 2xl:px-6 pt-8 pb-6">
          {/* Title */}
          {!searchTerm && !genreParam && filterResults.length === 0 && (
            <div className="text-center mb-8">
              <h1 className="font-cinematic text-4xl md:text-5xl text-foreground tracking-wider mb-3">
                DISCOVER
              </h1>
              <p className="text-muted-foreground text-lg max-w-md mx-auto">
                Find your next favorite movie or TV show
              </p>
            </div>
          )}
          
          {/* Search Input */}
          <div className="max-w-2xl mx-auto">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition duration-300" />
              <div className="relative">
                <Input
                  type="search"
                  placeholder="Search movies, TV shows, actors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="rounded-xl pl-12 pr-12 h-14 text-base bg-card border-border/50 focus:border-primary/50 shadow-lg"
                />
                <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSearch}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-10 w-10 rounded-full hover:bg-muted"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Media Type Tabs - Always visible */}
      <div className="max-w-2xl mx-auto px-4 py-4">
        <div className="flex gap-2 bg-card/50 backdrop-blur-sm rounded-xl p-1.5 border border-border/30">
          <Button
            variant={activeTab === 'all' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('all')}
            className="flex-1 rounded-lg h-10 text-sm font-medium"
          >
            All
          </Button>
          <Button
            variant={activeTab === 'movies' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('movies')}
            className="flex-1 rounded-lg h-10 text-sm font-medium gap-2"
          >
            <Film className="h-4 w-4" />
            Movies
          </Button>
          <Button
            variant={activeTab === 'tv' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('tv')}
            className="flex-1 rounded-lg h-10 text-sm font-medium gap-2"
          >
            <Tv className="h-4 w-4" />
            TV Shows
          </Button>
        </div>
      </div>

      {/* Genre Header for Pro users */}
      {isProUser && genreParam && !searchTerm && (
        <div className="max-w-7xl mx-auto px-4 2xl:px-6 py-6">
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
      <div className="max-w-7xl mx-auto px-4 2xl:px-6">
        
        {/* Empty State for FREE users */}
        {showEmptyState && !isProUser && (
          <div className="py-16">
            <div className="max-w-md mx-auto text-center">
              <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-6">
                <SearchIcon className="h-10 w-10 text-muted-foreground/50" />
              </div>
              <h2 className="text-2xl font-semibold text-foreground mb-3">
                Start Searching
              </h2>
              <p className="text-muted-foreground mb-10">
                Type in the search box above to find movies and TV shows
              </p>
              
              {/* Pro Upgrade Card */}
              <div className="bg-gradient-to-br from-card via-card to-primary/5 border border-border/50 rounded-2xl p-8 text-left">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Unlock Pro Discovery</h3>
                    <p className="text-sm text-muted-foreground">Advanced filters & recommendations</p>
                  </div>
                </div>
                <ul className="space-y-2 mb-6 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Browse by genre, mood, and era
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Filter by rating and runtime
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Personalized recommendations
                  </li>
                </ul>
                <Button 
                  onClick={() => setShowProModal(true)}
                  className="w-full h-12 rounded-xl"
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
          <div className="py-6 space-y-8">
            <InlineFilters onFiltersChange={handleFiltersChange} />
            
            {/* Filter Results */}
            {isFilterSearching && (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent mx-auto mb-4" />
                  <p className="text-muted-foreground">Discovering movies...</p>
                </div>
              </div>
            )}
            
            {!isFilterSearching && filterResults.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="h-8 w-1 bg-primary rounded-full" />
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">Discovery Results</h2>
                    <p className="text-sm text-muted-foreground">{filterResults.length} movies found</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-5">
                  {filterResults.map((item) => renderMediaCard(item))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Search Results */}
        {(searchTerm || genreParam) && (
          <div className="py-6">
            {isSearching ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent mx-auto mb-4" />
                  <p className="text-muted-foreground">Searching...</p>
                </div>
              </div>
            ) : !hasResults ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                  <SearchIcon className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <p className="text-muted-foreground">No results found for "{searchTerm || getGenreName(genreParam)}"</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="h-8 w-1 bg-primary rounded-full" />
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">
                      {genreParam ? `${getGenreName(genreParam)} Movies` : 'Search Results'}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-5">
                  {searchResults.map((item) => renderMediaCard(item))}
                </div>
              </div>
            )}
          </div>
        )}
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