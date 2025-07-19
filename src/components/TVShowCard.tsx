
import { Link } from "react-router-dom";
import { Star, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface TVShowCardProps {
  tvShow: {
    id: number;
    title: string;
    poster: string;
    year: string;
    rating: string;
    genre: string;
  };
  size?: "small" | "medium" | "large";
}

export const TVShowCard = ({ tvShow, size = "medium" }: TVShowCardProps) => {
  const sizeClasses = {
    small: "w-36 h-[216px]",
    medium: "w-44 h-[264px]", 
    large: "w-52 h-[312px]"
  };

  return (
    <Link to={`/tv/${tvShow.id}`} className="group block">
      <Card className={`${sizeClasses[size]} overflow-hidden hover:scale-105 transition-transform duration-300 bg-card border-border`}>
        <CardContent className="p-0 h-full">
          <div className="relative h-4/5">
            <img
              src={tvShow.poster}
              alt={tvShow.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-cinema-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            {/* Rating Badge */}
            <div className="absolute top-2 right-2 bg-cinema-black/80 backdrop-blur-sm rounded-full px-2 py-1">
              <div className="flex items-center space-x-1 text-xs">
                <Star className="h-3 w-3 fill-cinema-gold text-cinema-gold" />
                <span className="text-white font-medium">{tvShow.rating}</span>
              </div>
            </div>

            {/* Show Type Badge */}
            <div className="absolute top-2 left-2">
              <Badge variant="secondary" className="text-xs bg-cinema-red/90 text-white">
                TV Show
              </Badge>
            </div>
          </div>
          
          <div className="p-3 h-1/5 flex flex-col justify-between">
            <h3 className="font-semibold text-sm line-clamp-2 text-foreground group-hover:text-cinema-red transition-colors">
              {tvShow.title}
            </h3>
            <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
              <div className="flex items-center space-x-1">
                <Calendar className="h-3 w-3" />
                <span>{tvShow.year}</span>
              </div>
              <span className="truncate ml-2">{tvShow.genre}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
