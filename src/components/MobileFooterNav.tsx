import React from 'react';
import {
  Home,
  Film,
  Tv,
  Bookmark,
  Settings,
  Sparkles,
  Search,
  Radio,
  Trophy
} from 'lucide-react';
import { UserProfile } from '../types';

interface MobileFooterNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenSettings: () => void;
  onOpenSearch: () => void;
  user: UserProfile;
  watchlistCount?: number;
}

export const MobileFooterNav: React.FC<MobileFooterNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenSettings,
  onOpenSearch,
  user,
  watchlistCount = 0
}) => {
  const isVip = Boolean(user.role === 'ADMIN' || (user.subscription && user.subscription.status === 'ACTIVE'));

  const navItems = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      action: () => setActiveTab('home'),
      activeColor: 'text-cyan-400',
      activeBg: 'bg-cyan-500/20'
    },
    {
      id: 'movies',
      label: 'Filime',
      icon: Film,
      action: () => setActiveTab('movies'),
      activeColor: 'text-cyan-400',
      activeBg: 'bg-cyan-500/20'
    },
    {
      id: 'matches',
      label: 'Imikino',
      icon: Trophy,
      badge: 'LIVE',
      action: () => setActiveTab('matches'),
      activeColor: 'text-cyan-300',
      activeBg: 'bg-cyan-500/20'
    },
    {
      id: 'channels',
      label: 'Live TV',
      icon: Tv,
      badge: 'TV',
      action: () => setActiveTab('channels'),
      activeColor: 'text-cyan-400',
      activeBg: 'bg-cyan-500/20'
    },
    {
      id: 'watchlist',
      label: 'Ibikunzwe',
      icon: Bookmark,
      count: watchlistCount,
      action: () => setActiveTab('watchlist'),
      activeColor: 'text-cyan-400',
      activeBg: 'bg-cyan-500/20'
    },
    {
      id: 'settings',
      label: 'Konti',
      icon: Settings,
      isSettingsButton: true,
      action: onOpenSettings,
      activeColor: 'text-cyan-300',
      activeBg: 'bg-gradient-to-r from-cyan-400 to-blue-600 text-slate-950'
    }
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#02050e]/95 backdrop-blur-2xl border-t border-cyan-500/30 px-1 py-1.5 select-none shadow-[0_-10px_30px_rgba(0,0,0,0.9)]">
      
      {/* Top Bright Mirror Blue Accent Line */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-600 shadow-[0_0_12px_#00f0ff]" />

      <div className="flex items-center justify-around gap-1 max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          if (item.isSettingsButton) {
            return (
              <button
                key={item.id}
                onClick={item.action}
                className="flex flex-col items-center justify-center min-w-[56px] py-1 px-1.5 rounded-2xl transition-all cursor-pointer group active:scale-95 relative"
              >
                <div className="relative">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-emerald-500 to-yellow-400 p-0.5 shadow-md shadow-yellow-500/30 flex items-center justify-center">
                    <img
                      src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                      alt={user.name}
                      className="w-full h-full rounded-[10px] object-cover"
                    />
                  </div>
                  {/* Gear Badge */}
                  <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-slate-900 border border-yellow-400 flex items-center justify-center">
                    <Settings className="w-2.5 h-2.5 text-yellow-400 animate-spin-slow" />
                  </div>
                </div>

                <span className="text-[10px] font-black text-yellow-300 mt-1 tracking-tight">
                  Settings
                </span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={item.action}
              className={`flex flex-col items-center justify-center min-w-[56px] py-1 px-1.5 rounded-2xl transition-all cursor-pointer group active:scale-95 relative ${
                isActive ? `${item.activeBg} border border-blue-500/30 shadow` : 'text-slate-400 hover:text-white'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? `${item.activeColor} scale-110` : 'text-slate-400'}`} />

                {item.badge && (
                  <span className="absolute -top-1.5 -right-3 px-1.5 rounded-full bg-cyan-400 text-slate-950 font-black text-[8px] tracking-tighter animate-pulse shadow-[0_0_8px_#00f0ff]">
                    {item.badge}
                  </span>
                )}

                {typeof item.count === 'number' && item.count > 0 && (
                  <span className="absolute -top-1 -right-2 px-1 rounded-full bg-yellow-400 text-slate-950 font-black text-[9px]">
                    {item.count}
                  </span>
                )}
              </div>

              <span className={`text-[10px] font-bold mt-1 tracking-tight ${
                isActive ? `${item.activeColor} font-black` : 'text-slate-400'
              }`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
