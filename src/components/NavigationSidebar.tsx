import React from 'react';
import {
  Home,
  Film,
  Tv,
  Radio,
  Grid,
  Search,
  User,
  Bookmark,
  Sparkles,
  Shield,
  Layers,
  CreditCard,
  Bell,
  Play,
  Flame,
  Mic2
} from 'lucide-react';
import { UserProfile, NotificationItem } from '../types';

interface NavigationSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenSearch: () => void;
  onOpenSubscribe?: () => void;
  user: UserProfile;
  unreadNotificationsCount?: number;
}

export const NavigationSidebar: React.FC<NavigationSidebarProps> = ({
  activeTab,
  setActiveTab,
  onOpenSearch,
  onOpenSubscribe,
  user,
  unreadNotificationsCount = 0
}) => {
  const mainNavItems = [
    { id: 'home', label: 'Ahabanza (Home)', icon: Home },
    { id: 'movies', label: "Filime z'Agasobanuye", icon: Film },
    { id: 'series', label: "Season z'Agasobanuye", icon: Layers },
    { id: 'channels', label: 'Televiziyo (Live TV)', icon: Radio },
    { id: 'categories', label: 'Ibyiciro (Genres)', icon: Grid },
    { id: 'watchlist', label: 'Filime Nabitse', icon: Bookmark, badge: user.watchlist?.length > 0 ? user.watchlist.length : undefined },
    { id: 'account', label: 'Konti Yanjye', icon: User, badge: unreadNotificationsCount > 0 ? unreadNotificationsCount : undefined }
  ];

  return (
    <>
      {/* ==========================================
          1. DESKTOP PERMANENT LEFT SIDEBAR (STICKY)
          ========================================== */}
      <aside className="hidden md:flex flex-col justify-between fixed top-0 left-0 bottom-0 w-20 lg:w-64 bg-[#080d1a]/95 backdrop-blur-2xl border-r border-red-950/40 z-40 py-5 px-3 select-none transition-all duration-300">
        
        {/* Top RebaMovie Brand Logo */}
        <div className="flex items-center gap-3 px-2 mb-6 cursor-pointer" onClick={() => setActiveTab('home')}>
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-red-600 via-red-500 to-rose-600 p-0.5 flex items-center justify-center shadow-lg shadow-red-600/30 shrink-0 group">
            <div className="w-full h-full bg-[#080d1a] rounded-[14px] flex items-center justify-center group-hover:bg-transparent transition-colors">
              <Play className="w-5 h-5 fill-red-500 text-red-500 group-hover:fill-white group-hover:text-white transition-colors ml-0.5" />
            </div>
          </div>

          <div className="hidden lg:flex flex-col">
            <div className="flex items-center gap-1">
              <span className="text-lg font-black text-white tracking-wider">REBA</span>
              <span className="text-lg font-black text-red-500">MOVIE</span>
            </div>
            <span className="text-[10px] text-amber-300 font-bold tracking-tight flex items-center gap-1">
              🇷🇼 Agasobanuye Films HD
            </span>
          </div>
        </div>

        {/* Navigation Items Menu */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto no-scrollbar">
          {/* Search Trigger Button */}
          <button
            onClick={onOpenSearch}
            className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-red-950/30 border border-transparent hover:border-red-800/40 transition-all text-left group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-center text-red-400 group-hover:border-red-500 transition-colors shrink-0">
              <Search className="w-4 h-4" />
            </div>
            <span className="hidden lg:inline font-semibold">Shakisha (Search)</span>
            <kbd className="hidden lg:inline-block ml-auto text-[10px] font-mono bg-slate-900 text-slate-400 px-1.5 py-0.5 rounded border border-slate-800">
              /
            </kbd>
          </button>

          <div className="my-3 border-t border-slate-800/60" />

          {/* Core Navigation Links */}
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left relative group cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-red-600/20 to-red-900/10 text-white border border-red-500/50 shadow-md shadow-red-950/50'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
                    isActive
                      ? 'bg-red-600 text-white shadow-md shadow-red-600/40'
                      : 'bg-slate-900/80 border border-slate-800/80 text-slate-400 group-hover:text-red-400 group-hover:border-red-900/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>

                <span className="hidden lg:inline text-sm font-medium tracking-wide">
                  {item.label}
                </span>

                {item.badge !== undefined && (
                  <span
                    className={`hidden lg:inline-block ml-auto px-2 py-0.5 rounded-full text-[10px] font-black ${
                      isActive
                        ? 'bg-red-600 text-white'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}

                {/* Active Indicator Bar on left for mobile icon mode */}
                {isActive && (
                  <span className="lg:hidden absolute -left-1 top-2 bottom-2 w-1 bg-red-500 rounded-r" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Subscription Banner & Admin shortcut */}
        <div className="pt-4 border-t border-slate-800/60 space-y-2">
          {onOpenSubscribe && (
            <button
              onClick={onOpenSubscribe}
              className="w-full hidden lg:flex flex-col p-3 rounded-2xl bg-gradient-to-br from-red-950/60 to-rose-950/40 border border-red-500/40 hover:border-red-400/80 transition-all text-left group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> VIP PASS
                </span>
                <span className="text-[10px] font-bold text-white bg-red-600 px-1.5 py-0.2 rounded shadow-sm">
                  500 RWF
                </span>
              </div>
              <p className="text-xs font-bold text-white group-hover:text-red-300 transition-colors">
                MTN & Airtel MoMo Pass
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Kureba filime nshya muri HD & kuzibika
              </p>
            </button>
          )}

          {/* User profile quick widget */}
          <div
            onClick={() => setActiveTab('account')}
            className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-red-700/50 cursor-pointer transition-all"
          >
            <img
              src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
              alt={user.name}
              className="w-8 h-8 rounded-lg object-cover ring-1 ring-red-500/50 shrink-0"
            />
            <div className="hidden lg:flex flex-col overflow-hidden">
              <span className="text-xs font-bold text-white truncate">{user.name}</span>
              <span className="text-[10px] text-red-400 font-mono font-bold">
                {user.subscription?.planName || 'FREE ACCOUNT'}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* ==========================================
          2. MOBILE TOP HEADER WITH LOGO & SEARCH
          ========================================== */}
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-[#080d1a]/95 backdrop-blur-xl border-b border-red-950/40 select-none">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('home')}>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-red-600 to-rose-600 p-0.5 flex items-center justify-center shadow-md">
            <Play className="w-4 h-4 fill-white text-white ml-0.5" />
          </div>
          <span className="text-sm font-black text-white tracking-wider">
            REBA<span className="text-red-500">MOVIE</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenSearch}
            className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer"
          >
            <Search className="w-4 h-4" />
          </button>
          
          {onOpenSubscribe && (
            <button
              onClick={onOpenSubscribe}
              className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white font-black text-[10px] shadow-sm flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3 h-3" /> VIP
            </button>
          )}

          <div
            onClick={() => setActiveTab('account')}
            className="w-8 h-8 rounded-xl overflow-hidden ring-1 ring-red-500/50 cursor-pointer"
          >
            <img
              src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
              alt={user.name}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </header>

      {/* ==========================================
          3. MOBILE RESPONSIVE BOTTOM NAVIGATION BAR
          ========================================== */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#080d1a]/95 backdrop-blur-xl border-t border-red-950/40 px-2 py-1.5 flex items-center justify-around select-none shadow-2xl">
        {[
          { id: 'home', label: 'Home', icon: Home },
          { id: 'movies', label: 'Filime', icon: Film },
          { id: 'series', label: 'Series', icon: Layers },
          { id: 'channels', label: 'Live TV', icon: Radio },
          { id: 'account', label: 'Konti', icon: User }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer ${
                isActive ? 'text-red-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] font-medium">{tab.label}</span>
              {isActive && <span className="w-1 h-1 rounded-full bg-red-500 mt-0.5" />}
            </button>
          );
        })}
      </nav>
    </>
  );
};
