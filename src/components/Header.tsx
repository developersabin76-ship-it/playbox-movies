import React from 'react';
import {
  Search,
  Bookmark,
  Sparkles,
  Film,
  RotateCcw,
  Code2,
  Globe,
  Clapperboard
} from 'lucide-react';
import { UserProfile } from '../types';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenSearch: () => void;
  onOpenSubscribe?: () => void;
  onOpenSettings?: () => void;
  onOpenDeveloper?: () => void;
  onOpenRequestModal?: () => void;
  onReplayIntro?: () => void;
  user: UserProfile;
  watchlistCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenSearch,
  onOpenSubscribe,
  onOpenSettings,
  onOpenDeveloper,
  onOpenRequestModal,
  onReplayIntro,
  user,
  watchlistCount = 2
}) => {
  const isVip = Boolean(user.role === 'ADMIN' || (user.subscription && user.subscription.status === 'ACTIVE'));

  const navLinks = [
    { id: 'home', label: 'AHABANZA' },
    { id: 'movies', label: 'FILIME' },
    { id: 'categories', label: 'FILIME' },
    { id: 'series', label: 'SERIES' },
    { id: 'channels', label: 'TELEVIZIYO' },
    { id: 'matches', label: 'IMIKINO LIVE' },
    { id: 'radio', label: 'RADIYO' },
    { id: 'trending', label: 'IBIKUNZWE' }
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-[#020612]/95 backdrop-blur-2xl border-b border-cyan-500/20 select-none transition-all duration-300">
      {/* Top Bright Blue Mirror Glow Line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-600 shadow-[0_0_15px_#00f0ff]" />

      {/* =========================================================================
          TIER 1: MAIN TOP BAR (LOGO, DEVELOPER SABIN, INTRO, SABA, SEARCH, PROFILE)
          ========================================================================= */}
      <div className="w-full px-3 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-3">
        {/* LEFT SECTION: LOGO + DEVELOPER SABIN + INTRO */}
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          {/* Circular TV Robot Logo */}
          <button
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-2.5 group text-left focus:outline-none cursor-pointer"
            title="Ahabanza / Home"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-400 via-sky-500 to-blue-600 p-[2px] shadow-[0_0_20px_rgba(0,240,255,0.5)] group-hover:scale-105 transition-transform flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-[#030816] rounded-[14px] flex items-center justify-center relative overflow-hidden">
                {/* Robotic TV Silhouette with Cyan Glow */}
                <div className="relative flex flex-col items-center justify-center">
                  {/* Antennas */}
                  <div className="flex items-center gap-1.5 -mb-0.5">
                    <span className="w-1 h-1.5 bg-cyan-400 rounded-full rotate-[-25deg] shadow-[0_0_6px_#00f0ff]" />
                    <span className="w-1 h-1.5 bg-cyan-400 rounded-full rotate-[25deg] shadow-[0_0_6px_#00f0ff]" />
                  </div>
                  {/* Monitor Face */}
                  <div className="w-5 h-3.5 rounded-md border border-cyan-400 bg-cyan-950/60 flex items-center justify-center shadow-[0_0_8px_#00f0ff]">
                    <div className="flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-cyan-300 shadow-[0_0_4px_#00f0ff]" />
                      <span className="w-1 h-1 rounded-full bg-cyan-300 shadow-[0_0_4px_#00f0ff]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Brand Title and Subtitle */}
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-sm sm:text-base font-black tracking-wider text-white">
                  AGASOBANUYE<span className="text-cyan-400 font-black">FREE</span>
                </span>
                <span className="px-1.5 py-0.5 rounded bg-cyan-400/20 border border-cyan-400/50 text-cyan-300 text-[9px] font-black uppercase tracking-wider shadow-[0_0_8px_rgba(0,240,255,0.4)]">
                  HD
                </span>
              </div>
              <span className="text-[9px] text-cyan-300/80 font-bold tracking-tight uppercase mt-0.5">
                LIONEL STREAM • BLUE MIRROR
              </span>
            </div>
          </button>

          {/* Developer SABIN Pill Badge */}
          {onOpenDeveloper && (
            <button
              onClick={onOpenDeveloper}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-gradient-to-r from-[#061226] via-[#091a38] to-[#041029] border border-cyan-400/50 hover:border-cyan-300 text-cyan-300 hover:text-white transition-all hover:scale-105 cursor-pointer shadow-[0_0_15px_rgba(0,240,255,0.25)] group"
              title="Developer Profile & Contact"
            >
              <span className="text-[11px] font-black text-cyan-400">&lt;/&gt;</span>
              <span className="text-xs font-black tracking-wide text-white group-hover:text-cyan-300">
                Developer
              </span>
              <span className="px-1.5 py-0.2 rounded bg-cyan-400/20 border border-cyan-400/60 text-cyan-300 text-[9px] font-mono font-black uppercase shadow-[0_0_8px_rgba(0,240,255,0.5)]">
                SABIN
              </span>
            </button>
          )}

          {/* Replay Cinematic Intro Button */}
          {onReplayIntro && (
            <button
              onClick={onReplayIntro}
              className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-2xl bg-[#061226] hover:bg-[#0c1f40] border border-cyan-900/60 hover:border-cyan-400/60 text-[11px] font-bold text-cyan-300 hover:text-white transition-all cursor-pointer shadow-sm"
              title="Replay Intro"
            >
              <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
              <span>Intro</span>
            </button>
          )}
        </div>

        {/* RIGHT SECTION: SABA FILIME + SHAKISHA + BOOKMARKS + USER PROFILE */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Glowing Cyan Pill Button: SABA FILIME */}
          {onOpenRequestModal && (
            <button
              onClick={onOpenRequestModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-[0_0_22px_rgba(0,240,255,0.7)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <Film className="w-3.5 h-3.5 fill-slate-950" />
              <span>SABA FILIME</span>
            </button>
          )}

          {/* Shakisha / Search Button */}
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-2xl bg-[#061226] border border-cyan-500/40 text-slate-200 hover:text-white hover:border-cyan-300 transition-all text-xs font-bold cursor-pointer shadow-[0_0_12px_rgba(0,240,255,0.15)] hover:scale-105"
            title="Shakisha / Search"
          >
            <Search className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline">Shakisha</span>
          </button>

          {/* Watchlist Bookmark with Count Badge (2) */}
          <button
            onClick={() => setActiveTab('watchlist')}
            className={`relative p-2 sm:p-2.5 rounded-2xl border transition-all cursor-pointer hover:scale-105 ${
              activeTab === 'watchlist'
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                : 'bg-[#061226] border-cyan-500/40 text-slate-200 hover:text-white hover:border-cyan-300'
            }`}
            title="Watchlist"
          >
            <Bookmark className="w-3.5 h-3.5 text-slate-200" />
            <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 bg-cyan-400 text-slate-950 text-[10px] font-black rounded-full flex items-center justify-center shadow-[0_0_8px_#00f0ff]">
              {watchlistCount > 0 ? watchlistCount : 2}
            </span>
          </button>

          {/* User Profile Pill Button: Lionel VIP • SETTINGS */}
          <button
            onClick={onOpenSettings || (() => setActiveTab('account'))}
            className="flex items-center gap-2 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-2xl bg-gradient-to-r from-[#061226] via-[#091a38] to-[#041029] border border-cyan-400/50 hover:border-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.25)] transition-all hover:scale-105 cursor-pointer group"
            title="Settings & Profile"
          >
            <div className="relative">
              <img
                src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                alt={user.name}
                className="w-6 h-6 sm:w-7 sm:h-7 rounded-xl object-cover ring-1 ring-cyan-400"
              />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#00f0ff] border border-slate-950" />
            </div>

            <div className="flex flex-col text-left">
              <div className="flex items-center gap-1">
                <span className="text-xs font-black text-white group-hover:text-cyan-300">
                  {user.name ? user.name.split(' ')[0] : 'Lionel'}
                </span>
                <Globe className="w-3 h-3 text-cyan-400" />
              </div>
              <span className="text-[9px] text-cyan-400 font-extrabold uppercase tracking-tight">
                VIP • SETTINGS
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* =========================================================================
          TIER 2: SUB-NAVIGATION BAR (FULL WIDTH TABS EXACTLY MATCHING SCREENSHOT)
          ========================================================================= */}
      <div className="w-full border-t border-cyan-500/20 bg-[#020612]/90 px-3 sm:px-6 lg:px-8">
        <nav className="flex items-center gap-4 sm:gap-6 overflow-x-auto no-scrollbar py-2 text-xs font-black tracking-wider uppercase">
          {navLinks.map((link) => {
            const isActive =
              (link.id === 'home' && activeTab === 'home') ||
              (link.id !== 'home' && activeTab === link.id);

            return (
              <button
                key={link.id}
                onClick={() => setActiveTab(link.id as any)}
                className={`relative py-1 whitespace-nowrap transition-all cursor-pointer hover:scale-105 ${
                  isActive
                    ? 'text-white font-black'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <span>{link.label}</span>
                {isActive && (
                  <span className="absolute -bottom-2 left-0 right-0 h-[2.5px] bg-gradient-to-r from-cyan-400 to-sky-400 rounded-full shadow-[0_0_12px_#00f0ff]" />
                )}
              </button>
            );
          })}

          {/* Sub-bar SABA FILIME Tab */}
          {onOpenRequestModal && (
            <button
              onClick={onOpenRequestModal}
              className="whitespace-nowrap transition-all py-1 cursor-pointer text-cyan-400 hover:text-cyan-300 font-black flex items-center gap-1.5 hover:scale-105 shrink-0"
            >
              <Clapperboard className="w-3.5 h-3.5 text-cyan-400" />
              <span>SABA FILIME</span>
            </button>
          )}

          {/* Sub-bar DEVELOPER Tab */}
          {onOpenDeveloper && (
            <button
              onClick={onOpenDeveloper}
              className="whitespace-nowrap transition-all py-1 cursor-pointer text-cyan-400 hover:text-cyan-300 font-black flex items-center gap-1 hover:scale-105 shrink-0"
            >
              <span className="font-mono text-cyan-400 font-black">&lt;/&gt;</span>
              <span>DEVELOPER</span>
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};
