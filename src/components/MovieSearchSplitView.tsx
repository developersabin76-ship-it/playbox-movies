import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Cast,
  Radio,
  Film,
  Layers,
  Star,
  Bookmark,
  Check,
  Download,
  Mic2,
  MessageCircle,
  Share2,
  Sparkles,
  Info,
  Tv,
  CheckCircle2,
  Clock,
  History,
  X,
  Trash2,
  Loader2,
  Database,
  Trophy
} from 'lucide-react';
import { MovieItem, SeriesItem, TVChannelItem, UserProfile } from '../types';
import { VideoPlayer } from './VideoPlayer';
import { CommunityChatModal } from './CommunityChatModal';
import { RWANDAN_RADIO_STATIONS } from './FMRadioPage';
import { searchApiStoreMovies } from '../services/apiStoreSearchService';
import { fetchLiveFootballMatches, FootballMatchItem } from '../services/footballService';

interface MovieSearchSplitViewProps {
  movies: MovieItem[];
  series: SeriesItem[];
  channels: TVChannelItem[];
  user: UserProfile;
  initialQuery?: string;
  initialCategory?: string;
  onSelectMovie?: (movie: MovieItem) => void;
  onSelectSeries?: (series: SeriesItem, seasonNumber?: number, episodeNumber?: number) => void;
  onSelectChannel?: (channel: TVChannelItem) => void;
  onOpenSubscribe?: () => void;
  onToggleWatchlist: (id: string) => void;
  onOpenMovieDetails?: (item: MovieItem | SeriesItem) => void;
}

type FilterCategory = 'All' | 'Imikino & Sports' | 'Movies' | 'TV Series' | 'Trending' | 'Rwandan Channels' | 'FM Radio';

interface UnifiedStreamItem {
  id: string;
  type: 'movie' | 'series' | 'channel' | 'radio' | 'match';
  title: string;
  subtitle: string;
  posterUrl: string;
  videoUrl: string;
  director?: string;
  genres?: string[];
  rating?: number;
  year?: number;
  rawItem: any;
}

const RECENT_SEARCHES_STORAGE_KEY = 'mediacore_recent_searches';
const MAX_RECENT_SEARCHES = 8;

export const MovieSearchSplitView: React.FC<MovieSearchSplitViewProps> = ({
  movies = [],
  series = [],
  channels = [],
  user,
  initialQuery = '',
  initialCategory = 'Movies',
  onSelectMovie,
  onSelectSeries,
  onSelectChannel,
  onOpenSubscribe,
  onToggleWatchlist,
  onOpenMovieDetails
}) => {
  // Search query & Category filter state - default to Movies
  const [searchQuery, setSearchQuery] = useState<string>(initialQuery);
  const [activeCategory, setActiveCategory] = useState<FilterCategory>(
    (initialCategory as FilterCategory) || 'Movies'
  );

  // Recent Searches state persisted locally in localStorage for faster access
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(RECENT_SEARCHES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed
            .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
            .slice(0, MAX_RECENT_SEARCHES);
        }
      }
    } catch (err) {
      console.error('Failed to load recent searches from localStorage:', err);
    }
    return [];
  });

  // Save query to localStorage history (deduplicated, newest first, max items)
  const saveRecentSearch = (rawQuery: string) => {
    const trimmed = rawQuery.trim();
    if (!trimmed || trimmed.length < 2) return;

    setRecentSearches((prev) => {
      const filtered = prev.filter((item) => item.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, MAX_RECENT_SEARCHES);
      try {
        localStorage.setItem(RECENT_SEARCHES_STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to persist recent searches:', err);
      }
      return updated;
    });
  };

  // Remove individual search query from history
  const handleRemoveRecentSearch = (queryToRemove: string) => {
    setRecentSearches((prev) => {
      const updated = prev.filter((item) => item !== queryToRemove);
      try {
        localStorage.setItem(RECENT_SEARCHES_STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to update recent searches in localStorage:', err);
      }
      return updated;
    });
  };

  // Clear all recent searches
  const handleClearAllRecentSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_STORAGE_KEY);
    } catch (err) {
      console.error('Failed to clear recent searches:', err);
    }
  };

  // Select a recent search query for instant filter
  const handleSelectRecentSearch = (term: string) => {
    setSearchQuery(term);
    saveRecentSearch(term);
  };

  // Debounced auto-save when user pauses typing a search query
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) return;
    const timer = setTimeout(() => {
      saveRecentSearch(searchQuery);
    }, 1200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Selected Active Item to stream in the Left Player - defaults to newest movie
  const [selectedItem, setSelectedItem] = useState<UnifiedStreamItem>(() => {
    // 1. Default to newest movie first
    const sortedMovies = [...movies].sort((a, b) => (b.year || 0) - (a.year || 0));
    const firstMov = sortedMovies[0];
    if (firstMov) {
      return {
        id: firstMov.id,
        type: 'movie',
        title: `${firstMov.title} (1080p)`,
        subtitle: `Agasobanuye • ${firstMov.director || 'Junior Giti'} • ${firstMov.year || 2026}`,
        posterUrl: firstMov.posterUrl || '',
        videoUrl: firstMov.videoUrl || '',
        director: firstMov.director,
        genres: firstMov.genres,
        rating: firstMov.rating || 9.6,
        year: firstMov.year,
        rawItem: firstMov
      };
    }
    const firstChan = channels[0];
    if (firstChan) {
      return {
        id: firstChan.id,
        type: 'channel',
        title: `${firstChan.name} (720p HD)`,
        subtitle: `Live stream from ${firstChan.name}.`,
        posterUrl: firstChan.logo || firstChan.logoUrl,
        videoUrl: firstChan.streamUrl,
        rawItem: firstChan
      };
    }
    return {
      id: 'sample',
      type: 'movie',
      title: 'Agasobanuye Cinema HD',
      subtitle: 'Agasobanuye • Junior Giti',
      posterUrl: '',
      videoUrl: '',
      rawItem: null
    };
  });

  // Floating Chat Modal state
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Filter Categories - Imikino & Sports prominent
  const filterPills: FilterCategory[] = [
    'All',
    'Imikino & Sports',
    'Movies',
    'TV Series',
    'Trending',
    'Rwandan Channels',
    'FM Radio'
  ];

  // RapidAPI Live Football Matches State
  const [apiMatches, setApiMatches] = useState<FootballMatchItem[]>([]);

  useEffect(() => {
    let isMounted = true;
    fetchLiveFootballMatches()
      .then((res) => {
        if (!isMounted) return;
        if (res.matches && res.matches.length > 0) {
          setApiMatches(res.matches);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  // API Store Search State (Searches real TMDB API store, Firestore, and backend database)
  const [apiStoreMovies, setApiStoreMovies] = useState<MovieItem[]>([]);
  const [isSearchingApiStore, setIsSearchingApiStore] = useState<boolean>(false);
  const [apiStoreTotalFound, setApiStoreTotalFound] = useState<number>(0);

  // Debounced API Store Query for real-time live catalogue search
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setApiStoreMovies((prev) => (prev.length === 0 ? prev : []));
      setApiStoreTotalFound((prev) => (prev === 0 ? 0 : prev));
      setIsSearchingApiStore((prev) => (prev ? false : prev));
      return;
    }

    let isMounted = true;
    setIsSearchingApiStore((prev) => (prev ? prev : true));

    const debounceTimer = setTimeout(async () => {
      try {
        const res = await searchApiStoreMovies(q, movies);
        if (isMounted) {
          setApiStoreMovies(res.movies);
          setApiStoreTotalFound(res.totalFound);
          setIsSearchingApiStore(false);
        }
      } catch {
        if (isMounted) {
          setIsSearchingApiStore(false);
        }
      }
    }, 280);

    return () => {
      isMounted = false;
      clearTimeout(debounceTimer);
    };
  }, [searchQuery, movies]);

  // Combined Search and Filter list with NEWEST FILMS FIRST ON TOP
  const filteredList = useMemo<UnifiedStreamItem[]>(() => {
    const q = searchQuery.toLowerCase().trim();

    // Use API Store search results whenever searching a query
    const effectiveMovieList = q.length >= 2 && apiStoreMovies.length > 0 ? apiStoreMovies : movies;

    // 1. Rwandan Channels
    const chanList: UnifiedStreamItem[] = channels.map((c) => ({
      id: c.id,
      type: 'channel',
      title: `${c.name} (${c.category === 'Rwandan TV' ? 'HD' : '480p'})`,
      subtitle: `Live stream from ${c.name} (${c.country}).`,
      posterUrl: c.logo || c.logoUrl,
      videoUrl: c.streamUrl,
      director: c.category,
      genres: [c.category],
      rating: 9.8,
      rawItem: c
    }));

    // 2. Movies (Agasobanuye & API Store) - sorted newest first
    const movList: UnifiedStreamItem[] = [...effectiveMovieList]
      .sort((a, b) => (b.year || 0) - (a.year || 0))
      .map((m) => ({
        id: m.id,
        type: 'movie',
        title: `${m.title} (1080p)`,
        subtitle: (m as any).isApiStore
          ? `Agasobanuye Cinema • TMDB API Store • ${m.year || 2026}`
          : `Agasobanuye • ${m.director || 'Junior Giti'} • ${m.year || 2026}`,
        posterUrl: m.posterUrl,
        videoUrl: m.videoUrl,
        director: m.director,
        genres: m.genres,
        rating: m.rating || 9.6,
        year: m.year,
        rawItem: m
      }));

    // 3. Series
    const serList: UnifiedStreamItem[] = [...series]
      .sort((a, b) => (b.year || 0) - (a.year || 0))
      .map((s) => ({
        id: s.id,
        type: 'series',
        title: `${s.title} (${s.seasons?.length || 1}S HD)`,
        subtitle: `Series • ${s.director || 'Sankara'} • ${s.year || 2025}`,
        posterUrl: s.posterUrl,
        videoUrl: s.seasons?.[0]?.episodes?.[0]?.videoUrl || s.trailerUrl || '',
        director: s.director,
        genres: s.genres,
        rating: s.rating || 9.7,
        year: s.year,
        rawItem: s
      }));

    // 4. Radio FM
    const radioList: UnifiedStreamItem[] = RWANDAN_RADIO_STATIONS.map((r) => ({
      id: r.id,
      type: 'radio',
      title: `${r.name} (${r.frequency})`,
      subtitle: `Live Radio broadcast • ${r.genre}`,
      posterUrl: r.logo,
      videoUrl: r.streamUrl,
      director: r.frequency,
      genres: [r.genre],
      rating: 9.9,
      rawItem: r
    }));

    // 5. RapidAPI Live Football Matches
    const matchList: UnifiedStreamItem[] = apiMatches.map((m) => {
      const scoreStr = m.home?.score !== undefined && m.away?.score !== undefined
        ? `(${m.home.score} - ${m.away.score})`
        : 'VS';
      return {
        id: `match_${m.id}`,
        type: 'match' as const,
        title: `${m.home?.name || 'Home'} vs ${m.away?.name || 'Away'} ${scoreStr}`,
        subtitle: `${m.leagueName || 'Champions League'} • ${m.status === 'LIVE' ? `LIVE ${m.minute || ''}` : m.time} • Football Match`,
        posterUrl: m.home?.logo || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=120&q=80',
        videoUrl: m.streamUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        director: m.leagueName || 'Football League',
        genres: ['Football', 'Sports', 'Imikino', 'Match', m.leagueName || 'League'],
        rating: 9.9,
        year: 2026,
        rawItem: m
      };
    });

    let all: UnifiedStreamItem[] = [];

    if (activeCategory === 'Imikino & Sports') {
      all = matchList;
    } else if (activeCategory === 'Movies') {
      all = movList;
    } else if (activeCategory === 'All') {
      all = [...matchList, ...movList, ...serList, ...chanList, ...radioList];
    } else if (activeCategory === 'TV Series') {
      all = serList;
    } else if (activeCategory === 'Trending') {
      all = [...matchList.slice(0, 4), ...movList.filter((m) => (m.rawItem as MovieItem)?.isFeatured), ...chanList.slice(0, 4)];
    } else if (activeCategory === 'Rwandan Channels') {
      all = chanList;
    } else if (activeCategory === 'FM Radio') {
      all = radioList;
    } else {
      all = movList;
    }

    const isSportsQuery = ['imikino', 'sport', 'sports', 'football', 'umupira', 'match', 'matches', 'league', 'score', 'live', 'premier', 'ucl', 'champions'].some((kw) => q.includes(kw));

    // Filter matching query
    let matched = !q
      ? all
      : all.filter(
          (item) =>
            item.title.toLowerCase().includes(q) ||
            item.subtitle.toLowerCase().includes(q) ||
            item.director?.toLowerCase().includes(q) ||
            String(item.year || '').includes(q) ||
            item.genres?.some((g) => g.toLowerCase().includes(q))
        );

    // If searching specifically for sports or football, ensure live matches are surfaced even if in another category
    if (q && (isSportsQuery || matchList.some((m) => m.title.toLowerCase().includes(q) || m.subtitle.toLowerCase().includes(q)))) {
      const extraMatches = matchList.filter((m) =>
        isSportsQuery || m.title.toLowerCase().includes(q) || m.subtitle.toLowerCase().includes(q)
      );
      const existingIds = new Set(matched.map((i) => i.id));
      const freshMatches = extraMatches.filter((m) => !existingIds.has(m.id));
      matched = [...freshMatches, ...matched];
    }

    // CRITICAL REQUIREMENT: "if i search film i must see it quickly and new films must come on uper place or on top"
    return [...matched].sort((a, b) => {
      if (q) {
        const aStarts = a.title.toLowerCase().startsWith(q);
        const bStarts = b.title.toLowerCase().startsWith(q);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
      }

      // Live matches come top if sports query
      if (isSportsQuery) {
        if (a.type === 'match' && b.type !== 'match') return -1;
        if (a.type !== 'match' && b.type === 'match') return 1;
      }

      // Newest films on upper place / top! (e.g. 2026, 2025, 2024...)
      const yearA = a.year || 0;
      const yearB = b.year || 0;
      if (yearB !== yearA) return yearB - yearA;

      return (b.rating || 0) - (a.rating || 0);
    });
  }, [channels, movies, series, searchQuery, activeCategory, apiMatches]);

  const handleSelectItem = (item: typeof filteredList[0]) => {
    setSelectedItem(item);
    if (searchQuery.trim().length >= 2) {
      saveRecentSearch(searchQuery);
    }
  };

  const isInWatchlist = user.watchlist?.includes(selectedItem.id);

  return (
    <div className="relative min-h-[calc(100vh-80px)] w-full bg-[#060a12] text-slate-100 p-3 sm:p-5 lg:p-6 select-none">
      
      {/* =========================================================================
          EXACT SPLIT LAYOUT COPY-PASTE FROM PHOTO
          LEFT: BIG VIDEO PLAYER + CONTROLS
          RIGHT: SEARCH INPUT + FILTER PILLS + VERTICAL ITEMS LIST
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 max-w-[1700px] mx-auto items-start">
        
        {/* ==========================================
            LEFT COLUMN (Cols 1-8): CINEMATIC PLAYER
            ========================================== */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          
          {/* Main Video Viewport Card */}
          <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden bg-black aspect-video border border-slate-800 shadow-2xl group flex flex-col justify-end">
            <VideoPlayer
              key={selectedItem.id + selectedItem.videoUrl}
              streamUrl={selectedItem.videoUrl}
              title={selectedItem.title}
              subtitle={selectedItem.subtitle}
              poster={selectedItem.posterUrl}
              autoPlay={true}
            />

            {/* Red Custom Stream Bar on Bottom Border */}
            <div className="w-full h-1 bg-slate-900 absolute bottom-0 left-0 right-0 z-20">
              <div className="h-full bg-red-600 w-full animate-pulse shadow-[0_0_8px_#ef4444]" />
            </div>
          </div>

          {/* Player Metadata & Action Strip */}
          <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-[#0b1220] border border-slate-800/80 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {selectedItem.type === 'channel' && (
                  <span className="px-2.5 py-0.5 rounded-full bg-red-600 text-white font-black text-[10px] uppercase tracking-wider animate-pulse flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" /> LIVE BROADCAST
                  </span>
                )}
                {selectedItem.type === 'movie' && (
                  <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-black text-[10px] uppercase shadow-[0_0_10px_rgba(0,229,255,0.3)]">
                    AGASOBANUYE FILM • 1080p HD
                  </span>
                )}
                {selectedItem.type === 'series' && (
                  <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-black text-[10px] uppercase">
                    TV SERIES SEASON
                  </span>
                )}
                {selectedItem.type === 'match' && (
                  <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-black text-[10px] uppercase shadow-[0_0_12px_rgba(0,240,255,0.4)] animate-pulse flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#00f0ff]" />
                    LIVE FOOTBALL MATCH • RAPIDAPI LIVE
                  </span>
                )}
                {selectedItem.type === 'radio' && (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-black text-[10px] uppercase">
                    RADIO FM LIVE
                  </span>
                )}

                {selectedItem.director && (
                  <span className="px-2.5 py-0.5 rounded-md bg-slate-900 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1">
                    <Mic2 className="w-3 h-3 text-amber-400" />
                    {selectedItem.director}
                  </span>
                )}

                <span className="flex items-center gap-1 text-amber-400 font-bold text-xs bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  <Star className="w-3 h-3 fill-amber-400" /> {selectedItem.rating || 9.8}
                </span>
              </div>

              <h2 className="text-lg sm:text-xl font-black text-white truncate">
                {selectedItem.title}
              </h2>
              <p className="text-xs text-slate-400 truncate">
                {selectedItem.subtitle}
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              {selectedItem.type === 'movie' && onSelectMovie && selectedItem.rawItem && (
                <button
                  onClick={() => onSelectMovie(selectedItem.rawItem)}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-500 text-white text-xs font-black shadow-md hover:scale-105 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-white" /> Kina Muri Cinema
                </button>
              )}

              <button
                onClick={() => onToggleWatchlist(selectedItem.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
                  isInWatchlist
                    ? 'bg-red-600 text-white border-red-500 shadow-md shadow-red-950'
                    : 'bg-slate-900 text-slate-300 hover:text-white border-slate-800 hover:bg-slate-800'
                }`}
              >
                {isInWatchlist ? <Check className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                <span>{isInWatchlist ? 'Saved' : '+ Watchlist'}</span>
              </button>

              {onOpenSubscribe && (
                <button
                  onClick={onOpenSubscribe}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white text-xs font-black shadow-md hover:scale-105 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" /> VIP Pass
                </button>
              )}

              {onOpenMovieDetails && selectedItem.rawItem && (
                <button
                  onClick={() => onOpenMovieDetails(selectedItem.rawItem)}
                  className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="View full details"
                >
                  <Info className="w-4 h-4" />
                </button>
              )}
            </div>

          </div>

        </div>

        {/* ==========================================
            RIGHT COLUMN (Cols 9-12): SEARCH & PLAYLIST
            ========================================== */}
        <div className="lg:col-span-4 flex flex-col gap-3.5 bg-[#090f1a] border border-slate-800/80 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-2xl relative">
          
          {/* 1. Top Search Bar with quick clear & enter key submit */}
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search for channels, movies, series, radio..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (searchQuery.trim().length >= 2) {
                    saveRecentSearch(searchQuery);
                  }
                }
              }}
              className="w-full pl-9 pr-9 py-3 rounded-2xl bg-[#060a12] border border-slate-800 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500 shadow-inner transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Clear search input"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* API STORE Live Status Indicator */}
          {isSearchingApiStore && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-950/40 border border-red-500/40 text-xs text-red-300">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-red-400 shrink-0" />
              <span className="font-semibold truncate">Searching API Store (TMDB & Database)...</span>
            </div>
          )}

          {!isSearchingApiStore && searchQuery.trim().length >= 2 && apiStoreTotalFound > 0 && (
            <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-900/80 border border-amber-500/30 text-xs">
              <span className="flex items-center gap-1.5 text-amber-300 font-bold truncate">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>API STORE: <span className="text-white font-black">{apiStoreTotalFound}</span> films found</span>
              </span>
              <span className="text-[10px] text-cyan-400 font-bold px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 shrink-0">
                LIVE
              </span>
            </div>
          )}

          {/* Recent Searches (Persisted locally in localStorage for faster access) */}
          {recentSearches.length > 0 && (
            <div className="flex flex-col gap-1.5 px-0.5 pt-0.5">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5 font-medium text-slate-300">
                  <History className="w-3.5 h-3.5 text-red-500" />
                  <span>Recent Searches</span>
                  <span className="text-[10px] text-slate-500 font-normal">({recentSearches.length})</span>
                </div>
                <button
                  type="button"
                  onClick={handleClearAllRecentSearches}
                  className="text-[10px] text-slate-500 hover:text-red-400 flex items-center gap-1 transition-colors cursor-pointer"
                  title="Clear search history"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear all</span>
                </button>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {recentSearches.map((term) => {
                  const isCurrent = searchQuery.trim().toLowerCase() === term.toLowerCase();
                  return (
                    <div
                      key={term}
                      onClick={() => handleSelectRecentSearch(term)}
                      className={`group inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-xl text-xs font-medium transition-all cursor-pointer border ${
                        isCurrent
                          ? 'bg-red-950/70 border-red-500/80 text-white shadow-sm shadow-red-950'
                          : 'bg-[#0f1728] hover:bg-[#16233b] border-slate-800/90 hover:border-slate-700 text-slate-300 hover:text-white'
                      }`}
                      title={`Search "${term}"`}
                    >
                      <Clock
                        className={`w-3 h-3 shrink-0 ${
                          isCurrent ? 'text-red-400' : 'text-slate-500 group-hover:text-red-400'
                        } transition-colors`}
                      />
                      <span className="truncate max-w-[120px] sm:max-w-[150px]">{term}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveRecentSearch(term);
                        }}
                        className="p-1 rounded-full text-slate-500 hover:text-red-400 hover:bg-white/10 transition-colors ml-0.5 cursor-pointer"
                        title={`Remove "${term}" from history`}
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. Filter Pills Bar (Active Red Pill as seen in photo) */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {filterPills.map((pill) => {
              const isActive = activeCategory === pill;
              return (
                <button
                  key={pill}
                  onClick={() => setActiveCategory(pill)}
                  className={`px-4 py-2 rounded-full text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-red-600 text-white shadow-lg shadow-red-600/40 border border-red-500 scale-102'
                      : 'bg-[#121c2e] text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  {pill}
                </button>
              );
            })}
          </div>

          {/* 3. Vertical Items List matching the photo */}
          <div className="space-y-2.5 max-h-[520px] lg:max-h-[640px] overflow-y-auto pr-1 no-scrollbar">
            {filteredList.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                Nta filime cyangwa televiziyo yabonetse kuri iyi nzira.
              </div>
            ) : (
              filteredList.map((item) => {
                const isCurrent = item.id === selectedItem.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelectItem(item)}
                    className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 group relative ${
                      isCurrent
                        ? 'bg-gradient-to-r from-red-950/50 to-slate-900 border-red-500/70 shadow-lg shadow-red-950/40'
                        : 'bg-[#0a1120] border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/90'
                    }`}
                  >
                    {/* Rounded Square Logo / Poster */}
                    <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center shrink-0">
                      <img
                        src={item.posterUrl}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      {isCurrent && (
                        <div className="absolute inset-0 bg-red-600/30 flex items-center justify-center">
                          <Play className="w-4 h-4 fill-white text-white" />
                        </div>
                      )}
                    </div>

                    {/* Text Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1.5">
                        <h4 className={`text-xs sm:text-sm font-black truncate ${
                          isCurrent ? 'text-white' : 'text-slate-200 group-hover:text-red-400'
                        }`}>
                          {item.title}
                        </h4>
                        {item.type === 'match' ? (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black shrink-0 bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 animate-pulse">
                            ⚽ LIVE MATCH
                          </span>
                        ) : item.year ? (
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-black shrink-0 ${
                            item.year >= 2025
                              ? 'bg-cyan-500 text-slate-950 font-black shadow-sm'
                              : 'bg-slate-800 text-amber-300'
                          }`}>
                            {item.year >= 2025 ? `🔥 ${item.year}` : item.year}
                          </span>
                        ) : null}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {item.subtitle}
                      </p>
                    </div>

                    {/* Active playing indicator badge */}
                    {isCurrent && (
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping shrink-0 mr-1" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* 4. Floating Chat Bubble Button in Bottom Right */}
          <button
            onClick={() => setIsChatOpen(true)}
            className="absolute -bottom-4 right-4 sm:-bottom-5 sm:right-6 w-12 h-12 rounded-full bg-[#081224] hover:bg-slate-900 border-2 border-cyan-500/50 hover:border-cyan-400 text-white flex items-center justify-center shadow-2xl shadow-cyan-950/60 hover:scale-110 active:scale-95 transition-all cursor-pointer z-30"
            title="Open Live Chat Room"
          >
            <MessageCircle className="w-5 h-5 text-cyan-300" />
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-cyan-400 rounded-full border-2 border-slate-950 shadow-[0_0_8px_#00f0ff]" />
          </button>

        </div>

      </div>

      {/* Community Live Chat Drawer / Modal */}
      <CommunityChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        user={user}
        currentTitle={selectedItem.title}
      />

    </div>
  );
};

export const SearchSplitView = MovieSearchSplitView;

