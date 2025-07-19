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
  credits?: {
    cast: { id: number; name: string; character: string; profile_path: string | null }[];
    crew: { id: number; name: string; job: string; profile_path: string | null }[];
  };
  videos?: { results: { id: string; key: string; name: string; type: string; site: string }[] };
}

export interface Person {
  id: number;
  name: string;
  profile_path: string | null;
  biography: string;
  birthday: string | null;
  place_of_birth: string | null;
  known_for_department: string;
  movie_credits?: {
    cast: Array<{
      id: number;
      title: string;
      character: string;
      poster_path: string | null;
      release_date: string;
      vote_average: number;
    }>;
  };
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

  // Get trending movies - Enhanced with time window
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

  // Get upcoming movies - Filter to only show future releases
  async getUpcomingMovies(page: number = 1): Promise<TMDBResponse<Movie>> {
    const response = await this.fetchFromTMDB<TMDBResponse<Movie>>(`/movie/upcoming?page=${page}`);
    const today = new Date().toISOString().split('T')[0];
    
    // Filter to only include movies with release dates in the future
    const filteredResults = response.results.filter(movie => 
      movie.release_date && movie.release_date > today
    );
    
    return {
      ...response,
      results: filteredResults
    };
  }

  // Get movie details - Fixed to properly append credits
  async getMovieDetails(movieId: number): Promise<Movie> {
    return this.fetchFromTMDB(`/movie/${movieId}?append_to_response=credits,videos`);
  }

  // Get genres
  async getGenres(): Promise<{ genres: { id: number; name: string }[] }> {
    return this.fetchFromTMDB(`/genre/movie/list`);
  }

  // Enhanced discover movies with filters
  async discoverMovies(filters: {
    genre?: number;
    year?: number;
    rating?: number;
    page?: number;
    sortBy?: string;
    releaseDate?: { gte?: string; lte?: string };
  } = {}): Promise<TMDBResponse<Movie>> {
    const params = new URLSearchParams();
    
    if (filters.genre) params.append('with_genres', filters.genre.toString());
    if (filters.year) params.append('year', filters.year.toString());
    if (filters.rating) params.append('vote_average.gte', filters.rating.toString());
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.sortBy) params.append('sort_by', filters.sortBy);
    if (filters.releaseDate?.gte) params.append('release_date.gte', filters.releaseDate.gte);
    if (filters.releaseDate?.lte) params.append('release_date.lte', filters.releaseDate.lte);
    
    const queryString = params.toString();
    return this.fetchFromTMDB(`/discover/movie?${queryString}`);
  }

  // Enhanced: Get movies released this month
  async getThisMonthMovies(): Promise<TMDBResponse<Movie>> {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    return this.discoverMovies({
      releaseDate: {
        gte: firstDay.toISOString().split('T')[0],
        lte: lastDay.toISOString().split('T')[0]
      },
      sortBy: 'release_date.desc'
    });
  }

  // Enhanced: Get movies released this week
  async getThisWeekMovies(): Promise<TMDBResponse<Movie>> {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    return this.discoverMovies({
      releaseDate: {
        gte: weekAgo.toISOString().split('T')[0],
        lte: now.toISOString().split('T')[0]
      },
      sortBy: 'release_date.desc'
    });
  }

  // Get person details
  async getPersonDetails(personId: number): Promise<Person> {
    return this.fetchFromTMDB(`/person/${personId}?append_to_response=movie_credits`);
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

  // Enhanced profile URL with better fallback handling
  getProfileUrl(path: string | null, size: 'w185' | 'w632' | 'original' = 'w185'): string {
    if (!path || path.trim() === '') {
      return '/placeholder.svg';
    }
    // Try different sizes if the main one fails
    try {
      return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
    } catch (error) {
      console.log('Profile image error:', error);
      return '/placeholder.svg';
    }
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
