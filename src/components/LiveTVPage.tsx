import React, { useState, useEffect, useMemo } from 'react';
import {
  Tv,
  Users,
  Clock,
  Globe,
  ExternalLink,
  Search,
  Star,
  Play,
  X,
  RefreshCw,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { TVChannelItem } from '../types';
import { VideoPlayer } from './VideoPlayer';
import { HLSPlayer } from './HLSPlayer';
import { fetchIptvOrgChannels } from '../services/iptvService';

interface LiveTVPageProps {
  channels: TVChannelItem[];
  initialChannelId?: string;
  onBack?: () => void;
}

export const LiveTVPage: React.FC<LiveTVPageProps> = ({
  channels = [],
  initialChannelId,
}) => {
  const [iptvChannels, setIptvChannels] = useState<TVChannelItem[]>([]);
  const [isLoadingIptv, setIsLoadingIptv] = useState<boolean>(true);
  const [iptvError, setIptvError] = useState<string | null>(null);
  const [visibleLimit, setVisibleLimit] = useState<number>(80);

  // Merge local curated channels (HTTPS-only) with live iptv-org joined channels
  const allChannels = useMemo(() => {
    const curatedHttps = channels.filter(
      (c) => typeof c.streamUrl === 'string' && c.streamUrl.startsWith('https://')
    );
    const seenIds = new Set(curatedHttps.map((c) => c.id));
    const seenUrls = new Set(curatedHttps.map((c) => c.streamUrl));
    const extraIptv = iptvChannels.filter(
      (c) => !seenIds.has(c.id) && !seenUrls.has(c.streamUrl)
    );
    return [...curatedHttps, ...extraIptv];
  }, [channels, iptvChannels]);

  const [selectedChannelId, setSelectedChannelId] = useState<string>(
    initialChannelId || channels[0]?.id || ''
  );
  const [quickFilter, setQuickFilter] = useState<'RW' | 'SPORTS' | 'ALL'>('ALL');
  const [selectedCountry, setSelectedCountry] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [streamPlaybackError, setStreamPlaybackError] = useState<string | null>(null);

  const loadIptvFeed = async () => {
    setIsLoadingIptv(true);
    setIptvError(null);
    try {
      const res = await fetchIptvOrgChannels();
      setIptvChannels(res.channels);
      if (!selectedChannelId && res.channels.length > 0) {
        setSelectedChannelId(res.channels[0].id);
      }
    } catch (err: any) {
      setIptvError(err?.message || 'Unable to load public IPTV channel list');
    } finally {
      setIsLoadingIptv(false);
    }
  };

  useEffect(() => {
    loadIptvFeed();
  }, []);

  useEffect(() => {
    if (initialChannelId) {
      setSelectedChannelId(initialChannelId);
    }
  }, [initialChannelId]);

  const activeChannel =
    allChannels.find((c) => c.id === selectedChannelId) || allChannels[0];

  // Dynamic Country & Category options from joined dataset
  const availableCountries = useMemo(() => {
    const counts = new Map<string, number>();
    for (const ch of allChannels) {
      const code = (ch.countryCode || ch.country || 'INT').toUpperCase();
      counts.set(code, (counts.get(code) || 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => {
        if (a[0] === 'RW') return -1;
        if (b[0] === 'RW') return 1;
        return b[1] - a[1];
      })
      .slice(0, 60);
  }, [allChannels]);

  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    for (const ch of allChannels) {
      const parts = (ch.category || 'General').split(',').map((s) => s.trim());
      parts.forEach((p) => p && cats.add(p));
    }
    return Array.from(cats).sort();
  }, [allChannels]);

  const filteredChannels = useMemo(() => {
    return allChannels.filter((c) => {
      const cCode = (c.countryCode || '').toUpperCase();
      const cCountry = (c.country || '').toLowerCase();
      const cCat = (c.category || '').toLowerCase();
      const cName = (c.name || '').toLowerCase();

      if (quickFilter === 'RW' && cCode !== 'RW' && !cCountry.includes('rwanda')) {
        return false;
      }
      if (quickFilter === 'SPORTS' && !cCat.includes('sport') && !cName.includes('sport')) {
        return false;
      }
      if (selectedCountry !== 'ALL' && cCode !== selectedCountry) {
        return false;
      }
      if (selectedCategory !== 'ALL' && !cCat.includes(selectedCategory.toLowerCase())) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return cName.includes(q) || cCountry.includes(q) || cCode.toLowerCase().includes(q) || cCat.includes(q);
      }
      return true;
    });
  }, [allChannels, quickFilter, selectedCountry, selectedCategory, searchQuery]);

  const displayedChannels = useMemo(
    () => filteredChannels.slice(0, visibleLimit),
    [filteredChannels, visibleLimit]
  );

  const handleSelectChannel = (ch: TVChannelItem) => {
    setSelectedChannelId(ch.id);
    setStreamPlaybackError(null);
  };

  const handleNextWorkingChannel = () => {
    const idx = filteredChannels.findIndex((c) => c.id === activeChannel?.id);
    const next = filteredChannels[(idx + 1) % Math.max(1, filteredChannels.length)];
    if (next) {
      handleSelectChannel(next);
    }
  };

  const isFavorite = activeChannel ? favorites.includes(activeChannel.id) : false;
  const toggleFavorite = () => {
    if (!activeChannel) return;
    setFavorites((prev) =>
      prev.includes(activeChannel.id)
        ? prev.filter((id) => id !== activeChannel.id)
        : [...prev, activeChannel.id]
    );
  };

  const isHlsStream = activeChannel
    ? activeChannel.streamUrl.includes('.m3u8') || activeChannel.streamType === 'hls'
    : true;

  if (!activeChannel && isLoadingIptv) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center gap-3 text-slate-300">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        <p className="text-sm font-semibold">Loading live HTTPS channels from iptv-org...</p>
      </div>
    );
  }

  if (!activeChannel) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center gap-3 text-slate-400">
        <Tv className="w-10 h-10 text-cyan-400" />
        <p className="text-sm font-semibold">No Live TV channels available.</p>
        <button
          onClick={loadIptvFeed}
          className="px-4 py-2 rounded-xl bg-cyan-400 text-slate-950 text-xs font-bold cursor-pointer"
        >
          Reload Channels
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1650px] mx-auto px-3 sm:px-6 lg:px-8 lg:pl-16 py-6 space-y-6 select-none">
      {/* Top Header Row with Search Bar, Filter Buttons & Dropdowns */}
      <div className="space-y-4 border-b border-cyan-900/40 pb-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1 flex-wrap">
              <div className="w-9 h-9 rounded-2xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center">
                <Tv className="w-4 h-4 text-cyan-400" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide">
                TELEVIZIYO LIVE / IPTV-ORG STREAMING
              </h1>
              <span className="text-xs font-mono font-bold text-cyan-300 tabular-nums">
                {allChannels.length.toLocaleString()} HTTPS CHANNELS
              </span>
              {isLoadingIptv && (
                <span className="text-xs text-cyan-400 flex items-center gap-1">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Syncing iptv-org...
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Live HTTPS-verified streams joined from iptv-org (channels, streams & logos) + Rwandan national broadcasts
            </p>
          </div>

          {/* Search Bar + Sync */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <Search className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Shakisha televiziyo / Search channels..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setVisibleLimit(80);
                }}
                className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-[#061022] border border-cyan-900/50 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full bg-slate-800 hover:bg-cyan-500 text-slate-300 hover:text-slate-950 transition-colors cursor-pointer"
                  title="Clear TV search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              onClick={loadIptvFeed}
              disabled={isLoadingIptv}
              className="p-2.5 rounded-xl bg-[#061022] border border-cyan-900/50 hover:border-cyan-400 text-cyan-300 transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh iptv-org channels"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingIptv ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Requested Filter Buttons ("Rwanda (RW)", "Sports", "All Countries") + Country/Category Dropdowns */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            {[
              { id: 'RW' as const, label: 'Rwanda (RW)' },
              { id: 'SPORTS' as const, label: 'Sports' },
              { id: 'ALL' as const, label: 'All Countries' },
            ].map((btn) => {
              const active = quickFilter === btn.id;
              return (
                <button
                  key={btn.id}
                  onClick={() => {
                    setQuickFilter(btn.id);
                    if (btn.id === 'RW') setSelectedCountry('RW');
                    else setSelectedCountry('ALL');
                    if (btn.id === 'SPORTS') setSelectedCategory('Sports');
                    else setSelectedCategory('ALL');
                    setVisibleLimit(80);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-gradient-to-r from-cyan-400 to-blue-600 text-slate-950 font-black shadow-[0_0_16px_rgba(0,240,255,0.45)]'
                      : 'bg-[#061022] text-slate-300 hover:text-white border border-cyan-900/40 hover:border-cyan-400/50'
                  }`}
                >
                  {btn.label}
                </button>
              );
            })}
          </div>

          {/* Country & Category Dropdowns */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              aria-label="Filter by country"
              value={selectedCountry}
              onChange={(e) => {
                setSelectedCountry(e.target.value);
                setQuickFilter(e.target.value === 'RW' ? 'RW' : 'ALL');
                setVisibleLimit(80);
              }}
              className="px-3 py-2 rounded-xl bg-[#061022] border border-cyan-900/50 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 cursor-pointer"
            >
              <option value="ALL">Country: All ({allChannels.length})</option>
              {availableCountries.map(([code, count]) => (
                <option key={code} value={code}>
                  {code === 'RW' ? 'Rwanda (RW)' : code} ({count})
                </option>
              ))}
            </select>

            <select
              aria-label="Filter by category"
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setVisibleLimit(80);
              }}
              className="px-3 py-2 rounded-xl bg-[#061022] border border-cyan-900/50 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 cursor-pointer"
            >
              <option value="ALL">Category: All Categories</option>
              {availableCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <span className="text-xs text-slate-400 font-mono tabular-nums pl-1">
              {filteredChannels.length} channels
            </span>
          </div>
        </div>

        {iptvError && (
          <div className="p-3 rounded-xl bg-amber-950/50 border border-amber-500/40 text-amber-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>{iptvError} — showing verified local broadcasts.</span>
          </div>
        )}
      </div>

      {/* Main Grid: Left is HLS Video Player + Channel Info; Right is Clickable Channel Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN (Cols 1-8): LIVE HLS.JS PLAYER & CHANNEL INFO */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="relative rounded-2xl md:rounded-3xl overflow-hidden bg-black aspect-video border border-cyan-500/35 shadow-[0_0_30px_rgba(0,240,255,0.18)]">
            {isHlsStream ? (
              <HLSPlayer
                key={activeChannel.id}
                streamUrl={activeChannel.streamUrl}
                title={activeChannel.name}
                poster={activeChannel.logo || activeChannel.logoUrl}
                autoPlay={true}
                onErrorChange={(err) => setStreamPlaybackError(err)}
              />
            ) : (
              <VideoPlayer
                key={activeChannel.id}
                streamUrl={activeChannel.streamUrl}
                title={activeChannel.name}
                subtitle={`Live Broadcast · ${activeChannel.country}`}
                poster={activeChannel.logo || activeChannel.logoUrl}
                autoPlay={true}
              />
            )}

            {streamPlaybackError && filteredChannels.length > 1 && (
              <div className="absolute top-3 right-3 z-30 flex items-center gap-2">
                <button
                  onClick={handleNextWorkingChannel}
                  className="px-3 py-1.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-black shadow-lg cursor-pointer"
                >
                  Next Channel
                </button>
              </div>
            )}
          </div>

          {/* Active Channel Details Header */}
          <div className="p-5 rounded-3xl bg-[#060e20] border border-cyan-900/40 shadow-xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-cyan-900/50 p-1.5 flex items-center justify-center shrink-0">
                <img
                  src={activeChannel.logo || activeChannel.logoUrl || '/favicon.svg'}
                  alt={activeChannel.name}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/favicon.svg';
                  }}
                  className="w-full h-full object-contain rounded-xl"
                />
              </div>

              <div>
                <h2 className="text-xl font-black text-white">{activeChannel.name}</h2>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 flex-wrap">
                  <span className="font-semibold text-white">{activeChannel.country}</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-cyan-400 font-semibold">{activeChannel.category}</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-slate-300 flex items-center gap-1 tabular-nums">
                    <Users className="w-3.5 h-3.5 text-cyan-400" />
                    {(activeChannel.viewerCount || 4200).toLocaleString()} watching
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleFavorite}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  isFavorite
                    ? 'bg-cyan-400 text-slate-950 font-black'
                    : 'bg-slate-950 border border-cyan-900/50 text-slate-300 hover:text-white'
                }`}
              >
                <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
                <span>{isFavorite ? 'Saved' : 'Favorite'}</span>
              </button>

              {activeChannel.websiteUrl && (
                <a
                  href={activeChannel.websiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-400 hover:text-slate-950 text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Official Portal</span>
                </a>
              )}
            </div>
          </div>

          {/* Current Broadcast Program */}
          <div className="p-5 rounded-3xl bg-[#060e20]/70 border border-cyan-900/30 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4" /> Current Broadcast
              </span>
              <span className="font-mono text-slate-400 flex items-center gap-1">
                <Globe className="w-3.5 h-3.5" /> HTTPS Live Stream
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-cyan-900/40">
              <p className="text-sm font-bold text-white">
                {activeChannel.currentProgram || `${activeChannel.name} Live`}
              </p>
              {activeChannel.description && (
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {activeChannel.description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (Cols 9-12): CLICKABLE CHANNELS GRID / SIDEBAR */}
        <div className="lg:col-span-4 flex flex-col gap-3 bg-[#060e20] border border-cyan-900/40 rounded-3xl p-4 shadow-2xl">
          <div className="flex items-center justify-between border-b border-cyan-900/30 pb-3">
            <span className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
              <Tv className="w-4 h-4 text-cyan-400" /> Channel Directory
            </span>
            <span className="text-[11px] text-cyan-400 font-mono font-bold tabular-nums">
              {filteredChannels.length} available
            </span>
          </div>

          <div className="space-y-2 max-h-[660px] overflow-y-auto no-scrollbar pr-1">
            {displayedChannels.length > 0 ? (
              <>
                {displayedChannels.map((ch) => {
                  const isSelected = ch.id === activeChannel.id;
                  return (
                    <button
                      type="button"
                      key={ch.id}
                      onClick={() => handleSelectChannel(ch)}
                      className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 group ${
                        isSelected
                          ? 'bg-gradient-to-r from-[#081d3d] to-[#041128] border-cyan-400 shadow-[0_0_16px_rgba(0,240,255,0.25)]'
                          : 'bg-slate-950/70 border-slate-800/80 hover:border-cyan-500/50 hover:bg-slate-900'
                      }`}
                    >
                      {/* Channel Logo */}
                      <div className="w-11 h-11 rounded-xl bg-slate-900 border border-slate-800 p-1 flex items-center justify-center shrink-0">
                        <img
                          src={ch.logo || ch.logoUrl || '/favicon.svg'}
                          alt={ch.name}
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = '/favicon.svg';
                          }}
                          className="w-full h-full object-contain rounded-lg"
                        />
                      </div>

                      {/* Channel Name & Unboxed Metadata */}
                      <div className="flex-1 min-w-0">
                        <h3
                          className={`text-xs font-black truncate ${
                            isSelected ? 'text-white' : 'text-slate-200 group-hover:text-cyan-300'
                          }`}
                        >
                          {ch.name}
                        </h3>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {ch.category} · {ch.countryCode || ch.country}
                        </p>
                      </div>

                      <div
                        className={`p-2 rounded-xl shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-cyan-400 text-slate-950'
                            : 'bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-400 group-hover:text-slate-950'
                        }`}
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </div>
                    </button>
                  );
                })}

                {filteredChannels.length > visibleLimit && (
                  <button
                    onClick={() => setVisibleLimit((prev) => prev + 80)}
                    className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-cyan-900/50 text-xs font-bold text-cyan-300 cursor-pointer"
                  >
                    Load More Channels ({filteredChannels.length - visibleLimit} remaining)
                  </button>
                )}
              </>
            ) : (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <Tv className="w-8 h-8 text-cyan-400 mx-auto opacity-60" />
                <p className="text-xs font-bold">No channels match your filter.</p>
                <button
                  onClick={() => {
                    setQuickFilter('ALL');
                    setSelectedCountry('ALL');
                    setSelectedCategory('ALL');
                    setSearchQuery('');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 text-cyan-400 text-xs font-bold border border-cyan-900/40 cursor-pointer"
                >
                  Show All Channels
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
