import { useState, useEffect } from "react";
import { X, Heart, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileHeader } from "@/components/MobileHeader";
import { SwipeableDiscoveryCard } from "@/components/SwipeableDiscoveryCard";
import { useDiscovery } from "@/hooks/useDiscovery";

export const DiscoverMovies = () => {
  const {
    currentItem,
    hasMore,
    isLoading,
    handleLike,
    handleDislike,
    handleSkip,
    remainingCount
  } = useDiscovery("movie");

  return (
    <div className="fixed inset-0 z-50 bg-background">
      <MobileHeader title="Discover Movies" />
      
      <div className="flex flex-col h-screen pt-14 overflow-hidden">
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
                <p className="text-muted-foreground">Finding amazing movies...</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center px-6">
                <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">That's all for now!</h3>
                <p className="text-muted-foreground mb-6">
                  You've seen all available movies. 
                  Check back later for more recommendations.
                </p>
                <Button onClick={() => history.back()} variant="default">
                  Back to Movies
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {currentItem && hasMore && (
          <div className="flex justify-center gap-4 p-4 bg-background/95 backdrop-blur-sm border-t flex-shrink-0">
            <Button
              variant="outline"
              size="lg"
              onClick={() => handleDislike(currentItem)}
              className="rounded-full w-14 h-14 p-0 border-2 hover:bg-red-50 hover:border-red-300"
            >
              <X className="w-5 h-5 text-red-500" />
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              onClick={() => handleSkip(currentItem)}
              className="rounded-full w-12 h-12 p-0 border-2"
            >
              <SkipForward className="w-4 h-4 text-muted-foreground" />
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              onClick={() => handleLike(currentItem)}
              className="rounded-full w-14 h-14 p-0 border-2 hover:bg-green-50 hover:border-green-300"
            >
              <Heart className="w-5 h-5 text-green-500" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};