
import { Heart, Plus, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { useSupabaseUserState } from "@/hooks/useSupabaseUserState";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";

interface MovieCardProps {
  movie: {
    id: number;
    title: string;
    poster: string;
    year: string;
    rating: string;
    genre?: string;
  };
  size?: "small" | "medium" | "large";
}

export const MovieCard = ({ movie, size = "medium" }: MovieCardProps) => {
  const { toggleLike, toggleWatchlist, isLiked, isInWatchlist } = useSupabaseUserState();
  const isMobile = useIsMobile();
  const [imageError, setImageError] = useState(false);

  const handleLikeClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleLike(movie.id, movie.title, movie.poster);
  };

  const handleWatchlistClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleWatchlist(movie.id, movie.title, movie.poster);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  // iPhone-optimized sizing - optimized for 414px-428px screen width
  const getCardClasses = () => {
    switch (size) {
      case "small":
        return "w-[120px] h-[180px] iphone-65:w-[130px] iphone-65:h-[195px] sm:w-[150px] sm:h-[225px]"; // iPhone optimized 2:3 aspect ratio
      case "medium":
        return "w-[140px] h-[210px] iphone-65:w-[150px] iphone-65:h-[225px] sm:w-[180px] sm:h-[270px]"; // iPhone optimized 2:3 aspect ratio
      case "large":
        return "w-[160px] h-[240px] iphone-65:w-[170px] iphone-65:h-[255px] sm:w-[200px] sm:h-[300px]"; // iPhone optimized 2:3 aspect ratio
      default:
        return "w-[140px] h-[210px] iphone-65:w-[150px] iphone-65:h-[225px] sm:w-[180px] sm:h-[270px]";
    }
  };

  return (
    <Link to={`/movie/${movie.id}`}>
      <Card className={`group relative overflow-hidden bg-card border-border hover:border-cinema-red transition-all duration-300 hover:shadow-glow cursor-pointer flex-shrink-0 ${getCardClasses()}`}>
        <div className="w-full h-full relative">
          {/* Movie Poster */}
          {!imageError ? (
            <img 
              src={movie.poster} 
              alt={movie.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              loading="lazy"
              onError={handleImageError}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-cinema-charcoal to-cinema-black flex items-center justify-center border border-border">
              <div className="text-center p-3">
                <div className="text-3xl mb-2">🎬</div>
                <p className="text-xs text-foreground font-medium line-clamp-3 leading-tight px-1">{movie.title}</p>
                <p className="text-xs text-muted-foreground mt-2">{movie.year}</p>
              </div>
            </div>
          )}
          
          {/* Base Gradient Overlay - Very light for consistent brightness */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-r from-cinema-black/20 via-cinema-black/10 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-cinema-black/30 via-transparent to-transparent" />
          </div>
          
          {/* Subtle Hover Enhancement - Very light */}
          <div className={`absolute inset-0 transition-opacity duration-300 ${
            isMobile ? 'opacity-0 group-active:opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}>
            <div className="absolute inset-0 bg-gradient-to-r from-cinema-black/30 via-cinema-black/15 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-cinema-black/40 via-transparent to-transparent" />
          </div>
          
          {/* Rating Badge */}
          <div className="absolute top-2 left-2 bg-cinema-black/80 backdrop-blur-sm rounded-full px-2 py-1 flex items-center space-x-1">
            <Star className="h-3 w-3 text-cinema-gold fill-current" />
            <span className="text-foreground font-semibold text-xs">{movie.rating}</span>
          </div>

          {/* Action Buttons */}
          <div className={`absolute top-2 right-2 transition-opacity duration-300 space-y-2 ${
            isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}>
            <Button 
              size="sm" 
              variant="secondary" 
              className={`p-0 backdrop-blur-sm border-border hover:border-cinema-red h-8 w-8 ${
                isMobile ? 'active:scale-95' : ''
              } ${
                isLiked(movie.id) ? 'bg-cinema-red border-cinema-red text-white' : 'bg-cinema-charcoal/80'
              }`}
              onClick={handleLikeClick}
            >
              <Heart className={`h-4 w-4 ${isLiked(movie.id) ? 'fill-current' : ''}`} />
            </Button>
            <Button 
              size="sm" 
              variant="secondary" 
              className={`p-0 backdrop-blur-sm border-border hover:border-cinema-red h-8 w-8 ${
                isMobile ? 'active:scale-95' : ''
              } ${
                isInWatchlist(movie.id) ? 'bg-cinema-gold border-cinema-gold text-cinema-black' : 'bg-cinema-charcoal/80'
              }`}
              onClick={handleWatchlistClick}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Movie Info Overlay */}
          <div className={`absolute bottom-0 left-0 right-0 p-3 transition-opacity duration-300 ${
            isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}>
            <h3 className="text-foreground font-semibold mb-1 line-clamp-2 text-sm">
              {movie.title}
            </h3>
            <div className="flex items-center justify-between text-muted-foreground text-xs">
              <span>{movie.year}</span>
              <span className="truncate ml-2">Movie</span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
};
