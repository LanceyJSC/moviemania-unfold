import { HeroSection } from "@/components/HeroSection";
import { MovieCarousel } from "@/components/MovieCarousel";
import { Navigation } from "@/components/Navigation";

// Mock data - in a real app, this would come from APIs
const trendingMovies = [
  {
    id: 1,
    title: "Oppenheimer",
    poster: "https://images.unsplash.com/photo-1509647084632-bc2540fba87a?w=400&h=600&fit=crop",
    year: "2023",
    rating: "8.4",
    genre: "Drama"
  },
  {
    id: 2,
    title: "Dune: Part Two",
    poster: "https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=400&h=600&fit=crop",
    year: "2024",
    rating: "8.6",
    genre: "Sci-Fi"
  },
  {
    id: 3,
    title: "Interstellar",
    poster: "https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=400&h=600&fit=crop",
    year: "2014",
    rating: "8.7",
    genre: "Sci-Fi"
  },
  {
    id: 4,
    title: "The Dark Knight",
    poster: "https://images.unsplash.com/photo-1509647084632-bc2540fba87a?w=400&h=600&fit=crop",
    year: "2008",
    rating: "9.0",
    genre: "Action"
  },
  {
    id: 5,
    title: "Inception",
    poster: "https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=400&h=600&fit=crop",
    year: "2010",
    rating: "8.8",
    genre: "Thriller"
  },
  {
    id: 6,
    title: "Blade Runner 2049",
    poster: "https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=400&h=600&fit=crop",
    year: "2017",
    rating: "8.0",
    genre: "Sci-Fi"
  }
];

const topRatedMovies = [
  {
    id: 7,
    title: "The Godfather",
    poster: "https://images.unsplash.com/photo-1509647084632-bc2540fba87a?w=400&h=600&fit=crop",
    year: "1972",
    rating: "9.2",
    genre: "Crime"
  },
  {
    id: 8,
    title: "Schindler's List",
    poster: "https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=400&h=600&fit=crop",
    year: "1993",
    rating: "9.0",
    genre: "Drama"
  },
  {
    id: 9,
    title: "Pulp Fiction",
    poster: "https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=400&h=600&fit=crop",
    year: "1994",
    rating: "8.9",
    genre: "Crime"
  },
  {
    id: 10,
    title: "12 Angry Men",
    poster: "https://images.unsplash.com/photo-1509647084632-bc2540fba87a?w=400&h=600&fit=crop",
    year: "1957",
    rating: "9.0",
    genre: "Drama"
  },
  {
    id: 11,
    title: "The Lord of the Rings",
    poster: "https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=400&h=600&fit=crop",
    year: "2003",
    rating: "9.0",
    genre: "Adventure"
  }
];

const popularTVShows = [
  {
    id: 12,
    title: "Breaking Bad",
    poster: "https://images.unsplash.com/photo-1509647084632-bc2540fba87a?w=400&h=600&fit=crop",
    year: "2008",
    rating: "9.5",
    genre: "Crime"
  },
  {
    id: 13,
    title: "Game of Thrones",
    poster: "https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=400&h=600&fit=crop",
    year: "2011",
    rating: "9.2",
    genre: "Fantasy"
  },
  {
    id: 14,
    title: "Stranger Things",
    poster: "https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=400&h=600&fit=crop",
    year: "2016",
    rating: "8.7",
    genre: "Horror"
  },
  {
    id: 15,
    title: "The Office",
    poster: "https://images.unsplash.com/photo-1509647084632-bc2540fba87a?w=400&h=600&fit=crop",
    year: "2005",
    rating: "9.0",
    genre: "Comedy"
  }
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <HeroSection />

      {/* Content Sections */}
      <div className="container mx-auto px-6 py-16 space-y-16 pb-24 md:pb-16">
        {/* Trending Now */}
        <MovieCarousel 
          title="TRENDING NOW" 
          movies={trendingMovies}
          cardSize="medium"
        />

        {/* Top Rated Movies */}
        <MovieCarousel 
          title="TOP RATED MOVIES" 
          movies={topRatedMovies}
          cardSize="medium"
        />

        {/* Popular TV Shows */}
        <MovieCarousel 
          title="POPULAR TV SHOWS" 
          movies={popularTVShows}
          cardSize="medium"
        />
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
