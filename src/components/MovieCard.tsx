import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, Star, Play, Info, Plus } from "lucide-react";
import { useSupabaseUserState } from "@/hooks/useSupabaseUserState";
import { Link } from "react-router-dom";

// Support both TMDB format and legacy format for backward compatibility
interface Movie {
  id: number;
  title: string;
  // TMDB format
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  vote_average?: number;
  genre_ids?: number[];
  overview?: string;
  // Legacy format
  poster?: string;
  year?: string;
  rating?: string;
  genre?: string;
}

interface MovieCardProps {
  movie: Movie;
}

export const MovieCard = ({ movie }: MovieCardProps) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const { toggleLike, toggleWatchlist, isLiked, isInWatchlist } = useSupabaseUserState();
  const liked = isLiked(movie.id);
  const inWatchlist = isInWatchlist(movie.id);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const posterForDb = movie.poster_path || movie.poster;
    await toggleLike(movie.id, movie.title, posterForDb);
  };

  const handleWatchlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const posterForDb = movie.poster_path || movie.poster;
    await toggleWatchlist(movie.id, movie.title, posterForDb);
  };

  // Enhanced mobile image handling - support both formats
  const posterPath = movie.poster_path || movie.poster;
  const imageUrl = posterPath?.startsWith('http') 
    ? posterPath 
    : posterPath 
    ? `https://image.tmdb.org/t/p/w500${posterPath}`
    : null;

  const backdropUrl = movie.backdrop_path
    ? `https://image.tmdb.org/t/p/w780${movie.backdrop_path}`
    : null;

  const displayImage = imageUrl || backdropUrl;

  // Get rating from either format
  const rating = movie.vote_average || parseFloat(movie.rating || '0');
  
  // Get year from either format
  const year = movie.release_date 
    ? new Date(movie.release_date).getFullYear()
    : movie.year || 'TBA';

  return (
    <Link to={`/movie/${movie.id}`} className="block">
      <Card className="group overflow-hidden enhanced-card mobile-card-hover mobile-touch-feedback">
        <div className="relative aspect-[2/3] overflow-hidden mobile-image-container">
          {/* Enhanced mobile-optimized image container */}
          <div className="relative w-full h-full bg-gradient-to-br from-muted/50 to-muted">
            {displayImage && !imageError ? (
              <>
                {imageLoading && (
                  <div className="absolute inset-0 mobile-skeleton flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  </div>
                )}
                <img
                  src={displayImage}
                  alt={movie.title}
                  className={`mobile-image transition-all duration-500 ${
                    imageLoading ? 'opacity-0' : 'opacity-100'
                  } ${!movie.poster_path ? 'object-center' : ''}`}
                  onLoad={() => setImageLoading(false)}
                  onError={() => {
                    setImageError(true);
                    setImageLoading(false);
                  }}
                  loading="lazy"
                  style={{
                    filter: !movie.poster_path ? 'brightness(0.9) contrast(1.1)' : 'none',
                    objectPosition: !movie.poster_path ? 'center 30%' : 'center'
                  }}
                />
              </>
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 flex flex-col items-center justify-center p-4 text-center">
                <div className="w-12 h-12 mb-3 rounded-full bg-primary/10 flex items-center justify-center">
                  <Play className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-sm leading-tight text-foreground mb-1 high-contrast-text">
                  {movie.title}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {year}
                </p>
              </div>
            )}
          </div>

          {/* Enhanced mobile overlay with better visibility */}
          <div className="absolute inset-0 mobile-gradient-overlay opacity-0 group-hover:opacity-100 transition-all duration-300">
            <div className="absolute bottom-0 left-0 right-0 p-3 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
              <div className="backdrop-text space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-white text-xs font-medium">
                      {rating.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleLike}
                      className="h-7 w-7 p-0 hover:bg-white/20 mobile-touch-feedback"
                    >
                      <Heart
                        className={`w-4 h-4 transition-colors ${
                          liked ? "fill-red-500 text-red-500" : "text-white"
                        }`}
                      />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleWatchlist}
                      className="h-7 w-7 p-0 hover:bg-white/20 mobile-touch-feedback"
                    >
                      <Plus
                        className={`w-4 h-4 transition-colors ${
                          inWatchlist ? "text-green-500" : "text-white"
                        }`}
                      />
                    </Button>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    className="flex-1 h-7 text-xs bg-primary/90 hover:bg-primary mobile-touch-feedback"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Play className="w-3 h-3 mr-1" />
                    Watch
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 bg-white/10 border-white/20 text-white hover:bg-white/20 mobile-touch-feedback"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Info className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced rating badge for mobile */}
          <div className="absolute top-2 right-2">
            <Badge 
              variant="secondary" 
              className="text-xs bg-black/80 text-white border-white/20 backdrop-blur-sm font-semibold"
            >
              ★ {rating.toFixed(1)}
            </Badge>
          </div>
        </div>

        <CardContent className="p-3">
          <h3 className="mobile-title font-semibold leading-tight mb-1 text-foreground line-clamp-2 group-hover:text-primary transition-colors">
            {movie.title}
          </h3>
          <p className="mobile-subtitle text-muted-foreground">
            {year}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
};