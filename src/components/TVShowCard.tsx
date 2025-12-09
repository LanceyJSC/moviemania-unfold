
import { Link } from "react-router-dom";
import { Star, Heart, Plus, Calendar } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUserStateContext } from "@/contexts/UserStateContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";

interface TVShowCardProps {
  tvShow: {
    id: number;
    title: string;
    poster: string;
    year: string;
    rating: string;
    genre?: string;
  };
  variant?: "grid" | "carousel";
}

export const TVShowCard = ({ tvShow, variant = "carousel" }: TVShowCardProps) => {
  const { toggleLike, toggleWatchlist, isLiked, isInWatchlist } = useUserStateContext();
  const isMobile = useIsMobile();
  const [imageError, setImageError] = useState(false);

  const handleLikeClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleLike(tvShow.id, tvShow.title, tvShow.poster);
  };

  const handleWatchlistClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleWatchlist(tvShow.id, tvShow.title, tvShow.poster);
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
    <Link to={`/tv/${tvShow.id}`}>
      <Card className={`group relative overflow-hidden bg-card border-border transition-all duration-300 cursor-pointer flex-shrink-0 ${getCardClasses()}`}>
        <div className="w-full h-full relative">
          {/* TV Show Poster */}
          {!imageError ? (
            <img 
              src={tvShow.poster} 
              alt={tvShow.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              loading="lazy"
              onError={handleImageError}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-cinema-charcoal to-cinema-black flex items-center justify-center border border-border">
              <div className="text-center p-3">
                <div className="text-3xl mb-2">📺</div>
                <p className="text-xs text-foreground font-medium line-clamp-3 leading-tight px-1">{tvShow.title}</p>
                <p className="text-xs text-muted-foreground mt-2">{tvShow.year}</p>
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
            <span className="text-foreground font-semibold text-xs">{tvShow.rating}</span>
          </div>

        </div>
      </Card>
    </Link>
  );
};
