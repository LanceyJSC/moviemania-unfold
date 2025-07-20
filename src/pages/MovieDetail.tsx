import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Play, Heart, Plus, Star, Share, Loader2, MoreHorizontal, Clock, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { MovieCarousel } from "@/components/MovieCarousel";
import { ActorCard } from "@/components/ActorCard";
import { CrewCard } from "@/components/CrewCard";
import { IOSTabBar } from "@/components/IOSTabBar";
import { MobileHeader } from "@/components/MobileHeader";
import { TrailerModal } from "@/components/TrailerModal";
import { SynopsisModal } from "@/components/SynopsisModal";
import { tmdbService, Movie, TVShow } from "@/lib/tmdb";
import { useSupabaseUserState } from "@/hooks/useSupabaseUserState";
import { cn } from "@/lib/utils";

const MovieDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [movie, setMovie] = useState<Movie | TVShow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [showTrailer, setShowTrailer] = useState(false);
  const [showSynopsis, setShowSynopsis] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  
  const {
    toggleLike,
    toggleWatchlist,
    setRating,
    isLiked,
    isInWatchlist,
    getRating
  } = useSupabaseUserState();

  const movieId = Number(id);
  const isMovieLiked = isLiked(movieId);
  const isMovieInWatchlist = isInWatchlist(movieId);
  const userRating = getRating(movieId);

  // Handle scroll for header blur effect
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const loadDetails = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        const isTV = window.location.pathname.includes('/tv/');
        let movieData;
        
        if (isTV) {
          movieData = await tmdbService.getTVShowDetails(Number(id));
        } else {
          movieData = await tmdbService.getMovieDetails(Number(id));
        }
        setMovie(movieData);
        
        // Find trailer
        const trailer = movieData.videos?.results.find(
          video => video.type === 'Trailer' && video.site === 'YouTube'
        );
        if (trailer) {
          setTrailerKey(trailer.key);
        }
      } catch (error) {
        console.error('Failed to load movie details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDetails();
  }, [id]);

  const handleShare = async () => {
    if (navigator.share && movie) {
      try {
        await navigator.share({
          title: title,
          text: `Check out ${title} on CineScope!`,
          url: window.location.href,
        });
      } catch (error) {
        navigator.clipboard.writeText(window.location.href);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleWatchTrailer = () => {
    if (trailerKey) {
      setShowTrailer(true);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <MobileHeader title="Loading..." />
        
        <div className="flex items-center justify-center h-screen">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">Loading movie details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-background">
        <MobileHeader title="Not Found" />
        
        <div className="flex items-center justify-center h-screen">
          <div className="text-center space-y-4">
            <h1 className="text-xl font-semibold text-foreground">Movie not found</h1>
            <Button onClick={() => navigate('/')}>Back to Home</Button>
          </div>
        </div>
      </div>
    );
  }

  const backdropUrl = tmdbService.getBackdropUrl(movie.backdrop_path, 'original');
  const posterUrl = tmdbService.getPosterUrl(movie.poster_path, 'w500');
  const isTV = 'name' in movie;
  const title = isTV ? (movie as TVShow).name : (movie as Movie).title;
  const releaseDate = isTV ? (movie as TVShow).first_air_date : (movie as Movie).release_date;
  const releaseYear = releaseDate ? new Date(releaseDate).getFullYear() : 'TBA';
  const runtime = isTV ? 'TV Series' : ((movie as Movie).runtime ? `${(movie as Movie).runtime} min` : 'Unknown');
  const genres = movie.genres?.map(g => g.name).join(', ') || 'Unknown';
  
  const cast = movie.credits?.cast?.slice(0, 10) || [];
  const crew = movie.credits?.crew || [];
  const director = crew.find(person => person.job === 'Director');
  const keyCrewMembers = crew.filter(person => 
    ['Director', 'Producer', 'Executive Producer', 'Screenplay', 'Writer'].includes(person.job)
  ).slice(0, 6);

  return (
    <div 
      className="min-h-screen bg-background"
      style={{ paddingBottom: 'calc(100px + env(safe-area-inset-bottom))' }}
    >
      <MobileHeader title={title} />

      {/* Hero Section - TMDB Backdrop 16:9 */}
      <div className="relative overflow-hidden">
        <div 
          className="backdrop-16-9 bg-cover bg-center"
          style={{ backgroundImage: `url(${backdropUrl})` }}
        >
          {/* Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/80" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/20" />
        </div>

        {/* Movie Info Overlay */}
        <div className="absolute inset-x-0 bottom-0 p-6 space-y-4">
          <div className="flex gap-4">
            {/* Poster */}
            <div className="flex-shrink-0">
              <img 
                src={posterUrl} 
                alt={title}
                className="w-24 h-36 rounded-xl shadow-lg object-cover border border-white/20"
              />
            </div>

            {/* Info */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30">
                  <Star className="h-3 w-3 mr-1 fill-current" />
                  {movie.vote_average.toFixed(1)}
                </Badge>
                <Badge variant="outline" className="bg-white/10 text-white border-white/20">
                  <Calendar className="h-3 w-3 mr-1" />
                  {releaseYear}
                </Badge>
                <Badge variant="outline" className="bg-white/10 text-white border-white/20">
                  <Clock className="h-3 w-3 mr-1" />
                  {runtime}
                </Badge>
              </div>
              
              <h1 className="font-cinematic text-white text-xl leading-tight tracking-wide">
                {title}
              </h1>
              
              <ScrollArea className="w-full whitespace-nowrap">
                <div className="flex gap-2">
                  {movie.genres?.slice(0, 3).map((genre) => (
                    <Badge 
                      key={genre.id} 
                      variant="outline" 
                      className="bg-white/5 text-white/80 border-white/20 text-xs whitespace-nowrap"
                    >
                      {genre.name}
                    </Badge>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" className="h-0" />
              </ScrollArea>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 space-y-6">
        {/* Action Buttons */}
        <div className="flex gap-3">
          {trailerKey ? (
            <Button 
              className="flex-1 bg-primary hover:bg-primary/90 rounded-xl h-12 font-medium"
              onClick={handleWatchTrailer}
            >
              <Play className="mr-2 h-4 w-4" />
              Watch Trailer
            </Button>
          ) : (
            <Button 
              className="flex-1 rounded-xl h-12 font-medium" 
              disabled
            >
              <Play className="mr-2 h-4 w-4" />
              No Trailer
            </Button>
          )}
          
          <Button 
            variant="outline" 
            className={cn(
              "rounded-xl h-12 w-12 p-0",
              isMovieLiked && "bg-primary border-primary text-primary-foreground"
            )}
            onClick={() => toggleLike(movieId, title, posterUrl)}
          >
            <Heart className={cn("h-5 w-5", isMovieLiked && "fill-current")} />
          </Button>

          <Button 
            variant="outline" 
            className={cn(
              "rounded-xl h-12 w-12 p-0",
              isMovieInWatchlist && "bg-secondary border-secondary text-secondary-foreground"
            )}
            onClick={() => toggleWatchlist(movieId, title, posterUrl)}
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>

        {/* Synopsis */}
        <Card className="p-4 bg-card/60 backdrop-blur-sm border-border/50">
          <h3 className="font-semibold text-foreground mb-3">Synopsis</h3>
          <p className="text-foreground/80 leading-relaxed text-sm line-clamp-4">
            {movie.overview || "No synopsis available."}
          </p>
          {movie.overview && movie.overview.length > 200 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSynopsis(true)}
              className="mt-2 p-0 h-auto text-primary hover:text-primary/80"
            >
              Read More
            </Button>
          )}
        </Card>

        {/* Cast */}
        {cast.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground text-lg">Cast</h3>
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex space-x-3 pb-2">
                {cast.map((actor) => (
                  <div key={actor.id} className="flex-shrink-0 w-20">
                    <ActorCard actor={actor} />
                  </div>
                ))}
              </div>
              <ScrollBar orientation="horizontal" className="h-2" />
            </ScrollArea>
          </div>
        )}

        {/* Crew */}
        {keyCrewMembers.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground text-lg">Crew</h3>
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex space-x-3 pb-2">
                {keyCrewMembers.map((member, index) => (
                  <div key={`${member.id}-${index}`} className="flex-shrink-0 w-20">
                    <CrewCard person={member} />
                  </div>
                ))}
              </div>
              <ScrollBar orientation="horizontal" className="h-2" />
            </ScrollArea>
          </div>
        )}

        {/* Similar Movies */}
        <div className="space-y-4">
          <h3 className="font-semibold text-foreground text-lg">More Like This</h3>
          <MovieCarousel title="Popular Movies" category="popular" />
        </div>
      </div>

      {/* Modals */}
      {showTrailer && trailerKey && (
        <TrailerModal
          isOpen={showTrailer}
          onClose={() => setShowTrailer(false)}
          trailerKey={trailerKey}
          movieTitle={title}
        />
      )}

      {showSynopsis && (
        <SynopsisModal
          isOpen={showSynopsis}
          onClose={() => setShowSynopsis(false)}
          title={title}
          synopsis={movie.overview || ""}
        />
      )}

      {/* iOS Tab Bar */}
      <IOSTabBar />
    </div>
  );
};

export default MovieDetail;
