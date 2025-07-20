import { useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface SynopsisModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  synopsis: string;
  posterUrl?: string;
}

export const SynopsisModal = ({ isOpen, onClose, title, synopsis, posterUrl }: SynopsisModalProps) => {
  // Handle escape key and prevent body scroll
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* iOS-style backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* iOS-style bottom sheet */}
      <div className="absolute inset-x-0 bottom-0">
        <div 
          className={cn(
            "bg-background rounded-t-3xl shadow-2xl transform transition-all duration-300 max-h-[80vh]",
            isOpen ? "translate-y-0" : "translate-y-full"
          )}
          style={{
            paddingBottom: 'env(safe-area-inset-bottom)'
          }}
        >
          {/* Handle indicator */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-12 h-1 bg-muted rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/20">
            <h2 className="font-semibold text-foreground text-lg truncate flex-1 mr-4">
              {title}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="rounded-full h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <ScrollArea className="px-6 py-4 max-h-[60vh]">
            <div className="space-y-4">
              {posterUrl && (
                <div className="flex justify-center">
                  <img 
                    src={posterUrl} 
                    alt={title}
                    className="w-24 h-36 rounded-xl object-cover shadow-lg"
                  />
                </div>
              )}
              
              <div>
                <h3 className="font-medium text-foreground mb-3">Synopsis</h3>
                <p className="text-foreground/80 leading-relaxed">
                  {synopsis || "No synopsis available for this title."}
                </p>
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};