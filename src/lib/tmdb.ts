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
  videos?: { results: { id: string; key: string; name: string; type: string; site: string; official?: boolean; published_at?: string }[] };
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
  videos?: { results: { id: string; key: string; name: string; type: string; site: string; official?: boolean; published_at?: string }[] };
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

  // Enhanced Latest Trailers - fetches actual trailer data sorted by published_at
  async getLatestTrailers(category: 'popular' | 'streaming' | 'on_tv' | 'for_rent' | 'in_theaters', fresh: boolean = true): Promise<TMDBResponse<Movie | TVShow>> {
    // Get today's date for filtering
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const threeMonthsLater = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const sixMonthsLater = new Date(today.getTime() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Fetch movies with FUTURE release dates (these have recently published trailers)
    const [upcomingSoon, upcomingLater, nowPlaying, popularTV, upcomingTV] = await Promise.all([
      // Movies releasing in next 3 months (active marketing = recent trailers)
      this.fetchFromTMDB<TMDBResponse<Movie>>(`/discover/movie?primary_release_date.gte=${todayStr}&primary_release_date.lte=${threeMonthsLater}&sort_by=popularity.desc`, true),
      // Movies releasing 3-6 months out (new trailer drops)
      this.fetchFromTMDB<TMDBResponse<Movie>>(`/discover/movie?primary_release_date.gte=${threeMonthsLater}&primary_release_date.lte=${sixMonthsLater}&sort_by=popularity.desc`, true),
      // Currently playing (recent marketing push)
      this.fetchFromTMDB<TMDBResponse<Movie>>('/movie/now_playing', true),
      // Popular TV currently airing
      this.fetchFromTMDB<TMDBResponse<TVShow>>('/tv/on_the_air', true),
      // Upcoming TV shows
      this.fetchFromTMDB<TMDBResponse<TVShow>>('/discover/tv?first_air_date.gte=' + todayStr + '&sort_by=popularity.desc', true)
    ]);
    
    // Combine all unique movies
    const allMovies: Movie[] = [];
    const movieIdSet = new Set<number>();
    [...upcomingSoon.results, ...upcomingLater.results, ...nowPlaying.results].forEach(m => {
      if (!movieIdSet.has(m.id)) {
        movieIdSet.add(m.id);
        allMovies.push(m);
      }
    });
    
    // Combine all unique TV shows
    const allTVShows: TVShow[] = [];
    const tvIdSet = new Set<number>();
    [...popularTV.results, ...upcomingTV.results].forEach(t => {
      if (!tvIdSet.has(t.id)) {
        tvIdSet.add(t.id);
        allTVShows.push(t);
      }
    });
    
    // Fetch videos for items
    const movieIdsToFetch = allMovies.slice(0, 30).map(m => m.id);
    const tvIdsToFetch = allTVShows.slice(0, 15).map(t => t.id);
    
    const [movieVideos, tvVideos] = await Promise.all([
      Promise.all(movieIdsToFetch.map(id => 
        this.fetchFromTMDB<{ id: number; results: { id: string; key: string; name: string; type: string; site: string; official?: boolean; published_at?: string }[] }>(`/movie/${id}/videos`, true)
          .then(res => ({ mediaId: id, videos: res.results || [], mediaType: 'movie' as const }))
          .catch(() => ({ mediaId: id, videos: [], mediaType: 'movie' as const }))
      )),
      Promise.all(tvIdsToFetch.map(id => 
        this.fetchFromTMDB<{ id: number; results: { id: string; key: string; name: string; type: string; site: string; official?: boolean; published_at?: string }[] }>(`/tv/${id}/videos`, true)
          .then(res => ({ mediaId: id, videos: res.results || [], mediaType: 'tv' as const }))
          .catch(() => ({ mediaId: id, videos: [], mediaType: 'tv' as const }))
      ))
    ]);
    
    // Collect the newest trailer for each media item
    type MediaWithTrailerDate = {
      mediaId: number;
      mediaType: 'movie' | 'tv';
      latestTrailerDate: Date;
      trailerName: string;
    };
    
    const mediaWithTrailers: MediaWithTrailerDate[] = [];
    
    [...movieVideos, ...tvVideos].forEach(({ mediaId, videos, mediaType }) => {
      // Filter for YouTube Trailers
      let trailers = videos.filter(v => v.site === 'YouTube' && v.type === 'Trailer');
      
      // Fallback to Teasers
      if (trailers.length === 0) {
        trailers = videos.filter(v => v.site === 'YouTube' && v.type === 'Teaser');
      }
      
      if (trailers.length === 0) return;
      
      // Prefer official trailers
      const officialTrailers = trailers.filter(v => v.official === true);
      const finalTrailers = officialTrailers.length > 0 ? officialTrailers : trailers;
      
      // Sort by published_at descending and take the newest
      const sorted = [...finalTrailers].sort((a, b) => {
        if (a.published_at && b.published_at) {
          return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
        }
        if (a.published_at) return -1;
        if (b.published_at) return 1;
        return 0;
      });
      
      const newestTrailer = sorted[0];
      if (newestTrailer.published_at) {
        mediaWithTrailers.push({
          mediaId,
          mediaType,
          latestTrailerDate: new Date(newestTrailer.published_at),
          trailerName: newestTrailer.name
        });
      }
    });
    
    // Sort ALL media by their newest trailer's published_at (newest first)
    mediaWithTrailers.sort((a, b) => b.latestTrailerDate.getTime() - a.latestTrailerDate.getTime());
    
    // Log for debugging
    console.log('🎬 Latest trailers sorted by publish date:', mediaWithTrailers.slice(0, 15).map(m => ({
      id: m.mediaId,
      type: m.mediaType,
      date: m.latestTrailerDate.toLocaleDateString(),
      name: m.trailerName
    })));
    
    // Build final results in order of newest trailer
    const sortedResults: (Movie | TVShow)[] = [];
    
    for (const { mediaId, mediaType } of mediaWithTrailers) {
      if (mediaType === 'movie') {
        const movie = allMovies.find(m => m.id === mediaId);
        if (movie) sortedResults.push(movie);
      } else {
        const tv = allTVShows.find(t => t.id === mediaId);
        if (tv) sortedResults.push(tv);
      }
      
      if (sortedResults.length >= 24) break;
    }
    
    return {
      page: 1,
      results: sortedResults,
      total_pages: 1,
      total_results: sortedResults.length
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
    return this.fetchFromTMDB(`/tv/${tvId}/season/${seasonNumber}?append_to_response=images,credits`, fresh);
  }

  async getEpisodeDetails(tvId: number, seasonNumber: number, episodeNumber: number, fresh: boolean = false) {
    return this.fetchFromTMDB(`/tv/${tvId}/season/${seasonNumber}/episode/${episodeNumber}?append_to_response=credits`, fresh);
  }

  // Watch Providers (Where to Watch)
  async getMovieWatchProviders(movieId: number, region: string = 'US'): Promise<WatchProvidersResponse> {
    return this.fetchFromTMDB(`/movie/${movieId}/watch/providers`);
  }

  async getTVWatchProviders(tvId: number, region: string = 'US'): Promise<WatchProvidersResponse> {
    return this.fetchFromTMDB(`/tv/${tvId}/watch/providers`);
  }

  // Similar Movies/TV Shows
  async getSimilarMovies(movieId: number, page: number = 1): Promise<TMDBResponse<Movie>> {
    return this.fetchFromTMDB(`/movie/${movieId}/similar?page=${page}`);
  }

  async getSimilarTVShows(tvId: number, page: number = 1): Promise<TMDBResponse<TVShow>> {
    return this.fetchFromTMDB(`/tv/${tvId}/similar?page=${page}`);
  }

  // Movie Recommendations (TMDB's algorithm)
  async getMovieRecommendations(movieId: number, page: number = 1): Promise<TMDBResponse<Movie>> {
    return this.fetchFromTMDB(`/movie/${movieId}/recommendations?page=${page}`);
  }

  async getTVRecommendations(tvId: number, page: number = 1): Promise<TMDBResponse<TVShow>> {
    return this.fetchFromTMDB(`/tv/${tvId}/recommendations?page=${page}`);
  }

  // Movie Collections (Franchises)
  async getMovieCollection(collectionId: number): Promise<MovieCollection> {
    return this.fetchFromTMDB(`/collection/${collectionId}`);
  }

  // Get movie details with collection info
  async getMovieDetailsWithCollection(movieId: number): Promise<MovieWithCollection> {
    return this.fetchFromTMDB(`/movie/${movieId}?append_to_response=credits,videos,belongs_to_collection`);
  }

  // Content Ratings
  async getMovieReleaseDates(movieId: number): Promise<ReleaseDatesResponse> {
    return this.fetchFromTMDB(`/movie/${movieId}/release_dates`);
  }

  async getTVContentRatings(tvId: number): Promise<ContentRatingsResponse> {
    return this.fetchFromTMDB(`/tv/${tvId}/content_ratings`);
  }

}

// Additional interfaces for new features
export interface WatchProvider {
  logo_path: string;
  provider_id: number;
  provider_name: string;
  display_priority: number;
}

export interface WatchProvidersResult {
  link?: string;
  flatrate?: WatchProvider[];
  rent?: WatchProvider[];
  buy?: WatchProvider[];
  free?: WatchProvider[];
}

export interface WatchProvidersResponse {
  id: number;
  results: Record<string, WatchProvidersResult>;
}

export interface MovieCollection {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  parts: Movie[];
}

export interface MovieWithCollection extends Movie {
  belongs_to_collection?: {
    id: number;
    name: string;
    poster_path: string | null;
    backdrop_path: string | null;
  };
}

export interface ReleaseDatesResponse {
  id: number;
  results: Array<{
    iso_3166_1: string;
    release_dates: Array<{
      certification: string;
      type: number;
      release_date: string;
    }>;
  }>;
}

export interface ContentRatingsResponse {
  results: Array<{
    iso_3166_1: string;
    rating: string;
  }>;
}

export const tmdbService = new TMDBService();
