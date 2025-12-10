import { Star, User } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { useUserStateContext } from "@/contexts/UserStateContext";
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
  variant?: "grid" | "carousel";
}

export const MovieCard = ({ movie, variant = "carousel" }: MovieCardProps) => {
  const { getRating } = useUserStateContext();
  const isMobile = useIsMobile();
  const [imageError, setImageError] = useState(false);

  const userRating = getRating(movie.id);

  const handleImageError = () => {
    setImageError(true);
  };

  // Grid variant uses responsive width, carousel uses fixed width
  const getCardClasses = () => {
    if (variant === "grid") {
      return "w-full aspect-[2/3]"; // Responsive width for grid
    }
    
    // Fixed standard size for carousel
    return "w-32 h-48";
  };

  return (
    <Link to={`/movie/${movie.id}`}>
      <Card className={`group relative overflow-hidden bg-card border-border transition-all duration-300 cursor-pointer flex-shrink-0 ${getCardClasses()}`}>
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
          
          {/* Rating Badges - TMDB and User Rating */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {/* TMDB Rating */}
            <div className="bg-cinema-black/80 backdrop-blur-sm rounded-full px-2 py-1 flex items-center space-x-1">
              <Star className="h-3 w-3 text-cinema-gold fill-current" />
              <span className="text-foreground font-semibold text-xs">{movie.rating}</span>
            </div>
            
            {/* User Rating - only show if rated */}
            {userRating > 0 && (
              <div className="bg-cinema-black/80 backdrop-blur-sm rounded-full px-2 py-1 flex items-center space-x-1">
                <User className="h-3 w-3 text-primary" />
                <span className="text-primary font-semibold text-xs">{userRating}</span>
              </div>
            )}
          </div>

        </div>
      </Card>
    </Link>
  );
};
