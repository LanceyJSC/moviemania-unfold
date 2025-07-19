
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { tmdbService } from "@/lib/tmdb";

interface CrewCardProps {
  person: {
    id: number;
    name: string;
    job: string;
    profile_path: string | null;
  };
}

export const CrewCard = ({ person }: CrewCardProps) => {
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);

  const handleClick = () => {
    navigate(`/actor/${person.id}`);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div 
      onClick={handleClick}
      className="flex-shrink-0 w-24 cursor-pointer group"
    >
      <div className="relative">
        {!imageError && person.profile_path ? (
          <img
            src={tmdbService.getProfileUrl(person.profile_path)}
            alt={person.name}
            className="w-20 h-20 rounded-full object-cover mx-auto mb-2 group-hover:scale-105 transition-transform duration-200"
            onError={handleImageError}
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cinema-charcoal to-cinema-black mx-auto mb-2 flex items-center justify-center border border-border group-hover:scale-105 transition-transform duration-200">
            <div className="text-center">
              <div className="text-2xl mb-1">🎬</div>
              <p className="text-xs text-foreground font-medium line-clamp-1 px-1">{person.name.split(' ')[0]}</p>
            </div>
          </div>
        )}
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-foreground line-clamp-1 group-hover:text-cinema-red transition-colors">
          {person.name}
        </p>
        <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
          {person.job}
        </p>
      </div>
    </div>
  );
};
