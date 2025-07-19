
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
      <MobileHeader title="Cinescope" showBack={false} />
      
      {/* Mobile-optimized content with proper spacing */}
      <div className="pb-20">
        <HeroSection />

        <div className="space-y-6">
          <div className="px-4 py-6">
            <MovieStats />
          </div>
          
          <div className="px-4 py-6">
            <QuickGenres />
          </div>

          <div className="px-4 py-6">
            <NewThisMonth />
          </div>

          <div className="px-4 py-6">
            <FreshPicks />
          </div>

          <div className="px-4 py-6">
            <LatestTrailers />
          </div>
        </div>

        {/* Footer - Mobile optimized */}
        <footer className="bg-cinema-charcoal border-t border-border py-6 mx-4 rounded-lg">
          <div className="text-center">
            <h3 className="mobile-subtitle text-foreground mb-2 tracking-wide">
              CINE<span className="text-cinema-red">SCOPE</span>
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
