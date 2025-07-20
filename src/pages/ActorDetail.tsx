
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Loader2, Calendar, MapPin } from "lucide-react";
import { MovieCard } from "@/components/MovieCard";
import { MobileHeader } from "@/components/MobileHeader";
import { Navigation } from "@/components/Navigation";
import { tmdbService, Person } from "@/lib/tmdb";

const ActorDetail = () => {
  const { id } = useParams<{ id: string }>();
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
      <div className="min-h-screen bg-background">
        <MobileHeader title="Loading..." />
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-cinema-red" />
        </div>
      </div>
    );
  }

  if (!actor) {
    return (
      <div className="min-h-screen bg-background">
        <MobileHeader title="Actor Not Found" />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Actor not found</h1>
          </div>
        </div>
      </div>
    );
  }

  // Try multiple image sizes for better success rate
  const getProfileImageUrl = () => {
    if (!actor.profile_path) return null;
    // Try original size first, then fallback to smaller sizes
    return tmdbService.getProfileUrl(actor.profile_path, 'original');
  };

  const profileUrl = getProfileImageUrl();
  const birthYear = actor.birthday ? new Date(actor.birthday).getFullYear() : null;
  
  // Combine movies and TV shows into one filmography list
  const movies = actor.movie_credits?.cast || [];
  const tvShows = actor.tv_credits?.cast || [];
  
  // Convert TV shows to movie-like format for consistent display
  const formattedTVShows = tvShows.map(show => ({
    id: show.id,
    title: show.name,
    character: show.character,
    poster_path: show.poster_path,
    release_date: show.first_air_date,
    vote_average: show.vote_average,
    media_type: 'tv' as const
  }));
  
  const formattedMovies = movies.map(movie => ({
    ...movie,
    media_type: 'movie' as const
  }));
  
  // Combine and sort all content by release date
  const allContent = [...formattedMovies, ...formattedTVShows]
    .sort((a, b) => new Date(b.release_date || '').getTime() - new Date(a.release_date || '').getTime());

  return (
    <div className="min-h-screen bg-background pb-32">
      <MobileHeader title={actor.name} />
      
      {/* Actor Header */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Profile Image - Enhanced fallback */}
          <div className="flex-shrink-0 mx-auto lg:mx-0">
            {!imageError && profileUrl ? (
              <img 
                src={profileUrl} 
                alt={actor.name}
                className="w-48 h-64 object-cover rounded-lg shadow-cinematic"
                onError={handleImageError}
              />
            ) : (
              <div className="w-48 h-64 bg-gradient-to-br from-cinema-charcoal to-cinema-black rounded-lg shadow-cinematic flex items-center justify-center border border-border">
                <div className="text-center p-4">
                  <div className="text-5xl mb-3">🎭</div>
                  <p className="text-sm text-foreground font-medium line-clamp-2 leading-tight">{actor.name}</p>
                  <p className="text-xs text-muted-foreground mt-2">{actor.known_for_department}</p>
                </div>
              </div>
            )}
          </div>

          {/* Actor Info */}
          <div className="flex-1">
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
                  <span className="text-center lg:text-left">{actor.place_of_birth}</span>
                </div>
              )}
            </div>

            {actor.biography && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-foreground mb-4">Biography</h2>
                <p className="text-muted-foreground leading-relaxed text-sm">
                  {actor.biography}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filmography */}
      {allContent.length > 0 && (
        <div className="container mx-auto px-4 py-6">
          <h2 className="text-2xl font-cinematic text-foreground mb-6 tracking-wide">
            FILMOGRAPHY ({allContent.length} {allContent.length === 1 ? 'TITLE' : 'TITLES'})
          </h2>
          <div className="grid grid-cols-3 gap-2 md:grid-cols-6 lg:grid-cols-8">
            {allContent.map((item, index) => (
              <div key={`${item.id}-${item.media_type}`} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <MovieCard 
                  movie={{
                    id: item.id,
                    title: item.title,
                    poster: tmdbService.getPosterUrl(item.poster_path),
                    year: item.release_date ? new Date(item.release_date).getFullYear().toString() : 'TBA',
                    rating: item.vote_average.toFixed(1),
                    genre: item.character
                  }}
                  variant="grid"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <Navigation />
    </div>
  );
};

export default ActorDetail;
