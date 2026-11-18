import React, { useState } from 'react';
import {
  Tv,
  Radio,
  Search,
  Users,
  Play,
  Globe,
  Star,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { TVChannelItem } from '../types';

interface TvChannelsDirectoryProps {
  channels: TVChannelItem[];
  onSelectChannel: (channel: TVChannelItem) => void;
}

export const TvChannelsDirectory: React.FC<TvChannelsDirectoryProps> = ({
  channels = [],
  onSelectChannel
}) => {
  const [selectedCountry, setSelectedCountry] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const countries = ['ALL', 'Rwanda', 'Kenya', 'Uganda', 'Tanzania', 'Nigeria', 'South Africa', 'International'];
  const categories = ['ALL', 'Rwandan TV', 'Entertainment', 'News & Sports', 'Youth & Music', 'Culture'];

  const filtered = channels.filter((c) => {
    if (selectedCountry !== 'ALL' && c.country !== selectedCountry) return false;
    if (selectedCategory !== 'ALL' && c.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.country.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-8 space-y-6 select-none">
      
      {/* Directory Hero Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-blue-950/60 via-slate-900/90 to-cyan-950/40 border border-blue-900/40 shadow-2xl relative overflow-hidden">
        <div className="max-w-2xl space-y-2 relative z-10">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-400/40 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
              <Radio className="w-3 h-3 text-cyan-400" /> OFFICIAL DIRECT BROADCASTS
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            TV Channels & Live Streams
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Browse verified high-definition TV stations across Rwanda, East Africa, and international networks with zero latency and 24/7 crystal-clear digital transmission.
          </p>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search channels by name or country..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full md:w-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Country Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar border-b border-slate-800 pb-3">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-2 shrink-0">
          Filter Country:
        </span>
        {countries.map((country) => (
          <button
            key={country}
            onClick={() => setSelectedCountry(country)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCountry === country
                ? 'bg-slate-800 text-cyan-400 border border-cyan-400/40 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            {country}
          </button>
        ))}
      </div>

      {/* Channels Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map((channel) => (
          <div
            key={channel.id}
            onClick={() => onSelectChannel(channel)}
            className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-cyan-400/60 hover:bg-slate-900 cursor-pointer transition-all shadow-lg flex flex-col justify-between gap-4 group"
          >
            {/* Top Bar: Logo & Badges */}
            <div className="flex items-center justify-between gap-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-slate-800 p-1.5 flex items-center justify-center shrink-0 shadow-md">
                <img
                  src={channel.logo || channel.logoUrl}
                  alt={channel.name}
                  className="w-full h-full object-contain rounded-xl group-hover:scale-105 transition-transform"
                />
              </div>

              <div className="flex flex-col items-end gap-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-red-600/90 text-white flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" /> LIVE
                </span>
                <span className="text-[10px] font-mono text-cyan-400 font-bold">
                  {channel.category}
                </span>
              </div>
            </div>

            {/* Middle: Title & Program */}
            <div>
              <h3 className="text-sm font-black text-white group-hover:text-cyan-400 transition-colors truncate">
                {channel.name}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">
                {channel.currentProgram || `${channel.name} Broadcast`}
              </p>
            </div>

            {/* Bottom: Country & Watch CTA */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-mono font-semibold flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-blue-400" /> {channel.country}
              </span>

              <span className="text-xs font-bold text-cyan-400 group-hover:text-cyan-300 flex items-center gap-1 transition-colors">
                <Play className="w-3.5 h-3.5 fill-current" /> Watch Stream
              </span>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="py-16 text-center text-slate-400 text-xs">
          No TV stations match your filter criteria.
        </div>
      )}

    </div>
  );
};
