
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useTrailerContext } from "@/contexts/TrailerContext";

interface TrailerModalProps {
  isOpen: boolean;
  onClose: () => void;
  trailerKey: string;
  movieTitle: string;
}

export const TrailerModal = ({ isOpen, onClose, trailerKey, movieTitle }: TrailerModalProps) => {
  const [videoError, setVideoError] = useState(false);
  const { setIsTrailerOpen } = useTrailerContext();

  const handleClose = () => {
    setIsTrailerOpen(false);
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Close on ESC
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen]);

  if (!isOpen) return null;

  const youtubeEmbedUrl = `https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=1&rel=0&modestbranding=1&controls=1&showinfo=0`;

  return (
    <div className="fixed inset-0 z-[9999] bg-background/95 backdrop-blur-sm flex flex-col">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" style={{ paddingTop: 'max(env(safe-area-inset-top), 12px)' }}>
        <h2 className="text-sm md:text-lg font-semibold text-foreground truncate pr-4">
          {movieTitle}
        </h2>
        <button
          onClick={handleClose}
          className="flex items-center justify-center w-10 h-10 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-full touch-manipulation active:scale-95 transition-transform flex-shrink-0"
          aria-label="Close trailer"
        >
          <X className="h-5 w-5" strokeWidth={3} />
        </button>
      </div>

      {/* Video container - fills remaining space */}
      <div className="flex-1 flex items-center justify-center px-2 pb-2 md:px-8 md:pb-8 min-h-0">
        <div className="w-full h-full max-w-6xl max-h-full aspect-video bg-card rounded-lg overflow-hidden">
          {videoError ? (
            <div className="w-full h-full flex items-center justify-center text-center">
              <div>
                <p className="text-muted-foreground mb-4">Unable to load trailer</p>
                <Button 
                  onClick={() => window.open(`https://www.youtube.com/watch?v=${trailerKey}`, '_blank')}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Open in YouTube
                </Button>
              </div>
            </div>
          ) : (
            <iframe
              src={youtubeEmbedUrl}
              title={`${movieTitle} Trailer`}
              className="w-full h-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
              onError={() => setVideoError(true)}
            />
          )}
        </div>
      </div>

      {/* Bottom hint */}
      <div className="text-center pb-2 md:pb-4 flex-shrink-0" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}>
        <p className="text-xs text-muted-foreground">
          Use the YouTube fullscreen button for full experience • ESC to close
        </p>
      </div>
    </div>
  );
};
