import { useState, useEffect } from "react";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { tmdbService, Movie } from "@/lib/tmdb";
import { useTrailerContext } from "@/contexts/TrailerContext";
import { cn } from "@/lib/utils";

const TRAILER_CATEGORIES = [
  { id: 'popular', label: 'Popular' },
  { id: 'streaming', label: 'Streaming' },
  { id: 'on_tv', label: 'On TV' },
  { id: 'for_rent', label: 'For Rent' },
  { id: 'in_theaters', label: 'In Theaters' }
] as const;

type TrailerCategory = typeof TRAILER_CATEGORIES[number]['id'];

export const LatestTrailers = () => {
  const [activeCategory, setActiveCategory] = useState<TrailerCategory>('popular');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const { setTrailerKey, setMovieTitle, setIsTrailerOpen } = useTrailerContext();

  useEffect(() => {
    const fetchTrailers = async () => {
      try {
        setLoading(true);
        const response = await tmdbService.getLatestTrailers(activeCategory);
        setMovies(response.results);
      } catch (error) {
        console.error('Error fetching trailers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrailers();
  }, [activeCategory]);

  const handlePlayTrailer = async (movie: Movie) => {
    try {
      const details = await tmdbService.getMovieDetails(movie.id);
      const trailer = details.videos?.results?.find(
        video => video.type === 'Trailer' && video.site === 'YouTube'
      );
      
      if (trailer) {
        setTrailerKey(trailer.key);
        setMovieTitle(movie.title);
        setIsTrailerOpen(true);
      }
    } catch (error) {
      console.error('Error playing trailer:', error);
    }
  };

  return (
    <section className="py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-cinematic text-foreground tracking-wide">
          LATEST TRAILERS
        </h2>
      </div>

      {/* Category Tabs */}
      <div className="flex space-x-2 mb-6 overflow-x-auto scrollbar-hide">
        {TRAILER_CATEGORIES.map((category) => (
          <Button
            key={category.id}
            variant={activeCategory === category.id ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveCategory(category.id)}
            className={cn(
              "whitespace-nowrap transition-colors",
              activeCategory === category.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {category.label}
          </Button>
        ))}
      </div>

      {/* Trailers Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="aspect-[2/3] animate-pulse bg-muted" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {movies.map((movie) => (
            <Card
              key={movie.id}
              className="group relative overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-lg aspect-[2/3]"
              onClick={() => handlePlayTrailer(movie)}
            >
              <div className="relative w-full h-full">
                <img
                  src={tmdbService.getPosterUrl(movie.poster_path, 'w500')}
                  alt={movie.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <div className="flex flex-col items-center space-y-2">
                    <Button
                      size="lg"
                      className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground p-4"
                    >
                      <Play className="h-6 w-6 fill-current" />
                    </Button>
                    <span className="text-white font-medium text-sm text-center px-2">
                      Watch Trailer
                    </span>
                  </div>
                </div>
                
                {/* Rating Badge */}
                {movie.vote_average > 0 && (
                  <Badge 
                    variant="secondary" 
                    className="absolute top-2 right-2 bg-black/70 text-white text-xs"
                  >
                    {movie.vote_average.toFixed(1)}
                  </Badge>
                )}
              </div>
              
              {/* Movie Title */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                <h3 className="text-white font-medium text-sm line-clamp-2">
                  {movie.title}
                </h3>
              </div>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
};