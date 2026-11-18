import React from 'react';
import { Radio, ShieldCheck, Sparkles, Tv, Film, Layers, CreditCard, Settings, Code2 } from 'lucide-react';
import { MediaCoreLogo } from './MediaCoreLogo';

interface FooterProps {
  onOpenAdmin: () => void;
  setActiveTab: (tab: string) => void;
  onOpenSubscribe: () => void;
  onOpenSettings?: () => void;
  onOpenDeveloper?: () => void;
  onReplayIntro?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenAdmin,
  setActiveTab,
  onOpenSubscribe,
  onOpenSettings,
  onOpenDeveloper,
  onReplayIntro
}) => {
  return (
    <footer className="w-full bg-[#030611] border-t border-cyan-900/40 pt-12 pb-24 md:pb-12 px-4 lg:px-8 text-slate-400 text-xs select-none relative">
      
      {/* Top Decorative Cyan to Emerald line */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 via-blue-600 to-emerald-400 opacity-70" />

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
        
        {/* Column 1: Brand Info */}
        <div className="space-y-3 md:col-span-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-emerald-500 p-0.5 shadow-lg shadow-cyan-500/20">
              <div className="w-full h-full bg-[#030712] rounded-[14px] flex items-center justify-center p-1">
                <MediaCoreLogo size="sm" showTagline={false} />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-wider text-white">
                Media<span className="text-emerald-400">Core</span><span className="text-cyan-400">TV</span>
              </span>
              <span className="text-[9px] text-cyan-300 font-bold uppercase tracking-widest">
                STREAM • WATCH • ENJOY
              </span>
            </div>
          </div>

          <p className="text-slate-400 leading-relaxed font-normal text-xs">
            Rwanda's premier Agasobanuye HD cinema & live TV streaming platform, featuring verified Kigali broadcasters, FM radio stations, and fast MTN MoMo VIP access.
          </p>

          <div className="flex items-center gap-2 pt-1">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#00e5ff]" />
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shadow-[0_0_6px_#2563eb]" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#00e676]" />
            <span className="text-[11px] text-cyan-300 font-bold uppercase tracking-wider ml-1">
              Blue & Green Neon Core
            </span>
          </div>

          {onReplayIntro && (
            <button
              onClick={onReplayIntro}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-cyan-500/30 hover:border-cyan-400 text-cyan-400 hover:text-white text-[11px] font-bold transition-all cursor-pointer shadow"
            >
              <Sparkles className="w-3.5 h-3.5" /> Replay Intro Animation
            </button>
          )}
        </div>

        {/* Column 2: Navigation Links */}
        <div>
          <h4 className="text-xs font-black text-white uppercase tracking-wider mb-3">Gahunda & Filime</h4>
          <ul className="space-y-2 text-xs">
            <li>
              <button onClick={() => setActiveTab('home')} className="hover:text-cyan-400 transition-colors">
                Ahabanza (Home Streaming Hub)
              </button>
            </li>
            <li>
              <button onClick={() => setActiveTab('movies')} className="hover:text-cyan-400 transition-colors">
                Filime Zisobanuye (Movies Catalog)
              </button>
            </li>
            <li>
              <button onClick={() => setActiveTab('series')} className="hover:text-cyan-400 transition-colors">
                TV Series & Seasons (Episodi)
              </button>
            </li>
            <li>
              <button onClick={() => setActiveTab('channels')} className="hover:text-emerald-400 transition-colors flex items-center gap-1">
                <Radio className="w-3.5 h-3.5 text-emerald-400" /> Live Rwandan TV Channels
              </button>
            </li>
            <li>
              <button onClick={() => setActiveTab('radio')} className="hover:text-cyan-400 transition-colors flex items-center gap-1">
                Radio FM zo mu Rwanda
              </button>
            </li>
          </ul>
        </div>

        {/* Column 3: Membership & Mobile Money */}
        <div>
          <h4 className="text-xs font-black text-white uppercase tracking-wider mb-3">VIP Membership & MoMo</h4>
          <ul className="space-y-2 text-xs">
            <li>
              <button onClick={onOpenSubscribe} className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-emerald-400" /> MTN MoMo & Airtel Money VIP Pass
              </button>
            </li>
            <li>
              <span className="text-slate-400">1080p Full HD & Offline Downloads</span>
            </li>
            <li>
              <span className="text-slate-400">Unlimited translation audio streams</span>
            </li>
            {onOpenSettings && (
              <li>
                <button onClick={onOpenSettings} className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 pt-1">
                  <Settings className="w-3.5 h-3.5" /> Settings & Konti Yawe
                </button>
              </li>
            )}
          </ul>
        </div>

        {/* Column 4: Platform Status & Admin Access */}
        <div className="space-y-3">
          <h4 className="text-xs font-black text-white uppercase tracking-wider">System & Developer</h4>
          <div className="p-3 rounded-2xl bg-slate-950 border border-cyan-900/40 space-y-2 font-mono text-[11px]">
            <div className="flex items-center gap-2 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>MediaCore HLS Engine</span>
            </div>
            <p className="text-slate-400">Database: WAL Synchronized</p>
          </div>

          <div className="pt-1 flex flex-col gap-2">
            {onOpenDeveloper && (
              <button
                onClick={onOpenDeveloper}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-950/80 to-emerald-950/80 hover:from-cyan-900 hover:to-emerald-900 border border-cyan-500/50 hover:border-emerald-400 text-cyan-300 hover:text-white transition-all text-[11px] font-bold flex items-center gap-1.5 cursor-pointer shadow"
                title="Developer Portfolio & Social Portals"
              >
                <Code2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Developer Portal & Contacts</span>
              </button>
            )}

            <button
              onClick={onOpenAdmin}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-cyan-900/40 hover:border-cyan-500/60 text-slate-300 hover:text-white transition-all text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer"
              title="Admin Access"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>Admin Management Portal</span>
            </button>
          </div>
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="max-w-7xl mx-auto pt-6 border-t border-slate-900/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500 font-mono">
        <p>© 2026 MediaCoreTV. All Rights Reserved.</p>
        <p className="flex items-center gap-1 text-slate-400">
          Engineered with <span className="text-cyan-400">Neon Blue</span> & <span className="text-emerald-400">Emerald Green</span> Core
        </p>
      </div>
    </footer>
  );
};
