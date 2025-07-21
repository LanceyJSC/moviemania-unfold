
import { useState, useEffect } from "react";
import { Play, Star, Film, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { tmdbService, Movie, TVShow } from "@/lib/tmdb";
import { useTrailerContext } from "@/contexts/TrailerContext";
import { cn } from "@/lib/utils";

const TRAILER_CATEGORIES = [
  { id: 'popular', label: 'Popular' },
  { id: 'streaming', label: 'Stream' },
  { id: 'on_tv', label: 'TV' },
  { id: 'for_rent', label: 'Rent' },
  { id: 'in_theaters', label: 'Theater' }
] as const;

type TrailerCategory = typeof TRAILER_CATEGORIES[number]['id'];
type MediaItem = Movie | TVShow;

// High priority refresh - every 20 minutes for trailer content
const TRAILERS_REFRESH_INTERVAL = 20 * 60 * 1000;

export const LatestTrailers = () => {
  const [activeCategory, setActiveCategory] = useState<TrailerCategory>('popular');
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { setTrailerKey, setMovieTitle, setIsTrailerOpen } = useTrailerContext();

  const fetchTrailers = async (forceFresh: boolean = true) => {
    try {
      setLoading(true);
      console.log(`Fetching FRESH trailers for category: ${activeCategory} - Force fresh: ${forceFresh}`);
      const response = await tmdbService.getLatestTrailers(activeCategory, forceFresh);
      console.log(`Received ${response.results.length} fresh items for ${activeCategory}`);
      setItems(response.results);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching trailers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrailers(true);
  }, [activeCategory]);

  // High priority refresh every 20 minutes for Latest Trailers
  useEffect(() => {
    console.log(`Setting up trailers auto-refresh for ${activeCategory} every 20 minutes`);
    const refreshInterval = setInterval(() => {
      console.log(`Auto-refreshing trailers for ${activeCategory} - Priority content update`);
      fetchTrailers(true);
    }, TRAILERS_REFRESH_INTERVAL);

    return () => clearInterval(refreshInterval);
  }, [activeCategory]);

  // Refresh when app regains focus
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log(`App regained focus - Refreshing trailers for ${activeCategory}`);
        fetchTrailers(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [activeCategory]);

  const handlePlayTrailer = async (item: MediaItem) => {
    try {
      const isMovie = 'title' in item;
      const details = isMovie 
        ? await tmdbService.getMovieDetails(item.id, true)
        : await tmdbService.getTVShowDetails(item.id, true);
      
      const trailer = details.videos?.results?.find(
        video => video.type === 'Trailer' && video.site === 'YouTube'
      );
      
      if (trailer) {
        setTrailerKey(trailer.key);
        setMovieTitle(isMovie ? item.title : item.name);
        setIsTrailerOpen(true);
      }
    } catch (error) {
      console.error('Error playing trailer:', error);
    }
  };

  const getItemTitle = (item: MediaItem) => {
    return 'title' in item ? item.title : item.name;
  };

  const getItemYear = (item: MediaItem) => {
    const date = 'release_date' in item ? item.release_date : item.first_air_date;
    return date ? new Date(date).getFullYear() : 'TBA';
  };

  return (
    <div className="mb-12 pt-4">
      <div className="bg-background rounded-t-2xl rounded-b-2xl -mx-4 px-4 py-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Film className="h-8 w-8 text-primary" />
            <h2 className="font-cinematic text-3xl text-foreground tracking-wide">
              LATEST TRAILERS
            </h2>
            <Video className="h-8 w-8 text-primary" />
          </div>
          <p className="text-muted-foreground mb-2">
            Watch the newest trailers across all categories - Live updates every 20 minutes
          </p>
          {lastUpdated && (
            <p className="text-xs text-muted-foreground mb-4">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
          <div className="w-16 h-0.5 bg-primary mx-auto"></div>
        </div>

        {/* Mobile-First Category Tabs - Single Line */}
        <div className="mb-6">
          <div className="flex justify-between space-x-1 sm:space-x-2 max-w-2xl mx-auto">
            {TRAILER_CATEGORIES.map((category) => (
              <Button
                key={category.id}
                variant={activeCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveCategory(category.id)}
                className={cn(
                  "flex-1 h-9 sm:h-10 text-xs sm:text-sm font-medium transition-all duration-200 active:scale-95",
                  "touch-target focus-ring rounded-xl",
                  activeCategory === category.id
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-card/60 border-border/50 text-muted-foreground hover:text-foreground hover:bg-card/80"
                )}
              >
                {category.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Trailers Grid */}
        {loading ? (
          <div className="flex space-x-3 overflow-x-auto scrollbar-hide">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex-shrink-0 w-32 h-48 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="flex space-x-3 overflow-x-auto scrollbar-hide pb-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="group relative overflow-hidden bg-card border-border hover:border-cinema-red transition-all duration-300 transform hover:scale-105 hover:shadow-glow cursor-pointer flex-shrink-0 w-32 h-48 rounded-lg"
                onClick={() => handlePlayTrailer(item)}
              >
                <div className="w-full h-full relative">
                  <img
                    src={tmdbService.getPosterUrl(item.poster_path, 'w500')}
                    alt={getItemTitle(item)}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110 rounded-lg"
                    loading="lazy"
                  />
                  
                  {/* gradient overlays, play button, item info */}
                  <div className="absolute inset-0 rounded-lg">
                    <div className="absolute inset-0 bg-gradient-to-r from-cinema-black/20 via-cinema-black/10 to-transparent rounded-lg" />
                    <div className="absolute inset-0 bg-gradient-to-t from-cinema-black/30 via-transparent to-transparent rounded-lg" />
                  </div>
                  
                  <div className="absolute inset-0 transition-opacity duration-300 opacity-0 group-hover:opacity-100 rounded-lg">
                    <div className="absolute inset-0 bg-gradient-to-r from-cinema-black/30 via-cinema-black/15 to-transparent rounded-lg" />
                    <div className="absolute inset-0 bg-gradient-to-t from-cinema-black/40 via-transparent to-transparent rounded-lg" />
                  </div>
                  
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center rounded-lg">
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
                  
                  {item.vote_average > 0 && (
                    <div className="absolute top-2 left-2 bg-cinema-black/80 backdrop-blur-sm rounded-full px-2 py-1 flex items-center space-x-1">
                      <Star className="h-3 w-3 text-cinema-gold fill-current" />
                      <span className="text-foreground font-semibold text-xs">{item.vote_average.toFixed(1)}</span>
                    </div>
                  )}
                  
                  <div className="absolute bottom-0 left-0 right-0 p-3 transition-opacity duration-300 opacity-0 group-hover:opacity-100">
                    <h3 className="text-foreground font-semibold mb-1 line-clamp-2 text-sm">
                      {getItemTitle(item)}
                    </h3>
                    <div className="flex items-center justify-between text-muted-foreground text-xs">
                      <span>{getItemYear(item)}</span>
                      <span className="truncate ml-2">Trailer</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
