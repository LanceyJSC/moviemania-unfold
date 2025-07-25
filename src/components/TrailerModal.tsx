
import { X, Maximize, Minimize } from "lucide-react";
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { setIsTrailerOpen } = useTrailerContext();

  const handleClose = () => {
    if (isFullscreen) {
      exitFullscreen();
    }
    // Restore navigation bar when closing
    const navigation = document.querySelector('nav[class*="fixed bottom-0"]') as HTMLElement;
    if (navigation) {
      navigation.style.display = 'block';
    }
    setIsTrailerOpen(false);
    onClose();
  };

  const enterFullscreen = async () => {
    try {
      const element = document.documentElement;
      
      // Aggressively hide browser UI before requesting fullscreen
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0, viewport-fit=cover');
      }
      
      // Set CSS properties for immediate effect
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      document.body.style.height = '100vh';
      document.documentElement.style.height = '100vh';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      
      // Hide address bar on mobile with aggressive scrolling
      const hideAddressBar = () => {
        window.scrollTo(0, 1);
        setTimeout(() => window.scrollTo(0, 1), 10);
        setTimeout(() => window.scrollTo(0, 1), 20);
        setTimeout(() => window.scrollTo(0, 1), 50);
        setTimeout(() => window.scrollTo(0, 1), 100);
        setTimeout(() => window.scrollTo(0, 1), 200);
        setTimeout(() => window.scrollTo(0, 1), 500);
      };
      
      hideAddressBar();
      
      // Request fullscreen API
      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if ((element as any).webkitRequestFullscreen) {
        await (element as any).webkitRequestFullscreen();
      } else if ((element as any).mozRequestFullScreen) {
        await (element as any).mozRequestFullScreen();
      } else if ((element as any).msRequestFullscreen) {
        await (element as any).msRequestFullscreen();
      }
      
      // Continue hiding after fullscreen request
      setTimeout(hideAddressBar, 100);
      setTimeout(hideAddressBar, 300);
      setTimeout(hideAddressBar, 500);
      
      setIsFullscreen(true);
    } catch (error) {
      console.error('Failed to enter fullscreen:', error);
      // Fallback: aggressive CSS fullscreen simulation
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      document.body.style.height = '100vh';
      document.documentElement.style.height = '100vh';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      
      // Aggressive address bar hiding for fallback
      const fallbackHide = () => {
        window.scrollTo(0, 1);
        setTimeout(() => window.scrollTo(0, 1), 10);
        setTimeout(() => window.scrollTo(0, 1), 50);
        setTimeout(() => window.scrollTo(0, 1), 100);
      };
      
      fallbackHide();
      setTimeout(fallbackHide, 200);
      setTimeout(fallbackHide, 500);
      
      setIsFullscreen(true);
    }
  };

  const exitFullscreen = async () => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen();
      } else if ((document as any).msExitFullscreen) {
        await (document as any).msExitFullscreen();
      }
      
      // Restore all modified styles
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.style.height = '';
      document.documentElement.style.height = '';
      document.body.style.position = '';
      document.body.style.width = '';
      
      // Restore viewport meta tag
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0');
      }
      
      setIsFullscreen(false);
    } catch (error) {
      console.error('Failed to exit fullscreen:', error);
      // Still restore styles even if fullscreen API failed
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.style.height = '';
      document.documentElement.style.height = '';
      document.body.style.position = '';
      document.body.style.width = '';
      setIsFullscreen(false);
    }
  };

  const toggleFullscreen = () => {
    if (isFullscreen) {
      exitFullscreen();
    } else {
      enterFullscreen();
    }
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

  // Handle orientation change for mobile devices
  useEffect(() => {
    const handleOrientationChange = () => {
      const isLandscape = window.innerHeight < window.innerWidth;
      const isMobile = window.innerWidth <= 768;
      
      if (isLandscape && isOpen && isMobile) {
        // Auto-enter fullscreen in landscape on mobile
        if (!isFullscreen) {
          setTimeout(() => enterFullscreen(), 100);
        }
        // Hide navigation bar in landscape
        const navigation = document.querySelector('nav[class*="fixed bottom-0"]') as HTMLElement;
        if (navigation) {
          navigation.style.display = 'none';
        }
      } else if (!isLandscape && isOpen && isMobile) {
        // Show navigation bar in portrait
        const navigation = document.querySelector('nav[class*="fixed bottom-0"]') as HTMLElement;
        if (navigation) {
          navigation.style.display = 'block';
        }
        // Exit fullscreen in portrait if currently fullscreen
        if (isFullscreen) {
          setTimeout(() => exitFullscreen(), 100);
        }
      }
    };

    // Initial check
    handleOrientationChange();

    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
      // Restore navigation bar when component unmounts
      const navigation = document.querySelector('nav[class*="fixed bottom-0"]') as HTMLElement;
      if (navigation) {
        navigation.style.display = 'block';
      }
    };
  }, [isOpen, isFullscreen]);

  // Handle fullscreen state changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isCurrentlyFullscreen);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  if (!isOpen) return null;

  const handleVideoError = () => {
    setVideoError(true);
  };

  const youtubeEmbedUrl = `https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0&modestbranding=1&controls=1&showinfo=0`;

  return (
    <div className="fixed inset-0 z-50 bg-cinema-black/95 backdrop-blur-sm">
      <div className="relative h-full flex flex-col">
        {/* Header - Hidden in fullscreen */}
        {!isFullscreen && (
          <div className="flex items-center justify-between p-4 bg-cinema-charcoal/80 backdrop-blur-sm">
            <h2 className="text-lg font-semibold text-foreground truncate pr-4">
              {movieTitle} - Trailer
            </h2>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFullscreen}
                className="text-muted-foreground hover:text-foreground p-2 md:flex hidden"
              >
                {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="text-muted-foreground hover:text-foreground p-2"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
          </div>
        )}

        {/* Video Container */}
        <div className={`${isFullscreen ? 'fixed inset-0 z-50' : 'flex-1 flex items-center justify-center p-4'}`}>
          <div className={`${isFullscreen ? 'w-screen h-screen' : 'w-full max-w-4xl aspect-video'} bg-cinema-charcoal ${isFullscreen ? '' : 'rounded-lg'} overflow-hidden`}>
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

        {/* Mobile and Desktop hints - Hidden in fullscreen */}
        {!isFullscreen && (
          <>
            {/* Mobile hint */}
            <div className="p-4 text-center md:hidden">
              <p className="text-sm text-muted-foreground">
                Rotate your device for fullscreen experience
              </p>
            </div>

            {/* Desktop close hint */}
            <div className="p-4 text-center hidden md:block">
              <p className="text-sm text-muted-foreground">
                Press ESC or click X to close
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
