import { useState, useRef, useEffect } from "react";
import { Star, Calendar, Heart, X } from "lucide-react";
import { DiscoveryItem } from "@/hooks/useDiscovery";
import { tmdbService } from "@/lib/tmdb";

interface SwipeableDiscoveryCardProps {
  item: DiscoveryItem;
  onLike: () => void;
  onDislike: () => void;
  onSkip: () => void;
  isActive: boolean;
}

export const SwipeableDiscoveryCard = ({
  item,
  onLike,
  onDislike,
  onSkip,
  isActive
}: SwipeableDiscoveryCardProps) => {
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const handleStart = (clientX: number, clientY: number) => {
    if (!isActive) return;
    setIsDragging(true);
    setStartPos({ x: clientX, y: clientY });
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging || !isActive) return;
    
    const deltaX = clientX - startPos.x;
    const deltaY = clientY - startPos.y;
    setDragOffset({ x: deltaX, y: deltaY * 0.3 });
  };

  const handleEnd = () => {
    if (!isDragging || !isActive) return;
    
    const threshold = 120;
    const { x } = dragOffset;
    
    if (Math.abs(x) > threshold) {
      if (x > 0) {
        onLike();
      } else {
        onDislike();
      }
    }
    
    setIsDragging(false);
    setDragOffset({ x: 0, y: 0 });
  };

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleStart(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleMove(touch.clientX, touch.clientY);
  };

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    handleStart(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleMove(e.clientX, e.clientY);
  };

  // Global mouse events
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        handleMove(e.clientX, e.clientY);
      }
    };

    const handleGlobalMouseUp = () => {
      if (isDragging) {
        handleEnd();
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, dragOffset]);

  const rotation = dragOffset.x * 0.1;
  const opacity = Math.max(0.3, 1 - Math.abs(dragOffset.x) / 300);
  const scale = isActive ? 1 : 0.95;

  const cardStyle = {
    transform: `translateX(${dragOffset.x}px) translateY(${dragOffset.y}px) rotate(${rotation}deg) scale(${scale})`,
    opacity: isActive ? opacity : 0.8,
    transition: isDragging ? 'none' : 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    zIndex: isActive ? 10 : 1,
  };

  const likeOpacity = Math.max(0, Math.min(1, dragOffset.x / 120));
  const dislikeOpacity = Math.max(0, Math.min(1, -dragOffset.x / 120));

  const title = item.title || item.name || "Unknown";
  const releaseDate = item.release_date || item.first_air_date;
  const year = releaseDate ? new Date(releaseDate).getFullYear() : "Unknown";

  return (
    <div
      ref={cardRef}
      className="absolute inset-4 bg-card rounded-2xl shadow-2xl overflow-hidden select-none cursor-grab active:cursor-grabbing"
      style={cardStyle}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleEnd}
    >
      {/* Like/Dislike Overlay */}
      {likeOpacity > 0 && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-green-500/20 z-20"
          style={{ opacity: likeOpacity }}
        >
          <div className="bg-green-500 rounded-full p-4">
            <Heart className="w-12 h-12 text-white fill-white" />
          </div>
        </div>
      )}
      
      {dislikeOpacity > 0 && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-red-500/20 z-20"
          style={{ opacity: dislikeOpacity }}
        >
          <div className="bg-red-500 rounded-full p-4">
            <X className="w-12 h-12 text-white" />
          </div>
        </div>
      )}

      {/* Backdrop Image */}
      <div className="relative h-2/3 overflow-hidden">
        <img
          src={tmdbService.getBackdropUrl(item.backdrop_path || item.poster_path)}
          alt={title}
          className="w-full h-full object-cover"
          draggable={false}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="p-6 h-1/3 flex flex-col justify-between">
        <div>
          <h3 className="text-xl font-bold text-foreground mb-2 line-clamp-1">{title}</h3>
          <div className="flex items-center gap-4 text-muted-foreground text-sm mb-3">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
              <span>{item.vote_average.toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{year}</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">{item.overview}</p>
        </div>
      </div>
    </div>
  );
};