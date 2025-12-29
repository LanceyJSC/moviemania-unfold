import { useState, useRef } from 'react';
import { Upload, FileText, Check, AlertCircle, Lock } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from './ui/dialog';
import { Progress } from './ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { ProUpgradeModal } from './ProUpgradeModal';
import { ProBadge } from './ProBadge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type ImportSource = 'letterboxd' | 'imdb';

interface ParsedRating {
  title: string;
  year?: number;
  rating: number;
  watchedDate?: string;
}

export const ImportData = () => {
  const { user } = useAuth();
  const { isProUser } = useSubscription();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [source, setSource] = useState<ImportSource | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{ success: number; failed: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOpenChange = (open: boolean) => {
    if (open && !isProUser) {
      setShowUpgradeModal(true);
      return;
    }
    setIsOpen(open);
    if (!open) {
      setSource(null);
      setResults(null);
      setProgress(0);
    }
  };

  const parseLetterboxdCSV = (content: string): ParsedRating[] => {
    const lines = content.split('\n');
    const ratings: ParsedRating[] = [];
    
    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Letterboxd CSV format: Date,Name,Year,Letterboxd URI,Rating,Rewatch,Tags,Watched Date
      const parts = line.match(/(".*?"|[^,]+)/g);
      if (!parts || parts.length < 5) continue;
      
      const name = parts[1]?.replace(/"/g, '').trim();
      const year = parseInt(parts[2]?.replace(/"/g, '').trim() || '0');
      const rating = parseFloat(parts[4]?.replace(/"/g, '').trim() || '0');
      const watchedDate = parts[7]?.replace(/"/g, '').trim();
      
      if (name && rating > 0) {
        ratings.push({
          title: name,
          year: year || undefined,
          rating: Math.round(rating), // Letterboxd uses 0.5-5 scale
          watchedDate
        });
      }
    }
    
    return ratings;
  };

  const parseIMDbCSV = (content: string): ParsedRating[] => {
    const lines = content.split('\n');
    const ratings: ParsedRating[] = [];
    
    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // IMDb CSV format varies but typically: Const,Your Rating,Date Rated,Title,URL,Title Type,IMDb Rating,Runtime,Year,...
      const parts = line.match(/(".*?"|[^,]+)/g);
      if (!parts || parts.length < 9) continue;
      
      const rating = parseInt(parts[1]?.replace(/"/g, '').trim() || '0');
      const dateRated = parts[2]?.replace(/"/g, '').trim();
      const title = parts[3]?.replace(/"/g, '').trim();
      const year = parseInt(parts[8]?.replace(/"/g, '').trim() || '0');
      
      if (title && rating > 0) {
        ratings.push({
          title,
          year: year || undefined,
          rating: Math.round(rating / 2), // IMDb uses 1-10 scale, convert to 1-5
          watchedDate: dateRated
        });
      }
    }
    
    return ratings;
  };

  const searchTMDB = async (title: string, year?: number): Promise<number | null> => {
    try {
      const query = encodeURIComponent(title);
      const yearParam = year ? `&year=${year}` : '';
      const response = await fetch(
        `https://api.themoviedb.org/3/search/movie?api_key=${import.meta.env.VITE_TMDB_API_KEY}&query=${query}${yearParam}`
      );
      const data = await response.json();
      return data.results?.[0]?.id || null;
    } catch {
      return null;
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !source || !user) return;

    setImporting(true);
    setProgress(0);
    setResults(null);

    try {
      const content = await file.text();
      const parsedRatings = source === 'letterboxd' 
        ? parseLetterboxdCSV(content)
        : parseIMDbCSV(content);

      if (parsedRatings.length === 0) {
        toast.error('No valid ratings found in file');
        setImporting(false);
        return;
      }

      let success = 0;
      let failed = 0;

      for (let i = 0; i < parsedRatings.length; i++) {
        const rating = parsedRatings[i];
        setProgress(Math.round(((i + 1) / parsedRatings.length) * 100));

        const movieId = await searchTMDB(rating.title, rating.year);
        
        if (movieId) {
          const { error } = await supabase
            .from('user_ratings')
            .upsert({
              user_id: user.id,
              movie_id: movieId,
              movie_title: rating.title,
              rating: rating.rating,
              media_type: 'movie',
              is_public: false
            }, {
              onConflict: 'user_id,movie_id'
            });

          if (error) {
            failed++;
          } else {
            success++;
          }
        } else {
          failed++;
        }

        // Rate limit to avoid hitting TMDB too hard
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      setResults({ success, failed });
      toast.success(`Imported ${success} ratings!`);
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import data');
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Upload className="h-4 w-4" />
            Import Data
            <ProBadge size="sm" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Import Ratings
            </DialogTitle>
            <DialogDescription>
              Import your movie ratings from other platforms
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {!source ? (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setSource('letterboxd')}
                  className="p-4 rounded-xl border border-border/50 hover:border-foreground/50 transition-colors text-center"
                >
                  <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-[#00D735]/10 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-[#00D735]" />
                  </div>
                  <div className="font-medium">Letterboxd</div>
                  <div className="text-xs text-muted-foreground mt-1">Export from Settings</div>
                </button>
                <button
                  onClick={() => setSource('imdb')}
                  className="p-4 rounded-xl border border-border/50 hover:border-foreground/50 transition-colors text-center"
                >
                  <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-[#F5C518]/10 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-[#F5C518]" />
                  </div>
                  <div className="font-medium">IMDb</div>
                  <div className="text-xs text-muted-foreground mt-1">Export your ratings</div>
                </button>
              </div>
            ) : importing ? (
              <div className="space-y-4 py-4">
                <div className="text-center">
                  <div className="text-lg font-medium mb-2">Importing...</div>
                  <div className="text-sm text-muted-foreground">
                    This may take a few minutes for large libraries
                  </div>
                </div>
                <Progress value={progress} className="h-2" />
                <div className="text-center text-sm text-muted-foreground">
                  {progress}% complete
                </div>
              </div>
            ) : results ? (
              <div className="space-y-4 py-4 text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-green-500/10 flex items-center justify-center">
                  <Check className="h-8 w-8 text-green-500" />
                </div>
                <div>
                  <div className="text-lg font-medium">Import Complete!</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Successfully imported {results.success} ratings
                    {results.failed > 0 && ` (${results.failed} failed)`}
                  </div>
                </div>
                <Button onClick={() => handleOpenChange(false)} className="w-full">
                  Done
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                  <div className="font-medium">
                    Import from {source === 'letterboxd' ? 'Letterboxd' : 'IMDb'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {source === 'letterboxd' ? (
                      <>
                        1. Go to Letterboxd Settings → Import & Export<br/>
                        2. Click "Export Your Data"<br/>
                        3. Upload the <code className="text-xs bg-background px-1 py-0.5 rounded">ratings.csv</code> file
                      </>
                    ) : (
                      <>
                        1. Go to your IMDb account → Your Ratings<br/>
                        2. Click the "..." menu → Export<br/>
                        3. Upload the downloaded CSV file
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 rounded-lg border border-amber-500/30 bg-amber-500/5">
                  <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                  <span className="text-xs text-muted-foreground">
                    Existing ratings will be updated with imported values
                  </span>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setSource(null)}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Select File
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ProUpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        feature="Data Import"
        description="Import your movie ratings and watch history from Letterboxd, IMDb, and other platforms. Migrate your data seamlessly!"
      />
    </>
  );
};
