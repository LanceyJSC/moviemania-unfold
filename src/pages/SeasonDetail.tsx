import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Calendar, Clock, Star, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileHeader } from "@/components/MobileHeader";
import { Navigation } from "@/components/Navigation";
import { tmdbService } from "@/lib/tmdb";

interface Episode {
  id: number;
  name: string;
  overview: string;
  still_path: string | null;
  air_date: string;
  episode_number: number;
  runtime: number | null;
  vote_average: number;
}

interface Season {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  air_date: string;
  episode_count: number;
  season_number: number;
  episodes: Episode[];
  images?: {
    backdrops: { file_path: string; vote_average: number }[];
  };
}

interface TVShow {
  id: number;
  name: string;
  poster_path: string | null;
  backdrop_path: string | null;
}

const SeasonDetail = () => {
  const { id, seasonNumber } = useParams<{ id: string; seasonNumber: string }>();
  const [season, setSeason] = useState<Season | null>(null);
  const [tvShow, setTVShow] = useState<TVShow | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSeasonDetails = async () => {
      if (!id || !seasonNumber) return;
      
      setIsLoading(true);
      try {
        // Get basic TV show info
        const tvShowData = await tmdbService.getTVShowDetails(Number(id));
        setTVShow(tvShowData);

        // Get season details with episodes
        const seasonData = await tmdbService.getSeasonDetails(Number(id), Number(seasonNumber)) as Season;
        setSeason(seasonData);
      } catch (error) {
        console.error('Failed to load season details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSeasonDetails();
  }, [id, seasonNumber]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <MobileHeader title="Loading..." />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cinema-red"></div>
        </div>
      </div>
    );
  }

  if (!season || !tvShow) {
    return (
      <div className="min-h-screen bg-background">
        <MobileHeader title="Season Not Found" />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Season not found</h1>
            <Link to={`/tv/${id}`}>
              <Button>Back to TV Show</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const seasonPosterUrl = tmdbService.getPosterUrl(season.poster_path, 'w500');
  
  // Priority for backdrop selection:
  // 1. Season-specific backdrop from season.backdrop_path
  // 2. Random episode still from the season (creates season-specific look)
  // 3. Fall back to TV show backdrop
  const getSeasonBackdrop = () => {
    // First try the direct season backdrop
    if (season.backdrop_path) {
      return tmdbService.getBackdropUrl(season.backdrop_path, 'original');
    }
    
    // Use a random episode still from this season as backdrop for uniqueness
    if (season.episodes && season.episodes.length > 0) {
      const episodesWithStills = season.episodes.filter(ep => ep.still_path);
      if (episodesWithStills.length > 0) {
        // Use first episode still (or random) to create season-specific backdrop
        const selectedEpisode = episodesWithStills[0]; // Could randomize: Math.floor(Math.random() * episodesWithStills.length)
        return tmdbService.getImageUrl(selectedEpisode.still_path, 'original');
      }
    }
    
    // Finally fall back to TV show backdrop
    return tmdbService.getBackdropUrl(tvShow.backdrop_path, 'original');
  };
  
  const seasonBackdropUrl = getSeasonBackdrop();

  return (
    <div className="min-h-screen bg-background pb-32">
      <MobileHeader title={season.name} />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden h-[40vh]">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${seasonBackdropUrl})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-cinema-black/30 via-cinema-black/15 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-cinema-black/40 via-transparent to-transparent" />
        </div>

        {/* Bottom Gradient Blend */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none z-20" />

        {/* Season Info */}
        <div className="absolute bottom-6 left-4 right-4 z-30">
          <div className="flex items-end gap-4">
            <img 
              src={seasonPosterUrl} 
              alt={season.name}
              className="w-24 h-36 rounded-lg shadow-cinematic object-cover border-2 border-white/20"
            />
            <div className="flex-1">
              <h1 className="font-cinematic text-white mb-2 tracking-wide text-2xl leading-tight">
                {season.name}
              </h1>
              <div className="flex items-center space-x-3 mb-2">
                <span className="text-white/80 text-sm">{tvShow.name}</span>
                {season.air_date && (
                  <span className="text-white/80 text-sm">
                    {new Date(season.air_date).getFullYear()}
                  </span>
                )}
                <span className="text-white/80 text-sm">
                  {season.episode_count} episode{season.episode_count !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Season Overview */}
      {season.overview && (
        <div className="container mx-auto px-4 -mt-4 relative z-30 mb-6">
          <div className="bg-black/40 backdrop-blur-sm rounded-lg p-4 border border-white/10">
            <p className="text-white leading-relaxed text-sm">
              {season.overview}
            </p>
          </div>
        </div>
      )}

      {/* Episodes Section */}
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-cinematic text-foreground tracking-wide">
            EPISODES ({season.episodes?.length || 0})
          </h2>
          <Button variant="outline" size="sm" className="text-xs">
            Sort <Calendar className="h-3 w-3 ml-1" />
          </Button>
        </div>

        <div className="space-y-4">
          {season.episodes?.map((episode) => (
            <div key={episode.id} className="group">
              <div className="flex gap-4 p-4 bg-card/30 rounded-lg border border-border/50 hover:border-cinema-red/50 transition-all duration-200 hover:bg-card/50">
                {/* Episode Screenshot */}
                <div className="flex-shrink-0">
                  <div className="relative w-32 h-18 rounded overflow-hidden bg-muted">
                    {episode.still_path ? (
                      <img 
                        src={tmdbService.getImageUrl(episode.still_path, 'w300')}
                        alt={episode.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <Play className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    {/* Episode Number Overlay */}
                    <div className="absolute top-1 left-1 bg-black/80 text-white text-xs px-2 py-1 rounded">
                      {episode.episode_number}
                    </div>
                  </div>
                </div>

                {/* Episode Info */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-foreground group-hover:text-cinema-red transition-colors">
                      {episode.name}
                    </h3>
                    {episode.vote_average > 0 && (
                      <div className="flex items-center gap-1 text-cinema-gold text-xs">
                        <Star className="h-3 w-3 fill-current" />
                        <span>{episode.vote_average.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3 text-muted-foreground text-xs mb-2">
                    {episode.air_date && (
                      <span>{new Date(episode.air_date).toLocaleDateString()}</span>
                    )}
                    {episode.runtime && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {episode.runtime}m
                      </span>
                    )}
                  </div>
                  
                  <p className="text-muted-foreground text-sm line-clamp-2 leading-relaxed">
                    {episode.overview || "No description available."}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile Navigation */}
      <Navigation />
    </div>
  );
};

export default SeasonDetail;