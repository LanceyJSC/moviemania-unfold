import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SynopsisModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  synopsis: string;
  posterUrl?: string;
}

export const SynopsisModal = ({ isOpen, onClose, title, synopsis, posterUrl }: SynopsisModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] bg-background border border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-cinematic tracking-wide text-foreground">
            {title} - Synopsis
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex gap-4 mt-4">
          {posterUrl && (
            <div className="flex-shrink-0">
              <img 
                src={posterUrl} 
                alt={title}
                className="w-24 h-36 rounded-lg object-cover border border-border"
              />
            </div>
          )}
          
          <ScrollArea className="flex-1 max-h-[50vh]">
            <div className="pr-4">
              <p className="text-foreground leading-relaxed text-base">
                {synopsis || "No synopsis available for this title."}
              </p>
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};