import React, { useState, useEffect } from 'react';
import { Play, Plus, Check, Info, Volume2, VolumeX, Sparkles, Star, Film, Flame } from 'lucide-react';
import { MediaItem } from '../types';

interface HeroBannerProps {
  items: MediaItem[];
  onPlay: (item: MediaItem) => void;
  onOpenDetails: (item: MediaItem) => void;
  onToggleWatchlist: (itemId: string) => void;
  watchlist: string[];
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  items = [],
  onPlay,
  onOpenDetails,
  onToggleWatchlist,
  watchlist = []
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlayingVideo, setIsPlayingVideo] = useState(true);

  const safeItems = items || [];
  const featured = safeItems.filter((i) => i?.isFeatured);
  const featuredList = featured.length > 0 ? featured : safeItems.slice(0, 3);
  const currentItem = featuredList[currentIndex] || safeItems[0];

  useEffect(() => {
    if (!featuredList.length) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredList.length);
    }, 9000);
    return () => clearInterval(interval);
  }, [featuredList.length]);

  if (!currentItem) return null;

  const isInWatchlist = (watchlist || []).includes(currentItem.id);

  return (
    <div className="relative w-full h-[80vh] min-h-[550px] max-h-[800px] overflow-hidden bg-slate-950 text-white select-none">
      {/* Background Media Container */}
      <div className="absolute inset-0 z-0">
        {isPlayingVideo && currentItem.trailerUrl && currentItem.trailerUrl.trim().length > 0 ? (
          <video
            key={currentItem.id}
            src={currentItem.trailerUrl}
            autoPlay
            loop
            muted={isMuted}
            playsInline
            onError={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsPlayingVideo(false);
            }}
            className="w-full h-full object-cover scale-105 opacity-60 transition-opacity duration-1000"
          />
        ) : (
          <img
            src={currentItem.bannerUrl}
            alt={currentItem.title}
            className="w-full h-full object-cover scale-105 opacity-60 transition-opacity duration-1000"
          />
        )}

        {/* Gradient Overlays for Cinematic Depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#07090e] via-[#07090e]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#07090e] via-[#07090e]/80 to-transparent" />
      </div>

      {/* Content Overlay */}
      <div className="relative z-10 max-w-7xl mx-auto h-full px-4 lg:px-8 flex flex-col justify-end pb-16 lg:pb-20">
        <div className="max-w-2xl">
          {/* Category / Region Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1.5 shadow-lg shadow-cyan-950/50">
              <Sparkles className="w-3.5 h-3.5" /> Spotlight Featured
            </span>

            {currentItem.isRwandan && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                🇷🇼 Rwandan Cinema
              </span>
            )}

            {currentItem.isAfrican && !currentItem.isRwandan && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                🌍 African Spotlight
              </span>
            )}

            <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-900/80 text-emerald-400 border border-emerald-500/30">
              {currentItem.matchPercentage}% Match
            </span>

            <span className="px-2 py-1 rounded-md text-xs font-bold bg-slate-900/80 text-slate-300 border border-slate-700">
              {currentItem.ageRating}
            </span>

            <span className="px-2 py-1 rounded-md text-xs font-semibold bg-slate-900/80 text-amber-400 border border-amber-500/30 flex items-center gap-1">
              <Star className="w-3 h-3 fill-amber-400" /> {currentItem.rating}
            </span>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white mb-3 text-glow drop-shadow-2xl leading-tight">
            {currentItem.title}
          </h1>

          {/* Details Row */}
          <div className="flex items-center gap-3 text-xs md:text-sm text-slate-300 font-medium mb-4">
            <span className="text-cyan-400 font-bold">{currentItem.releaseYear}</span>
            <span>•</span>
            <span>{currentItem.duration}</span>
            <span>•</span>
            <span className="text-slate-300">{currentItem.genres.join(', ')}</span>
            <span>•</span>
            <span className="text-amber-300 font-medium">
              Audio: {currentItem.audioLanguages.slice(0, 2).join(', ')}
            </span>
          </div>

          {/* Synopsis */}
          <p className="text-sm md:text-base text-slate-300/90 line-clamp-3 mb-6 leading-relaxed max-w-xl font-normal drop-shadow">
            {currentItem.synopsis}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Play Button */}
            <button
              onClick={() => onPlay(currentItem)}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-sm flex items-center gap-2 shadow-xl shadow-cyan-500/30 hover:scale-105 transition-all"
            >
              <Play className="w-5 h-5 fill-slate-950" /> Watch Now
            </button>

            {/* Watchlist Toggle */}
            <button
              onClick={() => onToggleWatchlist(currentItem.id)}
              className={`px-4 py-3 rounded-xl border text-sm font-semibold flex items-center gap-2 transition-all ${
                isInWatchlist
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                  : 'bg-slate-900/80 text-white border-slate-700 hover:border-cyan-500/50'
              }`}
            >
              {isInWatchlist ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" /> Saved
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" /> Watchlist
                </>
              )}
            </button>

            {/* More Details Modal Button */}
            <button
              onClick={() => onOpenDetails(currentItem)}
              className="px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700/80 hover:bg-slate-800 text-slate-200 text-sm font-semibold flex items-center gap-2 transition-all"
            >
              <Info className="w-4 h-4 text-cyan-400" /> More Info
            </button>

            {/* Audio Toggle */}
            {currentItem.trailerUrl && (
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-3 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-300 hover:text-white transition-all ml-auto md:ml-0"
                title={isMuted ? 'Unmute Trailer' : 'Mute Trailer'}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
              </button>
            )}
          </div>
        </div>

        {/* Carousel Slide Indicators */}
        <div className="absolute bottom-6 right-4 lg:right-8 flex items-center gap-2">
          {featuredList.map((item, idx) => (
            <button
              key={item.id}
              onClick={() => setCurrentIndex(idx)}
              className={`h-2 rounded-full transition-all ${
                currentIndex === idx ? 'w-8 bg-cyan-400' : 'w-2 bg-slate-700 hover:bg-slate-500'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
