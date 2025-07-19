import { useState } from "react";
import { Tv, Star, Calendar, TrendingUp, Play } from "lucide-react";
import { TVGrid } from "@/components/TVGrid";
import { Navigation } from "@/components/Navigation";
import { FeaturedHero } from "@/components/FeaturedHero";
import { Button } from "@/components/ui/button";
import { MobileHeader } from "@/components/MobileHeader";

const TVShows = () => {
  const [activeFilter, setActiveFilter] = useState("all");

  const filterButtons = [
    { id: "all", label: "All Shows", icon: Tv },
    { id: "popular", label: "Popular", icon: TrendingUp },
    { id: "airing_today", label: "Airing Today", icon: Play },
    { id: "on_the_air", label: "On The Air", icon: Calendar },
    { id: "top_rated", label: "Top Rated", icon: Star },
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
    <div className="min-h-screen bg-background safe-top safe-bottom">
      <MobileHeader title="TV Shows" />
      
      {/* Hero-style gradient background */}
      <div className="relative bg-gradient-to-br from-cinema-black via-cinema-charcoal to-cinema-black">
        {/* Mobile-optimized filter buttons */}
        <div className="sticky top-16 z-40 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3">
        <div className="flex overflow-x-auto space-x-2 scrollbar-hide pb-1">
          {filterButtons.map((filter) => {
            const Icon = filter.icon;
            return (
              <Button
                key={filter.id}
                variant={activeFilter === filter.id ? "default" : "outline"}
                size="sm"
                className={`flex-shrink-0 touch-target ${
                  activeFilter === filter.id 
                    ? "bg-cinema-red text-white" 
                    : "bg-transparent border-border text-foreground"
                }`}
                onClick={() => setActiveFilter(filter.id)}
              >
                <Icon className="h-4 w-4 mr-2" />
                {filter.label}
              </Button>
            );
          })}
        </div>
        </div>

        {/* Content - Mobile optimized */}
        <div className="pb-20 space-y-6"> {/* Bottom padding for navigation */}
          {/* Featured Hero Section - Mobile height */}
          <div className="mobile-hero">
            <FeaturedHero type="tv" />
          </div>

          {/* TV Shows Grid - Mobile spacing */}
          <div className="mobile-section">
            <TVGrid 
              title={getFilterTitle(activeFilter)} 
              category={activeFilter as "all" | "popular" | "airing_today" | "on_the_air" | "top_rated"} 
            />
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <Navigation />
    </div>
  );
};

export default TVShows;