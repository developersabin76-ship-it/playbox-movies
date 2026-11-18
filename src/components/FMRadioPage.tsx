import React, { useState, useRef, useEffect } from 'react';
import {
  Radio,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Sparkles,
  Music,
  Share2,
  Heart,
  Search,
  RadioTower,
  Sliders,
  ChevronRight,
  Headphones
} from 'lucide-react';

export interface RadioStationItem {
  id: string;
  name: string;
  frequency: string;
  location: string;
  streamUrl: string;
  logo: string;
  genre: string;
  description: string;
  listenersCount: number;
}

export const RWANDAN_RADIO_STATIONS: RadioStationItem[] = [
  {
    id: 'radio-rwanda',
    name: 'Radio Rwanda (RBA)',
    frequency: '100.7 FM',
    location: 'Kigali, Rwanda',
    streamUrl: 'https://stream.zeno.fm/fvrwv44890hvv',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Rwanda_Broadcasting_Agency_logo.png/640px-Rwanda_Broadcasting_Agency_logo.png',
    genre: 'National News & Culture',
    description: 'The national public radio station of Rwanda, broadcasting in Kinyarwanda, English, French, and Swahili.',
    listenersCount: 48200
  },
  {
    id: 'kiss-fm-rwanda',
    name: 'Kiss FM 102.3 Kigali',
    frequency: '102.3 FM',
    location: 'Kigali, Rwanda',
    streamUrl: 'https://stream.zeno.fm/k2k5x23480hvv',
    logo: 'https://yt3.googleusercontent.com/ytc/AIdro_k6M6e7YqZ6rQ8z2F0f5_H5YQ8J0q5X9x5V8J2z=s900-c-k-c0x00ffffff-no-rj',
    genre: 'Urban Pop & Afrobeats',
    description: "Rwanda's leading hit music station with dynamic morning talk shows, top 40 music, and youth culture.",
    listenersCount: 39500
  },
  {
    id: 'flash-fm-rwanda',
    name: 'Flash FM 89.2',
    frequency: '89.2 FM',
    location: 'Kigali & Nationwide',
    streamUrl: 'https://stream.zeno.fm/0e21y3g480hvv',
    logo: 'https://flasgradio.rw/wp-content/uploads/2021/04/flash-logo.png',
    genre: 'News & Sports Special',
    description: 'Major private radio network with live Rwandan Premier League coverage, talk shows, and hot East African tracks.',
    listenersCount: 31000
  },
  {
    id: 'isango-star-radio',
    name: 'Isango Star 91.5 FM',
    frequency: '91.5 FM',
    location: 'Kigali, Rwanda',
    streamUrl: 'https://stream.zeno.fm/wz3yv8u480hvv',
    logo: 'https://isangostar.rw/wp-content/uploads/2021/03/isango-logo.png',
    genre: 'Entertainment & Local Music',
    description: 'Renowned for promoting Rwandan music, high-energy entertainment countdowns, and social debates.',
    listenersCount: 26400
  },
  {
    id: 'kt-radio-rwanda',
    name: 'KT Radio 96.7 FM',
    frequency: '96.7 FM',
    location: 'Kigali, Rwanda',
    streamUrl: 'https://stream.zeno.fm/s4kswb3480hvv',
    logo: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=200&h=200&q=80',
    genre: 'News, Business & Current Affairs',
    description: 'Kigali Today commercial radio bringing breaking news, financial markets analysis, and talk shows.',
    listenersCount: 19800
  },
  {
    id: 'royal-fm-rwanda',
    name: 'Royal FM 94.3',
    frequency: '94.3 FM',
    location: 'Kigali, Rwanda',
    streamUrl: 'https://stream.zeno.fm/4v3z850480hvv',
    logo: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?auto=format&fit=crop&w=200&h=200&q=80',
    genre: 'Music & Lifestyle',
    description: 'The pulse of Kigali with eclectic music blends, lifestyle segments, and weekend party mixes.',
    listenersCount: 17500
  },
  {
    id: 'contact-fm-rwanda',
    name: 'Contact FM 89.7',
    frequency: '89.7 FM',
    location: 'Kigali, Rwanda',
    streamUrl: 'https://stream.zeno.fm/0e21y3g480hvv',
    logo: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=200&h=200&q=80',
    genre: 'Talk & General Entertainment',
    description: 'One of the pioneer private radio stations in Rwanda bringing interactive community talk shows.',
    listenersCount: 15200
  }
];

interface FMRadioPageProps {
  onBackToHome?: () => void;
}

export const FMRadioPage: React.FC<FMRadioPageProps> = ({ onBackToHome }) => {
  const [stations] = useState<RadioStationItem[]>(RWANDAN_RADIO_STATIONS);
  const [activeStation, setActiveStation] = useState<RadioStationItem>(RWANDAN_RADIO_STATIONS[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [volume, setVolume] = useState<number>(0.85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
      if (isPlaying) {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn('[FM Radio Audio autoplay blocked]:', err);
          });
        }
      } else {
        audioRef.current.pause();
      }
    }
  }, [activeStation, isPlaying, volume, isMuted]);

  const togglePlay = () => {
    setIsPlaying((prev) => !prev);
  };

  const filteredStations = stations.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      s.name.toLowerCase().includes(q) ||
      s.frequency.toLowerCase().includes(q) ||
      s.genre.toLowerCase().includes(q)
    );
  });

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 space-y-8 select-none">
      
      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        src={activeStation?.streamUrl || ''}
        preload="none"
        onError={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsPlaying(false);
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-cyan-900/30 pb-5">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <RadioTower className="w-6 h-6 text-cyan-400 animate-pulse shadow-[0_0_10px_#00f0ff]" />
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wide">
              RADIO FM ZO MU RWANDA (LIVE FM STATIONS)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Umva Radio Rwanda, Kiss FM, Flash FM, Isango Star n'izindi 24/7 muri Audio ya HD
          </p>
        </div>

        {/* Search Radio Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Shakisha Radio cyangwa Frequency..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />
        </div>
      </div>

      {/* Main Grid: Active Tuner + Station Playlist */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* ==========================================
            LEFT COLUMN (Cols 1-7): ACTIVE RADIO TUNER DISPLAY
            ========================================== */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-b from-[#06101e] via-[#040a14] to-[#02050c] border border-cyan-500/30 p-6 sm:p-10 shadow-2xl flex flex-col items-center text-center justify-between min-h-[420px]">
            
            {/* Visualizer Background Glow */}
            <div className="absolute inset-0 bg-radial-at-c from-cyan-600/15 via-transparent to-transparent pointer-events-none" />

            {/* Top Frequency Pill */}
            <div className="flex items-center gap-3 z-10">
              <span className="px-3.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_12px_rgba(0,229,255,0.3)]">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping shadow-[0_0_8px_#00f0ff]" />
                LIVE ON AIR • {activeStation.frequency}
              </span>
            </div>

            {/* Station Big Logo & Animated Rings */}
            <div className="relative my-6 z-10">
              <div className={`absolute -inset-4 rounded-full bg-cyan-500/20 blur-xl transition-opacity ${isPlaying ? 'opacity-100 animate-pulse' : 'opacity-20'}`} />
              <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-3xl bg-slate-950 border-2 border-cyan-500/50 p-4 shadow-2xl flex items-center justify-center relative overflow-hidden group">
                <img
                  src={activeStation.logo}
                  alt={activeStation.name}
                  className="w-full h-full object-contain rounded-2xl"
                />
              </div>
            </div>

            {/* Title & Info */}
            <div className="space-y-1.5 z-10 max-w-lg">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide">
                {activeStation.name}
              </h2>
              <p className="text-xs text-cyan-400 font-bold font-mono">
                {activeStation.genre} • {activeStation.location}
              </p>
              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                {activeStation.description}
              </p>
            </div>

            {/* Custom Interactive Player Bar */}
            <div className="w-full bg-slate-950/80 border border-slate-800/90 rounded-2xl p-4 mt-6 z-10 flex flex-wrap items-center justify-between gap-4">
              
              {/* Play / Pause Toggle Button */}
              <button
                onClick={togglePlay}
                className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-400 to-blue-500 text-slate-950 flex items-center justify-center shadow-lg shadow-cyan-500/30 hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
              </button>

              {/* Equalizer Bars */}
              <div className="flex items-center gap-1.5 h-6">
                {[40, 75, 55, 90, 60, 85, 45, 70, 95, 65, 80, 50].map((h, i) => (
                  <div
                    key={i}
                    className={`w-1 rounded-full bg-gradient-to-t from-cyan-500 to-sky-300 transition-all duration-300 ${
                      isPlaying ? 'animate-pulse' : 'opacity-30'
                    }`}
                    style={{ height: isPlaying ? `${h}%` : '20%' }}
                  />
                ))}
              </div>

              {/* Volume Slider */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    setVolume(parseFloat(e.target.value));
                    setIsMuted(false);
                  }}
                  className="w-20 sm:w-24 accent-cyan-400 cursor-pointer"
                />
              </div>

            </div>

          </div>

        </div>

        {/* ==========================================
            RIGHT COLUMN (Cols 8-12): STATION LISTING DIRECTORY
            ========================================== */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-white tracking-wider uppercase flex items-center gap-2">
              <Headphones className="w-4 h-4 text-cyan-400" /> All Radio Stations ({filteredStations.length})
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">
              24/7 Digital Streams
            </span>
          </div>

          <div className="space-y-2.5 max-h-[580px] overflow-y-auto pr-1 no-scrollbar">
            {filteredStations.map((station) => {
              const isCurrent = station.id === activeStation.id;
              return (
                <div
                  key={station.id}
                  onClick={() => {
                    setActiveStation(station);
                    setIsPlaying(true);
                  }}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 group ${
                    isCurrent
                      ? 'bg-cyan-950/40 border-cyan-500/60 shadow-lg shadow-cyan-950/30'
                      : 'bg-slate-900/70 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="relative w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 p-1.5 flex items-center justify-center shrink-0">
                    <img
                      src={station.logo}
                      alt={station.name}
                      className="w-full h-full object-contain rounded-lg"
                    />
                    {isCurrent && isPlaying && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full animate-ping shadow-[0_0_8px_#00f0ff]" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className={`text-xs font-bold truncate ${isCurrent ? 'text-cyan-300 font-black' : 'text-white group-hover:text-cyan-400'}`}>
                        {station.name}
                      </h4>
                      <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-950 text-cyan-400 border border-slate-800 shrink-0">
                        {station.frequency}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">
                      {station.genre} • {station.location}
                    </p>
                  </div>

                  <div className="w-8 h-8 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-400 group-hover:text-cyan-400 group-hover:border-cyan-500/50 transition-colors shrink-0">
                    {isCurrent && isPlaying ? (
                      <Pause className="w-3.5 h-3.5 text-cyan-400 fill-current" />
                    ) : (
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
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
