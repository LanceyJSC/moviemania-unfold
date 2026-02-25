
import { useState, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { HeroSection } from "@/components/HeroSection";
import { BecauseYouLoved } from "@/components/BecauseYouLoved";
import { Navigation } from "@/components/Navigation";
import { DesktopHeader } from "@/components/DesktopHeader";
import { MobileBrandHeader } from "@/components/MobileBrandHeader";
import { NewThisMonth } from "@/components/NewThisMonth";
import { FreshPicks } from "@/components/FreshPicks";
import { LatestTrailers } from "@/components/LatestTrailers";
import { FallbackHomepage } from "@/components/FallbackHomepage";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PullToRefresh } from "@/components/PullToRefresh";
import { PWAInstallBanner } from "@/components/PWAInstallBanner";
import { SEOHead } from "@/components/SEOHead";

const Index = () => {
  const [hasError, setHasError] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Uncaught error on homepage:', event.error);
      setHasError(true);
    };

    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('error', handleError);
    };
  }, []);

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries();
  }, [queryClient]);

  return (
    <ErrorBoundary fallback={<FallbackHomepage />}>
      <div className="min-h-screen bg-background w-full max-w-full overflow-x-hidden">
        <SEOHead 
          title="SceneBurn - Track, Rate & Discover Movies and TV Shows"
          description="Your personal movie and TV show tracker. Rate films, build watchlists, discover new favorites, and connect with fellow cinephiles."
          url="/"
        />
        <h1 className="sr-only">SceneBurn - Track, Rate & Discover Movies and TV Shows You Love</h1>
        <DesktopHeader />
        <MobileBrandHeader />
        <PullToRefresh onRefresh={handleRefresh}>
          <ErrorBoundary>
            <HeroSection />
          </ErrorBoundary>

          <div className="px-3 sm:px-4 md:px-6 pt-1 sm:pt-2 pb-28 sm:pb-32 md:pb-12 space-y-4 sm:space-y-8 max-w-7xl mx-auto">
            <ErrorBoundary>
              <BecauseYouLoved />
            </ErrorBoundary>

            <ErrorBoundary>
              <NewThisMonth />
            </ErrorBoundary>
            
            <ErrorBoundary>
              <FreshPicks />
            </ErrorBoundary>
            
            <ErrorBoundary>
              <LatestTrailers />
            </ErrorBoundary>
          </div>
        </PullToRefresh>
        
        <Navigation />
        <PWAInstallBanner />
      </div>
    </ErrorBoundary>
  );
};

export default Index;
