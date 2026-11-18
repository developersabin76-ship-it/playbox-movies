import React, { useState, useEffect } from 'react';
import {
  X,
  Play,
  Star,
  Clock,
  Calendar,
  ExternalLink,
  Film,
  Tv,
  CheckCircle2,
  Bookmark,
  BookmarkCheck,
  Share2,
  Tv2,
  Sparkles,
  Info,
  Layers,
  ChevronDown
} from 'lucide-react';
import { WatchmodeTitleDetails, WatchmodeSource, WatchmodeSeason, WatchmodeEpisode } from '../types';
import { getWatchmodeSources, getWatchmodeSeasons } from '../services/watchmodeService';

interface WatchmodeDetailsModalProps {
  title: WatchmodeTitleDetails | null;
  isOpen: boolean;
  onClose: () => void;
  onImportToLibrary?: (title: WatchmodeTitleDetails) => void;
  isAdmin?: boolean;
}

export const WatchmodeDetailsModal: React.FC<WatchmodeDetailsModalProps> = ({
  title,
  isOpen,
  onClose,
  onImportToLibrary,
  isAdmin = false
}) => {
  const [activeTab, setActiveTab] = useState<'where_to_watch' | 'episodes' | 'cast' | 'trailer'>('where_to_watch');
  const [sources, setSources] = useState<WatchmodeSource[]>([]);
  const [seasons, setSeasons] = useState<WatchmodeSeason[]>([]);
  const [selectedSeasonNumber, setSelectedSeasonNumber] = useState<number>(1);
  const [loadingSources, setLoadingSources] = useState<boolean>(false);
  const [sourceFilter, setSourceFilter] = useState<'all' | 'sub' | 'free' | 'purchase'>('all');
  const [isSavedInWatchlist, setIsSavedInWatchlist] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  useEffect(() => {
    if (!title || !isOpen) return;

    // Initialize sources from title prop or fetch if missing
    if (title.sources && title.sources.length > 0) {
      setSources(title.sources);
    } else {
      setLoadingSources(true);
      getWatchmodeSources(title.id)
        .then((fetchedSources) => {
          setSources(fetchedSources);
        })
        .finally(() => setLoadingSources(false));
    }

    // If TV show, load seasons
    if (title.type === 'tv_series' || title.type === 'tv_miniseries') {
      if (title.seasons && title.seasons.length > 0) {
        setSeasons(title.seasons);
        setSelectedSeasonNumber(title.seasons[0].season_number || 1);
      } else {
        getWatchmodeSeasons(title.id).then((fetchedSeasons) => {
          setSeasons(fetchedSeasons);
          if (fetchedSeasons.length > 0) {
            setSelectedSeasonNumber(fetchedSeasons[0].season_number || 1);
          }
        });
      }
    }

    // Check local watchlist
    try {
      const saved = localStorage.getItem('lionel_watchlist_ids');
      if (saved) {
        const ids = JSON.parse(saved);
        setIsSavedInWatchlist(ids.includes(`wm_${title.id}`));
      }
    } catch {
      // ignore
    }
  }, [title, isOpen]);

  if (!isOpen || !title) return null;

  const isSeries = title.type === 'tv_series' || title.type === 'tv_miniseries';

  const toggleWatchlist = () => {
    try {
      const key = 'lionel_watchlist_ids';
      const raw = localStorage.getItem(key);
      let ids: string[] = raw ? JSON.parse(raw) : [];
      const itemKey = `wm_${title.id}`;

      if (ids.includes(itemKey)) {
        ids = ids.filter((id) => id !== itemKey);
        setIsSavedInWatchlist(false);
      } else {
        ids.push(itemKey);
        setIsSavedInWatchlist(true);
      }
      localStorage.setItem(key, JSON.stringify(ids));
    } catch {
      setIsSavedInWatchlist(!isSavedInWatchlist);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: title.title,
        text: `Check out where to watch ${title.title} on Lionel Stream (Watchmode)`,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  // Filter sources
  const filteredSources = sources.filter((s) => {
    if (sourceFilter === 'all') return true;
    return s.type === sourceFilter;
  });

  const subscriptionSources = sources.filter((s) => s.type === 'sub');
  const freeSources = sources.filter((s) => s.type === 'free');
  const purchaseSources = sources.filter((s) => s.type === 'purchase');

  // Selected season
  const currentSeason = seasons.find((s) => s.season_number === selectedSeasonNumber) || seasons[0];

  // Helper to extract YouTube video ID
  const getYouTubeEmbedUrl = (url?: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? `https://www.youtube.com/embed/${match[2]}?autoplay=1` : null;
  };

  const trailerEmbedUrl = getYouTubeEmbedUrl(title.trailer);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl my-auto text-slate-200 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-30 p-2.5 rounded-full bg-slate-950/70 hover:bg-slate-800 border border-slate-700/50 text-slate-300 hover:text-white transition-all shadow-lg"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* HERO HEADER */}
        <div className="relative h-64 sm:h-80 w-full shrink-0 overflow-hidden bg-slate-950">
          <img
            src={title.backdrop || title.poster || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1200&q=80'}
            alt={title.title}
            className="w-full h-full object-cover object-center opacity-45 scale-105 filter blur-[1px]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/40 to-transparent" />

          {/* Hero Content */}
          <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8 flex items-end gap-5">
            {/* Poster Thumbnail */}
            <div className="hidden sm:block w-28 h-40 shrink-0 rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-700/60 bg-slate-950">
              <img
                src={title.poster || 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?auto=format&fit=crop&w=400&q=80'}
                alt={title.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-2.5 flex-1 min-w-0">
              {/* Type & Badge */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center gap-1">
                  {isSeries ? <Tv className="w-3 h-3" /> : <Film className="w-3 h-3" />}
                  {isSeries ? 'TV Series' : 'Movie'}
                </span>

                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Watchmode Verified
                </span>

                {title.us_rating && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                    {title.us_rating}
                  </span>
                )}
              </div>

              {/* Title */}
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight line-clamp-2">
                {title.title}
              </h2>

              {/* Meta Info Row */}
              <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-300">
                {title.year && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                    {title.year} {title.end_year ? `- ${title.end_year}` : ''}
                  </span>
                )}

                {title.runtime_minutes ? (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {Math.floor(title.runtime_minutes / 60)}h {title.runtime_minutes % 60}m
                  </span>
                ) : null}

                {title.user_rating ? (
                  <span className="flex items-center gap-1 text-amber-400 font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    {title.user_rating.toFixed(1)} / 10
                  </span>
                ) : null}

                {title.genre_names && title.genre_names.length > 0 && (
                  <span className="text-slate-400 truncate">
                    {title.genre_names.slice(0, 3).join(' • ')}
                  </span>
                )}
              </div>

              {/* Quick Actions Row */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  onClick={toggleWatchlist}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                    isSavedInWatchlist
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'bg-slate-800/90 text-slate-200 hover:bg-slate-700 hover:text-white border border-slate-700'
                  }`}
                >
                  {isSavedInWatchlist ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                  {isSavedInWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
                </button>

                <button
                  onClick={handleShare}
                  className="px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  {copiedLink ? 'Link Copied!' : 'Share'}
                </button>

                {isAdmin && onImportToLibrary && (
                  <button
                    onClick={() => onImportToLibrary(title)}
                    className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/20"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Import to Library
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* MODAL TABS NAVIGATION */}
        <div className="flex items-center gap-1 sm:gap-2 px-5 sm:px-8 border-b border-slate-800 bg-slate-900/90 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('where_to_watch')}
            className={`py-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'where_to_watch'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Tv2 className="w-4 h-4" /> Where to Watch
            {sources.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-cyan-500/20 text-cyan-300">
                {sources.length}
              </span>
            )}
          </button>

          {isSeries && (
            <button
              onClick={() => setActiveTab('episodes')}
              className={`py-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'episodes'
                  ? 'border-cyan-400 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-4 h-4" /> Seasons & Episodes
            </button>
          )}

          {title.trailer && (
            <button
              onClick={() => setActiveTab('trailer')}
              className={`py-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'trailer'
                  ? 'border-cyan-400 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Play className="w-4 h-4" /> Official Trailer
            </button>
          )}

          {title.cast_crew && title.cast_crew.length > 0 && (
            <button
              onClick={() => setActiveTab('cast')}
              className={`py-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'cast'
                  ? 'border-cyan-400 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Info className="w-4 h-4" /> Cast & Info
            </button>
          )}
        </div>

        {/* TAB BODY / SCROLLABLE CONTENT */}
        <div className="p-5 sm:p-8 overflow-y-auto flex-1 space-y-6">
          
          {/* TAB 1: WHERE TO WATCH & PLAYBACK AVAILABILITY */}
          {activeTab === 'where_to_watch' && (
            <div className="space-y-6">
              
              {/* WATCH ON AGASOBANUYE PLAYBACK STATUS BOX */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black tracking-wider uppercase text-cyan-400 flex items-center gap-1.5">
                    <Film className="w-3.5 h-3.5" /> Watch on Agasobanuye
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                    Playback Status
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-200">
                      This movie is currently unavailable for playback on Agasobanuye.
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      To watch this title, choose from the verified official streaming platforms listed below under "Where to Watch".
                    </p>
                  </div>
                </div>
              </div>

              {/* Synopsis Section */}
              <div className="space-y-2">
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-400">Plot Overview</h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {title.plot_overview || 'No plot overview available for this title.'}
                </p>
              </div>

              {/* Streaming Availability Cards */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-black text-white flex items-center gap-2">
                      <Tv2 className="w-5 h-5 text-cyan-400" />
                      Streaming Availability & Official Watch Links
                    </h3>
                    <p className="text-xs text-slate-400">
                      Direct deep links to verified official platforms provided via Watchmode API
                    </p>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                    <button
                      onClick={() => setSourceFilter('all')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                        sourceFilter === 'all' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      All ({sources.length})
                    </button>
                    {subscriptionSources.length > 0 && (
                      <button
                        onClick={() => setSourceFilter('sub')}
                        className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                          sourceFilter === 'sub' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Subscription ({subscriptionSources.length})
                      </button>
                    )}
                    {freeSources.length > 0 && (
                      <button
                        onClick={() => setSourceFilter('free')}
                        className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                          sourceFilter === 'free' ? 'bg-cyan-400 text-slate-950 font-black shadow-[0_0_10px_#00e5ff]' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Free ({freeSources.length})
                      </button>
                    )}
                    {purchaseSources.length > 0 && (
                      <button
                        onClick={() => setSourceFilter('purchase')}
                        className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                          sourceFilter === 'purchase' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Rent/Buy ({purchaseSources.length})
                      </button>
                    )}
                  </div>
                </div>

                {loadingSources ? (
                  <div className="p-8 text-center rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                    <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs text-slate-400">Querying Watchmode streaming sources...</p>
                  </div>
                ) : filteredSources.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                    <p className="text-sm font-bold text-slate-300">No active streaming sources found for this filter.</p>
                    <p className="text-xs text-slate-500">Try selecting "All" or checking official provider apps in your region.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {filteredSources.map((src, index) => {
                      const isSub = src.type === 'sub';
                      const isFree = src.type === 'free';
                      const isBuy = src.type === 'purchase';

                      return (
                        <div
                          key={`${src.source_id}_${index}`}
                          className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between space-y-3 group"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-black text-white text-sm group-hover:text-cyan-300 transition-colors">
                                  {src.name}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                                    isSub
                                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                      : isFree
                                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  }`}
                                >
                                  {isSub ? 'Subscription' : isFree ? 'Free Stream' : 'Rent / Buy'}
                                </span>

                                {src.format && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                                    {src.format}
                                  </span>
                                )}

                                {src.price !== undefined && src.price !== null && (
                                  <span className="text-[11px] font-bold text-amber-400">
                                    ${src.price.toFixed(2)}
                                  </span>
                                )}
                              </div>
                            </div>

                            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
                              {src.region || 'GLOBAL'}
                            </span>
                          </div>

                          <a
                            href={src.web_url || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`w-full py-2 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all ${
                              isSub
                                ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/10'
                                : isFree
                                ? 'bg-cyan-400 hover:bg-cyan-300 text-slate-950 shadow-md shadow-cyan-500/20'
                                : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                            }`}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            {isSub ? `Stream on ${src.name}` : isFree ? `Watch Free on ${src.name}` : `View on ${src.name}`}
                          </a>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Compliance & Policy Footer Note */}
                <div className="p-3.5 rounded-2xl bg-slate-950/40 border border-slate-800/80 flex items-start gap-2.5 text-xs text-slate-400">
                  <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    Streaming availability, seasons, and deep links are securely retrieved via the official Watchmode API. Lionel Stream provides deep link navigation to authorized providers and does not re-stream or host protected media from third-party subscription networks.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SEASONS & EPISODES (TV SERIES) */}
          {activeTab === 'episodes' && isSeries && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-cyan-400" />
                  Seasons & Episode Guide
                </h3>

                {seasons.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-bold">Select Season:</span>
                    <select
                      value={selectedSeasonNumber}
                      onChange={(e) => setSelectedSeasonNumber(Number(e.target.value))}
                      className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-cyan-400"
                    >
                      {seasons.map((s) => (
                        <option key={s.id || s.season_number} value={s.season_number}>
                          {s.name || `Season ${s.season_number}`} {s.episode_count ? `(${s.episode_count} eps)` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {currentSeason ? (
                <div className="space-y-4">
                  {currentSeason.overview && (
                    <p className="text-xs text-slate-400 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                      {currentSeason.overview}
                    </p>
                  )}

                  {currentSeason.episodes && currentSeason.episodes.length > 0 ? (
                    <div className="space-y-2.5">
                      {currentSeason.episodes.map((ep) => (
                        <div
                          key={ep.id || ep.episode_number}
                          className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                  EP {ep.episode_number}
                                </span>
                                <h4 className="text-sm font-bold text-white">{ep.title}</h4>
                              </div>
                              {ep.air_date && (
                                <p className="text-[11px] text-slate-500 mt-0.5">Air date: {ep.air_date}</p>
                              )}
                            </div>
                          </div>

                          {ep.overview && (
                            <p className="text-xs text-slate-300 leading-relaxed">{ep.overview}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center rounded-2xl bg-slate-950/60 border border-slate-800 text-slate-400 text-xs">
                      Episodes list available on official streaming provider deep links.
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-400">No season details loaded for this title.</p>
              )}
            </div>
          )}

          {/* TAB 3: OFFICIAL TRAILER */}
          {activeTab === 'trailer' && (
            <div className="space-y-4">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Play className="w-5 h-5 text-cyan-400" />
                Official Trailer Preview
              </h3>

              {trailerEmbedUrl ? (
                <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-slate-800 shadow-2xl">
                  <iframe
                    src={trailerEmbedUrl}
                    title={`${title.title} Trailer`}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : title.trailer ? (
                <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-3">
                  <p className="text-sm text-slate-300">Watch the official trailer on YouTube:</p>
                  <a
                    href={title.trailer}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors"
                  >
                    <Play className="w-4 h-4 fill-white" /> Open Trailer in New Window
                  </a>
                </div>
              ) : (
                <p className="text-xs text-slate-400">No trailer URL available for this title.</p>
              )}
            </div>
          )}

          {/* TAB 4: CAST & INFO */}
          {activeTab === 'cast' && (
            <div className="space-y-6">
              {title.cast_crew && title.cast_crew.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-400">Top Cast</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {title.cast_crew.slice(0, 8).map((c, i) => (
                      <div key={c.id || i} className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                        <p className="text-xs font-black text-white truncate">{c.name}</p>
                        <p className="text-[11px] text-cyan-400 truncate">{c.character || c.role || 'Cast'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <span className="text-[11px] text-slate-500 block">Watchmode ID</span>
                  <span className="font-mono font-bold text-cyan-300">{title.id}</span>
                </div>
                {title.release_date && (
                  <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                    <span className="text-[11px] text-slate-500 block">Release Date</span>
                    <span className="font-bold text-white">{title.release_date}</span>
                  </div>
                )}
                {title.original_language && (
                  <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                    <span className="text-[11px] text-slate-500 block">Original Language</span>
                    <span className="font-bold text-white uppercase">{title.original_language}</span>
                  </div>
                )}
                {title.critic_score && (
                  <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                    <span className="text-[11px] text-slate-500 block">Critic Score</span>
                    <span className="font-bold text-cyan-400">{title.critic_score}%</span>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
