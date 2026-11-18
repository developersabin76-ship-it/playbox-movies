import React from 'react';
import {
  X,
  Play,
  Bookmark,
  Check,
  Star,
  Clock,
  Share2,
  Lock,
  Layers,
  Film
} from 'lucide-react';
import { MovieItem, SeriesItem, UserProfile } from '../types';

interface MovieDetailsModalProps {
  item: MovieItem | SeriesItem | null;
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onPlayMovie: (movie: MovieItem) => void;
  onPlaySeries: (series: SeriesItem) => void;
  onToggleWatchlist: (id: string) => void;
}

export const MovieDetailsModal: React.FC<MovieDetailsModalProps> = ({
  item,
  isOpen,
  onClose,
  user,
  onPlayMovie,
  onPlaySeries,
  onToggleWatchlist
}) => {
  if (!isOpen || !item) return null;

  const isSeries = 'seasons' in item;
  const isWatchlisted = user.watchlist.includes(item.id);

  const handlePlay = () => {
    onClose();
    if (isSeries) {
      onPlaySeries(item as SeriesItem);
    } else {
      onPlayMovie(item as MovieItem);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto select-none">
      <div className="relative w-full max-w-3xl rounded-3xl bg-[#080d1a] border border-blue-900/40 shadow-2xl overflow-hidden my-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-slate-950/80 border border-slate-800 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Backdrop Banner Header */}
        <div className="relative h-64 sm:h-80 w-full overflow-hidden bg-black">
          <img
            src={item.backdropUrl || item.posterUrl}
            alt={item.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#080d1a] via-[#080d1a]/50 to-transparent" />

          {/* Floating Action Button */}
          <div className="absolute bottom-6 left-6 sm:left-8 flex items-center gap-3">
            <button
              onClick={handlePlay}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white font-black text-xs sm:text-sm shadow-xl shadow-blue-900/50 hover:scale-105 transition-all flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-current translate-x-0.5" />
              <span>{isSeries ? 'Watch Series Episodes' : 'Watch Movie Now'}</span>
            </button>

            <button
              onClick={() => onToggleWatchlist(item.id)}
              className={`px-4 py-3.5 rounded-2xl border text-xs font-bold transition-all flex items-center gap-2 ${
                isWatchlisted
                  ? 'bg-blue-600 text-white border-blue-500'
                  : 'bg-slate-900/80 text-white border-slate-700 hover:bg-slate-800'
              }`}
            >
              {isWatchlisted ? <Check className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
              <span>{isWatchlisted ? 'Saved in List' : '+ My List'}</span>
            </button>
          </div>
        </div>

        {/* Details Information Body */}
        <div className="p-6 sm:p-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl sm:text-2xl font-black text-white">{item.title}</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-blue-600 text-white uppercase">
                  {isSeries ? 'TV SERIES' : 'MOVIE'}
                </span>
                {item.access === 'PREMIUM' && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500 text-slate-950 uppercase">
                    VIP PASS
                  </span>
                )}
              </div>

              {item.director && (
                <span className="text-xs font-bold text-emerald-400">
                  Umusobanuzi / Director: {item.director}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-amber-400 font-bold text-xs bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-800">
                <Star className="w-3.5 h-3.5 fill-current" /> {item.rating || 9.5}
              </span>
              <span className="text-xs font-mono text-slate-300 bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-800">
                {item.year}
              </span>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {item.description}
          </p>

          {/* Genres Badges */}
          <div className="flex items-center gap-1.5 flex-wrap pt-2">
            {item.genres?.map((g) => (
              <span
                key={g}
                className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-300"
              >
                {g}
              </span>
            ))}
          </div>

        </div>

      </div>
    </div>
  );
};
