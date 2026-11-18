import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  RotateCcw,
  Sparkles,
  Film,
  ExternalLink,
  Mic2,
  Tv
} from 'lucide-react';
import Hls from 'hls.js';
import { MediaItem } from '../types';

interface VideoPlayerModalProps {
  item: MediaItem | null;
  episodeId?: string;
  onClose: () => void;
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({ item, episodeId, onClose }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  if (!item) return null;

  const currentVideo = episodeId
    ? item.episodes?.find((e) => e.id === episodeId)?.videoUrl || item.videoUrl
    : item.videoUrl;

  const currentTitle = episodeId
    ? `${item.title} - ${item.episodes?.find((e) => e.id === episodeId)?.title}`
    : item.title;

  const isYouTube = currentVideo && (currentVideo.includes('youtube.com') || currentVideo.includes('youtu.be'));
  const isHls = currentVideo && currentVideo.includes('.m3u8');
  const isEmbed = currentVideo && (currentVideo.includes('embed') || currentVideo.includes('player') || currentVideo.includes('iframe'));

  // Get clean YouTube embed URL
  const getYouTubeEmbedUrl = (url: string) => {
    if (url.includes('embed/')) return url;
    let videoId = '';
    if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0];
    } else if (url.includes('watch?v=')) {
      videoId = url.split('watch?v=')[1]?.split('&')[0];
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0` : url;
  };

  useEffect(() => {
    setHasError(false);
    setIsLoading(true);

    if (isYouTube || isEmbed) {
      setIsLoading(false);
      return;
    }

    const video = videoRef.current;
    if (!video || !currentVideo) {
      setIsLoading(false);
      return;
    }

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
      hlsRef.current = hls;
      hls.loadSource(currentVideo);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        video.play().then(() => setIsPlaying(true)).catch(() => {
          setIsMuted(true);
          video.muted = true;
          video.play().catch(() => setIsPlaying(false));
        });
      });

      hls.on(Hls.Events.ERROR, () => {
        setHasError(true);
        setIsLoading(false);
      });
    } else {
      video.src = currentVideo;
      video.load();
      video.play().then(() => {
        setIsPlaying(true);
        setIsLoading(false);
      }).catch(() => {
        setIsLoading(false);
      });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [currentVideo, isYouTube, isHls, isEmbed]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;
    const total = videoRef.current.duration || 1;
    setProgress((current / total) * 100);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const seekTime = (Number(e.target.value) / 100) * (videoRef.current.duration || 0);
    videoRef.current.currentTime = seekTime;
    setProgress(Number(e.target.value));
  };

  const handleFullscreen = () => {
    const el = document.getElementById('cinema-player-box');
    if (el) {
      if (el.requestFullscreen) {
        el.requestFullscreen();
      }
    }
  };

  const umusobanuzi = (item as any).umusobanuzi || (item as any).director || 'Agasobanuye';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-2xl p-2 sm:p-6 overflow-hidden">
      <div
        id="cinema-player-box"
        className="relative w-full max-w-6xl h-full max-h-[92vh] bg-[#060b18] rounded-3xl border border-cyan-400/40 overflow-hidden flex flex-col justify-between shadow-2xl shadow-cyan-950/80 mirror-shine"
      >
        {/* Player Top Controls Header */}
        <div className="z-20 p-4 sm:px-6 bg-gradient-to-b from-[#060b18] via-[#060b18]/80 to-transparent flex items-center justify-between text-white border-b border-cyan-500/20">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-gradient-to-r from-cyan-400 to-blue-600 text-slate-950 shadow-md">
              1080p FHD
            </span>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-black text-white truncate max-w-md">
                {currentTitle}
              </h2>
              {umusobanuzi && (
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-800 text-cyan-300 border border-cyan-500/30">
                  🎙️ {umusobanuzi}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-2xl bg-slate-900/90 text-slate-400 hover:text-white border border-cyan-500/30 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Canvas Container */}
        <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
          {isYouTube ? (
            <iframe
              src={getYouTubeEmbedUrl(currentVideo)}
              title={currentTitle}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full border-0"
            />
          ) : isEmbed && !isHls && !currentVideo.endsWith('.mp4') ? (
            <iframe
              src={currentVideo}
              title={currentTitle}
              allowFullScreen
              className="w-full h-full border-0"
            />
          ) : !hasError ? (
            <div className="relative w-full h-full flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={isMuted}
                onError={() => setHasError(true)}
                onTimeUpdate={handleTimeUpdate}
                onClick={togglePlay}
                className="w-full h-full object-contain cursor-pointer"
              />

              {isMuted && (
                <button
                  onClick={() => setIsMuted(false)}
                  className="absolute top-4 left-4 z-20 bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-black text-xs px-3.5 py-2 rounded-xl shadow-xl flex items-center gap-2"
                >
                  <VolumeX className="w-4 h-4" /> Tap to Unmute
                </button>
              )}
            </div>
          ) : (
            /* Fallback Screen */
            <div className="w-full h-full p-8 bg-gradient-to-br from-[#060b18] via-[#091124] to-[#060b18] flex flex-col items-center justify-center text-center relative overflow-hidden">
              <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-cyan-500/40 flex items-center justify-center mb-4 shadow-xl">
                <Play className="w-8 h-8 text-cyan-400 fill-cyan-400 ml-1 animate-pulse" />
              </div>
              <h3 className="text-lg font-black text-white mb-1">{currentTitle}</h3>
              <p className="text-xs text-cyan-300 font-bold mb-4">Agasobanuye Video Player (HD)</p>
              <p className="text-xs text-slate-400 max-w-md mb-6 leading-relaxed">
                Stream source: <span className="font-mono text-cyan-400 break-all">{currentVideo}</span>
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setHasError(false)}
                  className="px-5 py-2.5 rounded-xl bg-cyan-400 text-slate-950 font-black text-xs hover:bg-cyan-300 transition-transform flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" /> Retry Playback
                </button>
                <a
                  href={currentVideo}
                  target="_blank"
                  rel="noreferrer"
                  className="px-5 py-2.5 rounded-xl bg-slate-800 text-white font-bold text-xs hover:bg-slate-700 transition-transform flex items-center gap-2 border border-slate-700"
                >
                  <ExternalLink className="w-4 h-4" /> Open Stream Link
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Playback Control Bar (for native video) */}
        {!isYouTube && !isEmbed && !hasError && (
          <div className="z-20 p-4 sm:px-6 bg-gradient-to-t from-[#060b18] via-[#060b18]/90 to-transparent flex flex-col gap-3 border-t border-cyan-500/20">
            {/* Progress Bar Slider */}
            <div className="flex items-center gap-3 w-full">
              <input
                type="range"
                min="0"
                max="100"
                value={progress}
                onChange={handleSeek}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 hover:h-2 transition-all"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={togglePlay}
                  className="p-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-black shadow-md hover:scale-105 transition-transform"
                >
                  {isPlaying ? <Pause className="w-4 h-4 fill-slate-950" /> : <Play className="w-4 h-4 fill-slate-950 ml-0.5" />}
                </button>

                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-2 rounded-xl bg-slate-900 border border-cyan-500/30 text-slate-300 hover:text-white"
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-pink-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleFullscreen}
                  className="p-2 rounded-xl bg-slate-900 border border-cyan-500/30 text-slate-300 hover:text-cyan-300"
                  title="Fullscreen"
                >
                  <Maximize className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
