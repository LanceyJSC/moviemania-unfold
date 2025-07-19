
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, DollarSign, Trophy, Calendar, Users, Globe } from "lucide-react";
import { Movie } from "@/lib/tmdb";
import { useTrailerContext } from "@/contexts/TrailerContext";

interface FunFactsProps {
  movie: Movie;
}

interface MovieFact {
  id: string;
  title: string;
  content: string;
  icon: React.ReactNode;
}

export const FunFacts = ({ movie }: FunFactsProps) => {
  const [currentFactIndex, setCurrentFactIndex] = useState(0);
  const { isTrailerOpen } = useTrailerContext();

  // Generate real facts from movie data
  const facts: MovieFact[] = [
    {
      id: '1',
      title: 'Runtime',
      content: movie.runtime ? `The movie runs for ${movie.runtime} minutes` : 'Runtime information not available',
      icon: <Clock className="h-4 w-4" />
    },
    {
      id: '2',
      title: 'Release Year',
      content: `Released in ${new Date(movie.release_date).getFullYear()}`,
      icon: <Calendar className="h-4 w-4" />
    },
    {
      id: '3',
      title: 'Audience Score',
      content: `Rated ${movie.vote_average.toFixed(1)}/10 by ${movie.vote_count.toLocaleString()} viewers`,
      icon: <Trophy className="h-4 w-4" />
    },
    {
      id: '4',
      title: 'Language',
      content: `Originally filmed in ${movie.original_language.toUpperCase()}`,
      icon: <Globe className="h-4 w-4" />
    },
    {
      id: '5',
      title: 'Cast Size',
      content: movie.credits?.cast ? `Features ${movie.credits.cast.length} cast members` : 'Cast information available',
      icon: <Users className="h-4 w-4" />
    }
  ].filter(fact => fact.content && !fact.content.includes('not available'));

  // Auto-rotate facts every 10 seconds, but pause when trailer is open
  useEffect(() => {
    if (facts.length === 0 || isTrailerOpen) return;
    
    const interval = setInterval(() => {
      setCurrentFactIndex((prev) => (prev + 1) % facts.length);
    }, 10000);

    return () => clearInterval(interval);
  }, [facts.length, isTrailerOpen]);

  if (facts.length === 0) return null;

  const currentFact = facts[currentFactIndex];

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-foreground mb-3">Fun Facts</h3>
      <Card className="p-4 bg-muted/50 min-h-[80px] flex items-center">
        <div className="flex items-start space-x-3 w-full">
          <div className="flex-shrink-0 p-2 bg-primary/10 rounded-lg text-primary">
            {currentFact.icon}
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-foreground mb-1">
              {currentFact.title}
            </h4>
            <p className="text-sm text-muted-foreground">
              {currentFact.content}
            </p>
          </div>
        </div>
      </Card>
      
      {/* Progress indicators */}
      <div className="flex justify-center space-x-2 mt-3">
        {facts.map((_, index) => (
          <div
            key={index}
            className={`h-1 w-6 rounded-full transition-colors ${
              index === currentFactIndex ? 'bg-primary' : 'bg-muted'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
