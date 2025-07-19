
import { useState, useEffect } from "react";
import { Search, Mic, Camera, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { tmdbService } from "@/lib/tmdb";
import heroBackdrop from "@/assets/hero-backdrop.jpg";

export const HeroSection = () => {
  const [currentMovie, setCurrentMovie] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [featuredMovies, setFeaturedMovies] = useState([
    {
      id: 1,
      title: "Loading...",
      backdrop: heroBackdrop,
      description: "Discover amazing movies and shows",
      year: "2024",
      rating: "8.0"
    }
  ]);

  useEffect(() => {
    const loadTrendingMovies = async () => {
      try {
        const response = await tmdbService.getTrendingMovies('day');
        const movies = response.results.slice(0, 5).map(movie => ({
          id: movie.id,
          title: movie.title,
          backdrop: tmdbService.getBackdropUrl(movie.backdrop_path),
          description: movie.overview,
          year: movie.release_date ? new Date(movie.release_date).getFullYear().toString() : '2024',
          rating: movie.vote_average.toFixed(1)
        }));
        setFeaturedMovies(movies);
      } catch (error) {
        console.error('Failed to load trending movies:', error);
      }
    };
    loadTrendingMovies();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentMovie((prev) => (prev + 1) % featuredMovies.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [featuredMovies.length]);

  const movie = featuredMovies[currentMovie];

  return (
    <div className="relative overflow-hidden h-[70vh]">
      {/* Hero Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-all duration-1000"
        style={{ 
          backgroundImage: `url(${movie.backdrop})`,
          backgroundBlendMode: 'overlay'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-cinema-black via-cinema-black/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-cinema-black via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Mobile Header - Only Branding */}
        <header className="flex items-center justify-center p-4">
          <h1 className="font-cinematic text-foreground tracking-wider text-2xl">
            CINE<span className="text-cinema-red">SCOPE</span>
          </h1>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="max-w-4xl w-full">
            {/* Search Section */}
            <div className="text-center mb-8 animate-fade-in">
              <h2 className="font-cinematic text-foreground mb-4 text-3xl tracking-wide">
                DISCOVER
              </h2>
              <p className="text-muted-foreground mb-8 max-w-2xl mx-auto text-sm px-2">
                Search millions of movies and TV shows. Find your next favorite film.
              </p>
              
              {/* Search Bar */}
              <div className="relative max-w-2xl mx-auto">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Search for movies or TV shows..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 pr-20 bg-card/50 backdrop-blur-sm border-border focus:border-cinema-red transition-all duration-300 py-4 text-base"
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-1">
                    <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-foreground p-2">
                      <Mic className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-foreground p-2">
                      <Camera className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Featured Movie Info */}
            <div className="text-center animate-scale-in">
              <div className="flex items-center justify-center space-x-4 mb-4">
                <span className="text-cinema-gold font-semibold text-base">★ {movie.rating}</span>
                <span className="text-muted-foreground text-sm">{movie.year}</span>
              </div>
              <h3 className="font-cinematic text-foreground mb-4 tracking-wide text-xl">
                {movie.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed max-w-2xl text-sm mb-6 px-4 line-clamp-3">
                {movie.description}
              </p>
              <div className="flex flex-col gap-3 px-4">
                <Button className="bg-cinema-red hover:bg-cinema-red/90 text-white font-semibold w-full py-3 text-base">
                  <Play className="mr-2 h-5 w-5" />
                  Watch Trailer
                </Button>
                <Button variant="outline" className="border-border hover:bg-card w-full py-3 text-base">
                  Learn More
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Movie Indicators */}
        <div className="flex justify-center space-x-2 pb-6">
          {featuredMovies.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentMovie(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentMovie
                  ? 'bg-cinema-red shadow-glow'
                  : 'bg-muted hover:bg-muted-foreground'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
