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
    <div className="min-h-screen bg-background">
      <MobileHeader title="TV Shows" />
      
      {/* Hero-style gradient background */}
      <div className="relative bg-gradient-to-br from-cinema-black via-cinema-charcoal to-cinema-black">
        {/* Filter Buttons */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border px-4 md:px-6 py-4 pt-8">
        <div className="flex overflow-x-auto space-x-3 scrollbar-hide">
          {filterButtons.map((filter) => {
            const Icon = filter.icon;
            return (
              <Button
                key={filter.id}
                variant={activeFilter === filter.id ? "default" : "outline"}
                size="sm"
                className={`flex-shrink-0 ${
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

        {/* Content */}
        <div className="container mx-auto px-4 md:px-6 py-8 space-y-12 pb-32">
          {/* Featured Hero Section */}
          <FeaturedHero type="tv" />

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