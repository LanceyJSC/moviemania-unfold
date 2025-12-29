import { Crown, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ProBadge } from './ProBadge';
import { useSubscription } from '@/hooks/useSubscription';
import { toast } from 'sonner';

interface ProUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: string;
  description?: string;
}

export const ProUpgradeModal = ({ isOpen, onClose, feature, description }: ProUpgradeModalProps) => {
  const { upgradeToPro } = useSubscription();

  const handleUpgrade = async () => {
    const result = await upgradeToPro();
    if (result.success) {
      toast.success('Welcome to SceneBurn Pro!');
      onClose();
    } else {
      toast.error(result.error || 'Failed to upgrade');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
            <Crown className="h-8 w-8 text-amber-500" />
          </div>
          <DialogTitle className="text-xl">
            Unlock {feature}
          </DialogTitle>
          <DialogDescription className="text-center">
            {description || `${feature} is part of SceneBurn Pro. Upgrade to unlock advanced features and enhance your movie discovery experience.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <ProBadge size="md" />
              <span className="font-semibold text-foreground">Pro Benefits</span>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                Advanced Discovery Filters
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                Unlimited Lists
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                Priority Support
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                Early Access to Features
              </li>
            </ul>
          </div>

          <Button
            onClick={handleUpgrade}
            className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold"
          >
            <Crown className="h-4 w-4 mr-2" />
            Upgrade to Pro
          </Button>
          
          <Button
            variant="ghost"
            onClick={onClose}
            className="w-full"
          >
            Maybe Later
          </Button>
          
          <Button
            variant="link"
            onClick={() => {
              onClose();
              window.location.href = '/pro';
            }}
            className="w-full text-amber-500 hover:text-amber-400"
          >
            Learn more about Pro
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
