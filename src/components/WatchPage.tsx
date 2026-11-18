import React, { useState } from 'react';
import { HLSPlayer } from './HLSPlayer';
import { TvChannel } from '../types';
import {
  CheckCircle2,
  Globe,
  ExternalLink,
  Search,
  Star,
  Users,
  MessageSquare,
  Send,
  Radio,
  Tv,
  ArrowLeft,
  Play,
  ShieldCheck,
  Signal,
  Clock,
  VolumeX,
  Volume2,
  Lock,
  ShieldAlert,
  Info,
  Bug,
  Terminal,
  XCircle,
  Copy,
  Check
} from 'lucide-react';

interface WatchPageProps {
  channel: TvChannel;
  allChannels: TvChannel[];
  onBack: () => void;
  onSelectChannel: (channel: TvChannel) => void;
}

export const WatchPage: React.FC<WatchPageProps> = ({
  channel,
  allChannels = [],
  onBack,
  onSelectChannel
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [playerError, setPlayerError] = useState<string | null>(null);
  const [showDebugPanel, setShowDebugPanel] = useState<boolean>(true);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [messages, setMessages] = useState([
    { id: '1', user: 'Keza_Kigali', text: 'RBA News coverage is crisp tonight! 🇷🇼', time: '12:40' },
    { id: '2', user: 'Patrick_Rw', text: 'Greetings to Lionel Sabin and team!', time: '12:41' },
    { id: '3', user: 'Alex_Nairobi', text: 'Watching live from Kenya 🇰🇪', time: '12:42' },
    { id: '4', user: 'Jean_Kiyovu', text: 'TV1 & RTV live feeds working great in Kigali!', time: '12:44' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [activeTab, setActiveTab] = useState<'stream' | 'portal'>('stream');
  const [rightPanelTab, setRightPanelTab] = useState<'epg' | 'chat'>('epg');
  const [isSecuringFeed, setIsSecuringFeed] = useState<boolean>(true);

  React.useEffect(() => {
    setIsSecuringFeed(true);
    const timer = setTimeout(() => {
      setIsSecuringFeed(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, [channel.id]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setMessages((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        user: 'You (Lionel Stream)',
        text: chatInput,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setChatInput('');
  };

  const filteredChannels = (allChannels || []).filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      (c.altName && c.altName.toLowerCase().includes(q)) ||
      c.country.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q) ||
      (c.language && c.language.toLowerCase().includes(q))
    );
  });

  const getCountryFlag = (countryCode?: string, countryName?: string) => {
    if (countryCode === 'RW' || countryName === 'Rwanda') return '🇷🇼';
    if (countryCode === 'KE' || countryName === 'Kenya') return '🇰🇪';
    if (countryCode === 'UG' || countryName === 'Uganda') return '🇺🇬';
    if (countryCode === 'TZ' || countryName === 'Tanzania') return '🇹🇿';
    if (countryCode === 'NG' || countryName === 'Nigeria') return '🇳🇬';
    if (countryCode === 'ZA' || countryName === 'South Africa') return '🇿🇦';
    return '🌍';
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-white pt-6 pb-16 px-4 lg:px-8 max-w-7xl mx-auto">
      {/* Back Button & Top Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-all text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4 text-amber-400" />
          <span>Back to Channels</span>
        </button>

        {/* Large Search Box */}
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="🔎 Search TV channels... (Name, Country, Category, Language)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Filtered search dropdown results if user typed in search bar */}
      {searchQuery.trim() && (
        <div className="mb-6 p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
          <p className="text-xs font-bold text-amber-400 mb-3">
            Search Results for "{searchQuery}" ({filteredChannels.length} found):
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {filteredChannels.slice(0, 6).map((ch) => (
              <div
                key={ch.id}
                onClick={() => {
                  onSelectChannel(ch);
                  setSearchQuery('');
                }}
                className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 cursor-pointer transition-all"
              >
                <img src={ch.logoUrl || ch.logo} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" />
                <div className="overflow-hidden">
                  <div className="text-xs font-bold text-white truncate">{ch.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {getCountryFlag(ch.countryCode, ch.country)} {ch.country} • {ch.category}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Watch Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Video Player Column */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-black aspect-video shadow-2xl">
            {/* Fallback & Loading Overlay for Securing Provider Stream Feed */}
            {isSecuringFeed && (
              <div className="absolute inset-0 z-30 bg-slate-950/95 backdrop-blur-lg flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-4 relative">
                  <span className="w-10 h-10 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                  <Radio className="w-5 h-5 text-amber-400 absolute animate-pulse" />
                </div>
                <h3 className="text-base font-black text-amber-400 uppercase tracking-widest mb-1">
                  Securing Provider Stream Feed...
                </h3>
                <p className="text-xs text-slate-300 max-w-sm font-mono">
                  Authenticating {channel.provider ? channel.provider.toUpperCase() : 'DECODER'} Satellite Handshake & Encrypted Portal
                </p>
                <div className="mt-4 flex items-center gap-2 text-[10px] text-cyan-400 font-mono bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping shadow-[0_0_8px_#00f0ff]" />
                  <span>Kigali Gateway Connected • CAT UTC+2</span>
                </div>
              </div>
            )}

            {/* Render Format-Specific Player Engine */}
            {activeTab === 'portal' && channel.websiteUrl ? (
              <iframe
                src={channel.websiteUrl}
                title={`${channel.name} Official Stream Portal`}
                className="w-full h-full"
                style={{ border: 'none', borderRadius: '12px', background: '#000', width: '100%', height: '100%' }}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                allow="autoplay; fullscreen"
              />
            ) : channel.format === 'youtube' || (channel.iframeEmbedUrl && channel.iframeEmbedUrl.includes('youtube')) ? (
              <iframe
                src={
                  channel.iframeEmbedUrl
                    ? channel.iframeEmbedUrl.includes('?')
                      ? `${channel.iframeEmbedUrl}&autoplay=1&mute=1&modestbranding=1&rel=0`
                      : `${channel.iframeEmbedUrl}?autoplay=1&mute=1&modestbranding=1&rel=0`
                    : 'https://www.youtube.com/embed/live_stream?channel=UCyRvjnhiC0MOXWS-7COPtyQ&autoplay=1&mute=1&modestbranding=1&rel=0'
                }
                title={channel.name}
                className="w-full h-full"
                style={{ border: 'none', borderRadius: '12px', background: '#000', width: '100%', height: '100%' }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : channel.format === 'iframe' || channel.iframeUrl ? (
              <iframe
                src={channel.iframeUrl || channel.iframeEmbedUrl || channel.websiteUrl}
                title={channel.name}
                className="w-full h-full"
                style={{ border: 'none', borderRadius: '12px', background: '#000', width: '100%', height: '100%' }}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                allow="autoplay; fullscreen; encrypted-media"
                allowFullScreen
              />
            ) : (
              <HLSPlayer
                streamUrl={channel.streamUrl || ''}
                autoPlay={true}
                title={channel.name}
                poster={channel.logoUrl || channel.logo}
                onErrorChange={setPlayerError}
              />
            )}
          </div>

          {/* Channel Info Header Card */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-slate-700/80 p-1.5 flex items-center justify-center shrink-0">
                <img
                  src={channel.logoUrl || channel.logo}
                  alt={channel.name}
                  className="w-full h-full object-cover rounded-xl"
                />
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-extrabold text-white">{channel.name}</h1>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-red-600 text-white animate-pulse flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-white" /> LIVE
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 font-mono flex-wrap">
                  <span className="flex items-center gap-1 font-bold text-slate-200">
                    {getCountryFlag(channel.countryCode, channel.country)} {channel.country}
                  </span>
                  <span>•</span>
                  <span className="text-amber-400 font-bold">{channel.category}</span>
                  {channel.language && (
                    <>
                      <span>•</span>
                      <span>{channel.language}</span>
                    </>
                  )}
                  <span>•</span>
                  <span className="text-cyan-400 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" /> {(channel.viewerCount / 1000).toFixed(1)}k watching
                  </span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsFavorite(!isFavorite)}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isFavorite
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-amber-500/50'
                }`}
              >
                <Star className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                <span>{isFavorite ? 'Favorited' : 'Favorite'}</span>
              </button>

              {channel.websiteUrl && (
                <button
                  onClick={() => setActiveTab(activeTab === 'stream' ? 'portal' : 'stream')}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/50 text-cyan-300 text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <Globe className="w-4 h-4" />
                  <span>{activeTab === 'stream' ? 'Web Portal' : 'Live Stream'}</span>
                </button>
              )}

              {channel.websiteUrl && (
                <a
                  href={channel.websiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500 hover:text-slate-950 text-xs font-bold transition-all flex items-center gap-1.5"
                  title="Open station official website"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span className="hidden sm:inline">Official Site</span>
                </a>
              )}
            </div>
          </div>

          {/* EPG Program Info */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4" /> CURRENT BROADCAST SCHEDULE
              </span>
              <span className="text-xs text-slate-400 font-mono">Timezone: CAT (Kigali UTC+2)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-amber-500/30">
                <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>NOW PLAYING</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] bg-red-600 text-white font-mono animate-pulse">
                    LIVE
                  </span>
                </div>
                <p className="text-sm font-bold text-white line-clamp-1">{channel.currentProgram}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">UPCOMING NEXT</div>
                <p className="text-sm font-bold text-slate-300 line-clamp-1">{channel.nextProgram}</p>
              </div>
            </div>

            <p className="text-xs text-slate-400 mt-4 leading-relaxed">{channel.description}</p>
          </div>
        </div>

        {/* Right Sidebar: EPG Guide & Schedules + Live Viewer Chat Drawer */}
        <div className="bg-slate-900/90 rounded-3xl border border-slate-800 flex flex-col h-[620px] overflow-hidden shadow-2xl">
          {/* Header Tab Selector */}
          <div className="px-3 py-2 border-b border-slate-800 bg-slate-950 flex items-center justify-between gap-1 shrink-0">
            <button
              onClick={() => setRightPanelTab('epg')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                rightPanelTab === 'epg'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Live TV Guide</span>
            </button>

            <button
              onClick={() => setRightPanelTab('chat')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                rightPanelTab === 'chat'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Live Chat</span>
            </button>
          </div>

          {/* TAB 1: EPG PROGRAM GUIDE & SCHEDULES */}
          {rightPanelTab === 'epg' && (
            <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs no-scrollbar">
              {/* Header Box */}
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-1">
                    <Radio className="w-3 h-3 text-amber-400 animate-pulse" /> EPG LIVE FEED
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">CAT (UTC+2)</span>
                </div>
                <h4 className="text-sm font-extrabold text-white">{channel.name}</h4>
                <div className="flex items-center gap-2 mt-2">
                  {channel.provider === 'startimes' && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-950 text-orange-400 border border-orange-500/50 uppercase">
                      StarTimes Package
                    </span>
                  )}
                  {channel.provider === 'canalplus' && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-zinc-950 text-white border border-zinc-700 uppercase">
                      Canal+ Network
                    </span>
                  )}
                  {channel.provider === 'azam' && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-cyan-950 text-cyan-300 border border-cyan-500/50 uppercase">
                      Azam TV Hub
                    </span>
                  )}
                  {channel.provider === 'local' && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-cyan-950 text-cyan-300 border border-cyan-500/50 uppercase shadow-[0_0_8px_rgba(0,229,255,0.3)]">
                      Local FTA Broadcaster
                    </span>
                  )}
                  <span className="text-slate-400 text-[10px] font-mono">{channel.category}</span>
                </div>
              </div>

              {/* Current Live Program Banner */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-slate-950 border border-amber-500/40 relative overflow-hidden">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="px-2 py-0.5 rounded text-[9px] font-black bg-red-600 text-white uppercase tracking-wider animate-pulse">
                    ON AIR NOW
                  </span>
                  <span className="text-[10px] text-amber-300 font-mono font-bold">12:00 - 14:00</span>
                </div>
                <h5 className="text-xs font-bold text-white mb-1">{channel.currentProgram || `${channel.name} Primetime Live`}</h5>
                <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-2">{channel.description}</p>
                <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div className="bg-amber-400 h-full w-3/4 rounded-full animate-pulse" />
                </div>
              </div>

              {/* Upcoming Broadcast Schedule */}
              <div>
                <h5 className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" /> UPCOMING TODAY'S SCHEDULE
                </h5>

                <div className="space-y-2">
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-amber-500/40 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-cyan-300 text-[10px] font-bold">14:00 - 16:00</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] bg-slate-800 text-slate-300 font-mono">NEXT UP</span>
                    </div>
                    <p className="text-xs font-bold text-white">{channel.nextProgram || 'Live Afternoon News & Culture Hour'}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">High definition live satellite transmission.</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-slate-400 text-[10px] font-bold">16:00 - 18:00</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] bg-slate-800 text-slate-400 font-mono">SCHEDULED</span>
                    </div>
                    <p className="text-xs font-bold text-slate-200">East Africa Sports Highlights & Matchday Analysis</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Coverage of local leagues, Simba vs Yanga, and European football.</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-slate-400 text-[10px] font-bold">18:00 - 20:00</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] bg-slate-800 text-slate-400 font-mono">PRIMETIME</span>
                    </div>
                    <p className="text-xs font-bold text-slate-200">Kigali Evening Headlines & Documentary Spotlight</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">National bulletin, economic reports, and entertainment news.</p>
                  </div>
                </div>
              </div>

              {/* Quick Network Package Switcher */}
              <div className="pt-2 border-t border-slate-800">
                <h5 className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>SWAP STATION IN THIS PACK</span>
                  <span className="text-[10px] text-amber-400 font-mono font-normal">Instant Switch</span>
                </h5>

                <div className="space-y-1.5 max-h-48 overflow-y-auto no-scrollbar">
                  {(allChannels || [])
                    .filter((c) => c?.provider === channel?.provider || c?.category === channel?.category)
                    .slice(0, 6)
                    .map((c) => (
                      <div
                        key={c.id}
                        onClick={() => onSelectChannel(c)}
                        className={`p-2 rounded-xl flex items-center gap-2.5 cursor-pointer transition-all border ${
                          c.id === channel.id
                            ? 'bg-amber-500/20 border-amber-500/50 text-white'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                        }`}
                      >
                        <img src={c.logoUrl || c.logo} alt="" className="w-7 h-7 rounded-lg object-cover shrink-0" />
                        <div className="overflow-hidden flex-1">
                          <p className="text-xs font-bold truncate">{c.name}</p>
                          <p className="text-[9px] text-slate-400 font-mono truncate">{c.category}</p>
                        </div>
                        {c.id === channel.id ? (
                          <span className="text-[9px] font-bold text-amber-400 bg-amber-950 px-2 py-0.5 rounded">Active</span>
                        ) : (
                          <Play className="w-3 h-3 text-slate-500 group-hover:text-white" />
                        )}
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LIVE VIEWER CHAT */}
          {rightPanelTab === 'chat' && (
            <>
              <div className="px-4 py-2 border-b border-slate-800 flex items-center justify-between bg-slate-950 text-[10px]">
                <span className="font-bold text-cyan-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Satellite Chat Synced
                </span>
                <span className="text-slate-400 font-mono">{messages.length} messages</span>
              </div>

              <div className="flex-1 p-3 overflow-y-auto space-y-2.5 text-xs">
                {messages.map((m) => (
                  <div key={m.id} className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-cyan-300">{m.user}</span>
                      <span className="text-[9px] text-slate-500 font-mono">{m.time}</span>
                    </div>
                    <p className="text-slate-200">{m.text}</p>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 bg-slate-950 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Send a live message..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="submit"
                  className="p-2 rounded-xl bg-amber-500 text-slate-950 font-extrabold hover:bg-amber-400 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {/* Grid of Other Channels */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Tv className="w-5 h-5 text-amber-400" /> Explore More Live TV Stations
          </h2>
          <span className="text-xs text-slate-400 font-mono">{allChannels.length} Channels Available</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {allChannels.map((ch) => (
            <div
              key={ch.id}
              onClick={() => onSelectChannel(ch)}
              className={`group rounded-2xl p-4 border transition-all cursor-pointer flex flex-col justify-between hover:scale-[1.02] shadow-lg ${
                ch.id === channel.id
                  ? 'bg-amber-500/10 border-amber-500'
                  : 'bg-slate-900/80 border-slate-800 hover:border-amber-500/50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 p-1 flex items-center justify-center overflow-hidden shrink-0">
                    <img
                      src={ch.logoUrl || ch.logo}
                      alt={ch.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>

                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-1">
                      <span className="text-xs">{getCountryFlag(ch.countryCode, ch.country)}</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-600 text-white animate-pulse">
                        LIVE
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono mt-1">
                      {(ch.viewerCount / 1000).toFixed(1)}k watching
                    </span>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-1 mb-1">
                  {ch.name}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-2 mb-3">{ch.description}</p>
              </div>

              <button className="w-full py-2 rounded-xl bg-amber-500/20 text-amber-300 group-hover:bg-amber-500 group-hover:text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all">
                <Play className="w-3.5 h-3.5 fill-current" /> Watch Now
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
