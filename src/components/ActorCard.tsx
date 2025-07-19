
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

  const handleClick = () => {
    navigate(`/actor/${actor.id}`);
  };

  return (
    <div 
      onClick={handleClick}
      className="flex-shrink-0 w-24 cursor-pointer group"
    >
      <div className="relative">
        <img
          src={tmdbService.getProfileUrl(actor.profile_path)}
          alt={actor.name}
          className="w-20 h-20 rounded-full object-cover mx-auto mb-2 group-hover:scale-105 transition-transform duration-200"
        />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-foreground line-clamp-1 group-hover:text-cinema-red transition-colors">
          {actor.name}
        </p>
        <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
          {actor.character}
        </p>
      </div>
    </div>
  );
};
