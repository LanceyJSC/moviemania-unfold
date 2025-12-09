import { useState, useEffect, useCallback } from "react";
import { tmdbService } from "@/lib/tmdb";
import { useUserStateContext } from "@/contexts/UserStateContext";
import { useAuth } from "@/hooks/useAuth";

export interface DiscoveryItem {
  id: number;
  title?: string;
  name?: string;
  poster_path: string;
  backdrop_path?: string;
  overview: string;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  genre_ids: number[];
}

export const useDiscovery = (type: "movie" | "tv") => {
  const [queue, setQueue] = useState<DiscoveryItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [excludedIds, setExcludedIds] = useState<Set<number>>(new Set());
  const { toggleLike } = useUserStateContext();
  const { user } = useAuth();

  const fetchMoreContent = useCallback(async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const randomPage = Math.floor(Math.random() * 10) + 1;
      
      let response;
      if (type === "movie") {
        response = await tmdbService.discoverMovies({ page: randomPage });
      } else {
        response = await tmdbService.getPopularTVShows(randomPage);
      }
      
      // Filter out already excluded content
      const newItems = response.results.filter(
        (item: DiscoveryItem) => !excludedIds.has(item.id)
      );
      
      setQueue(prev => [...prev, ...newItems]);
    } catch (error) {
      console.error("Failed to fetch discovery content:", error);
    } finally {
      setIsLoading(false);
    }
  }, [type, excludedIds, isLoading]);

  const handleLike = useCallback(async (item: DiscoveryItem) => {
    if (!user) return;
    
    try {
      const title = item.title || item.name || "Unknown";
      await toggleLike(item.id, title, item.poster_path);
      setExcludedIds(prev => new Set([...prev, item.id]));
      setCurrentIndex(prev => prev + 1);
    } catch (error) {
      console.error("Failed to like item:", error);
    }
  }, [user, toggleLike]);

  const handleDislike = useCallback((item: DiscoveryItem) => {
    setExcludedIds(prev => new Set([...prev, item.id]));
    setCurrentIndex(prev => prev + 1);
  }, []);

  const handleSkip = useCallback((item: DiscoveryItem) => {
    setCurrentIndex(prev => prev + 1);
  }, []);

  // Load initial content
  useEffect(() => {
    fetchMoreContent();
  }, [fetchMoreContent]);

  // Load more content when queue is running low
  useEffect(() => {
    if (queue.length - currentIndex < 3) {
      fetchMoreContent();
    }
  }, [currentIndex, queue.length, fetchMoreContent]);

  const currentItem = queue[currentIndex] || null;
  const hasMore = currentIndex < queue.length;

  return {
    currentItem,
    hasMore,
    isLoading,
    handleLike,
    handleDislike,
    handleSkip,
    remainingCount: Math.max(0, queue.length - currentIndex)
  };
};