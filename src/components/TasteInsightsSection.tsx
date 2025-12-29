import { useState } from 'react';
import { ChevronDown, ChevronUp, User, Video, Lightbulb, Crown, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { TasteProfile } from '@/hooks/useTasteProfile';
import { cn } from '@/lib/utils';

interface TasteInsightsSectionProps {
  profile: TasteProfile | null;
  loading: boolean;
  isProUser: boolean;
  onUpgradeClick?: () => void;
}

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w185';

export const TasteInsightsSection = ({ 
  profile, 
  loading, 
  isProUser,
  onUpgradeClick 
}: TasteInsightsSectionProps) => {
  const [isOpen, setIsOpen] = useState(true);

  // Don't render if loading or no profile
  if (loading || !profile) return null;

  // Locked state for non-Pro users
  if (!isProUser) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50 relative overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lightbulb className="w-5 h-5 text-amber-400" />
            Personalized Insights
            <Badge variant="outline" className="ml-auto bg-amber-500/10 text-amber-400 border-amber-500/30 text-xs">
              <Crown className="w-3 h-3 mr-1" />
              PRO
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative min-h-[150px]">
            {/* Blurred preview */}
            <div className="blur-sm opacity-40 pointer-events-none space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="p-3 rounded-lg bg-muted/50 h-12" />
              ))}
            </div>
            
            {/* Unlock overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Lock className="w-6 h-6 text-amber-400 mb-2" />
              <p className="text-sm text-muted-foreground text-center mb-3">
                Get AI-generated insights about your viewing habits
              </p>
              <Button 
                onClick={onUpgradeClick}
                variant="outline"
                className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
                size="sm"
              >
                <Crown className="w-4 h-4 mr-2" />
                Unlock with Pro
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-2 cursor-pointer hover:bg-muted/30 transition-colors rounded-t-lg">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lightbulb className="w-5 h-5 text-amber-400" />
              Personalized Insights
              {isOpen ? (
                <ChevronUp className="w-4 h-4 ml-auto text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 ml-auto text-muted-foreground" />
              )}
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="space-y-6">
            {/* Insight Strings */}
            <div className="space-y-2">
              {profile.insightStrings.map((insight, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "p-3 rounded-lg border-l-2 transition-all",
                    i === 0 ? "bg-amber-500/10 border-amber-500" : "bg-muted/30 border-muted-foreground/30"
                  )}
                >
                  <p className="text-sm">{insight}</p>
                </div>
              ))}
            </div>

            {/* Top Actors */}
            {profile.topActors.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Favorite Actors
                </h4>
                <div className="flex flex-wrap gap-3">
                  {profile.topActors.map((actor) => (
                    <div 
                      key={actor.id} 
                      className="flex items-center gap-2 p-2 pr-3 rounded-full bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <Avatar className="w-8 h-8">
                        {actor.photo && (
                          <AvatarImage src={`${TMDB_IMAGE_BASE}${actor.photo}`} alt={actor.name} />
                        )}
                        <AvatarFallback className="text-xs">
                          {actor.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium leading-tight">{actor.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {actor.avgRating}★ • {actor.count} films
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top Directors */}
            {profile.topDirectors.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Video className="w-4 h-4" />
                  Favorite Directors
                </h4>
                <div className="flex flex-wrap gap-3">
                  {profile.topDirectors.map((director) => (
                    <div 
                      key={director.id} 
                      className="flex items-center gap-2 p-2 pr-3 rounded-full bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <Avatar className="w-8 h-8">
                        {director.photo && (
                          <AvatarImage src={`${TMDB_IMAGE_BASE}${director.photo}`} alt={director.name} />
                        )}
                        <AvatarFallback className="text-xs">
                          {director.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium leading-tight">{director.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {director.avgRating}★ • {director.count} films
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Era Breakdown */}
            {profile.eraPreference.length > 1 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">Era Distribution</h4>
                <div className="flex gap-2 flex-wrap">
                  {profile.eraPreference.map((era) => (
                    <Badge 
                      key={era.decade} 
                      variant="secondary"
                      className="text-xs"
                    >
                      {era.decade}: {era.count} films ({era.avgRating}★)
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};
