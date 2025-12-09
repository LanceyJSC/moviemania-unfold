
import { Heart, Plus, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useUserStateContext } from "@/contexts/UserStateContext";
import { useEnhancedWatchlist } from "@/hooks/useEnhancedWatchlist";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState, useRef } from "react";

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
  const { toggleLike, isLiked } = useUserStateContext();
  const { addItem, items } = useEnhancedWatchlist();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);
  const buttonClickedRef = useRef(false);

  const isInEnhancedWatchlist = items.some(item => item.movie_id === movie.id);

  const handleLikeClick = async (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    buttonClickedRef.current = true;
    await toggleLike(movie.id, movie.title, movie.poster);
    setTimeout(() => { buttonClickedRef.current = false; }, 100);
  };

  const handleWatchlistClick = async (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    buttonClickedRef.current = true;
    if (!isInEnhancedWatchlist) {
      await addItem(movie.id, movie.title, movie.poster, {
        priority: 'medium',
        moodTags: []
      });
    }
    setTimeout(() => { buttonClickedRef.current = false; }, 100);
  };

  const handleCardClick = (e: React.MouseEvent | React.TouchEvent) => {
    if (buttonClickedRef.current) {
      e.preventDefault();
      return;
    }
    navigate(`/movie/${movie.id}`);
  };

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
    <div onClick={handleCardClick} className="cursor-pointer">
      <Card className={`group relative overflow-hidden bg-card border-border transition-all duration-300 flex-shrink-0 ${getCardClasses()}`}>
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
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-r from-cinema-black/20 via-cinema-black/10 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-cinema-black/30 via-transparent to-transparent" />
          </div>
          
          {/* Subtle Hover Enhancement - Very light */}
          <div className={`absolute inset-0 transition-opacity duration-300 pointer-events-none ${
            isMobile ? 'opacity-0 group-active:opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}>
            <div className="absolute inset-0 bg-gradient-to-r from-cinema-black/30 via-cinema-black/15 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-cinema-black/40 via-transparent to-transparent" />
          </div>
          
          {/* Rating Badge */}
          <div className="absolute top-2 left-2 bg-cinema-black/80 backdrop-blur-sm rounded-full px-2 py-1 flex items-center space-x-1 pointer-events-none">
            <Star className="h-3 w-3 text-cinema-gold fill-current" />
            <span className="text-foreground font-semibold text-xs">{movie.rating}</span>
          </div>

          {/* Action Buttons */}
          <div className={`absolute bottom-2 right-2 flex gap-2 transition-opacity duration-300 z-20 ${
            isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}>
            <button
              type="button"
              className="h-11 w-11 flex items-center justify-center rounded-md bg-cinema-black/95 backdrop-blur-sm border border-cinema-charcoal/50 active:scale-95 transition-transform"
              onClick={handleLikeClick}
              onTouchStart={(e) => e.stopPropagation()}
            >
              <Heart 
                className={`h-5 w-5 ${
                  isLiked(movie.id) 
                    ? 'text-cinema-red fill-current' 
                    : 'text-foreground'
                }`} 
              />
            </button>
            <button
              type="button"
              className="h-11 w-11 flex items-center justify-center rounded-md bg-cinema-black/95 backdrop-blur-sm border border-cinema-charcoal/50 active:scale-95 transition-transform"
              onClick={handleWatchlistClick}
              onTouchStart={(e) => e.stopPropagation()}
            >
              <Plus 
                className={`h-5 w-5 ${
                  isInEnhancedWatchlist 
                    ? 'text-cinema-gold' 
                    : 'text-foreground'
                }`} 
              />
            </button>
          </div>

        </div>
      </Card>
    </div>
  );
};
