import { useState, useEffect } from "react";
import { X, Heart, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileHeader } from "@/components/MobileHeader";
import { SwipeableDiscoveryCard } from "./SwipeableDiscoveryCard";
import { useDiscovery } from "@/hooks/useDiscovery";

interface DiscoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "movie" | "tv";
}

export const DiscoveryModal = ({ isOpen, onClose, type }: DiscoveryModalProps) => {
  const {
    currentItem,
    hasMore,
    isLoading,
    handleLike,
    handleDislike,
    handleSkip,
    remainingCount
  } = useDiscovery(type);

  if (!isOpen) return null;

  const title = type === "movie" ? "Discover Movies" : "Discover TV Shows";

  return (
    <div className="fixed inset-0 z-50 bg-background">
      <MobileHeader title={title} />
      
      {/* Custom back button for modal */}
      <div className="absolute top-3 left-4 z-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="p-2 hover:bg-cinema-charcoal/50"
        >
          <X className="h-5 w-5 text-foreground" />
        </Button>
      </div>
      
      <div className="flex flex-col h-screen pt-14 overflow-hidden">
        {/* Progress indicator */}
        <div className="px-4 py-3 bg-muted/50 flex-shrink-0">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Swipe right to like, left to pass</span>
            <span>{remainingCount} remaining</span>
          </div>
        </div>

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
                <p className="text-muted-foreground">Finding amazing content...</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center px-6">
                <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">That's all for now!</h3>
                <p className="text-muted-foreground mb-6">
                  You've seen all available {type === "movie" ? "movies" : "TV shows"}. 
                  Check back later for more recommendations.
                </p>
                <Button onClick={onClose} variant="default">
                  Back to Browse
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