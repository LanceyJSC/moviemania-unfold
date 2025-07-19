
import { useNavigate } from "react-router-dom";
import { Zap, Heart, Sword, Laugh, Ghost, Rocket } from "lucide-react";

export const QuickGenres = () => {
  const navigate = useNavigate();

  const genres = [
    { id: 28, name: "Action", icon: Zap, color: "bg-red-500/20 text-red-400" },
    { id: 35, name: "Comedy", icon: Laugh, color: "bg-yellow-500/20 text-yellow-400" },
    { id: 27, name: "Horror", icon: Ghost, color: "bg-purple-500/20 text-purple-400" },
    { id: 10749, name: "Romance", icon: Heart, color: "bg-pink-500/20 text-pink-400" },
    { id: 878, name: "Sci-Fi", icon: Rocket, color: "bg-blue-500/20 text-blue-400" },
    { id: 12, name: "Adventure", icon: Sword, color: "bg-green-500/20 text-green-400" }
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
              <div className={`rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 bg-background border-2 border-primary/20 group-hover:scale-110 transition-transform`}>
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
