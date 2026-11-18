import React, { useRef, useState, useEffect } from 'react';
import Hls from 'hls.js';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RotateCcw,
  RotateCw,
  SkipForward,
  SkipBack,
  Settings,
  Subtitles,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { VideoQuality } from '../types';

interface VideoPlayerProps {
  streamUrl: string;
  lowUrl?: string;
  midUrl?: string;
  hdUrl?: string;
  title: string;
  subtitle?: string;
  poster?: string;
  autoPlay?: boolean;
  initialTime?: number;
  onTimeUpdate?: (currentTime: number, duration: number, progressPercent: number) => void;
  onEnded?: () => void;
  onNextEpisode?: () => void;
  onPrevEpisode?: () => void;
  hasNextEpisode?: boolean;
  hasPrevEpisode?: boolean;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  streamUrl,
  lowUrl,
  midUrl,
  hdUrl,
  title,
  subtitle,
  poster,
  autoPlay = true,
  initialTime = 0,
  onTimeUpdate,
  onEnded,
  onNextEpisode,
  onPrevEpisode,
  hasNextEpisode,
  hasPrevEpisode
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [selectedQuality, setSelectedQuality] = useState<VideoQuality>('AUTO');
  const [selectedSpeed, setSelectedSpeed] = useState<number>(1);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [playerError, setPlayerError] = useState<string | null>(null);

  // Active stream source determined by chosen quality
  const activeSourceUrl = React.useMemo(() => {
    if (selectedQuality === 'LOW' && lowUrl) return lowUrl;
    if (selectedQuality === 'MID' && midUrl) return midUrl;
    if (selectedQuality === 'HD' && hdUrl) return hdUrl;
    return streamUrl;
  }, [selectedQuality, streamUrl, lowUrl, midUrl, hdUrl]);

  // Initialize HLS or Native Player
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !activeSourceUrl) return;

    let hls: Hls | null = null;
    setIsLoading(true);
    setPlayerError(null);

    const isHlsStream = activeSourceUrl.includes('.m3u8') || activeSourceUrl.includes('/hls/');

    if (isHlsStream && Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90
      });

      hls.loadSource(activeSourceUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        if (initialTime > 0) video.currentTime = initialTime;
        if (autoPlay) {
          video.play().catch(() => setIsPlaying(false));
        }
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.warn('HLS Network error, attempting recovery...');
              hls?.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.warn('HLS Media error, attempting recovery...');
              hls?.recoverMediaError();
              break;
            default:
              console.error('Fatal HLS stream error:', data);
              setPlayerError('Stream connection disrupted. Retrying backup connection...');
              break;
          }
        }
      });
    } else {
      // Direct MP4 or native HLS (e.g. Safari)
      video.src = activeSourceUrl;
      if (initialTime > 0) video.currentTime = initialTime;
      if (autoPlay) {
        video.play().catch(() => setIsPlaying(false));
      }
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [activeSourceUrl, autoPlay]);

  // Video event handlers
  const handlePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    setCurrentTime(video.currentTime);
    const dur = video.duration || 0;
    setDuration(dur);
    const percent = dur > 0 ? (video.currentTime / dur) * 100 : 0;
    if (onTimeUpdate) {
      onTimeUpdate(video.currentTime, dur, percent);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const seekTime = Number(e.target.value);
    video.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const handleSkip = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(video.duration || 0, video.currentTime + seconds));
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const newVol = Number(e.target.value);
    video.volume = newVol;
    setVolume(newVol);
    setIsMuted(newVol === 0);
  };

  const handleToggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isMuted) {
      video.muted = false;
      video.volume = volume || 0.5;
      setIsMuted(false);
    } else {
      video.muted = true;
      setIsMuted(true);
    }
  };

  const handleSpeedChange = (speed: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = speed;
    setSelectedSpeed(speed);
    setShowSettingsMenu(false);
  };

  const handleToggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().then(() => setIsFullscreen(true)).catch(console.error);
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(console.error);
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
        setShowSettingsMenu(false);
      }
    }, 3500);
  };

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs)) return '00:00';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) {
      return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    }
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      className="relative w-full aspect-video bg-black rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl border border-blue-950/60 select-none group"
    >
      {/* HTML5 Video Element */}
      <video
        ref={videoRef}
        poster={poster}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={handleTimeUpdate}
        onWaiting={() => setIsLoading(true)}
        onPlaying={() => setIsLoading(false)}
        onLoadedData={() => setIsLoading(false)}
        onError={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsLoading(false);
          setPlayerError('Stream connection disrupted. Retrying backup connection...');
        }}
        onEnded={onEnded}
        onClick={handlePlayPause}
        className="w-full h-full object-contain cursor-pointer"
        playsInline
      />

      {/* Loading Spinner */}
      {isLoading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-none">
          <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center mb-3">
            <Loader2 className="w-7 h-7 text-blue-400 animate-spin" />
          </div>
          <span className="text-xs font-bold text-slate-300 tracking-wider">Buffering Stream...</span>
        </div>
      )}

      {/* Error Banner */}
      {playerError && (
        <div className="absolute top-4 left-4 right-4 z-30 p-3 rounded-xl bg-red-950/90 border border-red-500/50 text-white flex items-center gap-3 backdrop-blur-md">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span className="text-xs font-semibold">{playerError}</span>
        </div>
      )}

      {/* Overlay Top Bar (Title & Back/Info) */}
      <div
        className={`absolute top-0 left-0 right-0 z-20 p-4 md:p-6 bg-gradient-to-b from-black/90 via-black/40 to-transparent transition-opacity duration-300 pointer-events-auto flex items-center justify-between ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex flex-col">
          <h2 className="text-sm sm:text-base font-black text-white drop-shadow-md truncate max-w-md">
            {title}
          </h2>
          {subtitle && (
            <span className="text-xs text-cyan-400 font-semibold drop-shadow">
              {subtitle}
            </span>
          )}
        </div>

        {/* Quality indicator badge */}
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-blue-600/80 text-white border border-blue-400/40 shadow-sm uppercase">
            {selectedQuality} • {selectedSpeed !== 1 ? `${selectedSpeed}x` : '1080p'}
          </span>
        </div>
      </div>

      {/* Center Big Play Button (when paused) */}
      {!isPlaying && !isLoading && (
        <button
          onClick={handlePlayPause}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-blue-600/90 hover:bg-cyan-400 text-white hover:text-slate-950 flex items-center justify-center shadow-2xl hover:scale-110 transition-all border border-blue-400/50 hover:shadow-[0_0_25px_#00f0ff]"
        >
          <Play className="w-7 h-7 sm:w-9 sm:h-9 fill-current translate-x-0.5" />
        </button>
      )}

      {/* Overlay Bottom Controls Bar */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-20 p-3 sm:p-5 bg-gradient-to-t from-black/95 via-black/70 to-transparent transition-opacity duration-300 flex flex-col gap-2 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Scrubbing Progress Bar */}
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono text-slate-300 min-w-[40px]">
            {formatTime(currentTime)}
          </span>

          <div className="relative flex-1 group/bar py-1 cursor-pointer">
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:h-2 transition-all"
            />
          </div>

          <span className="text-[11px] font-mono text-slate-400 min-w-[40px]">
            {formatTime(duration)}
          </span>
        </div>

        {/* Action Controls Row */}
        <div className="flex items-center justify-between gap-2 pt-1">
          {/* Left Controls: Play, Skip 30s, Next/Prev Episode, Volume */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Play/Pause */}
            <button
              onClick={handlePlayPause}
              className="p-2 rounded-xl text-white hover:text-blue-400 hover:bg-white/10 transition-all"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
            </button>

            {/* Skip Backward 30s */}
            <button
              onClick={() => handleSkip(-30)}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-all"
              title="Skip 30s backward"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Skip Forward 30s */}
            <button
              onClick={() => handleSkip(30)}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-all"
              title="Skip 30s forward"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            {/* Previous Episode Button (for series) */}
            {hasPrevEpisode && onPrevEpisode && (
              <button
                onClick={onPrevEpisode}
                className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-all"
                title="Previous Episode"
              >
                <SkipBack className="w-4 h-4" />
              </button>
            )}

            {/* Next Episode Button (for series) */}
            {hasNextEpisode && onNextEpisode && (
              <button
                onClick={onNextEpisode}
                className="p-2 rounded-xl text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/20 transition-all flex items-center gap-1 text-xs font-bold"
                title="Next Episode"
              >
                <SkipForward className="w-4 h-4" />
                <span className="hidden sm:inline">Next Ep</span>
              </button>
            )}

            {/* Volume & Mute */}
            <div className="flex items-center gap-1.5 group/vol">
              <button
                onClick={handleToggleMute}
                className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-all"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-5 h-5 text-red-400" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-16 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500 hidden sm:inline-block"
              />
            </div>
          </div>

          {/* Right Controls: Quality/Speed Settings Menu & Fullscreen */}
          <div className="relative flex items-center gap-2">
            {/* Settings & Quality Menu Button */}
            <button
              onClick={() => setShowSettingsMenu(!showSettingsMenu)}
              className={`p-2 rounded-xl transition-all ${
                showSettingsMenu ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
              title="Player Settings"
            >
              <Settings className="w-5 h-5" />
            </button>

            {/* Settings Popover Dropdown */}
            {showSettingsMenu && (
              <div className="absolute right-0 bottom-12 w-56 rounded-2xl bg-slate-950/95 border border-blue-900/60 p-3 shadow-2xl backdrop-blur-xl z-50 text-xs space-y-3">
                <div>
                  <span className="text-[10px] font-black text-blue-400 uppercase tracking-wider block mb-1.5">
                    Streaming Quality
                  </span>
                  <div className="grid grid-cols-2 gap-1">
                    {(['AUTO', 'HD', 'MID', 'LOW'] as VideoQuality[]).map((q) => (
                      <button
                        key={q}
                        onClick={() => {
                          setSelectedQuality(q);
                          setShowSettingsMenu(false);
                        }}
                        className={`px-2.5 py-1.5 rounded-lg font-bold text-center transition-colors ${
                          selectedQuality === q
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        {q === 'AUTO' ? 'Auto (1080p)' : q === 'HD' ? 'HD 1080p' : q === 'MID' ? 'Mid 720p' : 'Low 480p'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-black text-cyan-400 uppercase tracking-wider block mb-1.5">
                    Playback Speed
                  </span>
                  <div className="grid grid-cols-3 gap-1">
                    {[0.75, 1, 1.25, 1.5, 2].map((s) => (
                      <button
                        key={s}
                        onClick={() => handleSpeedChange(s)}
                        className={`px-2 py-1 rounded-lg font-bold text-center transition-colors ${
                          selectedSpeed === s
                            ? 'bg-cyan-400 text-slate-950 shadow-[0_0_8px_#00f0ff]'
                            : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        {s}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Fullscreen Button */}
            <button
              onClick={handleToggleFullscreen}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-all"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
