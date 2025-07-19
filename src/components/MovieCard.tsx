
import { Heart, Plus, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { useSupabaseUserState } from "@/hooks/useSupabaseUserState";

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
  
  const sizeClasses = {
    small: "w-32 h-48",
    medium: "w-48 h-72",
    large: "w-64 h-96"
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

  return (
    <Link to={`/movie/${movie.id}`}>
      <Card className="group relative overflow-hidden bg-card border-border hover:border-cinema-red transition-all duration-300 transform hover:scale-105 hover:shadow-glow cursor-pointer">
        <div className={`${sizeClasses[size]} relative`}>
          {/* Movie Poster */}
          <img 
            src={movie.poster} 
            alt={movie.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-cinema-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Rating Badge */}
          <div className="absolute top-2 left-2 bg-cinema-black/80 backdrop-blur-sm rounded-full px-2 py-1 flex items-center space-x-1">
            <Star className="h-3 w-3 text-cinema-gold fill-current" />
            <span className="text-xs text-foreground font-semibold">{movie.rating}</span>
          </div>

          {/* Action Buttons */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 space-y-2">
            <Button 
              size="sm" 
              variant="secondary" 
              className={`h-8 w-8 p-0 backdrop-blur-sm border-border hover:border-cinema-red ${
                isLiked(movie.id) ? 'bg-cinema-red border-cinema-red text-white' : 'bg-cinema-charcoal/80'
              }`}
              onClick={handleLikeClick}
            >
              <Heart className={`h-4 w-4 ${isLiked(movie.id) ? 'fill-current' : ''}`} />
            </Button>
            <Button 
              size="sm" 
              variant="secondary" 
              className={`h-8 w-8 p-0 backdrop-blur-sm border-border hover:border-cinema-red ${
                isInWatchlist(movie.id) ? 'bg-cinema-gold border-cinema-gold text-cinema-black' : 'bg-cinema-charcoal/80'
              }`}
              onClick={handleWatchlistClick}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Movie Info Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <h3 className="text-foreground font-semibold text-sm mb-1 line-clamp-2">
              {movie.title}
            </h3>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{movie.year}</span>
              {movie.genre && <span>{movie.genre}</span>}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
};
