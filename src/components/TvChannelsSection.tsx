import React, { useState, useEffect, useMemo } from 'react';
import { Radio, Users, Play, Search, LayoutGrid, BarChart2, Table, Tv, Signal, CheckCircle2, Star, RefreshCw, Lock, ArrowUpDown, Filter, Globe, Sparkles, Maximize2 } from 'lucide-react';
import { TvChannel } from '../types';
import { HLSPlayer } from './HLSPlayer';

interface TvChannelsSectionProps {
  channels: TvChannel[];
  onSelectChannel: (channel: TvChannel) => void;
  onRefreshCatalogue?: () => void;
  isSyncingIPTV?: boolean;
  discoveredCount?: number;
  rwandaCount?: number;
  africaCount?: number;
  duplicatesRemoved?: number;
  lastSyncTime?: string | null;
}

export function getCountryFlag(country: string = '', countryCode: string = ''): string {
  const code = countryCode.toUpperCase();
  const cLower = country.toLowerCase();
  if (code === 'RW' || cLower.includes('rwanda')) return '🇷🇼';
  if (code === 'KE' || cLower.includes('kenya')) return '🇰🇪';
  if (code === 'UG' || cLower.includes('uganda')) return '🇺🇬';
  if (code === 'TZ' || cLower.includes('tanzania')) return '🇹🇿';
  if (code === 'BI' || cLower.includes('burundi')) return '🇧🇮';
  if (code === 'NG' || cLower.includes('nigeria')) return '🇳🇬';
  if (code === 'GH' || cLower.includes('ghana')) return '🇬🇭';
  if (code === 'ZA' || cLower.includes('south africa')) return '🇿🇦';
  if (code === 'ZM' || cLower.includes('zambia')) return '🇿🇲';
  if (code === 'ZW' || cLower.includes('zimbabwe')) return '🇿🇼';
  if (code === 'MW' || cLower.includes('malawi')) return '🇲🇼';
  if (code === 'ET' || cLower.includes('ethiopia')) return '🇪🇹';
  if (code === 'CD' || cLower.includes('congo')) return '🇨🇩';
  if (code === 'CM' || cLower.includes('cameroon')) return '🇨🇲';
  if (code === 'SN' || cLower.includes('senegal')) return '🇸🇳';
  if (code === 'CI' || cLower.includes('ivory') || cLower.includes('côte')) return '🇨🇮';
  if (code === 'BF' || cLower.includes('burkina')) return '🇧🇫';
  if (code === 'BJ' || cLower.includes('benin')) return '🇧🇯';
  if (code === 'GA' || cLower.includes('gabon')) return '🇬🇦';
  if (code === 'GN' || cLower.includes('guinea')) return '🇬🇳';
  if (code === 'ML' || cLower.includes('mali')) return '🇲🇱';
  if (code === 'TG' || cLower.includes('togo')) return '🇹🇬';
  if (code === 'AO' || cLower.includes('angola')) return '🇦🇴';
  if (code === 'MZ' || cLower.includes('mozambique')) return '🇲🇿';
  if (code === 'NA' || cLower.includes('namibia')) return '🇳🇦';
  if (code === 'SO' || cLower.includes('somalia')) return '🇸🇴';
  if (code === 'EG' || cLower.includes('egypt')) return '🇪🇬';
  if (code === 'MA' || cLower.includes('morocco')) return '🇲🇦';
  if (code === 'DZ' || cLower.includes('algeria')) return '🇩🇿';
  if (code === 'TN' || cLower.includes('tunisia')) return '🇹🇳';
  return '🌍';
}

export const TvChannelsSection: React.FC<TvChannelsSectionProps> = ({
  channels = [],
  onSelectChannel,
  onRefreshCatalogue,
  isSyncingIPTV = false,
  discoveredCount = 0,
  rwandaCount = 10,
  africaCount = 550,
  duplicatesRemoved = 10,
  lastSyncTime
}) => {
  const [selectedProvider, setSelectedProvider] = useState<'All' | 'local' | 'startimes' | 'canalplus' | 'azam'>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedCountry, setSelectedCountry] = useState<string>('All');
  const [selectedNetwork, setSelectedNetwork] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'chart' | 'satellite'>('grid');
  const [sortBy, setSortBy] = useState<'default' | 'az' | 'za' | 'country' | 'category'>('default');
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(false);
  const [onlyFavorites, setOnlyFavorites] = useState<boolean>(false);
  const [displayLimit, setDisplayLimit] = useState<number>(28);
  const [activePlayingChannel, setActivePlayingChannel] = useState<TvChannel | null>(null);

  useEffect(() => {
    if (!activePlayingChannel && channels && channels.length > 0) {
      setActivePlayingChannel(channels[0]);
    }
  }, [channels, activePlayingChannel]);

  const networks = [
    'All',
    'RBA Network',
    'Canal+ Africa',
    'StarTimes Africa',
    'Azam TV',
    'DStv / MultiChoice',
    'Public Broadcaster',
    'Independent'
  ];

  // Favorites state persisted in localStorage
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('rwanda_iptv_favorites_v1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('rwanda_iptv_favorites_v1', JSON.stringify(favorites));
    } catch (e) {
      console.warn('Failed to save favorites to localStorage:', e);
    }
  }, [favorites]);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const categories = [
    'All',
    'Rwandan TV 🇷🇼',
    'News',
    'Sports',
    'Movies',
    'Music',
    'Kids',
    'Documentary',
    'Religious',
    'Entertainment',
    'African'
  ];

  const popularCountries = [
    { code: 'All', name: 'All Countries', flag: '🌍' },
    { code: 'RW', name: 'Rwanda', flag: '🇷🇼' },
    { code: 'KE', name: 'Kenya', flag: '🇰🇪' },
    { code: 'UG', name: 'Uganda', flag: '🇺🇬' },
    { code: 'TZ', name: 'Tanzania', flag: '🇹🇿' },
    { code: 'BI', name: 'Burundi', flag: '🇧🇮' },
    { code: 'NG', name: 'Nigeria', flag: '🇳🇬' },
    { code: 'GH', name: 'Ghana', flag: '🇬🇭' },
    { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
    { code: 'ZM', name: 'Zambia', flag: '🇿🇲' },
    { code: 'ZW', name: 'Zimbabwe', flag: '🇿🇼' },
    { code: 'MW', name: 'Malawi', flag: '🇲🇼' },
    { code: 'ET', name: 'Ethiopia', flag: '🇪🇹' },
    { code: 'CD', name: 'DR Congo', flag: '🇨🇩' },
    { code: 'CM', name: 'Cameroon', flag: '🇨🇲' },
    { code: 'SN', name: 'Senegal', flag: '🇸🇳' },
    { code: 'CI', name: 'Ivory Coast', flag: '🇨🇮' },
    { code: 'EG', name: 'Egypt', flag: '🇪🇬' },
    { code: 'MA', name: 'Morocco', flag: '🇲🇦' }
  ];

  // Search & Filter Logic
  const filteredChannels = useMemo(() => {
    let result = (channels || []).filter((ch) => {
      // Provider Filter
      if (selectedProvider !== 'All') {
        const prov = ch.provider;
        if (prov) {
          if (prov !== selectedProvider) return false;
        } else {
          // Fallback matching by network/broadcaster name
          const netName = (ch.network || ch.broadcaster || '').toLowerCase();
          if (selectedProvider === 'local' && ch.country !== 'Rwanda') return false;
          if (selectedProvider === 'startimes' && !netName.includes('startimes')) return false;
          if (selectedProvider === 'canalplus' && !netName.includes('canal')) return false;
          if (selectedProvider === 'azam' && !netName.includes('azam')) return false;
        }
      }

      // Favorites filter
      if (onlyFavorites && !favorites.includes(ch.id)) return false;

      // Category Filter
      if (selectedCategory !== 'All') {
        if (selectedCategory === 'Rwandan TV 🇷🇼') {
          if (ch.country !== 'Rwanda' && ch.category !== 'Rwandan TV 🇷🇼') return false;
        } else if (ch.category !== selectedCategory) {
          return false;
        }
      }

      // Country Filter
      if (selectedCountry !== 'All') {
        if (selectedCountry === 'RW' && ch.country !== 'Rwanda') return false;
        if (selectedCountry !== 'RW' && ch.countryCode !== selectedCountry && !ch.country.toLowerCase().includes(selectedCountry.toLowerCase())) return false;
      }

      // Network Filter
      if (selectedNetwork !== 'All') {
        const netLower = selectedNetwork.toLowerCase();
        const chNet = (ch.network || '').toLowerCase();
        const chBcast = (ch.broadcaster || '').toLowerCase();
        const chPlat = (ch.platform || '').toLowerCase();
        if (!chNet.includes(netLower) && !chBcast.includes(netLower) && !chPlat.includes(netLower)) {
          return false;
        }
      }

      // Verified Filter
      if (verifiedOnly && (!ch.isVerified || !ch.embeddingAllowed)) return false;

      // Comprehensive Global Search Query
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const matchName = ch.name.toLowerCase().includes(q);
        const matchAlt = ch.altName ? ch.altName.toLowerCase().includes(q) : false;
        const matchAltNames = ch.alternativeNames ? ch.alternativeNames.toLowerCase().includes(q) : false;
        const matchCountry = ch.country.toLowerCase().includes(q);
        const matchCountryCode = ch.countryCode ? ch.countryCode.toLowerCase().includes(q) : false;
        const matchCategory = ch.category.toLowerCase().includes(q);
        const matchLang = ch.language ? ch.language.toLowerCase().includes(q) : false;
        const matchProg = ch.currentProgram ? ch.currentProgram.toLowerCase().includes(q) : false;
        const matchDesc = ch.description ? ch.description.toLowerCase().includes(q) : false;
        const matchNetwork = ch.network ? ch.network.toLowerCase().includes(q) : false;
        const matchBroadcaster = ch.broadcaster ? ch.broadcaster.toLowerCase().includes(q) : false;
        const matchPlatform = ch.platform ? ch.platform.toLowerCase().includes(q) : false;
        const matchStatus = ch.status ? ch.status.toLowerCase().includes(q) : false;
        const matchSourceType = ch.sourceType ? ch.sourceType.toLowerCase().includes(q) : false;

        if (
          !matchName &&
          !matchAlt &&
          !matchAltNames &&
          !matchCountry &&
          !matchCountryCode &&
          !matchCategory &&
          !matchLang &&
          !matchProg &&
          !matchDesc &&
          !matchNetwork &&
          !matchBroadcaster &&
          !matchPlatform &&
          !matchStatus &&
          !matchSourceType
        ) {
          return false;
        }
      }

      return true;
    });

    // Sort Logic
    return result.sort((a, b) => {
      if (sortBy === 'az') return a.name.localeCompare(b.name);
      if (sortBy === 'za') return b.name.localeCompare(a.name);
      if (sortBy === 'country') return a.country.localeCompare(b.country);
      if (sortBy === 'category') return a.category.localeCompare(b.category);

      // Default sort: Rwanda channels first, verified channels first
      const aIsRw = a.country === 'Rwanda' || a.category === 'Rwandan TV 🇷🇼';
      const bIsRw = b.country === 'Rwanda' || b.category === 'Rwandan TV 🇷🇼';
      if (aIsRw && !bIsRw) return -1;
      if (!aIsRw && bIsRw) return 1;

      if (a.isVerified && !b.isVerified) return -1;
      if (!a.isVerified && b.isVerified) return 1;

      return 0;
    });
  }, [channels, selectedProvider, selectedCategory, selectedCountry, selectedNetwork, searchQuery, sortBy, verifiedOnly, onlyFavorites, favorites]);

  // Total count for badges
  const totalRwandaChannels = useMemo(() => {
    return (channels || []).filter((c) => c?.country === 'Rwanda' || c?.category === 'Rwandan TV 🇷🇼').length;
  }, [channels]);

  const displayedChannels = filteredChannels.slice(0, displayLimit);

  return (
    <section className="my-8 px-4 lg:px-8 max-w-7xl mx-auto">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/40 uppercase tracking-widest flex items-center gap-1">
              <Radio className="w-3 h-3 text-amber-400 animate-pulse" /> 24/7 Satellite Feed
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 uppercase tracking-widest flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-cyan-300" /> {totalRwandaChannels} Rwanda Stations
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 uppercase tracking-widest flex items-center gap-1">
              <Globe className="w-3 h-3 text-cyan-300" /> {channels.length} Total African Index
            </span>
            {onRefreshCatalogue && (
              <button
                onClick={onRefreshCatalogue}
                disabled={isSyncingIPTV}
                className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 hover:bg-amber-500/40 border border-amber-500/40 uppercase tracking-widest flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                title="Refresh IPTV-org M3U playlist catalogue"
              >
                <RefreshCw className={`w-3 h-3 text-amber-400 ${isSyncingIPTV ? 'animate-spin' : ''}`} />
                <span>{isSyncingIPTV ? 'Syncing M3U...' : 'Sync IPTV-org Catalogue'}</span>
              </button>
            )}
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            Live TV & Rwanda Broadcast Center
          </h2>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Access authorized streams from Kigali, East Africa, and global networks in HD.
          </p>
        </div>

        {/* Global Search Bar & View Mode Switcher */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="🔎 Search channels (Name, Country, Category, Language)..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setDisplayLimit(28);
              }}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* View Switcher Controls */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              title="Grid Cards View"
              className={`p-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                viewMode === 'grid' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden lg:inline text-[11px]">Grid</span>
            </button>

            <button
              onClick={() => setViewMode('chart')}
              title="EPG Schedule Chart View"
              className={`p-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                viewMode === 'chart' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart2 className="w-4 h-4" />
              <span className="hidden lg:inline text-[11px]">EPG Schedule</span>
            </button>

            <button
              onClick={() => setViewMode('satellite')}
              title="Satellite Transponder Table View"
              className={`p-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                viewMode === 'satellite' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Table className="w-4 h-4" />
              <span className="hidden lg:inline text-[11px]">Directory</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Reference Split View Live TV Stage */}
      {activePlayingChannel && (
        <div className="mb-10 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-950/90 p-4 md:p-6 rounded-3xl border border-slate-800/90 shadow-2xl backdrop-blur-xl">
          {/* Left Video Stage Player (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-video border border-slate-800/80 shadow-2xl">
              {activePlayingChannel.format === 'youtube' || (activePlayingChannel.iframeEmbedUrl && activePlayingChannel.iframeEmbedUrl.includes('youtube')) ? (
                <iframe
                  src={
                    activePlayingChannel.iframeEmbedUrl
                      ? activePlayingChannel.iframeEmbedUrl.includes('?')
                        ? `${activePlayingChannel.iframeEmbedUrl}&autoplay=1&mute=1&modestbranding=1&rel=0`
                        : `${activePlayingChannel.iframeEmbedUrl}?autoplay=1&mute=1&modestbranding=1&rel=0`
                      : 'https://www.youtube.com/embed/live_stream?channel=UCyRvjnhiC0MOXWS-7COPtyQ&autoplay=1&mute=1&modestbranding=1&rel=0'
                  }
                  title={activePlayingChannel.name}
                  className="w-full h-full"
                  style={{ border: 'none' }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : activePlayingChannel.format === 'iframe' || activePlayingChannel.iframeUrl ? (
                <iframe
                  src={activePlayingChannel.iframeUrl || activePlayingChannel.iframeEmbedUrl || activePlayingChannel.websiteUrl}
                  title={activePlayingChannel.name}
                  className="w-full h-full"
                  style={{ border: 'none' }}
                  allow="autoplay; fullscreen; encrypted-media"
                  allowFullScreen
                />
              ) : (
                <HLSPlayer
                  streamUrl={activePlayingChannel.streamUrl || ''}
                  autoPlay={true}
                  title={activePlayingChannel.name}
                  poster={activePlayingChannel.logoUrl || activePlayingChannel.logo}
                />
              )}
            </div>

            {/* Active Channel Details Header */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img
                  src={activePlayingChannel.logoUrl || activePlayingChannel.logo}
                  alt={activePlayingChannel.name}
                  className="w-12 h-12 rounded-xl object-cover border border-slate-700 bg-slate-950 p-1 shrink-0"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-white">{activePlayingChannel.name}</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-600 text-white flex items-center gap-1 shadow-md shadow-red-600/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> LIVE
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {activePlayingChannel.description || `Live stream from ${activePlayingChannel.name}.`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => toggleFavorite(activePlayingChannel.id, e)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    favorites.includes(activePlayingChannel.id)
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'bg-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>{favorites.includes(activePlayingChannel.id) ? 'Saved' : 'Favorite'}</span>
                </button>
                <button
                  onClick={() => onSelectChannel(activePlayingChannel)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-400 hover:bg-cyan-300 text-slate-950 transition-all flex items-center gap-1 shadow-md shadow-cyan-500/20"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Full Cinema Mode</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Sidebar Channel List Directory (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-3 max-h-[580px] overflow-hidden">
            {/* Sidebar Search Input */}
            <div className="relative">
              <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search for channels or shows..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>

            {/* Red Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
              {[
                { label: 'Rwandan Channels', val: 'Rwandan TV 🇷🇼' },
                { label: 'All', val: 'All' },
                { label: 'Movies', val: 'Movies' },
                { label: 'Sports', val: 'Sports' },
                { label: 'News', val: 'News' }
              ].map((pill) => {
                const isActive = selectedCategory === pill.val;
                return (
                  <button
                    key={pill.label}
                    onClick={() => setSelectedCategory(pill.val)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-red-600 text-white font-black shadow-md shadow-red-600/30'
                        : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {pill.label}
                  </button>
                );
              })}
            </div>

            {/* Scrollable Channel Cards */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 no-scrollbar">
              {filteredChannels.slice(0, 35).map((ch) => {
                const isCurrent = activePlayingChannel?.id === ch.id;
                return (
                  <div
                    key={ch.id}
                    onClick={() => setActivePlayingChannel(ch)}
                    className={`p-3 rounded-2xl flex items-center gap-3 cursor-pointer transition-all border ${
                      isCurrent
                        ? 'bg-cyan-500/15 border-cyan-400/80 text-white shadow-lg shadow-cyan-500/10'
                        : 'bg-slate-900/80 border-slate-800/80 hover:border-slate-700 text-slate-300 hover:bg-slate-850'
                    }`}
                  >
                    <div className="relative w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center p-1">
                      <img
                        src={ch.logoUrl || ch.logo}
                        alt={ch.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                      {isCurrent && (
                        <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                      )}
                    </div>

                    <div className="overflow-hidden flex-1">
                      <h4 className="text-xs font-extrabold text-white truncate">{ch.name}</h4>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {ch.description || `Live stream from ${ch.name}`}
                      </p>
                    </div>

                    {isCurrent ? (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-cyan-500/20 text-cyan-400 border border-cyan-400/40">
                        PLAYING
                      </span>
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-white">
                        <Play className="w-3 h-3 fill-current ml-0.5" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Top-Level Decoder Provider Toggle System */}
      <div className="mb-6 bg-slate-950 p-2 rounded-2xl border border-slate-800 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar shadow-2xl">
        <div className="flex items-center gap-1.5 shrink-0 px-2 py-1">
          <Tv className="w-4 h-4 text-amber-400 animate-pulse" />
          <span className="text-xs font-black text-amber-400 uppercase tracking-wider hidden sm:inline">DECODER PACKAGES:</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <button
            onClick={() => {
              setSelectedProvider('All');
              setDisplayLimit(28);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all shrink-0 flex items-center gap-2 ${
              selectedProvider === 'All'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 scale-105'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-850 hover:text-white border border-slate-800'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>All Channels</span>
          </button>

          <button
            onClick={() => {
              setSelectedProvider('local');
              setDisplayLimit(28);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all shrink-0 flex items-center gap-2 ${
              selectedProvider === 'local'
                ? 'bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20 scale-105'
                : 'bg-cyan-950/40 text-cyan-300 hover:bg-cyan-900/60 border border-cyan-800/60'
            }`}
          >
            <span>🇷🇼 Local FTA</span>
            <span className="bg-slate-950/60 text-cyan-300 px-1.5 py-0.5 rounded text-[10px] font-mono">Pack</span>
          </button>

          <button
            onClick={() => {
              setSelectedProvider('startimes');
              setDisplayLimit(28);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all shrink-0 flex items-center gap-2 ${
              selectedProvider === 'startimes'
                ? 'bg-orange-500 text-slate-950 shadow-lg shadow-orange-500/20 scale-105'
                : 'bg-blue-950/60 text-orange-400 hover:bg-blue-900/80 border border-orange-500/40'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-orange-400 animate-ping" />
            <span>StarTimes Pack</span>
          </button>

          <button
            onClick={() => {
              setSelectedProvider('canalplus');
              setDisplayLimit(28);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all shrink-0 flex items-center gap-2 ${
              selectedProvider === 'canalplus'
                ? 'bg-white text-slate-950 shadow-lg shadow-white/20 scale-105 font-extrabold'
                : 'bg-zinc-900 text-zinc-200 hover:bg-zinc-800 border border-zinc-700'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>Canal+ Pack</span>
          </button>

          <button
            onClick={() => {
              setSelectedProvider('azam');
              setDisplayLimit(28);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all shrink-0 flex items-center gap-2 ${
              selectedProvider === 'azam'
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20 scale-105'
                : 'bg-cyan-950/60 text-cyan-300 hover:bg-cyan-900/80 border border-cyan-500/40'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>Azam Hub</span>
          </button>
        </div>
      </div>

      {/* Filter & Sort Controls Panel */}
      <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 mb-6 flex flex-col gap-3">
        {/* Row 1: Quick Action Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                setSelectedCountry('RW');
                setSelectedCategory('All');
                setOnlyFavorites(false);
                setDisplayLimit(28);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                selectedCountry === 'RW'
                  ? 'bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <span>🇷🇼 Only Rwanda TVs</span>
              <span className="bg-slate-950/40 px-1.5 py-0.5 rounded text-[10px]">{totalRwandaChannels}</span>
            </button>

            <button
              onClick={() => {
                setOnlyFavorites(!onlyFavorites);
                setDisplayLimit(28);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                onlyFavorites
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${onlyFavorites ? 'fill-current text-slate-950' : 'text-amber-400'}`} />
              <span>My Saved Channels</span>
              <span className="bg-slate-950/40 px-1.5 py-0.5 rounded text-[10px]">{favorites.length}</span>
            </button>

            <button
              onClick={() => setVerifiedOnly(!verifiedOnly)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                verifiedOnly
                  ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Verified Playable Only</span>
            </button>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 flex items-center gap-1 font-semibold">
              <ArrowUpDown className="w-3.5 h-3.5 text-amber-400" /> Sort:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-950 border border-slate-700 text-white text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-amber-500"
            >
              <option value="default">Default (Rwanda Priority)</option>
              <option value="az">A to Z</option>
              <option value="za">Z to A</option>
              <option value="country">Country</option>
              <option value="category">Category</option>
            </select>
          </div>
        </div>

        {/* Row 2: Browse Countries Horizontal Scroll */}
        <div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
            <Globe className="w-3 h-3 text-cyan-400" /> Filter by African Country:
          </div>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {popularCountries.map((c) => (
              <button
                key={c.code}
                onClick={() => {
                  setSelectedCountry(c.code);
                  setDisplayLimit(28);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  selectedCountry === c.code
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-slate-950/80 text-slate-300 border border-slate-800 hover:border-amber-500/40'
                }`}
              >
                <span>{c.flag}</span>
                <span>{c.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Row 3: Browse Categories */}
        <div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
            <Filter className="w-3 h-3 text-amber-400" /> Filter by Content Category:
          </div>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  setDisplayLimit(28);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-slate-950/80 text-slate-300 border border-slate-800 hover:border-amber-500/40'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Row 4: Browse by Broadcaster Network / Platform */}
        <div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
            <Tv className="w-3 h-3 text-purple-400" /> Filter by Network / Broadcaster Platform:
          </div>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {networks.map((net) => (
              <button
                key={net}
                onClick={() => {
                  setSelectedNetwork(net);
                  setDisplayLimit(28);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedNetwork === net
                    ? 'bg-purple-500 text-white shadow-md shadow-purple-500/20'
                    : 'bg-slate-950/80 text-slate-300 border border-slate-800 hover:border-purple-500/40'
                }`}
              >
                {net}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <span className="text-xs text-slate-400 font-semibold">
          Showing <span className="text-amber-400 font-bold">{displayedChannels.length}</span> of <span className="text-white font-bold">{filteredChannels.length}</span> channels
          {selectedCountry !== 'All' && ` (${popularCountries.find(c => c.code === selectedCountry)?.name})`}
          {selectedCategory !== 'All' && ` [${selectedCategory}]`}
        </span>

        {filteredChannels.length > displayLimit && (
          <span className="text-[11px] text-amber-400/80 font-mono">
            Scroll down or click "Load More Channels" below
          </span>
        )}
      </div>

      {/* View 1: GRID VIEW */}
      {viewMode === 'grid' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {displayedChannels.length === 0 ? (
              <div className="col-span-full py-16 text-center text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800">
                <Tv className="w-12 h-12 mx-auto text-slate-600 mb-3" />
                <p className="font-bold text-white text-base">No TV channels found matching filter criteria</p>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Try clearing your search query, switching country filters, or unchecking "Verified Playable Only".
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All');
                    setSelectedCountry('All');
                    setVerifiedOnly(false);
                    setOnlyFavorites(false);
                  }}
                  className="mt-4 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              displayedChannels.map((channel) => {
                const isFav = favorites.includes(channel.id);
                const flag = getCountryFlag(channel.country, channel.countryCode);
                const isUnavailable =
                  channel.status === 'unavailable' ||
                  (!channel.streamUrl && !channel.iframeUrl && !channel.iframeEmbedUrl);
                const isOfficialEmbed =
                  !isUnavailable &&
                  (channel.format === 'iframe' ||
                    channel.format === 'embed' ||
                    Boolean(channel.iframeUrl || channel.iframeEmbedUrl));

                return (
                  <div
                    key={channel.id}
                    onClick={() => !isUnavailable && onSelectChannel(channel)}
                    className={`group relative rounded-2xl p-4 glass-card border transition-all flex flex-col justify-between shadow-lg bg-slate-900/80 ${
                      isUnavailable
                        ? 'border-slate-800/80 opacity-80'
                        : 'border-slate-800 hover:border-amber-500/50 cursor-pointer hover:scale-[1.01]'
                    }`}
                  >
                    <div>
                      {/* Logo and Status */}
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 p-1 flex items-center justify-center overflow-hidden shrink-0">
                          <img
                            src={channel.logoUrl || channel.logo}
                            alt={channel.name}
                            onError={(e) => {
                              // Image fallback
                              (e.target as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=100&q=80';
                            }}
                            className="w-full h-full object-contain rounded-lg"
                          />
                        </div>

                        <div className="flex flex-col items-end">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm" title={channel.country}>
                              {flag}
                            </span>
                            {isUnavailable ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-800 text-slate-400 flex items-center gap-1 border border-slate-700">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-500" /> STREAM UNAVAILABLE
                              </span>
                            ) : isOfficialEmbed ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-cyan-600 text-white flex items-center gap-1 shadow-md shadow-cyan-900/50">
                                <Play className="w-2.5 h-2.5 fill-current" /> OFFICIAL EMBED
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-600 text-white flex items-center gap-1 shadow-md shadow-red-900/50 animate-pulse">
                                <span className="w-1.5 h-1.5 rounded-full bg-white" /> LIVE
                              </span>
                            )}
                          </div>
                          {!isUnavailable && (
                            <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-1 font-mono">
                              <Users className="w-3 h-3 text-cyan-400" />
                              {channel.viewerCount ? `${(channel.viewerCount / 1000).toFixed(1)}k` : '1.2k'} watching
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Name & Star */}
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-1">
                          {channel.name}
                        </h3>
                        <button
                          onClick={(e) => toggleFavorite(channel.id, e)}
                          className={`p-1 rounded-lg transition-colors shrink-0 ${
                            isFav ? 'text-amber-400' : 'text-slate-600 hover:text-slate-300'
                          }`}
                          title="Favorite Channel"
                        >
                          <Star className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                        </button>
                      </div>

                      <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 mb-2 flex-wrap">
                        <span className="font-bold text-slate-300">{flag} {channel.country}</span>
                        <span>•</span>
                        <span className="text-amber-400 font-bold">{channel.category}</span>
                      </div>

                      <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                        {channel.description || `Broadcaster from ${channel.country}.`}
                      </p>
                    </div>

                    {/* Program Info Box */}
                    <div className="bg-slate-950/90 rounded-xl p-2.5 border border-slate-800 mb-3">
                      <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                        <span>NOW BROADCASTING</span>
                        <span className="text-[9px] text-slate-500">{channel.language || 'Local'}</span>
                      </div>
                      <p className="text-xs text-white font-semibold line-clamp-1">
                        {isUnavailable
                          ? 'Online live feed unavailable'
                          : channel.currentProgram || `${channel.name} Live Feed`}
                      </p>
                    </div>

                    {/* Actions Row */}
                    <div className="flex flex-col gap-1.5">
                      {isUnavailable ? (
                        <button
                          disabled
                          className="w-full py-2.5 rounded-xl bg-slate-800/80 text-slate-500 font-bold text-xs flex items-center justify-center gap-1.5 cursor-not-allowed border border-slate-700/50"
                        >
                          ⚫ Stream Unavailable
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectChannel(channel);
                          }}
                          className="w-full py-2.5 rounded-xl bg-amber-500 text-slate-950 hover:bg-amber-400 font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-amber-500/20"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />{' '}
                          {isOfficialEmbed ? 'Watch Official Live' : 'Watch Live Stream'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Load More Button */}
          {filteredChannels.length > displayedChannels.length && (
            <div className="mt-8 text-center">
              <button
                onClick={() => setDisplayLimit((prev) => prev + 28)}
                className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-bold text-xs shadow-xl transition-all inline-flex items-center gap-2 cursor-pointer"
              >
                <span>Load More Channels ({displayedChannels.length} of {filteredChannels.length})</span>
              </button>
            </div>
          )}
        </>
      )}

      {/* View 2: EPG SCHEDULE CHART */}
      {viewMode === 'chart' && (
        <div className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
          <div className="p-4 bg-slate-950 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-amber-400" /> Live TV Program Chart & EPG Broadcast Schedule
              </h3>
              <p className="text-xs text-slate-400">Timetable across African broadcasting stations.</p>
            </div>
            <div className="text-xs text-amber-400 font-mono flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" /> Time Zone: CAT (Kigali UTC+2)
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="p-3 w-48">Station / Channel</th>
                  <th className="p-3 w-60">Morning Schedule</th>
                  <th className="p-3 w-60 bg-amber-500/10 text-amber-300 border-x border-amber-500/20">
                    NOW BROADCASTING
                  </th>
                  <th className="p-3 w-60">Evening Schedule</th>
                  <th className="p-3 w-28 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {displayedChannels.map((channel) => (
                  <tr key={channel.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={channel.logoUrl || channel.logo}
                          alt={channel.name}
                          className="w-9 h-9 rounded-lg object-contain border border-slate-700 shrink-0 bg-slate-950"
                        />
                        <div>
                          <div className="font-bold text-white flex items-center gap-1.5">
                            {channel.name}
                            <span className="text-[10px]">{getCountryFlag(channel.country, channel.countryCode)}</span>
                          </div>
                          <div className="text-[10px] text-slate-400">{channel.category} • {channel.country}</div>
                        </div>
                      </div>
                    </td>

                    <td className="p-3 text-slate-400">
                      <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                        <div className="font-semibold text-slate-300 text-[11px] line-clamp-1">Morning News & Talk</div>
                        <div className="text-[9px] text-slate-500">Completed</div>
                      </div>
                    </td>

                    <td className="p-3 bg-amber-500/5 border-x border-amber-500/20">
                      <div className="bg-amber-500/20 p-2 rounded-lg border border-amber-500/40">
                        <div className="flex items-center justify-between text-[10px] text-amber-400 font-bold mb-0.5">
                          <span>LIVE FEED</span>
                          <span className="animate-pulse text-red-400 font-mono">LIVE</span>
                        </div>
                        <div className="font-bold text-white text-[12px] line-clamp-1">
                          {channel.currentProgram || `${channel.name} Prime Broadcast`}
                        </div>
                      </div>
                    </td>

                    <td className="p-3 text-slate-300">
                      <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                        <div className="font-semibold text-slate-200 text-[11px] line-clamp-1">
                          Prime Time Broadcast
                        </div>
                        <div className="text-[9px] text-slate-500">Upcoming</div>
                      </div>
                    </td>

                    <td className="p-3 text-center">
                      <button
                        onClick={() => onSelectChannel(channel)}
                        className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 hover:bg-amber-400 font-bold text-xs flex items-center gap-1 mx-auto shadow-md"
                      >
                        <Play className="w-3 h-3 fill-current" /> Play
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View 3: DIRECTORY TABLE VIEW */}
      {viewMode === 'satellite' && (
        <div className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
          <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Signal className="w-4 h-4 text-cyan-400" /> Channel Catalogue & Source Index
              </h3>
              <p className="text-xs text-slate-400">Technical index of discovered IPTV streams.</p>
            </div>
            <span className="text-xs text-cyan-400 font-mono bg-cyan-950/80 border border-cyan-800/60 px-2.5 py-1 rounded-lg">
              IPTV-org Index Verified
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[650px]">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="p-3">#</th>
                  <th className="p-3">Channel Name</th>
                  <th className="p-3">Country</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {displayedChannels.map((channel, idx) => (
                  <tr key={channel.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-mono text-slate-500 text-[10px]">{idx + 1}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={channel.logoUrl || channel.logo}
                          alt={channel.name}
                          className="w-7 h-7 rounded object-contain border border-slate-700 shrink-0 bg-slate-950"
                        />
                        <span className="font-bold text-white">{channel.name}</span>
                      </div>
                    </td>

                    <td className="p-3">
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-300">
                        {getCountryFlag(channel.country, channel.countryCode)} {channel.country}
                      </span>
                    </td>

                    <td className="p-3 text-slate-300">{channel.category}</td>

                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-400/40">
                        ● LIVE
                      </span>
                    </td>

                    <td className="p-3 text-center">
                      <button
                        onClick={() => onSelectChannel(channel)}
                        className="px-3 py-1 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500 hover:text-slate-950 font-bold text-xs transition-all"
                      >
                        Select
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
};
