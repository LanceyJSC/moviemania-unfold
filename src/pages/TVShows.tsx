import { useState } from "react";
import { Tv, Star, Calendar, TrendingUp, Play } from "lucide-react";
import { TVGrid } from "@/components/TVGrid";
import { Navigation } from "@/components/Navigation";
import { FeaturedHero } from "@/components/FeaturedHero";
import { Button } from "@/components/ui/button";
import { MediaSearch } from "@/components/MediaSearch";
import { QuickGenres } from "@/components/QuickGenres";

const TVShows = () => {
  const [activeFilter, setActiveFilter] = useState("all");

  const filterButtons = [
    { id: "all", label: "All", icon: Tv },
    { id: "popular", label: "Popular", icon: TrendingUp },
    { id: "airing_today", label: "Today", icon: Play },
    { id: "on_the_air", label: "On Air", icon: Calendar },
    { id: "top_rated", label: "Top", icon: Star },
  ];

  const getFilterTitle = (filterId: string) => {
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

  return (
    <div className="min-h-screen bg-background">
      {/* Featured Hero Section - Full width */}
      <FeaturedHero type="tv" />

      {/* Content container */}
      <div className="relative">
        {/* Content */}
        <div className="container mx-auto px-4 md:px-6 py-6 space-y-6 pb-32">
          {/* Search Bar */}
          <MediaSearch type="tv" />

          {/* Genres */}
          <QuickGenres mediaType="tv" />
          <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm py-4 px-4 md:px-6">
            <div className="flex justify-between space-x-1 sm:space-x-2">
              {filterButtons.map((filter) => {
                const Icon = filter.icon;
                return (
                   <Button
                     key={filter.id}
                     variant={activeFilter === filter.id ? "default" : "outline"}
                     size="sm"
                     className={`flex-1 h-9 sm:h-10 text-xs sm:text-sm font-medium transition-all duration-200 active:scale-95 rounded-xl sm:rounded-2xl touch-target focus-ring ${
                       activeFilter === filter.id 
                         ? "bg-cinema-red text-white shadow-md" 
                         : "bg-card/60 border-border/50 text-foreground hover:bg-card/80"
                     }`}
                     onClick={() => setActiveFilter(filter.id)}
                   >
                    <div className="flex flex-col items-center">
                      <Icon className="h-3 w-3 sm:h-4 sm:w-4 mb-0.5" />
                      <span className="text-xs leading-none">{filter.label}</span>
                    </div>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* TV Shows Grid */}
          <TVGrid 
            title={getFilterTitle(activeFilter)} 
            category={activeFilter as "all" | "popular" | "airing_today" | "on_the_air" | "top_rated"} 
          />
        </div>
        
        {/* Bottom gradient blend */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none z-20" />
      </div>

      {/* Mobile Navigation */}
      <Navigation />
    </div>
  );
};

export default TVShows;