
import { HeroSection } from "@/components/HeroSection";
import { SwipeableMovieCarousel } from "@/components/SwipeableMovieCarousel";
import { SwipeableTVCarousel } from "@/components/SwipeableTVCarousel";
import { MovieStats } from "@/components/MovieStats";
import { QuickGenres } from "@/components/QuickGenres";
import { Navigation } from "@/components/Navigation";
import { NewThisMonth } from "@/components/NewThisMonth";
import { FreshPicks } from "@/components/FreshPicks";
import { LatestTrailers } from "@/components/LatestTrailers";

const Index = () => {
    return (
      <div className="min-h-screen bg-background m-0 p-0">
        {/* Hero Section */}
        <HeroSection />

        {/* Content Sections - Enhanced with TV shows */}
        <div className="container mx-auto px-1 md:px-4 py-8 space-y-12 pb-32">
          {/* Quick Stats */}
          <MovieStats />
          
          {/* Genre Navigation */}
          <QuickGenres />

          {/* New Dynamic Content Sections */}
          <NewThisMonth />
          <FreshPicks />
          <LatestTrailers />
        </div>

        {/* Footer - Mobile optimized */}
        <footer className="bg-cinema-charcoal border-t border-border py-8 mb-24">
          <div className="container mx-auto px-1 md:px-4 text-center">
            <h3 className="text-xl font-cinematic text-foreground mb-3 tracking-wide">
              CINE<span className="text-cinema-red">SCOPE</span>
            </h3>
            <p className="text-muted-foreground text-sm">
              Discover, Save, and Experience Movies & TV Shows Like Never Before
            </p>
          </div>
        </footer>

        {/* Mobile Navigation */}
        <Navigation />
      </div>
  );
};

export default Index;
