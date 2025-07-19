import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Play, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { tmdbService, Movie } from "@/lib/tmdb";
import { useIsMobile } from "@/hooks/use-mobile";

export const HeroSection = () => {
  const [heroMovie, setHeroMovie] = useState<Movie | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    const loadHeroMovie = async () => {
      try {
        const trending = await tmdbService.getTrendingMovies();
        if (trending.results && trending.results.length > 0) {
          // Select a random movie from the trending list
          const randomIndex = Math.floor(Math.random() * trending.results.length);
          setHeroMovie(trending.results[randomIndex]);
        }
      } catch (error) {
        console.error("Failed to load hero movie:", error);
      }
    };

    loadHeroMovie();
  }, []);

  if (!heroMovie) {
    return (
      <div className="relative h-[60vh] md:h-[75vh] lg:h-[90vh] bg-gradient-to-b from-cinema-charcoal to-cinema-black flex items-center justify-center">
        <div className="text-center text-foreground">
          <h1 className="font-cinematic text-4xl md:text-5xl lg:text-6xl tracking-wide mb-4">
            Welcome to CINESCOPE
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl">
            Discover and explore your favorite movies.
          </p>
        </div>
      </div>
    );
  }

  const heroBackdrop = tmdbService.getBackdropUrl(heroMovie.backdrop_path, 'original');

  return (
    <div className="relative h-[60vh] md:h-[75vh] lg:h-[90vh] text-foreground">
      {/* Hero Background with lighter overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroBackdrop})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-cinema-black/60 via-cinema-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-cinema-black/70 via-transparent to-transparent" />
      </div>

      {/* Hero Content */}
      <div className="relative z-10 flex flex-col justify-center items-start h-full p-8 md:p-12 lg:p-20">
        <h1 className="font-cinematic text-4xl md:text-5xl lg:text-6xl tracking-wide mb-4">
          {heroMovie.title}
        </h1>
        <p className="text-lg md:text-xl mb-6 line-clamp-3 md:line-clamp-4">
          {heroMovie.overview}
        </p>
        <div className="flex">
          <Link to={`/movie/${heroMovie.id}`}>
            <Button className="mr-4">
              <Play className="mr-2 h-4 w-4" />
              Watch Now
            </Button>
          </Link>
          <Link to={`/movie/${heroMovie.id}`}>
            <Button variant="outline">
              <Info className="mr-2 h-4 w-4" />
              More Info
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
