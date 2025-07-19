import { HeroSection } from "@/components/HeroSection";
import { MovieCarousel } from "@/components/MovieCarousel";
import { Navigation } from "@/components/Navigation";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <HeroSection />

      {/* Content Sections */}
      <div className="container mx-auto px-6 py-16 space-y-16 pb-24 md:pb-16">
        <MovieCarousel title="TRENDING NOW" category="trending" cardSize="medium" />
        <MovieCarousel title="TOP RATED MOVIES" category="top_rated" cardSize="medium" />
        <MovieCarousel title="POPULAR MOVIES" category="popular" cardSize="medium" />
        <MovieCarousel title="UPCOMING RELEASES" category="upcoming" cardSize="medium" />
      </div>

      {/* Footer */}
      <footer className="bg-cinema-charcoal border-t border-border py-12">
        <div className="container mx-auto px-6 text-center">
          <h3 className="text-2xl font-cinematic text-foreground mb-4 tracking-wide">
            CINE<span className="text-cinema-red">SCOPE</span>
          </h3>
          <p className="text-muted-foreground">
            Discover, Save, and Experience Movies Like Never Before
          </p>
        </div>
      </footer>

      {/* Mobile Navigation */}
      <Navigation />
    </div>
  );
};

export default Index;
