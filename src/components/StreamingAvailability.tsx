import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Tv } from "lucide-react";

interface StreamingService {
  id: string;
  name: string;
  logo: string;
  color: string;
  available: boolean;
  type: 'subscription' | 'rent' | 'buy';
  price?: string;
  url?: string;
}

interface StreamingAvailabilityProps {
  movieId: number;
  movieTitle: string;
}

export const StreamingAvailability = ({ movieId, movieTitle }: StreamingAvailabilityProps) => {
  const [services, setServices] = useState<StreamingService[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Mock streaming data - in real app, fetch from JustWatch API or similar
    const mockServices: StreamingService[] = [
      {
        id: 'netflix',
        name: 'Netflix',
        logo: '🔴',
        color: '#E50914',
        available: Math.random() > 0.5,
        type: 'subscription',
        url: 'https://netflix.com'
      },
      {
        id: 'disney',
        name: 'Disney+',
        logo: '🏰',
        color: '#113CCF',
        available: Math.random() > 0.5,
        type: 'subscription',
        url: 'https://disneyplus.com'
      },
      {
        id: 'hbo',
        name: 'HBO Max',
        logo: '🎭',
        color: '#552F8B',
        available: Math.random() > 0.5,
        type: 'subscription',
        url: 'https://hbomax.com'
      },
      {
        id: 'prime',
        name: 'Prime Video',
        logo: '📦',
        color: '#00A8E1',
        available: Math.random() > 0.5,
        type: 'subscription',
        url: 'https://primevideo.com'
      },
      {
        id: 'apple',
        name: 'Apple TV',
        logo: '🍎',
        color: '#000000',
        available: Math.random() > 0.5,
        type: 'rent',
        price: '$3.99',
        url: 'https://tv.apple.com'
      },
      {
        id: 'youtube',
        name: 'YouTube',
        logo: '📺',
        color: '#FF0000',
        available: true,
        type: 'buy',
        price: '$9.99',
        url: 'https://youtube.com'
      }
    ];

    // Simulate API call
    setTimeout(() => {
      setServices(mockServices);
      setIsLoading(false);
    }, 1000);
  }, [movieId]);

  if (isLoading) {
    return (
      <Card className="p-4 bg-card border border-border">
        <div className="flex items-center space-x-2 mb-3">
          <Tv className="h-4 w-4 text-primary" />
          <h3 className="font-medium text-foreground">Where to Watch</h3>
        </div>
        <div className="animate-pulse space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 bg-muted rounded" />
          ))}
        </div>
      </Card>
    );
  }

  const availableServices = services.filter(s => s.available);
  const subscriptionServices = availableServices.filter(s => s.type === 'subscription');
  const rentalServices = availableServices.filter(s => s.type === 'rent' || s.type === 'buy');

  return (
    <Card className="p-4 bg-card border border-border">
      <div className="flex items-center space-x-2 mb-4">
        <Tv className="h-4 w-4 text-primary" />
        <h3 className="font-medium text-foreground">Where to Watch</h3>
      </div>

      {availableServices.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No streaming options available for this movie.
        </p>
      ) : (
        <div className="space-y-4">
          {subscriptionServices.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-foreground mb-2">Included with Subscription</h4>
              <div className="grid grid-cols-2 gap-2">
                {subscriptionServices.map(service => (
                  <Button
                    key={service.id}
                    variant="outline"
                    className="justify-start h-auto p-3 hover:bg-muted"
                    onClick={() => window.open(service.url, '_blank')}
                  >
                    <span className="text-lg mr-2">{service.logo}</span>
                    <div className="text-left">
                      <div className="text-sm font-medium">{service.name}</div>
                      <Badge variant="secondary" className="text-xs mt-1">
                        Subscription
                      </Badge>
                    </div>
                    <ExternalLink className="h-3 w-3 ml-auto" />
                  </Button>
                ))}
              </div>
            </div>
          )}

          {rentalServices.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-foreground mb-2">Rent or Buy</h4>
              <div className="grid grid-cols-2 gap-2">
                {rentalServices.map(service => (
                  <Button
                    key={service.id}
                    variant="outline"
                    className="justify-start h-auto p-3 hover:bg-muted"
                    onClick={() => window.open(service.url, '_blank')}
                  >
                    <span className="text-lg mr-2">{service.logo}</span>
                    <div className="text-left">
                      <div className="text-sm font-medium">{service.name}</div>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge 
                          variant={service.type === 'rent' ? 'secondary' : 'default'}
                          className="text-xs"
                        >
                          {service.type === 'rent' ? 'Rent' : 'Buy'}
                        </Badge>
                        {service.price && (
                          <span className="text-xs text-muted-foreground">{service.price}</span>
                        )}
                      </div>
                    </div>
                    <ExternalLink className="h-3 w-3 ml-auto" />
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-border">
        <p className="text-xs text-muted-foreground">
          Streaming availability may vary by region. Prices and availability are subject to change.
        </p>
      </div>
    </Card>
  );
};