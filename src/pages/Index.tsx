
import { HeroSection } from "@/components/HeroSection";
import { SwipeableMovieCarousel } from "@/components/SwipeableMovieCarousel";
import { SwipeableTVCarousel } from "@/components/SwipeableTVCarousel";
import { MovieStats } from "@/components/MovieStats";
import { QuickGenres } from "@/components/QuickGenres";
import { Navigation } from "@/components/Navigation";
import { NewThisMonth } from "@/components/NewThisMonth";
import { FreshPicks } from "@/components/FreshPicks";
import { LatestTrailers } from "@/components/LatestTrailers";
import { MobileHeader } from "@/components/MobileHeader";

const Index = () => {
  return (
    <div className="min-h-screen bg-background safe-top safe-bottom">
      <MobileHeader title="MovieMania" showBack={false} />
      
      {/* Mobile-optimized content with proper spacing */}
      <div className="pb-20 space-y-6"> {/* Bottom padding for navigation */}
        {/* Hero Section - Reduced height for mobile */}
        <div className="mobile-hero">
          <HeroSection />
        </div>

        {/* Content Sections with mobile spacing */}
        <div className="mobile-section">
          <MovieStats />
        </div>
        
        <div className="mobile-section">
          <QuickGenres />
        </div>

        <div className="mobile-section">
          <NewThisMonth />
        </div>

        <div className="mobile-section">
          <FreshPicks />
        </div>

        <div className="mobile-section">
          <LatestTrailers />
        </div>

        {/* Footer - Mobile optimized */}
        <footer className="bg-cinema-charcoal border-t border-border py-6 mx-4 rounded-lg">
          <div className="text-center">
            <h3 className="mobile-subtitle text-foreground mb-2 tracking-wide">
              MOVIE<span className="text-cinema-red">MANIA</span>
            </h3>
            <p className="mobile-caption">
              Discover Movies & TV Shows
            </p>
          </div>
        </footer>
      </div>

      {/* Mobile Navigation */}
      <Navigation />
    </div>
  );
};

export default Index;
