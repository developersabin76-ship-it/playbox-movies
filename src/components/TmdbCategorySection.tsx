import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Sparkles,
  ChevronDown,
  Loader2,
  AlertCircle,
  RefreshCw,
  Flame,
  Star,
  Film,
  Calendar,
  Tv,
  Clapperboard
} from 'lucide-react';
import { TmdbItem, TmdbPaginatedResponse } from '../services/tmdbService';
import { TmdbPosterCard } from './TmdbPosterCard';
import { MovieItem, SeriesItem } from '../types';

interface TmdbCategorySectionProps {
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  fetchFunction: (page: number) => Promise<TmdbPaginatedResponse>;
  defaultType?: 'movie' | 'tv';
  onSelectTitle: (item: TmdbItem) => void;
  myMovies?: (MovieItem | SeriesItem)[];
}

export const TmdbCategorySection: React.FC<TmdbCategorySectionProps> = ({
  title,
  subtitle,
  icon: Icon = Film,
  fetchFunction,
  defaultType = 'movie',
  onSelectTitle,
  myMovies = []
}) => {
  const [items, setItems] = useState<TmdbItem[]>([]);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoadingInitial, setIsLoadingInitial] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFunctionRef = useRef(fetchFunction);
  useEffect(() => {
    fetchFunctionRef.current = fetchFunction;
  }, [fetchFunction]);

  // Initial fetch on mount or title change
  const loadInitialData = useCallback(async () => {
    setIsLoadingInitial(true);
    setError(null);
    try {
      const response = await fetchFunctionRef.current(1);
      if (response && response.results) {
        // Deduplicate initial items
        const seen = new Set<number>();
        const unique = response.results.filter((it) => {
          if (!it || !it.id) return false;
          if (seen.has(it.id)) return false;
          seen.add(it.id);
          return true;
        });
        setItems(unique);
        setPage(response.page || 1);
        setTotalPages(response.total_pages || 1);
      } else {
        setError('Unable to load movies right now. Please try again.');
      }
    } catch (err: any) {
      console.error(`[TMDB Section ${title} Error]:`, err);
      setError('Unable to load movies right now. Please try again.');
    } finally {
      setIsLoadingInitial(false);
    }
  }, [title]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Load More Next Page Handler
  const handleLoadMore = async () => {
    if (isLoadingMore || page >= totalPages) return;
    setIsLoadingMore(true);
    try {
      const nextPage = page + 1;
      const response = await fetchFunction(nextPage);
      if (response && response.results && response.results.length > 0) {
        setItems((prevItems) => {
          const existingIds = new Set(prevItems.map((i) => i.id));
          const newUnique = response.results.filter((i) => i && i.id && !existingIds.has(i.id));
          return [...prevItems, ...newUnique];
        });
        setPage(nextPage);
        setTotalPages(response.total_pages || totalPages);
      }
    } catch (err) {
      console.error(`[TMDB Section ${title} Load More Error]:`, err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const hasMore = page < totalPages;

  return (
    <section className="space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/60 pb-2.5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-red-600/10 border border-red-500/20 text-red-500">
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-white tracking-wide flex items-center gap-2">
              {title}
            </h2>
            {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
          </div>
        </div>

        {items.length > 0 && (
          <span className="text-xs font-mono text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800 self-start sm:self-auto">
            {items.length} titles loaded {totalPages > 1 ? `(Page ${page}/${totalPages})` : ''}
          </span>
        )}
      </div>

      {/* Initial Loading Skeleton */}
      {isLoadingInitial && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="rounded-2xl bg-[#0c1322] border border-slate-800/60 p-3 space-y-3 animate-pulse"
            >
              <div className="aspect-[2/3] w-full rounded-xl bg-slate-800/60" />
              <div className="h-3.5 w-3/4 rounded bg-slate-800/80" />
              <div className="h-2.5 w-1/2 rounded bg-slate-800/40" />
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && !isLoadingInitial && (
        <div className="p-6 rounded-2xl bg-red-950/20 border border-red-900/40 text-center space-y-3">
          <div className="flex items-center justify-center gap-2 text-red-400 text-sm font-bold">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
          <button
            onClick={loadInitialData}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry Loading {title}
          </button>
        </div>
      )}

      {/* Movie Posters Grid */}
      {!isLoadingInitial && !error && items.length > 0 && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
            {items.map((item) => (
              <TmdbPosterCard
                key={item.id}
                item={item}
                defaultType={defaultType}
                onClick={onSelectTitle}
                myMovies={myMovies}
              />
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="flex justify-center pt-2 pb-4">
              <button
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="group px-6 py-3 rounded-2xl bg-[#0e1628] hover:bg-red-600/90 text-slate-200 hover:text-white border border-slate-700/80 hover:border-red-500 font-black text-xs transition-all shadow-lg hover:shadow-red-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-red-400 group-hover:text-white" />
                    <span>Fetching Next Page from TMDB...</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                    <span>LOAD MORE {title.toUpperCase()}</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
