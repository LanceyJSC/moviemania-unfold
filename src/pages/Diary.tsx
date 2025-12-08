import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Calendar, Film, Tv, Star, Edit2, Trash2, Plus } from 'lucide-react';
import { useDiary, MovieDiaryEntry, TVDiaryEntry } from '@/hooks/useDiary';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import DiaryEntryModal from '@/components/DiaryEntryModal';
import { Navigation } from '@/components/Navigation';

const IMAGE_BASE = 'https://image.tmdb.org/t/p/w185';

const Diary = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { movieDiary, tvDiary, isLoading, deleteMovieDiaryEntry, deleteTVDiaryEntry } = useDiary();
  const [editingEntry, setEditingEntry] = useState<MovieDiaryEntry | TVDiaryEntry | null>(null);
  const [entryType, setEntryType] = useState<'movie' | 'tv'>('movie');
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-20 text-center">
          <Film className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-2">Personal Diary</h1>
          <p className="text-muted-foreground mb-4">Sign in to track your movies and TV shows</p>
          <Button onClick={() => navigate('/auth')}>Sign In</Button>
        </div>
      </div>
    );
  }

  const handleEdit = (entry: MovieDiaryEntry | TVDiaryEntry, type: 'movie' | 'tv') => {
    setEditingEntry(entry);
    setEntryType(type);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, type: 'movie' | 'tv') => {
    if (type === 'movie') {
      await deleteMovieDiaryEntry.mutateAsync(id);
    } else {
      await deleteTVDiaryEntry.mutateAsync(id);
    }
  };

  const groupByDate = <T extends { watched_date: string }>(entries: T[]) => {
    const grouped: Record<string, T[]> = {};
    entries.forEach((entry) => {
      const date = entry.watched_date;
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(entry);
    });
    return grouped;
  };

  const renderRating = (rating: number | null) => {
    if (!rating) return null;
    return (
      <div className="flex items-center gap-1">
        <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
        <span className="text-xs">{rating}/10</span>
      </div>
    );
  };

  const MovieDiaryList = () => {
    const grouped = groupByDate(movieDiary);
    const dates = Object.keys(grouped).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    if (movieDiary.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <Film className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No movies in your diary yet</p>
          <p className="text-sm">Start tracking movies you watch!</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {dates.map((date) => (
          <div key={date}>
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-primary" />
              <h3 className="font-medium">{format(new Date(date), 'EEEE, MMMM d, yyyy')}</h3>
            </div>
            <div className="grid gap-3">
              {grouped[date].map((entry) => (
                <Card key={entry.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex">
                      <div 
                        className="w-20 h-28 bg-muted flex-shrink-0 cursor-pointer"
                        onClick={() => navigate(`/movie/${entry.movie_id}`)}
                      >
                        {entry.movie_poster ? (
                          <img
                            src={`${IMAGE_BASE}${entry.movie_poster}`}
                            alt={entry.movie_title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Film className="w-8 h-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 p-3 flex flex-col">
                        <div className="flex items-start justify-between">
                          <h4 
                            className="font-medium line-clamp-1 cursor-pointer hover:text-primary"
                            onClick={() => navigate(`/movie/${entry.movie_id}`)}
                          >
                            {entry.movie_title}
                          </h4>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleEdit(entry, 'movie')}
                            >
                              <Edit2 className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive"
                              onClick={() => handleDelete(entry.id, 'movie')}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        {renderRating(entry.rating)}
                        {entry.notes && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            {entry.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const TVDiaryList = () => {
    const grouped = groupByDate(tvDiary);
    const dates = Object.keys(grouped).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    if (tvDiary.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <Tv className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No TV shows in your diary yet</p>
          <p className="text-sm">Start tracking shows you watch!</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {dates.map((date) => (
          <div key={date}>
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-primary" />
              <h3 className="font-medium">{format(new Date(date), 'EEEE, MMMM d, yyyy')}</h3>
            </div>
            <div className="grid gap-3">
              {grouped[date].map((entry) => (
                <Card key={entry.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex">
                      <div 
                        className="w-20 h-28 bg-muted flex-shrink-0 cursor-pointer"
                        onClick={() => navigate(`/tv/${entry.tv_id}`)}
                      >
                        {entry.tv_poster ? (
                          <img
                            src={`${IMAGE_BASE}${entry.tv_poster}`}
                            alt={entry.tv_title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Tv className="w-8 h-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 p-3 flex flex-col">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 
                              className="font-medium line-clamp-1 cursor-pointer hover:text-primary"
                              onClick={() => navigate(`/tv/${entry.tv_id}`)}
                            >
                              {entry.tv_title}
                            </h4>
                            {(entry.season_number || entry.episode_number) && (
                              <div className="flex gap-1 mt-1">
                                {entry.season_number && (
                                  <Badge variant="outline" className="text-xs">
                                    S{entry.season_number}
                                  </Badge>
                                )}
                                {entry.episode_number && (
                                  <Badge variant="outline" className="text-xs">
                                    E{entry.episode_number}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleEdit(entry, 'tv')}
                            >
                              <Edit2 className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive"
                              onClick={() => handleDelete(entry.id, 'tv')}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        {renderRating(entry.rating)}
                        {entry.notes && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            {entry.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <Navigation />
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">My Diary</h1>
            <p className="text-muted-foreground text-sm">Track what you watch</p>
          </div>
        </div>

        <Tabs defaultValue="movies" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="movies" className="flex items-center gap-2">
              <Film className="w-4 h-4" />
              Movies ({movieDiary.length})
            </TabsTrigger>
            <TabsTrigger value="tv" className="flex items-center gap-2">
              <Tv className="w-4 h-4" />
              TV Shows ({tvDiary.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="movies">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-28 w-full" />
                ))}
              </div>
            ) : (
              <MovieDiaryList />
            )}
          </TabsContent>

          <TabsContent value="tv">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-28 w-full" />
                ))}
              </div>
            ) : (
              <TVDiaryList />
            )}
          </TabsContent>
        </Tabs>
      </div>

      <DiaryEntryModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingEntry(null);
        }}
        entry={editingEntry}
        type={entryType}
      />
    </div>
  );
};

export default Diary;
