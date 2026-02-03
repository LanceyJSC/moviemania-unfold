import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Heart, Filter, X, Crown, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSubscription } from '@/hooks/useSubscription';
import { ProUpgradeModal } from './ProUpgradeModal';
import { cn } from '@/lib/utils';

interface Mood {
  id: string;
  label: string;
  emoji: string;
  genres: number[];
}

const MOODS: Mood[] = [
  { id: 'thrilling', label: 'Thrilling', emoji: '⚡', genres: [28, 53, 80] },
  { id: 'heartwarming', label: 'Heartwarming', emoji: '💖', genres: [10749, 18, 10751] },
  { id: 'mind-bending', label: 'Mind-bending', emoji: '🧠', genres: [878, 9648, 53] },
  { id: 'feel-good', label: 'Feel-good', emoji: '😊', genres: [35, 10751, 16] },
  { id: 'dark', label: 'Dark & Gritty', emoji: '🌙', genres: [27, 80, 53] },
  { id: 'light', label: 'Light & Fun', emoji: '🪶', genres: [35, 10402, 10749] }
];

interface Genre {
  id: number;
  name: string;
  emoji: string;
}

const MOVIE_GENRES: Genre[] = [
  { id: 28, name: "Action", emoji: "💥" },
  { id: 12, name: "Adventure", emoji: "🗺️" },
  { id: 16, name: "Animation", emoji: "🎨" },
  { id: 35, name: "Comedy", emoji: "😂" },
  { id: 80, name: "Crime", emoji: "🔪" },
  { id: 99, name: "Documentary", emoji: "📹" },
  { id: 18, name: "Drama", emoji: "🎭" },
  { id: 10751, name: "Family", emoji: "👨‍👩‍👧" },
  { id: 14, name: "Fantasy", emoji: "🧙" },
  { id: 36, name: "History", emoji: "📜" },
  { id: 27, name: "Horror", emoji: "👻" },
  { id: 10402, name: "Music", emoji: "🎵" },
  { id: 9648, name: "Mystery", emoji: "🔍" },
  { id: 10749, name: "Romance", emoji: "💕" },
  { id: 878, name: "Sci-Fi", emoji: "🚀" },
  { id: 53, name: "Thriller", emoji: "😰" },
  { id: 10752, name: "War", emoji: "⚔️" },
  { id: 37, name: "Western", emoji: "🤠" },
];

const TV_GENRES: Genre[] = [
  { id: 10759, name: "Action & Adventure", emoji: "💥" },
  { id: 16, name: "Animation", emoji: "🎨" },
  { id: 35, name: "Comedy", emoji: "😂" },
  { id: 80, name: "Crime", emoji: "🔪" },
  { id: 99, name: "Documentary", emoji: "📹" },
  { id: 18, name: "Drama", emoji: "🎭" },
  { id: 10751, name: "Family", emoji: "👨‍👩‍👧" },
  { id: 10762, name: "Kids", emoji: "🧒" },
  { id: 9648, name: "Mystery", emoji: "🔍" },
  { id: 10764, name: "Reality", emoji: "📷" },
  { id: 10765, name: "Sci-Fi & Fantasy", emoji: "🚀" },
  { id: 10768, name: "War & Politics", emoji: "⚔️" },
  { id: 37, name: "Western", emoji: "🤠" },
];

interface DiscoveryFiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaType: 'movie' | 'tv';
  selectedGenres: number[];
  onGenreChange: (genres: number[]) => void;
}

export const DiscoveryFiltersModal = ({
  isOpen,
  onClose,
  mediaType,
  selectedGenres,
  onGenreChange,
}: DiscoveryFiltersModalProps) => {
  const navigate = useNavigate();
  const { isProUser } = useSubscription();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'mood' | 'genre'>('genre');
  
  const genres = mediaType === 'tv' ? TV_GENRES : MOVIE_GENRES;

  const handleMoodClick = (mood: Mood) => {
    if (!isProUser) {
      setShowUpgradeModal(true);
      return;
    }
    const genreParams = mood.genres.join(',');
    navigate(`/${mediaType === 'tv' ? 'tv-shows' : 'movies'}?genres=${genreParams}&mood=${mood.id}`);
    onClose();
  };

  const handleGenreClick = (genreId: number) => {
    if (!isProUser) {
      setShowUpgradeModal(true);
      return;
    }
    
    if (selectedGenres.includes(genreId)) {
      onGenreChange(selectedGenres.filter(id => id !== genreId));
    } else {
      onGenreChange([...selectedGenres, genreId]);
    }
  };

  const clearGenres = () => {
    onGenreChange([]);
  };

  const applyAndClose = () => {
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-cinema-gold" />
              Discovery Filters
              {!isProUser && (
                <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-xs ml-2">
                  <Crown className="w-3 h-3 mr-1" />
                  PRO
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'mood' | 'genre')} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="genre" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                By Genre
              </TabsTrigger>
              <TabsTrigger value="mood" className="flex items-center gap-2">
                <Heart className="h-4 w-4" />
                By Mood
              </TabsTrigger>
            </TabsList>

            <TabsContent value="genre" className="space-y-4">
              {!isProUser ? (
                <div className="relative">
                  <div className="grid grid-cols-3 gap-2 blur-sm opacity-50 pointer-events-none">
                    {genres.slice(0, 9).map((genre) => (
                      <Button
                        key={genre.id}
                        variant="outline"
                        size="sm"
                        className="h-auto py-2 px-3 rounded-xl bg-card/60 border-border/50"
                      >
                        <span className="mr-1">{genre.emoji}</span>
                        <span className="text-xs truncate">{genre.name}</span>
                      </Button>
                    ))}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Button
                      onClick={() => setShowUpgradeModal(true)}
                      className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                      size="sm"
                    >
                      <Lock className="w-4 h-4 mr-2" />
                      Unlock Filters
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {selectedGenres.length > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {selectedGenres.length} selected
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearGenres}
                        className="text-xs text-muted-foreground hover:text-foreground h-7 px-2"
                      >
                        Clear All
                      </Button>
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-2">
                    {genres.map((genre) => {
                      const isSelected = selectedGenres.includes(genre.id);
                      return (
                        <Button
                          key={genre.id}
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleGenreClick(genre.id)}
                          className={cn(
                            "h-auto py-2 px-3 rounded-xl transition-all duration-200",
                            isSelected 
                              ? "bg-cinema-red text-white border-cinema-red shadow-md" 
                              : "bg-card/60 border-border/50 hover:bg-card/80"
                          )}
                        >
                          <span className="mr-1">{genre.emoji}</span>
                          <span className="text-xs truncate">{genre.name}</span>
                        </Button>
                      );
                    })}
                  </div>
                  
                  {selectedGenres.length > 0 && (
                    <Button 
                      onClick={applyAndClose}
                      className="w-full bg-cinema-red hover:bg-cinema-red/90"
                    >
                      Apply Filters
                    </Button>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="mood" className="space-y-4">
              {!isProUser ? (
                <div className="relative">
                  <div className="grid grid-cols-2 gap-3 blur-sm opacity-50 pointer-events-none">
                    {MOODS.map((mood) => (
                      <Button
                        key={mood.id}
                        variant="outline"
                        className="h-auto py-4 px-4 rounded-xl bg-card/60 border-border/50"
                      >
                        <span className="text-2xl mr-2">{mood.emoji}</span>
                        <span className="text-sm">{mood.label}</span>
                      </Button>
                    ))}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Button
                      onClick={() => setShowUpgradeModal(true)}
                      className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                      size="sm"
                    >
                      <Lock className="w-4 h-4 mr-2" />
                      Unlock Mood Filter
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {MOODS.map((mood) => (
                    <Button
                      key={mood.id}
                      variant="outline"
                      onClick={() => handleMoodClick(mood)}
                      className="h-auto py-4 px-4 rounded-xl bg-card/60 border-border/50 hover:bg-card/80 hover:border-cinema-gold/50 transition-all"
                    >
                      <span className="text-2xl mr-2">{mood.emoji}</span>
                      <span className="text-sm">{mood.label}</span>
                    </Button>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <ProUpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        feature="Discovery Filters"
        description="Unlock mood and genre filters to discover exactly what you're in the mood for."
      />
    </>
  );
};
