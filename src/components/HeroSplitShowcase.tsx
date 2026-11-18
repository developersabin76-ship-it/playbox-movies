import React from 'react';
import { Play } from 'lucide-react';
import { MovieItem, SeriesItem } from '../types';

interface HeroSplitShowcaseProps {
  onSelectMovie?: (movie: MovieItem) => void;
  onSelectSeries?: (series: SeriesItem, seasonNumber?: number, episodeNumber?: number) => void;
  movies?: MovieItem[];
  series?: SeriesItem[];
}

export const HeroSplitShowcase: React.FC<HeroSplitShowcaseProps> = ({
  onSelectMovie,
  onSelectSeries,
  movies = [],
  series = []
}) => {
  // 5 Vertical Movie Posters matching the screenshot
  const showcaseMovies = [
    {
      id: 'showcase-1',
      title: 'Agasobanuye',
      subtitle: 'Action / Fast Mission',
      poster: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=350&q=80',
      tag: 'Agasobanuye'
    },
    {
      id: 'showcase-2',
      title: 'Suitian Ramine',
      subtitle: 'Mystery / Hitman Shadow',
      poster: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=350&q=80',
      tag: 'Suitian Ramine'
    },
    {
      id: 'showcase-3',
      title: 'Comedy',
      subtitle: 'Comedy / Laugh Out Loud',
      poster: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=350&q=80',
      tag: 'Comedy'
    },
    {
      id: 'showcase-4',
      title: 'Agasobanuye',
      subtitle: 'Action Squad Mission',
      poster: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=350&q=80',
      tag: 'Agasobanuye'
    },
    {
      id: 'showcase-5',
      title: 'Monda',
      subtitle: 'Adventure Kingdom',
      poster: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=350&q=80',
      tag: 'Monda'
    }
  ];

  // 4 TV Series Episodes matching the screenshot
  const showcaseTvShows = [
    {
      id: 'showcase-tv-1',
      title: 'Drama Series',
      episodesCount: 26,
      image: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=500&q=80'
    },
    {
      id: 'showcase-tv-2',
      title: 'Drama Series',
      episodesCount: 26,
      image: 'https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?auto=format&fit=crop&w=500&q=80'
    },
    {
      id: 'showcase-tv-3',
      title: 'Drama Series',
      episodesCount: 24,
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=80'
    },
    {
      id: 'showcase-tv-4',
      title: 'Drama Series',
      episodesCount: 25,
      image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=500&q=80'
    }
  ];

  const handleMovieClick = (index: number) => {
    if (movies.length > index && onSelectMovie) {
      onSelectMovie(movies[index]);
    } else if (movies.length > 0 && onSelectMovie) {
      onSelectMovie(movies[0]);
    }
  };

  const handleTvClick = (index: number) => {
    if (series.length > index && onSelectSeries) {
      onSelectSeries(series[index], 1, 1);
    } else if (series.length > 0 && onSelectSeries) {
      onSelectSeries(series[0], 1, 1);
    }
  };

  return (
    <section className="w-full my-3 grid grid-cols-1 xl:grid-cols-12 gap-3.5 select-none">
      {/* =========================================================================
          LEFT CARD: FILIME (MOVIES) WITH POSTERS + VINTAGE FILM REEL ARTWORK
          ========================================================================= */}
      <div className="xl:col-span-7 relative rounded-3xl bg-gradient-to-r from-[#061733] via-[#041228] to-[#020b1b] border border-cyan-500/35 p-4 sm:p-5 shadow-[0_0_35px_rgba(0,240,255,0.14)] overflow-hidden flex flex-col justify-between group">
        
        {/* Subtle Top Cyan Glow Line */}
        <div className="absolute top-0 left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-80" />

        {/* Card Header */}
        <div className="flex items-center justify-between mb-3.5 z-10">
          <h2 className="text-sm sm:text-base font-black tracking-wider text-white uppercase drop-shadow-md">
            FILIME (MOVIES)
          </h2>
        </div>

        {/* Inner Posters + Film Reel Background Layout */}
        <div className="relative z-10 grid grid-cols-5 gap-2 sm:gap-2.5 items-end">
          
          {/* Background Cinematic Film Reel Projector Artwork (Right-aligned inside card) */}
          <div className="absolute right-0 -bottom-3 top-0 w-1/2 pointer-events-none opacity-45 sm:opacity-55 mix-blend-screen flex items-center justify-end overflow-hidden z-0">
            <svg
              viewBox="0 0 320 220"
              className="w-full h-full object-contain filter drop-shadow-[0_0_15px_rgba(0,240,255,0.5)]"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Large Projector Reel */}
              <circle cx="210" cy="110" r="85" stroke="#38bdf8" strokeWidth="6" opacity="0.8" />
              <circle cx="210" cy="110" r="76" stroke="#00f0ff" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.6" />
              <circle cx="210" cy="110" r="30" fill="#061834" stroke="#38bdf8" strokeWidth="4" />
              <circle cx="210" cy="110" r="10" fill="#00f0ff" opacity="0.9" />
              {/* Spool Cutouts */}
              <circle cx="210" cy="55" r="14" fill="#040d1e" stroke="#38bdf8" strokeWidth="2.5" />
              <circle cx="258" cy="82" r="14" fill="#040d1e" stroke="#38bdf8" strokeWidth="2.5" />
              <circle cx="258" cy="138" r="14" fill="#040d1e" stroke="#38bdf8" strokeWidth="2.5" />
              <circle cx="210" cy="165" r="14" fill="#040d1e" stroke="#38bdf8" strokeWidth="2.5" />
              <circle cx="162" cy="138" r="14" fill="#040d1e" stroke="#38bdf8" strokeWidth="2.5" />
              <circle cx="162" cy="82" r="14" fill="#040d1e" stroke="#38bdf8" strokeWidth="2.5" />

              {/* Smaller Interlocking Reel */}
              <circle cx="115" cy="140" r="55" stroke="#0284c7" strokeWidth="4.5" opacity="0.7" />
              <circle cx="115" cy="140" r="20" fill="#040d1e" stroke="#38bdf8" strokeWidth="3" />
              <circle cx="115" cy="140" r="6" fill="#00f0ff" />
              <circle cx="115" cy="105" r="9" fill="#030914" stroke="#38bdf8" strokeWidth="2" />
              <circle cx="145" cy="122" r="9" fill="#030914" stroke="#38bdf8" strokeWidth="2" />
              <circle cx="145" cy="158" r="9" fill="#030914" stroke="#38bdf8" strokeWidth="2" />
              <circle cx="115" cy="175" r="9" fill="#030914" stroke="#38bdf8" strokeWidth="2" />
              <circle cx="85" cy="158" r="9" fill="#030914" stroke="#38bdf8" strokeWidth="2" />
              <circle cx="85" cy="122" r="9" fill="#030914" stroke="#38bdf8" strokeWidth="2" />

              {/* Connecting Film Strip */}
              <path
                d="M 125 86 C 160 70, 185 85, 210 110"
                stroke="#00f0ff"
                strokeWidth="4"
                strokeDasharray="4 2"
                opacity="0.75"
              />
            </svg>
          </div>

          {/* 5 Vertical Posters */}
          {showcaseMovies.map((m, idx) => (
            <div
              key={m.id}
              onClick={() => handleMovieClick(idx)}
              className="group/poster flex flex-col cursor-pointer z-10 transition-transform duration-200 hover:-translate-y-1"
            >
              <div className="relative aspect-[3/4.4] w-full rounded-xl sm:rounded-2xl overflow-hidden border border-cyan-500/30 group-hover/poster:border-cyan-400 group-hover/poster:shadow-[0_0_15px_rgba(0,240,255,0.4)] transition-all bg-slate-900">
                <img
                  src={m.poster}
                  alt={m.title}
                  className="w-full h-full object-cover group-hover/poster:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover/poster:opacity-40 transition-opacity" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/poster:opacity-100 transition-opacity bg-black/40">
                  <div className="w-8 h-8 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center shadow-[0_0_12px_#00f0ff]">
                    <Play className="w-4 h-4 fill-slate-950 ml-0.5" />
                  </div>
                </div>
              </div>

              {/* Caption Underneath */}
              <span className="text-[11px] sm:text-xs font-bold text-slate-200 group-hover/poster:text-cyan-300 truncate mt-1.5 transition-colors">
                {m.tag}
              </span>
            </div>
          ))}

        </div>
      </div>

      {/* =========================================================================
          RIGHT CARD: | TELEVIZIYO (TV SHOWS) WITH 4 WIDESCREEN EPISODES
          ========================================================================= */}
      <div className="xl:col-span-5 relative rounded-3xl bg-gradient-to-r from-[#061733] via-[#041228] to-[#020b1b] border border-cyan-500/35 p-4 sm:p-5 shadow-[0_0_35px_rgba(0,240,255,0.14)] overflow-hidden flex flex-col justify-between group">
        
        {/* Subtle Top Cyan Glow Line */}
        <div className="absolute top-0 left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-80" />

        {/* Card Header with Vertical Amber Accent Bar */}
        <div className="flex items-center gap-2 mb-3.5 z-10">
          <span className="w-1.5 h-4 bg-amber-400 rounded-full shadow-[0_0_8px_#f59e0b]" />
          <h2 className="text-sm sm:text-base font-black tracking-wider text-white uppercase drop-shadow-md">
            TELEVIZIYO (TV SHOWS)
          </h2>
        </div>

        {/* 4 Horizontal Episode Cards */}
        <div className="relative z-10 grid grid-cols-4 gap-2 sm:gap-2.5 items-end">
          {showcaseTvShows.map((tv, idx) => (
            <div
              key={tv.id}
              onClick={() => handleTvClick(idx)}
              className="group/tv flex flex-col cursor-pointer z-10 transition-transform duration-200 hover:-translate-y-1"
            >
              <div className="relative aspect-[16/10] w-full rounded-xl sm:rounded-2xl overflow-hidden border border-cyan-500/30 group-hover/tv:border-cyan-400 group-hover/tv:shadow-[0_0_15px_rgba(0,240,255,0.4)] transition-all bg-slate-900">
                <img
                  src={tv.image}
                  alt={tv.title}
                  className="w-full h-full object-cover group-hover/tv:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-50 group-hover/tv:opacity-30 transition-opacity" />

                {/* Episode Count Badge in Bottom Right Corner (e.g. 26, 24, 25) */}
                <div className="absolute bottom-1 right-1 sm:bottom-1.5 sm:right-1.5 px-1.5 py-0.5 rounded-md bg-black/80 border border-slate-700/80 text-white font-black text-[10px] leading-tight shadow-md">
                  {tv.episodesCount}
                </div>

                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/tv:opacity-100 transition-opacity bg-black/40">
                  <div className="w-7 h-7 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center shadow-[0_0_10px_#00f0ff]">
                    <Play className="w-3.5 h-3.5 fill-slate-950 ml-0.5" />
                  </div>
                </div>
              </div>

              {/* Caption Underneath */}
              <span className="text-[11px] sm:text-xs font-bold text-slate-200 group-hover/tv:text-cyan-300 truncate mt-1.5 transition-colors">
                {tv.title}
              </span>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
