
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

interface TrailerModalProps {
  isOpen: boolean;
  onClose: () => void;
  trailerKey: string;
  movieTitle: string;
}

export const TrailerModal = ({ isOpen, onClose, trailerKey, movieTitle }: TrailerModalProps) => {
  const [videoError, setVideoError] = useState(false);

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

  if (!isOpen) return null;

  const handleVideoError = () => {
    setVideoError(true);
  };

  const youtubeEmbedUrl = `https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0&modestbranding=1&controls=1&showinfo=0`;

  return (
    <div className="fixed inset-0 z-50 bg-cinema-black/95 backdrop-blur-sm">
      <div className="relative h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-cinema-charcoal/80 backdrop-blur-sm">
          <h2 className="text-lg font-semibold text-foreground truncate pr-4">
            {movieTitle} - Trailer
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-2"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>

        {/* Video Container */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-4xl aspect-video bg-cinema-charcoal rounded-lg overflow-hidden">
            {videoError ? (
              <div className="w-full h-full flex items-center justify-center text-center">
                <div>
                  <p className="text-muted-foreground mb-4">Unable to load trailer</p>
                  <Button 
                    onClick={() => window.open(`https://www.youtube.com/watch?v=${trailerKey}`, '_blank')}
                    className="bg-cinema-red hover:bg-cinema-red/90"
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
                onError={handleVideoError}
              />
            )}
          </div>
        </div>

        {/* Close hint */}
        <div className="p-4 text-center">
          <p className="text-sm text-muted-foreground">
            Tap the X button to close
          </p>
        </div>
      </div>
    </div>
  );
};
