import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ChevronDown,
  Play,
  CheckCircle2,
  Lock,
  Download,
  Share2,
  Bookmark,
  Star,
  Clock,
  Sparkles,
  ShieldCheck,
  Check,
  CreditCard
} from 'lucide-react';
import { SeriesItem, SeasonItem, EpisodeItem, UserProfile } from '../types';
import { VideoPlayer } from './VideoPlayer';
import { updateWatchHistoryProgress, addDownloadItem } from '../services/contentStorage';

interface SeriesWatchPageProps {
  series: SeriesItem;
  initialSeasonNumber?: number;
  initialEpisodeNumber?: number;
  user: UserProfile;
  onBack: () => void;
  onOpenSubscribe?: () => void;
  onToggleWatchlist: (id: string) => void;
  isWatchlisted: boolean;
}

export const SeriesWatchPage: React.FC<SeriesWatchPageProps> = ({
  series,
  initialSeasonNumber = 1,
  initialEpisodeNumber = 1,
  user,
  onBack,
  onOpenSubscribe,
  onToggleWatchlist,
  isWatchlisted
}) => {
  const seasons = series.seasons || [];
  const defaultSeason = seasons.find((s) => s.seasonNumber === initialSeasonNumber) || seasons[0];

  const [selectedSeasonNumber, setSelectedSeasonNumber] = useState<number>(defaultSeason?.seasonNumber || 1);
  const currentSeason = seasons.find((s) => s.seasonNumber === selectedSeasonNumber) || seasons[0];
  const episodes = currentSeason?.episodes || [];

  const defaultEpisode = episodes.find((e) => e.episodeNumber === initialEpisodeNumber) || episodes[0];
  const [currentEpisode, setCurrentEpisode] = useState<EpisodeItem | null>(defaultEpisode || null);
  const [isCopiedShare, setIsCopiedShare] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Sync state if initial props change
  useEffect(() => {
    if (defaultSeason) {
      setSelectedSeasonNumber(defaultSeason.seasonNumber);
      const ep = defaultSeason.episodes?.find((e) => e.episodeNumber === initialEpisodeNumber) || defaultSeason.episodes?.[0];
      if (ep) setCurrentEpisode(ep);
    }
  }, [series.id, initialSeasonNumber, initialEpisodeNumber]);

  // Subscription / Entitlement Check
  const isSubscribed = Boolean(
    user.role === 'ADMIN' ||
    (user.subscription && user.subscription.status === 'ACTIVE')
  );

  const isEpisodeLocked = Boolean(
    currentEpisode?.access === 'PREMIUM' && !isSubscribed
  );

  // Find next episode index & object
  const currentEpIndex = episodes.findIndex((e) => e.id === currentEpisode?.id);
  const hasNextEpisode = currentEpIndex >= 0 && currentEpIndex < episodes.length - 1;
  const hasPrevEpisode = currentEpIndex > 0;

  const handleNextEpisode = () => {
    if (hasNextEpisode) {
      const nextEp = episodes[currentEpIndex + 1];
      setCurrentEpisode(nextEp);
    }
  };

  const handlePrevEpisode = () => {
    if (hasPrevEpisode) {
      const prevEp = episodes[currentEpIndex - 1];
      setCurrentEpisode(prevEp);
    }
  };

  // Progress tracking callback
  const handleTimeUpdate = (currentTime: number, duration: number, progressPercent: number) => {
    if (!currentEpisode) return;
    updateWatchHistoryProgress({
      contentId: currentEpisode.id,
      type: 'episode',
      title: `${series.title} - S${currentSeason.seasonNumber}E${currentEpisode.episodeNumber}: ${currentEpisode.title}`,
      posterUrl: currentEpisode.thumbnailUrl || series.posterUrl,
      seriesId: series.id,
      seriesTitle: series.title,
      seasonNumber: currentSeason.seasonNumber,
      episodeNumber: currentEpisode.episodeNumber,
      episodeId: currentEpisode.id,
      currentTime: Math.floor(currentTime),
      duration: Math.floor(duration),
      progressPercent: Math.round(progressPercent),
      lastWatched: new Date().toISOString(),
      videoUrl: currentEpisode.videoUrl
    });
  };

  const handleDownload = () => {
    if (!currentEpisode) return;
    if (!isSubscribed) {
      if (onOpenSubscribe) onOpenSubscribe();
      return;
    }

    addDownloadItem({
      id: `dl_${currentEpisode.id}`,
      contentId: currentEpisode.id,
      type: 'episode',
      title: `${series.title} S${currentSeason.seasonNumber}E${currentEpisode.episodeNumber}`,
      posterUrl: currentEpisode.thumbnailUrl || series.posterUrl,
      fileSizeMb: 480,
      downloadUrl: currentEpisode.downloadUrl || currentEpisode.videoUrl,
      quality: 'HD',
      downloadedAt: new Date().toISOString()
    });

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const handleShare = () => {
    navigator.clipboard?.writeText?.(window.location.href);
    setIsCopiedShare(true);
    setTimeout(() => setIsCopiedShare(false), 2000);
  };

  if (!currentEpisode) {
    return (
      <div className="min-h-screen bg-[#070b14] text-white p-8 flex flex-col items-center justify-center">
        <p className="text-slate-400 mb-4">No episodes available in this series.</p>
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b14] text-white pb-20 pt-4 px-3 sm:px-6 lg:px-8 max-w-[1600px] mx-auto select-none">
      
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-all text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4 text-blue-400" />
          <span>Back to Browse</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Watchlist Toggle */}
          <button
            onClick={() => onToggleWatchlist(series.id)}
            className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
              isWatchlisted
                ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-900/40'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
            }`}
          >
            {isWatchlisted ? <Check className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isWatchlisted ? 'In My List' : '+ My List'}</span>
          </button>

          {/* Share */}
          <button
            onClick={handleShare}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <Share2 className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">{isCopiedShare ? 'Copied Link!' : 'Share'}</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Responsive Layout: Player on Left, Season/Episode Selector on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ==========================================
            LEFT COLUMN (Col 1-8): VIDEO PLAYER & DETAILS
            ========================================== */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          
          {/* Main Video Player Container or Subscription Barrier */}
          <div className="relative w-full rounded-2xl md:rounded-3xl overflow-hidden bg-black aspect-video border border-blue-950/70 shadow-2xl">
            {isEpisodeLocked ? (
              // LOCKED EPISODE ACCESS BARRIER
              <div className="absolute inset-0 z-30 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center backdrop-blur-md">
                <div className="w-16 h-16 rounded-3xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center mb-4 text-blue-400 shadow-xl shadow-blue-950/50">
                  <Lock className="w-8 h-8" />
                </div>
                <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-400/40 text-xs font-black uppercase tracking-wider mb-2">
                  VIP PREMIUM EPISODE
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white max-w-md mb-2">
                  Subscribe to Watch {currentEpisode.title}
                </h3>
                <p className="text-xs text-slate-300 max-w-md mb-6 leading-relaxed">
                  This episode is part of our VIP catalog. Upgrade to unlock all Agasobanuye series episodes, full HD streams, and instant offline downloads starting at only 500 RWF / month.
                </p>

                {onOpenSubscribe && (
                  <button
                    onClick={onOpenSubscribe}
                    className="px-8 py-3.5 rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-slate-950 font-black text-sm shadow-xl shadow-cyan-900/50 hover:scale-105 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <CreditCard className="w-4 h-4 text-slate-950" />
                    <span>Get Instant VIP Pass (From 500 RWF)</span>
                  </button>
                )}
              </div>
            ) : (
              // ACTIVE VIDEO PLAYER
              <VideoPlayer
                streamUrl={currentEpisode.videoUrl}
                lowUrl={currentEpisode.lowVideoUrl}
                midUrl={currentEpisode.midVideoUrl}
                hdUrl={currentEpisode.hdVideoUrl}
                title={`${series.title} • S${currentSeason.seasonNumber} E${currentEpisode.episodeNumber}`}
                subtitle={currentEpisode.title}
                poster={currentEpisode.thumbnailUrl || series.backdropUrl}
                autoPlay={true}
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleNextEpisode}
                onNextEpisode={handleNextEpisode}
                onPrevEpisode={handlePrevEpisode}
                hasNextEpisode={hasNextEpisode}
                hasPrevEpisode={hasPrevEpisode}
              />
            )}
          </div>

          {/* Episode Info & Series Details Card */}
          <div className="p-5 sm:p-6 rounded-2xl md:rounded-3xl bg-slate-900/80 border border-blue-900/30 shadow-xl space-y-4">
            
            {/* Title & Metadata Line */}
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800/80 pb-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h1 className="text-lg sm:text-2xl font-black text-white">
                    {series.title}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-md bg-blue-600/20 text-blue-400 border border-blue-500/40 text-xs font-black">
                    S{currentSeason.seasonNumber} • EP {currentEpisode.episodeNumber}
                  </span>
                  {currentEpisode.access === 'PREMIUM' && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-cyan-400 text-slate-950 uppercase">
                      VIP
                    </span>
                  )}
                </div>

                <h2 className="text-sm sm:text-base font-bold text-slate-300">
                  {currentEpisode.title}
                </h2>
              </div>

              {/* Download Episode Button */}
              {currentEpisode.downloadEnabled !== false && (
                <button
                  onClick={handleDownload}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
                    downloadSuccess
                      ? 'bg-cyan-400 text-slate-950'
                      : 'bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:border-cyan-500/50'
                  }`}
                >
                  {downloadSuccess ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-slate-950" />
                      <span>Downloaded</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 text-blue-400" />
                      <span>Download Episode</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Badges & Meta Tags */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
              <span className="flex items-center gap-1 text-amber-400 font-bold">
                <Star className="w-3.5 h-3.5 fill-current" /> {series.rating || 9.8}
              </span>
              <span className="text-slate-600">•</span>
              <span className="flex items-center gap-1 font-mono">
                <Clock className="w-3.5 h-3.5 text-blue-400" /> {currentEpisode.duration || '55 min'}
              </span>
              <span className="text-slate-600">•</span>
              <span>{series.year}</span>
              <span className="text-slate-600">•</span>
              <span className="px-2 py-0.5 rounded bg-slate-800 font-semibold text-[11px]">
                {series.ageRating || '16+'}
              </span>

              {/* Genre Pills */}
              <div className="flex items-center gap-1.5 flex-wrap ml-auto">
                {series.genres?.map((g) => (
                  <span
                    key={g}
                    className="px-2.5 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-[10px] font-bold text-slate-300"
                  >
                    {g}
                  </span>
                ))}
              </div>
            </div>

            {/* Synopsis Description */}
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {currentEpisode.description || series.description}
            </p>

            {/* Umusobanuzi & Director information */}
            {series.director && (
              <div className="pt-2 flex items-center gap-2 text-xs text-slate-400">
                <span className="font-bold text-blue-400">Umusobanuzi / Director:</span>
                <span className="text-white font-medium">{series.director}</span>
              </div>
            )}
          </div>
        </div>

        {/* ==========================================
            RIGHT COLUMN (Col 9-12): SEASONS & EPISODES MANAGER
            ========================================== */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          
          {/* Season Selector Card Header */}
          <div className="p-4 rounded-2xl md:rounded-3xl bg-slate-900/90 border border-blue-900/30 shadow-xl flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> SEASONS & EPISODES
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {episodes.length} Episodes
              </span>
            </div>

            {/* Season Dropdown Selector */}
            {seasons.length > 1 ? (
              <div className="relative">
                <select
                  value={selectedSeasonNumber}
                  onChange={(e) => {
                    const sNum = Number(e.target.value);
                    setSelectedSeasonNumber(sNum);
                    const targetSeason = seasons.find((s) => s.seasonNumber === sNum);
                    if (targetSeason && targetSeason.episodes?.[0]) {
                      setCurrentEpisode(targetSeason.episodes[0]);
                    }
                  }}
                  className="w-full pl-4 pr-10 py-3 rounded-xl bg-slate-950 border border-blue-500/40 text-sm font-black text-white appearance-none cursor-pointer focus:outline-none focus:border-cyan-400"
                >
                  {seasons.map((s) => (
                    <option key={s.id} value={s.seasonNumber} className="bg-slate-950 text-white">
                      Season {s.seasonNumber}: {s.title} ({s.episodes?.length || 0} eps)
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-blue-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            ) : (
              <div className="px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-white">
                {currentSeason.title || 'Season 1'}
              </div>
            )}
          </div>

          {/* Scrollable Episodes List */}
          <div className="space-y-2.5 max-h-[700px] overflow-y-auto no-scrollbar pr-1">
            {episodes.map((ep) => {
              const isSelected = ep.id === currentEpisode.id;
              const isEpLocked = ep.access === 'PREMIUM' && !isSubscribed;

              return (
                <div
                  key={ep.id}
                  onClick={() => setCurrentEpisode(ep)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex gap-3 group relative overflow-hidden ${
                    isSelected
                      ? 'bg-blue-600/20 border-cyan-400 shadow-lg shadow-cyan-950/40'
                      : 'bg-slate-900/70 border-slate-800/80 hover:border-blue-900/60 hover:bg-slate-900'
                  }`}
                >
                  {/* Active Indicator Bar on Left */}
                  {isSelected && (
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-blue-500 to-cyan-400" />
                  )}

                  {/* Episode Thumbnail */}
                  <div className="relative w-28 sm:w-32 aspect-video rounded-xl overflow-hidden bg-black shrink-0 border border-slate-800">
                    <img
                      src={ep.thumbnailUrl || series.posterUrl}
                      alt={ep.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />

                    {/* Play or Lock icon overlay */}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      {isEpLocked ? (
                        <div className="w-7 h-7 rounded-full bg-slate-950/80 border border-amber-400/50 flex items-center justify-center text-amber-400">
                          <Lock className="w-3.5 h-3.5" />
                        </div>
                      ) : isSelected ? (
                        <div className="w-7 h-7 rounded-full bg-cyan-500 flex items-center justify-center text-slate-950 animate-pulse">
                          <Play className="w-3.5 h-3.5 fill-current" />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-slate-950/60 group-hover:bg-cyan-500 group-hover:text-slate-950 text-white flex items-center justify-center transition-colors">
                          <Play className="w-3.5 h-3.5 fill-current" />
                        </div>
                      )}
                    </div>

                    <span className="absolute bottom-1 right-1 px-1.5 py-0.2 rounded bg-black/80 text-[9px] font-mono text-white">
                      {ep.duration || '45m'}
                    </span>
                  </div>

                  {/* Episode Details */}
                  <div className="flex-1 flex flex-col justify-between overflow-hidden">
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[10px] font-black text-blue-400 font-mono">
                          EPISODE {ep.episodeNumber}
                        </span>

                        {ep.access === 'PREMIUM' ? (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                            VIP
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-800 text-slate-400">
                            FREE
                          </span>
                        )}
                      </div>

                      <h4
                        className={`text-xs font-bold truncate ${
                          isSelected ? 'text-white font-extrabold' : 'text-slate-200 group-hover:text-blue-300'
                        }`}
                      >
                        {ep.title}
                      </h4>

                      <p className="text-[10px] text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                        {ep.description}
                      </p>
                    </div>

                    {isSelected && (
                      <span className="text-[10px] font-bold text-cyan-400 flex items-center gap-1 mt-1">
                        <CheckCircle2 className="w-3 h-3" /> Now Playing
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};
