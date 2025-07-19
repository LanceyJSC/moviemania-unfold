import { useState } from "react";
import { Film, Star, Calendar, TrendingUp } from "lucide-react";
import { SwipeableMovieCarousel } from "@/components/SwipeableMovieCarousel";
import { Navigation } from "@/components/Navigation";
import { MovieStats } from "@/components/MovieStats";
import { Button } from "@/components/ui/button";
import { MobileHeader } from "@/components/MobileHeader";

const Movies = () => {
  const [activeFilter, setActiveFilter] = useState("all");

  const filterButtons = [
    { id: "all", label: "All Movies", icon: Film },
    { id: "trending", label: "Trending", icon: TrendingUp },
    { id: "top_rated", label: "Top Rated", icon: Star },
    { id: "upcoming", label: "Upcoming", icon: Calendar },
  ];

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader title="Movies" />
      
      {/* Hero-style gradient background */}
      <div className="relative bg-gradient-to-br from-cinema-black via-cinema-charcoal to-cinema-black">
        {/* Filter Buttons */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border p-4 pt-8">
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
        <div className="container mx-auto px-1 md:px-4 py-8 space-y-12 pb-24">
          {/* Movie Stats */}
          <MovieStats />

        {/* Movie Carousels based on active filter */}
        {activeFilter === "all" && (
          <>
            <SwipeableMovieCarousel title="TRENDING NOW" category="trending" cardSize="medium" />
            <SwipeableMovieCarousel title="TOP RATED" category="top_rated" cardSize="medium" />
            <SwipeableMovieCarousel title="POPULAR" category="popular" cardSize="medium" />
            <SwipeableMovieCarousel title="UPCOMING RELEASES" category="upcoming" cardSize="medium" />
          </>
        )}

        {activeFilter === "trending" && (
          <>
            <SwipeableMovieCarousel title="TRENDING THIS WEEK" category="trending" cardSize="medium" />
            <SwipeableMovieCarousel title="POPULAR RIGHT NOW" category="popular" cardSize="medium" />
          </>
        )}

        {activeFilter === "top_rated" && (
          <>
            <SwipeableMovieCarousel title="HIGHEST RATED" category="top_rated" cardSize="medium" />
            <SwipeableMovieCarousel title="CRITICALLY ACCLAIMED" category="popular" cardSize="medium" />
          </>
        )}

        {activeFilter === "upcoming" && (
          <>
            <SwipeableMovieCarousel title="COMING SOON" category="upcoming" cardSize="medium" />
            <SwipeableMovieCarousel title="POPULAR MOVIES" category="popular" cardSize="medium" />
          </>
          )}
        </div>
        
        {/* Bottom gradient blend */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none z-20" />
      </div>

      {/* Mobile Navigation */}
      <Navigation />
    </div>
  );
};

export default Movies;