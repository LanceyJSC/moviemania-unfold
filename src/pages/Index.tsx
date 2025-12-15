
import { useState, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { HeroSection } from "@/components/HeroSection";
import { MovieStats } from "@/components/MovieStats";
import { QuickGenres } from "@/components/QuickGenres";
import { Navigation } from "@/components/Navigation";
import { NewThisMonth } from "@/components/NewThisMonth";
import { FreshPicks } from "@/components/FreshPicks";
import { LatestTrailers } from "@/components/LatestTrailers";
import { FallbackHomepage } from "@/components/FallbackHomepage";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PullToRefresh } from "@/components/PullToRefresh";

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
          <p className="text-muted-foreground">Loading CineScope...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary fallback={<FallbackHomepage />}>
      <PullToRefresh onRefresh={handleRefresh} className="min-h-screen bg-background">
        <ErrorBoundary>
          <HeroSection />
        </ErrorBoundary>

        <div className="px-4 py-6 space-y-8 pb-32">
          <ErrorBoundary>
            <MovieStats />
          </ErrorBoundary>
          
          <ErrorBoundary>
            <QuickGenres />
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

        <ErrorBoundary>
          <Navigation />
        </ErrorBoundary>
      </PullToRefresh>
    </ErrorBoundary>
  );
};

export default Index;
