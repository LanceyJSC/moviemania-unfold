
import { useState } from "react";
import { Play, Heart, Plus, Star, Share, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MovieCarousel } from "@/components/MovieCarousel";
import { Link } from "react-router-dom";

// Mock movie data - will be replaced with API data later
const movieData = {
  id: 1,
  title: "The Dark Knight",
  backdrop: "https://images.unsplash.com/photo-1509647084632-bc2540fba87a?w=1920&h=1080&fit=crop",
  poster: "https://images.unsplash.com/photo-1509647084632-bc2540fba87a?w=400&h=600&fit=crop",
  year: "2008",
  runtime: "152 min",
  rating: "9.0",
  genre: "Action, Crime, Drama",
  plot: "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.",
  cast: ["Christian Bale", "Heath Ledger", "Aaron Eckhart", "Michael Caine"],
  director: "Christopher Nolan"
};

const recommendedMovies = [
  {
    id: 2,
    title: "Batman Begins",
    poster: "https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=400&h=600&fit=crop",
    year: "2005",
    rating: "8.2",
    genre: "Action"
  },
  {
    id: 3,
    title: "The Dark Knight Rises",
    poster: "https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=400&h=600&fit=crop",
    year: "2012",
    rating: "8.4",
    genre: "Action"
  }
];

const MovieDetail = () => {
  const [isLiked, setIsLiked] = useState(false);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [userRating, setUserRating] = useState(0);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative h-screen overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${movieData.backdrop})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-cinema-black via-cinema-black/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-cinema-black via-transparent to-transparent" />
        </div>

        {/* Back Button */}
        <div className="absolute top-6 left-6 z-10">
          <Link to="/">
            <Button variant="ghost" size="sm" className="bg-cinema-charcoal/60 backdrop-blur-sm hover:bg-cinema-red">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>

        {/* Content */}
        <div className="relative z-10 h-full flex items-center">
          <div className="container mx-auto px-6">
            <div className="flex flex-col lg:flex-row items-center lg:items-end space-y-8 lg:space-y-0 lg:space-x-12">
              {/* Poster */}
              <div className="flex-shrink-0">
                <img 
                  src={movieData.poster} 
                  alt={movieData.title}
                  className="w-80 h-auto rounded-lg shadow-cinematic"
                />
              </div>

              {/* Movie Info */}
              <div className="flex-1 text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start space-x-4 mb-4">
                  <span className="text-cinema-gold text-xl font-semibold">★ {movieData.rating}</span>
                  <span className="text-muted-foreground">{movieData.year}</span>
                  <span className="text-muted-foreground">{movieData.runtime}</span>
                </div>

                <h1 className="text-5xl md:text-7xl font-cinematic text-foreground mb-4 tracking-wide">
                  {movieData.title}
                </h1>

                <p className="text-lg text-muted-foreground mb-6 max-w-2xl">
                  {movieData.genre}
                </p>

                <p className="text-lg text-muted-foreground mb-8 max-w-3xl leading-relaxed">
                  {movieData.plot}
                </p>

                {/* Cast */}
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-foreground mb-2">Cast</h3>
                  <p className="text-muted-foreground">{movieData.cast.join(", ")}</p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap justify-center lg:justify-start gap-4 mb-8">
                  <Button className="bg-cinema-red hover:bg-cinema-red/90 text-white px-8 py-6 text-lg font-semibold">
                    <Play className="mr-2 h-5 w-5" />
                    Watch Trailer
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className={`border-border hover:bg-card px-6 py-6 ${isLiked ? 'bg-cinema-red border-cinema-red text-white' : ''}`}
                    onClick={() => setIsLiked(!isLiked)}
                  >
                    <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
                  </Button>

                  <Button 
                    variant="outline" 
                    className={`border-border hover:bg-card px-6 py-6 ${isInWatchlist ? 'bg-cinema-gold border-cinema-gold text-cinema-black' : ''}`}
                    onClick={() => setIsInWatchlist(!isInWatchlist)}
                  >
                    <Plus className="h-5 w-5" />
                  </Button>

                  <Button variant="outline" className="border-border hover:bg-card px-6 py-6">
                    <Share className="h-5 w-5" />
                  </Button>
                </div>

                {/* Rating */}
                <div className="flex items-center justify-center lg:justify-start space-x-2">
                  <span className="text-foreground">Your Rating:</span>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setUserRating(star)}
                      className="transition-colors"
                    >
                      <Star 
                        className={`h-6 w-6 ${star <= userRating ? 'text-cinema-gold fill-current' : 'text-muted-foreground'}`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="container mx-auto px-6 py-16">
        <MovieCarousel 
          title="YOU MIGHT ALSO LIKE" 
          movies={recommendedMovies}
          cardSize="medium"
        />
      </div>
    </div>
  );
};

export default MovieDetail;
