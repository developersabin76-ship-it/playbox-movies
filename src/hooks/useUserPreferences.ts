import { useState, useEffect, useCallback } from 'react';

export interface LastWatchedItem {
  type: 'channel' | 'movie';
  id: string;
  nameOrTitle: string;
  logoOrPoster: string;
  streamOrEmbedUrl: string;
  category?: string;
  timestamp: number;
}

const STORAGE_KEYS = {
  LAST_WATCHED: 'lionel_last_watched',
  FAVORITES: 'lionel_user_favorites',
  PROGRESS: 'lionel_watch_progress_map'
};

export function useUserPreferences() {
  const [lastWatched, setLastWatched] = useState<LastWatchedItem | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.LAST_WATCHED);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.FAVORITES);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [watchProgress, setWatchProgress] = useState<Record<string, number>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PROGRESS);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Save Last Watched Item
  const saveLastWatched = useCallback((item: Omit<LastWatchedItem, 'timestamp'>) => {
    const fullItem: LastWatchedItem = {
      ...item,
      timestamp: Date.now()
    };
    setLastWatched(fullItem);
    try {
      localStorage.setItem(STORAGE_KEYS.LAST_WATCHED, JSON.stringify(fullItem));
    } catch (err) {
      console.warn("Unable to save last watched state to localStorage:", err);
    }
  }, []);

  // Toggle Favorite Item ID
  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      try {
        localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(next));
      } catch (err) {
        console.warn("Unable to save favorites to localStorage:", err);
      }
      return next;
    });
  }, []);

  const isFavorite = useCallback(
    (id: string) => {
      return favorites.includes(id);
    },
    [favorites]
  );

  // Update Watch Progress (0 - 100%)
  const updateWatchProgress = useCallback((id: string, progressPercentage: number) => {
    setWatchProgress((prev) => {
      const next = { ...prev, [id]: Math.min(100, Math.max(0, progressPercentage)) };
      try {
        localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(next));
      } catch (err) {
        console.warn("Unable to save watch progress to localStorage:", err);
      }
      return next;
    });
  }, []);

  const getWatchProgress = useCallback(
    (id: string) => {
      return watchProgress[id] || 0;
    },
    [watchProgress]
  );

  return {
    lastWatched,
    saveLastWatched,
    favorites,
    toggleFavorite,
    isFavorite,
    watchProgress,
    updateWatchProgress,
    getWatchProgress
  };
}
