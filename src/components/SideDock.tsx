import React from 'react';
import { Search, Home, Tv, Radio, Film, MessageCircle, Settings, Trophy, Box } from 'lucide-react';

interface SideDockProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenSearch: () => void;
  onOpenChat?: () => void;
  onOpenSettings?: () => void;
  onOpen3DStage?: () => void;
}

export const SideDock: React.FC<SideDockProps> = ({
  activeTab,
  setActiveTab,
  onOpenSearch,
  onOpenChat,
  onOpenSettings,
  onOpen3DStage
}) => {
  return (
    <aside className="hidden md:flex fixed left-2 lg:left-3 top-28 z-40 flex-col items-center gap-2 p-1.5 rounded-full bg-[#020612]/95 border border-cyan-400/40 shadow-2xl shadow-cyan-950/90 backdrop-blur-2xl ring-1 ring-cyan-400/30 select-none">
      
      {/* Top Bright Mirror Glow bead */}
      <div className="w-1.5 h-3 rounded-full bg-cyan-400 my-0.5 shadow-[0_0_8px_#00f0ff]" />

      {/* 1. SEARCH BUTTON */}
      <button
        onClick={onOpenSearch}
        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110 group relative cursor-pointer ${
          activeTab === 'search'
            ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-black shadow-lg shadow-cyan-500/60'
            : 'text-slate-300 hover:text-cyan-300 hover:bg-slate-900/60'
        }`}
        title="Shakisha (Search)"
      >
        <Search className="w-4 h-4 transition-colors" />
        <span className="absolute left-11 bg-[#02050e] text-cyan-300 text-xs font-bold px-2.5 py-1 rounded-xl border border-cyan-500/50 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap shadow-2xl z-50">
          Shakisha / Search
        </span>
      </button>

      {/* 2. HOME (AGASOBANUYE FILMS) BUTTON */}
      <button
        onClick={() => setActiveTab('home')}
        className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-110 group relative cursor-pointer ${
          activeTab === 'home'
            ? 'bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-600 text-slate-950 font-black shadow-lg shadow-cyan-500/60'
            : 'text-slate-300 hover:text-white hover:bg-slate-900'
        }`}
        title="Ahabanza (Home / Films)"
      >
        <Home className="w-4 h-4 fill-current" />
        <span className="absolute left-11 bg-[#02050e] text-cyan-300 text-xs font-bold px-2.5 py-1 rounded-xl border border-cyan-500/50 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap shadow-2xl z-50">
          Ahabanza / Films
        </span>
      </button>

      {/* 3. TV (LIVE RWANDAN TVS) BUTTON */}
      <button
        onClick={() => setActiveTab('channels')}
        className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-110 group relative cursor-pointer ${
          activeTab === 'channels'
            ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-black shadow-lg shadow-cyan-400/60'
            : 'text-slate-300 hover:text-cyan-300 hover:bg-slate-900'
        }`}
        title="Televiziyo (Live Rwandan TVs)"
      >
        <Tv className="w-4 h-4" />
        <span className="absolute left-11 bg-[#02050e] text-cyan-300 text-xs font-bold px-2.5 py-1 rounded-xl border border-cyan-500/50 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap shadow-2xl flex items-center gap-1.5 z-50">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#00f0ff]" /> Live Rwandan TVs
        </span>
      </button>

      {/* 4. LIVE SPORTS / MATCHES */}
      <button
        onClick={() => setActiveTab('matches')}
        className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-110 group relative cursor-pointer ${
          activeTab === 'matches'
            ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-black shadow-lg shadow-cyan-400/60'
            : 'text-slate-300 hover:text-cyan-300 hover:bg-slate-900'
        }`}
        title="Imikino Live (Football Matches)"
      >
        <Trophy className="w-4 h-4" />
        <span className="absolute left-11 bg-[#02050e] text-cyan-300 text-xs font-bold px-2.5 py-1 rounded-xl border border-cyan-500/50 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap shadow-2xl flex items-center gap-1.5 z-50">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" /> Imikino Live
        </span>
      </button>

      {/* 5. FM RADIO BUTTON */}
      <button
        onClick={() => setActiveTab('radio')}
        className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-110 group relative cursor-pointer ${
          activeTab === 'radio'
            ? 'bg-cyan-400 text-slate-950 font-black shadow-lg shadow-cyan-400/60'
            : 'text-slate-300 hover:text-cyan-300 hover:bg-slate-900'
        }`}
        title="Radio FM zo mu Rwanda"
      >
        <Radio className="w-4 h-4" />
        <span className="absolute left-11 bg-[#02050e] text-cyan-300 text-xs font-bold px-2.5 py-1 rounded-xl border border-cyan-400/50 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap shadow-2xl z-50">
          Radio FM Stations
        </span>
      </button>

      {/* 6. COMMUNITY LIVE CHAT */}
      <button
        onClick={onOpenChat}
        className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-300 hover:text-cyan-300 hover:bg-slate-900 transition-all hover:scale-110 group relative cursor-pointer"
        title="Community Live Chat"
      >
        <MessageCircle className="w-4 h-4" />
        <span className="absolute left-11 bg-[#02050e] text-cyan-300 text-xs font-bold px-2.5 py-1 rounded-xl border border-cyan-500/50 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap shadow-2xl z-50">
          Live Chat Room
        </span>
      </button>

      {/* 7. MOVIES / REEL */}
      <button
        onClick={() => setActiveTab('movies')}
        className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-110 group relative cursor-pointer ${
          activeTab === 'movies'
            ? 'bg-cyan-500 text-slate-950 font-black shadow-lg shadow-cyan-500/60'
            : 'text-slate-300 hover:text-white hover:bg-slate-900'
        }`}
        title="Filime Zose (All Movies)"
      >
        <Film className="w-4 h-4" />
        <span className="absolute left-11 bg-[#02050e] text-cyan-300 text-xs font-bold px-2.5 py-1 rounded-xl border border-cyan-500/50 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap shadow-2xl z-50">
          Filime Zose / Movies
        </span>
      </button>

      {/* 8. INTERACTIVE 3D STUDIO STAGE */}
      {onOpen3DStage && (
        <button
          onClick={onOpen3DStage}
          className="w-8 h-8 rounded-xl flex items-center justify-center text-cyan-300 hover:bg-cyan-400 hover:text-slate-950 transition-all hover:scale-110 group relative cursor-pointer"
          title="Open 3D Cinema & Sports Stage"
        >
          <Box className="w-4 h-4" />
          <span className="absolute left-11 bg-[#02050e] text-cyan-300 text-xs font-bold px-2.5 py-1 rounded-xl border border-cyan-400/50 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap shadow-2xl z-50">
            3D Studio Stage
          </span>
        </button>
      )}

      {/* 9. SETTINGS & PAYMENTS HUB */}
      {onOpenSettings && (
        <button
          onClick={onOpenSettings}
          className="w-8 h-8 rounded-xl flex items-center justify-center text-cyan-400 hover:bg-cyan-400/20 border border-cyan-400/40 transition-all hover:scale-110 group relative cursor-pointer"
          title="Settings, Konti & Payments"
        >
          <Settings className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
          <span className="absolute left-11 bg-[#02050e] text-cyan-300 text-xs font-bold px-2.5 py-1 rounded-xl border border-cyan-400/50 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap shadow-2xl z-50">
            Settings & MoMo
          </span>
        </button>
      )}

    </aside>
  );
};
