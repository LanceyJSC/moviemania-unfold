import { useState, useEffect } from 'react';
import { Tv, ExternalLink } from 'lucide-react';
import { tmdbService, WatchProvidersResult } from '@/lib/tmdb';

interface WatchProvidersProps {
  mediaId: number;
  mediaType: 'movie' | 'tv';
  region?: string;
}

export const WatchProviders = ({ mediaId, mediaType, region = 'US' }: WatchProvidersProps) => {
  const [providers, setProviders] = useState<WatchProvidersResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProviders = async () => {
      setIsLoading(true);
      try {
        const response = mediaType === 'movie' 
          ? await tmdbService.getMovieWatchProviders(mediaId)
          : await tmdbService.getTVWatchProviders(mediaId);
        
        // Get providers for the specified region
        const regionProviders = response.results?.[region];
        setProviders(regionProviders || null);
      } catch (error) {
        console.error('Failed to fetch watch providers:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProviders();
  }, [mediaId, mediaType, region]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 animate-pulse">
        <div className="w-8 h-8 bg-muted rounded"></div>
        <div className="w-8 h-8 bg-muted rounded"></div>
        <div className="w-8 h-8 bg-muted rounded"></div>
      </div>
    );
  }

  if (!providers || (!providers.flatrate?.length && !providers.rent?.length && !providers.buy?.length && !providers.free?.length)) {
    return null;
  }

  const allProviders = [
    ...(providers.flatrate || []),
    ...(providers.free || []),
  ].slice(0, 6);

  if (allProviders.length === 0) {
    return null;
  }

  return (
    <div className="bg-card/50 backdrop-blur-sm rounded-lg p-4 border border-border">
      <div className="flex items-center gap-2 mb-3">
        <Tv className="h-4 w-4 text-cinema-gold" />
        <h3 className="text-sm font-semibold text-foreground">Where to Watch</h3>
      </div>
      
      <div className="flex flex-wrap items-center gap-2">
        {allProviders.map((provider) => (
          <div
            key={provider.provider_id}
            className="group relative"
            title={provider.provider_name}
          >
            <img
              src={tmdbService.getImageUrl(provider.logo_path, 'w300')}
              alt={provider.provider_name}
              className="w-10 h-10 rounded-lg object-cover border border-border/50 transition-transform hover:scale-110"
            />
            <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              {provider.provider_name}
            </span>
          </div>
        ))}
        
        {providers.link && (
          <a
            href={providers.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-cinema-gold hover:underline ml-2"
          >
            <span>More</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
      
      <p className="text-[10px] text-muted-foreground mt-3">
        Data from JustWatch
      </p>
    </div>
  );
};
