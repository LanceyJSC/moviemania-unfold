
import { useState } from "react";
import { Search as SearchIcon, Mic, Camera, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MovieCard } from "@/components/MovieCard";

// Mock search results - will be replaced with API data later
const mockSearchResults = [
  {
    id: 1,
    title: "The Dark Knight",
    poster: "https://images.unsplash.com/photo-1509647084632-bc2540fba87a?w=400&h=600&fit=crop",
    year: "2008",
    rating: "9.0",
    genre: "Action"
  },
  {
    id: 2,
    title: "Inception",
    poster: "https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=400&h=600&fit=crop",
    year: "2010",
    rating: "8.8",
    genre: "Thriller"
  },
  {
    id: 3,
    title: "Interstellar",
    poster: "https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=400&h=600&fit=crop",
    year: "2014",
    rating: "8.7",
    genre: "Sci-Fi"
  }
];

const Search = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

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
              <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-foreground">
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
              {searchQuery ? `Results for "${searchQuery}"` : 'Popular searches'}
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Genre</label>
                  <select className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground">
                    <option>All Genres</option>
                    <option>Action</option>
                    <option>Drama</option>
                    <option>Comedy</option>
                    <option>Sci-Fi</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Release Year</label>
                  <select className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground">
                    <option>Any Year</option>
                    <option>2024</option>
                    <option>2023</option>
                    <option>2022</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Rating</label>
                  <select className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground">
                    <option>Any Rating</option>
                    <option>9+ Stars</option>
                    <option>8+ Stars</option>
                    <option>7+ Stars</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {mockSearchResults.map((movie) => (
            <MovieCard key={movie.id} movie={movie} size="medium" />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Search;
