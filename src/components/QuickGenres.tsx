
import { useNavigate } from "react-router-dom";
import { Zap, Heart, Sword, Laugh, Ghost, Rocket } from "lucide-react";

export const QuickGenres = () => {
  const navigate = useNavigate();

  const genres = [
    { id: 28, name: "Action", icon: Zap, color: "bg-primary/20 text-primary" },
    { id: 35, name: "Comedy", icon: Laugh, color: "bg-primary/20 text-primary" },
    { id: 27, name: "Horror", icon: Ghost, color: "bg-primary/20 text-primary" },
    { id: 10749, name: "Romance", icon: Heart, color: "bg-primary/20 text-primary" },
    { id: 878, name: "Sci-Fi", icon: Rocket, color: "bg-primary/20 text-primary" },
    { id: 12, name: "Adventure", icon: Sword, color: "bg-primary/20 text-primary" }
  ];

  const handleGenreClick = (genreId: number) => {
    navigate(`/search?genre=${genreId}`);
  };

  return (
    <div className="mb-12">
      <div className="text-center mb-8">
        <h2 className="font-cinematic text-3xl text-foreground tracking-wide mb-4">
          EXPLORE BY GENRE
        </h2>
        <div className="w-16 h-0.5 bg-cinema-gold mx-auto"></div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {genres.map((genre) => {
          const Icon = genre.icon;
          return (
            <div
              key={genre.id}
              onClick={() => handleGenreClick(genre.id)}
              className="bg-card rounded-xl p-6 text-center cursor-pointer hover:bg-card/80 transition-colors group"
            >
              <div className={`rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 ${genre.color} group-hover:scale-110 transition-transform`}>
                <Icon className="h-8 w-8" />
              </div>
              <div className="font-semibold text-foreground group-hover:text-cinema-red transition-colors">
                {genre.name}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
