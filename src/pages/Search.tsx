
import { useState, useEffect } from "react";
import { Search as SearchIcon, Mic, Camera, Filter, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MovieCard } from "@/components/MovieCard";
import { tmdbService, Movie } from "@/lib/tmdb";
import { useToast } from "@/hooks/use-toast";

const Search = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [genres, setGenres] = useState<{ id: number; name: string }[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedRating, setSelectedRating] = useState<string>("");
  const { toast } = useToast();

  // Load genres on component mount
  useEffect(() => {
    const loadGenres = async () => {
      try {
        const response = await tmdbService.getGenres();
        setGenres(response.genres);
      } catch (error) {
        console.error('Failed to load genres:', error);
      }
    };
    loadGenres();
  }, []);

  // Perform search when query changes
  useEffect(() => {
    const performSearch = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await tmdbService.searchMovies(searchQuery);
        setSearchResults(response.results);
      } catch (error) {
        console.error('Search failed:', error);
        toast({
          title: "Search Error",
          description: "Failed to search movies. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(performSearch, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, toast]);

  // Voice search functionality
  const startVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast({
        title: "Voice Search Unavailable",
        description: "Your browser doesn't support voice search.",
        variant: "destructive",
      });
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setSearchQuery(transcript);
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
      toast({
        title: "Voice Search Error",
        description: "Could not recognize speech. Please try again.",
        variant: "destructive",
      });
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  // Apply filters
  const applyFilters = async () => {
    if (!searchQuery.trim() && !selectedGenre && !selectedYear && !selectedRating) return;

    setIsLoading(true);
    try {
      const filters: any = {};
      if (selectedGenre) filters.genre = parseInt(selectedGenre);
      if (selectedYear) filters.year = parseInt(selectedYear);
      if (selectedRating) filters.rating = parseInt(selectedRating);

      let response;
      if (searchQuery.trim()) {
        response = await tmdbService.searchMovies(searchQuery);
      } else {
        response = await tmdbService.discoverMovies(filters);
      }
      
      setSearchResults(response.results);
    } catch (error) {
      console.error('Filter search failed:', error);
      toast({
        title: "Filter Error",
        description: "Failed to apply filters. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedGenre("");
    setSelectedYear("");
    setSelectedRating("");
    if (searchQuery.trim()) {
      // Re-search without filters
      tmdbService.searchMovies(searchQuery).then(response => {
        setSearchResults(response.results);
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <h1 className="text-2xl font-cinematic text-foreground tracking-wide">
            CINE<span className="text-cinema-red">SCOPE</span>
          </h1>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Search Section */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="relative mb-6">
            <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input
              type="text"
              placeholder="Search for movies or TV shows..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-24 py-6 text-lg bg-card border-border focus:border-cinema-red"
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-2">
              <Button 
                size="sm" 
                variant="ghost" 
                className={`text-muted-foreground hover:text-foreground ${isListening ? 'text-cinema-red animate-pulse' : ''}`}
                onClick={startVoiceSearch}
                disabled={isListening}
              >
                <Mic className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-foreground">
                <Camera className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Filter Toggle */}
          <div className="flex justify-between items-center mb-6">
            <p className="text-muted-foreground">
              {searchQuery ? `Results for "${searchQuery}" (${searchResults.length} found)` : 'Popular searches'}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="border-border hover:bg-card"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>

          {/* Filters Section */}
          {showFilters && (
            <div className="bg-card border border-border rounded-lg p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Genre</label>
                  <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                    <SelectTrigger className="bg-background border-border">
                      <SelectValue placeholder="All Genres" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Genres</SelectItem>
                      {genres.map((genre) => (
                        <SelectItem key={genre.id} value={genre.id.toString()}>
                          {genre.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Release Year</label>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger className="bg-background border-border">
                      <SelectValue placeholder="Any Year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any Year</SelectItem>
                      {Array.from({ length: 20 }, (_, i) => new Date().getFullYear() - i).map(year => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Rating</label>
                  <Select value={selectedRating} onValueChange={setSelectedRating}>
                    <SelectTrigger className="bg-background border-border">
                      <SelectValue placeholder="Any Rating" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any Rating</SelectItem>
                      <SelectItem value="8">8+ Stars</SelectItem>
                      <SelectItem value="7">7+ Stars</SelectItem>
                      <SelectItem value="6">6+ Stars</SelectItem>
                      <SelectItem value="5">5+ Stars</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear
                </Button>
                <Button size="sm" onClick={applyFilters}>
                  Apply Filters
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Results Grid */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-cinema-red" />
            <span className="ml-2 text-muted-foreground">Searching movies...</span>
          </div>
        ) : searchResults.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {searchResults.map((movie) => (
              <MovieCard 
                key={movie.id} 
                movie={tmdbService.formatMovieForCard(movie)} 
                size="medium" 
              />
            ))}
          </div>
        ) : searchQuery.trim() ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">No movies found for "{searchQuery}"</p>
            <p className="text-sm text-muted-foreground mt-2">Try different keywords or browse our recommendations</p>
          </div>
        ) : (
          <div className="text-center py-12">
            <SearchIcon className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">Start typing to search for movies</p>
            <p className="text-sm text-muted-foreground mt-2">Or use voice search by clicking the microphone</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
