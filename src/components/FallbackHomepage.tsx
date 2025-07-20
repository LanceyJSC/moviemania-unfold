
import { Film, Search, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export const FallbackHomepage = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Simple header */}
      <div className="bg-gradient-to-r from-cinema-black via-cinema-charcoal to-cinema-black p-6">
        <h1 className="font-cinematic text-3xl text-center text-foreground">
          CINE<span className="text-cinema-red">SCOPE</span>
        </h1>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-6 py-12 text-center">
        <div className="space-y-8">
          <div>
            <Film className="h-24 w-24 text-cinema-red mx-auto mb-6" />
            <h2 className="font-cinematic text-2xl text-foreground mb-4">
              Welcome to Your Movie Universe
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Discover, save, and explore thousands of movies with personalized recommendations.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/search">
              <Button className="bg-cinema-red hover:bg-cinema-red/90">
                <Search className="h-4 w-4 mr-2" />
                Search Movies
              </Button>
            </Link>
            <Link to="/movies">
              <Button variant="outline">
                <TrendingUp className="h-4 w-4 mr-2" />
                Browse Popular
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
