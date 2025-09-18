import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DiscussionModalProps {
  isOpen: boolean;
  onClose: () => void;
  discussionId: string;
  children: React.ReactNode;
}

export const DiscussionModal = ({ isOpen, onClose, discussionId, children }: DiscussionModalProps) => {
  const navigate = useNavigate();

  const handleFullPage = () => {
    onClose();
    navigate(`/discussion/${discussionId}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-row items-center justify-between space-y-0 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onClose}
              className="p-1"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            Discussion
          </DialogTitle>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleFullPage}
          >
            Full Page
          </Button>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
};