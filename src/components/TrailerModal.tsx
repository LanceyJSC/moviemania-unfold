
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useTrailerContext } from "@/contexts/TrailerContext";
import { cn } from "@/lib/utils";

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
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };

    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleVideoError = () => {
    setVideoError(true);
  };

  const youtubeEmbedUrl = `https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0&modestbranding=1&controls=1&showinfo=0`;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* iOS-style backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal Container - iOS style with rounded corners */}
      <div className="relative flex items-center justify-center min-h-screen p-4">
        <div 
          className={cn(
            "relative w-full max-w-4xl bg-background rounded-3xl overflow-hidden",
            "shadow-2xl transform transition-all duration-300",
            isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0"
          )}
          style={{
            maxHeight: '90vh',
            aspectRatio: '16/9'
          }}
        >
          {/* iOS-style header */}
          <div className="absolute top-0 left-0 right-0 z-10 bg-background/95 backdrop-blur-xl border-b border-border/20">
            <div className="flex items-center justify-between p-4">
              <h3 className="font-semibold text-foreground truncate flex-1 mr-4">
                {movieTitle} - Trailer
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="rounded-full h-8 w-8 p-0 bg-muted/50 hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Video Container */}
          <div className="pt-16 h-full">
            {videoError ? (
              <div className="w-full h-full flex items-center justify-center text-center p-8">
                <div className="space-y-4">
                  <p className="text-muted-foreground">Unable to load trailer</p>
                  <Button 
                    onClick={() => window.open(`https://www.youtube.com/watch?v=${trailerKey}`, '_blank')}
                    className="bg-primary hover:bg-primary/90"
                  >
                    Open in YouTube
                  </Button>
                </div>
              </div>
            ) : (
              <iframe
                src={youtubeEmbedUrl}
                title={`${movieTitle} Trailer`}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
                onError={handleVideoError}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
