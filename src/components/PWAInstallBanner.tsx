import { useState, useEffect } from 'react';
import { X, Download, Share, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useIsMobile } from '@/hooks/use-mobile';

const DISMISS_KEY = 'pwa-install-dismissed';
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export const PWAInstallBanner = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const { isInstallable, isInstalled, isIOS, promptInstall } = usePWAInstall();
  const isMobile = useIsMobile();

  useEffect(() => {
    // Only show on mobile
    if (!isMobile) return;

    // Don't show if already installed
    if (isInstalled) return;

    // Check if user dismissed recently
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt) {
      const dismissedTime = parseInt(dismissedAt, 10);
      if (Date.now() - dismissedTime < DISMISS_DURATION) {
        return;
      }
    }

    // Show banner after 3 seconds if installable or on iOS
    const timer = setTimeout(() => {
      if (isInstallable || isIOS) {
        setIsVisible(true);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [isMobile, isInstalled, isInstallable, isIOS]);

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
    } else {
      const installed = await promptInstall();
      if (installed) {
        setIsVisible(false);
      }
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setShowIOSInstructions(false);
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up">
      <div className="mx-2 mb-2 rounded-2xl bg-card/95 backdrop-blur-xl border border-border/50 shadow-2xl overflow-hidden">
        {/* Main Banner */}
        {!showIOSInstructions ? (
          <div className="p-4">
            <div className="flex items-start gap-3">
              {/* App Icon */}
              <div className="flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden bg-gradient-to-br from-cinema-red to-orange-600 flex items-center justify-center shadow-lg">
                <img 
                  src="/sceneburn-icon.png" 
                  alt="SceneBurn" 
                  className="w-10 h-10 object-contain"
                />
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground text-base">
                  Install SceneBurn
                </h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Get the full app experience with offline access
                </p>
              </div>

              {/* Close Button */}
              <button
                onClick={handleDismiss}
                className="flex-shrink-0 p-1.5 rounded-full hover:bg-muted/50 transition-colors"
                aria-label="Dismiss"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-4">
              <Button
                variant="ghost"
                className="flex-1 text-muted-foreground"
                onClick={handleDismiss}
              >
                Maybe Later
              </Button>
              <Button
                className="flex-1 bg-cinema-red hover:bg-cinema-red/90 text-white gap-2"
                onClick={handleInstall}
              >
                <Download className="w-4 h-4" />
                Install Now
              </Button>
            </div>
          </div>
        ) : (
          /* iOS Instructions */
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground text-base">
                Install on iPhone
              </h3>
              <button
                onClick={handleDismiss}
                className="p-1.5 rounded-full hover:bg-muted/50 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Step 1 */}
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cinema-red/20 flex items-center justify-center">
                  <span className="text-cinema-red font-semibold text-sm">1</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <span>Tap the</span>
                  <Share className="w-5 h-5 text-blue-500" />
                  <span>Share button</span>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cinema-red/20 flex items-center justify-center">
                  <span className="text-cinema-red font-semibold text-sm">2</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <span>Scroll down and tap</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted rounded">
                    <Plus className="w-4 h-4" />
                    Add to Home Screen
                  </span>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cinema-red/20 flex items-center justify-center">
                  <span className="text-cinema-red font-semibold text-sm">3</span>
                </div>
                <div className="text-sm text-foreground">
                  Tap <span className="text-blue-500 font-medium">Add</span> in the top right
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full mt-4"
              onClick={() => setShowIOSInstructions(false)}
            >
              Got it
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
