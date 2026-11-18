import React, { useState } from 'react';
import { Star, Play, Info, Sparkles, Film, Tv, CheckCircle2 } from 'lucide-react';
import {
  TmdbItem,
  getTmdbPosterUrl,
  getTmdbTitle,
  getTmdbYear,
  getTmdbMediaType,
  NO_POSTER_PLACEHOLDER
} from '../services/tmdbService';
import { MovieItem, SeriesItem } from '../types';

interface TmdbPosterCardProps {
  item: TmdbItem;
  defaultType?: 'movie' | 'tv';
  onClick: (item: TmdbItem) => void;
  myMovies?: (MovieItem | SeriesItem)[];
}

export const TmdbPosterCard: React.FC<TmdbPosterCardProps> = ({
  item,
  defaultType = 'movie',
  onClick,
  myMovies = []
}) => {
  const [imageError, setImageError] = useState(false);
  const title = getTmdbTitle(item);
  const year = getTmdbYear(item);
  const mediaType = getTmdbMediaType(item, defaultType || 'movie');
  const rating = item.vote_average ? Number(item.vote_average).toFixed(1) : 'N/A';

  // Check if this TMDB item matches any movie in "My Movies"
  const hasAuthorizedStream = myMovies.some(
    (m) =>
      m.title.toLowerCase().trim() === title.toLowerCase().trim() ||
      (m as any).tmdb_id === item.id ||
      (m.originalTitle && m.originalTitle.toLowerCase().trim() === title.toLowerCase().trim())
  );

  const posterSrc = imageError ? NO_POSTER_PLACEHOLDER : getTmdbPosterUrl(item.poster_path, 'w500');

  return (
    <div
      onClick={() => onClick(item)}
      className="group relative rounded-2xl overflow-hidden bg-[#0c1322] border border-slate-800/80 hover:border-red-500/80 hover:shadow-2xl hover:shadow-red-950/30 cursor-pointer transition-all duration-300 flex flex-col"
    >
      {/* Poster Image Container */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-950">
        <img
          src={posterSrc}
          alt={title}
          onError={() => setImageError(true)}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-[#070b14] via-[#070b14]/20 to-transparent opacity-85" />

        {/* Media Type Badge (Movie vs TV) */}
        <div className="absolute top-2 left-2 flex items-center gap-1">
          <span
            className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider shadow flex items-center gap-1 ${
              mediaType === 'tv'
                ? 'bg-blue-600 text-white'
                : 'bg-red-600 text-white'
            }`}
          >
            {mediaType === 'tv' ? <Tv className="w-2.5 h-2.5" /> : <Film className="w-2.5 h-2.5" />}
            {mediaType === 'tv' ? 'TV SHOW' : 'MOVIE'}
          </span>
        </div>

        {/* Authorized My Movies Tag if matching video is in local/cloud library */}
        {hasAuthorizedStream && (
          <div className="absolute top-2 right-2">
            <span className="px-1.5 py-0.5 rounded-md text-[8px] font-black bg-cyan-400 text-slate-950 shadow-[0_0_8px_#00f0ff] flex items-center gap-0.5">
              <CheckCircle2 className="w-2.5 h-2.5" /> PLAYABLE
            </span>
          </div>
        )}

        {/* Rating Floating Tag */}
        <div className="absolute bottom-2 right-2 z-10 pointer-events-none">
          <span className="flex items-center gap-1 text-amber-400 font-bold text-[10px] bg-slate-950/85 px-2 py-0.5 rounded-md border border-slate-800 backdrop-blur-sm">
            <Star className="w-2.5 h-2.5 fill-amber-400" />
            {rating}
          </span>
        </div>

        {/* Hover Quick Action Overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
          <div className="w-11 h-11 rounded-full bg-red-600 text-white flex items-center justify-center shadow-xl transform scale-90 group-hover:scale-100 transition-transform">
            <Play className="w-5 h-5 fill-white ml-0.5" />
          </div>
        </div>
      </div>

      {/* Title & Metadata Card Footer */}
      <div className="p-3 flex-1 flex flex-col justify-between bg-gradient-to-b from-[#0c1322] to-[#080d1a]">
        <div>
          <h3
            className="text-xs font-bold text-white group-hover:text-red-400 transition-colors line-clamp-1"
            title={title}
          >
            {title}
          </h3>
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5">
          <span className="font-mono">{year}</span>
          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
            {mediaType === 'tv' ? 'Series' : 'Film'}
          </span>
        </div>
      </div>
    </div>
  );
};
