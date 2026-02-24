import { Link } from "react-router-dom";
import { Heart, Eye, Plus, Flame } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useUserStateContext } from "@/contexts/UserStateContext";
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
  const { getRating, isLiked, isWatched, isInWatchlist } = useUserStateContext();
  const [imageError, setImageError] = useState(false);
  
  const userRating = getRating(tvShow.id);
  const liked = isLiked(tvShow.id);
  const watched = isWatched(tvShow.id);
  const onWatchlist = isInWatchlist(tvShow.id);

  const handleImageError = () => {
    setImageError(true);
  };

  const getCardClasses = () => {
    if (variant === "grid") {
      return "w-full aspect-[2/3]";
    }
    return "w-32 h-48";
  };

  return (
    <Link to={`/tv/${tvShow.id}`} className="block touch-manipulation">
      <Card className={`group relative overflow-hidden bg-card border-border transition-all duration-300 cursor-pointer flex-shrink-0 ${getCardClasses()}`}>
        <div className="w-full h-full relative">
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
          
          {/* Hover overlay dim */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 pointer-events-none" />

          {/* Hover badges - each in a corner */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            {/* Top-left: SceneBurn Score */}
            {userRating > 0 && (
              <div className="absolute top-1.5 left-1.5 bg-black/70 backdrop-blur-sm rounded-full px-1.5 py-0.5 flex items-center gap-0.5">
                <Flame className="h-3 w-3 text-cinema-red fill-current" />
                <span className="text-white font-semibold text-[10px]">{userRating}/5</span>
              </div>
            )}

            {/* Top-right: Favorite */}
            {liked && (
              <div className="absolute top-1.5 right-1.5 bg-black/70 backdrop-blur-sm rounded-full p-1">
                <Heart className="h-3 w-3 text-cinema-red fill-cinema-red" />
              </div>
            )}

            {/* Bottom-left: Watched */}
            {watched && (
              <div className="absolute bottom-1.5 left-1.5 bg-black/70 backdrop-blur-sm rounded-full p-1">
                <Eye className="h-3 w-3 text-emerald-400" />
              </div>
            )}

            {/* Bottom-right: On Watchlist */}
            {onWatchlist && (
              <div className="absolute bottom-1.5 right-1.5 bg-black/70 backdrop-blur-sm rounded-full p-1">
                <Plus className="h-3 w-3 text-primary" />
              </div>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
};
