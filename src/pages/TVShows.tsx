import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Tv, Star, Calendar, TrendingUp, Play, Filter } from "lucide-react";
import { TVGrid } from "@/components/TVGrid";
import { DiscoveryFiltersModal } from "@/components/DiscoveryFiltersModal";
import { Navigation } from "@/components/Navigation";
import { DesktopHeader } from "@/components/DesktopHeader";
import { MobileBrandHeader } from "@/components/MobileBrandHeader";
import { FeaturedHero } from "@/components/FeaturedHero";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PullToRefresh } from "@/components/PullToRefresh";
import { useSubscription } from "@/hooks/useSubscription";

const TVShows = () => {
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const queryClient = useQueryClient();
  const { isProUser } = useSubscription();

  const filterButtons = [
    { id: "all", label: "All", icon: Tv },
    { id: "popular", label: "Popular", icon: TrendingUp },
    { id: "airing_today", label: "Today", icon: Play },
    { id: "on_the_air", label: "On Air", icon: Calendar },
    { id: "top_rated", label: "Top", icon: Star },
  ];

  const getFilterTitle = (filterId: string) => {
    if (selectedGenres.length > 0) {
      return "FILTERED TV SHOWS";
    }
    switch (filterId) {
      case "all":
        return "ALL TV SHOWS";
      case "popular":
        return "POPULAR TV SHOWS";
      case "airing_today":
        return "AIRING TODAY";
      case "on_the_air":
        return "ON THE AIR";
      case "top_rated":
        return "TOP RATED TV SHOWS";
      default:
        return "ALL TV SHOWS";
    }
  };

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['tv-shows'] });
  }, [queryClient]);

  return (
    <div className="min-h-screen bg-background w-full max-w-full overflow-x-hidden">
      <DesktopHeader />
      <MobileBrandHeader />
      <PullToRefresh onRefresh={handleRefresh}>
        <FeaturedHero type="tv" />

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

            <TVGrid 
              title={getFilterTitle(activeFilter)} 
              category={activeFilter as "all" | "popular" | "airing_today" | "on_the_air" | "top_rated"}
              genres={selectedGenres}
            />
          </div>
          
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none z-20" />
        </div>
      </PullToRefresh>

      <DiscoveryFiltersModal
        isOpen={showFiltersModal}
        onClose={() => setShowFiltersModal(false)}
        mediaType="tv"
        selectedGenres={selectedGenres}
        onGenreChange={setSelectedGenres}
      />

      <Navigation />
    </div>
  );
};

export default TVShows;
