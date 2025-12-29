
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

const Index = () => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100);

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

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries();
  }, [queryClient]);

  if (hasError) {
    return <FallbackHomepage />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cinema-red mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading SceneBurn...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary fallback={<FallbackHomepage />}>
      <div className="min-h-screen bg-background">
        <DesktopHeader />
        <MobileBrandHeader />
        <PullToRefresh onRefresh={handleRefresh}>
          <ErrorBoundary>
            <HeroSection />
          </ErrorBoundary>

          <div className="px-3 sm:px-4 2xl:px-6 pt-1 sm:pt-2 pb-28 sm:pb-32 2xl:pb-12 space-y-4 sm:space-y-8 max-w-7xl mx-auto">
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
