import React, { useState } from 'react';
import {
  Grid,
  Film,
  Layers,
  Star,
  Play,
  Bookmark,
  Sparkles
} from 'lucide-react';
import { MovieItem, SeriesItem, CategoryItem } from '../types';

interface CategoriesViewProps {
  categories: CategoryItem[];
  movies: MovieItem[];
  series: SeriesItem[];
  onSelectMovie: (movie: MovieItem) => void;
  onSelectSeries: (series: SeriesItem, seasonNumber?: number, episodeNumber?: number) => void;
}

export const CategoriesView: React.FC<CategoriesViewProps> = ({
  categories = [],
  movies = [],
  series = [],
  onSelectMovie,
  onSelectSeries
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>(categories[0]?.name || 'Agasobanuye');
  const [contentType, setContentType] = useState<'all' | 'movies' | 'series'>('all');

  const filteredMovies = movies.filter((m) =>
    m.genres.some((g) => g.toLowerCase() === selectedCategory.toLowerCase())
  );

  const filteredSeries = series.filter((s) =>
    s.genres.some((g) => g.toLowerCase() === selectedCategory.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-8 space-y-8 select-none">
      
      {/* Category Hero */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Grid className="w-5 h-5 text-blue-400" />
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wide">
            Explore Categories & Genres
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-400">
          Browse specialized Agasobanuye translations, Rwandan blockbusters, Hollywood action, and gripping drama series.
        </p>
      </div>

      {/* Category Pills Slider */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
        {categories.map((cat) => {
          const isSelected = cat.name.toLowerCase() === selectedCategory.toLowerCase();
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.name)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black whitespace-nowrap transition-all flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-600 text-slate-950 shadow-[0_0_15px_#00e5ff]'
                  : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <span>{cat.icon || '🎬'}</span>
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* Filter Switcher (All / Movies / Series) */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setContentType('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              contentType === 'all' ? 'bg-cyan-500 text-slate-950 font-black shadow-[0_0_10px_#00e5ff]' : 'text-slate-400 hover:text-white'
            }`}
          >
            All Content
          </button>
          <button
            onClick={() => setContentType('movies')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              contentType === 'movies' ? 'bg-cyan-500 text-slate-950 font-black shadow-[0_0_10px_#00e5ff]' : 'text-slate-400 hover:text-white'
            }`}
          >
            Movies Only ({filteredMovies.length})
          </button>
          <button
            onClick={() => setContentType('series')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              contentType === 'series' ? 'bg-cyan-500 text-slate-950 font-black shadow-[0_0_10px_#00e5ff]' : 'text-slate-400 hover:text-white'
            }`}
          >
            Series Only ({filteredSeries.length})
          </button>
        </div>
      </div>

      {/* Content Grid */}
      <div className="space-y-8">
        
        {/* Series Section */}
        {(contentType === 'all' || contentType === 'series') && filteredSeries.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" /> TV Series in {selectedCategory}
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {filteredSeries.map((s) => (
                <div
                  key={s.id}
                  onClick={() => onSelectSeries(s, 1, 1)}
                  className="group relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 hover:border-cyan-400/70 cursor-pointer transition-all flex flex-col shadow-lg"
                >
                  <div className="relative aspect-[2/3] w-full overflow-hidden bg-black">
                    <img src={s.posterUrl} alt={s.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    <span className="absolute top-2 left-2 px-1.5 py-0.2 rounded text-[9px] font-black bg-cyan-500 text-slate-950">
                      SERIES
                    </span>
                    {s.access === 'PREMIUM' && (
                      <span className="absolute top-2 right-2 px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-400 text-slate-950">
                        VIP
                      </span>
                    )}
                  </div>
                  <div className="p-2.5">
                    <h3 className="text-xs font-bold text-white group-hover:text-cyan-400 truncate">{s.title}</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">{s.seasons?.length || 1} Seasons</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Movies Section */}
        {(contentType === 'all' || contentType === 'movies') && filteredMovies.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <Film className="w-4 h-4 text-cyan-400" /> Movies in {selectedCategory}
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {filteredMovies.map((m) => (
                <div
                  key={m.id}
                  onClick={() => onSelectMovie(m)}
                  className="group relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 hover:border-cyan-400/70 cursor-pointer transition-all flex flex-col shadow-lg"
                >
                  <div className="relative aspect-[2/3] w-full overflow-hidden bg-black">
                    <img src={m.posterUrl} alt={m.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    <span className="absolute top-2 right-2 px-1.5 py-0.2 rounded text-[9px] font-black bg-blue-600 text-white">
                      1080p
                    </span>
                    {m.access === 'PREMIUM' && (
                      <span className="absolute top-2 left-2 px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-400 text-slate-950">
                        VIP
                      </span>
                    )}
                  </div>
                  <div className="p-2.5">
                    <h3 className="text-xs font-bold text-white group-hover:text-cyan-400 truncate">{m.title}</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">{m.year}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {filteredMovies.length === 0 && filteredSeries.length === 0 && (
          <div className="py-16 text-center text-slate-400 text-xs">
            No content found in the "{selectedCategory}" category yet.
          </div>
        )}

      </div>
    </div>
  );
};
