
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { TrailerProvider } from "@/contexts/TrailerContext";
import { GlobalTrailerModal } from "@/components/GlobalTrailerModal";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ScrollToTop } from "@/components/ScrollToTop";
import Index from "./pages/Index";
import Search from "./pages/Search";
import Movies from "./pages/Movies";
import TVShows from "./pages/TVShows";
import TVShowDetail from "./pages/TVShowDetail";
import SeasonDetail from "./pages/SeasonDetail";
import ActorDetail from "./pages/ActorDetail";
import CategoryPage from "./pages/CategoryPage";
import Watchlist from "./pages/Watchlist";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Genres from "./pages/Genres";
import Cinemas from "./pages/Cinemas";
import CinemaDetail from "./pages/CinemaDetail";
import Notifications from "./pages/Notifications";

// Import MovieDetail separately to resolve bundling issue
import MovieDetail from "./pages/MovieDetail";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (newer React Query uses gcTime instead of cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ErrorBoundary>
            <AuthProvider>
              <ErrorBoundary>
                <TrailerProvider>
                  <Toaster />
                  <Sonner />
                  <GlobalTrailerModal />
                  <BrowserRouter>
                    <ScrollToTop />
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/search" element={<Search />} />
                      <Route path="/movies" element={<Movies />} />
                      <Route path="/tv-shows" element={<TVShows />} />
                      <Route path="/genres" element={<Genres />} />
                      <Route path="/movie/:id" element={<MovieDetail />} />
                      <Route path="/tv/:id" element={<TVShowDetail />} />
                      <Route path="/tv/:id/season/:seasonNumber" element={<SeasonDetail />} />
                      <Route path="/actor/:id" element={<ActorDetail />} />
                      <Route path="/category/:category" element={<CategoryPage />} />
                      <Route path="/watchlist" element={<Watchlist />} />
                      <Route path="/cinemas" element={<Cinemas />} />
                      <Route path="/cinema/:id" element={<CinemaDetail />} />
                      <Route path="/notifications" element={<Notifications />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="/auth" element={<Auth />} />
                      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </BrowserRouter>
                </TrailerProvider>
              </ErrorBoundary>
            </AuthProvider>
          </ErrorBoundary>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
