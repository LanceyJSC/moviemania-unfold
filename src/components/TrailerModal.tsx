
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
  const [isLandscapeMobile, setIsLandscapeMobile] = useState(false);
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
      console.log('Entering fullscreen...');
      
      // Force immediate fullscreen state
      setIsFullscreen(true);
      
      // Direct fullscreen API call on the document element
      const element = document.documentElement;
      
      if (element.requestFullscreen) {
        await element.requestFullscreen({ navigationUI: "hide" });
      } else if ((element as any).webkitRequestFullscreen) {
        await (element as any).webkitRequestFullscreen();
      } else if ((element as any).webkitRequestFullScreen) {
        await (element as any).webkitRequestFullScreen();
      } else if ((element as any).mozRequestFullScreen) {
        await (element as any).mozRequestFullScreen();
      } else if ((element as any).msRequestFullscreen) {
        await (element as any).msRequestFullscreen();
      }
      
      console.log('Fullscreen API called');
      
    } catch (error) {
      console.error('Fullscreen failed:', error);
      setIsFullscreen(true); // Still set state for styling
    }
  };

  const exitFullscreen = async () => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen();
      } else if ((document as any).webkitCancelFullScreen) {
        await (document as any).webkitCancelFullScreen();
      } else if ((document as any).mozCancelFullScreen) {
        await (document as any).mozCancelFullScreen();
      } else if ((document as any).msExitFullscreen) {
        await (document as any).msExitFullscreen();
      }
      
      // Restore all modified styles completely
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.style.height = '';
      document.documentElement.style.height = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.bottom = '';
      document.body.style.width = '';
      document.documentElement.style.width = '';
      document.body.style.margin = '';
      document.body.style.padding = '';
      document.documentElement.style.margin = '';
      document.documentElement.style.padding = '';
      
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
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.bottom = '';
      document.body.style.width = '';
      document.documentElement.style.width = '';
      document.body.style.margin = '';
      document.body.style.padding = '';
      document.documentElement.style.margin = '';
      document.documentElement.style.padding = '';
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
    const landscapeMobile = isLandscape && isMobile;
    
    setIsLandscapeMobile(landscapeMobile);
    
    if (landscapeMobile && isOpen) {
      // Immediately set fullscreen state for UI hiding
      setIsFullscreen(true);
      // Auto-enter fullscreen in landscape on mobile
      setTimeout(() => enterFullscreen(), 100);
      // Hide navigation bar in landscape
      const navigation = document.querySelector('nav[class*="fixed bottom-0"]') as HTMLElement;
      if (navigation) {
        navigation.style.display = 'none';
      }
    } else if (!landscapeMobile && isOpen) {
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

    // Also check immediately when modal opens
    if (isOpen) {
      handleOrientationChange();
    }

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

  // Handle fullscreen state changes - enhanced detection
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).webkitCurrentFullScreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      
      console.log('Fullscreen state changed:', isCurrentlyFullscreen);
      setIsFullscreen(isCurrentlyFullscreen);
      
      // If we exited fullscreen but modal is still open, try to re-enter
      if (!isCurrentlyFullscreen && isOpen) {
        const isLandscape = window.innerHeight < window.innerWidth;
        const isMobile = window.innerWidth <= 768;
        if (isLandscape && isMobile) {
          setTimeout(() => enterFullscreen(), 100);
        }
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleVideoError = () => {
    setVideoError(true);
  };

  const youtubeEmbedUrl = `https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0&modestbranding=1&controls=1&showinfo=0`;

  return (
    <div className="fixed inset-0 z-50 bg-cinema-black/95 backdrop-blur-sm">
      <div className={`relative h-full flex flex-col ${isLandscapeMobile ? 'landscape-mobile' : ''}`}>
        {/* Video Container - Full screen in landscape mobile */}
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

        {/* Header - Completely hidden in landscape mobile */}
        {!isLandscapeMobile && (
          <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-cinema-charcoal/80 backdrop-blur-sm">
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
                  className="text-muted-foreground hover:text-foreground p-3 min-h-[48px] min-w-[48px] touch-manipulation active:scale-95"
                >
                  <X className="h-6 w-6" />
                </Button>
            </div>
          </div>
        )}

        {/* Hints - Only show in portrait */}
        {!isLandscapeMobile && (
          <>
            {/* Mobile hint */}
            <div className="absolute bottom-0 left-0 right-0 p-4 text-center md:hidden">
              <p className="text-sm text-muted-foreground">
                Rotate your device for fullscreen experience
              </p>
            </div>

            {/* Desktop close hint */}
            <div className="absolute bottom-0 left-0 right-0 p-4 text-center hidden md:block">
              <p className="text-sm text-muted-foreground">
                Press ESC or click X to close
              </p>
            </div>
          </>
        )}

        {/* Landscape close button - floating close button for landscape */}
        {isLandscapeMobile && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="absolute top-4 right-4 z-20 text-white/80 hover:text-white bg-black/20 hover:bg-black/40 rounded-full p-3 min-h-[48px] min-w-[48px] touch-manipulation active:scale-95"
          >
            <X className="h-6 w-6" />
          </Button>
        )}
      </div>
    </div>
  );
};
