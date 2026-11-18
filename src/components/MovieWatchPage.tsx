import React, { useState } from 'react';
import {
  ArrowLeft,
  Bookmark,
  Share2,
  Download,
  CheckCircle2,
  Star,
  Clock,
  Lock,
  Play,
  Check,
  CreditCard,
  Film
} from 'lucide-react';
import { MovieItem, UserProfile } from '../types';
import { VideoPlayer } from './VideoPlayer';
import { updateWatchHistoryProgress, addDownloadItem } from '../services/contentStorage';

interface MovieWatchPageProps {
  movie: MovieItem;
  allMovies: MovieItem[];
  user: UserProfile;
  onBack: () => void;
  onSelectMovie: (movie: MovieItem) => void;
  onOpenSubscribe?: () => void;
  onToggleWatchlist: (id: string) => void;
  isWatchlisted: boolean;
}

export const MovieWatchPage: React.FC<MovieWatchPageProps> = ({
  movie,
  allMovies = [],
  user,
  onBack,
  onSelectMovie,
  onOpenSubscribe,
  onToggleWatchlist,
  isWatchlisted
}) => {
  const [isCopiedShare, setIsCopiedShare] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Subscription entitlement check
  const isSubscribed = Boolean(
    user.role === 'ADMIN' ||
    (user.subscription && user.subscription.status === 'ACTIVE')
  );

  const isMovieLocked = Boolean(
    movie.access === 'PREMIUM' && !isSubscribed
  );

  const handleTimeUpdate = (currentTime: number, duration: number, progressPercent: number) => {
    updateWatchHistoryProgress({
      contentId: movie.id,
      type: 'movie',
      title: movie.title,
      posterUrl: movie.posterUrl,
      currentTime: Math.floor(currentTime),
      duration: Math.floor(duration),
      progressPercent: Math.round(progressPercent),
      lastWatched: new Date().toISOString(),
      videoUrl: movie.videoUrl
    });
  };

  const handleDownload = () => {
    if (!isSubscribed) {
      if (onOpenSubscribe) onOpenSubscribe();
      return;
    }

    addDownloadItem({
      id: `dl_${movie.id}`,
      contentId: movie.id,
      type: 'movie',
      title: `${movie.title} (Full HD)`,
      posterUrl: movie.posterUrl,
      fileSizeMb: 1450,
      downloadUrl: movie.downloadUrl || movie.videoUrl,
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

  const relatedMovies = allMovies
    .filter((m) => m.id !== movie.id)
    .slice(0, 6);

  return (
    <div className="min-h-screen bg-[#070b14] text-white pb-20 pt-4 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto select-none">
      
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-all text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4 text-blue-400" />
          <span>Back to Catalog</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Watchlist Toggle */}
          <button
            onClick={() => onToggleWatchlist(movie.id)}
            className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
              isWatchlisted
                ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-900/40'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
            }`}
          >
            {isWatchlisted ? <Check className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isWatchlisted ? 'In My List' : '+ My List'}</span>
          </button>

          {/* Share Button */}
          <button
            onClick={handleShare}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <Share2 className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">{isCopiedShare ? 'Copied!' : 'Share'}</span>
          </button>
        </div>
      </div>

      {/* Main Video Player or Premium Barrier */}
      <div className="relative w-full rounded-2xl md:rounded-3xl overflow-hidden bg-black aspect-video border border-blue-950/70 shadow-2xl mb-6">
        {isMovieLocked ? (
          <div className="absolute inset-0 z-30 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center backdrop-blur-md">
            <div className="w-16 h-16 rounded-3xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center mb-4 text-blue-400 shadow-xl shadow-blue-950/50">
              <Lock className="w-8 h-8" />
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-black uppercase tracking-wider mb-2">
              VIP PREMIUM MOVIE
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-white max-w-md mb-2">
              Subscribe to Watch {movie.title}
            </h3>
            <p className="text-xs text-slate-300 max-w-md mb-6 leading-relaxed">
              This film is available exclusively to VIP subscribers in crystal-clear 1080p Full HD with high speed offline downloads. Upgrade your pass today starting from 500 RWF / month.
            </p>

            {onOpenSubscribe && (
              <button
                onClick={onOpenSubscribe}
                className="px-8 py-3.5 rounded-full bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white font-black text-sm shadow-xl shadow-blue-900/50 hover:scale-105 transition-all flex items-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                <span>Upgrade to VIP Pass (From 500 RWF)</span>
              </button>
            )}
          </div>
        ) : (
          <VideoPlayer
            streamUrl={movie.videoUrl}
            lowUrl={movie.lowVideoUrl}
            midUrl={movie.midVideoUrl}
            hdUrl={movie.hdVideoUrl}
            title={movie.title}
            subtitle={movie.director ? `Directed / Translated by ${movie.director}` : undefined}
            poster={movie.backdropUrl || movie.posterUrl}
            autoPlay={true}
            onTimeUpdate={handleTimeUpdate}
          />
        )}
      </div>

      {/* Movie Details Card */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-blue-900/30 shadow-xl space-y-4 mb-8">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-2xl sm:text-3xl font-black text-white">{movie.title}</h1>
              {movie.access === 'PREMIUM' ? (
                <span className="px-2.5 py-0.5 rounded text-[10px] font-black bg-emerald-500 text-slate-950 uppercase">
                  VIP PREMIUM
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded text-[10px] font-black bg-blue-600 text-white uppercase">
                  FREE
                </span>
              )}
            </div>

            {movie.originalTitle && movie.originalTitle !== movie.title && (
              <p className="text-xs text-slate-400 font-medium">Original Title: {movie.originalTitle}</p>
            )}
          </div>

          {movie.downloadEnabled && (
            <button
              onClick={handleDownload}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
                downloadSuccess
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:border-blue-500/50'
              }`}
            >
              {downloadSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-slate-950" />
                  <span>Movie Downloaded</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-blue-400" />
                  <span>Download Movie (HD)</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Metadata Line */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
          <span className="flex items-center gap-1 text-amber-400 font-bold">
            <Star className="w-3.5 h-3.5 fill-current" /> {movie.rating || 9.4}
          </span>
          <span className="text-slate-600">•</span>
          <span className="flex items-center gap-1 font-mono">
            <Clock className="w-3.5 h-3.5 text-blue-400" /> {movie.duration || '01:45:00'}
          </span>
          <span className="text-slate-600">•</span>
          <span>{movie.year}</span>
          <span className="text-slate-600">•</span>
          <span className="px-2 py-0.5 rounded bg-slate-800 font-semibold text-[11px]">
            {movie.ageRating || '16+'}
          </span>
          <span className="text-slate-600">•</span>
          <span className="text-emerald-400 font-semibold font-mono">{movie.quality || '1080p Full HD'}</span>

          {/* Genre Badges */}
          <div className="flex items-center gap-1.5 flex-wrap ml-auto">
            {movie.genres?.map((g) => (
              <span
                key={g}
                className="px-2.5 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-[10px] font-bold text-slate-300"
              >
                {g}
              </span>
            ))}
          </div>
        </div>

        {/* Synopsis */}
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-4xl">
          {movie.description}
        </p>

        {/* Director / Umusobanuzi & Cast */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs border-t border-slate-800/80">
          {movie.director && (
            <div>
              <span className="text-slate-500 font-semibold">Umusobanuzi / Director: </span>
              <span className="text-white font-medium">{movie.director}</span>
            </div>
          )}

          {movie.cast && movie.cast.length > 0 && (
            <div>
              <span className="text-slate-500 font-semibold">Starring Cast: </span>
              <span className="text-white font-medium">{movie.cast.join(', ')}</span>
            </div>
          )}

          {movie.language && (
            <div>
              <span className="text-slate-500 font-semibold">Audio Language: </span>
              <span className="text-white font-medium">{movie.language}</span>
            </div>
          )}

          {movie.country && (
            <div>
              <span className="text-slate-500 font-semibold">Production Country: </span>
              <span className="text-white font-medium">{movie.country}</span>
            </div>
          )}
        </div>
      </div>

      {/* Recommended Related Movies Row */}
      {relatedMovies.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-base sm:text-lg font-black text-white tracking-wide flex items-center gap-2">
            <Film className="w-4 h-4 text-blue-400" /> More Movies You Might Like
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
            {relatedMovies.map((m) => (
              <div
                key={m.id}
                onClick={() => onSelectMovie(m)}
                className="group relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 hover:border-blue-500/60 cursor-pointer transition-all flex flex-col shadow-lg"
              >
                <div className="relative aspect-[2/3] w-full overflow-hidden bg-black">
                  <img
                    src={m.posterUrl}
                    alt={m.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
                  <span className="absolute top-2 right-2 px-1.5 py-0.2 rounded text-[9px] font-black bg-blue-600 text-white">
                    {m.quality ? 'HD' : '1080p'}
                  </span>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                    <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg">
                      <Play className="w-4 h-4 fill-current translate-x-0.5" />
                    </div>
                  </div>
                </div>

                <div className="p-2.5">
                  <h3 className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors truncate">
                    {m.title}
                  </h3>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                    <span>{m.year}</span>
                    <span className="flex items-center gap-0.5 text-amber-400 font-bold">
                      <Star className="w-2.5 h-2.5 fill-current" /> {m.rating || 9.2}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
