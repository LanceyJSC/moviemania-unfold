const TMDB_API_KEY = '8265bd1679663a7ea12ac168da84d2e8'; // Public key, safe to use
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

export interface Movie {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  release_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  adult: boolean;
  original_language: string;
  original_title: string;
  popularity: number;
  video: boolean;
  runtime?: number;
  genres?: { id: number; name: string }[];
  production_companies?: { id: number; name: string; logo_path: string | null }[];
  cast?: { id: number; name: string; character: string; profile_path: string | null }[];
  crew?: { id: number; name: string; job: string; profile_path: string | null }[];
  videos?: { results: { id: string; key: string; name: string; type: string; site: string }[] };
}

export interface TMDBResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

class TMDBService {
  private async fetchFromTMDB<T>(endpoint: string): Promise<T> {
    const url = `${TMDB_BASE_URL}${endpoint}${endpoint.includes('?') ? '&' : '?'}api_key=${TMDB_API_KEY}`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`TMDB API error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('TMDB fetch error:', error);
      throw error;
    }
  }

  // Search movies
  async searchMovies(query: string, page: number = 1): Promise<TMDBResponse<Movie>> {
    return this.fetchFromTMDB(`/search/movie?query=${encodeURIComponent(query)}&page=${page}`);
  }

  // Get trending movies
  async getTrendingMovies(timeWindow: 'day' | 'week' = 'week'): Promise<TMDBResponse<Movie>> {
    return this.fetchFromTMDB(`/trending/movie/${timeWindow}`);
  }

  // Get top rated movies
  async getTopRatedMovies(page: number = 1): Promise<TMDBResponse<Movie>> {
    return this.fetchFromTMDB(`/movie/top_rated?page=${page}`);
  }

  // Get popular movies
  async getPopularMovies(page: number = 1): Promise<TMDBResponse<Movie>> {
    return this.fetchFromTMDB(`/movie/popular?page=${page}`);
  }

  // Get upcoming movies
  async getUpcomingMovies(page: number = 1): Promise<TMDBResponse<Movie>> {
    return this.fetchFromTMDB(`/movie/upcoming?page=${page}`);
  }

  // Get movie details
  async getMovieDetails(movieId: number): Promise<Movie> {
    return this.fetchFromTMDB(`/movie/${movieId}?append_to_response=credits,videos`);
  }

  // Get genres
  async getGenres(): Promise<{ genres: { id: number; name: string }[] }> {
    return this.fetchFromTMDB(`/genre/movie/list`);
  }

  // Discover movies with filters
  async discoverMovies(filters: {
    genre?: number;
    year?: number;
    rating?: number;
    page?: number;
  } = {}): Promise<TMDBResponse<Movie>> {
    const params = new URLSearchParams();
    
    if (filters.genre) params.append('with_genres', filters.genre.toString());
    if (filters.year) params.append('year', filters.year.toString());
    if (filters.rating) params.append('vote_average.gte', filters.rating.toString());
    if (filters.page) params.append('page', filters.page.toString());
    
    const queryString = params.toString();
    return this.fetchFromTMDB(`/discover/movie?${queryString}`);
  }

  // Image URL helpers
  getPosterUrl(path: string | null, size: 'w300' | 'w500' | 'w780' | 'original' = 'w500'): string {
    if (!path) return '/placeholder.svg';
    return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
  }

  getBackdropUrl(path: string | null, size: 'w780' | 'w1280' | 'original' = 'w1280'): string {
    if (!path) return '/placeholder.svg';
    return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
  }

  // Format movie data for components
  formatMovieForCard(movie: Movie) {
    return {
      id: movie.id,
      title: movie.title,
      poster: this.getPosterUrl(movie.poster_path),
      year: movie.release_date ? new Date(movie.release_date).getFullYear().toString() : 'TBA',
      rating: movie.vote_average.toFixed(1),
      genre: movie.genres?.[0]?.name || 'Unknown'
    };
  }
}

export const tmdbService = new TMDBService();