import { useState } from "react";
import { Film, Star, Calendar, TrendingUp, Play } from "lucide-react";
import { MovieGrid } from "@/components/MovieGrid";
import { IOSTabBar } from "@/components/IOSTabBar";
import { MovieStats } from "@/components/MovieStats";
import { FeaturedHero } from "@/components/FeaturedHero";
import { Button } from "@/components/ui/button";
import { MobileHeader } from "@/components/MobileHeader";

const Movies = () => {
  const [activeFilter, setActiveFilter] = useState("all");

  const filterButtons = [
    { id: "all", label: "All Movies", icon: Film },
    { id: "popular", label: "Popular", icon: TrendingUp },
    { id: "now_playing", label: "Now Playing", icon: Play },
    { id: "upcoming", label: "Upcoming", icon: Calendar },
    { id: "top_rated", label: "Top Rated", icon: Star },
  ];

  const getFilterTitle = (filterId: string) => {
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

  return (
    <div className="ios-app-container">
      <MobileHeader title="Movies" />
      
      {/* Filter Buttons */}
      <div className="sticky top-14 z-40 bg-background/95 backdrop-blur-sm border-b border-border px-4 md:px-6 py-4">
        <div className="flex overflow-x-auto space-x-3 ios-horizontal-scroll">
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
      <div className="ios-content-area bg-gradient-to-br from-cinema-black via-cinema-charcoal to-cinema-black">
        <div className="container mx-auto px-4 md:px-6 py-8 space-y-12">
          {/* Featured Hero Section */}
          <FeaturedHero type="movie" />

          {/* Movies Grid */}
          <MovieGrid 
            title={getFilterTitle(activeFilter)} 
            category={activeFilter as "all" | "popular" | "now_playing" | "upcoming" | "top_rated"} 
          />
        </div>
        
        {/* Bottom gradient blend */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none z-20" />
      </div>

      {/* iOS Tab Bar */}
      <IOSTabBar />
    </div>
  );
};

export default Movies;