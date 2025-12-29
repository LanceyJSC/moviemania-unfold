
import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Film, Star, Calendar, TrendingUp, Play } from "lucide-react";
import { MovieGrid } from "@/components/MovieGrid";
import { InlineGenreFilter } from "@/components/InlineGenreFilter";
import { ProUpgradeModal } from "@/components/ProUpgradeModal";
import { Navigation } from "@/components/Navigation";
import { DesktopHeader } from "@/components/DesktopHeader";
import { MobileBrandHeader } from "@/components/MobileBrandHeader";
import { FeaturedHero } from "@/components/FeaturedHero";
import { MoodDiscovery } from "@/components/MoodDiscovery";
import { SurpriseMe } from "@/components/SurpriseMe";
import { Button } from "@/components/ui/button";
import { PullToRefresh } from "@/components/PullToRefresh";
import { useSubscription } from "@/hooks/useSubscription";

const Movies = () => {
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [showProModal, setShowProModal] = useState(false);
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
    <div className="min-h-screen bg-background">
      <DesktopHeader />
      <MobileBrandHeader />
      <PullToRefresh onRefresh={handleRefresh}>
        <FeaturedHero type="movie" />

        <div className="relative">
          <div className="px-4 2xl:px-6 pt-2 pb-32 2xl:pb-12 space-y-6 max-w-7xl mx-auto">
            <div className="sticky top-0 2xl:top-16 z-40 bg-background/95 backdrop-blur-sm py-4">
              <div className="flex justify-between space-x-1">
                {filterButtons.map((filter) => {
                  const Icon = filter.icon;
                  return (
                     <Button
                       key={filter.id}
                       variant={activeFilter === filter.id ? "default" : "outline"}
                       size="sm"
                       className={`flex-1 h-10 text-xs font-medium transition-all duration-200 active:scale-95 rounded-xl touch-target focus-ring ${
                         activeFilter === filter.id 
                           ? "bg-cinema-red text-white shadow-md" 
                           : "bg-card/60 border-border/50 text-foreground hover:bg-card/80"
                       }`}
                       onClick={() => {
                         setActiveFilter(filter.id);
                         setSelectedGenres([]); // Clear genre filter when changing category
                       }}
                     >
                      <div className="flex flex-col items-center">
                        <Icon className="h-3 w-3 mb-0.5" />
                        <span className="text-xs leading-none">{filter.label}</span>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Mood Discovery & Surprise Me - Pro Features */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <MoodDiscovery variant="pills" className="flex-wrap" />
              <SurpriseMe variant="button" />
            </div>

            {/* Genre Filter - Pro Only */}
            <InlineGenreFilter
              selectedGenres={selectedGenres}
              onGenreChange={setSelectedGenres}
              mediaType="movie"
              isProUser={isProUser}
              onUpgradeClick={() => setShowProModal(true)}
            />

            <MovieGrid 
              title={getFilterTitle(activeFilter)} 
              category={activeFilter as "all" | "popular" | "now_playing" | "upcoming" | "top_rated"}
              genres={selectedGenres}
            />
          </div>
          
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none z-20" />
        </div>
      </PullToRefresh>

      <ProUpgradeModal
        isOpen={showProModal}
        onClose={() => setShowProModal(false)}
        feature="Genre Filtering"
        description="Filter movies by genre to discover exactly what you're in the mood for."
      />

      <Navigation />
    </div>
  );
};

export default Movies;
