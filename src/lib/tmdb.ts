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
  images?: { logos: { file_path: string }[] };
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
  episode_run_time?: number[];
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
    air_date?: string;
  }[];
  images?: { 
    logos: { file_path: string }[];
    backdrops: { file_path: string; vote_average: number }[];
  };
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
  tv_credits?: {
    cast: Array<{
      id: number;
      name: string;
      character: string;
      poster_path: string | null;
      first_air_date: string;
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
  private async fetchFromTMDB<T>(endpoint: string, bustCache: boolean = false, retries: number = 3): Promise<T> {
    const timestamp = Date.now();
    
    // Build URL with API key
    const separator = endpoint.includes('?') ? '&' : '?';
    let url = `${TMDB_BASE_URL}${endpoint}${separator}api_key=${TMDB_API_KEY}`;
    
    // Add simple cache busting for fresh requests
    if (bustCache) {
      url += `&t=${timestamp}`;
    }
    
    console.log(`🎬 TMDB API: ${endpoint} ${bustCache ? '(FRESH)' : '(CACHED)'}`);
    
    // Simple fetch without aggressive headers
    const fetchOptions: RequestInit = {
      method: 'GET'
    };
    
    let lastError: Error;
    
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const response = await fetch(url, fetchOptions);
        
        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          console.error(`TMDB API error ${response.status}:`, errorText);
          throw new Error(`TMDB API error: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        console.log(`TMDB API SUCCESS: ${endpoint} - ${data.results?.length || 'N/A'} results - Fresh data loaded`);
        return data;
      } catch (error) {
        console.error(`TMDB fetch error (attempt ${attempt + 1}/${retries}):`, error);
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        // Exponential backoff: wait 1s, 2s, 4s between retries
        if (attempt < retries - 1) {
          const delay = Math.pow(2, attempt) * 1000;
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // More specific error handling after all retries failed
    if (lastError instanceof TypeError && lastError.message.includes('Failed to fetch')) {
      throw new Error('Network error: Unable to connect to movie database. Please check your connection.');
    } else {
      throw lastError;
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
    return this.fetchFromTMDB(`/tv/${tvId}?append_to_response=credits,videos,images`, fresh);
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

  async getThisMonthMovies(fresh: boolean = false): Promise<TMDBResponse<Movie>> {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const params = new URLSearchParams();
    params.append('release_date.gte', firstDay.toISOString().split('T')[0]);
    params.append('release_date.lte', lastDay.toISOString().split('T')[0]);
    params.append('sort_by', 'popularity.desc');
    
    return this.fetchFromTMDB(`/discover/movie?${params.toString()}`, fresh);
  }

  async getThisMonthTVShows(fresh: boolean = false): Promise<TMDBResponse<TVShow>> {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const params = new URLSearchParams();
    params.append('first_air_date.gte', firstDay.toISOString().split('T')[0]);
    params.append('first_air_date.lte', lastDay.toISOString().split('T')[0]);
    params.append('sort_by', 'popularity.desc');
    
    return this.fetchFromTMDB(`/discover/tv?${params.toString()}`, fresh);
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
    return this.fetchFromTMDB(`/person/${personId}?append_to_response=movie_credits,tv_credits`, fresh);
  }

  // Get movie reviews
  async getMovieReviews(movieId: number, page: number = 1, fresh: boolean = false): Promise<TMDBResponse<Review>> {
    return this.fetchFromTMDB<TMDBResponse<Review>>(`/movie/${movieId}/reviews?page=${page}`, fresh);
  }

  // Get TV show reviews
  async getTVShowReviews(tvId: number, page: number = 1, fresh: boolean = false): Promise<TMDBResponse<Review>> {
    return this.fetchFromTMDB<TMDBResponse<Review>>(`/tv/${tvId}/reviews?page=${page}`, fresh);
  }

  // Latest Trailers - uses upcoming movies which have the newest trailers
  async getLatestTrailers(category: 'popular' | 'streaming' | 'on_tv' | 'for_rent' | 'in_theaters', fresh: boolean = true): Promise<TMDBResponse<Movie | TVShow>> {
    let movieEndpoint = '';
    let tvEndpoint = '';
    
    switch (category) {
      case 'popular':
        // Upcoming movies have the newest trailers - matches TMDB's Latest Trailers
        movieEndpoint = '/movie/upcoming';
        tvEndpoint = '/tv/on_the_air';
        break;
      case 'streaming':
        movieEndpoint = '/discover/movie?with_watch_providers=8|9|15|337|384|350&watch_region=US&sort_by=popularity.desc';
        tvEndpoint = '/discover/tv?with_watch_providers=8|9|15|337|384|350&watch_region=US&sort_by=popularity.desc';
        break;
      case 'on_tv':
        movieEndpoint = '/movie/upcoming';
        tvEndpoint = '/tv/airing_today';
        break;
      case 'for_rent':
        movieEndpoint = '/discover/movie?with_watch_monetization_types=rent&watch_region=US&sort_by=popularity.desc';
        tvEndpoint = '/discover/tv?with_watch_monetization_types=rent&watch_region=US&sort_by=popularity.desc';
        break;
      case 'in_theaters':
        movieEndpoint = '/movie/now_playing';
        tvEndpoint = '/tv/on_the_air';
        break;
    }
    
    // Always fetch fresh data
    const [movieResponse, tvResponse] = await Promise.all([
      this.fetchFromTMDB<TMDBResponse<Movie>>(movieEndpoint, true),
      this.fetchFromTMDB<TMDBResponse<TVShow>>(tvEndpoint, true)
    ]);
    
    // Filter to only items with poster images
    const moviesWithPosters = movieResponse.results.filter(m => m.poster_path);
    const tvWithPosters = tvResponse.results.filter(t => t.poster_path);
    
    // Mix movies and TV shows
    const mixedResults: (Movie | TVShow)[] = [];
    const maxItems = 24;
    let movieIndex = 0;
    let tvIndex = 0;
    
    for (let i = 0; i < maxItems; i++) {
      if (i % 3 === 0 && tvIndex < tvWithPosters.length) {
        mixedResults.push(tvWithPosters[tvIndex]);
        tvIndex++;
      } else if (movieIndex < moviesWithPosters.length) {
        mixedResults.push(moviesWithPosters[movieIndex]);
        movieIndex++;
      } else if (tvIndex < tvWithPosters.length) {
        mixedResults.push(tvWithPosters[tvIndex]);
        tvIndex++;
      } else {
        break;
      }
    }
    
    return {
      page: 1,
      results: mixedResults,
      total_pages: 1,
      total_results: mixedResults.length
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
      rating: tvShow.vote_average ? tvShow.vote_average.toFixed(1) : '0.0',
      genre: tvShow.genres?.[0]?.name || undefined
    };
  }

  getImageUrl(path: string | null, size: 'w300' | 'w500' | 'w780' | 'original' = 'w500'): string {
    if (!path) return '/placeholder.svg';
    return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
  }

  async getSeasonDetails(tvId: number, seasonNumber: number, fresh: boolean = false) {
    return this.fetchFromTMDB(`/tv/${tvId}/season/${seasonNumber}?append_to_response=images`, fresh);
  }

  async getEpisodeDetails(tvId: number, seasonNumber: number, episodeNumber: number, fresh: boolean = false) {
    return this.fetchFromTMDB(`/tv/${tvId}/season/${seasonNumber}/episode/${episodeNumber}`, fresh);
  }

  // KinoCheck API integration for cutting-edge latest trailers
  async getKinoCheckLatestTrailers(): Promise<{ results: (Movie | TVShow)[]; youtubeKeys: Map<number, string> }> {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      
      // Fetch both movies and TV trailers
      const [movieResponse, tvResponse] = await Promise.all([
        fetch(`${supabaseUrl}/functions/v1/kinocheck-trailers?limit=15&category=movie`, {
          headers: { 'Authorization': `Bearer ${supabaseKey}` }
        }),
        fetch(`${supabaseUrl}/functions/v1/kinocheck-trailers?limit=10&category=tv`, {
          headers: { 'Authorization': `Bearer ${supabaseKey}` }
        })
      ]);

      if (!movieResponse.ok || !tvResponse.ok) {
        throw new Error('KinoCheck API error');
      }

      const movieData = await movieResponse.json();
      const tvData = await tvResponse.json();
      
      const allTrailers = [...(movieData.trailers || movieData || []), ...(tvData.trailers || tvData || [])];
      
      // Map to store YouTube keys by TMDB ID
      const youtubeKeys = new Map<number, string>();
      const results: (Movie | TVShow)[] = [];
      const seenIds = new Set<number>();

      // Fetch TMDB data for each trailer
      for (const trailer of allTrailers.slice(0, 24)) {
        const tmdbId = trailer.tmdb_id;
        if (!tmdbId || seenIds.has(tmdbId)) continue;
        seenIds.add(tmdbId);

        try {
          // Store YouTube key
          if (trailer.youtube_video_id) {
            youtubeKeys.set(tmdbId, trailer.youtube_video_id);
          }

          // Fetch TMDB details
          const isMovie = trailer.categories?.includes('movie') || !trailer.categories?.includes('tv');
          if (isMovie) {
            const movieDetails = await this.getMovieDetails(tmdbId, false);
            if (movieDetails.poster_path) {
              results.push(movieDetails);
            }
          } else {
            const tvDetails = await this.getTVShowDetails(tmdbId, false);
            if (tvDetails.poster_path) {
              results.push(tvDetails);
            }
          }
        } catch (error) {
          console.log(`Could not fetch TMDB data for ID ${tmdbId}`, error);
        }
      }

      return { results, youtubeKeys };
    } catch (error) {
      console.error('KinoCheck API error, falling back to TMDB:', error);
      // Fallback to TMDB
      const fallback = await this.getLatestTrailers('popular', true);
      return { results: fallback.results, youtubeKeys: new Map() };
    }
  }
}

export const tmdbService = new TMDBService();
