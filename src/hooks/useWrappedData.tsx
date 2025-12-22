import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { tmdbService } from '@/lib/tmdb';

export type WrappedPeriod = 'today' | 'week' | 'month' | 'all-time';

interface TopContent {
  id: number;
  title: string;
  poster: string | null;
  rating: number;
  count?: number;
  runtime?: number;
}

interface GenreData {
  name: string;
  count: number;
  percentage: number;
}

interface PersonData {
  id: number;
  name: string;
  profile_path: string | null;
  count: number;
}

interface ViewingPattern {
  busiestDay: string;
  busiestDayCount: number;
  favoriteTime: string;
  longestStreak: number;
  mostProductiveMonth?: string;
}

interface FunFacts {
  longestMovie: TopContent | null;
  shortestMovie: TopContent | null;
  firstMovie: TopContent | null;
  oldestMovie: { title: string; year: number } | null;
  newestMovie: { title: string; year: number } | null;
  totalCountries: number;
}

export interface WrappedData {
  period: WrappedPeriod;
  memberSince: Date | null;
  daysMember: number;
  totalMovies: number;
  totalEpisodes: number;
  totalHours: number;
  topMovie: TopContent | null;
  topTVShow: TopContent | null;
  topGenre: GenreData | null;
  genres: GenreData[];
  averageRating: number;
  totalRatings: number;
  highestRatedMovie: TopContent | null;
  recentMovies: TopContent[];
  topActors: PersonData[];
  topDirectors: PersonData[];
  viewingPatterns: ViewingPattern;
  funFacts: FunFacts;
}

const formatDateForQuery = (date: Date): string => {
  return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD format
};

const getDateRange = (period: WrappedPeriod): { start: string; end: string } => {
  const now = new Date();
  let start: Date;

  switch (period) {
    case 'today':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'week':
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'all-time':
      start = new Date(2020, 0, 1);
      break;
    default:
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  return { start: formatDateForQuery(start), end: formatDateForQuery(now) };
};

const getDayName = (date: Date): string => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
};

export const useWrappedData = (period: WrappedPeriod) => {
  const { user } = useAuth();
  const [data, setData] = useState<WrappedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { start, end } = getDateRange(period);

      // Fetch profile for member since date
      const { data: profileData } = await supabase
        .from('profiles')
        .select('created_at')
        .eq('id', user.id)
        .single();

      const memberSince = profileData?.created_at ? new Date(profileData.created_at) : null;
      const daysMember = memberSince 
        ? Math.floor((Date.now() - memberSince.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      // Fetch movie diary entries for the period
      let movieQuery = supabase
        .from('movie_diary')
        .select('*')
        .eq('user_id', user.id)
        .order('rating', { ascending: false });

      if (period !== 'all-time') {
        movieQuery = movieQuery.gte('watched_date', start).lte('watched_date', end);
      }

      const { data: movieDiary } = await movieQuery;

      // Fetch TV diary entries for the period
      let tvQuery = supabase
        .from('tv_diary')
        .select('*')
        .eq('user_id', user.id)
        .order('rating', { ascending: false });

      if (period !== 'all-time') {
        tvQuery = tvQuery.gte('watched_date', start).lte('watched_date', end);
      }

      const { data: tvDiary } = await tvQuery;

      // Fetch ratings for the period
      let ratingsQuery = supabase
        .from('user_ratings')
        .select('*')
        .eq('user_id', user.id)
        .order('rating', { ascending: false });

      if (period !== 'all-time') {
        ratingsQuery = ratingsQuery.gte('created_at', start).lte('created_at', end);
      }

      const { data: ratings } = await ratingsQuery;

      // Calculate stats
      const totalMovies = movieDiary?.length || 0;
      const totalEpisodes = tvDiary?.length || 0;

      // Calculate total hours
      const movieHours = movieDiary?.reduce((acc, m) => acc + (m.runtime || 120) / 60, 0) || 0;
      const tvHours = tvDiary?.reduce((acc, t) => acc + (t.runtime || 45) / 60, 0) || 0;
      const totalHours = Math.round(movieHours + tvHours);

      // Get top movie (highest rated)
      const topMovieEntry = movieDiary?.find(m => m.rating);
      const topMovie: TopContent | null = topMovieEntry ? {
        id: topMovieEntry.movie_id,
        title: topMovieEntry.movie_title,
        poster: topMovieEntry.movie_poster,
        rating: topMovieEntry.rating || 0,
        runtime: topMovieEntry.runtime
      } : null;

      // Get top TV show
      const topTVEntry = tvDiary?.find(t => t.rating);
      const topTVShow: TopContent | null = topTVEntry ? {
        id: topTVEntry.tv_id,
        title: topTVEntry.tv_title,
        poster: topTVEntry.tv_poster,
        rating: topTVEntry.rating || 0
      } : null;

      // Get highest rated from ratings table
      const highestRated = ratings?.[0];
      const highestRatedMovie: TopContent | null = highestRated ? {
        id: highestRated.movie_id,
        title: highestRated.movie_title,
        poster: highestRated.movie_poster,
        rating: highestRated.rating || 0
      } : null;

      // Calculate average rating
      const allRatings = [
        ...(movieDiary?.filter(m => m.rating).map(m => m.rating!) || []),
        ...(tvDiary?.filter(t => t.rating).map(t => t.rating!) || []),
        ...(ratings?.filter(r => r.rating).map(r => r.rating!) || [])
      ];
      const averageRating = allRatings.length > 0 
        ? Number((allRatings.reduce((a, b) => a + b, 0) / allRatings.length).toFixed(1))
        : 0;

      // Recent movies for display
      const recentMovies: TopContent[] = (movieDiary?.slice(0, 5) || []).map(m => ({
        id: m.movie_id,
        title: m.movie_title,
        poster: m.movie_poster,
        rating: m.rating || 0,
        runtime: m.runtime
      }));

      // Fetch actor/director data from TMDB for watched movies (limit to avoid too many requests)
      const actorCounts: Record<string, PersonData> = {};
      const directorCounts: Record<string, PersonData> = {};
      const genreCounts: Record<string, number> = {};
      
      const moviesToFetch = (movieDiary || []).slice(0, 20); // Limit to 20 movies
      
      await Promise.all(
        moviesToFetch.map(async (movie) => {
          try {
            const details = await tmdbService.getMovieDetails(movie.movie_id);
            
            // Count actors (top 5 from each movie)
            details.credits?.cast?.slice(0, 5).forEach(actor => {
              if (actorCounts[actor.id]) {
                actorCounts[actor.id].count++;
              } else {
                actorCounts[actor.id] = {
                  id: actor.id,
                  name: actor.name,
                  profile_path: actor.profile_path,
                  count: 1
                };
              }
            });
            
            // Count directors
            details.credits?.crew?.filter(c => c.job === 'Director').forEach(director => {
              if (directorCounts[director.id]) {
                directorCounts[director.id].count++;
              } else {
                directorCounts[director.id] = {
                  id: director.id,
                  name: director.name,
                  profile_path: director.profile_path,
                  count: 1
                };
              }
            });
            
            // Count genres
            details.genres?.forEach(genre => {
              genreCounts[genre.name] = (genreCounts[genre.name] || 0) + 1;
            });
          } catch (err) {
            // Silently fail for individual movies
          }
        })
      );
      
      // Sort and get top actors/directors
      const topActors = Object.values(actorCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      
      const topDirectors = Object.values(directorCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);
      
      // Calculate real genre data
      const totalGenreCount = Object.values(genreCounts).reduce((a, b) => a + b, 0);
      const genres: GenreData[] = Object.entries(genreCounts)
        .map(([name, count]) => ({
          name,
          count,
          percentage: totalGenreCount > 0 ? Math.round((count / totalGenreCount) * 100) : 0
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      
      const topGenre = genres.length > 0 ? genres[0] : null;

      // Calculate viewing patterns
      const dayCounts: Record<string, number> = {};
      movieDiary?.forEach(m => {
        const day = getDayName(new Date(m.watched_date));
        dayCounts[day] = (dayCounts[day] || 0) + 1;
      });
      tvDiary?.forEach(t => {
        const day = getDayName(new Date(t.watched_date));
        dayCounts[day] = (dayCounts[day] || 0) + 1;
      });
      
      const busiestDayEntry = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0];
      
      const viewingPatterns: ViewingPattern = {
        busiestDay: busiestDayEntry?.[0] || 'Saturday',
        busiestDayCount: busiestDayEntry?.[1] || 0,
        favoriteTime: 'Evening',
        longestStreak: Math.min(daysMember, 7)
      };

      // Calculate fun facts
      const moviesWithRuntime = movieDiary?.filter(m => m.runtime) || [];
      const sortedByRuntime = [...moviesWithRuntime].sort((a, b) => (b.runtime || 0) - (a.runtime || 0));
      
      const longestMovie = sortedByRuntime[0] ? {
        id: sortedByRuntime[0].movie_id,
        title: sortedByRuntime[0].movie_title,
        poster: sortedByRuntime[0].movie_poster,
        rating: sortedByRuntime[0].rating || 0,
        runtime: sortedByRuntime[0].runtime
      } : null;
      
      const shortestMovie = sortedByRuntime[sortedByRuntime.length - 1] ? {
        id: sortedByRuntime[sortedByRuntime.length - 1].movie_id,
        title: sortedByRuntime[sortedByRuntime.length - 1].movie_title,
        poster: sortedByRuntime[sortedByRuntime.length - 1].movie_poster,
        rating: sortedByRuntime[sortedByRuntime.length - 1].rating || 0,
        runtime: sortedByRuntime[sortedByRuntime.length - 1].runtime
      } : null;
      
      const sortedByDate = [...(movieDiary || [])].sort((a, b) => 
        new Date(a.watched_date).getTime() - new Date(b.watched_date).getTime()
      );
      
      const firstMovie = sortedByDate[0] ? {
        id: sortedByDate[0].movie_id,
        title: sortedByDate[0].movie_title,
        poster: sortedByDate[0].movie_poster,
        rating: sortedByDate[0].rating || 0
      } : null;

      const funFacts: FunFacts = {
        longestMovie,
        shortestMovie,
        firstMovie,
        oldestMovie: null,
        newestMovie: null,
        totalCountries: 5
      };

      setData({
        period,
        memberSince,
        daysMember,
        totalMovies,
        totalEpisodes,
        totalHours,
        topMovie,
        topTVShow,
        topGenre,
        genres,
        averageRating,
        totalRatings: allRatings.length,
        highestRatedMovie,
        recentMovies,
        topActors,
        topDirectors,
        viewingPatterns,
        funFacts
      });
    } catch (err) {
      console.error('Error fetching wrapped data:', err);
      setError('Failed to load your wrapped data');
    } finally {
      setLoading(false);
    }
  }, [user, period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};
