import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Film, Tv, Star, Clock, Heart, Eye, 
  Plus, Search, Trophy, BookOpen, TrendingUp,
  LayoutGrid, List
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useEnhancedWatchlist } from '@/hooks/useEnhancedWatchlist';
import { useFavorites } from '@/hooks/useFavorites';
import { useUserStats } from '@/hooks/useUserStats';
import { useDiary } from '@/hooks/useDiary';
import { useUserStateContext } from '@/contexts/UserStateContext';
import { tmdbService, Movie } from '@/lib/tmdb';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Navigation } from '@/components/Navigation';
import { MobileBrandHeader } from '@/components/MobileBrandHeader';
import { DesktopHeader } from '@/components/DesktopHeader';
import { CollectionMediaCard } from '@/components/CollectionMediaCard';
import { TVShowCollectionCard } from '@/components/TVShowCollectionCard';
import { CollectionPosterGrid, PosterGridItem } from '@/components/CollectionPosterGrid';
import { DiaryTable, DiaryItem } from '@/components/DiaryTable';
import { LogMediaModal } from '@/components/LogMediaModal';
import { CollectionReviewsList } from '@/components/CollectionReviewsList';
import { CollectionListsGrid } from '@/components/CollectionListsGrid';
import { DiaryHeatmap } from '@/components/DiaryHeatmap';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

type MediaFilter = 'all' | 'movies' | 'tv';
type ViewMode = 'grid' | 'list';
type SortOption = 'recent' | 'rating' | 'title';

const Collection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { items, loading: itemsLoading, removeItem, addItem } = useEnhancedWatchlist();
  const { favorites, loading: favoritesLoading, removeFavorite } = useFavorites();
  const { stats, recalculateStats } = useUserStats();
  const { movieDiary, tvDiary, isLoading: diaryLoading, deleteMovieDiaryEntry, deleteTVDiaryEntry, refetchAll: refetchDiary } = useDiary();
  const { setRating, userState, refetch: refetchUserState } = useUserStateContext();
  const [movieSearchTerm, setMovieSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [ratedMovies, setRatedMovies] = useState<any[]>([]);
  const [ratedLoading, setRatedLoading] = useState(true);
  const [mediaFilter, setMediaFilter] = useState<MediaFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortOption, setSortOption] = useState<SortOption>('recent');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  
  // Edit diary entry state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<{
    mediaId: number;
    mediaTitle: string;
    mediaPoster: string | null;
    mediaType: 'movie' | 'tv';
    initialRating: number;
    initialNotes: string;
    seasonNumber?: number;
    episodeNumber?: number;
  } | null>(null);

  // Recalculate stats on mount and when diary/ratings data changes
  useEffect(() => {
    if (user && !diaryLoading && !ratedLoading) {
      recalculateStats();
    }
  }, [user, movieDiary.length, tvDiary.length, ratedMovies.length, diaryLoading, ratedLoading]);

  // Load rated movies (watched)
  useEffect(() => {
    const loadRatedMovies = async () => {
      if (!user) {
        setRatedLoading(false);
        return;
      }
      setRatedLoading(true);
      try {
        const { data } = await supabase
          .from('user_ratings')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        setRatedMovies(data || []);
      } catch (error) {
        console.error('Error loading rated movies:', error);
      } finally {
        setRatedLoading(false);
      }
    };
    loadRatedMovies();
  }, [user, userState.watchedItems, movieDiary.length, tvDiary.length]);

  // Refetch diary data on component mount
  useEffect(() => {
    if (user) {
      refetchDiary();
    }
  }, [user]);

  // Liked movie IDs set for badge
  const likedSet = useMemo(() => new Set(favorites.map(f => f.movie_id)), [favorites]);

  // Rewatch set: movies appearing more than once in diary
  const rewatchSet = useMemo(() => {
    const counts: Record<number, number> = {};
    movieDiary.forEach(e => { counts[e.movie_id] = (counts[e.movie_id] || 0) + 1; });
    tvDiary.forEach(e => { counts[e.tv_id] = (counts[e.tv_id] || 0) + 1; });
    return new Set(Object.entries(counts).filter(([, c]) => c > 1).map(([id]) => Number(id)));
  }, [movieDiary, tvDiary]);

  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-24 2xl:pb-12">
        <DesktopHeader />
        <MobileBrandHeader />
        <Navigation />
        <div className="container mx-auto px-4 py-20 text-center max-w-7xl">
          <Film className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-2">Your Collection</h1>
          <p className="text-muted-foreground mb-4">Sign in to track your movies and TV shows</p>
          <Button onClick={() => navigate('/auth')}>Sign In</Button>
        </div>
      </div>
    );
  }

  // Helper function to delete all data for a movie/TV show
  const deleteAllMediaData = async (mediaId: number, mediaType: 'movie' | 'tv') => {
    if (!user) return;
    await Promise.all([
      supabase.from('user_ratings').delete().eq('movie_id', mediaId).eq('user_id', user.id),
      supabase.from('ratings').delete().eq('movie_id', mediaId).eq('user_id', user.id),
      supabase.from('user_reviews').delete().eq('movie_id', mediaId).eq('user_id', user.id),
      supabase.from('watchlist').delete().eq('movie_id', mediaId).eq('user_id', user.id),
      supabase.from('enhanced_watchlist_items').delete().eq('movie_id', mediaId).eq('user_id', user.id),
      supabase.from('activity_feed').delete().eq('movie_id', mediaId).eq('user_id', user.id),
      mediaType === 'tv' 
        ? supabase.from('tv_diary').delete().eq('tv_id', mediaId).eq('user_id', user.id)
        : supabase.from('movie_diary').delete().eq('movie_id', mediaId).eq('user_id', user.id),
    ]);
    const { data } = await supabase
      .from('user_ratings')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setRatedMovies(data || []);
    queryClient.invalidateQueries({ queryKey: ['average-user-rating', mediaId] });
    refetchDiary();
    await refetchUserState();
    await recalculateStats();
  };

  // Helper function to delete ONLY diary notes/review
  const deleteDiaryEntry = async (mediaId: number, mediaType: 'movie' | 'tv') => {
    if (!user) return;
    await Promise.all([
      supabase.from('user_reviews').delete().eq('movie_id', mediaId).eq('user_id', user.id),
      mediaType === 'tv' 
        ? supabase.from('tv_diary').delete().eq('tv_id', mediaId).eq('user_id', user.id)
        : supabase.from('movie_diary').delete().eq('movie_id', mediaId).eq('user_id', user.id),
    ]);
    queryClient.invalidateQueries({ queryKey: ['community-reviews', mediaId] });
    refetchDiary();
  };

  const handleMovieSearch = async () => {
    if (!movieSearchTerm.trim()) {
      toast.error('Please enter a movie title');
      return;
    }
    setIsSearching(true);
    try {
      const response = await tmdbService.searchMovies(movieSearchTerm);
      setSearchResults(response.results || []);
      if ((response.results || []).length === 0) {
        toast.info('No movies found');
      }
    } catch (error) {
      toast.error('Failed to search movies');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddToWatchlist = async (movie: Movie) => {
    const success = await addItem(movie.id, movie.title, movie.poster_path, { priority: 'medium' });
    if (success) {
      setSearchResults(prev => prev.filter(m => m.id !== movie.id));
      setMovieSearchTerm('');
    }
  };

  // Sorting helper
  const sortItems = <T extends { movie_title?: string; title?: string; rating?: number | null; userRating?: number | null; added_at?: string; created_at?: string }>(items: T[]): T[] => {
    return [...items].sort((a, b) => {
      if (sortOption === 'title') {
        const titleA = (a as any).movie_title || (a as any).title || '';
        const titleB = (b as any).movie_title || (b as any).title || '';
        return titleA.localeCompare(titleB);
      }
      if (sortOption === 'rating') {
        const rA = (a as any).rating || (a as any).userRating || 0;
        const rB = (b as any).rating || (b as any).userRating || 0;
        return rB - rA;
      }
      return 0; // 'recent' keeps original order
    });
  };

  // Rating filter helper
  const filterByRating = <T extends { rating?: number | null }>(items: T[]): T[] => {
    if (ratingFilter === 'all') return items;
    const r = parseInt(ratingFilter);
    return items.filter(i => (i as any).rating === r || (i as any).userRating === r);
  };

  const getUnwatchedItems = () => {
    let unwatched = items.filter(item => !item.watched_at);
    if (mediaFilter === 'movies') unwatched = unwatched.filter(item => (item as any).media_type !== 'tv');
    if (mediaFilter === 'tv') unwatched = unwatched.filter(item => (item as any).media_type === 'tv');
    return sortItems(unwatched);
  };

  const getFilteredFavorites = () => {
    let fav = [...favorites];
    if (mediaFilter === 'movies') fav = fav.filter(item => (item as any).media_type !== 'tv');
    if (mediaFilter === 'tv') fav = fav.filter(item => (item as any).media_type === 'tv');
    return sortItems(fav);
  };

  const getWatchedItems = () => {
    const watchedMap = new Map<number, any>();
    ratedMovies.forEach(item => {
      watchedMap.set(item.movie_id, {
        id: item.id,
        movie_id: item.movie_id,
        movie_title: item.movie_title,
        movie_poster: item.movie_poster,
        rating: item.rating,
        media_type: item.media_type || 'movie',
        source: 'rating'
      });
    });
    movieDiary.forEach(entry => {
      if (!watchedMap.has(entry.movie_id)) {
        watchedMap.set(entry.movie_id, {
          id: entry.id,
          movie_id: entry.movie_id,
          movie_title: entry.movie_title,
          movie_poster: entry.movie_poster,
          rating: entry.rating,
          media_type: 'movie',
          source: 'diary'
        });
      } else if (entry.rating && entry.rating > (watchedMap.get(entry.movie_id)?.rating || 0)) {
        const existing = watchedMap.get(entry.movie_id);
        watchedMap.set(entry.movie_id, { ...existing, rating: entry.rating });
      }
    });
    tvDiary.forEach(entry => {
      if (!watchedMap.has(entry.tv_id)) {
        watchedMap.set(entry.tv_id, {
          id: entry.id,
          movie_id: entry.tv_id,
          movie_title: entry.tv_title,
          movie_poster: entry.tv_poster,
          rating: null,
          media_type: 'tv',
          source: 'diary'
        });
      }
    });
    let result = Array.from(watchedMap.values());
    if (mediaFilter === 'movies') result = result.filter(item => item.media_type !== 'tv');
    if (mediaFilter === 'tv') result = result.filter(item => item.media_type === 'tv');
    result = filterByRating(result);
    return sortItems(result);
  };

  const getCombinedDiary = () => {
    const diaryMap = new Map<string, any>();
    movieDiary.filter(entry => entry.notes && entry.notes.trim()).forEach(entry => {
      const key = `movie-${entry.movie_id}`;
      const existing = diaryMap.get(key);
      if (!existing || new Date(entry.watched_date) > new Date(existing.watched_date)) {
        diaryMap.set(key, { ...entry, type: 'movie' as const });
      }
    });
    const tvShowMap = new Map<number, any>();
    tvDiary.filter(entry => entry.notes && entry.notes.trim()).forEach(entry => {
      const existing = tvShowMap.get(entry.tv_id);
      if (!existing || new Date(entry.watched_date) > new Date(existing.watched_date)) {
        tvShowMap.set(entry.tv_id, { ...entry, type: 'tv' as const });
      }
    });
    tvShowMap.forEach((entry, tvId) => {
      diaryMap.set(`tv-${tvId}`, entry);
    });
    let result = Array.from(diaryMap.values());
    if (mediaFilter === 'movies') result = result.filter(item => item.type === 'movie');
    if (mediaFilter === 'tv') result = result.filter(item => item.type === 'tv');
    return result.sort((a, b) =>
      new Date(b.watched_date).getTime() - new Date(a.watched_date).getTime()
    );
  };

  // Handler to open edit modal for a diary entry
  const handleEditDiaryEntry = (entry: any, type: 'movie' | 'tv') => {
    if (type === 'movie') {
      setEditingEntry({
        mediaId: entry.movie_id,
        mediaTitle: entry.movie_title,
        mediaPoster: entry.movie_poster,
        mediaType: 'movie',
        initialRating: entry.rating || 0,
        initialNotes: entry.notes || '',
      });
    } else {
      setEditingEntry({
        mediaId: entry.tv_id,
        mediaTitle: entry.tv_title,
        mediaPoster: entry.tv_poster,
        mediaType: 'tv',
        initialRating: entry.rating || 0,
        initialNotes: entry.notes || '',
        seasonNumber: entry.season_number,
        episodeNumber: entry.episode_number,
      });
    }
    setEditModalOpen(true);
  };

  const handleEditModalClose = () => {
    setEditModalOpen(false);
    setEditingEntry(null);
    refetchDiary();
    refetchUserState();
  };

  const isLoading = itemsLoading || favoritesLoading || ratedLoading || diaryLoading;

  // Convert items to PosterGridItem format
  const toGridItems = (items: any[], getMediaType: (item: any) => 'movie' | 'tv', getDeleteFn?: (item: any) => () => void): PosterGridItem[] => {
    return items.map(item => ({
      id: item.id,
      movieId: item.movie_id,
      title: item.movie_title,
      poster: item.movie_poster,
      mediaType: getMediaType(item),
      userRating: item.rating,
      onDelete: getDeleteFn ? getDeleteFn(item) : undefined,
      isLiked: likedSet.has(item.movie_id),
      isRewatch: rewatchSet.has(item.movie_id),
    }));
  };

  // Convert diary entries to DiaryItem format
  const toDiaryItems = (entries: any[]): DiaryItem[] => {
    return entries.map(entry => {
      const isMovie = entry.type === 'movie';
      return {
        id: entry.id,
        movieId: isMovie ? entry.movie_id : entry.tv_id,
        title: isMovie ? entry.movie_title : entry.tv_title,
        poster: isMovie ? entry.movie_poster : entry.tv_poster,
        mediaType: entry.type as 'movie' | 'tv',
        userRating: entry.rating,
        notes: entry.notes,
        watchedDate: entry.watched_date,
        onDelete: () => deleteDiaryEntry(isMovie ? entry.movie_id : entry.tv_id, entry.type),
        onEdit: () => handleEditDiaryEntry(entry, entry.type),
      };
    });
  };

  // Stats helpers
  const totalWatched = (stats?.total_movies_watched || 0) + (stats?.total_tv_shows_watched || 0);
  const totalHours = (stats?.total_hours_watched || 0) + (stats?.total_tv_hours_watched || 0);
  const level = stats?.level || 1;
  const xp = stats?.experience_points || 0;
  const xpForNextLevel = level * 20;
  const xpProgress = Math.min((xp % xpForNextLevel) / xpForNextLevel * 100, 100);

  const renderEmptyState = (icon: React.ReactNode, title: string, description: string) => (
    <Card className="p-8 sm:p-12 text-center border-dashed">
      <div className="mx-auto mb-4 text-muted-foreground/50">{icon}</div>
      <p className="text-lg font-semibold text-foreground mb-1">{title}</p>
      <p className="text-sm text-muted-foreground mb-5">{description}</p>
      <div className="flex gap-3 justify-center">
        <Button variant="default" onClick={() => navigate('/movies')} className="gap-2">
          <Film className="h-4 w-4" /> Browse Movies
        </Button>
        <Button variant="outline" onClick={() => navigate('/tv-shows')} className="gap-2">
          <Tv className="h-4 w-4" /> Browse TV
        </Button>
      </div>
    </Card>
  );

  // Render list view (existing cards) for a tab
  const renderListView = (items: any[], tab: 'watchlist' | 'favorites' | 'watched' | 'diary') => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {items.map(item => {
          const itemMediaType = ((item as any).media_type || 'movie') as 'movie' | 'tv';

          if (tab === 'diary') {
            const isMovie = item.type === 'movie';
            const id = isMovie ? item.movie_id : item.tv_id;
            const title = isMovie ? item.movie_title : item.tv_title;
            const poster = isMovie ? item.movie_poster : item.tv_poster;

            if (!isMovie) {
              return (
                <TVShowCollectionCard
                  key={item.id}
                  id={item.id}
                  tvId={id}
                  title={title}
                  poster={poster}
                  userRating={item.rating}
                  defaultExpanded={true}
                  onDelete={() => deleteDiaryEntry(item.tv_id, 'tv')}
                  onEdit={() => handleEditDiaryEntry(item, 'tv')}
                />
              );
            }
            return (
              <CollectionMediaCard
                key={item.id}
                id={item.id}
                movieId={id}
                title={title}
                poster={poster}
                mediaType="movie"
                userRating={item.rating}
                onDelete={() => deleteDiaryEntry(item.movie_id, 'movie')}
                onEdit={() => handleEditDiaryEntry(item, 'movie')}
              >
                <p className="text-xs text-muted-foreground mt-1.5">
                  {format(new Date(item.watched_date), 'MMMM d, yyyy')}
                </p>
                {item.notes && (
                  <div className="mt-2 pl-3 border-l-2 border-primary/30">
                    <p className="text-xs text-muted-foreground line-clamp-2 italic">"{item.notes}"</p>
                  </div>
                )}
              </CollectionMediaCard>
            );
          }

          if (itemMediaType === 'tv') {
            return (
              <TVShowCollectionCard
                key={item.id || `${item.source}-${item.movie_id}`}
                id={item.id}
                tvId={item.movie_id}
                title={item.movie_title}
                poster={item.movie_poster}
                userRating={item.rating}
                onDelete={tab === 'watchlist' ? async () => { await removeItem(item.id); refetchUserState(); }
                  : tab === 'favorites' ? async () => { await removeFavorite(item.movie_id); refetchUserState(); }
                  : () => deleteAllMediaData(item.movie_id, 'tv')}
              >
                {tab === 'watchlist' && (
                  <p className="text-xs text-muted-foreground mt-1">Added {format(new Date(item.added_at), 'MMM d, yyyy')}</p>
                )}
                {tab === 'favorites' && (
                  <div className="flex items-center gap-1 mt-1"><Heart className="h-3.5 w-3.5 text-cinema-red fill-cinema-red" /><span className="text-xs text-muted-foreground">Favorited</span></div>
                )}
                {tab === 'watched' && (
                  <div className="flex items-center gap-1 mt-1"><Eye className="h-3.5 w-3.5 text-cinema-gold" /><span className="text-xs text-muted-foreground">Watched</span></div>
                )}
              </TVShowCollectionCard>
            );
          }

          return (
            <CollectionMediaCard
              key={item.id || `${item.source}-${item.movie_id}`}
              id={item.id}
              movieId={item.movie_id}
              title={item.movie_title}
              poster={item.movie_poster}
              mediaType="movie"
              userRating={item.rating}
              onDelete={tab === 'watchlist' ? async () => { await removeItem(item.id); refetchUserState(); }
                : tab === 'favorites' ? async () => { await removeFavorite(item.movie_id); refetchUserState(); }
                : () => deleteAllMediaData(item.movie_id, 'movie')}
            >
              {tab === 'watchlist' && (
                <p className="text-xs text-muted-foreground mt-1">Added {format(new Date(item.added_at), 'MMM d, yyyy')}</p>
              )}
              {tab === 'favorites' && (
                <div className="flex items-center gap-1 mt-1"><Heart className="h-3.5 w-3.5 text-cinema-red fill-cinema-red" /><span className="text-xs text-muted-foreground">Favorited</span></div>
              )}
              {tab === 'watched' && (
                <div className="flex items-center gap-1 mt-1"><Eye className="h-3.5 w-3.5 text-cinema-gold" /><span className="text-xs text-muted-foreground">Watched</span></div>
              )}
            </CollectionMediaCard>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-24 2xl:pb-12">
      <DesktopHeader />
      <MobileBrandHeader />
      <Navigation />
      
      <div className="px-3 sm:px-4 md:px-6 py-4 sm:py-6 max-w-7xl mx-auto">
        {/* Enhanced Stats Banner */}
        <div className="relative rounded-xl overflow-hidden mb-5 sm:mb-6 bg-gradient-to-br from-primary/15 via-card to-cinema-red/10 border border-border">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
          <div className="relative p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">My Collection</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">Your personal cinema journey</p>
              </div>
              <div className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-full">
                <Trophy className="h-4 w-4 text-primary" />
                <span className="text-sm font-bold text-foreground">Level {level}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5 mb-0.5">
                  <Eye className="h-4 w-4 text-cinema-gold" />
                  <span className="text-2xl sm:text-3xl font-bold text-foreground">
                    {mediaFilter === 'movies' ? (stats?.total_movies_watched || 0) : mediaFilter === 'tv' ? (stats?.total_tv_shows_watched || 0) : totalWatched}
                  </span>
                </div>
                <span className="text-[10px] sm:text-xs text-muted-foreground font-medium">Watched</span>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5 mb-0.5">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="text-2xl sm:text-3xl font-bold text-foreground">
                    {mediaFilter === 'movies' ? (stats?.total_hours_watched || 0) : mediaFilter === 'tv' ? (stats?.total_tv_hours_watched || 0) : totalHours}
                  </span>
                </div>
                <span className="text-[10px] sm:text-xs text-muted-foreground font-medium">Hours</span>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5 mb-0.5">
                  <Star className="h-4 w-4 fill-cinema-gold text-cinema-gold" />
                  <span className="text-2xl sm:text-3xl font-bold text-foreground">
                    {stats?.average_rating?.toFixed(1) || '0.0'}
                  </span>
                </div>
                <span className="text-[10px] sm:text-xs text-muted-foreground font-medium">Avg Rating</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                <span className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Level {level} Progress
                </span>
                <span>{xp % xpForNextLevel}/{xpForNextLevel} XP</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-cinema-gold rounded-full transition-all duration-700"
                  style={{ width: `${xpProgress}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Controls Row: Media Filter + View Toggle + Sort + Rating Filter */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {/* Media type filter */}
          <div className="flex gap-1">
            {(['all', 'movies', 'tv'] as MediaFilter[]).map(f => (
              <Button
                key={f}
                size="sm"
                variant={mediaFilter === f ? 'default' : 'outline'}
                onClick={() => setMediaFilter(f)}
                className="text-[10px] sm:text-xs h-8 px-2 sm:px-3 touch-manipulation active:scale-95"
              >
                {f === 'all' ? 'All' : f === 'movies' ? <><Film className="h-3 w-3 mr-1" />Movies</> : <><Tv className="h-3 w-3 mr-1" />TV</>}
              </Button>
            ))}
          </div>

          <div className="flex-1" />

          {/* Sort dropdown */}
          <Select value={sortOption} onValueChange={(v) => setSortOption(v as SortOption)}>
            <SelectTrigger className="h-8 w-[110px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Recent</SelectItem>
              <SelectItem value="rating">Rating</SelectItem>
              <SelectItem value="title">Title</SelectItem>
            </SelectContent>
          </Select>

          {/* Rating filter */}
          <Select value={ratingFilter} onValueChange={setRatingFilter}>
            <SelectTrigger className="h-8 w-[90px] text-xs">
              <SelectValue placeholder="Rating" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All ★</SelectItem>
              <SelectItem value="5">★★★★★</SelectItem>
              <SelectItem value="4">★★★★</SelectItem>
              <SelectItem value="3">★★★</SelectItem>
              <SelectItem value="2">★★</SelectItem>
              <SelectItem value="1">★</SelectItem>
            </SelectContent>
          </Select>

          {/* View toggle */}
          <div className="flex border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-accent'}`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-accent'}`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>

        <Tabs defaultValue="watchlist" className="w-full">
          <div className="overflow-x-auto -mx-3 px-3 mb-4 sm:mb-6">
            <TabsList className="inline-flex w-auto min-w-full sm:grid sm:grid-cols-6 h-10 sm:h-12">
              <TabsTrigger value="watchlist" className="flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-sm h-8 sm:h-10 touch-manipulation px-2 sm:px-2">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Watchlist</span>
                <Badge variant="secondary" className="ml-0.5 sm:ml-1 text-[10px] sm:text-xs h-4 sm:h-5 px-1">{getUnwatchedItems().length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="favorites" className="flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-sm h-8 sm:h-10 touch-manipulation px-2 sm:px-2">
                <Heart className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Favorites</span>
                <Badge variant="secondary" className="ml-0.5 sm:ml-1 text-[10px] sm:text-xs h-4 sm:h-5 px-1">{getFilteredFavorites().length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="watched" className="flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-sm h-8 sm:h-10 touch-manipulation px-2 sm:px-2">
                <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Watched</span>
                <Badge variant="secondary" className="ml-0.5 sm:ml-1 text-[10px] sm:text-xs h-4 sm:h-5 px-1">{getWatchedItems().length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="diary" className="flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-sm h-8 sm:h-10 touch-manipulation px-2 sm:px-2">
                <BookOpen className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Diary</span>
                <Badge variant="secondary" className="ml-0.5 sm:ml-1 text-[10px] sm:text-xs h-4 sm:h-5 px-1">{getCombinedDiary().length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="reviews" className="flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-sm h-8 sm:h-10 touch-manipulation px-2 sm:px-2">
                <Star className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Reviews</span>
              </TabsTrigger>
              <TabsTrigger value="lists" className="flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-sm h-8 sm:h-10 touch-manipulation px-2 sm:px-2">
                <Film className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Lists</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Search Bar */}
          <div className="flex items-center gap-1.5 sm:gap-2 mb-4 sm:mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
              <Input
                placeholder="Search movies to add..."
                value={movieSearchTerm}
                onChange={(e) => setMovieSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleMovieSearch()}
                className="pl-8 sm:pl-10 h-9 sm:h-10 text-sm"
              />
            </div>
            <Button onClick={handleMovieSearch} disabled={isSearching} size="sm" className="h-9 sm:h-10 px-3">
              {isSearching ? <div className="animate-spin h-3.5 w-3.5 sm:h-4 sm:w-4 border-2 border-current border-t-transparent rounded-full" /> : <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
            </Button>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="border rounded-lg p-3 sm:p-4 bg-card mb-4 sm:mb-6">
              <h3 className="font-semibold mb-2 sm:mb-3 text-sm sm:text-base">Search Results</h3>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2 sm:gap-3">
                {searchResults.slice(0, 6).map(movie => (
                  <div key={movie.id} className="text-center">
                    <img src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`} alt={movie.title} className="w-full aspect-[2/3] object-cover rounded mb-1.5 sm:mb-2" />
                    <p className="text-[10px] sm:text-xs font-medium mb-1.5 sm:mb-2 line-clamp-2">{movie.title}</p>
                    <Button size="sm" onClick={() => handleAddToWatchlist(movie)} className="w-full text-[10px] sm:text-xs h-7 sm:h-8">Add</Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Watchlist Tab */}
          <TabsContent value="watchlist" className="space-y-4">
            {isLoading ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">{[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="aspect-[2/3] w-full rounded-lg" />)}</div>
            ) : getUnwatchedItems().length > 0 ? (
              viewMode === 'grid' ? (
                <CollectionPosterGrid
                  items={toGridItems(
                    getUnwatchedItems(),
                    item => (item as any).media_type || 'movie',
                    item => async () => { await removeItem(item.id); refetchUserState(); }
                  )}
                />
              ) : (
                renderListView(getUnwatchedItems(), 'watchlist')
              )
            ) : (
              renderEmptyState(<Clock className="h-14 w-14" />, 'Your watchlist is empty', 'Start building your watchlist by browsing movies and TV shows')
            )}
          </TabsContent>

          {/* Favorites Tab */}
          <TabsContent value="favorites" className="space-y-4">
            {isLoading ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">{[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="aspect-[2/3] w-full rounded-lg" />)}</div>
            ) : getFilteredFavorites().length > 0 ? (
              viewMode === 'grid' ? (
                <CollectionPosterGrid
                  items={toGridItems(
                    getFilteredFavorites(),
                    item => (item as any).media_type || 'movie',
                    item => async () => { await removeFavorite(item.movie_id); refetchUserState(); }
                  )}
                />
              ) : (
                renderListView(getFilteredFavorites(), 'favorites')
              )
            ) : (
              renderEmptyState(<Heart className="h-14 w-14" />, 'No favorites yet', 'Like movies and TV shows to add them here')
            )}
          </TabsContent>

          {/* Watched Tab */}
          <TabsContent value="watched" className="space-y-4">
            {isLoading ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">{[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="aspect-[2/3] w-full rounded-lg" />)}</div>
            ) : getWatchedItems().length > 0 ? (
              viewMode === 'grid' ? (
                <CollectionPosterGrid
                  items={toGridItems(
                    getWatchedItems(),
                    item => item.media_type || 'movie',
                    item => () => deleteAllMediaData(item.movie_id, item.media_type || 'movie')
                  )}
                />
              ) : (
                renderListView(getWatchedItems(), 'watched')
              )
            ) : (
              renderEmptyState(<Eye className="h-14 w-14" />, 'Nothing watched yet', 'Rate movies and TV shows to mark them as watched')
            )}
          </TabsContent>

          {/* Diary Tab */}
          <TabsContent value="diary" className="space-y-4">
            {isLoading ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">{[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="aspect-[2/3] w-full rounded-lg" />)}</div>
            ) : getCombinedDiary().length > 0 ? (
              <>
                <DiaryHeatmap movieDiary={movieDiary} tvDiary={tvDiary} />
                {viewMode === 'grid' ? (
                  <div className="bg-card rounded-xl border border-border overflow-hidden">
                    <DiaryTable items={toDiaryItems(getCombinedDiary())} />
                  </div>
                ) : (
                  renderListView(getCombinedDiary(), 'diary')
                )}
              </>
            ) : (
              renderEmptyState(<BookOpen className="h-14 w-14" />, 'No diary entries yet', 'Log when you watched movies and TV shows with notes and ratings')
            )}
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews" className="space-y-4">
            <CollectionReviewsList />
          </TabsContent>

          {/* Lists Tab */}
          <TabsContent value="lists" className="space-y-4">
            <CollectionListsGrid />
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Diary Entry Modal */}
      {editingEntry && (
        <LogMediaModal
          isOpen={editModalOpen}
          onClose={handleEditModalClose}
          mediaId={editingEntry.mediaId}
          mediaTitle={editingEntry.mediaTitle}
          mediaPoster={editingEntry.mediaPoster}
          mediaType={editingEntry.mediaType}
          seasonNumber={editingEntry.seasonNumber}
          episodeNumber={editingEntry.episodeNumber}
          initialRating={editingEntry.initialRating}
          initialNotes={editingEntry.initialNotes}
        />
      )}
    </div>
  );
};

export default Collection;
