import { useState, useEffect } from "react";
import { Search, Mic, Camera, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DesktopNavigation } from "./DesktopNavigation";
import { tmdbService } from "@/lib/tmdb";
import { useIsMobile } from "@/hooks/use-mobile";
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
  const isMobile = useIsMobile();

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
    <div className={`relative overflow-hidden ${isMobile ? 'h-[75vh]' : 'h-screen'}`}>
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
        {/* Header */}
        <header className={`flex items-center justify-between ${isMobile ? 'p-4' : 'p-6'}`}>
          <div className="flex items-center space-x-2">
            <h1 className={`font-cinematic text-foreground tracking-wider ${isMobile ? 'text-2xl' : 'text-3xl'}`}>
              CINE<span className="text-cinema-red">SCOPE</span>
            </h1>
          </div>
          
          {/* Desktop Navigation */}
          <DesktopNavigation />
        </header>

        {/* Main Content */}
        <div className={`flex-1 flex items-center justify-center ${isMobile ? 'px-4' : 'px-6'}`}>
          <div className="max-w-4xl w-full">
            {/* Search Section */}
            <div className="text-center mb-8 md:mb-16 animate-fade-in">
              <h2 className={`font-cinematic text-foreground mb-4 ${isMobile ? 'text-4xl' : 'text-5xl md:text-7xl'} tracking-wide`}>
                DISCOVER
              </h2>
              <p className={`text-muted-foreground mb-8 md:mb-12 max-w-2xl mx-auto ${isMobile ? 'text-base px-2' : 'text-xl'}`}>
                Search millions of movies and TV shows. Find your next favorite film.
              </p>
              
              {/* Search Bar */}
              <div className="relative max-w-2xl mx-auto">
                <div className="relative">
                  <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground ${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
                  <Input
                    type="text"
                    placeholder="Search for movies or TV shows..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`pl-12 pr-20 bg-card/50 backdrop-blur-sm border-border focus:border-cinema-red transition-all duration-300 ${
                      isMobile ? 'py-4 text-base' : 'py-6 text-lg'
                    }`}
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
            <div className="text-left animate-scale-in">
              <div className={`flex items-center space-x-4 mb-4 ${isMobile ? 'justify-center lg:justify-start' : ''}`}>
                <span className={`text-cinema-gold font-semibold ${isMobile ? 'text-base' : 'text-lg'}`}>★ {movie.rating}</span>
                <span className={`text-muted-foreground ${isMobile ? 'text-sm' : ''}`}>{movie.year}</span>
              </div>
              <h3 className={`font-cinematic text-foreground mb-4 tracking-wide ${
                isMobile ? 'text-2xl text-center lg:text-left' : 'text-4xl md:text-6xl'
              }`}>
                {movie.title}
              </h3>
              <p className={`text-muted-foreground leading-relaxed max-w-2xl ${
                isMobile ? 'text-sm mb-6 text-center lg:text-left line-clamp-3' : 'text-lg mb-8'
              }`}>
                {movie.description}
              </p>
              <div className={`flex gap-4 ${isMobile ? 'flex-col sm:flex-row justify-center lg:justify-start' : 'space-x-4'}`}>
                <Button className={`bg-cinema-red hover:bg-cinema-red/90 text-white font-semibold ${
                  isMobile ? 'w-full sm:w-auto px-6 py-3 text-base' : 'px-8 py-6 text-lg'
                }`}>
                  <Play className="mr-2 h-5 w-5" />
                  Watch Trailer
                </Button>
                <Button variant="outline" className={`border-border hover:bg-card ${
                  isMobile ? 'w-full sm:w-auto px-6 py-3 text-base' : 'px-8 py-6 text-lg'
                }`}>
                  Learn More
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Movie Indicators */}
        <div className={`flex justify-center space-x-2 ${isMobile ? 'pb-6' : 'pb-8'}`}>
          {featuredMovies.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentMovie(index)}
              className={`rounded-full transition-all duration-300 ${
                isMobile ? 'w-2 h-2' : 'w-3 h-3'
              } ${
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
