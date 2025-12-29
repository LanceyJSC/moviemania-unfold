import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { tmdbService } from '@/lib/tmdb';

interface GenreBreakdown {
  genre: string;
  genreId: number;
  percentage: number;
  avgRating: number;
  count: number;
}

interface PersonAffinity {
  id: number;
  name: string;
  photo: string;
  avgRating: number;
  count: number;
}

interface EraPreference {
  decade: string;
  count: number;
  avgRating: number;
}

export interface TasteProfile {
  genreDNA: GenreBreakdown[];
  ratingStyle: 'generous' | 'balanced' | 'tough';
  avgRating: number;
  totalRated: number;
  eraPreference: EraPreference[];
  runtimePreference: { min: number; max: number; sweetSpot: number };
  topActors: PersonAffinity[];
  topDirectors: PersonAffinity[];
  viewingVelocity: 'binger' | 'savorer' | 'moderate';
  moodSignature: string[];
  insightStrings: string[];
  guiltyPleasures: string[];
}

const GENRE_MAP: { [key: number]: string } = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy',
  80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family',
  14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music',
  9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi', 10770: 'TV Movie',
  53: 'Thriller', 10752: 'War', 37: 'Western',
  10759: 'Action & Adventure', 10762: 'Kids', 10763: 'News',
  10764: 'Reality', 10765: 'Sci-Fi & Fantasy', 10766: 'Soap',
  10767: 'Talk', 10768: 'War & Politics'
};

const MOOD_FROM_GENRES: { [key: string]: string[] } = {
  'Action': ['Energetic', 'Thrilling'],
  'Horror': ['Dark', 'Intense'],
  'Comedy': ['Light-hearted', 'Fun'],
  'Drama': ['Emotional', 'Thoughtful'],
  'Romance': ['Romantic', 'Warm'],
  'Thriller': ['Suspenseful', 'Tense'],
  'Sci-Fi': ['Imaginative', 'Cerebral'],
  'Fantasy': ['Whimsical', 'Magical'],
  'Documentary': ['Curious', 'Intellectual'],
  'Animation': ['Playful', 'Creative']
};

export const useTasteProfile = () => {
  const [profile, setProfile] = useState<TasteProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const generateProfile = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch user ratings
      const { data: ratings, error: ratingsError } = await supabase
        .from('user_ratings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (ratingsError) throw ratingsError;

      if (!ratings || ratings.length < 5) {
        setError('Rate at least 5 items to generate your taste profile');
        setLoading(false);
        return;
      }

      // Fetch TMDB details for rated items (limit to 50 for performance)
      // Details include credits via append_to_response
      const itemsToFetch = ratings.slice(0, 50);
      const detailPromises = itemsToFetch.map(async (rating) => {
        try {
          if (rating.media_type === 'movie' || !rating.media_type) {
            const details = await tmdbService.getMovieDetails(rating.movie_id);
            return { rating, details, credits: details.credits };
          } else {
            const details = await tmdbService.getTVShowDetails(rating.movie_id);
            return { rating, details, credits: details.credits };
          }
        } catch {
          return null;
        }
      });

      const results = (await Promise.all(detailPromises)).filter(Boolean) as any[];

      // Calculate genre breakdown
      const genreStats: { [key: number]: { count: number; totalRating: number } } = {};
      const actorStats: { [key: number]: { name: string; photo: string; count: number; totalRating: number } } = {};
      const directorStats: { [key: number]: { name: string; photo: string; count: number; totalRating: number } } = {};
      const eraStats: { [key: string]: { count: number; totalRating: number } } = {};
      const runtimes: number[] = [];

      results.forEach(({ rating, details, credits }) => {
        const userRating = rating.rating;

        // Genres
        details.genres?.forEach((genre: any) => {
          if (!genreStats[genre.id]) {
            genreStats[genre.id] = { count: 0, totalRating: 0 };
          }
          genreStats[genre.id].count++;
          genreStats[genre.id].totalRating += userRating;
        });

        // Actors (top 5 billed)
        credits.cast?.slice(0, 5).forEach((actor: any) => {
          if (!actorStats[actor.id]) {
            actorStats[actor.id] = { 
              name: actor.name, 
              photo: actor.profile_path || '', 
              count: 0, 
              totalRating: 0 
            };
          }
          actorStats[actor.id].count++;
          actorStats[actor.id].totalRating += userRating;
        });

        // Directors
        credits.crew?.filter((c: any) => c.job === 'Director').forEach((director: any) => {
          if (!directorStats[director.id]) {
            directorStats[director.id] = { 
              name: director.name, 
              photo: director.profile_path || '', 
              count: 0, 
              totalRating: 0 
            };
          }
          directorStats[director.id].count++;
          directorStats[director.id].totalRating += userRating;
        });

        // Era (decade)
        const releaseYear = parseInt((details.release_date || details.first_air_date || '').split('-')[0]);
        if (releaseYear) {
          const decade = `${Math.floor(releaseYear / 10) * 10}s`;
          if (!eraStats[decade]) {
            eraStats[decade] = { count: 0, totalRating: 0 };
          }
          eraStats[decade].count++;
          eraStats[decade].totalRating += userRating;
        }

        // Runtime
        const runtime = details.runtime || (details.episode_run_time?.[0]);
        if (runtime) {
          runtimes.push(runtime);
        }
      });

      // Calculate genre DNA
      const totalGenreCount = Object.values(genreStats).reduce((sum, g) => sum + g.count, 0);
      const genreDNA = Object.entries(genreStats)
        .map(([id, stats]) => ({
          genreId: parseInt(id),
          genre: GENRE_MAP[parseInt(id)] || 'Unknown',
          percentage: Math.round((stats.count / totalGenreCount) * 100),
          avgRating: parseFloat((stats.totalRating / stats.count).toFixed(1)),
          count: stats.count
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);

      // Calculate average rating and style
      const avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
      let ratingStyle: 'generous' | 'balanced' | 'tough';
      if (avgRating >= 4) ratingStyle = 'generous';
      else if (avgRating >= 2.5) ratingStyle = 'balanced';
      else ratingStyle = 'tough';

      // Era preferences
      const eraPreference = Object.entries(eraStats)
        .map(([decade, stats]) => ({
          decade,
          count: stats.count,
          avgRating: parseFloat((stats.totalRating / stats.count).toFixed(1))
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 4);

      // Runtime preference
      const sortedRuntimes = runtimes.sort((a, b) => a - b);
      const runtimePreference = {
        min: sortedRuntimes[0] || 90,
        max: sortedRuntimes[sortedRuntimes.length - 1] || 150,
        sweetSpot: sortedRuntimes[Math.floor(sortedRuntimes.length / 2)] || 120
      };

      // Top actors (min 2 appearances, sorted by avg rating)
      const topActors = Object.entries(actorStats)
        .filter(([_, stats]) => stats.count >= 2)
        .map(([id, stats]) => ({
          id: parseInt(id),
          name: stats.name,
          photo: stats.photo,
          avgRating: parseFloat((stats.totalRating / stats.count).toFixed(1)),
          count: stats.count
        }))
        .sort((a, b) => b.avgRating - a.avgRating || b.count - a.count)
        .slice(0, 5);

      // Top directors (min 2 appearances)
      const topDirectors = Object.entries(directorStats)
        .filter(([_, stats]) => stats.count >= 2)
        .map(([id, stats]) => ({
          id: parseInt(id),
          name: stats.name,
          photo: stats.photo,
          avgRating: parseFloat((stats.totalRating / stats.count).toFixed(1)),
          count: stats.count
        }))
        .sort((a, b) => b.avgRating - a.avgRating || b.count - a.count)
        .slice(0, 5);

      // Viewing velocity based on diary entries
      const { data: diaryEntries } = await supabase
        .from('movie_diary')
        .select('watched_date')
        .eq('user_id', user.id)
        .order('watched_date', { ascending: false })
        .limit(30);

      let viewingVelocity: 'binger' | 'savorer' | 'moderate' = 'moderate';
      if (diaryEntries && diaryEntries.length >= 10) {
        const dates = diaryEntries.map(d => new Date(d.watched_date).getTime());
        const avgDaysBetween = (dates[0] - dates[dates.length - 1]) / (1000 * 60 * 60 * 24 * (dates.length - 1));
        if (avgDaysBetween < 2) viewingVelocity = 'binger';
        else if (avgDaysBetween > 7) viewingVelocity = 'savorer';
      }

      // Mood signature from top genres
      const moodSignature: string[] = [];
      genreDNA.slice(0, 3).forEach(g => {
        const moods = MOOD_FROM_GENRES[g.genre];
        if (moods) moodSignature.push(...moods);
      });
      const uniqueMoods = [...new Set(moodSignature)].slice(0, 4);

      // Guilty pleasures (genres rated higher than frequency suggests)
      const avgGenreRating = genreDNA.reduce((sum, g) => sum + g.avgRating, 0) / genreDNA.length;
      const guiltyPleasures = genreDNA
        .filter(g => g.percentage < 15 && g.avgRating > avgGenreRating + 0.3)
        .map(g => g.genre)
        .slice(0, 2);

      // Generate insight strings
      const insightStrings: string[] = [];
      
      if (genreDNA[0]) {
        insightStrings.push(`Your top genre is ${genreDNA[0].genre} (${genreDNA[0].percentage}% of your ratings)`);
      }
      
      if (topDirectors[0]) {
        insightStrings.push(`You love ${topDirectors[0].name}'s work — averaging ${topDirectors[0].avgRating}/5 across ${topDirectors[0].count} films`);
      }
      
      if (topActors[0]) {
        insightStrings.push(`${topActors[0].name} appears in ${topActors[0].count} of your highly-rated films`);
      }
      
      if (eraPreference[0]) {
        insightStrings.push(`You gravitate toward ${eraPreference[0].decade} cinema`);
      }

      if (guiltyPleasures.length > 0) {
        insightStrings.push(`Guilty pleasure alert: You rate ${guiltyPleasures.join(' and ')} higher than you'd expect`);
      }

      const velocityText = viewingVelocity === 'binger' ? 'a power binger' : 
                          viewingVelocity === 'savorer' ? 'a slow savorer' : 'a steady viewer';
      insightStrings.push(`Your viewing pace makes you ${velocityText}`);

      setProfile({
        genreDNA,
        ratingStyle,
        avgRating: parseFloat(avgRating.toFixed(2)),
        totalRated: ratings.length,
        eraPreference,
        runtimePreference,
        topActors,
        topDirectors,
        viewingVelocity,
        moodSignature: uniqueMoods,
        insightStrings,
        guiltyPleasures
      });

    } catch (err) {
      console.error('Error generating taste profile:', err);
      setError('Failed to generate taste profile');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    generateProfile();
  }, [generateProfile]);

  return { profile, loading, error, regenerate: generateProfile };
};
