
import { HeroSection } from "@/components/HeroSection";
import { MovieStats } from "@/components/MovieStats";
import { QuickGenres } from "@/components/QuickGenres";
import { IOSTabBar } from "@/components/IOSTabBar";
import { NewThisMonth } from "@/components/NewThisMonth";
import { FreshPicks } from "@/components/FreshPicks";
import { LatestTrailers } from "@/components/LatestTrailers";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section - Mobile-first */}
      <HeroSection />

      {/* Content Sections - Mobile-optimized spacing */}
      <div className="px-4 py-6 space-y-8 pb-32">
        {/* Quick Stats - More compact on mobile */}
        <MovieStats />
        
        {/* Genre Navigation - Horizontal scroll on mobile */}
        <QuickGenres />

        {/* Dynamic Content Sections - Optimized for mobile */}
        <NewThisMonth />
        <FreshPicks />
        <LatestTrailers />
      </div>

      {/* iOS-style Tab Bar */}
      <IOSTabBar />
    </div>
  );
};

export default Index;
