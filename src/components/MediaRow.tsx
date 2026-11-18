import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { MediaItem } from '../types';
import { MediaCard } from './MediaCard';

interface MediaRowProps {
  title: string;
  icon?: React.ReactNode;
  subtitle?: string;
  items: MediaItem[];
  onPlay: (item: MediaItem) => void;
  onOpenDetails: (item: MediaItem) => void;
  onToggleWatchlist: (itemId: string) => void;
  watchlist: string[];
}

export const MediaRow: React.FC<MediaRowProps> = ({
  title,
  icon,
  subtitle,
  items = [],
  onPlay,
  onOpenDetails,
  onToggleWatchlist,
  watchlist = []
}) => {
  const rowRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollAmount = clientWidth * 0.75;
      rowRef.current.scrollTo({
        left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (!items || !items.length) return null;

  return (
    <section className="relative my-8 px-4 lg:px-8 max-w-7xl mx-auto">
      {/* Row Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          {icon && <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">{icon}</div>}
          <div>
            <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              {title}
            </h2>
            {subtitle && <p className="text-xs text-slate-400 font-medium">{subtitle}</p>}
          </div>
        </div>

        {/* Scroll Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleScroll('left')}
            className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white hover:border-cyan-500/50 transition-all"
            title="Scroll Left"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleScroll('right')}
            className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white hover:border-cyan-500/50 transition-all"
            title="Scroll Right"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Row Horizontal Slider */}
      <div
        ref={rowRef}
        className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth py-2 px-1"
      >
        {items.map((item) => (
          <div key={item.id} className="w-[180px] sm:w-[200px] md:w-[220px] flex-shrink-0">
            <MediaCard
              item={item}
              onPlay={onPlay}
              onOpenDetails={onOpenDetails}
              onToggleWatchlist={onToggleWatchlist}
              watchlist={watchlist}
            />
          </div>
        ))}
      </div>
    </section>
  );
};
