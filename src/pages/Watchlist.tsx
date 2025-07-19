import { useState, useEffect } from "react";
import { Heart, Clock, Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MovieCard } from "@/components/MovieCard";
import { Navigation } from "@/components/Navigation";
import { MobileHeader } from "@/components/MobileHeader";
import { useSupabaseUserState } from "@/hooks/useSupabaseUserState";
import { useAuth } from "@/hooks/useAuth";
import { tmdbService, Movie } from "@/lib/tmdb";
import { Link } from "react-router-dom";

const Watchlist = () => {
  const [activeTab, setActiveTab] = useState<'watchLater' | 'liked' | 'currentlyWatching'>('watchLater');
  const { user } = useAuth();
  const { userState, toggleWatchlist, toggleLike, toggleCurrentlyWatching } = useSupabaseUserState();
  const [movies, setMovies] = useState<{
    watchLater: any[];
    liked: any[];
    currentlyWatching: any[];
  }>({
    watchLater: [],
    liked: [],
    currentlyWatching: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadMovieDetails = async () => {
      setIsLoading(true);
      try {
        const [watchLaterMovies, likedMovies, currentlyWatchingMovies] = await Promise.all([
          Promise.all(userState.watchlist.map(id => tmdbService.getMovieDetails(id).catch(() => null))),
          Promise.all(userState.likedMovies.map(id => tmdbService.getMovieDetails(id).catch(() => null))),
          Promise.all(userState.currentlyWatching.map(id => tmdbService.getMovieDetails(id).catch(() => null)))
        ]);

        setMovies({
          watchLater: watchLaterMovies.filter(Boolean).map(movie => tmdbService.formatMovieForCard(movie as Movie)),
          liked: likedMovies.filter(Boolean).map(movie => tmdbService.formatMovieForCard(movie as Movie)),
          currentlyWatching: currentlyWatchingMovies.filter(Boolean).map(movie => tmdbService.formatMovieForCard(movie as Movie))
        });
      } catch (error) {
        console.error('Failed to load watchlist movies:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMovieDetails();
  }, [userState]);

  const tabs = [
    { id: 'watchLater', label: 'Watch Later', icon: Clock, data: movies.watchLater },
    { id: 'liked', label: 'Liked Movies', icon: Heart, data: movies.liked },
    { id: 'currentlyWatching', label: 'Currently Watching', icon: Eye, data: movies.currentlyWatching }
  ];

  const activeTabData = tabs.find(tab => tab.id === activeTab);

  const handleRemoveFromList = async (movieId: number) => {
    const movie = activeTabData?.data.find(m => m.id === movieId);
    if (!movie) return;

    switch (activeTab) {
      case 'watchLater':
        await toggleWatchlist(movieId, movie.title, movie.poster);
        break;
      case 'liked':
        await toggleLike(movieId, movie.title, movie.poster);
        break;
      case 'currentlyWatching':
        await toggleCurrentlyWatching(movieId, movie.title, movie.poster);
        break;
    }
  };

  const handleMarkAsWatched = async (movieId: number) => {
    const movie = activeTabData?.data.find(m => m.id === movieId);
    if (!movie) return;
    await toggleCurrentlyWatching(movieId, movie.title, movie.poster);
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      <MobileHeader title="My Watchlist" />
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-8">
          <h1 className="text-4xl font-cinematic text-foreground tracking-wide mb-2">
            MY WATCHLIST
          </h1>
          <p className="text-muted-foreground">Manage your movie collection</p>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 border-b border-border">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-t-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-cinema-red text-white border-b-2 border-cinema-red'
                    : 'text-muted-foreground hover:text-foreground hover:bg-card'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
                <span className="bg-muted text-muted-foreground px-2 py-1 rounded-full text-xs">
                  {tab.data.length}
                </span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div>
          {!user ? (
            <div className="text-center py-16">
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Sign in to view your watchlist
              </h3>
              <p className="text-muted-foreground mb-6">
                Create an account to save and organize your movies
              </p>
              <Link to="/auth">
                <Button className="bg-cinema-red hover:bg-cinema-red/90">
                  Sign In
                </Button>
              </Link>
            </div>
          ) : isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="w-48 h-72 bg-muted animate-pulse rounded-lg"></div>
              ))}
            </div>
          ) : activeTabData && activeTabData.data.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {activeTabData.data.map((movie) => (
                <div key={movie.id} className="relative group">
                  <MovieCard movie={movie} size="medium" />
                  
                  {/* Action Overlay */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      className="h-8 w-8 p-0 bg-destructive/80 backdrop-blur-sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleRemoveFromList(movie.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {activeTab === 'currentlyWatching' && (
                    <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                      <Button 
                        size="sm" 
                        className="w-full bg-cinema-green/80 backdrop-blur-sm text-xs"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleMarkAsWatched(movie.id);
                        }}
                      >
                        Mark as Watched
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="mb-4">
                {activeTabData && <activeTabData.icon className="h-16 w-16 text-muted-foreground mx-auto" />}
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                No movies in {activeTabData?.label.toLowerCase()}
              </h3>
              <p className="text-muted-foreground mb-6">
                Start adding movies to build your collection
              </p>
              <Link to="/search">
                <Button className="bg-cinema-red hover:bg-cinema-red/90">
                  Browse Movies
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Navigation */}
      <Navigation />
    </div>
  );
};

export default Watchlist;
