
import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Loader2, Calendar, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MovieCard } from "@/components/MovieCard";
import { Navigation } from "@/components/Navigation";
import { tmdbService, Person } from "@/lib/tmdb";

const ActorDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [actor, setActor] = useState<Person | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const loadActorDetails = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        const actorData = await tmdbService.getPersonDetails(Number(id));
        setActor(actorData);
      } catch (error) {
        console.error('Failed to load actor details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadActorDetails();
  }, [id]);

  const handleImageError = () => {
    setImageError(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cinema-red" />
      </div>
    );
  }

  if (!actor) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Actor not found</h1>
          <Link to="/">
            <Button>Back to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const profileUrl = tmdbService.getProfileUrl(actor.profile_path, 'w632');
  const birthYear = actor.birthday ? new Date(actor.birthday).getFullYear() : null;
  const movies = actor.movie_credits?.cast || [];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Actor Header */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Profile Image */}
          <div className="flex-shrink-0 mx-auto lg:mx-0">
            {!imageError && actor.profile_path ? (
              <img 
                src={profileUrl} 
                alt={actor.name}
                className="w-64 h-80 object-cover rounded-lg shadow-cinematic"
                onError={handleImageError}
              />
            ) : (
              <div className="w-64 h-80 bg-cinema-charcoal rounded-lg shadow-cinematic flex items-center justify-center">
                <div className="text-center p-6">
                  <div className="text-6xl mb-4">👤</div>
                  <p className="text-sm text-muted-foreground">{actor.name}</p>
                </div>
              </div>
            )}
          </div>

          {/* Actor Info */}
          <div className="flex-1">
            <h1 className="font-cinematic text-4xl text-foreground mb-4 tracking-wide text-center lg:text-left">
              {actor.name}
            </h1>
            
            <div className="flex flex-wrap gap-4 mb-6 text-muted-foreground justify-center lg:justify-start">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-foreground">Known for:</span>
                <span>{actor.known_for_department}</span>
              </div>
              
              {birthYear && (
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>Born {birthYear}</span>
                </div>
              )}
              
              {actor.place_of_birth && (
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4" />
                  <span>{actor.place_of_birth}</span>
                </div>
              )}
            </div>

            {actor.biography && (
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-foreground mb-4">Biography</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {actor.biography}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filmography */}
      {movies.length > 0 && (
        <div className="container mx-auto px-4 py-8">
          <h2 className="text-3xl font-cinematic text-foreground mb-8 tracking-wide">
            FILMOGRAPHY
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {movies
              .sort((a, b) => new Date(b.release_date || '').getTime() - new Date(a.release_date || '').getTime())
              .slice(0, 18)
              .map((movie) => (
                <MovieCard 
                  key={movie.id} 
                  movie={{
                    id: movie.id,
                    title: movie.title,
                    poster: tmdbService.getPosterUrl(movie.poster_path),
                    year: movie.release_date ? new Date(movie.release_date).getFullYear().toString() : 'TBA',
                    rating: movie.vote_average.toFixed(1),
                    genre: movie.character
                  }}
                  size="small"
                />
              ))}
          </div>
        </div>
      )}

      <Navigation />
    </div>
  );
};

export default ActorDetail;
