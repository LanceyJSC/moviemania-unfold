

import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProfileProvider } from "@/contexts/ProfileContext";
import { TrailerProvider } from "@/contexts/TrailerContext";
import { UserStateProvider } from "@/contexts/UserStateContext";
import { GlobalTrailerModal } from "@/components/GlobalTrailerModal";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ScrollToTop } from "@/components/ScrollToTop";
import Index from "./pages/Index";
import Search from "./pages/Search";
import Movies from "./pages/Movies";
import TVShows from "./pages/TVShows";
import TVShowDetail from "./pages/TVShowDetail";
import SeasonDetail from "./pages/SeasonDetail";
import EpisodeDetail from "./pages/EpisodeDetail";
import TVShowReviews from "./pages/TVShowReviews";
import MovieReviews from "./pages/MovieReviews";
import ActorDetail from "./pages/ActorDetail";
import CategoryPage from "./pages/CategoryPage";
import Collection from "./pages/Collection";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Genres from "./pages/Genres";
import Notifications from "./pages/Notifications";
import { Recommendations } from "./pages/Recommendations";
import Members from "./pages/Members";
import UserProfile from "./pages/UserProfile";
import Lists from "./pages/Lists";
import ListDetail from "./pages/ListDetail";
import Activity from "./pages/Activity";
import MyReviews from "./pages/MyReviews";
import Stats from "./pages/Stats";
import Achievements from "./pages/Achievements";

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
              <ProfileProvider>
                <ErrorBoundary>
                  <UserStateProvider>
                    <TrailerProvider>
          
                      <GlobalTrailerModal />
                      <BrowserRouter>
                        <ScrollToTop />
                        <Routes>
                          <Route path="/" element={<Index />} />
                          <Route path="/search" element={<Search />} />
                          <Route path="/movies" element={<Movies />} />
                          <Route path="/tv-shows" element={<TVShows />} />
                          <Route path="/genres" element={<Genres />} />
                          <Route path="/movie/:id/reviews" element={<MovieReviews />} />
                          <Route path="/movie/:id" element={<MovieDetail />} />
                          <Route path="/tv/:id/reviews" element={<TVShowReviews />} />
                          <Route path="/tv/:id/season/:seasonNumber/episode/:episodeNumber" element={<EpisodeDetail />} />
                          <Route path="/tv/:id/season/:seasonNumber" element={<SeasonDetail />} />
                          <Route path="/tv/:id" element={<TVShowDetail />} />
                          <Route path="/actor/:id" element={<ActorDetail />} />
                          <Route path="/category/:category" element={<CategoryPage />} />
                          <Route path="/collection" element={<Collection />} />
                          <Route path="/notifications" element={<Notifications />} />
                          <Route path="/recommendations" element={<Recommendations />} />
                          <Route path="/profile" element={<Profile />} />
                          <Route path="/members" element={<Members />} />
                          <Route path="/user/:username" element={<UserProfile />} />
                          <Route path="/lists" element={<Lists />} />
                          <Route path="/lists/:id" element={<ListDetail />} />
                          <Route path="/activity" element={<Activity />} />
                          <Route path="/my-reviews" element={<MyReviews />} />
                          <Route path="/stats" element={<Stats />} />
                          <Route path="/achievements" element={<Achievements />} />
                          <Route path="/auth" element={<Auth />} />
                          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </BrowserRouter>
                    </TrailerProvider>
                  </UserStateProvider>
                </ErrorBoundary>
              </ProfileProvider>
            </AuthProvider>
          </ErrorBoundary>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;

