
import { useState } from "react";
import { Heart, Clock, Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MovieCard } from "@/components/MovieCard";

// Mock watchlist data - will be replaced with user data later
const mockWatchlistData = {
  watchLater: [
    {
      id: 1,
      title: "Dune: Part Two",
      poster: "https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=400&h=600&fit=crop",
      year: "2024",
      rating: "8.6",
      genre: "Sci-Fi"
    },
    {
      id: 2,
      title: "Oppenheimer",
      poster: "https://images.unsplash.com/photo-1509647084632-bc2540fba87a?w=400&h=600&fit=crop",
      year: "2023",
      rating: "8.4",
      genre: "Drama"
    }
  ],
  liked: [
    {
      id: 3,
      title: "The Dark Knight",
      poster: "https://images.unsplash.com/photo-1509647084632-bc2540fba87a?w=400&h=600&fit=crop",
      year: "2008",
      rating: "9.0",
      genre: "Action"
    },
    {
      id: 4,
      title: "Inception",
      poster: "https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=400&h=600&fit=crop",
      year: "2010",
      rating: "8.8",
      genre: "Thriller"
    }
  ],
  currentlyWatching: [
    {
      id: 5,
      title: "Breaking Bad",
      poster: "https://images.unsplash.com/photo-1509647084632-bc2540fba87a?w=400&h=600&fit=crop",
      year: "2008",
      rating: "9.5",
      genre: "Crime"
    }
  ]
};

const Watchlist = () => {
  const [activeTab, setActiveTab] = useState<'watchLater' | 'liked' | 'currentlyWatching'>('watchLater');

  const tabs = [
    { id: 'watchLater', label: 'Watch Later', icon: Clock, data: mockWatchlistData.watchLater },
    { id: 'liked', label: 'Liked Movies', icon: Heart, data: mockWatchlistData.liked },
    { id: 'currentlyWatching', label: 'Currently Watching', icon: Eye, data: mockWatchlistData.currentlyWatching }
  ];

  const activeTabData = tabs.find(tab => tab.id === activeTab);

  return (
    <div className="min-h-screen bg-background">
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
          {activeTabData && activeTabData.data.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {activeTabData.data.map((movie) => (
                <div key={movie.id} className="relative group">
                  <MovieCard movie={movie} size="medium" />
                  
                  {/* Action Overlay */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      className="h-8 w-8 p-0 bg-destructive/80 backdrop-blur-sm"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {activeTab === 'currentlyWatching' && (
                    <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <Button 
                        size="sm" 
                        className="w-full bg-cinema-green/80 backdrop-blur-sm text-xs"
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
              <Button className="bg-cinema-red hover:bg-cinema-red/90">
                Browse Movies
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Watchlist;
