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

export interface TVShow {
  id: number;
  name: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  first_air_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  adult: boolean;
  original_language: string;
  original_name: string;
  popularity: number;
  origin_country: string[];
  number_of_episodes?: number;
  number_of_seasons?: number;
  genres?: { id: number; name: string }[];
  created_by?: { id: number; name: string; profile_path: string | null }[];
  credits?: {
    cast: { id: number; name: string; character: string; profile_path: string | null }[];
    crew: { id: number; name: string; job: string; profile_path: string | null }[];
  };
  videos?: { results: { id: string; key: string; name: string; type: string; site: string }[] };
  seasons?: {
    id: number;
    name: string;
    poster_path: string | null;
    season_number: number;
    episode_count: number;
  }[];
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

export interface Review {
  id: string;
  author: string;
  author_details: {
    name: string;
    username: string;
    avatar_path: string | null;
    rating: number | null;
  };
  content: string;
  created_at: string;
  updated_at: string;
  url: string;
}

export interface TMDBResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

class TMDBService {
  private async fetchFromTMDB<T>(endpoint: string, bustCache: boolean = false): Promise<T> {
    const url = `${TMDB_BASE_URL}${endpoint}${endpoint.includes('?') ? '&' : '?'}api_key=${TMDB_API_KEY}`;
    
    const fetchOptions: RequestInit = {
      headers: {
        'Cache-Control': bustCache ? 'no-cache' : 'max-age=3600' // 1 hour max cache
      }
    };
    
    try {
      const response = await fetch(url, fetchOptions);
      if (!response.ok) {
        throw new Error(`TMDB API error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('TMDB fetch error:', error);
      throw error;
    }
  }

  // Movie methods
  async searchMovies(query: string, page: number = 1): Promise<TMDBResponse<Movie>> {
    return this.fetchFromTMDB(`/search/movie?query=${encodeURIComponent(query)}&page=${page}`);
  }

  async getTrendingMovies(timeWindow: 'day' | 'week' = 'week', fresh: boolean = false): Promise<TMDBResponse<Movie>> {
    return this.fetchFromTMDB(`/trending/movie/${timeWindow}`, fresh);
  }

  async getTopRatedMovies(page: number = 1, fresh: boolean = false): Promise<TMDBResponse<Movie>> {
    return this.fetchFromTMDB(`/movie/top_rated?page=${page}`, fresh);
  }

  async getPopularMovies(page: number = 1, fresh: boolean = false): Promise<TMDBResponse<Movie>> {
    return this.fetchFromTMDB(`/movie/popular?page=${page}`, fresh);
  }

  async getUpcomingMovies(page: number = 1, fresh: boolean = false): Promise<TMDBResponse<Movie>> {
    const response = await this.fetchFromTMDB<TMDBResponse<Movie>>(`/movie/upcoming?page=${page}`, fresh);
    const today = new Date().toISOString().split('T')[0];
    
    const filteredResults = response.results.filter(movie => 
      movie.release_date && movie.release_date > today
    );
    
    return {
      ...response,
      results: filteredResults
    };
  }

  async getNowPlayingMovies(page: number = 1, fresh: boolean = false): Promise<TMDBResponse<Movie>> {
    return this.fetchFromTMDB(`/movie/now_playing?page=${page}`, fresh);
  }

  async getMovieDetails(movieId: number, fresh: boolean = false): Promise<Movie> {
    return this.fetchFromTMDB(`/movie/${movieId}?append_to_response=credits,videos`, fresh);
  }

  // TV Show methods
  async searchTVShows(query: string, page: number = 1): Promise<TMDBResponse<TVShow>> {
    return this.fetchFromTMDB(`/search/tv?query=${encodeURIComponent(query)}&page=${page}`);
  }

  async getTrendingTVShows(timeWindow: 'day' | 'week' = 'week', fresh: boolean = false): Promise<TMDBResponse<TVShow>> {
    return this.fetchFromTMDB(`/trending/tv/${timeWindow}`, fresh);
  }

  async getTopRatedTVShows(page: number = 1, fresh: boolean = false): Promise<TMDBResponse<TVShow>> {
    return this.fetchFromTMDB(`/tv/top_rated?page=${page}`, fresh);
  }

  async getPopularTVShows(page: number = 1, fresh: boolean = false): Promise<TMDBResponse<TVShow>> {
    return this.fetchFromTMDB(`/tv/popular?page=${page}`, fresh);
  }

  async getAiringTodayTVShows(page: number = 1, fresh: boolean = false): Promise<TMDBResponse<TVShow>> {
    return this.fetchFromTMDB(`/tv/airing_today?page=${page}`, fresh);
  }

  async getOnTheAirTVShows(page: number = 1, fresh: boolean = false): Promise<TMDBResponse<TVShow>> {
    return this.fetchFromTMDB(`/tv/on_the_air?page=${page}`, fresh);
  }

  async getTVShowDetails(tvId: number, fresh: boolean = false): Promise<TVShow> {
    return this.fetchFromTMDB(`/tv/${tvId}?append_to_response=credits,videos`, fresh);
  }

  // Combined search
  async searchMulti(query: string, page: number = 1): Promise<TMDBResponse<Movie | TVShow>> {
    return this.fetchFromTMDB(`/search/multi?query=${encodeURIComponent(query)}&page=${page}`);
  }

  // Genre methods
  async getGenres(): Promise<{ genres: { id: number; name: string }[] }> {
    return this.fetchFromTMDB(`/genre/movie/list`);
  }

  async getTVGenres(): Promise<{ genres: { id: number; name: string }[] }> {
    return this.fetchFromTMDB(`/genre/tv/list`);
  }

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

  async getPersonDetails(personId: number, fresh: boolean = false): Promise<Person> {
    return this.fetchFromTMDB(`/person/${personId}?append_to_response=movie_credits`, fresh);
  }

  // Get movie reviews
  async getMovieReviews(movieId: number, page: number = 1, fresh: boolean = false): Promise<TMDBResponse<Review>> {
    return this.fetchFromTMDB<TMDBResponse<Review>>(`/movie/${movieId}/reviews?page=${page}`, fresh);
  }

  // Get TV show reviews
  async getTVShowReviews(tvId: number, page: number = 1, fresh: boolean = false): Promise<TMDBResponse<Review>> {
    return this.fetchFromTMDB<TMDBResponse<Review>>(`/tv/${tvId}/reviews?page=${page}`, fresh);
  }

  // Get latest trailers by category - exactly matching TMDB's homepage
  async getLatestTrailers(category: 'popular' | 'streaming' | 'on_tv' | 'for_rent' | 'in_theaters', fresh: boolean = false): Promise<TMDBResponse<Movie | TVShow>> {
    let endpoint = '';
    
    switch (category) {
      case 'popular':
        // Get currently popular movies that are already released
        endpoint = '/discover/movie?sort_by=popularity.desc&primary_release_date.lte=' + new Date().toISOString().split('T')[0] + '&page=1';
        break;
      case 'streaming':
        // Movies available on major streaming platforms, recently released
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        endpoint = `/discover/movie?with_watch_providers=8|9|15|337|384|350&watch_region=US&primary_release_date.gte=${thirtyDaysAgo}&sort_by=popularity.desc&page=1`;
        break;
      case 'on_tv':
        endpoint = '/tv/on_the_air?page=1';
        break;
      case 'for_rent':
        // Movies available for rent, sorted by recent popularity
        endpoint = '/discover/movie?with_watch_monetization_types=rent&watch_region=US&sort_by=popularity.desc&page=1';
        break;
      case 'in_theaters':
        endpoint = '/movie/now_playing?page=1';
        break;
    }
    
    const response = await this.fetchFromTMDB<TMDBResponse<Movie | TVShow>>(endpoint, fresh);
    
    // Return the results directly without filtering for trailers to match TMDB behavior
    return {
      ...response,
      results: response.results.slice(0, 20) // Take first 20 items like TMDB does
    };
  }

  getPosterUrl(path: string | null, size: 'w300' | 'w500' | 'w780' | 'original' = 'w500'): string {
    if (!path) return '/placeholder.svg';
    return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
  }

  getBackdropUrl(path: string | null, size: 'w780' | 'w1280' | 'original' = 'w1280'): string {
    if (!path) return '/placeholder.svg';
    return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
  }

  getProfileUrl(path: string | null, size: 'w185' | 'w632' | 'original' = 'w185'): string {
    if (!path || path.trim() === '') {
      return '/placeholder.svg';
    }
    try {
      return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
    } catch (error) {
      console.log('Profile image error:', error);
      return '/placeholder.svg';
    }
  }

  formatMovieForCard(movie: Movie) {
    return {
      id: movie.id,
      title: movie.title,
      poster: this.getPosterUrl(movie.poster_path),
      year: movie.release_date ? new Date(movie.release_date).getFullYear().toString() : 'TBA',
      rating: movie.vote_average.toFixed(1),
      genre: movie.genres?.[0]?.name || undefined
    };
  }

  formatTVShowForCard(tvShow: TVShow) {
    return {
      id: tvShow.id,
      title: tvShow.name,
      poster: this.getPosterUrl(tvShow.poster_path),
      year: tvShow.first_air_date ? new Date(tvShow.first_air_date).getFullYear().toString() : 'TBA',
      rating: tvShow.vote_average.toFixed(1),
      genre: tvShow.genres?.[0]?.name || undefined
    };
  }
}

export const tmdbService = new TMDBService();
