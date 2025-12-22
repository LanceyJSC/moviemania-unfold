import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type WrappedPeriod = 'today' | 'week' | 'month' | 'all-time';

interface TopContent {
  id: number;
  title: string;
  poster: string | null;
  rating: number;
  count?: number;
}

interface GenreData {
  name: string;
  count: number;
  percentage: number;
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
}

const getDateRange = (period: WrappedPeriod): { start: Date; end: Date } => {
  const now = new Date();
  const end = now;
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
      start = new Date(2020, 0, 1); // Far back enough
      break;
    default:
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  return { start, end };
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
      const startStr = start.toISOString();
      const endStr = end.toISOString();

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
        movieQuery = movieQuery.gte('watched_date', startStr).lte('watched_date', endStr);
      }

      const { data: movieDiary } = await movieQuery;

      // Fetch TV diary entries for the period
      let tvQuery = supabase
        .from('tv_diary')
        .select('*')
        .eq('user_id', user.id)
        .order('rating', { ascending: false });

      if (period !== 'all-time') {
        tvQuery = tvQuery.gte('watched_date', startStr).lte('watched_date', endStr);
      }

      const { data: tvDiary } = await tvQuery;

      // Fetch ratings for the period
      let ratingsQuery = supabase
        .from('user_ratings')
        .select('*')
        .eq('user_id', user.id)
        .order('rating', { ascending: false });

      if (period !== 'all-time') {
        ratingsQuery = ratingsQuery.gte('created_at', startStr).lte('created_at', endStr);
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
        rating: topMovieEntry.rating || 0
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
        rating: m.rating || 0
      }));

      // Mock genre data (in real app, fetch from TMDB)
      const genres: GenreData[] = [
        { name: 'Action', count: Math.floor(totalMovies * 0.3), percentage: 30 },
        { name: 'Drama', count: Math.floor(totalMovies * 0.25), percentage: 25 },
        { name: 'Comedy', count: Math.floor(totalMovies * 0.2), percentage: 20 },
        { name: 'Thriller', count: Math.floor(totalMovies * 0.15), percentage: 15 },
        { name: 'Sci-Fi', count: Math.floor(totalMovies * 0.1), percentage: 10 }
      ].filter(g => g.count > 0);

      const topGenre = genres.length > 0 ? genres[0] : null;

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
        recentMovies
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
