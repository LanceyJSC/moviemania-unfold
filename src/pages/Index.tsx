
import { HeroSection } from "@/components/HeroSection";
import { SwipeableMovieCarousel } from "@/components/SwipeableMovieCarousel";
import { SwipeableTVCarousel } from "@/components/SwipeableTVCarousel";
import { MovieStats } from "@/components/MovieStats";
import { QuickGenres } from "@/components/QuickGenres";
import { Navigation } from "@/components/Navigation";
import { NewThisMonth } from "@/components/NewThisMonth";
import { FreshPicks } from "@/components/FreshPicks";
import { TrailerProvider } from "@/contexts/TrailerContext";

const Index = () => {
  return (
    <TrailerProvider>
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <HeroSection />

        {/* Content Sections - Enhanced with TV shows */}
        <div className="container mx-auto px-1 md:px-4 py-8 space-y-12 pb-24">
          {/* Quick Stats */}
          <MovieStats />
          
          {/* Genre Navigation */}
          <QuickGenres />

          {/* New Dynamic Content Sections */}
          <NewThisMonth />
          <FreshPicks />
          
          {/* Movie Carousels */}
          <SwipeableMovieCarousel title="TRENDING MOVIES" category="trending" cardSize="medium" />
          <SwipeableMovieCarousel title="TOP RATED MOVIES" category="top_rated" cardSize="medium" />
          
          {/* TV Show Carousels */}
          <SwipeableTVCarousel title="TRENDING TV SHOWS" category="trending" cardSize="medium" />
          <SwipeableTVCarousel title="TOP RATED TV SHOWS" category="top_rated" cardSize="medium" />
          
          {/* More Movie/TV Content */}
          <SwipeableMovieCarousel title="POPULAR MOVIES" category="popular" cardSize="medium" />
          <SwipeableTVCarousel title="POPULAR TV SHOWS" category="popular" cardSize="medium" />
          <SwipeableMovieCarousel title="UPCOMING RELEASES" category="upcoming" cardSize="medium" />
          <SwipeableTVCarousel title="AIRING TODAY" category="airing_today" cardSize="medium" />
        </div>

        {/* Footer - Mobile optimized */}
        <footer className="bg-cinema-charcoal border-t border-border py-8 mb-24">
          <div className="container mx-auto px-1 md:px-4 text-center">
            <h3 className="text-xl font-cinematic text-foreground mb-3 tracking-wide">
              CINE<span className="text-cinema-red">SCOPE</span>
            </h3>
            <p className="text-muted-foreground text-sm">
              Discover, Save, and Experience Movies & TV Shows Like Never Before
            </p>
          </div>
        </footer>

        {/* Mobile Navigation */}
        <Navigation />
      </div>
    </TrailerProvider>
  );
};

export default Index;
