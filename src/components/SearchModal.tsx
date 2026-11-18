import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  Mic,
  SlidersHorizontal,
  Sparkles,
  Star,
  Film,
  Tv2,
  Tv,
  ExternalLink,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { MediaItem, TvChannel, FilterOptions, WatchmodeSearchResultItem, WatchmodeTitleDetails, MovieItem } from '../types';
import { searchWatchmode, getWatchmodeTitleDetails } from '../services/watchmodeService';
import { searchApiStoreMovies } from '../services/apiStoreSearchService';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaItems: MediaItem[];
  channels: TvChannel[];
  onSelectMedia: (item: MediaItem) => void;
  onSelectChannel: (channel: TvChannel) => void;
  onSelectWatchmodeTitle?: (title: WatchmodeTitleDetails) => void;
  initialVoiceMode?: boolean;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  mediaItems = [],
  channels = [],
  onSelectMedia,
  onSelectChannel,
  onSelectWatchmodeTitle,
  initialVoiceMode = false
}) => {
  const [query, setQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [aiTypoCorrection, setAiTypoCorrection] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Watchmode Search State
  const [watchmodeResults, setWatchmodeResults] = useState<WatchmodeSearchResultItem[]>([]);
  const [isLoadingWatchmode, setIsLoadingWatchmode] = useState(false);
  const [watchmodeError, setWatchmodeError] = useState<string | null>(null);

  // API Store Search State (TMDB, Local Database, Firestore)
  const [apiStoreResults, setApiStoreResults] = useState<MovieItem[]>([]);
  const [isLoadingApiStore, setIsLoadingApiStore] = useState(false);

  const [activeTab, setActiveTab] = useState<'all' | 'apiStore' | 'watchmode' | 'channels' | 'library'>('all');
  const [fetchingTitleId, setFetchingTitleId] = useState<number | null>(null);

  const [filters, setFilters] = useState<FilterOptions>({
    searchQuery: '',
    genre: 'All',
    year: 'All',
    country: 'All',
    language: 'All',
    minRating: 0,
    type: 'all',
    sortBy: 'trending'
  });

  const genresList = ['All', 'Action', 'Sci-Fi', 'Drama', 'Rwandan Cinema', 'African Cinema', 'Comedy', 'Documentary', 'Trailer'];
  const yearsList = ['All', '2026', '2025', '2024', '2023', '2022', '2020', '2015', '2010'];
  const languagesList = ['All', 'Kinyarwanda', 'English', 'French', 'Swahili'];

  // Voice Recognition Trigger
  const startVoiceSearch = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Voice search is not supported in this browser. Please type your query.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  useEffect(() => {
    if (initialVoiceMode && isOpen) {
      startVoiceSearch();
    }
  }, [initialVoiceMode, isOpen]);

  // Debounced Live Watchmode & API Store Search (350ms after user pauses typing)
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setWatchmodeResults([]);
      setWatchmodeError(null);
      setApiStoreResults([]);
      setAiTypoCorrection('');
      return;
    }

    setWatchmodeError(null);
    setIsLoadingWatchmode(true);
    setIsLoadingApiStore(true);

    const timeout = setTimeout(async () => {
      // 1. Search official API Store (TMDB, Local Database, Firestore)
      try {
        const storeRes = await searchApiStoreMovies(query.trim(), mediaItems as any);
        setApiStoreResults(storeRes.movies || []);
      } catch {
        setApiStoreResults([]);
      } finally {
        setIsLoadingApiStore(false);
      }

      // 2. Search Watchmode API if configured
      try {
        const wmRes = await searchWatchmode(query.trim());
        if (wmRes.error) {
          setWatchmodeError(wmRes.error);
          setWatchmodeResults([]);
        } else {
          setWatchmodeResults(wmRes.results || []);
          setWatchmodeError(null);
        }
      } catch {
        setWatchmodeResults([]);
      } finally {
        setIsLoadingWatchmode(false);
      }

      // 3. AI typo suggestion
      try {
        const res = await fetch('/api/ai/smart-search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query })
        });
        const data = await res.json();
        if (data.correctedQuery && data.correctedQuery.toLowerCase() !== query.toLowerCase()) {
          setAiTypoCorrection(data.correctedQuery);
        } else {
          setAiTypoCorrection('');
        }
      } catch {
        setAiTypoCorrection('');
      }
    }, 350);

    return () => clearTimeout(timeout);
  }, [query, mediaItems]);

  if (!isOpen) return null;

  const handleWatchmodeItemClick = async (item: WatchmodeSearchResultItem) => {
    if (!onSelectWatchmodeTitle) return;
    setFetchingTitleId(item.id);
    try {
      const fullDetails = await getWatchmodeTitleDetails(item.id);
      if (fullDetails) {
        onSelectWatchmodeTitle(fullDetails);
        onClose();
      } else {
        alert('Unable to load title details. Please try again.');
      }
    } catch (e) {
      alert('Unable to load title details. Please try again.');
    } finally {
      setFetchingTitleId(null);
    }
  };

  // Filter Media Results (SOURCE B: My Movies / Local Library)
  const filteredMedia = (mediaItems || []).filter((item) => {
    const searchQueryMatch =
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.synopsis.toLowerCase().includes(query.toLowerCase()) ||
      (item.genres || []).some((g) => g.toLowerCase().includes(query.toLowerCase()));

    const genreMatch = filters.genre === 'All' || (item.genres || []).includes(filters.genre);
    const yearMatch = filters.year === 'All' || String(item.releaseYear) === filters.year;
    const typeMatch =
      filters.type === 'all' ||
      (filters.type === 'rwandan' && item.isRwandan) ||
      (filters.type === 'african' && item.isAfrican) ||
      item.type === filters.type;

    return searchQueryMatch && genreMatch && yearMatch && typeMatch;
  });

  const filteredChannels = (channels || []).filter((ch) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      ch.name.toLowerCase().includes(q) ||
      (ch.altName && ch.altName.toLowerCase().includes(q)) ||
      (ch.description && ch.description.toLowerCase().includes(q)) ||
      ch.country.toLowerCase().includes(q) ||
      ch.category.toLowerCase().includes(q)
    );
  });

  const totalResultsCount =
    apiStoreResults.length + watchmodeResults.length + filteredChannels.length + filteredMedia.length;

  const isDev = Boolean((import.meta as any).env?.DEV);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-xl overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-3xl bg-slate-900 border border-slate-700/80 p-4 sm:p-6 shadow-2xl mt-4 sm:mt-10 max-h-[90vh] flex flex-col text-white">
        
        {/* Header & Search Bar Input */}
        <div className="relative flex items-center gap-3 pb-4 border-b border-slate-800 shrink-0">
          <Search className="w-6 h-6 text-cyan-400 shrink-0" />
          <input
            type="text"
            placeholder="Search any movie: Mutiny, Avatar, Titanic, Inception, Beekeeper..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-transparent text-base sm:text-lg text-white placeholder-slate-500 focus:outline-none font-medium"
          />

          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-full text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={startVoiceSearch}
            className={`p-2 rounded-xl border transition-colors shrink-0 ${
              isListening
                ? 'bg-red-500 text-white border-red-400 animate-pulse'
                : 'bg-slate-950 text-slate-300 border-slate-800 hover:text-cyan-400'
            }`}
            title="Voice Search"
          >
            <Mic className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-xl border transition-colors shrink-0 ${
              showFilters
                ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                : 'bg-slate-950 text-slate-300 border-slate-800 hover:text-cyan-400'
            }`}
            title="Filter Settings"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-950 text-slate-400 hover:text-white border border-slate-800 shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Source Filter Switcher Tabs */}
        <div className="py-3 flex items-center gap-2 border-b border-slate-800/80 text-xs font-bold shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'all' ? 'bg-cyan-500 text-slate-950 shadow' : 'bg-slate-950 text-slate-400 hover:text-white'
            }`}
          >
            All Results ({totalResultsCount})
          </button>

          <button
            onClick={() => setActiveTab('apiStore')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'apiStore' ? 'bg-red-600 text-white shadow' : 'bg-slate-950 text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> API Store Movies ({apiStoreResults.length})
          </button>

          <button
            onClick={() => setActiveTab('channels')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'channels' ? 'bg-cyan-500 text-slate-950 shadow' : 'bg-slate-950 text-slate-400 hover:text-white'
            }`}
          >
            <Tv2 className="w-3.5 h-3.5" /> Live Channels ({filteredChannels.length})
          </button>

          {filteredMedia.length > 0 && (
            <button
              onClick={() => setActiveTab('library')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'library' ? 'bg-purple-500 text-white shadow' : 'bg-slate-950 text-slate-400 hover:text-white'
              }`}
            >
              <Film className="w-3.5 h-3.5" /> My Movies & Library ({filteredMedia.length})
            </button>
          )}
        </div>

        {/* AI Typo Suggestion */}
        {aiTypoCorrection && (
          <div className="my-2 p-2.5 rounded-xl bg-cyan-950/60 border border-cyan-500/40 text-xs flex items-center gap-2 shrink-0">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-slate-300">Did you mean:</span>
            <button
              onClick={() => setQuery(aiTypoCorrection)}
              className="font-bold text-cyan-300 underline hover:text-cyan-200"
            >
              "{aiTypoCorrection}"
            </button>
          </div>
        )}

        {/* Filters Drawer */}
        {showFilters && (
          <div className="my-3 p-4 rounded-2xl bg-slate-950/90 border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs shrink-0">
            <div>
              <label className="text-slate-400 block mb-1 font-semibold">Genre</label>
              <select
                value={filters.genre}
                onChange={(e) => setFilters({ ...filters, genre: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white font-medium focus:outline-none"
              >
                {genresList.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1 font-semibold">Year</label>
              <select
                value={filters.year}
                onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white font-medium focus:outline-none"
              >
                {yearsList.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1 font-semibold">Language</label>
              <select
                value={filters.language}
                onChange={(e) => setFilters({ ...filters, language: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white font-medium focus:outline-none"
              >
                {languagesList.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1 font-semibold">Category</label>
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white font-medium focus:outline-none"
              >
                <option value="all">All Types</option>
                <option value="movie">Movies</option>
                <option value="series">Series</option>
                <option value="rwandan">🇷🇼 Rwandan Only</option>
                <option value="african">🌍 African Only</option>
              </select>
            </div>
          </div>
        )}

        {/* Quick Search Chips */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 mb-2 text-xs shrink-0">
          <span className="text-slate-400 font-semibold flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Popular:
          </span>
          {['Avatar', 'Titanic', 'Inception', 'Stranger Things', 'Breaking Bad', 'KC2', 'RTV'].map((tag) => (
            <button
              key={tag}
              onClick={() => setQuery(tag)}
              className="px-3 py-1 rounded-full bg-slate-950 border border-slate-800 hover:border-cyan-500/50 text-slate-300 hover:text-white transition-colors whitespace-nowrap font-medium"
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Scrollable Results Container */}
        <div className="overflow-y-auto flex-1 space-y-6 pr-1 mt-2">
          
          {/* 1. API STORE MOVIES (Real TMDB and Database Catalog) */}
          {(activeTab === 'all' || activeTab === 'apiStore') && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  API Store Films ({apiStoreResults.length}) • Newest Releases First
                </h3>
                {isLoadingApiStore && (
                  <div className="flex items-center gap-1.5 text-xs text-red-400">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-red-400" />
                    <span>Searching API Store...</span>
                  </div>
                )}
              </div>

              {apiStoreResults.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                  {apiStoreResults.map((mov) => (
                    <div
                      key={`api_store_modal_${mov.id}`}
                      onClick={() => {
                        onSelectMedia({
                          id: mov.id,
                          title: mov.title,
                          type: 'movie',
                          posterUrl: mov.posterUrl,
                          backdropUrl: mov.backdropUrl,
                          videoUrl: mov.videoUrl,
                          streamUrl: mov.videoUrl,
                          rating: mov.rating,
                          releaseYear: mov.year,
                          duration: mov.duration,
                          genres: mov.genres,
                          description: mov.description,
                          access: mov.access,
                          status: mov.status,
                          isFeatured: mov.isFeatured,
                          isPopular: mov.isPopular,
                          isRwandan: true,
                          isAfrican: true,
                          isAgasobanuye: true,
                          director: mov.director,
                          cast: mov.cast
                        });
                        onClose();
                      }}
                      className="flex flex-col justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800 hover:border-red-500/60 cursor-pointer transition-all group shadow-md"
                    >
                      <div className="flex gap-3">
                        <div className="w-16 h-22 shrink-0 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 relative">
                          <img
                            src={mov.posterUrl}
                            alt={mov.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-red-600/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Film className="w-5 h-5 text-white" />
                          </div>
                        </div>

                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-red-600/20 text-red-300 border border-red-500/30 flex items-center gap-1">
                              <Film className="w-2.5 h-2.5" />
                              {mov.year || 2026}
                            </span>
                            <span className="text-[10px] text-amber-400 font-bold flex items-center gap-0.5">
                              <Star className="w-2.5 h-2.5 fill-amber-400" /> {mov.rating}
                            </span>
                          </div>

                          <h4 className="text-xs font-black text-white group-hover:text-red-400 line-clamp-1">
                            {mov.title}
                          </h4>

                          <p className="text-[10px] text-slate-400 line-clamp-2">
                            {mov.description}
                          </p>
                        </div>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-slate-900 flex items-center justify-between text-[10px]">
                        <span className="text-slate-400 font-mono truncate">{mov.director || 'Junior Giti'}</span>
                        <span className="text-red-400 font-black group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                          Stream Now
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          )}

          {/* 2. WATCHMODE SEARCH RESULTS */}
          {(activeTab === 'all' || activeTab === 'watchmode') && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Watchmode Streaming Catalog & Where to Watch ({watchmodeResults.length})
                </h3>
                {isLoadingWatchmode && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                    <span>Searching Watchmode...</span>
                  </div>
                )}
              </div>

              {watchmodeError && (
                <div className="p-3.5 rounded-2xl bg-red-950/40 border border-red-500/40 text-xs text-red-200 flex items-center gap-2 mb-3">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{watchmodeError}</span>
                </div>
              )}

              {watchmodeResults.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                  {watchmodeResults.map((wm) => {
                    const isFetching = fetchingTitleId === wm.id;
                    const isSeries = wm.type === 'tv_series' || wm.type === 'tv_miniseries';

                    return (
                      <div
                        key={`wm_search_${wm.id}`}
                        onClick={() => handleWatchmodeItemClick(wm)}
                        className="flex flex-col justify-between p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-amber-500/60 cursor-pointer transition-all group shadow-md"
                      >
                        <div className="flex gap-3">
                          <div className="w-16 h-22 shrink-0 rounded-xl overflow-hidden bg-slate-900 border border-slate-800">
                            <img
                              src={wm.poster_url || wm.image_url || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=300&q=80'}
                              alt={wm.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>

                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                                {isSeries ? <Tv className="w-2.5 h-2.5" /> : <Film className="w-2.5 h-2.5" />}
                                {isSeries ? 'TV Show' : 'Movie'}
                              </span>
                              {wm.year && (
                                <span className="text-[10px] text-slate-400 font-semibold">{wm.year}</span>
                              )}
                              {isDev && (
                                <span className="text-[8px] font-mono text-slate-500 bg-slate-900 px-1 py-0.2 rounded">
                                  ID:{wm.id}
                                </span>
                              )}
                            </div>

                            <h4 className="text-xs font-black text-white truncate group-hover:text-amber-300 transition-colors">
                              {wm.name}
                            </h4>

                            <p className="text-[11px] text-slate-400 line-clamp-2 leading-tight">
                              {wm.plot_overview || `Explore where to watch ${wm.name} on authorized streaming platforms.`}
                            </p>

                            {wm.user_rating && (
                              <div className="flex items-center gap-1 text-[10px] font-bold text-amber-400">
                                <Star className="w-3 h-3 fill-amber-400" />
                                {wm.user_rating.toFixed(1)}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-slate-900 flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-400">Streaming Details</span>
                          <button
                            disabled={isFetching}
                            className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500 hover:text-slate-950 text-amber-300 text-[10px] font-black flex items-center gap-1 transition-all"
                          >
                            {isFetching ? <Loader2 className="w-3 h-3 animate-spin" /> : <ExternalLink className="w-3 h-3" />}
                            Where to Watch
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : query && !isLoadingWatchmode && !watchmodeError ? (
                <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 text-xs text-slate-400">
                  No Watchmode titles found for "{query}".
                </div>
              ) : null}
            </div>
          )}

          {/* 2. TV CHANNELS RESULTS */}
          {(activeTab === 'all' || activeTab === 'channels') && filteredChannels.length > 0 && (
            <div>
              <h3 className="text-xs font-black text-cyan-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Tv2 className="w-4 h-4 text-cyan-400" />
                Live Rwandan & African TV Channels ({filteredChannels.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredChannels.map((ch) => (
                  <div
                    key={ch.id}
                    onClick={() => {
                      onSelectChannel(ch);
                      onClose();
                    }}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-cyan-500/50 cursor-pointer transition-all group"
                  >
                    <img src={ch.logoUrl} alt={ch.name} className="w-11 h-11 object-cover rounded-xl border border-slate-800 bg-slate-900" />
                    <div className="truncate flex-1">
                      <p className="text-xs font-black text-white truncate group-hover:text-cyan-300">{ch.name}</p>
                      <p className="text-[10px] text-slate-400">{ch.country} • {ch.category}</p>
                      <span className="text-[9px] font-bold text-cyan-400">● Live Stream</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. MY MOVIES / LIBRARY RESULTS (SOURCE B) */}
          {(activeTab === 'all' || activeTab === 'library') && filteredMedia.length > 0 && (
            <div>
              <h3 className="text-xs font-black text-purple-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Film className="w-4 h-4 text-purple-400" />
                My Movies & Library ({filteredMedia.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {filteredMedia.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => {
                      onSelectMedia(m);
                      onClose();
                    }}
                    className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-purple-500/50 cursor-pointer transition-all group"
                  >
                    <img src={m.posterUrl} alt={m.title} className="w-12 h-16 object-cover rounded-xl" />
                    <div className="truncate flex-1">
                      <p className="text-xs font-black text-white truncate group-hover:text-purple-300">{m.title}</p>
                      <p className="text-[10px] text-slate-400">{m.releaseYear} • {m.rating}★</p>
                      <span className="text-[9px] font-bold text-purple-300">{m.genres[0]}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {totalResultsCount === 0 && !isLoadingWatchmode && !watchmodeError && (
            <div className="text-center py-12 text-slate-400 text-sm space-y-2">
              <p className="font-bold text-slate-300">No matching results found for "{query}".</p>
              <p className="text-xs text-slate-500">Try searching for movies like "Avatar", "Titanic", "Inception" or TV shows like "Stranger Things", "Breaking Bad".</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
