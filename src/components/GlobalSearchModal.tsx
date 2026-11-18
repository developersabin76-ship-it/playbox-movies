import React, { useState, useEffect } from 'react';
import {
  Search,
  X,
  Play,
  Star,
  Film,
  Layers,
  Tv,
  ArrowRight
} from 'lucide-react';
import { MovieItem, SeriesItem, TVChannelItem } from '../types';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  movies: MovieItem[];
  series: SeriesItem[];
  channels: TVChannelItem[];
  onSelectMovie: (movie: MovieItem) => void;
  onSelectSeries: (series: SeriesItem, seasonNumber?: number, episodeNumber?: number) => void;
  onSelectChannel: (channel: TVChannelItem) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  movies = [],
  series = [],
  channels = [],
  onSelectMovie,
  onSelectSeries,
  onSelectChannel
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const cleanQuery = query.toLowerCase().trim();

  const filteredMovies = cleanQuery
    ? movies.filter(
        (m) =>
          m.title.toLowerCase().includes(cleanQuery) ||
          m.director?.toLowerCase().includes(cleanQuery) ||
          m.genres.some((g) => g.toLowerCase().includes(cleanQuery))
      )
    : [];

  const filteredSeries = cleanQuery
    ? series.filter(
        (s) =>
          s.title.toLowerCase().includes(cleanQuery) ||
          s.director?.toLowerCase().includes(cleanQuery) ||
          s.genres.some((g) => g.toLowerCase().includes(cleanQuery))
      )
    : [];

  const filteredChannels = cleanQuery
    ? channels.filter(
        (c) =>
          c.name.toLowerCase().includes(cleanQuery) ||
          c.category.toLowerCase().includes(cleanQuery) ||
          c.country.toLowerCase().includes(cleanQuery)
      )
    : [];

  const totalResults = filteredMovies.length + filteredSeries.length + filteredChannels.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 pt-16 sm:pt-20 bg-black/80 backdrop-blur-md overflow-y-auto select-none">
      <div className="relative w-full max-w-3xl rounded-3xl bg-[#080d1a] border border-blue-900/40 shadow-2xl overflow-hidden">
        
        {/* Search Input Bar */}
        <div className="p-4 sm:p-5 border-b border-blue-900/30 flex items-center gap-3">
          <Search className="w-5 h-5 text-blue-400 shrink-0" />
          <input
            autoFocus
            type="text"
            placeholder="Search movies, TV series, Agasobanuye, TV channels..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm sm:text-base font-bold text-white placeholder-slate-500 focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400 hover:text-white"
          >
            ESC
          </button>
        </div>

        {/* Results Container */}
        <div className="p-4 sm:p-6 max-h-[65vh] overflow-y-auto space-y-6">
          {!cleanQuery && (
            <div className="py-10 text-center space-y-3">
              <p className="text-xs text-slate-400">
                Type keywords like <span className="text-cyan-400 font-bold">"Junior Giti"</span>, <span className="text-blue-400 font-bold">"Action"</span>, <span className="text-white font-bold">"RBA TV"</span>, or <span className="text-amber-400 font-bold">"Dune"</span>
              </p>
            </div>
          )}

          {cleanQuery && totalResults === 0 && (
            <div className="py-12 text-center text-xs text-slate-400">
              No results found matching "{query}". Try checking your spelling or searching for a category.
            </div>
          )}

          {/* TV Series Results */}
          {filteredSeries.length > 0 && (
            <div className="space-y-3">
              <span className="text-[10px] font-black text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" /> TV SERIES ({filteredSeries.length})
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredSeries.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => {
                      onSelectSeries(s, 1, 1);
                      onClose();
                    }}
                    className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-blue-500/60 cursor-pointer transition-all flex items-center gap-3 group"
                  >
                    <img src={s.posterUrl} alt={s.title} className="w-12 h-16 rounded-xl object-cover shrink-0" />
                    <div className="flex-1 overflow-hidden">
                      <h4 className="text-xs font-black text-white group-hover:text-blue-400 truncate">
                        {s.title}
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {s.year} • {s.seasons?.length || 1} Seasons
                      </p>
                      <span className="text-[10px] text-cyan-400 font-semibold truncate block mt-0.5">
                        {s.director ? `Umusobanuzi: ${s.director}` : s.genres.join(', ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Movies Results */}
          {filteredMovies.length > 0 && (
            <div className="space-y-3">
              <span className="text-[10px] font-black text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Film className="w-3.5 h-3.5" /> MOVIES ({filteredMovies.length})
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredMovies.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => {
                      onSelectMovie(m);
                      onClose();
                    }}
                    className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-cyan-400/60 cursor-pointer transition-all flex items-center gap-3 group"
                  >
                    <img src={m.posterUrl} alt={m.title} className="w-12 h-16 rounded-xl object-cover shrink-0" />
                    <div className="flex-1 overflow-hidden">
                      <h4 className="text-xs font-black text-white group-hover:text-cyan-300 truncate">
                        {m.title}
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                        {m.year} • {m.duration}
                      </p>
                      <span className="text-[10px] text-slate-400 font-semibold truncate block mt-0.5">
                        {m.director ? `Umusobanuzi: ${m.director}` : m.genres.join(', ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Live Channels Results */}
          {filteredChannels.length > 0 && (
            <div className="space-y-3">
              <span className="text-[10px] font-black text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                <Tv className="w-3.5 h-3.5" /> TV CHANNELS ({filteredChannels.length})
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredChannels.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      onSelectChannel(c);
                      onClose();
                    }}
                    className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-purple-500/60 cursor-pointer transition-all flex items-center gap-3 group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 p-1 flex items-center justify-center shrink-0">
                      <img src={c.logo || c.logoUrl} alt={c.name} className="w-full h-full object-contain rounded-lg" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <h4 className="text-xs font-black text-white group-hover:text-purple-400 truncate">
                        {c.name}
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                        {c.category} • {c.country}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
