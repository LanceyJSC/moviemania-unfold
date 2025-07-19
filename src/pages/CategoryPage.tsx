
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { MovieCard } from "@/components/MovieCard";
import { Navigation } from "@/components/Navigation";
import { tmdbService, Movie } from "@/lib/tmdb";
import { Button } from "@/components/ui/button";

const CategoryPage = () => {
  const { category } = useParams<{ category: string }>();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

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
    const loadMovies = async () => {
      if (!category) return;
      
      setIsLoading(true);
      try {
        let response;
        switch (category) {
          case "trending":
            response = await tmdbService.getTrendingMovies();
            break;
          case "popular":
            response = await tmdbService.getPopularMovies(page);
            break;
          case "top_rated":
            response = await tmdbService.getTopRatedMovies(page);
            break;
          case "upcoming":
            response = await tmdbService.getUpcomingMovies(page);
            break;
          default:
            response = await tmdbService.getPopularMovies(page);
        }
        
        if (page === 1) {
          setMovies(response.results);
        } else {
          setMovies(prev => [...prev, ...response.results]);
        }
        
        setHasMore(page < response.total_pages && page < 10); // Limit to 10 pages
      } catch (error) {
        console.error(`Failed to load ${category} movies:`, error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMovies();
  }, [category, page]);

  const loadMore = () => {
    if (!isLoading && hasMore) {
      setPage(prev => prev + 1);
    }
  };

  if (isLoading && page === 1) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cinema-red" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="container mx-auto px-4 py-8">
        <h1 className="font-cinematic text-3xl text-foreground mb-8 tracking-wide text-center">
          {getCategoryTitle(category || '')}
        </h1>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
          {movies.map((movie) => (
            <MovieCard 
              key={movie.id} 
              movie={tmdbService.formatMovieForCard(movie)} 
              size="small" 
            />
          ))}
        </div>

        {hasMore && (
          <div className="text-center">
            <Button
              onClick={loadMore}
              disabled={isLoading}
              className="bg-cinema-red hover:bg-cinema-red/80 text-white px-8 py-3"
            >
              {isLoading ? (
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
      
      <Navigation />
    </div>
  );
};

export default CategoryPage;
