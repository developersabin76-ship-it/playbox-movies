import React from 'react';
import { Play, Plus, Check, Star, Mic2, Film } from 'lucide-react';
import { MediaItem } from '../types';

interface MediaCardProps {
  item: MediaItem;
  onPlay: (item: MediaItem) => void;
  onOpenDetails: (item: MediaItem) => void;
  onToggleWatchlist: (itemId: string) => void;
  watchlist: string[];
}

export const MediaCard: React.FC<MediaCardProps> = ({
  item,
  onPlay,
  onOpenDetails,
  onToggleWatchlist,
  watchlist
}) => {
  const isInWatchlist = watchlist.includes(item.id);
  const umusobanuzi = (item as any).umusobanuzi || item.director || 'Rocky Kimomo';
  const isSeries = item.type === 'series' || ((item as any).type_category || '').toLowerCase().includes('series');

  return (
    <div className="group relative rounded-2xl overflow-hidden bg-[#060e1d] border border-cyan-500/30 hover:border-cyan-400 flex flex-col h-full select-none cursor-pointer transition-all shadow-lg hover:shadow-[0_0_20px_rgba(0,240,255,0.25)]">
      
      {/* Poster Image Container */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-950" onClick={() => onOpenDetails(item)}>
        <img
          src={item.posterUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80'}
          alt={item.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#040914] via-[#040914]/25 to-transparent opacity-90 group-hover:opacity-60 transition-opacity" />

        {/* Top Badges (Bright Blue Mirror glass badge) */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-10 gap-1.5">
          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black bg-gradient-to-r from-cyan-400 to-sky-400 text-slate-950 shadow-md shadow-cyan-500/40 uppercase tracking-wider">
            {isSeries ? 'Series' : 'Filme'}
          </span>

          <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black bg-slate-950/85 text-amber-400 border border-amber-500/40 backdrop-blur-md shadow-sm">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            {item.rating || 9.5}
          </div>
        </div>

        {/* Umusobanuzi pill on bottom-left of poster */}
        <div className="absolute bottom-2.5 left-2.5 z-10 pointer-events-none">
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-950/90 text-cyan-300 border border-cyan-400/50 backdrop-blur-md flex items-center gap-1 shadow-[0_0_8px_rgba(0,229,255,0.3)]">
            <Mic2 className="w-2.5 h-2.5 text-cyan-400" />
            {umusobanuzi}
          </span>
        </div>

        {/* Quick Hover Overlay with Play Button */}
        <div className="absolute inset-0 bg-slate-950/65 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 p-4 z-20">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPlay(item);
            }}
            className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 flex items-center justify-center shadow-lg shadow-cyan-400/50 hover:scale-110 transition-transform font-black"
            title="Watch Now"
          >
            <Play className="w-5 h-5 fill-slate-950 ml-0.5 text-slate-950" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleWatchlist(item.id);
            }}
            className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all ${
              isInWatchlist
                ? 'bg-cyan-400 text-slate-950 border-cyan-400 shadow-[0_0_10px_#00f0ff]'
                : 'bg-slate-900/90 text-white border-slate-700 hover:border-cyan-400 hover:text-cyan-400'
            }`}
            title="Toggle Watchlist"
          >
            {isInWatchlist ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4 text-white" />}
          </button>
        </div>
      </div>

      {/* Card Info Section */}
      <div className="p-3 flex-1 flex flex-col justify-between bg-gradient-to-b from-[#091122] to-[#040814] relative z-10 border-t border-cyan-500/20">
        <div>
          <h3
            onClick={() => onOpenDetails(item)}
            className="text-xs sm:text-sm font-black text-white group-hover:text-cyan-300 transition-colors line-clamp-1 mb-1 tracking-tight"
          >
            {item.title}
          </h3>

          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
            <span className="text-cyan-400 font-bold">{item.releaseYear || 2026}</span>
            <span>•</span>
            <span className="text-slate-300">{item.duration || '01:43:10'}</span>
            <span>•</span>
            <span className="text-cyan-400 font-bold">1080p HD</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 pt-2 mt-2 border-t border-slate-800/80">
          <span className="text-slate-300 truncate max-w-[120px] flex items-center gap-1">
            <Film className="w-3 h-3 text-cyan-400" />
            {isSeries ? 'Series' : 'Filme'}
          </span>
          <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-cyan-950/80 text-cyan-300 border border-cyan-400/40 shadow-[0_0_8px_rgba(0,229,255,0.2)]">
            AGASOBANUYE
          </span>
        </div>
      </div>
    </div>
  );
};
