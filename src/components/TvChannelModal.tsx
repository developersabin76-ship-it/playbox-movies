import React, { useState, useEffect, useRef } from 'react';
import { X, Users, Volume2, VolumeX, Maximize, MessageSquare, Send, Radio, Play, Pause, RefreshCw, Signal, Tv, CheckCircle2, ExternalLink, Globe, Lock, ShieldAlert } from 'lucide-react';
import { TvChannel } from '../types';
import { HLSPlayer } from './HLSPlayer';

interface TvChannelModalProps {
  channel: TvChannel | null;
  onClose: () => void;
  allChannels?: TvChannel[];
  onSelectChannel?: (ch: TvChannel) => void;
}

export const TvChannelModal: React.FC<TvChannelModalProps> = ({
  channel,
  onClose,
  allChannels = [],
  onSelectChannel
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [activeMode, setActiveMode] = useState<'video' | 'portal' | 'studio'>('video');

  const [messages, setMessages] = useState<{ id: string; user: string; text: string; time: string }[]>([
    { id: '1', user: 'Keza_Kigali', text: 'RBA News coverage is crisp tonight! 🇷🇼', time: '12:40' },
    { id: '2', user: 'Patrick_Rw', text: 'Greetings to Lionel Sabin and team!', time: '12:41' },
    { id: '3', user: 'Alex_Nairobi', text: 'Watching live from Kenya 🇰🇪', time: '12:42' },
    { id: '4', user: 'Jean_Kiyovu', text: 'TV1 & RTV live feeds working great in Kigali!', time: '12:44' }
  ]);
  const [chatInput, setChatInput] = useState('');

  // Reset video state when channel changes
  useEffect(() => {
    setHasError(false);
    setIsPlaying(true);
    setIsMuted(true);
    setActiveMode('video');
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // Autoplay may be restricted
      });
    }
  }, [channel?.id]);

  if (!channel) return null;

  const siteUrl = channel.officialWebsite || channel.websiteUrl;
  const isPlayable = channel.status === 'PLAYABLE' || (channel.isVerified && channel.embeddingAllowed);
  const isCatalogueOnly = channel.status === 'CATALOGUE ONLY' || (!channel.isVerified && !channel.embeddingAllowed && channel.status !== 'OFFLINE');

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

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/95 backdrop-blur-2xl overflow-y-auto">
      <div className="relative w-full max-w-6xl rounded-3xl glass-panel border border-slate-700/80 overflow-hidden shadow-2xl my-4">
        
        {/* Modal Top Header */}
        <div className="flex flex-wrap items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/90 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 p-1 flex items-center justify-center shrink-0">
              <img src={channel.logoUrl} alt={channel.name} className="w-full h-full object-cover rounded-lg" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  {channel.name}
                </h2>
                {isPlayable ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-600 text-white animate-pulse flex items-center gap-1 shadow-md shadow-red-900/50">
                    <span className="w-1.5 h-1.5 rounded-full bg-white" /> LIVE PLAYABLE
                  </span>
                ) : isCatalogueOnly ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5 text-amber-400" /> CATALOGUE ONLY
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1">
                    OFFLINE
                  </span>
                )}
                {channel.network && (
                  <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-mono bg-purple-950 text-purple-300 border border-purple-800">
                    {channel.network}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-mono flex items-center gap-2 flex-wrap">
                <span>{channel.country === 'Rwanda' ? '🇷🇼 Rwanda' : channel.country}</span>
                <span>•</span>
                <span>{channel.language}</span>
                <span>•</span>
                <span className="text-amber-400 font-bold">{channel.category}</span>
                {channel.broadcaster && <span>• Broadcaster: {channel.broadcaster}</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => { setActiveMode('video'); setHasError(false); }}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                  activeMode === 'video' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Tv className="w-3.5 h-3.5" />
                <span>Live Broadcast</span>
              </button>
              <button
                onClick={() => setActiveMode('studio')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                  activeMode === 'studio' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Studio View</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
          
          {/* Main Video Broadcast Player Screen */}
          <div className="lg:col-span-2 bg-black relative flex flex-col justify-between min-h-[380px] sm:min-h-[460px] lg:min-h-[520px] overflow-hidden select-none">
            
            {/* Watermark Logo Overlay Top Right */}
            <div className="absolute top-4 right-4 z-20 flex items-center gap-2 pointer-events-none bg-slate-950/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800/80 shadow-xl">
              <img src={channel.logoUrl} alt="" className="w-5 h-5 rounded object-cover" />
              <span className="text-xs font-black text-white tracking-wider uppercase">{channel.name.split(' ')[0]}</span>
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            </div>

            {/* Display according to activeMode */}
            <div className="relative w-full h-full flex-1 bg-slate-950 flex items-center justify-center overflow-hidden">
              {activeMode === 'video' && !hasError ? (
                <div className="relative w-full h-full flex items-center justify-center bg-black">
                  {channel.iframeEmbedUrl ? (
                    <iframe
                      src={channel.iframeEmbedUrl}
                      title={channel.name}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <HLSPlayer
                      streamUrl={channel.streamUrl || ''}
                      autoPlay={true}
                      title={channel.name}
                      poster={channel.logoUrl}
                    />
                  )}
                </div>
              ) : (
                /* Studio Interactive Broadcast Canvas Fallback */
                <div className="w-full h-full p-6 bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/30 flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

                  {/* Studio Top Banner */}
                  <div className="flex items-center justify-between z-10">
                    <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl">
                      <Radio className="w-4 h-4 text-amber-400 animate-pulse" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        24/7 Live Broadcast Studio
                      </span>
                    </div>

                    <span className="text-xs font-mono text-cyan-400 bg-cyan-950/80 border border-cyan-800/80 px-3 py-1 rounded-xl">
                      Signal: 98% Strong
                    </span>
                  </div>

                  {/* Studio Center Graphics & Soundwaves */}
                  <div className="my-auto text-center z-10 py-6">
                    <div className="relative w-24 h-24 mx-auto mb-4">
                      <img
                        src={channel.logoUrl}
                        alt={channel.name}
                        className="w-full h-full rounded-2xl object-cover border-2 border-amber-500 shadow-2xl animate-pulse"
                      />
                      <div className="absolute -bottom-2 -right-2 bg-red-600 text-white font-black text-[10px] px-2 py-0.5 rounded-full border border-slate-950">
                        LIVE
                      </div>
                    </div>

                    <h3 className="text-xl sm:text-2xl font-black text-white mb-1">
                      {channel.name}
                    </h3>
                    <p className="text-sm font-bold text-amber-400 max-w-md mx-auto mb-3">
                      {channel.currentProgram}
                    </p>

                    {/* Soundwaves visualizer animation */}
                    <div className="flex items-center justify-center gap-1.5 h-8 my-4">
                      {[40, 70, 30, 90, 100, 60, 80, 40, 95, 50, 80, 30, 75, 90, 40].map((h, i) => (
                        <div
                          key={i}
                          className="w-1.5 bg-gradient-to-t from-amber-500 to-cyan-400 rounded-full animate-pulse"
                          style={{
                            height: `${h}%`,
                            animationDelay: `${(i * 0.1).toFixed(1)}s`
                          }}
                        />
                      ))}
                    </div>

                    <div className="flex items-center justify-center gap-3 mt-4">
                      {channel.websiteUrl && (
                        <a
                          href={channel.websiteUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-black text-xs hover:bg-cyan-400 transition-transform flex items-center gap-1.5"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> Open Web Stream Portal
                        </a>
                      )}
                      <button
                        onClick={() => setHasError(false)}
                        className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-extrabold text-xs hover:bg-amber-400 transition-transform flex items-center gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Reload Direct Stream
                      </button>
                    </div>
                  </div>

                  {/* Studio Bottom Description */}
                  <div className="z-10 bg-slate-950/80 p-3 rounded-2xl border border-slate-800 text-xs text-slate-300">
                    <span className="font-bold text-amber-400">PROGRAMME INFO:</span> {channel.description}
                  </div>
                </div>
              )}
            </div>

            {/* Live News Ticker Running Banner Overlay */}
            <div className="bg-slate-950 border-t border-slate-800 p-2 overflow-hidden flex items-center gap-3 z-20">
              <span className="bg-red-600 text-white font-black text-[10px] px-2.5 py-1 rounded uppercase tracking-wider shrink-0 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" /> BREAKING
              </span>

              <div className="flex-1 overflow-hidden">
                <div className="whitespace-nowrap text-xs font-semibold text-slate-200 animate-marquee flex items-center gap-8">
                  <span>🔴 {channel.name}: {channel.currentProgram}</span>
                  <span>• NEXT PROGRAM: {channel.nextProgram}</span>
                  <span>• OFFICIAL BROADCASTER PORTAL SYNCED</span>
                  <span>• LIVE FROM KIGALI RWANDA 🇷🇼</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={toggleMute}
                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white"
                  title="Mute / Unmute"
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
                </button>
                <span className="text-xs font-mono text-cyan-400 hidden sm:inline flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" /> {(channel.viewerCount / 1000).toFixed(1)}k
                </span>
              </div>
            </div>
          </div>

          {/* Live Viewer Chat & Quick Channel Switcher Sidebar */}
          <div className="bg-slate-900/90 border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col h-[380px] sm:h-[460px] lg:h-[520px]">
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-cyan-400" /> Live Viewer Chat
              </span>
              <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Live Synced
              </span>
            </div>

            {/* Messages Container */}
            <div className="flex-1 p-3 overflow-y-auto space-y-2.5 font-sans text-xs">
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

            {/* Quick TV Channel Selector Strip */}
            {allChannels.length > 0 && onSelectChannel && (
              <div className="p-2 border-t border-slate-800 bg-slate-950/80">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-1">
                  Switch Channel:
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {allChannels.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => onSelectChannel(c)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs whitespace-nowrap border shrink-0 transition-all ${
                        c.id === channel.id
                          ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold'
                          : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <img src={c.logoUrl} alt="" className="w-4 h-4 rounded object-cover" />
                      <span className="truncate max-w-[90px]">{c.name.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Chat Input Form */}
            <form onSubmit={handleSendMessage} className="p-2.5 border-t border-slate-800 flex items-center gap-2">
              <input
                type="text"
                placeholder="Send a live message..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
              <button
                type="submit"
                className="p-2 rounded-xl bg-amber-500 text-slate-950 font-extrabold hover:bg-amber-400 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
};

