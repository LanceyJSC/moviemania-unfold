
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

interface TrailerModalProps {
  isOpen: boolean;
  onClose: () => void;
  trailerKey: string;
  movieTitle: string;
}

export const TrailerModal = ({ isOpen, onClose, trailerKey, movieTitle }: TrailerModalProps) => {
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
            <iframe
              src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0&modestbranding=1`}
              title={`${movieTitle} Trailer`}
              className="w-full h-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>

        {/* Mobile tap to close hint */}
        <div className="p-4 text-center">
          <p className="text-sm text-muted-foreground">
            Tap the X button to close
          </p>
        </div>
      </div>
    </div>
  );
};
