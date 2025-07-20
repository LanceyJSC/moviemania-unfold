
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { MovieCard } from "@/components/MovieCard";
import { MobileHeader } from "@/components/MobileHeader";
import { IOSTabBar } from "@/components/IOSTabBar";
import { tmdbService, Movie } from "@/lib/tmdb";
import { Button } from "@/components/ui/button";

const CategoryPage = () => {
  const { category } = useParams<{ category: string }>();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [seenMovieIds] = useState(new Set<number>());

  const getCategoryTitle = (cat: string) => {
    switch (cat) {
      case 'trending':
        return 'TRENDING NOW';
      case 'popular':
        return 'POPULAR MOVIES';
      case 'top_rated':
        return 'TOP RATED MOVIES';
      case 'upcoming':
        return 'UPCOMING RELEASES';
      default:
        return 'MOVIES';
    }
  };

  useEffect(() => {
    // Reset state when category changes
    setMovies([]);
    setPage(1);
    setHasMore(true);
    seenMovieIds.clear();
    loadMovies(1, true);
  }, [category]);

  const loadMovies = async (pageNumber: number, isInitial: boolean = false) => {
    if (!category) return;
    
    if (isInitial) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      let response;
      switch (category) {
        case "trending":
          // Fixed: Use page parameter for trending movies
          response = await tmdbService.getTrendingMovies();
          // For trending, we simulate pagination by slicing results
          const startIndex = (pageNumber - 1) * 20;
          const endIndex = startIndex + 20;
          response.results = response.results.slice(startIndex, endIndex);
          break;
        case "popular":
          response = await tmdbService.getPopularMovies(pageNumber);
          break;
        case "top_rated":
          response = await tmdbService.getTopRatedMovies(pageNumber);
          break;
        case "upcoming":
          response = await tmdbService.getUpcomingMovies(pageNumber);
          break;
        default:
          response = await tmdbService.getPopularMovies(pageNumber);
      }
      
      // Filter out duplicates
      const newMovies = response.results.filter(movie => {
        if (seenMovieIds.has(movie.id)) {
          return false;
        }
        seenMovieIds.add(movie.id);
        return true;
      });
      
      if (isInitial) {
        setMovies(newMovies);
      } else {
        setMovies(prev => [...prev, ...newMovies]);
      }
      
      // Check if we have more pages (limit to 10 pages max)
      setHasMore(
        newMovies.length > 0 && 
        pageNumber < Math.min(response.total_pages || 1, 10) &&
        (category !== "trending" || pageNumber < 3) // Trending has limited results
      );
    } catch (error) {
      console.error(`Failed to load ${category} movies:`, error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (!isLoadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadMovies(nextPage, false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <MobileHeader title={getCategoryTitle(category || '')} />
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-cinema-red" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <MobileHeader title={getCategoryTitle(category || '')} />
      
      <div className="container mx-auto px-4 py-6">
        <div className="poster-grid-responsive mb-8">
          {movies.map((movie, index) => (
            <MovieCard 
              key={`${movie.id}-${index}`}
              movie={tmdbService.formatMovieForCard(movie)} 
            />
          ))}
        </div>

        {hasMore && (
          <div className="text-center">
            <Button
              onClick={loadMore}
              disabled={isLoadingMore}
              className="bg-cinema-red hover:bg-cinema-red/80 text-white px-8 py-3"
            >
              {isLoadingMore ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                'Load More'
              )}
            </Button>
          </div>
        )}
      </div>
      
      <IOSTabBar />
    </div>
  );
};

export default CategoryPage;
