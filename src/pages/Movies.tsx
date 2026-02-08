
import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Film, Star, Calendar, TrendingUp, Play, Filter } from "lucide-react";
import { MovieGrid } from "@/components/MovieGrid";
import { DiscoveryFiltersModal } from "@/components/DiscoveryFiltersModal";
import { Navigation } from "@/components/Navigation";
import { DesktopHeader } from "@/components/DesktopHeader";
import { MobileBrandHeader } from "@/components/MobileBrandHeader";
import { FeaturedHero } from "@/components/FeaturedHero";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PullToRefresh } from "@/components/PullToRefresh";
import { SEOHead } from "@/components/SEOHead";
import { useSubscription } from "@/hooks/useSubscription";

const Movies = () => {
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const queryClient = useQueryClient();
  const { isProUser } = useSubscription();

  const filterButtons = [
    { id: "all", label: "All", icon: Film },
    { id: "popular", label: "Popular", icon: TrendingUp },
    { id: "now_playing", label: "Playing", icon: Play },
    { id: "upcoming", label: "Soon", icon: Calendar },
    { id: "top_rated", label: "Top", icon: Star },
  ];

  const getFilterTitle = (filterId: string) => {
    if (selectedGenres.length > 0) {
      return "FILTERED MOVIES";
    }
    switch (filterId) {
      case "all":
        return "ALL MOVIES";
      case "popular":
        return "POPULAR MOVIES";
      case "now_playing":
        return "NOW PLAYING";
      case "upcoming":
        return "UPCOMING RELEASES";
      case "top_rated":
        return "TOP RATED MOVIES";
      default:
        return "ALL MOVIES";
    }
  };

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['movies'] });
  }, [queryClient]);

  return (
    <div className="min-h-screen bg-background w-full max-w-full overflow-x-hidden">
      <SEOHead 
        title="Browse Movies - Popular, Now Playing & Upcoming | SceneBurn"
        description="Discover popular movies, now playing in theaters, upcoming releases, and top rated films. Track and rate your favorites on SceneBurn."
        url="/movies"
      />
      <DesktopHeader />
      <MobileBrandHeader />
      <PullToRefresh onRefresh={handleRefresh}>
        <FeaturedHero type="movie" />

        <div className="relative">
          <div className="px-4 2xl:px-6 pt-2 pb-32 2xl:pb-12 space-y-4 2xl:space-y-6 max-w-7xl mx-auto">
            <div className="sticky top-0 2xl:top-16 z-40 bg-background/95 backdrop-blur-sm py-3 2xl:py-4">
              <div className="flex gap-1.5">
                {filterButtons.map((filter) => {
                  const Icon = filter.icon;
                  return (
                     <Button
                       key={filter.id}
                       variant={activeFilter === filter.id ? "default" : "outline"}
                       size="sm"
                       className={`flex-1 h-9 2xl:h-10 text-xs font-medium transition-all duration-200 active:scale-95 rounded-lg 2xl:rounded-xl touch-manipulation ${
                         activeFilter === filter.id 
                           ? "bg-cinema-red text-white shadow-md" 
                           : "bg-card/60 border-border/50 text-foreground hover:bg-card/80"
                       }`}
                       onClick={() => {
                         setActiveFilter(filter.id);
                         setSelectedGenres([]);
                       }}
                     >
                      <Icon className="h-3.5 w-3.5 2xl:mr-1" />
                      <span className="hidden 2xl:inline text-xs">{filter.label}</span>
                    </Button>
                  );
                })}
                
                {/* Discovery Filters Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFiltersModal(true)}
                  className={`h-9 2xl:h-10 px-3 text-xs font-medium transition-all duration-200 active:scale-95 rounded-lg 2xl:rounded-xl touch-manipulation ${
                    selectedGenres.length > 0
                      ? "bg-cinema-gold text-cinema-black border-cinema-gold"
                      : "bg-card/60 border-border/50 text-foreground hover:bg-card/80"
                  }`}
                >
                  <Filter className="h-3.5 w-3.5 2xl:mr-1" />
                  <span className="hidden 2xl:inline text-xs">Filters</span>
                  {selectedGenres.length > 0 && (
                    <Badge className="ml-1 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-cinema-red text-white">
                      {selectedGenres.length}
                    </Badge>
                  )}
                </Button>
              </div>
            </div>

            <MovieGrid 
              title={getFilterTitle(activeFilter)} 
              category={activeFilter as "all" | "popular" | "now_playing" | "upcoming" | "top_rated"}
              genres={selectedGenres}
            />
          </div>
          
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none z-20" />
        </div>
      </PullToRefresh>

      <DiscoveryFiltersModal
        isOpen={showFiltersModal}
        onClose={() => setShowFiltersModal(false)}
        mediaType="movie"
        selectedGenres={selectedGenres}
        onGenreChange={setSelectedGenres}
      />

      <Navigation />
    </div>
  );
};

export default Movies;
