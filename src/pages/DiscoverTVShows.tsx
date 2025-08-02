import { useState, useEffect } from "react";
import { X, Heart, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileHeader } from "@/components/MobileHeader";
import { DesktopNavigation } from "@/components/DesktopNavigation";
import { SwipeableDiscoveryCard } from "@/components/SwipeableDiscoveryCard";
import { useDiscovery } from "@/hooks/useDiscovery";

export const DiscoverTVShows = () => {
  const {
    currentItem,
    hasMore,
    isLoading,
    handleLike,
    handleDislike,
    handleSkip,
    remainingCount
  } = useDiscovery("tv");

  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* Mobile Header */}
      <div className="md:hidden">
        <MobileHeader title="Discover TV Shows" />
      </div>
      
      {/* Desktop Header */}
      <div className="hidden md:flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur-sm">
        <DesktopNavigation />
        <div className="text-center flex-1">
          <h1 className="text-2xl font-bold text-foreground">Discover TV Shows</h1>
          <p className="text-muted-foreground text-sm">Swipe right to like, left to pass</p>
        </div>
        <div className="w-96"></div> {/* Spacer for centering */}
      </div>
      
      <div className="flex flex-col h-screen pt-14 md:pt-20 overflow-hidden max-w-md mx-auto md:max-w-2xl lg:max-w-4xl">
        {/* Cards Container */}
        <div className="flex-1 relative overflow-hidden">
          {currentItem && hasMore ? (
            <SwipeableDiscoveryCard
              key={currentItem.id}
              item={currentItem}
              onLike={() => handleLike(currentItem)}
              onDislike={() => handleDislike(currentItem)}
              onSkip={() => handleSkip(currentItem)}
              isActive={true}
            />
          ) : isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Finding amazing TV shows...</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center px-6">
                <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">That's all for now!</h3>
                <p className="text-muted-foreground mb-6">
                  You've seen all available TV shows. 
                  Check back later for more recommendations.
                </p>
                <Button onClick={() => history.back()} variant="default">
                  Back to TV Shows
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {currentItem && hasMore && (
          <div className="flex justify-center gap-4 p-4 bg-background/95 backdrop-blur-sm border-t flex-shrink-0 md:gap-8 md:p-6">
            <Button
              variant="outline"
              size="lg"
              onClick={() => handleDislike(currentItem)}
              className="rounded-full w-14 h-14 p-0 border-2 hover:bg-red-50 hover:border-red-300 md:w-16 md:h-16"
            >
              <X className="w-5 h-5 text-red-500 md:w-6 md:h-6" />
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              onClick={() => handleSkip(currentItem)}
              className="rounded-full w-12 h-12 p-0 border-2 md:w-14 md:h-14"
            >
              <SkipForward className="w-4 h-4 text-muted-foreground md:w-5 md:h-5" />
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              onClick={() => handleLike(currentItem)}
              className="rounded-full w-14 h-14 p-0 border-2 hover:bg-green-50 hover:border-green-300 md:w-16 md:h-16"
            >
              <Heart className="w-5 h-5 text-green-500 md:w-6 md:h-6" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};