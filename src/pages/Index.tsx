
import { HeroSection } from "@/components/HeroSection";
import { MovieStats } from "@/components/MovieStats";
import { QuickGenres } from "@/components/QuickGenres";
import { IOSTabBar } from "@/components/IOSTabBar";
import { NewThisMonth } from "@/components/NewThisMonth";
import { FreshPicks } from "@/components/FreshPicks";
import { LatestTrailers } from "@/components/LatestTrailers";

const Index = () => {
  return (
    <div className="ios-app-container">
      {/* Hero Section - Full width, proper aspect ratio */}
      <HeroSection />

      {/* Content Sections - iOS Compatible Layout */}
      <div className="ios-content-area space-y-8">
        {/* Quick Stats - Consistent padding */}
        <div className="px-4 pt-6">
          <MovieStats />
        </div>
        
        {/* Genre Navigation - Full width scroll */}
        <QuickGenres />

        {/* Dynamic Content Sections - Consistent spacing */}
        <div className="px-4 space-y-8">
          <NewThisMonth />
          <FreshPicks />
          <LatestTrailers />
        </div>
      </div>

      {/* iOS-style Tab Bar - Fixed positioning */}
      <IOSTabBar />
    </div>
  );
};

export default Index;
