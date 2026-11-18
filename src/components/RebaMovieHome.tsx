import React, { useState, useEffect } from 'react';
import {
  Play,
  Plus,
  Tv,
  Film,
  Check,
  ChevronLeft,
  ChevronRight,
  Mic2,
  Radio
} from 'lucide-react';
import { MediaItem, TvChannel } from '../types';
import { MediaCard } from './MediaCard';

interface RebaMovieHomeProps {
  movies: MediaItem[];
  channels: TvChannel[];
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
  onPlayMovie: (movie: MediaItem) => void;
  onOpenMovieDetails: (movie: MediaItem) => void;
  onSelectChannel: (channel: TvChannel) => void;
  onOpenSearch: () => void;
  onToggleWatchlist: (id: string) => void;
  watchlist: string[];
}

// Curated default hero items for smooth 3-second carousel transition
const DEFAULT_HERO_MOVIES: MediaItem[] = [
  {
    id: 'hero_lucky_strike',
    title: 'LUCKY STRIKE',
    type: 'movie',
    duration: '01:43:10',
    genres: ['Action', 'Drama', 'Thriller'],
    releaseYear: 2026,
    director: 'Sikov',
    rating: 9.6,
    description: 'A wounded American soldier is trapped behind German lines during the Battle of the Bulge.',
    posterUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1200&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1600&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    isRwandan: true,
    isAfrican: true,
    isAgasobanuye: true
  },
  {
    id: 'hero_the_beekeeper',
    title: 'THE BEEKEEPER',
    type: 'movie',
    duration: '01:45:00',
    genres: ['Action', 'Thriller'],
    releaseYear: 2025,
    director: 'Rocky Kimomo',
    rating: 9.8,
    description: 'One mans brutal campaign for vengeance takes on national stakes after he is revealed to be a former operative.',
    posterUrl: 'https://images.unsplash.com/photo-1574267432553-4b4628081c31?auto=format&fit=crop&w=1200&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1574267432553-4b4628081c31?auto=format&fit=crop&w=1600&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    isRwandan: true,
    isAfrican: true,
    isAgasobanuye: true
  },
  {
    id: 'hero_dune_prophecy',
    title: 'DUNE PROPHECY',
    type: 'series',
    duration: '00:58:30',
    genres: ['Sci-Fi', 'Drama', 'Adventure'],
    releaseYear: 2026,
    director: 'Junior Giti',
    rating: 9.7,
    description: 'Set 10,000 years before the ascension of Paul Atreides, two Harkonnen sisters combat forces that threaten the future of humankind.',
    posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    isRwandan: true,
    isAfrican: true,
    isAgasobanuye: true
  }
];

export const RebaMovieHome: React.FC<RebaMovieHomeProps> = ({
  movies = [],
  channels = [],
  activeCategory,
  setActiveCategory,
  onPlayMovie,
  onOpenMovieDetails,
  onSelectChannel,
  onOpenSearch,
  onToggleWatchlist,
  watchlist = []
}) => {
  // Combine custom uploaded movies and curated list for the top 3-second carousel
  const heroMoviesList = React.useMemo(() => {
    const uploadedHeroItems = movies.filter((m) => (m as any).isHeroFeatured !== false);
    if (uploadedHeroItems.length > 0) {
      return [...uploadedHeroItems, ...DEFAULT_HERO_MOVIES];
    }
    return DEFAULT_HERO_MOVIES;
  }, [movies]);

  const [heroIndex, setHeroIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [filterTab, setFilterTab] = useState<'all' | 'movies' | 'series'>('all');
  const [selectedTranslator, setSelectedTranslator] = useState<string>('ALL');

  // 3-SECOND AUTO TRANSITION TIMER
  useEffect(() => {
    if (isPaused || heroMoviesList.length <= 1) return;

    const timer = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroMoviesList.length);
    }, 3000); // 3 seconds interval

    return () => clearInterval(timer);
  }, [isPaused, heroMoviesList.length]);

  const currentHero = heroMoviesList[heroIndex] || DEFAULT_HERO_MOVIES[0];
  const isCurrentHeroInWatchlist = watchlist.includes(currentHero.id);

  // Quick navigation handlers
  const handlePrevHero = () => {
    setHeroIndex((prev) => (prev - 1 + heroMoviesList.length) % heroMoviesList.length);
  };

  const handleNextHero = () => {
    setHeroIndex((prev) => (prev + 1) % heroMoviesList.length);
  };

  // Filter movies based on category, filterTab, and translator
  const filteredCatalogMovies = movies.filter((m) => {
    // 1. Tab filter (Zose / Filme gusa / Serie gusa)
    if (filterTab === 'movies') {
      const type = (m.type || '').toLowerCase();
      const cat = ((m as any).type_category || '').toLowerCase();
      if (type.includes('series') || cat.includes('series')) return false;
    } else if (filterTab === 'series') {
      const type = (m.type || '').toLowerCase();
      const cat = ((m as any).type_category || '').toLowerCase();
      if (!type.includes('series') && !cat.includes('series')) return false;
    }

    // 2. Umusobanuzi filter
    if (selectedTranslator !== 'ALL') {
      const u = ((m as any).umusobanuzi || m.director || '').toLowerCase();
      if (!u.includes(selectedTranslator.toLowerCase())) return false;
    }

    return true;
  });

  const translators = [
    'ALL',
    'Rocky Kimomo',
    'Junior Giti',
    'Sankara',
    'Sikov',
    'Yvan',
    'Savimbi',
    'Patrick',
    'Gasongo'
  ];

  const top10Channels = channels.slice(0, 10);

  return (
    <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 space-y-6 pb-20 pt-1 select-none">
      
      {/* 1. TOP BRAND LOGO (RebaMovie Brand header) */}
      <div className="flex items-center justify-between px-2 sm:px-4 pt-1">
        <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => setHeroIndex(0)}>
          <span className="text-2xl sm:text-3xl font-black tracking-tighter text-[#00e676] drop-shadow-md">
            reba
          </span>
          <span className="px-1.5 py-0.5 rounded-md bg-white text-slate-950 font-black text-xs uppercase tracking-wider">
            TV
          </span>
          <span className="hidden sm:inline-block ml-2 text-xs font-semibold text-slate-400">
            • Sabin Stream
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-[#00e676]/10 text-[#00e676] border border-[#00e676]/30 text-xs font-black flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#00e676] animate-pulse" />
            Agasobanuye HD & Live TV
          </span>
        </div>
      </div>

      {/* 2. HERO SHOWCASE CAROUSEL (Transitions every 3 seconds) */}
      <section
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        className="relative w-full rounded-3xl overflow-hidden min-h-[380px] sm:min-h-[460px] md:min-h-[520px] flex flex-col justify-end p-5 sm:p-8 md:p-12 border border-[#00e676]/20 bg-slate-950 shadow-2xl shadow-emerald-950/40 group transition-all duration-700"
      >
        {/* Background Image / Video with Dark Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src={currentHero.backdropUrl || currentHero.posterUrl}
            alt={currentHero.title}
            className="w-full h-full object-cover object-center transition-all duration-700 group-hover:scale-105 filter brightness-90"
          />
          {/* Multi-layered Vignette / Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#070d0a] via-[#070d0a]/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#070d0a] via-[#070d0a]/60 to-transparent" />
        </div>

        {/* 3-Second Transition Progress Bar at Top */}
        <div className="absolute top-3 left-4 right-4 z-20 flex items-center gap-1.5">
          {heroMoviesList.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setHeroIndex(idx)}
              className="flex-1 h-1 rounded-full bg-slate-700/60 overflow-hidden transition-all"
            >
              <div
                className={`h-full bg-[#00e676] transition-all duration-300 ${
                  idx === heroIndex ? 'w-full shadow-sm shadow-[#00e676]' : 'w-0'
                }`}
              />
            </button>
          ))}
        </div>

        {/* Next / Previous Arrow Controls */}
        <button
          onClick={handlePrevHero}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-slate-950/60 hover:bg-[#00e676] text-white hover:text-slate-950 flex items-center justify-center backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={handleNextHero}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-slate-950/60 hover:bg-[#00e676] text-white hover:text-slate-950 flex items-center justify-center backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Content Over Hero */}
        <div className="relative z-10 max-w-2xl space-y-3 sm:space-y-4">
          
          {/* Movie Title */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight uppercase leading-none drop-shadow-lg">
            {currentHero.title}
          </h1>

          {/* Metadata line */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm font-semibold text-slate-300">
            <span className="text-slate-300 font-mono">
              {currentHero.duration || '01:43:10'}
            </span>

            <span className="text-slate-600">|</span>

            {/* Genre tags */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {(currentHero.genres || ['Action']).map((g) => (
                <span
                  key={g}
                  className="px-2.5 py-0.5 rounded-full bg-slate-900/80 border border-slate-700/80 text-[11px] font-bold text-slate-200"
                >
                  {g}
                </span>
              ))}
            </div>

            <span className="text-slate-600">|</span>

            {/* Year */}
            <span className="text-slate-300">
              {currentHero.releaseYear || 2026}
            </span>

            {/* Umusobanuzi green badge */}
            <span className="px-2.5 py-0.5 rounded-full bg-[#00e676] text-slate-950 font-black text-[11px] tracking-wide shadow-sm shadow-[#00e676]/40 flex items-center gap-1">
              <Mic2 className="w-3 h-3 text-slate-950" />
              {(currentHero as any).umusobanuzi || currentHero.director || 'Sikov'}
            </span>
          </div>

          {/* Synopsis */}
          <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 sm:line-clamp-3 leading-relaxed max-w-xl">
            {currentHero.description ||
              'A wounded American soldier is trapped behind German lines during the Battle of the Bulge.'}
          </p>

          {/* Action Buttons: ▶ Yirebe & + Yirebe Nyuma */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => onPlayMovie(currentHero)}
              className="px-7 py-3 rounded-full bg-[#00e676] hover:bg-[#00c853] text-slate-950 font-black text-sm shadow-xl shadow-[#00e676]/40 hover:scale-105 transition-all flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>Yirebe</span>
            </button>

            <button
              onClick={() => onToggleWatchlist(currentHero.id)}
              className="px-6 py-3 rounded-full bg-slate-900/85 hover:bg-slate-800 text-white font-bold text-sm border border-slate-700/80 backdrop-blur-md hover:scale-105 transition-all flex items-center gap-2"
            >
              {isCurrentHeroInWatchlist ? (
                <>
                  <Check className="w-4 h-4 text-[#00e676]" />
                  <span>Yabitswe</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 text-white" />
                  <span>Yirebe Nyuma</span>
                </>
              )}
            </button>
          </div>

        </div>
      </section>

      {/* 3. CATEGORY SUB-FILTER TABS (Zose | Filme gusa | Serie gusa) */}
      <div className="flex items-center justify-between border-b border-slate-800/80 px-2 pt-2">
        <div className="flex items-center gap-6 sm:gap-8">
          <button
            onClick={() => setFilterTab('all')}
            className={`pb-3 text-sm font-bold transition-all relative ${
              filterTab === 'all'
                ? 'text-[#00e676]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Zose
            {filterTab === 'all' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00e676] rounded-full" />
            )}
          </button>

          <button
            onClick={() => setFilterTab('movies')}
            className={`pb-3 text-sm font-bold transition-all relative ${
              filterTab === 'movies'
                ? 'text-[#00e676]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Filme gusa
            {filterTab === 'movies' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00e676] rounded-full" />
            )}
          </button>

          <button
            onClick={() => setFilterTab('series')}
            className={`pb-3 text-sm font-bold transition-all relative ${
              filterTab === 'series'
                ? 'text-[#00e676]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Serie gusa
            {filterTab === 'series' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00e676] rounded-full" />
            )}
          </button>
        </div>

        {/* Umusobanuzi filter dropdown pills */}
        <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-400">
          <span className="text-slate-500 font-semibold flex items-center gap-1">
            <Mic2 className="w-3 h-3 text-[#00e676]" /> Umusobanuzi:
          </span>
          {translators.slice(0, 5).map((t) => (
            <button
              key={t}
              onClick={() => setSelectedTranslator(t)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                selectedTranslator === t
                  ? 'bg-[#00e676] text-slate-950'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* 4. SECTION 1: Rangiza Filme cg Serie (Watch Catalog) */}
      <section className="space-y-3 pt-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-base sm:text-lg font-black text-white tracking-wide flex items-center gap-2">
            Rangiza Filme cg Serie
            <span className="w-2 h-2 rounded-full bg-[#00e676] animate-pulse" />
          </h2>
          <span className="text-xs font-semibold text-slate-400">
            {filteredCatalogMovies.length} Available
          </span>
        </div>

        {/* Movie Cards Grid */}
        {filteredCatalogMovies.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4">
            {filteredCatalogMovies.map((movie) => (
              <MediaCard
                key={movie.id}
                item={movie}
                onPlay={onPlayMovie}
                onOpenDetails={onOpenMovieDetails}
                onToggleWatchlist={onToggleWatchlist}
                watchlist={watchlist}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl p-8 text-center bg-slate-900/60 border border-slate-800 max-w-lg mx-auto space-y-2 my-4">
            <Film className="w-8 h-8 text-[#00e676] mx-auto" />
            <h3 className="text-sm font-bold text-white">Nta filme irashyirwamo muri iki cyiciro</h3>
            <p className="text-xs text-slate-400">
              Shakisha izindi filme cyangwa uhitemo undi Musobanuzi hejuru.
            </p>
          </div>
        )}
      </section>

      {/* 5. TOP 10 LIVE RWANDAN TV NETWORKS */}
      <section className="space-y-4 pt-6 border-t border-slate-800/80">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Tv className="w-5 h-5 text-[#00e676]" />
            <h2 className="text-base sm:text-lg font-black text-white tracking-wide">
              LIVE RWANDAN TV CHANNELS (TOP 10)
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#00e676]/20 text-[#00e676] border border-[#00e676]/40 flex items-center gap-1">
              <Radio className="w-2.5 h-2.5 animate-pulse" /> 10 ONLINE
            </span>
          </div>

          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Direct high quality live streaming
          </span>
        </div>

        {/* 10 TV Cards Grid (Clean user view without edit buttons) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5 sm:gap-4">
          {top10Channels.map((ch) => (
            <div
              key={ch.id}
              onClick={() => onSelectChannel(ch)}
              className="relative rounded-2xl p-4 flex flex-col items-center text-center cursor-pointer group bg-[#0d1410] border border-emerald-500/20 hover:border-[#00e676] transition-all select-none shadow-lg hover:shadow-[#00e676]/10"
            >
              {/* Channel Logo */}
              <div className="relative w-16 h-16 rounded-2xl overflow-hidden mb-3 border border-emerald-500/30 group-hover:scale-105 transition-transform bg-slate-950 p-1 flex items-center justify-center shadow-md">
                <img
                  src={ch.logo || ch.logoUrl}
                  alt={ch.name}
                  className="w-full h-full object-contain rounded-xl"
                />
                <span className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full bg-[#00e676] ring-2 ring-slate-950 animate-pulse" />
              </div>

              <h3 className="text-xs font-black text-white group-hover:text-[#00e676] transition-colors line-clamp-1 mb-1">
                {ch.name}
              </h3>

              <span className="text-[10px] font-bold text-slate-400 line-clamp-1 mb-3">
                {ch.currentShow?.title || 'Live 24/7 Broadcast'}
              </span>

              {/* Watch Action Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectChannel(ch);
                }}
                className="w-full py-1.5 rounded-xl bg-[#00e676]/20 hover:bg-[#00e676] text-[#00e676] hover:text-slate-950 font-black text-[10px] border border-[#00e676]/40 transition-all flex items-center justify-center gap-1"
              >
                <Play className="w-3 h-3 fill-current" /> WATCH LIVE
              </button>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};
