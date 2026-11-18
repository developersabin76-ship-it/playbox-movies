import React, { useState, useEffect, useRef } from 'react';
import {
  Tv,
  Film,
  Radio,
  Search,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Star,
  RefreshCw,
  Heart,
  Bookmark,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Radio as RadioIcon,
  RotateCcw,
  Sparkles,
  Layers,
  ChevronRight,
  ShieldCheck,
  Calendar,
  ExternalLink,
  Download,
  Maximize2,
  X,
  ChevronUp,
  ListVideo
} from 'lucide-react';

import {
  RwandanNetworkFeed,
  MovieMetadata,
  STABLE_RWANDAN_FEEDS,
  FALLBACK_MOVIES,
  fetchLiveTVFeeds,
  fetchAgasobanuyeMovies,
  getProgramSchedule
} from '../services/mediaService';

import { useUserPreferences } from '../hooks/useUserPreferences';
import { HLSPlayer } from './HLSPlayer';

interface LionelMediaDashboardProps {
  initialTab?: 'tv' | 'movies' | 'radio';
}

export const LionelMediaDashboard: React.FC<LionelMediaDashboardProps> = ({ initialTab = 'movies' }) => {
  // Navigation Dual-Mode Tab State
  const [activeTab, setActiveTab] = useState<'tv' | 'movies' | 'radio'>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Feeds & Movies State
  const [channels, setChannels] = useState<RwandanNetworkFeed[]>(STABLE_RWANDAN_FEEDS);
  const [selectedChannel, setSelectedChannel] = useState<RwandanNetworkFeed>(STABLE_RWANDAN_FEEDS[0]);

  const [movies, setMovies] = useState<MovieMetadata[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<MovieMetadata | null>(null);

  const [isLoadingMedia, setIsLoadingMedia] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showScheduleModal, setShowScheduleModal] = useState<boolean>(false);

  // Movie Catalog Filters & Pagination State
  const [selectedTranslator, setSelectedTranslator] = useState<string>('ALL');
  const [selectedGenre, setSelectedGenre] = useState<string>('ALL');
  const [visibleMoviesLimit, setVisibleMoviesLimit] = useState<number>(60);

  // Floating Mini-Player & Quick Select State
  const [showMiniPlayer, setShowMiniPlayer] = useState<boolean>(false);
  const [miniPlayerDismissed, setMiniPlayerDismissed] = useState<boolean>(false);
  const [quickSidebarSearch, setQuickSidebarSearch] = useState<string>('');
  const [quickSidebarTranslator, setQuickSidebarTranslator] = useState<string>('ALL');

  useEffect(() => {
    const target = document.getElementById('main-media-player');
    if (!target) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowMiniPlayer(!entry.isIntersecting);
      },
      { threshold: 0.1 }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [activeTab, selectedMovie]);

  // User Retention Preferences Hook
  const {
    lastWatched,
    saveLastWatched,
    favorites,
    toggleFavorite,
    isFavorite,
    getWatchProgress,
    updateWatchProgress
  } = useUserPreferences();

  // Audio Radio State
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const [audioError, setAudioError] = useState<string | null>(null);

  // Stream Resolution State for Oshakur Movies
  const [resolvedStream, setResolvedStream] = useState<{
    primaryVideoStreamUrl: string | null;
    hgcloudUrl: string | null;
    episodes: { title: string; videoStreamUrl: string; downloadUrl: string }[];
    oshakurWatchUrl: string;
    loading: boolean;
    activeEpisodeIndex: number;
    playerMode: 'direct' | 'hgcloud' | 'oshakur';
  }>({
    primaryVideoStreamUrl: null,
    hgcloudUrl: null,
    episodes: [],
    oshakurWatchUrl: '',
    loading: false,
    activeEpisodeIndex: 0,
    playerMode: 'direct'
  });

  // Stream Resolver Effect for Agasobanuye Movies
  useEffect(() => {
    if (!selectedMovie || activeTab !== 'movies') return;

    let isMounted = true;
    const rawId = selectedMovie.id || '';
    const cleanSlug = (selectedMovie as any).slug || rawId.replace(/^ag-/, '').replace(/^agasoba-/, '').replace(/^oshakur-/, '').replace(/^m-osh-/, '');
    const watchPageUrl = `https://agasobanuyenow.com/movies/${cleanSlug}/watch`;

    setResolvedStream((prev) => ({
      ...prev,
      loading: true,
      primaryVideoStreamUrl: null,
      hgcloudUrl: null,
      episodes: [],
      activeEpisodeIndex: 0,
      playerMode: 'direct',
      oshakurWatchUrl: watchPageUrl
    }));

    fetch(`/api/media/extract-video?slug=${encodeURIComponent(cleanSlug)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        const videoStreamUrl = data.videoUrl || data.primaryVideoStreamUrl;
        const episodesList = data.episodes && data.episodes.length > 0
          ? data.episodes
          : (videoStreamUrl ? [{ title: 'Full Movie HD', videoStreamUrl, downloadUrl: watchPageUrl }] : []);

        setResolvedStream({
          primaryVideoStreamUrl: videoStreamUrl || null,
          hgcloudUrl: data.hgcloudUrl || null,
          episodes: episodesList,
          oshakurWatchUrl: data.agasobaWatchUrl || data.oshakurWatchUrl || watchPageUrl,
          loading: false,
          activeEpisodeIndex: 0,
          playerMode: 'direct'
        });
      })
      .catch((err) => {
        console.warn('Stream extraction notice:', err);
        if (isMounted) {
          setResolvedStream({
            primaryVideoStreamUrl: null,
            hgcloudUrl: null,
            episodes: [],
            oshakurWatchUrl: watchPageUrl,
            loading: false,
            activeEpisodeIndex: 0,
            playerMode: 'direct'
          });
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedMovie, activeTab]);

  // Fetch Live Channels & Movies on Load
  useEffect(() => {
    let isMounted = true;
    setIsLoadingMedia(true);

    Promise.all([fetchLiveTVFeeds(), fetchAgasobanuyeMovies()])
      .then(([fetchedChannels, fetchedMovies]) => {
        if (isMounted) {
          if (fetchedChannels.length > 0) {
            setChannels(fetchedChannels);
          }
          if (fetchedMovies.length > 0) {
            setMovies(fetchedMovies);
          }
        }
      })
      .finally(() => {
        if (isMounted) setIsLoadingMedia(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Handle Selection of TV Channel
  const handleSelectChannel = (channel: RwandanNetworkFeed) => {
    setSelectedChannel(channel);
    setSelectedMovie(null);
    saveLastWatched({
      type: 'channel',
      id: channel.id,
      nameOrTitle: channel.name,
      logoOrPoster: channel.logoUrl,
      streamOrEmbedUrl: channel.streamUrl,
      category: channel.category
    });
  };

  // Handle Selection of Movie - Plays directly in-page on LIONEL TV
  const handleSelectMovie = (movie: MovieMetadata) => {
    setActiveTab('movies');
    setSelectedMovie(movie);
    setMiniPlayerDismissed(false);
    saveLastWatched({
      type: 'movie',
      id: movie.id,
      nameOrTitle: movie.title,
      logoOrPoster: movie.posterImage,
      streamOrEmbedUrl: movie.embedUrl,
      category: movie.category
    });
    // Record starting progress
    if (getWatchProgress(movie.id) === 0) {
      updateWatchProgress(movie.id, 15);
    }

    // Scroll smoothly to top player container
    const playerEl = document.getElementById('main-media-player');
    if (playerEl) {
      playerEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Resume last watched item
  const handleResumeLastWatched = () => {
    if (!lastWatched) return;
    if (lastWatched.type === 'movie') {
      const match = movies.find((m) => m.id === lastWatched.id);
      if (match) {
        setActiveTab('movies');
        handleSelectMovie(match);
      } else {
        const customMovie: MovieMetadata = {
          id: lastWatched.id,
          title: lastWatched.nameOrTitle,
          posterImage: lastWatched.logoOrPoster,
          category: lastWatched.category || 'Agasobanuye',
          embedUrl: lastWatched.streamOrEmbedUrl,
          rating: '9.6'
        };
        setActiveTab('movies');
        handleSelectMovie(customMovie);
      }
    } else {
      const match = channels.find((c) => c.id === lastWatched.id);
      if (match) {
        setActiveTab(match.category.includes('Radio') ? 'radio' : 'tv');
        handleSelectChannel(match);
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle Audio playback for radio stations
  useEffect(() => {
    if (activeTab === 'radio' && selectedChannel && selectedChannel.streamUrl) {
      const audio = audioRef.current;
      if (audio) {
        setAudioError(null);
        audio.src = selectedChannel.streamUrl;
        audio
          .play()
          .then(() => setIsAudioPlaying(true))
          .catch((err) => {
            console.warn('Radio playback blocked or failed:', err);
            setIsAudioPlaying(false);
          });
      }
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        setIsAudioPlaying(false);
      }
    }
  }, [selectedChannel, activeTab]);

  const toggleAudioPlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isAudioPlaying) {
      audio.pause();
      setIsAudioPlaying(false);
    } else {
      audio
        .play()
        .then(() => setIsAudioPlaying(true))
        .catch(() => setAudioError('Live audio stream currently updating or offline.'));
    }
  };

  const toggleAudioMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !isAudioMuted;
    setIsAudioMuted(!isAudioMuted);
  };

  // Groupings
  const rwandanChannels = channels.filter((c) => c.category === 'Rwandan Local TV' || c.country === 'Rwanda');
  const starTimesChannels = channels.filter((c) => c.category === 'StarTimes Channels');
  const radioChannels = channels.filter((c) => c.category.includes('Radio'));

  // Favorites
  const favoriteChannels = channels.filter((c) => favorites.includes(c.id));
  const favoriteMovies = movies.filter((m) => favorites.includes(m.id));

  // Search Filter Functions
  const filterChannels = (list: RwandanNetworkFeed[]) => {
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter((c) => c.name.toLowerCase().includes(q) || c.category.toLowerCase().includes(q));
  };

  const filterMovies = (list: MovieMetadata[]) => {
    let result = list;
    if (selectedTranslator !== 'ALL') {
      const trFull = selectedTranslator.toLowerCase();
      const trTokens = trFull.split(' ').filter(t => t.length > 2 && t !== 'the' && t !== 'sound');
      result = result.filter((m) => {
        const cat = (m.category || '').toLowerCase();
        const title = (m.title || '').toLowerCase();
        const tr = ((m as any).translator || '').toLowerCase();
        return trTokens.some(token => cat.includes(token) || title.includes(token) || tr.includes(token)) ||
               cat.includes(trFull) || title.includes(trFull) || tr.includes(trFull);
      });
    }
    if (selectedGenre !== 'ALL') {
      const gn = selectedGenre.toLowerCase();
      result = result.filter((m) => {
        const badge = ((m as any).badge || '').toLowerCase();
        const cat = (m.category || '').toLowerCase();
        const title = (m.title || '').toLowerCase();
        return badge.includes(gn) || cat.includes(gn) || title.includes(gn);
      });
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((m) => {
        const title = (m.title || '').toLowerCase();
        const cat = (m.category || '').toLowerCase();
        const tr = ((m as any).translator || '').toLowerCase();
        return title.includes(q) || cat.includes(q) || tr.includes(q);
      });
    }
    return result;
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col font-sans selection:bg-cyan-500 selection:text-zinc-950">
      {/* Hidden Native Audio Element */}
      <audio
        ref={audioRef}
        preload="none"
        onError={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setAudioError('Live radio stream updating or offline.');
        }}
        onEnded={() => setIsAudioPlaying(false)}
      />

      {/* 1. MINIMAL TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-50 bg-zinc-950/95 backdrop-blur-xl border-b border-zinc-800/80 px-4 lg:px-8 py-3 flex items-center justify-between gap-4 shadow-2xl">
        {/* Left Branding */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 p-0.5 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full bg-zinc-950 rounded-[10px] flex items-center justify-center text-cyan-400">
              <Tv className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <h1 className="text-base font-black text-white tracking-wider flex items-center gap-2">
              LIONEL MULTI-TV
              <span className="px-2 py-0.5 rounded text-[9px] bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30 uppercase">
                PRO 2026
              </span>
            </h1>
          </div>
        </div>

        {/* Center Universal Live Search Bar */}
        <div className="flex-1 max-w-md relative hidden md:block">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search channels, movies, or translators..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 transition-colors shadow-inner"
          />
        </div>

        {/* Right Layout Toggle Switch */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-zinc-900 p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => {
                setActiveTab('tv');
                setSelectedMovie(null);
                if (rwandanChannels.length > 0) setSelectedChannel(rwandanChannels[0]);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all ${
                activeTab === 'tv'
                  ? 'bg-cyan-500 text-zinc-950 shadow-md shadow-cyan-500/30'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              <span>Live TV</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('movies');
                if (movies.length > 0) setSelectedMovie(movies[0]);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all ${
                activeTab === 'movies'
                  ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/30'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>Agasobanuye</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('radio');
                setSelectedMovie(null);
                if (radioChannels.length > 0) setSelectedChannel(radioChannels[0]);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all ${
                activeTab === 'radio'
                  ? 'bg-purple-500 text-white shadow-md shadow-purple-500/30'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <RadioIcon className="w-3.5 h-3.5" />
              <span>Radio 📻</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Search Bar */}
      <div className="px-4 pt-3 md:hidden">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search channels or movies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* RESUME LAST WATCHED QUICK ACTION BANNER */}
        {lastWatched && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-cyan-950/40 border border-cyan-500/30 flex items-center justify-between gap-3 shadow-xl">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-zinc-950 p-1 border border-zinc-800 shrink-0">
                <img src={lastWatched.logoOrPoster} alt="" className="w-full h-full object-contain rounded-lg" />
              </div>
              <div className="truncate">
                <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1">
                  <RotateCcw className="w-3 h-3" /> Resume Last Watched
                </p>
                <h4 className="text-xs font-extrabold text-white truncate">{lastWatched.nameOrTitle}</h4>
              </div>
            </div>

            <button
              onClick={handleResumeLastWatched}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-black text-xs shrink-0 transition-transform hover:scale-105 flex items-center gap-1.5 shadow-lg shadow-cyan-500/20"
            >
              <Play className="w-3.5 h-3.5 fill-current" /> Resume
            </button>
          </div>
        )}

        {/* 2. NATIVE HERO THEATER PLAYER WITH QUICK SELECT SIDEBAR */}
        <div className={`grid grid-cols-1 ${activeTab === 'movies' && movies.length > 0 ? 'lg:grid-cols-4' : ''} gap-4 items-start`}>
          {/* Main Hero Player Container */}
          <div className={`relative w-full rounded-3xl bg-zinc-900 border border-zinc-800/80 overflow-hidden shadow-2xl ${activeTab === 'movies' && movies.length > 0 ? 'lg:col-span-3' : ''}`}>
          {/* Top Info Header Bar */}
          <div className="flex items-center justify-between px-5 py-3 bg-zinc-950/80 border-b border-zinc-800 text-xs text-zinc-300 font-bold">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              <span className="text-red-400 font-black uppercase tracking-wider text-[11px]">
                {activeTab === 'movies'
                  ? 'AGASOBANUYE THEATER STREAM'
                  : activeTab === 'radio'
                  ? 'LIVE RADIO FM'
                  : 'LIVE STREAM PLAYER'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-zinc-400 text-[11px] font-mono hidden sm:inline">
                {activeTab === 'movies'
                  ? selectedMovie?.title || 'Select a movie'
                  : selectedChannel?.name || 'Select a channel'}
              </span>

              {/* Bookmark ♡ Save Toggle Button */}
              {activeTab === 'movies' && selectedMovie && (
                <button
                  onClick={() => toggleFavorite(selectedMovie.id)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 ${
                    isFavorite(selectedMovie.id)
                      ? 'bg-red-500/20 border-red-500 text-red-400'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${isFavorite(selectedMovie.id) ? 'fill-red-400 text-red-400' : ''}`} />
                  <span>{isFavorite(selectedMovie.id) ? 'Saved' : '♡ Save'}</span>
                </button>
              )}

              {activeTab !== 'movies' && selectedChannel && (
                <button
                  onClick={() => toggleFavorite(selectedChannel.id)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 ${
                    isFavorite(selectedChannel.id)
                      ? 'bg-red-500/20 border-red-500 text-red-400'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  <Heart
                    className={`w-3.5 h-3.5 ${isFavorite(selectedChannel.id) ? 'fill-red-400 text-red-400' : ''}`}
                  />
                  <span>{isFavorite(selectedChannel.id) ? 'Saved' : '♡ Save'}</span>
                </button>
              )}

              {/* Daily Schedule Modal Trigger */}
              {activeTab === 'tv' && selectedChannel && (
                <button
                  onClick={() => setShowScheduleModal(true)}
                  className="px-3 py-1 rounded-xl text-xs font-bold bg-zinc-900 border border-zinc-800 text-cyan-400 hover:border-cyan-500/50 transition-colors flex items-center gap-1"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Schedule</span>
                </button>
              )}
            </div>
          </div>

          {/* Hero Viewport Display */}
          <div id="main-media-player" className="relative w-full aspect-video max-h-[520px] bg-zinc-950 flex items-center justify-center overflow-hidden">
            {activeTab === 'movies' && !selectedMovie ? (
              /* EMPTY MOVIES STATE (Waiting for new website) */
              <div className="relative w-full h-full flex flex-col items-center justify-center p-8 text-center bg-zinc-950 select-none">
                <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-4 shadow-lg shadow-amber-500/10">
                  <Film className="w-8 h-8 text-amber-400" />
                </div>
                <h3 className="text-base font-black text-white mb-1">
                  Films Database Cleared
                </h3>
                <p className="text-xs text-zinc-400 max-w-md leading-relaxed mb-5">
                  All previous movies have been deleted. Please share the URL of your new movie website and they will be fetched and streamed live right here!
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setActiveTab('tv');
                      if (channels.length > 0) setSelectedChannel(channels[0]);
                    }}
                    className="px-4 py-2 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-bold text-xs hover:bg-cyan-500/30 transition-colors flex items-center gap-1.5"
                  >
                    <Tv className="w-4 h-4" /> Watch Live TV
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('radio');
                      const firstRadio = channels.find(c => c.category.includes('Radio')) || channels[0];
                      if (firstRadio) setSelectedChannel(firstRadio);
                    }}
                    className="px-4 py-2 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300 font-bold text-xs hover:bg-purple-500/30 transition-colors flex items-center gap-1.5"
                  >
                    <Radio className="w-4 h-4" /> Listen to Radio
                  </button>
                </div>
              </div>
            ) : activeTab === 'movies' && selectedMovie ? (
              resolvedStream.loading ? (
                /* LOADING STREAM RESOLUTION STATE */
                <div className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center select-none bg-zinc-950">
                  <img
                    src={selectedMovie.posterImage}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover opacity-20 blur-xl scale-110"
                  />
                  <div className="relative z-10 flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full border-4 border-amber-500/30 border-t-amber-500 animate-spin" />
                    <div>
                      <h3 className="text-sm font-extrabold text-white flex items-center gap-2 justify-center">
                        <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                        Connecting Live Video Stream Engine...
                      </h3>
                      <p className="text-xs text-zinc-400 mt-1 max-w-sm">
                        Extracting HD stream for "{selectedMovie.title}" from Oshakur Films
                      </p>
                    </div>
                  </div>
                </div>
              ) : resolvedStream.playerMode === 'hgcloud' && resolvedStream.hgcloudUrl ? (
                /* HGCLOUD STREAM PLAYER */
                <iframe
                  key={selectedMovie.id + resolvedStream.hgcloudUrl}
                  src={resolvedStream.hgcloudUrl}
                  title={selectedMovie.title}
                  allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              ) : (
                /* DIRECT NATIVE HTML5 MP4 VIDEO PLAYER - PLAYED DIRECTLY ON SCREEN */
                <video
                  key={
                    selectedMovie.id +
                    (resolvedStream.episodes[resolvedStream.activeEpisodeIndex]?.videoStreamUrl ||
                      resolvedStream.primaryVideoStreamUrl ||
                      'stream')
                  }
                  src={
                    resolvedStream.episodes[resolvedStream.activeEpisodeIndex]?.videoStreamUrl ||
                    resolvedStream.primaryVideoStreamUrl ||
                    `/api/media/stream-proxy?url=${encodeURIComponent('https://media.agasobanuyenow.com/download/Dance%20Flick%20-%20Sankara.mp4')}`
                  }
                  controls
                  autoPlay
                  playsInline
                  preload="metadata"
                  poster={selectedMovie.posterImage}
                  onError={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onLoadedData={(e) => {
                    const videoEl = e.currentTarget;
                    videoEl.play().catch(() => {
                      console.log('Autoplay active - ready for playback');
                    });
                  }}
                  className="w-full h-full object-contain bg-black"
                />
              )
            ) : activeTab === 'radio' && selectedChannel ? (
              /* VIEW MODE 2: LIVE RADIO VISUALIZER */
              <div className="relative w-full h-full bg-gradient-to-br from-zinc-950 via-purple-950/20 to-zinc-950 flex flex-col items-center justify-center p-6 text-center select-none overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:24px_24px] opacity-30" />

                <div className="relative z-10 mb-4">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-zinc-900 border-2 border-purple-500/40 p-2 shadow-2xl flex items-center justify-center overflow-hidden">
                    <img
                      src={selectedChannel.logoUrl}
                      alt={selectedChannel.name}
                      className="w-full h-full object-contain rounded-2xl"
                    />
                  </div>
                </div>

                <h3 className="relative z-10 text-xl font-black text-white mb-1">{selectedChannel.name}</h3>
                <p className="relative z-10 text-xs text-purple-300 font-semibold mb-6 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Live Radio Broadcast Kigali
                </p>

                {audioError && (
                  <div className="relative z-10 p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-300 text-xs max-w-md mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                    {audioError}
                  </div>
                )}

                <div className="relative z-10 flex items-center gap-4">
                  <button
                    onClick={toggleAudioPlay}
                    className="px-6 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs shadow-xl transition-all hover:scale-105 flex items-center gap-2"
                  >
                    {isAudioPlaying ? (
                      <Pause className="w-5 h-5 fill-current" />
                    ) : (
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    )}
                    {isAudioPlaying ? 'Pause Radio' : 'Play Live Radio'}
                  </button>

                  <button
                    onClick={toggleAudioMute}
                    className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white"
                  >
                    {isAudioMuted ? (
                      <VolumeX className="w-5 h-5 text-red-400" />
                    ) : (
                      <Volume2 className="w-5 h-5 text-cyan-400" />
                    )}
                  </button>
                </div>
              </div>
            ) : selectedChannel && selectedChannel.embedType === 'youtube_live' && selectedChannel.youtubeLiveId ? (
              /* VIEW MODE 3: YOUTUBE LIVE CHANNEL */
              <iframe
                src={`https://www.youtube.com/embed/${selectedChannel.youtubeLiveId}?autoplay=1`}
                title={selectedChannel.name}
                sandbox="allow-scripts allow-same-origin allow-presentation"
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              />
            ) : selectedChannel ? (
              /* VIEW MODE 4: HLS LIVE PLAYER */
              <HLSPlayer
                key={selectedChannel.id + selectedChannel.streamUrl}
                streamUrl={selectedChannel.streamUrl}
                title={selectedChannel.name}
                poster={selectedChannel.logoUrl}
                autoPlay={true}
              />
            ) : (
              /* FALLBACK CARD */
              <div className="p-8 text-center text-zinc-400">
                <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
                <h4 className="text-base font-bold text-white mb-1">Stream Connection Updating...</h4>
                <p className="text-xs">Select a channel or movie from the list below.</p>
              </div>
            )}
          </div>

          {/* Episodes Bar (If multiple episodes/parts exist) */}
          {activeTab === 'movies' && resolvedStream.episodes.length > 1 && (
            <div className="px-4 py-2.5 bg-zinc-900/90 border-t border-zinc-800 flex items-center gap-2 overflow-x-auto">
              <span className="text-xs font-bold text-amber-400 shrink-0 flex items-center gap-1">
                <Film className="w-3.5 h-3.5" /> Episodes / Parts:
              </span>
              {resolvedStream.episodes.map((ep, idx) => (
                <button
                  key={idx}
                  onClick={() =>
                    setResolvedStream((prev) => ({
                      ...prev,
                      activeEpisodeIndex: idx,
                      playerMode: 'direct'
                    }))
                  }
                  className={`px-3 py-1 rounded-xl text-xs font-bold shrink-0 transition-all ${
                    resolvedStream.activeEpisodeIndex === idx && resolvedStream.playerMode === 'direct'
                      ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/30'
                      : 'bg-zinc-950 text-zinc-300 hover:text-white border border-zinc-800'
                  }`}
                >
                  {ep.title}
                </button>
              ))}
            </div>
          )}

          {/* Hero Details Footer Bar */}
          <div className="p-4 bg-zinc-950/90 border-t border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-zinc-900 p-1 border border-zinc-800 shrink-0">
                <img
                  src={activeTab === 'movies' ? selectedMovie?.posterImage : selectedChannel?.logoUrl}
                  alt=""
                  className="w-full h-full object-contain rounded-lg"
                />
              </div>
              <div>
                <h2 className="text-sm font-black text-white flex items-center gap-2">
                  {activeTab === 'movies' ? selectedMovie?.title : selectedChannel?.name}
                  <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    {activeTab === 'movies' ? selectedMovie?.rating : selectedChannel?.rating}
                  </span>
                </h2>
                <p className="text-xs text-zinc-400 font-medium">
                  {activeTab === 'movies'
                    ? `${selectedMovie?.category} • Kinyarwanda (${selectedMovie?.releaseYear || '2026'})`
                    : `${selectedChannel?.category} • ${selectedChannel?.country}`}
                </p>
              </div>
            </div>

            {/* Stream Action Buttons for Movies */}
            {activeTab === 'movies' && selectedMovie && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    setResolvedStream((prev) => ({ ...prev, playerMode: 'direct' }));
                    const playerEl = document.getElementById('main-media-player');
                    if (playerEl) playerEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 border border-amber-400 transition-all shadow-lg shadow-amber-500/30 flex items-center gap-2 transform hover:scale-105"
                >
                  <Play className="w-4 h-4 fill-current ml-0.5" /> Play on LIONEL TV
                </button>

                {resolvedStream.primaryVideoStreamUrl && (
                  <button
                    onClick={() => setResolvedStream((prev) => ({ ...prev, playerMode: 'direct' }))}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      resolvedStream.playerMode === 'direct'
                        ? 'bg-zinc-800 text-amber-300 border border-amber-500/50 shadow-md'
                        : 'bg-zinc-900 text-zinc-300 hover:text-white border border-zinc-800'
                    }`}
                  >
                    <Play className="w-3.5 h-3.5 fill-current" /> Native Player HD
                  </button>
                )}

                {resolvedStream.hgcloudUrl && (
                  <button
                    onClick={() => setResolvedStream((prev) => ({ ...prev, playerMode: 'hgcloud' }))}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      resolvedStream.playerMode === 'hgcloud'
                        ? 'bg-zinc-800 text-amber-300 border border-amber-500/50 shadow-md'
                        : 'bg-zinc-900 text-zinc-300 hover:text-white border border-zinc-800'
                    }`}
                  >
                    <Tv className="w-3.5 h-3.5" /> HgCloud Stream
                  </button>
                )}

                {(resolvedStream.episodes[resolvedStream.activeEpisodeIndex]?.downloadUrl ||
                  resolvedStream.primaryVideoStreamUrl) && (
                  <a
                    href={
                      resolvedStream.episodes[resolvedStream.activeEpisodeIndex]?.downloadUrl ||
                      resolvedStream.primaryVideoStreamUrl ||
                      ''
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-2 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30 transition-all flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" /> Download MP4
                  </a>
                )}
              </div>
            )}

            {activeTab !== 'movies' && (
              <div className="flex items-center gap-2 text-xs text-zinc-400 font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Verified Stream Engine</span>
              </div>
            )}
          </div>
          </div>

          {/* Quick Select Film Sidebar while viewing */}
          {activeTab === 'movies' && movies.length > 0 && (
            <div className="lg:col-span-1 bg-zinc-900/90 border border-zinc-800/90 rounded-3xl p-3.5 flex flex-col h-full max-h-[620px] shadow-2xl overflow-hidden backdrop-blur-md">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-3 shrink-0">
                <div className="flex items-center gap-2">
                  <ListVideo className="w-4 h-4 text-amber-400 shrink-0" />
                  <h3 className="text-xs font-black text-white uppercase tracking-wider">
                    Up Next & Quick Select
                  </h3>
                </div>
                <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                  {movies.length} Films
                </span>
              </div>

              {/* Search Input in Sidebar */}
              <div className="relative mb-2.5 shrink-0">
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={quickSidebarSearch}
                  onChange={(e) => setQuickSidebarSearch(e.target.value)}
                  placeholder="Search film while watching..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs placeholder:text-zinc-500 focus:outline-none focus:border-amber-500/80 transition-colors"
                />
              </div>

              {/* Translator Quick Tag Filters */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2.5 mb-2.5 border-b border-zinc-800/80 shrink-0 no-scrollbar">
                {['ALL', 'Sankara', 'Gaheza', 'Rocky', 'Sikov', 'Junior', 'Savimbi', 'Perfect', 'Mr Jingo'].map((tr) => (
                  <button
                    key={tr}
                    onClick={() => setQuickSidebarTranslator(tr)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase shrink-0 transition-all ${
                      quickSidebarTranslator === tr
                        ? 'bg-amber-500 text-zinc-950 shadow-sm'
                        : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                    }`}
                  >
                    {tr}
                  </button>
                ))}
              </div>

              {/* Scrollable Movies List */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {movies
                  .filter((m) => {
                    if (quickSidebarTranslator !== 'ALL') {
                      const tr = quickSidebarTranslator.toLowerCase();
                      const cat = (m.category || '').toLowerCase();
                      const title = (m.title || '').toLowerCase();
                      const trans = ((m as any).translator || '').toLowerCase();
                      if (!cat.includes(tr) && !title.includes(tr) && !trans.includes(tr)) return false;
                    }
                    if (quickSidebarSearch.trim()) {
                      const q = quickSidebarSearch.toLowerCase().trim();
                      const cat = (m.category || '').toLowerCase();
                      const title = (m.title || '').toLowerCase();
                      const trans = ((m as any).translator || '').toLowerCase();
                      if (!cat.includes(q) && !title.includes(q) && !trans.includes(q)) return false;
                    }
                    return true;
                  })
                  .slice(0, 50)
                  .map((m) => {
                    const isCurrent = selectedMovie?.id === m.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => handleSelectMovie(m)}
                        className={`w-full p-2 rounded-2xl transition-all text-left flex items-center gap-2.5 group relative ${
                          isCurrent
                            ? 'bg-amber-500/15 border-2 border-amber-500 shadow-md'
                            : 'bg-zinc-950/70 hover:bg-zinc-800 border border-zinc-800/80 hover:border-amber-500/40'
                        }`}
                      >
                        <div className="relative w-12 h-16 rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 shrink-0">
                          <img
                            src={m.posterImage}
                            alt={m.title}
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = `https://picsum.photos/seed/${encodeURIComponent(m.title || m.id)}/300/450`;
                            }}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          {isCurrent && (
                            <div className="absolute inset-0 bg-amber-500/30 flex items-center justify-center">
                              <Play className="w-5 h-5 text-amber-300 fill-amber-300 animate-pulse" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <h4 className={`text-xs font-bold truncate ${isCurrent ? 'text-amber-400' : 'text-white group-hover:text-amber-300'}`}>
                              {m.title}
                            </h4>
                            {isCurrent && (
                              <span className="text-[9px] font-black uppercase text-amber-400 bg-amber-500/20 px-1.5 py-0.5 rounded shrink-0">
                                Playing
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-zinc-400 truncate font-medium">
                            {m.category || 'Agasobanuye'}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-amber-400 font-bold flex items-center gap-0.5">
                              <Star className="w-3 h-3 fill-amber-400" /> {m.rating}
                            </span>
                            <span className="text-[10px] text-zinc-500">
                              {m.releaseYear || '2026'}
                            </span>
                          </div>
                        </div>

                        <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity pr-1">
                          <div className="w-7 h-7 rounded-full bg-amber-500 text-zinc-950 flex items-center justify-center shadow-md">
                            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                          </div>
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>
          )}
        </div>

        {/* 3. MY SAVED FAVORITES ROW (If Any) */}
        {(favoriteChannels.length > 0 || favoriteMovies.length > 0) && (
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-wide">
              <Heart className="w-4 h-4 text-red-500 fill-red-500" />
              My Saved Bookmarks & Favorites
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {favoriteChannels.map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => {
                    setActiveTab(ch.category.includes('Radio') ? 'radio' : 'tv');
                    handleSelectChannel(ch);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-left hover:border-cyan-500 transition-all group"
                >
                  <div className="aspect-video w-full rounded-xl bg-zinc-950 p-1 mb-2 border border-zinc-800">
                    <img src={ch.logoUrl} alt="" className="w-full h-full object-contain rounded-lg" />
                  </div>
                  <h4 className="text-xs font-bold text-white truncate group-hover:text-cyan-400">{ch.name}</h4>
                  <span className="text-[10px] text-zinc-400">{ch.category}</span>
                </button>
              ))}

              {favoriteMovies.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setActiveTab('movies');
                    handleSelectMovie(m);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-left hover:border-amber-500 transition-all group"
                >
                  <div className="aspect-[2/3] w-full rounded-xl bg-zinc-950 overflow-hidden mb-2">
                    <img src={m.posterImage} alt="" className="w-full h-full object-cover" />
                  </div>
                  <h4 className="text-xs font-bold text-white truncate group-hover:text-amber-400">{m.title}</h4>
                  <span className="text-[10px] text-zinc-400">Movie</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 4. AGASOBANUYE MOVIES GRID (When Movies Active) */}
        {activeTab === 'movies' && (
          <div className="space-y-5">
            {movies.length === 0 ? (
              <div className="p-12 rounded-3xl bg-zinc-900/60 border border-zinc-800 text-center space-y-4 shadow-xl">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto">
                  <Film className="w-8 h-8 text-amber-400" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-black text-white">
                    Films Database Cleared
                  </h3>
                  <p className="text-xs text-zinc-400 max-w-lg mx-auto leading-relaxed">
                    All previous films have been deleted from your platform. Please share the URL of your new movie website and the system will automatically index and stream them directly here!
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b border-zinc-800">
                  <div>
                    <h3 className="text-base font-black text-white flex items-center gap-2 uppercase tracking-wide">
                      <Film className="w-5 h-5 text-amber-400" />
                      Agasobanuye Movies Collection
                      <span className="px-2.5 py-0.5 rounded-full text-xs bg-amber-500/20 text-amber-300 font-extrabold border border-amber-500/30">
                        {filterMovies(movies).length.toLocaleString()} Films
                      </span>
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Verified film library ready for live stream playback
                    </p>
                  </div>

              {/* Reload & Reset Filters buttons */}
              <div className="flex items-center gap-2 self-start md:self-auto">
                <button
                  onClick={() => {
                    setIsLoadingMedia(true);
                    try {
                      localStorage.removeItem('lionel_movies_cache');
                    } catch (e) {}
                    fetchAgasobanuyeMovies()
                      .then((m) => {
                        if (m.length > 0) setMovies(m);
                      })
                      .finally(() => setIsLoadingMedia(false));
                  }}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs font-bold text-amber-300 hover:bg-amber-500/20 transition-colors flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reload Oshakur Films
                </button>

                {(selectedTranslator !== 'ALL' || selectedGenre !== 'ALL' || searchQuery) && (
                  <button
                    onClick={() => {
                      setSelectedTranslator('ALL');
                      setSelectedGenre('ALL');
                      setSearchQuery('');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-bold text-amber-400 hover:border-amber-500 transition-colors flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Reset Filters
                  </button>
                )}
              </div>
            </div>

            {/* TRANSLATOR FILTER PILLS */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                Filter by Rwandan Translator:
              </span>
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
                {[
                  'ALL',
                  'Rocky Kimomo',
                  'Junior Giti',
                  'Yanga',
                  'Savimbi',
                  'Gaheza Simba',
                  'Sankara Da Premier',
                  'Dj Danny Wamipango',
                  'PK - The Sound',
                  'Moses',
                  'Perfect'
                ].map((tr) => (
                  <button
                    key={tr}
                    onClick={() => {
                      setSelectedTranslator(tr);
                      setVisibleMoviesLimit(60);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all border ${
                      selectedTranslator === tr
                        ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-md shadow-amber-500/20'
                        : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    {tr === 'ALL' ? '🎙️ All Translators' : `🗣️ ${tr}`}
                  </button>
                ))}
              </div>
            </div>

            {/* GENRE FILTER PILLS */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                Filter by Category:
              </span>
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
                {[
                  'ALL',
                  'Action',
                  'Sci-Fi',
                  'KungFu',
                  'Thriller',
                  'Drama',
                  'Romance',
                  'Cartoon',
                  'Indian',
                  'Military',
                  'Crime',
                  'Horror'
                ].map((gn) => (
                  <button
                    key={gn}
                    onClick={() => {
                      setSelectedGenre(gn);
                      setVisibleMoviesLimit(60);
                    }}
                    className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                      selectedGenre === gn
                        ? 'bg-cyan-500 text-zinc-950 border-cyan-400 shadow-md'
                        : 'bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:text-white'
                    }`}
                  >
                    {gn === 'ALL' ? '🎬 All Genres' : gn}
                  </button>
                ))}
              </div>
            </div>

            {/* MOVIES GRID */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {filterMovies(movies)
                .slice(0, visibleMoviesLimit)
                .map((movie) => {
                  const isSelected = selectedMovie?.id === movie.id;
                  const progress = getWatchProgress(movie.id);

                  return (
                    <div
                      key={movie.id}
                      className={`group relative rounded-2xl bg-zinc-900 border text-left overflow-hidden transition-all duration-300 hover:scale-[1.03] flex flex-col justify-between ${
                        isSelected
                          ? 'border-amber-400 ring-2 ring-amber-500/30 shadow-xl'
                          : 'border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <button
                        onClick={() => {
                          handleSelectMovie(movie);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="w-full text-left"
                      >
                        {/* Sharp Poster Thumbnail */}
                        <div className="relative aspect-[2/3] w-full bg-zinc-950 overflow-hidden">
                          <img
                            src={movie.posterImage}
                            alt={movie.title}
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = `https://picsum.photos/seed/${encodeURIComponent(movie.title || movie.id)}/300/450`;
                            }}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />

                          {/* Corner Badge */}
                          <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-zinc-950/80 backdrop-blur-md text-[9px] font-black text-cyan-300 border border-cyan-500/30 uppercase">
                            {(movie as any).badge || (movie.category.includes('rw') ? 'rw Rwandan' : 'MOVIE')}
                          </span>

                          {/* Gold Rating Metric */}
                          <span className="absolute top-2 right-2 px-2 py-0.5 rounded bg-amber-500 text-zinc-950 font-black text-[10px] flex items-center gap-0.5 shadow-md">
                            <Star className="w-3 h-3 fill-zinc-950" />
                            {movie.rating}
                          </span>

                          {/* Play In-Page Overlay */}
                          <div className="absolute inset-0 bg-zinc-950/75 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 gap-1.5 text-center">
                            <div className="w-11 h-11 rounded-full bg-amber-500 text-zinc-950 flex items-center justify-center shadow-xl transform group-hover:scale-110 transition-transform">
                              <Play className="w-6 h-6 fill-current ml-0.5" />
                            </div>
                            <span className="px-2.5 py-1 rounded-lg bg-amber-500 text-zinc-950 text-[10px] font-black uppercase tracking-wider shadow-md">
                              Play on LIONEL TV
                            </span>
                          </div>

                          {/* Watch Progress Line */}
                          {progress > 0 && (
                            <div className="absolute bottom-0 inset-x-0 h-1 bg-zinc-800">
                              <div
                                style={{ width: `${progress}%` }}
                                className="h-full bg-amber-400"
                              />
                            </div>
                          )}
                        </div>

                        {/* Info Text */}
                        <div className="p-3 space-y-1">
                          <h4 className="text-xs font-bold text-white line-clamp-2 group-hover:text-amber-300 transition-colors">
                            {movie.title}
                          </h4>
                          <p className="text-[10px] text-zinc-400 font-medium truncate">
                            {movie.category}
                          </p>
                        </div>
                      </button>

                      {/* Bookmark ♡ Save Button */}
                      <div className="px-3 pb-3 flex justify-end">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(movie.id);
                          }}
                          className="text-zinc-400 hover:text-red-400 p-1"
                          title="Save to favorites"
                        >
                          <Heart
                            className={`w-4 h-4 ${isFavorite(movie.id) ? 'fill-red-500 text-red-500' : ''}`}
                          />
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* LOAD MORE BUTTON FOR LARGE MOVIE CATALOG */}
            {filterMovies(movies).length > visibleMoviesLimit && (
              <div className="pt-6 pb-2 text-center space-y-2">
                <button
                  onClick={() => setVisibleMoviesLimit((prev) => prev + 60)}
                  className="px-8 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black text-xs uppercase tracking-wider shadow-xl transition-all transform hover:scale-105"
                >
                  Load More Agasobanuye Films (+60)
                </button>
                <p className="text-xs text-zinc-400 font-semibold">
                  Displaying {Math.min(visibleMoviesLimit, filterMovies(movies).length).toLocaleString()} of{' '}
                  {filterMovies(movies).length.toLocaleString()} films
                </p>
              </div>
            )}
            </>
          )}
          </div>
        )}

        {/* 5. NETFLIX-STYLE HORIZONTAL ROWS FOR LIVE TV & RADIO */}
        {activeTab !== 'movies' && (
          <div className="space-y-8">
            {/* ROW 1: Rwandan Local Broadcasters */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-wide">
                  <span className="text-base">🇷🇼</span>
                  Rwandan Local Broadcasters ({filterChannels(rwandanChannels).length})
                </h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {filterChannels(rwandanChannels).map((ch) => {
                  const isSelected = selectedChannel?.id === ch.id;

                  return (
                    <button
                      key={ch.id}
                      onClick={() => {
                        handleSelectChannel(ch);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className={`group relative p-3 rounded-2xl bg-zinc-900 border text-left flex flex-col justify-between transition-all duration-300 hover:scale-[1.03] ${
                        isSelected
                          ? 'border-cyan-400 ring-2 ring-cyan-500/30 shadow-xl bg-cyan-950/20'
                          : 'border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <div className="aspect-video w-full rounded-xl bg-zinc-950 p-2 mb-2 flex items-center justify-center border border-zinc-800 overflow-hidden">
                        <img
                          src={ch.logoUrl}
                          alt={ch.name}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                        />
                      </div>

                      <div>
                        <h4 className="text-xs font-extrabold text-white line-clamp-1 group-hover:text-cyan-300">
                          {ch.name}
                        </h4>
                        <p className="text-[10px] text-zinc-400 truncate mt-0.5">Live Broadcast 24/7</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ROW 2: StarTimes Premium Networks */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-wide">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  StarTimes Premium Networks ({filterChannels(starTimesChannels).length})
                </h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filterChannels(starTimesChannels).map((ch) => {
                  const isSelected = selectedChannel?.id === ch.id;

                  return (
                    <button
                      key={ch.id}
                      onClick={() => {
                        handleSelectChannel(ch);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className={`group p-3.5 rounded-2xl bg-zinc-900 border text-left flex items-center gap-3 transition-all hover:scale-[1.02] ${
                        isSelected
                          ? 'border-amber-400 ring-2 ring-amber-500/30 bg-amber-950/10'
                          : 'border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-xl bg-zinc-950 p-1.5 border border-zinc-800 shrink-0">
                        <img src={ch.logoUrl} alt="" className="w-full h-full object-contain" />
                      </div>
                      <div className="overflow-hidden">
                        <h4 className="text-xs font-black text-white truncate group-hover:text-amber-300">{ch.name}</h4>
                        <span className="text-[10px] font-bold text-amber-400">⭐ {ch.rating} Rating</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ROW 3: Radio Stations */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-wide">
                  <RadioIcon className="w-4 h-4 text-purple-400" />
                  Live Radio Stations ({filterChannels(radioChannels).length})
                </h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filterChannels(radioChannels).map((st) => {
                  const isSelected = selectedChannel?.id === st.id && activeTab === 'radio';

                  return (
                    <button
                      key={st.id}
                      onClick={() => {
                        setActiveTab('radio');
                        handleSelectChannel(st);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className={`group p-3.5 rounded-2xl bg-zinc-900 border text-left flex items-center gap-3 transition-all hover:scale-[1.02] ${
                        isSelected
                          ? 'border-purple-400 ring-2 ring-purple-500/30 bg-purple-950/20'
                          : 'border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-xl bg-zinc-950 p-1.5 border border-purple-500/30 shrink-0">
                        <img src={st.logoUrl} alt="" className="w-full h-full object-contain" />
                      </div>
                      <div className="overflow-hidden">
                        <h4 className="text-xs font-black text-white truncate group-hover:text-purple-300">{st.name}</h4>
                        <span className="text-[10px] text-purple-400 font-semibold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                          Live FM Radio
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* PROGRAM SCHEDULE MODAL */}
        {showScheduleModal && selectedChannel && (
          <div className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-zinc-950 p-1 border border-zinc-800">
                    <img src={selectedChannel.logoUrl} alt="" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">{selectedChannel.name}</h3>
                    <p className="text-xs text-cyan-400 font-semibold">Daily Broadcast Schedule</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowScheduleModal(false)}
                  className="p-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {getProgramSchedule(selectedChannel.id).map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between text-xs"
                  >
                    <span className="font-mono text-cyan-400 font-bold">{item.time}</span>
                    <span className="text-zinc-200 font-extrabold">{item.show}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setShowScheduleModal(false)}
                className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-black text-xs"
              >
                Close Schedule
              </button>
            </div>
          </div>
        )}
        {/* FLOATING MINI PICTURE-IN-PICTURE PLAYER WHEN SCROLLED DOWN */}
        {showMiniPlayer && !miniPlayerDismissed && selectedMovie && activeTab === 'movies' && (
          <div className="fixed bottom-5 right-5 z-50 w-72 sm:w-80 md:w-96 rounded-2xl bg-zinc-950/95 border-2 border-amber-500/80 shadow-2xl p-2.5 backdrop-blur-md animate-in fade-in slide-in-from-bottom-5 duration-300">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800 text-xs">
              <div className="flex items-center gap-1.5 truncate pr-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping shrink-0" />
                <span className="text-[11px] font-black text-amber-400 truncate">
                  NOW PLAYING: {selectedMovie.title}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => {
                    const el = document.getElementById('main-media-player');
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }}
                  title="Scroll up to main player"
                  className="p-1.5 rounded-lg bg-zinc-900 text-amber-400 hover:bg-zinc-800 transition-colors"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setMiniPlayerDismissed(true)}
                  title="Dismiss mini player"
                  className="p-1.5 rounded-lg bg-zinc-900 text-zinc-400 hover:text-white transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="relative aspect-video w-full bg-black rounded-xl overflow-hidden mb-2 shadow-inner">
              <video
                key={'mini-' + selectedMovie.id + (resolvedStream.primaryVideoStreamUrl || '')}
                src={
                  resolvedStream.episodes[resolvedStream.activeEpisodeIndex]?.videoStreamUrl ||
                  resolvedStream.primaryVideoStreamUrl ||
                  `/api/media/stream-proxy?url=${encodeURIComponent('https://media.agasobanuyenow.com/download/Dance%20Flick%20-%20Sankara.mp4')}`
                }
                controls
                autoPlay
                playsInline
                className="w-full h-full object-contain"
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-zinc-400 font-medium px-1">
              <span className="truncate">{selectedMovie.category || 'Agasobanuye Film'}</span>
              <button
                onClick={() => {
                  const el = document.getElementById('main-media-player');
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
                className="text-amber-400 font-bold hover:underline shrink-0"
              >
                Full Player ↑
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
