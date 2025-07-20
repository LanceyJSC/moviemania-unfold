
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { tmdbService } from "@/lib/tmdb";

interface ActorCardProps {
  actor: {
    id: number;
    name: string;
    character: string;
    profile_path: string | null;
  };
}

export const ActorCard = ({ actor }: ActorCardProps) => {
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);

  const handleClick = () => {
    navigate(`/actor/${actor.id}`);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div 
      onClick={handleClick}
      className="flex-shrink-0 w-20 cursor-pointer group"
    >
      <div className="relative">
        {!imageError && actor.profile_path ? (
          <img
            src={tmdbService.getProfileUrl(actor.profile_path)}
            alt={actor.name}
            className="w-20 h-28 rounded-lg object-cover mx-auto mb-2 group-hover:scale-105 transition-transform duration-200 shadow-lg"
            onError={handleImageError}
          />
        ) : (
          <div className="w-20 h-28 rounded-lg bg-gradient-to-br from-cinema-charcoal to-cinema-black mx-auto mb-2 flex items-center justify-center border border-border group-hover:scale-105 transition-transform duration-200 shadow-lg">
            <div className="text-center p-2">
              <div className="text-2xl mb-1">🎭</div>
              <p className="text-xs text-foreground font-medium line-clamp-2 leading-tight">{actor.name.split(' ')[0]}</p>
            </div>
          </div>
        )}
      </div>
      <div className="text-center">
        <p className="text-xs font-medium text-foreground line-clamp-1 group-hover:text-cinema-red transition-colors">
          {actor.name}
        </p>
        <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
          {actor.character}
        </p>
      </div>
    </div>
  );
};
