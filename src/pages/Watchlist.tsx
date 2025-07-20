import { useState, useEffect } from "react";
import { Heart, Clock, Eye, Trash2, Filter, Grid3X3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MovieCard } from "@/components/MovieCard";
import { TVShowCard } from "@/components/TVShowCard";
import { IOSTabBar } from "@/components/IOSTabBar";
import { MobileHeader } from "@/components/MobileHeader";
import { useSupabaseUserState } from "@/hooks/useSupabaseUserState";
import { useAuth } from "@/hooks/useAuth";
import { tmdbService, Movie } from "@/lib/tmdb";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const Watchlist = () => {
  const [activeTab, setActiveTab] = useState<'watchlist' | 'liked' | 'watching'>('watchlist');
  const [scrollY, setScrollY] = useState(0);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { userState, toggleWatchlist, toggleLike } = useSupabaseUserState();
  const [movies, setMovies] = useState<{
    watchlist: any[];
    liked: any[];
    watching: any[];
  }>({
    watchlist: [],
    liked: [],
    watching: []
  });
  const [isLoading, setIsLoading] = useState(true);

  // Handle scroll for header blur effect
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    const loadMovieDetails = async () => {
      setIsLoading(true);
      try {
        const [watchlistMovies, likedMovies, watchingMovies] = await Promise.all([
          Promise.all(userState.watchlist.map(id => tmdbService.getMovieDetails(id).catch(() => null))),
          Promise.all(userState.likedMovies.map(id => tmdbService.getMovieDetails(id).catch(() => null))),
          Promise.all(userState.currentlyWatching?.map(id => tmdbService.getMovieDetails(id).catch(() => null)) || [])
        ]);

        setMovies({
          watchlist: watchlistMovies.filter(Boolean).map(movie => tmdbService.formatMovieForCard(movie as Movie)),
          liked: likedMovies.filter(Boolean).map(movie => tmdbService.formatMovieForCard(movie as Movie)),
          watching: watchingMovies.filter(Boolean).map(movie => tmdbService.formatMovieForCard(movie as Movie))
        });
      } catch (error) {
        console.error('Failed to load watchlist movies:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMovieDetails();
  }, [userState, user, navigate]);

  const getCurrentMovies = () => {
    return movies[activeTab] || [];
  };

  const getTabStats = () => {
    return {
      watchlist: movies.watchlist.length,
      liked: movies.liked.length,
      watching: movies.watching.length
    };
  };

  const handleRemoveFromWatchlist = async (movieId: number, title: string, poster: string) => {
    await toggleWatchlist(movieId, title, poster);
  };

  const stats = getTabStats();
  const currentMovies = getCurrentMovies();

  if (!user) {
    return null;
  }

  return (
    <div 
      className="min-h-screen bg-background"
      style={{ paddingBottom: 'calc(100px + env(safe-area-inset-bottom))' }}
    >
      <MobileHeader title="My Watchlist" />
      
      {/* Tab Selector */}
      <div className="sticky top-14 z-40 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-4">
        <div className="flex bg-muted/50 rounded-2xl p-1">
          {[
            { key: 'watchlist' as const, label: 'Watchlist', count: stats.watchlist },
            { key: 'liked' as const, label: 'Liked', count: stats.liked },
            { key: 'watching' as const, label: 'Watching', count: stats.watching }
          ].map((tab) => (
            <Button
              key={tab.key}
              variant={activeTab === tab.key ? "default" : "ghost"}
              size="sm"
              className={cn(
                "flex-1 rounded-xl h-10 text-sm font-medium transition-all duration-200",
                activeTab === tab.key 
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setActiveTab(tab.key)}
            >
              <div className="flex items-center gap-2">
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-xs",
                    activeTab === tab.key 
                      ? "bg-primary/20 text-primary" 
                      : "bg-muted text-muted-foreground"
                  )}>
                    {tab.count}
                  </span>
                )}
              </div>
            </Button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 space-y-6">
        {isLoading ? (
          <div className="mobile-grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[2/3] bg-muted rounded-2xl" />
                <div className="mt-2 space-y-1">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : currentMovies.length > 0 ? (
          <>
            {/* Stats */}
            <div className="flex items-center justify-between px-4">
              <p className="text-sm text-muted-foreground">
                {currentMovies.length} {currentMovies.length === 1 ? 'movie' : 'movies'}
              </p>
              <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                <Grid3X3 className="h-4 w-4 mr-2" />
                View Options
              </Button>
            </div>

            {/* Movies Grid - Consistent with other pages */}
            <div className="mobile-grid">
              {currentMovies.map((movie) => (
                <div key={movie.id} className="relative group">
                  <MovieCard
                    movie={movie}
                    size="small"
                  />
                  
                  {/* iOS-style remove button */}
                  {activeTab === 'watchlist' && (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleRemoveFromWatchlist(movie.id, movie.title, movie.poster);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          // Empty State
          <div className="text-center py-16 space-y-4">
            <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
              {activeTab === 'watchlist' && <Clock className="h-8 w-8 text-muted-foreground" />}
              {activeTab === 'liked' && <Heart className="h-8 w-8 text-muted-foreground" />}
              {activeTab === 'watching' && <Eye className="h-8 w-8 text-muted-foreground" />}
            </div>
            
            <h3 className="font-semibold text-foreground text-lg">
              {activeTab === 'watchlist' && "No movies in watchlist"}
              {activeTab === 'liked' && "No liked movies"}
              {activeTab === 'watching' && "No movies currently watching"}
            </h3>
            
            <p className="text-muted-foreground text-sm max-w-xs mx-auto">
              {activeTab === 'watchlist' && "Movies you add to your watchlist will appear here"}
              {activeTab === 'liked' && "Movies you like will appear here"}
              {activeTab === 'watching' && "Movies you're currently watching will appear here"}
            </p>
            
            <Button 
              className="mt-6"
              onClick={() => navigate('/search')}
            >
              Discover Movies
            </Button>
          </div>
        )}
      </div>

      {/* iOS Tab Bar */}
      <IOSTabBar />
    </div>
  );
};

export default Watchlist;