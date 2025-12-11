
import { useState, useEffect } from "react";
import { HeroSection } from "@/components/HeroSection";
import { MovieStats } from "@/components/MovieStats";
import { QuickGenres } from "@/components/QuickGenres";
import { Navigation } from "@/components/Navigation";
import { NewThisMonth } from "@/components/NewThisMonth";
import { FreshPicks } from "@/components/FreshPicks";
import { LatestTrailers } from "@/components/LatestTrailers";
import { FallbackHomepage } from "@/components/FallbackHomepage";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const Index = () => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simple initialization check
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100);

    // Error handling for any uncaught errors
    const handleError = (event: ErrorEvent) => {
      console.error('Uncaught error on homepage:', event.error);
      setHasError(true);
    };

    window.addEventListener('error', handleError);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('error', handleError);
    };
  }, []);

  if (hasError) {
    return <FallbackHomepage />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cinema-red mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading CineScope...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary fallback={<FallbackHomepage />}>
      <div className="min-h-screen bg-background">
        {/* Hero Section - Mobile-first */}
        <ErrorBoundary>
          <HeroSection />
        </ErrorBoundary>

        {/* Content Sections - Mobile-optimized spacing */}
        <div className="py-6 space-y-8 pb-32">
          {/* Quick Stats - More compact on mobile */}
          <div className="px-4">
            <ErrorBoundary>
              <MovieStats />
            </ErrorBoundary>
          </div>
          
          {/* Genre Navigation - Horizontal scroll on mobile */}
          <div className="px-4">
            <ErrorBoundary>
              <QuickGenres />
            </ErrorBoundary>
          </div>

          {/* Dynamic Content Sections - Full width for horizontal scroll */}
          <div className="px-4">
            <ErrorBoundary>
              <NewThisMonth />
            </ErrorBoundary>
          </div>
          
          <div className="px-4">
            <ErrorBoundary>
              <FreshPicks />
            </ErrorBoundary>
          </div>
          
          <div className="px-4">
            <ErrorBoundary>
              <LatestTrailers />
            </ErrorBoundary>
          </div>
        </div>

        {/* iOS-style Tab Bar */}
        <ErrorBoundary>
          <Navigation />
        </ErrorBoundary>
      </div>
    </ErrorBoundary>
  );
};

export default Index;
