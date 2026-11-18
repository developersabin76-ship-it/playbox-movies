import React, { useState, useEffect, useMemo } from 'react';
import {
  Play,
  Bookmark,
  Check,
  Star,
  Info,
  Clock,
  Radio,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Tv,
  Film,
  Layers,
  RotateCcw,
  Download,
  Mic2,
  Filter,
  Flame,
  Search,
  CheckCircle,
  PlayCircle,
  Calendar,
  TrendingUp,
  Clapperboard,
  X,
  SlidersHorizontal,
  Zap,
  Loader2,
  Trophy
} from 'lucide-react';
import { MovieItem, SeriesItem, TVChannelItem, WatchHistoryEntry, UserProfile } from '../types';
import { searchApiStoreMovies } from '../services/apiStoreSearchService';
import { SAMPLE_LIVE_MATCHES, LiveMatchItem } from './LiveMatchesPage';
import { fetchLiveFootballMatches } from '../services/footballService';
import {
  TmdbItem,
  fetchTrendingMovies,
  fetchPopularMovies,
  fetchTopRatedMovies,
  fetchNowPlayingMovies,
  fetchUpcomingMovies,
  fetchPopularTvShows
} from '../services/tmdbService';
import { TmdbCategorySection } from './TmdbCategorySection';
import { TmdbDetailsModal } from './TmdbDetailsModal';
import { HeroSplitShowcase } from './HeroSplitShowcase';

interface HomeStreamingViewProps {
  // Support both prop naming conventions for seamless compatibility
  movies?: MovieItem[];
  series?: SeriesItem[];
  channels?: TVChannelItem[];
  allMovies?: MovieItem[];
  allSeries?: SeriesItem[];
  liveChannels?: TVChannelItem[];
  featuredMovies?: MovieItem[];
  featuredSeries?: SeriesItem[];
  watchHistory?: WatchHistoryEntry[];
  user: UserProfile;
  onSelectMovie: (movie: MovieItem) => void;
  onSelectSeries: (series: SeriesItem, seasonNumber?: number, episodeNumber?: number) => void;
  onSelectChannel: (channel: TVChannelItem) => void;
  onOpenMovieDetails?: (item: MovieItem | SeriesItem) => void;
  onOpenSubscribe?: () => void;
  onOpenSearch?: () => void;
  onToggleWatchlist: (id: string) => void;
  onViewAllMovies?: () => void;
  onViewAllSeries?: () => void;
  onViewAllChannels?: () => void;
  onQuickPreview?: (item: MovieItem | SeriesItem) => void;
  onOpenMatches?: () => void;
  onOpenRequestModal?: () => void;
}

export const HomeStreamingView: React.FC<HomeStreamingViewProps> = ({
  movies: propMovies = [],
  series: propSeries = [],
  channels: propChannels = [],
  allMovies = [],
  allSeries = [],
  liveChannels = [],
  featuredMovies = [],
  featuredSeries = [],
  watchHistory = [],
  user,
  onSelectMovie,
  onSelectSeries,
  onSelectChannel,
  onOpenMovieDetails,
  onOpenSubscribe,
  onOpenSearch,
  onToggleWatchlist,
  onViewAllMovies,
  onViewAllSeries,
  onViewAllChannels,
  onQuickPreview,
  onOpenMatches,
  onOpenRequestModal
}) => {
  // Dedicated Movie Search Bar state in Home Tab
  const [homeMovieSearch, setHomeMovieSearch] = useState<string>('');

  // API Store Search State (TMDB Catalog, Database, Firestore)
  const [apiSearchedMovies, setApiSearchedMovies] = useState<MovieItem[]>([]);
  const [isSearchingApiStore, setIsSearchingApiStore] = useState<boolean>(false);
  const [apiStoreTotalFound, setApiStoreTotalFound] = useState<number>(0);

  // Live Football Matches State (from RapidAPI Football)
  const [apiMatches, setApiMatches] = useState<LiveMatchItem[]>(SAMPLE_LIVE_MATCHES);

  useEffect(() => {
    let isMounted = true;
    fetchLiveFootballMatches()
      .then((res) => {
        if (!isMounted) return;
        if (res.matches && res.matches.length > 0) {
          const mapped: LiveMatchItem[] = res.matches.map((m) => ({
            id: String(m.id),
            tournament: m.leagueName || 'Champions League',
            homeTeam: m.home?.name || 'Home Team',
            awayTeam: m.away?.name || 'Away Team',
            homeLogo: m.home?.logo || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=120&q=80',
            awayLogo: m.away?.logo || 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=120&q=80',
            homeScore: m.home?.score,
            awayScore: m.away?.score,
            time: m.time || 'Live',
            status: m.status || 'LIVE',
            minute: m.minute,
            streamUrl: m.streamUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            commentaryLanguage: m.commentaryLanguage || 'Kinyarwanda & English',
            serverCount: 4
          }));
          setApiMatches(mapped);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  // Consolidate movies with NEWEST FILMS FIRST on top
  const movies = useMemo(() => {
    const list = allMovies.length > 0 ? allMovies : propMovies;
    // CRITICAL: Sort by release year descending so newest films are on upper place / on top
    return [...list].sort((a, b) => (b.year || 0) - (a.year || 0));
  }, [allMovies, propMovies]);

  // Debounced API Store Query for real-time live catalogue search in Home Tab
  useEffect(() => {
    const q = homeMovieSearch.trim();
    if (q.length < 2) {
      setApiSearchedMovies((prev) => (prev.length === 0 ? prev : []));
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
          setApiSearchedMovies(res.movies);
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
  }, [homeMovieSearch, movies]);

  // Fast reactive movie search in Home Tab with NEW FILMS ON TOP (From API Store & Library)
  const homeSearchedMovies = useMemo(() => {
    const q = homeMovieSearch.toLowerCase().trim();
    if (!q) return [];

    // Prioritize API Store search results whenever searching a query
    if (q.length >= 2 && apiSearchedMovies.length > 0) {
      return apiSearchedMovies;
    }

    const matches = movies.filter((m) => {
      const titleMatch = m.title.toLowerCase().includes(q) || (m.originalTitle || '').toLowerCase().includes(q);
      const directorMatch = (m.director || '').toLowerCase().includes(q) || ((m as any).umusobanuzi || '').toLowerCase().includes(q);
      const genreMatch = (m.genres || []).some((g) => g.toLowerCase().includes(q));
      const yearMatch = String(m.year || '').includes(q);
      const descMatch = (m.description || '').toLowerCase().includes(q);
      return titleMatch || directorMatch || genreMatch || yearMatch || descMatch;
    });

    // CRITICAL REQUIREMENT: "if i search film i must see it quickly and new films must come on uper place or on top"
    return [...matches].sort((a, b) => {
      // 1. Direct title start gets first priority
      const aStarts = a.title.toLowerCase().startsWith(q);
      const bStarts = b.title.toLowerCase().startsWith(q);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;

      // 2. Newest films come on upper place / top! (higher release year first: 2026, 2025, 2024...)
      const yearDiff = (b.year || 0) - (a.year || 0);
      if (yearDiff !== 0) return yearDiff;

      // 3. Fallback to rating
      return (b.rating || 0) - (a.rating || 0);
    });
  }, [movies, homeMovieSearch, apiSearchedMovies]);

  // Matching Football Matches when searching "imikino", "sports", "football", or team names
  const searchedFootballMatches = useMemo(() => {
    const q = homeMovieSearch.toLowerCase().trim();
    if (!q) return [];
    const isSportsKeyword = ['imikino', 'sport', 'sports', 'football', 'umupira', 'match', 'matches', 'league', 'score', 'live', 'premier', 'ucl', 'champions'].some((kw) => q.includes(kw));

    return apiMatches.filter((m) => {
      if (isSportsKeyword) return true;
      return m.homeTeam.toLowerCase().includes(q) ||
             m.awayTeam.toLowerCase().includes(q) ||
             m.tournament.toLowerCase().includes(q);
    });
  }, [homeMovieSearch, apiMatches]);

  const series = useMemo(() => {
    const list = allSeries.length > 0 ? allSeries : propSeries;
    return [...list].sort((a, b) => (b.year || 0) - (a.year || 0));
  }, [allSeries, propSeries]);

  const channels = useMemo(() => {
    return liveChannels.length > 0 ? liveChannels : propChannels;
  }, [liveChannels, propChannels]);

  // Active filter for RebaMovie VJ / Translator / Genre Pills
  const [activeFilter, setActiveFilter] = useState<string>('ALL');

  // Selected TMDB Title for details modal
  const [selectedTmdbItem, setSelectedTmdbItem] = useState<TmdbItem | null>(null);

  // VJ / Translator list for RebaMovie Pills
  const filterPills = [
    { id: 'ALL', label: '🔥 All Agasobanuye', icon: Flame },
    { id: 'Junior Giti', label: '🎙️ Junior Giti', icon: Mic2 },
    { id: 'Sankara', label: '🎙️ Sankara', icon: Mic2 },
    { id: 'Rocky Kirabiranya', label: '🎙️ Rocky Kirabiranya', icon: Mic2 },
    { id: 'Gaheza', label: '🎙️ Gaheza', icon: Mic2 },
    { id: 'Savimbi', label: '🎙️ Savimbi', icon: Mic2 },
    { id: 'VJ Junior', label: '🎙️ VJ Junior', icon: Mic2 },
    { id: 'VJ Emmy', label: '🎙️ VJ Emmy', icon: Mic2 },
    { id: 'VJ Neil', label: '🎙️ VJ Neil', icon: Mic2 },
    { id: 'Action', label: '💥 Action Hits', icon: Film },
    { id: 'Sci-Fi', label: '🚀 Sci-Fi & Magic', icon: Sparkles },
    { id: 'Drama', label: '🎭 Drama & Love', icon: Film },
    { id: 'Horror', label: '👻 Horror & Mystery', icon: Film },
    { id: 'Comedy', label: '😂 Comedy', icon: Sparkles },
    { id: 'SERIES', label: '📺 Series Seasons', icon: Layers }
  ];

  // Abasobanuzi (Translators) showcase profiles matching agasobanuyefree
  const ABASOBANUZI_PROFILES = [
    { id: 'ALL', name: 'Bose', role: 'Abasobanuzi Bose', count: '1000+', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80' },
    { id: 'Junior Giti', name: 'Junior Giti', role: 'Action & Drama Leader', count: '320+', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80' },
    { id: 'Sankara', name: 'Sankara Premier', role: 'Sci-Fi & War Specialist', count: '240+', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80' },
    { id: 'Rocky Kirabiranya', name: 'Rocky Kimomo', role: 'Action Dubbing Legend', count: '280+', avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=150&q=80' },
    { id: 'Gaheza', name: 'Gaheza Simba', role: 'Karate & Thriller Specialist', count: '130+', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=150&q=80' },
    { id: 'Savimbi', name: 'Savimbi', role: 'Classic Cinema & Comedy', count: '140+', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80' },
    { id: 'Gasirabo', name: 'Gasirabo', role: 'Indian & Romance Movies', count: '90+', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80' },
    { id: 'Yvan', name: 'Yvan', role: 'Crime & Gangster Movies', count: '75+', avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150&q=80' },
    { id: 'Aba-Stars', name: 'Aba-Stars', role: 'Latest Series Episodes', count: '110+', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80' },
    { id: 'Master Sikov', name: 'Master Sikov', role: 'Warfare & Epic Dubbing', count: '85+', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80' },
    { id: 'P-Kaly', name: 'P-Kaly', role: 'Animation & Family Dubs', count: '60+', avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=150&q=80' }
  ];

  // Carousel featured pool
  const featuredPool = useMemo(() => {
    const featM = movies.filter((m) => m.isFeatured);
    const featS = series.filter((s) => s.isFeatured);
    const combined: (MovieItem | SeriesItem)[] = [...featM, ...featS];
    if (combined.length > 0) return combined;
    return [...movies, ...series].slice(0, 6);
  }, [movies, series]);

  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const [isHeroPaused, setIsHeroPaused] = useState(false);

  // 3-second auto-transition carousel timer
  useEffect(() => {
    if (featuredPool.length <= 1 || isHeroPaused) return;
    const interval = setInterval(() => {
      setActiveHeroIndex((prev) => (prev + 1) % featuredPool.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [featuredPool.length, isHeroPaused]);

  const activeHeroItem = featuredPool[activeHeroIndex] || featuredPool[0];

  const handleHeroPlay = () => {
    if (!activeHeroItem) return;
    if ('seasons' in activeHeroItem) {
      onSelectSeries(activeHeroItem as SeriesItem, 1, 1);
    } else {
      onSelectMovie(activeHeroItem as MovieItem);
    }
  };

  const isHeroInWatchlist = activeHeroItem ? user.watchlist?.includes(activeHeroItem.id) : false;

  // Filtered movies based on selected pill
  const filteredMovies = useMemo(() => {
    if (activeFilter === 'ALL') return movies;
    if (activeFilter === 'SERIES') return [];
    return movies.filter((m) => {
      const umusobanuzi = (m.director || (m as any).umusobanuzi || '').toLowerCase();
      const genres = (m.genres || []).map((g) => g.toLowerCase());
      const query = activeFilter.toLowerCase();
      return umusobanuzi.includes(query) || genres.some((g) => g.includes(query));
    });
  }, [movies, activeFilter]);

  // Filtered series based on selected pill
  const filteredSeries = useMemo(() => {
    if (activeFilter === 'ALL' || activeFilter === 'SERIES') return series;
    return series.filter((s) => {
      const umusobanuzi = (s.director || (s as any).umusobanuzi || '').toLowerCase();
      const genres = (s.genres || []).map((g) => g.toLowerCase());
      const query = activeFilter.toLowerCase();
      return umusobanuzi.includes(query) || genres.some((g) => g.includes(query));
    });
  }, [series, activeFilter]);

  // Grouped rows for classic RebaMovie layout
  const juniorGitiMovies = useMemo(() => {
    return movies.filter((m) => (m.director || '').toLowerCase().includes('junior') || (m.title || '').toLowerCase().includes('junior'));
  }, [movies]);

  const sankaraMovies = useMemo(() => {
    return movies.filter((m) => (m.director || '').toLowerCase().includes('sankara') || (m.title || '').toLowerCase().includes('sankara'));
  }, [movies]);

  const rockyMovies = useMemo(() => {
    return movies.filter((m) => (m.director || '').toLowerCase().includes('rocky') || (m.title || '').toLowerCase().includes('rocky'));
  }, [movies]);

  const gahezaMovies = useMemo(() => {
    return movies.filter((m) => (m.director || '').toLowerCase().includes('gaheza') || (m.title || '').toLowerCase().includes('gaheza'));
  }, [movies]);

  const actionMovies = useMemo(() => {
    return movies.filter((m) => (m.genres || []).some((g) => g.toLowerCase().includes('action') || g.toLowerCase().includes('thriller')));
  }, [movies]);

  return (
    <div className="space-y-6 pb-20 select-none px-2 sm:px-4 md:px-6 lg:pl-16 max-w-[1750px] mx-auto pt-2">
      
      {/* =========================================================================
          1. EXACT HERO SPLIT SHOWCASE (FILIME MOVIES + TELEVIZIYO TV SHOWS)
          ========================================================================= */}
      <HeroSplitShowcase
        onSelectMovie={onSelectMovie}
        onSelectSeries={onSelectSeries}
        movies={movies}
        series={allSeries.length > 0 ? allSeries : propSeries}
      />

      {/* =========================================================================
          HOME TAB DEDICATED MOVIES SEARCH BAR (FAST, NEWEST FILMS FIRST)
          ========================================================================= */}
      <section className="relative rounded-3xl bg-gradient-to-r from-[#06152d]/90 via-[#030d1d]/90 to-[#020713]/90 p-4 sm:p-5 border border-cyan-500/30 shadow-xl backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center shadow-md shadow-cyan-950">
              <Film className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-wide">
                  SHAKISHA FILIME / SEARCH MOVIES
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-600/20 text-red-300 border border-red-500/40 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400 fill-amber-400" /> NEWEST ON TOP
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Type any movie name, umusobanuzi (Junior, Sankara, Rocky), year, or genre to stream quickly
              </p>
            </div>
          </div>

          {homeMovieSearch && (
            <button
              onClick={() => setHomeMovieSearch('')}
              className="self-end md:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-red-500 text-xs font-bold text-slate-300 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-3.5 h-3.5 text-red-400" />
              <span>Siba / Clear ({homeSearchedMovies.length})</span>
            </button>
          )}
        </div>

        {/* Search Input Box */}
        <div className="relative w-full">
          <Search className="w-5 h-5 text-cyan-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={homeMovieSearch}
            onChange={(e) => setHomeMovieSearch(e.target.value)}
            placeholder="Shakisha filime, imikino, sports... (urugero: Imikino, Arsenal, Real Madrid, Junior Giti, Action, 2026)..."
            className="w-full pl-12 pr-10 py-3 sm:py-3.5 rounded-2xl bg-slate-950/90 border border-cyan-900/50 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 text-sm text-white placeholder-slate-500 outline-none transition-all shadow-inner"
          />
          {homeMovieSearch && (
            <button
              onClick={() => setHomeMovieSearch('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-full bg-slate-800 hover:bg-cyan-500 text-slate-300 hover:text-slate-950 transition-colors cursor-pointer"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quick Search Tag Chips */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-2.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-cyan-400" /> Shakisha vuba:
          </span>
          {[
            { label: '⚽ Imikino Live / Sports', query: 'imikino' },
            { label: '🦁 Premier League', query: 'premier' },
            { label: '⭐ Champions League', query: 'champions' },
            { label: '🔥 New Films (2026/2025)', query: '202' },
            { label: '🎙️ Junior Giti', query: 'Junior Giti' },
            { label: '🎙️ Sankara', query: 'Sankara' },
            { label: '🎙️ Rocky Kirabiranya', query: 'Rocky' },
            { label: '💥 Action Hits', query: 'Action' }
          ].map((tag) => (
            <button
              key={tag.label}
              onClick={() => setHomeMovieSearch(tag.query)}
              className={`px-3 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all border shrink-0 cursor-pointer ${
                homeMovieSearch.toLowerCase().trim() === tag.query.toLowerCase().trim()
                  ? 'bg-gradient-to-r from-cyan-400 to-blue-600 text-slate-950 border-cyan-400 font-black shadow-[0_0_12px_rgba(0,240,255,0.4)]'
                  : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-800 hover:border-cyan-500/50'
              }`}
            >
              {tag.label}
            </button>
          ))}
        </div>
      </section>

      {/* =========================================================================
          INSTANT SEARCH RESULTS IN HOME TAB (FOOTBALL MATCHES + NEW FILMS)
          ========================================================================= */}
      {homeMovieSearch.trim() && (
        <section className="space-y-5 p-5 rounded-3xl bg-[#060e20] border border-cyan-500/40 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-cyan-900/40 pb-3">
            <div className="flex items-center gap-2.5">
              <Search className="w-5 h-5 text-cyan-400" />
              <div>
                <h3 className="text-base sm:text-lg font-black text-white">
                  IBYABONETSE KURI: <span className="text-cyan-400">"{homeMovieSearch}"</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Byashakishijwe muri RapidAPI Football Live, TMDB Cinema Store, na Rwanda Streaming Library
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {searchedFootballMatches.length > 0 && (
                <span className="px-3 py-1 rounded-full text-xs font-black bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 flex items-center gap-1.5 shadow-[0_0_10px_rgba(0,240,255,0.3)]">
                  ⚽ {searchedFootballMatches.length} Imikino (Sports)
                </span>
              )}
              {homeSearchedMovies.length > 0 && (
                <span className="px-3 py-1 rounded-full text-xs font-black bg-slate-900 text-slate-200 border border-cyan-900/50 flex items-center gap-1.5">
                  🎬 {homeSearchedMovies.length} Filime
                </span>
              )}
              <button
                onClick={() => setHomeMovieSearch('')}
                className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-400 text-xs font-bold text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                Funga / Close
              </button>
            </div>
          </div>

          {/* Searching Status Indicator */}
          {isSearchingApiStore && (
            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-cyan-950/40 border border-cyan-500/40 text-xs text-cyan-300">
              <Loader2 className="w-4 h-4 animate-spin text-cyan-400 shrink-0" />
              <span className="font-semibold">Shakisha muri Live APIs (Football & Cinema)...</span>
            </div>
          )}

          {/* =========================================================================
              1. IMIKINO & FOOTBALL LIVE MATCH RESULTS (RAPIDAPI LIVE MATCHES)
              ========================================================================= */}
          {searchedFootballMatches.length > 0 && (
            <div className="space-y-3 p-4 rounded-2xl bg-[#030914] border border-cyan-400/60 shadow-[0_0_20px_rgba(0,240,255,0.2)]">
              <div className="flex items-center justify-between pb-2 border-b border-cyan-900/40">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-400 to-blue-600 flex items-center justify-center text-slate-950 shadow-md">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white flex items-center gap-2">
                      IMIKINO YA FOOTBALL YABONETSE ({searchedFootballMatches.length})
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 animate-pulse">
                        ● RAPIDAPI LIVE
                      </span>
                    </h4>
                    <p className="text-[10px] text-slate-400">
                      Amanota ako kanya, iminota y'umukino, n'amashusho ya Full HD
                    </p>
                  </div>
                </div>

                <button
                  onClick={onOpenMatches}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 text-slate-950 font-black text-xs hover:scale-105 transition-all cursor-pointer shadow-md"
                >
                  Fungura Imikino Yose
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {searchedFootballMatches.map((m) => (
                  <div
                    key={m.id}
                    onClick={onOpenMatches}
                    className="p-3.5 rounded-2xl bg-[#061024] border border-cyan-900/70 hover:border-cyan-400 hover:bg-[#081836] transition-all cursor-pointer shadow-md group flex flex-col justify-between gap-3"
                  >
                    <div className="flex items-center justify-between text-[10px] font-semibold">
                      <span className="text-cyan-400 truncate max-w-[150px]">{m.tournament}</span>
                      <span className={`px-2 py-0.5 rounded-full font-black ${
                        m.status === 'LIVE'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 animate-pulse'
                          : 'bg-slate-900 text-slate-400 border border-slate-800'
                      }`}>
                        {m.status === 'LIVE' ? `LIVE ${m.minute || ''}` : m.time}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      {/* Home */}
                      <div className="flex-1 flex flex-col items-center text-center gap-1">
                        <img
                          src={m.homeLogo}
                          alt={m.homeTeam}
                          className="w-8 h-8 object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=60&q=80';
                          }}
                        />
                        <span className="text-xs font-bold text-white group-hover:text-cyan-300 truncate max-w-[90px]">
                          {m.homeTeam}
                        </span>
                      </div>

                      {/* Score / VS */}
                      <div className="px-2.5 py-1 rounded-xl bg-slate-950 border border-cyan-900/40 text-center shrink-0">
                        {m.homeScore !== undefined && m.awayScore !== undefined ? (
                          <span className="text-sm font-black text-cyan-300 font-mono">
                            {m.homeScore} : {m.awayScore}
                          </span>
                        ) : (
                          <span className="text-xs font-black text-slate-400">VS</span>
                        )}
                      </div>

                      {/* Away */}
                      <div className="flex-1 flex flex-col items-center text-center gap-1">
                        <img
                          src={m.awayLogo}
                          alt={m.awayTeam}
                          className="w-8 h-8 object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=60&q=80';
                          }}
                        />
                        <span className="text-xs font-bold text-white group-hover:text-cyan-300 truncate max-w-[90px]">
                          {m.awayTeam}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenMatches?.();
                      }}
                      className="w-full py-1.5 rounded-xl bg-gradient-to-r from-cyan-400/20 to-blue-600/20 group-hover:from-cyan-400 group-hover:to-blue-600 group-hover:text-slate-950 text-cyan-300 border border-cyan-400/40 text-[11px] font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{m.status === 'LIVE' ? 'KINA LIVE NONAHA' : 'REBA UMUKINO'}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* =========================================================================
              2. FILMS & CINEMA RESULTS
              ========================================================================= */}
          {homeSearchedMovies.length === 0 && searchedFootballMatches.length === 0 && !isSearchingApiStore ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
                <Search className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-300">
                Nta cyabonetse gihwanye na "{homeMovieSearch}"
              </p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Shakisha filime cyangwa imikino (urugero: Imikino, Sports, Arsenal, Madrid, Junior Giti, Action).
              </p>
              <div className="flex items-center justify-center gap-2 pt-2 flex-wrap">
                <button
                  onClick={() => setHomeMovieSearch('imikino')}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 border border-cyan-500/40 text-xs font-bold text-cyan-400 hover:bg-slate-800"
                >
                  ⚽ Imikino Live
                </button>
                <button
                  onClick={() => setHomeMovieSearch('Junior')}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 hover:bg-slate-800"
                >
                  🎙️ Junior Giti
                </button>
                <button
                  onClick={() => setHomeMovieSearch('2026')}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 hover:bg-slate-800"
                >
                  🔥 2026 Releases
                </button>
              </div>
            </div>
          ) : homeSearchedMovies.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4">
              {homeSearchedMovies.map((mov) => {
                const isWatchlisted = user.watchlist?.includes(mov.id);
                const isNewFilm = (mov.year || 0) >= 2025;

                return (
                  <div
                    key={mov.id}
                    onClick={() => onSelectMovie(mov)}
                    className="group relative rounded-2xl overflow-hidden bg-[#0c1424] border border-slate-800 hover:border-red-500 transition-all hover:scale-[1.02] shadow-xl hover:shadow-red-950/40 cursor-pointer flex flex-col justify-between"
                  >
                    {/* Poster with Year & Status Badges */}
                    <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-950">
                      <img
                        src={mov.posterUrl}
                        alt={mov.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />

                      {/* Top Badges Row */}
                      <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1 z-10 pointer-events-none">
                        {/* CRITICAL: Prominent Release Year badge on upper place */}
                        <div className="flex items-center gap-1">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase shadow-md ${
                            isNewFilm
                              ? 'bg-red-600 text-white shadow-red-600/50'
                              : 'bg-slate-950/90 text-amber-300 border border-amber-500/40'
                          }`}>
                            {isNewFilm ? `🔥 ${mov.year}` : mov.year}
                          </span>
                          {isNewFilm && (
                            <span className="px-1.5 py-0.5 rounded-md bg-amber-400 text-slate-950 text-[9px] font-black uppercase shadow">
                              NEW
                            </span>
                          )}
                        </div>

                        {/* HD & Access Badges */}
                        <div className="flex items-center gap-1">
                          <span className="px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-md text-cyan-300 text-[9px] font-black border border-cyan-500/30">
                            HD
                          </span>
                        </div>
                      </div>

                      {/* Hover Play Button Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-3">
                        <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center shadow-xl shadow-red-900/60 group-hover:scale-110 transition-transform mb-2">
                          <Play className="w-5 h-5 fill-white ml-0.5" />
                        </div>
                        <span className="text-xs font-black text-white uppercase tracking-wider drop-shadow">
                          KINA NONAHA
                        </span>
                      </div>
                    </div>

                    {/* Movie Information Footer */}
                    <div className="p-3 space-y-1.5 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="text-xs sm:text-sm font-black text-white group-hover:text-red-400 line-clamp-1">
                          {mov.title}
                        </h4>
                        <p className="text-[11px] text-amber-300/90 font-bold truncate flex items-center gap-1">
                          <Mic2 className="w-3 h-3 text-amber-400 shrink-0" />
                          <span>{mov.director || 'Umusobanuzi'}</span>
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/80 font-mono">
                        <span className="flex items-center gap-1 text-amber-400 font-bold">
                          <Star className="w-3 h-3 fill-amber-400" /> {mov.rating || 9.5}
                        </span>
                        <span>{mov.duration || '01:45:00'}</span>
                      </div>

                      {/* Quick Action Buttons */}
                      <div className="flex items-center gap-1.5 pt-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectMovie(mov);
                          }}
                          className="flex-1 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-[11px] font-black flex items-center justify-center gap-1 shadow-md shadow-red-950 transition-colors"
                        >
                          <Play className="w-3 h-3 fill-white" /> Kina
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleWatchlist(mov.id);
                          }}
                          className={`p-1.5 rounded-xl border text-xs transition-colors ${
                            isWatchlisted
                              ? 'bg-amber-500 text-slate-950 border-amber-400'
                              : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800'
                          }`}
                          title={isWatchlisted ? 'In Watchlist' : 'Add to Watchlist'}
                        >
                          {isWatchlisted ? <Check className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ==========================================
          1. REBAMOVIE VJ & CATEGORY PILLS FILTER BAR
          ========================================== */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 border-b border-cyan-900/30">
        {filterPills.map((pill) => {
          const isActive = activeFilter === pill.id;
          return (
            <button
              key={pill.id}
              onClick={() => setActiveFilter(pill.id)}
              className={`px-4 py-2 rounded-full text-xs font-black whitespace-nowrap transition-all flex items-center gap-1.5 shadow-sm shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-600 text-slate-950 shadow-[0_0_20px_rgba(14,165,233,0.6)] border border-cyan-300 scale-105'
                  : 'bg-[#081224] text-slate-300 hover:text-white hover:bg-slate-800 border border-cyan-950/60'
              }`}
            >
              <span>{pill.label}</span>
            </button>
          );
        })}
      </div>

      {/* ==========================================
          2. REBAMOVIE HERO BANNER (3s AUTO SLIDER) - BLUE MIRROR
          ========================================== */}
      {activeHeroItem && activeFilter === 'ALL' && (
        <div
          onMouseEnter={() => setIsHeroPaused(true)}
          onMouseLeave={() => setIsHeroPaused(false)}
          className="relative w-full h-[460px] sm:h-[520px] md:h-[580px] rounded-3xl overflow-hidden bg-slate-950 border border-cyan-500/40 shadow-[0_0_35px_rgba(14,165,233,0.25)] transition-all duration-700 group"
        >
          {/* Top Mirror Gloss Edge */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-600 shadow-[0_0_15px_#00f0ff] z-20" />

          {/* Hero Backdrop with Multi-Layered Cinematic Vignette */}
          <div className="absolute inset-0">
            <img
              src={activeHeroItem.backdropUrl || activeHeroItem.posterUrl}
              alt={activeHeroItem.title}
              className="w-full h-full object-cover object-center filter brightness-90 transition-transform duration-1000 ease-out group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#02050c] via-[#02050c]/70 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#02050c] via-[#02050c]/85 md:w-3/4 to-transparent" />
            <div className="absolute inset-0 bg-radial-at-c from-transparent via-[#02050c]/30 to-[#02050c]/90" />
          </div>

          {/* Hero Content Overlay */}
          <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-10 md:p-14 max-w-3xl space-y-3 sm:space-y-4 z-10">
            
            {/* Badges Bar */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-md bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black text-[11px] uppercase tracking-wider shadow-[0_0_15px_rgba(14,165,233,0.5)] flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 fill-slate-950" />
                {'seasons' in activeHeroItem ? 'AGASOBANUYE SERIES' : 'AGASOBANUYE FILM'}
              </span>

              {activeHeroItem.director && (
                <span className="px-3 py-1 rounded-md bg-slate-900/90 text-cyan-300 border border-cyan-400/40 font-black text-xs flex items-center gap-1 backdrop-blur-md shadow-sm">
                  <Mic2 className="w-3 h-3 text-cyan-400" />
                  {activeHeroItem.director}
                </span>
              )}

              {activeHeroItem.access === 'PREMIUM' ? (
                <span className="px-2.5 py-0.5 rounded-md bg-amber-400 text-slate-950 font-black text-[10px] uppercase tracking-wider">
                  VIP PASS
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-black text-[10px] uppercase shadow-[0_0_10px_rgba(6,182,212,0.3)]">
                  FREE TO WATCH
                </span>
              )}

              <span className="flex items-center gap-1 text-amber-400 font-black text-xs bg-slate-950/80 px-2 py-0.5 rounded-md border border-slate-800">
                <Star className="w-3.5 h-3.5 fill-amber-400" /> {activeHeroItem.rating || 9.8}
              </span>

              <span className="text-slate-300 font-mono text-xs bg-slate-950/80 px-2 py-0.5 rounded-md border border-slate-800">
                {activeHeroItem.year || 2026}
              </span>

              <span className="text-cyan-300 text-[10px] font-bold bg-cyan-950/60 border border-cyan-800/40 px-2 py-0.5 rounded-md">
                4K Ultra HD
              </span>
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight drop-shadow-2xl line-clamp-2">
              {activeHeroItem.title}
            </h1>

            {/* Audio & Genres */}
            <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-300 font-medium flex-wrap">
              <span className="text-cyan-400 font-bold">🇷🇼 Ikinyarwanda Dubbed</span>
              <span>•</span>
              <span className="text-slate-400">{activeHeroItem.genres?.join(', ') || 'Action, Thriller'}</span>
              <span>•</span>
              <span className="text-slate-400 font-mono">
                {'duration' in activeHeroItem ? (activeHeroItem as MovieItem).duration : `${(activeHeroItem as SeriesItem).seasons?.length || 1} Seasons`}
              </span>
            </div>

            {/* Description Synopsis */}
            <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 sm:line-clamp-3 leading-relaxed max-w-2xl drop-shadow">
              {activeHeroItem.description || 'Watch the latest translated Agasobanuye release in high definition with original voiceover commentary.'}
            </p>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2 flex-wrap">
              <button
                onClick={handleHeroPlay}
                className="px-6 sm:px-8 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-slate-950 font-black text-sm shadow-[0_0_25px_rgba(14,165,233,0.7)] hover:scale-105 active:scale-95 transition-all flex items-center gap-2.5 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-slate-950 translate-x-0.5" />
                <span>KINA / WATCH NOW</span>
              </button>

              <button
                onClick={() => onToggleWatchlist(activeHeroItem.id)}
                className={`px-4 sm:px-5 py-3.5 rounded-2xl font-bold text-xs transition-all flex items-center gap-2 border cursor-pointer ${
                  isHeroInWatchlist
                    ? 'bg-cyan-600 text-white border-cyan-400 shadow-[0_0_15px_rgba(14,165,233,0.4)]'
                    : 'bg-slate-900/90 text-slate-200 border-slate-700 hover:text-white hover:bg-slate-800'
                }`}
              >
                {isHeroInWatchlist ? <Check className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                <span>{isHeroInWatchlist ? 'In Watchlist' : '+ Watchlist'}</span>
              </button>

              {onOpenMovieDetails && (
                <button
                  onClick={() => onOpenMovieDetails(activeHeroItem)}
                  className="px-4 py-3.5 rounded-2xl bg-slate-900/80 text-slate-300 hover:text-white border border-slate-800 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer hover:border-cyan-400"
                >
                  <Info className="w-4 h-4 text-cyan-400" />
                  <span className="hidden sm:inline">Details</span>
                </button>
              )}
            </div>

          </div>

          {/* Carousel Pagination Indicator Dots */}
          <div className="absolute bottom-6 right-6 sm:bottom-10 sm:right-10 flex items-center gap-2 z-20">
            {featuredPool.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveHeroIndex(index)}
                className={`h-2.5 rounded-full transition-all cursor-pointer ${
                  index === activeHeroIndex
                    ? 'w-9 bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_12px_#00e5ff]'
                    : 'w-2.5 bg-slate-700 hover:bg-slate-500'
                }`}
              />
            ))}
          </div>

          {/* Manual Slide Arrows */}
          <button
            onClick={() => setActiveHeroIndex((prev) => (prev === 0 ? featuredPool.length - 1 : prev - 1))}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-950/70 border border-slate-800 text-slate-300 hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            onClick={() => setActiveHeroIndex((prev) => (prev + 1) % featuredPool.length)}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-950/70 border border-slate-800 text-slate-300 hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

        </div>
      )}

      {/* ==========================================
          2B. ABASOBANUZI (TRANSLATORS) SHOWCASE BAR (AGASOBANUYEFREE FEATURE)
          ========================================== */}
      {activeFilter === 'ALL' && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-400/40 flex items-center justify-center shadow-[0_0_10px_rgba(0,229,255,0.3)]">
                <Mic2 className="w-4 h-4 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-white tracking-wide">
                  Abasobanuzi Bakunzwe (Featured Translators)
                </h2>
                <p className="text-[11px] text-cyan-300/70">
                  Hitamo umusobanuzi ukunda urebe filime n'ibice byose yasobanuye
                </p>
              </div>
            </div>
            <span className="text-xs text-cyan-400 font-mono font-bold hidden sm:inline">
              10+ VJ Masters
            </span>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none pt-1">
            {ABASOBANUZI_PROFILES.map((profile) => {
              const isSelected = activeFilter === profile.name || (profile.id === 'ALL' && activeFilter === 'ALL');
              return (
                <button
                  key={profile.id}
                  onClick={() => {
                    setActiveFilter(profile.id === 'ALL' ? 'ALL' : profile.name);
                  }}
                  className={`flex flex-col items-center gap-1.5 p-2 rounded-2xl transition-all shrink-0 cursor-pointer group ${
                    isSelected
                      ? 'bg-gradient-to-b from-cyan-950/60 to-blue-950/40 border border-cyan-400 shadow-[0_0_20px_rgba(0,240,255,0.35)] scale-105'
                      : 'hover:bg-slate-900/60 border border-transparent hover:border-slate-800'
                  }`}
                >
                  <div className="relative">
                    <div
                      className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden p-0.5 transition-all ${
                        isSelected
                          ? 'ring-2 ring-cyan-400 shadow-[0_0_15px_#00e5ff] scale-105'
                          : 'ring-1 ring-slate-800 group-hover:ring-cyan-500/60'
                      }`}
                    >
                      <img
                        src={profile.avatar}
                        alt={profile.name}
                        className="w-full h-full object-cover rounded-full group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                    {isSelected && (
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-cyan-400 text-slate-950 rounded-full flex items-center justify-center text-[9px] font-black shadow-[0_0_8px_#00f0ff]">
                        ✓
                      </span>
                    )}
                  </div>
                  <span className={`text-xs font-black truncate max-w-[80px] text-center ${
                    isSelected ? 'text-cyan-300 drop-shadow-[0_0_8px_rgba(0,229,255,0.8)]' : 'text-slate-300 group-hover:text-white'
                  }`}>
                    {profile.name}
                  </span>
                  <span className="text-[9px] font-mono text-cyan-400/80 bg-cyan-950/50 px-1.5 py-0.2 rounded border border-cyan-800/40">
                    {profile.count}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* ==========================================
          2C. "SABA FILIME" (REQUEST MOVIE) QUICK CALLOUT BANNER
          ========================================== */}
      {activeFilter === 'ALL' && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-950/80 via-[#0a1832] to-cyan-950/70 border border-cyan-500/40 p-4 sm:p-5 shadow-[0_0_30px_rgba(0,240,255,0.15)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center gap-3.5 relative z-10">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-slate-950 flex items-center justify-center font-black shadow-[0_0_15px_#00f0ff] shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                Urashaka Filime itari hano?
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-cyan-400 text-slate-950 shadow-[0_0_8px_#00e5ff]">
                  SABA NONAHA
                </span>
              </h3>
              <p className="text-xs text-cyan-200/80 mt-0.5">
                Tohereza icyifuzo cy'agasobanuye wifuza, itsinda ryacu rihita riyishyiraho mu masaha 24 gusa!
              </p>
            </div>
          </div>

          <button
            onClick={onOpenRequestModal}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-[0_0_20px_#00e5ff] hover:shadow-[0_0_30px_#00f0ff] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer relative z-10"
          >
            <span>Saba Filime (Request Movie)</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ==========================================
          2D. IMIKINO YA NONE LIVE (LIVE FOOTBALL MATCHES - AGASOBANUYEFREE FEATURE)
          ========================================== */}
      {activeFilter === 'ALL' && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-400/40 flex items-center justify-center shadow-[0_0_10px_rgba(0,229,255,0.3)]">
                <Trophy className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-wide">
                  Imikino ya None Live (Live Football)
                </h2>
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 text-[10px] font-black animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f0ff]" />
                  LIVE NOW
                </span>
              </div>
            </div>

            <button
              onClick={onOpenMatches}
              className="text-xs font-bold text-cyan-400 hover:text-cyan-200 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Reba Imikino Yose</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {(apiMatches.length > 0 ? apiMatches : SAMPLE_LIVE_MATCHES).slice(0, 4).map((match) => (
              <div
                key={match.id}
                onClick={onOpenMatches}
                className="group relative rounded-2xl overflow-hidden bg-[#0a1426] border border-cyan-900/50 hover:border-cyan-400/80 p-3.5 cursor-pointer transition-all shadow-lg hover:shadow-[0_0_25px_rgba(0,229,255,0.25)] flex flex-col justify-between"
              >
                {/* Competition Header */}
                <div className="flex items-center justify-between text-[11px] font-mono text-cyan-300 pb-2 border-b border-cyan-950">
                  <span className="font-bold truncate max-w-[160px]">{match.tournament}</span>
                  {match.status === 'LIVE' ? (
                    <span className="px-1.5 py-0.5 rounded bg-cyan-500 text-slate-950 font-black text-[9px] shadow-[0_0_8px_#00f0ff] animate-pulse">
                      {match.minute || 'LIVE'}
                    </span>
                  ) : (
                    <span className="text-slate-400 text-[10px]">{match.time}</span>
                  )}
                </div>

                {/* Teams & Score */}
                <div className="py-3 flex items-center justify-between gap-2">
                  {/* Home Team */}
                  <div className="flex-1 flex flex-col items-center text-center gap-1.5">
                    <img
                      src={match.homeLogo}
                      alt={match.homeTeam}
                      className="w-10 h-10 object-contain drop-shadow"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=120&q=80';
                      }}
                    />
                    <span className="text-xs font-bold text-white group-hover:text-cyan-300 truncate max-w-[100px]">
                      {match.homeTeam}
                    </span>
                  </div>

                  {/* Score / VS Center */}
                  <div className="px-3 py-1 rounded-xl bg-slate-950/80 border border-cyan-900/40 text-center shrink-0">
                    {match.status === 'LIVE' && match.homeScore !== undefined ? (
                      <span className="text-base font-black text-cyan-300 tracking-wider">
                        {match.homeScore} : {match.awayScore}
                      </span>
                    ) : (
                      <span className="text-xs font-black text-slate-400">VS</span>
                    )}
                  </div>

                  {/* Away Team */}
                  <div className="flex-1 flex flex-col items-center text-center gap-1.5">
                    <img
                      src={match.awayLogo}
                      alt={match.awayTeam}
                      className="w-10 h-10 object-contain drop-shadow"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=120&q=80';
                      }}
                    />
                    <span className="text-xs font-bold text-white group-hover:text-cyan-300 truncate max-w-[100px]">
                      {match.awayTeam}
                    </span>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenMatches?.();
                  }}
                  className="w-full mt-1 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-400 hover:to-blue-500 text-cyan-300 hover:text-slate-950 border border-cyan-500/30 font-black text-[11px] transition-all flex items-center justify-center gap-1.5 group-hover:shadow-[0_0_15px_rgba(0,229,255,0.4)] cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{match.status === 'LIVE' ? 'KINA LIVE NONAHA' : 'REBA UMUKINO'}</span>
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ==========================================
          3. CONTINUE WATCHING (RESUME ROW)
          ========================================== */}
      {watchHistory.length > 0 && activeFilter === 'ALL' && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-black text-white tracking-wide flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-red-400" /> Komeza Kureba (Continue Watching)
            </h2>
            <span className="text-xs text-slate-400 font-mono">
              {watchHistory.length} in progress
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
            {watchHistory.slice(0, 4).map((item) => (
              <div
                key={item.contentId}
                onClick={() => {
                  if (item.seriesId) {
                    const ser = series.find((s) => s.id === item.seriesId);
                    if (ser) onSelectSeries(ser, item.seasonNumber || 1, item.episodeNumber || 1);
                  } else {
                    const mov = movies.find((m) => m.id === item.contentId);
                    if (mov) onSelectMovie(mov);
                  }
                }}
                className="p-2.5 rounded-2xl bg-[#0c1322] border border-slate-800 hover:border-red-500/60 transition-all cursor-pointer group flex flex-col justify-between shadow-lg"
              >
                <div className="relative aspect-video rounded-xl overflow-hidden bg-black mb-2">
                  <img
                    src={item.posterUrl}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="w-9 h-9 rounded-full bg-red-600 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                      <Play className="w-4 h-4 fill-white ml-0.5" />
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-red-600 to-rose-400"
                      style={{ width: `${item.progressPercent || 30}%` }}
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-white group-hover:text-red-400 truncate">
                    {item.title}
                  </h3>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 font-mono">
                    <span>{item.progressPercent}% watched</span>
                    <span className="text-red-400 font-bold">Kina</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ==========================================
          4. LIVE RWANDAN TELEVISION CHANNELS ROW
          ========================================== */}
      {channels.length > 0 && activeFilter === 'ALL' && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-red-500 animate-pulse" />
              <h2 className="text-base sm:text-lg font-black text-white tracking-wide">
                Televiziyo zo mu Rwanda (Live Rwandan TV)
              </h2>
            </div>
            {onViewAllChannels && (
              <button
                onClick={onViewAllChannels}
                className="text-xs font-bold text-red-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>Reba Zose ({channels.length})</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {channels.slice(0, 6).map((ch) => (
              <div
                key={ch.id}
                onClick={() => onSelectChannel(ch)}
                className="p-3 rounded-2xl bg-[#0c1322] border border-slate-800/80 hover:border-red-500/60 hover:bg-slate-900/90 cursor-pointer transition-all shadow-lg flex flex-col items-center text-center group"
              >
                <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-slate-950 border border-slate-800 p-2 flex items-center justify-center mb-2 shadow-inner">
                  <img
                    src={ch.logo || ch.logoUrl}
                    alt={ch.name}
                    className="w-full h-full object-contain rounded-lg group-hover:scale-110 transition-transform"
                  />
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-red-600 text-[8px] font-black text-white shadow-sm animate-pulse">
                    LIVE
                  </span>
                </div>

                <h3 className="text-xs font-black text-white group-hover:text-red-400 truncate w-full">
                  {ch.name}
                </h3>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate w-full">
                  {ch.category || 'Live TV'}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ==========================================
          5. TOP AGASOBANUYE SERIES WITH SEASONS
          ========================================== */}
      {(filteredSeries.length > 0) && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-red-400" />
              <h2 className="text-base sm:text-lg font-black text-white tracking-wide">
                Season z'Agasobanuye (Top Series & Episodes)
              </h2>
            </div>
            {onViewAllSeries && (
              <button
                onClick={onViewAllSeries}
                className="text-xs font-bold text-red-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>Reba Zose ({series.length})</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
            {filteredSeries.map((s) => {
              const isInWatchlist = user.watchlist?.includes(s.id);
              return (
                <div
                  key={s.id}
                  onClick={() => onSelectSeries(s, 1, 1)}
                  className="group relative rounded-2xl overflow-hidden bg-[#0c1322] border border-slate-800 hover:border-red-500/80 cursor-pointer transition-all flex flex-col shadow-xl hover:shadow-red-950/20"
                >
                  <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-950">
                    <img
                      src={s.posterUrl}
                      alt={s.title}
                      className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#070b14] via-transparent to-transparent opacity-90" />

                    {/* Series Tag */}
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[9px] font-black bg-red-600 text-white shadow">
                      SERIES
                    </span>

                    {s.access === 'PREMIUM' && (
                      <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md text-[9px] font-black bg-amber-500 text-slate-950">
                        VIP
                      </span>
                    )}

                    {/* VJ Translator Tag */}
                    {s.director && (
                      <div className="absolute bottom-2 left-2 z-10 pointer-events-none">
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-slate-950/90 text-amber-300 border border-amber-500/40 backdrop-blur-md flex items-center gap-1">
                          <Mic2 className="w-2.5 h-2.5 text-amber-400" />
                          {s.director}
                        </span>
                      </div>
                    )}

                    {/* Season info badge */}
                    <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-[8px] font-mono text-cyan-300 border border-cyan-800/40">
                      {s.seasons?.length || 1}S • {s.totalEpisodesCount || 10}E
                    </span>

                    {/* Hover Play Button */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <div className="w-11 h-11 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                        <Play className="w-5 h-5 fill-white ml-0.5" />
                      </div>
                    </div>
                  </div>

                  <div className="p-3 flex-1 flex flex-col justify-between bg-gradient-to-b from-[#0c1322] to-[#080d1a]">
                    <h3 className="text-xs font-bold text-white group-hover:text-red-400 transition-colors line-clamp-1">
                      {s.title}
                    </h3>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5">
                      <span>{s.year || 2026}</span>
                      <span className="flex items-center gap-0.5 text-amber-400 font-bold">
                        <Star className="w-2.5 h-2.5 fill-amber-400" /> {s.rating || 9.6}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ==========================================
          TMDB AUTOMATIC SECTIONS (Real-Time TMDB Data)
          1. Trending Movies
          2. Popular Movies
          3. Top Rated Movies
          4. Now Playing Movies
          5. Upcoming Movies
          6. Popular TV Shows
          ========================================== */}
      {activeFilter === 'ALL' && (
        <div className="space-y-10">
          {/* Section 1: Trending Movies */}
          <TmdbCategorySection
            title="Trending Movies"
            subtitle="Global trending blockbusters updated live from TMDB"
            icon={Flame}
            fetchFunction={fetchTrendingMovies}
            defaultType="movie"
            onSelectTitle={(item) => setSelectedTmdbItem(item)}
            myMovies={movies}
          />

          {/* Section 2: Popular Movies */}
          <TmdbCategorySection
            title="Popular Movies"
            subtitle="Most watched releases across world audiences"
            icon={Sparkles}
            fetchFunction={fetchPopularMovies}
            defaultType="movie"
            onSelectTitle={(item) => setSelectedTmdbItem(item)}
            myMovies={movies}
          />

          {/* Section 3: Top Rated Movies */}
          <TmdbCategorySection
            title="Top Rated Movies"
            subtitle="All-time highest rated films by audience review scores"
            icon={Star}
            fetchFunction={fetchTopRatedMovies}
            defaultType="movie"
            onSelectTitle={(item) => setSelectedTmdbItem(item)}
            myMovies={movies}
          />

          {/* Section 4: Now Playing Movies */}
          <TmdbCategorySection
            title="Now Playing Movies"
            subtitle="Currently playing in cinemas and streaming premieres"
            icon={PlayCircle}
            fetchFunction={fetchNowPlayingMovies}
            defaultType="movie"
            onSelectTitle={(item) => setSelectedTmdbItem(item)}
            myMovies={movies}
          />

          {/* Section 5: Upcoming Movies */}
          <TmdbCategorySection
            title="Upcoming Movies"
            subtitle="Highly anticipated films arriving soon in 2026"
            icon={Calendar}
            fetchFunction={fetchUpcomingMovies}
            defaultType="movie"
            onSelectTitle={(item) => setSelectedTmdbItem(item)}
            myMovies={movies}
          />

          {/* Section 6: Popular TV Shows */}
          <TmdbCategorySection
            title="Popular TV Shows"
            subtitle="Top rated multi-season TV series and trending episodes"
            icon={Tv}
            fetchFunction={fetchPopularTvShows}
            defaultType="tv"
            onSelectTitle={(item) => setSelectedTmdbItem(item)}
            myMovies={series}
          />
        </div>
      )}

      {/* ==========================================
          6. TRENDING AGASOBANUYE MOVIES ROW
          ========================================== */}
      {(filteredMovies.length > 0) && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Film className="w-4 h-4 text-red-500" />
              <h2 className="text-base sm:text-lg font-black text-white tracking-wide">
                {activeFilter === 'ALL' ? "Filime z'Agasobanuye Zikunzwe (Trending Movies)" : `Filime za: ${activeFilter}`}
              </h2>
            </div>
            {onViewAllMovies && (
              <button
                onClick={onViewAllMovies}
                className="text-xs font-bold text-red-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>Reba Zose ({movies.length})</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
            {filteredMovies.map((m) => {
              const isInWatchlist = user.watchlist?.includes(m.id);
              return (
                <div
                  key={m.id}
                  onClick={() => onSelectMovie(m)}
                  className="group relative rounded-2xl overflow-hidden bg-[#0c1322] border border-slate-800 hover:border-red-500/80 cursor-pointer transition-all flex flex-col shadow-xl hover:shadow-red-950/20"
                >
                  <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-950">
                    <img
                      src={m.posterUrl}
                      alt={m.title}
                      className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#070b14] via-transparent to-transparent opacity-90" />

                    {/* HD Quality Tag */}
                    <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md text-[9px] font-black bg-slate-900/90 text-cyan-400 border border-cyan-500/40 shadow">
                      1080p HD
                    </span>

                    {m.access === 'PREMIUM' ? (
                      <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md text-[9px] font-black bg-amber-500 text-slate-950 shadow">
                        VIP
                      </span>
                    ) : (
                      <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md text-[9px] font-black bg-gradient-to-r from-cyan-400 to-sky-400 text-slate-950 shadow-[0_0_10px_#00e5ff]">
                        FREE
                      </span>
                    )}

                    {/* Umusobanuzi narrator tag */}
                    {m.director && (
                      <div className="absolute bottom-2 left-2 z-10 pointer-events-none">
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-slate-950/90 text-amber-300 border border-amber-500/40 backdrop-blur-md flex items-center gap-1">
                          <Mic2 className="w-2.5 h-2.5 text-amber-400" />
                          {m.director}
                        </span>
                      </div>
                    )}

                    {/* Hover Play Button */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <div className="w-11 h-11 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                        <Play className="w-5 h-5 fill-white ml-0.5" />
                      </div>
                    </div>
                  </div>

                  <div className="p-3 flex-1 flex flex-col justify-between bg-gradient-to-b from-[#0c1322] to-[#080d1a]">
                    <h3 className="text-xs font-bold text-white group-hover:text-red-400 transition-colors line-clamp-1">
                      {m.title}
                    </h3>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5">
                      <span>{m.year || 2026}</span>
                      <span className="flex items-center gap-0.5 text-amber-400 font-bold">
                        <Star className="w-2.5 h-2.5 fill-amber-400" /> {m.rating || 9.5}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ==========================================
          7. JUNIOR GITI BLOCKBUSTERS (If on ALL tab)
          ========================================== */}
      {activeFilter === 'ALL' && juniorGitiMovies.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mic2 className="w-4 h-4 text-amber-400" />
              <h2 className="text-base sm:text-lg font-black text-white tracking-wide">
                Ibyakozwe na Junior Giti (Junior Giti Hits)
              </h2>
            </div>
            <button
              onClick={() => setActiveFilter('Junior Giti')}
              className="text-xs font-bold text-red-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Reba Byose</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
            {juniorGitiMovies.slice(0, 6).map((m) => (
              <div
                key={m.id}
                onClick={() => onSelectMovie(m)}
                className="group relative rounded-2xl overflow-hidden bg-[#0c1322] border border-slate-800 hover:border-amber-500/80 cursor-pointer transition-all flex flex-col shadow-xl"
              >
                <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-950">
                  <img
                    src={m.posterUrl}
                    alt={m.title}
                    className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#070b14] via-transparent to-transparent opacity-90" />

                  <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md text-[9px] font-black bg-amber-500 text-slate-950 shadow">
                    Junior Giti
                  </span>

                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-11 h-11 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg">
                      <Play className="w-5 h-5 fill-white ml-0.5" />
                    </div>
                  </div>
                </div>

                <div className="p-3">
                  <h3 className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-1">
                    {m.title}
                  </h3>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                    <span>{m.year || 2026}</span>
                    <span className="flex items-center gap-0.5 text-amber-400 font-bold">
                      <Star className="w-2.5 h-2.5 fill-amber-400" /> {m.rating || 9.8}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ==========================================
          8. SANKARA ACTION & MARTIAL ARTS ROW
          ========================================== */}
      {activeFilter === 'ALL' && sankaraMovies.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-red-500" />
              <h2 className="text-base sm:text-lg font-black text-white tracking-wide">
                Filime z'Imirwano za Sankara (Sankara Action Hits)
              </h2>
            </div>
            <button
              onClick={() => setActiveFilter('Sankara')}
              className="text-xs font-bold text-red-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Reba Byose</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
            {sankaraMovies.slice(0, 6).map((m) => (
              <div
                key={m.id}
                onClick={() => onSelectMovie(m)}
                className="group relative rounded-2xl overflow-hidden bg-[#0c1322] border border-slate-800 hover:border-red-500/80 cursor-pointer transition-all flex flex-col shadow-xl"
              >
                <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-950">
                  <img
                    src={m.posterUrl}
                    alt={m.title}
                    className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#070b14] via-transparent to-transparent opacity-90" />

                  <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md text-[9px] font-black bg-red-600 text-white shadow">
                    Sankara
                  </span>

                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-11 h-11 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg">
                      <Play className="w-5 h-5 fill-white ml-0.5" />
                    </div>
                  </div>
                </div>

                <div className="p-3">
                  <h3 className="text-xs font-bold text-white group-hover:text-red-400 transition-colors line-clamp-1">
                    {m.title}
                  </h3>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                    <span>{m.year || 2026}</span>
                    <span className="flex items-center gap-0.5 text-amber-400 font-bold">
                      <Star className="w-2.5 h-2.5 fill-amber-400" /> {m.rating || 9.7}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ==========================================
          9. VIP PASS MEMBERSHIP BANNER (MTN MOMO & AIRTEL)
          ========================================== */}
      {onOpenSubscribe && (
        <div className="rounded-3xl bg-gradient-to-r from-red-950/80 via-[#10192e] to-slate-900 border border-red-800/40 p-6 sm:p-10 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div className="space-y-2 text-center md:text-left z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/20 border border-red-500/40 text-red-400 text-xs font-black">
              <Sparkles className="w-3.5 h-3.5" /> REBAMOVIE VIP PASS • MTN & AIRTEL MONEY
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Fungura Filime na Episode Zose nta Nkomyi
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              Ishyure ukoresheje MTN MoMo cyangwa Airtel Money uhabwe uburenganzira bwo kureba filime nshya z'Agasobanuye muri 4K no kuzibika muri telefone yawe.
            </p>
          </div>

          <button
            onClick={onOpenSubscribe}
            className="px-8 py-4 rounded-2xl bg-gradient-to-r from-red-600 via-red-500 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-sm shadow-xl shadow-red-600/40 hover:scale-105 transition-all shrink-0 cursor-pointer z-10"
          >
            GURA VIP PASS (500 RWF)
          </button>
        </div>
      )}

      {/* ==========================================
          TMDB MOVIE & TV DETAILS MODAL
          ========================================== */}
      <TmdbDetailsModal
        item={selectedTmdbItem}
        isOpen={Boolean(selectedTmdbItem)}
        onClose={() => setSelectedTmdbItem(null)}
        user={user}
        myMovies={[...movies, ...series]}
        onPlayMovie={onSelectMovie}
        onPlaySeries={(s) => onSelectSeries(s, 1, 1)}
        onSelectAnotherTitle={(newTitle) => setSelectedTmdbItem(newTitle)}
        onToggleWatchlist={onToggleWatchlist}
      />

    </div>
  );
};
