
import { HeroSection } from "@/components/HeroSection";
import { SwipeableMovieCarousel } from "@/components/SwipeableMovieCarousel";
import { MovieStats } from "@/components/MovieStats";
import { QuickGenres } from "@/components/QuickGenres";
import { Navigation } from "@/components/Navigation";
import { NewThisMonth } from "@/components/NewThisMonth";
import { FreshPicks } from "@/components/FreshPicks";
import { TrailerProvider } from "@/contexts/TrailerContext";

const Index = () => {
  return (
    <TrailerProvider>
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <HeroSection />

        {/* Content Sections - Enhanced with new components */}
        <div className="container mx-auto px-4 py-8 space-y-12 pb-24">
          {/* Quick Stats */}
          <MovieStats />
          
          {/* Genre Navigation */}
          <QuickGenres />

          {/* New Dynamic Content Sections */}
          <NewThisMonth />
          <FreshPicks />
          
          {/* Movie Carousels */}
          <SwipeableMovieCarousel title="TRENDING NOW" category="trending" cardSize="medium" />
          <SwipeableMovieCarousel title="TOP RATED MOVIES" category="top_rated" cardSize="medium" />
          <SwipeableMovieCarousel title="POPULAR MOVIES" category="popular" cardSize="medium" />
          <SwipeableMovieCarousel title="UPCOMING RELEASES" category="upcoming" cardSize="medium" />
        </div>

        {/* Footer - Mobile optimized */}
        <footer className="bg-cinema-charcoal border-t border-border py-8 mb-24">
          <div className="container mx-auto px-4 text-center">
            <h3 className="text-xl font-cinematic text-foreground mb-3 tracking-wide">
              CINE<span className="text-cinema-red">SCOPE</span>
            </h3>
            <p className="text-muted-foreground text-sm">
              Discover, Save, and Experience Movies Like Never Before
            </p>
          </div>
        </footer>

        {/* Mobile Navigation */}
        <Navigation />
      </div>
    </TrailerProvider>
  );
};

export default Index;
