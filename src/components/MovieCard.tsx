
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
  
  const sizeClasses = {
    small: isMobile ? "w-40 h-60" : "w-32 h-48",
    medium: isMobile ? "w-48 h-72" : "w-48 h-72",
    large: isMobile ? "w-56 h-84" : "w-64 h-96"
  };

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

  return (
    <Link to={`/movie/${movie.id}`}>
      <Card className={`group relative overflow-hidden bg-card border-border hover:border-cinema-red transition-all duration-300 transform hover:scale-105 hover:shadow-glow cursor-pointer ${
        isMobile ? 'active:scale-95' : ''
      }`}>
        <div className={`${sizeClasses[size]} relative`}>
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
            <div className="w-full h-full bg-cinema-charcoal flex items-center justify-center">
              <div className="text-center p-4">
                <div className="text-4xl mb-2">🎬</div>
                <p className="text-xs text-muted-foreground line-clamp-2">{movie.title}</p>
              </div>
            </div>
          )}
          
          {/* Gradient Overlay */}
          <div className={`absolute inset-0 bg-gradient-to-t from-cinema-black via-transparent to-transparent transition-opacity duration-300 ${
            isMobile ? 'opacity-60 group-active:opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`} />
          
          {/* Rating Badge */}
          <div className="absolute top-2 left-2 bg-cinema-black/80 backdrop-blur-sm rounded-full px-2 py-1 flex items-center space-x-1">
            <Star className="h-3 w-3 text-cinema-gold fill-current" />
            <span className={`text-foreground font-semibold ${isMobile ? 'text-xs' : 'text-xs'}`}>{movie.rating}</span>
          </div>

          {/* Action Buttons */}
          <div className={`absolute top-2 right-2 transition-opacity duration-300 space-y-2 ${
            isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}>
            <Button 
              size="sm" 
              variant="secondary" 
              className={`p-0 backdrop-blur-sm border-border hover:border-cinema-red ${
                isMobile ? 'h-8 w-8 active:scale-95' : 'h-8 w-8'
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
              className={`p-0 backdrop-blur-sm border-border hover:border-cinema-red ${
                isMobile ? 'h-8 w-8 active:scale-95' : 'h-8 w-8'
              } ${
                isInWatchlist(movie.id) ? 'bg-cinema-gold border-cinema-gold text-cinema-black' : 'bg-cinema-charcoal/80'
              }`}
              onClick={handleWatchlistClick}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Movie Info Overlay */}
          <div className={`absolute bottom-0 left-0 right-0 p-4 transition-opacity duration-300 ${
            isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}>
            <h3 className={`text-foreground font-semibold mb-1 line-clamp-2 ${
              isMobile ? 'text-xs' : 'text-sm'
            }`}>
              {movie.title}
            </h3>
            <div className={`flex items-center justify-between text-muted-foreground ${
              isMobile ? 'text-xs' : 'text-xs'
            }`}>
              <span>{movie.year}</span>
              {movie.genre && <span className="truncate ml-2">{movie.genre}</span>}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
};
