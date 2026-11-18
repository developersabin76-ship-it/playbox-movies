import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Play, Pause, Volume2, VolumeX, Maximize, AlertCircle, Loader2, RotateCcw } from 'lucide-react';

interface HLSPlayerProps {
  streamUrl: string;
  autoPlay?: boolean;
  poster?: string;
  title?: string;
  onErrorChange?: (error: string | null) => void;
}

export const HLSPlayer: React.FC<HLSPlayerProps> = ({
  streamUrl,
  autoPlay = true,
  poster,
  title,
  onErrorChange
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryNonce, setRetryNonce] = useState(0);
  const [useProxyFallback, setUseProxyFallback] = useState(false);

  const reportError = (err: string | null) => {
    setErrorMessage(err);
    onErrorChange?.(err);
  };

  useEffect(() => {
    setUseProxyFallback(false);
  }, [streamUrl]);

  const effectiveStreamUrl =
    useProxyFallback && streamUrl.startsWith('https://')
      ? `/api/tv/hls-proxy?url=${encodeURIComponent(streamUrl)}`
      : streamUrl;

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !effectiveStreamUrl) {
      setIsLoading(false);
      reportError("Unable to play this channel. The stream URL is missing or offline.");
      return;
    }

    setIsLoading(true);
    reportError(null);

    // Clean up previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    // Check if HLS.js is supported
    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
      });

      hlsRef.current = hls;
      hls.loadSource(effectiveStreamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        if (autoPlay) {
          video.play().then(() => setIsPlaying(true)).catch(() => {
            // Autoplay requires muted
            setIsMuted(true);
            video.muted = true;
            video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
          });
        }
      });

      let retryCount = 0;

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              if (retryCount < 1) {
                retryCount++;
                hls.startLoad();
              } else if (!useProxyFallback && streamUrl.startsWith('https://')) {
                // Automatic CORS-safe proxy fallback when broadcaster lacks CORS headers
                hls.destroy();
                hlsRef.current = null;
                setUseProxyFallback(true);
              } else {
                hls.destroy();
                hlsRef.current = null;
                setIsLoading(false);
                reportError("The live stream is currently offline or unreachable.");
              }
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              hlsRef.current = null;
              setIsLoading(false);
              reportError("The stream for this channel is currently unavailable or restricted.");
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (e.g. Safari on iOS/Mac)
      video.src = effectiveStreamUrl;
      const onLoadedMetadata = () => {
        setIsLoading(false);
        if (autoPlay) {
          video.play().then(() => setIsPlaying(true)).catch(() => {
            setIsMuted(true);
            video.muted = true;
            video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
          });
        }
      };
      const onError = () => {
        if (!useProxyFallback && streamUrl.startsWith('https://')) {
          setUseProxyFallback(true);
        } else {
          setIsLoading(false);
          reportError("Unable to play this channel right now.");
        }
      };

      video.addEventListener('loadedmetadata', onLoadedMetadata);
      video.addEventListener('error', onError);

      return () => {
        video.removeEventListener('loadedmetadata', onLoadedMetadata);
        video.removeEventListener('error', onError);
      };
    } else {
      setIsLoading(false);
      reportError("HLS streaming is not supported in this browser.");
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [effectiveStreamUrl, streamUrl, useProxyFallback, autoPlay, retryNonce]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleVolumeChange = () => {
      setIsMuted(video.muted);
      setVolume(video.volume);
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('volumechange', handleVolumeChange);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('volumechange', handleVolumeChange);
    };
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
    } else {
      video.play().catch(() => {});
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const val = parseFloat(e.target.value);
    video.volume = val;
    video.muted = val === 0;
    setVolume(val);
  };

  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      video.requestFullscreen().catch(() => {});
    }
  };

  const handleRetry = () => {
    setIsLoading(true);
    reportError(null);
    setRetryNonce((n) => n + 1);
  };

  return (
    <div className="relative w-full h-full bg-slate-950 flex flex-col justify-center items-center overflow-hidden group select-none min-h-[300px]">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-md text-white p-4">
          <Loader2 className="w-10 h-10 text-amber-500 animate-spin mb-3" />
          <p className="text-sm font-bold text-slate-200">Connecting to Live Stream...</p>
          <p className="text-xs text-slate-400 font-mono mt-1">HLS Buffer Initializing</p>
        </div>
      )}

      {/* Error Overlay */}
      {errorMessage && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/95 text-white p-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-950/80 border border-red-800/80 flex items-center justify-center mb-3 text-red-400">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h4 className="text-base font-black text-red-400 mb-2">Stream Playback Failed</h4>
          <p className="text-xs text-slate-300 max-w-md leading-relaxed mb-6 font-medium">
            {errorMessage}
          </p>
          <button
            onClick={handleRetry}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-transform flex items-center gap-2 shadow-lg"
          >
            <RotateCcw className="w-4 h-4" /> Retry Connection
          </button>
        </div>
      )}

      {/* Video Element */}
      <video
        ref={videoRef}
        poster={poster}
        playsInline
        muted={isMuted}
        onClick={togglePlay}
        onError={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsLoading(false);
          reportError("The live stream is currently offline or unreachable.");
        }}
        className="w-full h-full object-contain cursor-pointer"
      />

      {/* Unmute helper */}
      {isMuted && isPlaying && !errorMessage && !isLoading && (
        <button
          onClick={toggleMute}
          className="absolute top-4 left-4 z-20 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-3.5 py-2 rounded-xl shadow-2xl flex items-center gap-2 animate-bounce"
        >
          <VolumeX className="w-4 h-4" /> Tap to Unmute Audio
        </button>
      )}

      {/* Control Overlay */}
      {!errorMessage && (
        <div className="absolute bottom-0 inset-x-0 z-20 p-3 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between text-white gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="p-2 rounded-xl bg-slate-900/80 hover:bg-amber-500 hover:text-slate-950 text-white transition-colors"
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleMute}
                className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
              >
                {isMuted || volume === 0 ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-cyan-400" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-16 sm:w-24 accent-amber-500 cursor-pointer"
              />
            </div>

            {title && (
              <span className="text-xs font-bold text-slate-300 hidden md:inline truncate max-w-[200px]">
                {title}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-red-600 text-white font-extrabold animate-pulse">
              LIVE HLS
            </span>
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
            >
              <Maximize className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
