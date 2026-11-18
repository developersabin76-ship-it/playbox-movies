export interface Channel {
  id: string;
  name: string;
  logo: string;
  category: "StarTimes Channels" | "Rwandan Local TV" | "Radio Stations 📻" | string;
  streamUrl: string;
  embedType: "hls" | "youtube_live" | "iframe" | "audio";
  youtubeLiveId?: string;
  rating: string;
  currentProgram: { title: string; timeSlot: string; progress: number };
  mediaType?: 'video' | 'audio';
  country?: string;
  isVerified?: boolean;
  embeddingAllowed?: boolean;
  status?: string;
}

export interface ScrapedMovie {
  id: string;
  title: string;
  posterImage: string;
  category: string;
  embedUrl: string;
  rating: string;
  releaseYear?: string;
  language?: string;
}

export const INITIAL_CHANNELS: Channel[] = [
  // Rwandan Local Broadcasters
  {
    id: "rba-rwanda-tv",
    name: "RBA / Rwanda Television (RTV)",
    logo: "https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=300&q=80",
    category: "Rwandan Local TV",
    streamUrl: "https://5c46fa289c89f.streamlock.net/rtv/rtv/playlist.m3u8",
    embedType: "hls",
    youtubeLiveId: "wH9m_a48zls",
    rating: "9.6",
    currentProgram: {
      title: "Amakuru Mashya (National Evening News)",
      timeSlot: "19:00 - 20:30 CAT",
      progress: 65
    },
    mediaType: "video",
    country: "Rwanda",
    isVerified: true,
    embeddingAllowed: true,
    status: "online"
  },
  {
    id: "kc2-rwanda",
    name: "KC2 Youth & Sports",
    logo: "https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?auto=format&fit=crop&w=300&q=80",
    category: "Rwandan Local TV",
    streamUrl: "https://5c46fa289c89f.streamlock.net/kc2/kc2/playlist.m3u8",
    embedType: "hls",
    rating: "9.2",
    currentProgram: {
      title: "Kigali Youth Beats & Sports League Live",
      timeSlot: "18:00 - 21:00 CAT",
      progress: 40
    },
    mediaType: "video",
    country: "Rwanda",
    isVerified: true,
    embeddingAllowed: true,
    status: "online"
  },
  {
    id: "isibo-tv-rwanda",
    name: "ISIBO TV",
    logo: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=300&q=80",
    category: "Rwandan Local TV",
    streamUrl: "https://5c46fa289c89f.streamlock.net/pub2live/myStream/playlist.m3u8",
    embedType: "hls",
    rating: "9.5",
    currentProgram: {
      title: "Take Over Show & Urban Afrobeats",
      timeSlot: "20:00 - 22:00 CAT",
      progress: 80
    },
    mediaType: "video",
    country: "Rwanda",
    isVerified: true,
    embeddingAllowed: true,
    status: "online"
  },
  {
    id: "btn-tv-rwanda",
    name: "BTN TV Rwanda",
    logo: "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=300&q=80",
    category: "Rwandan Local TV",
    streamUrl: "https://5c46fa289c89f.streamlock.net/pub2live/myStream/playlist.m3u8",
    embedType: "hls",
    rating: "9.4",
    currentProgram: {
      title: "BTN Prime News & Live Debate",
      timeSlot: "19:30 - 21:00 CAT",
      progress: 50
    },
    mediaType: "video",
    country: "Rwanda",
    isVerified: true,
    embeddingAllowed: true,
    status: "online"
  },
  {
    id: "tv10-rwanda",
    name: "TV10 Rwanda",
    logo: "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?auto=format&fit=crop&w=300&q=80",
    category: "Rwandan Local TV",
    streamUrl: "https://5c46fa289c89f.streamlock.net/pub2live/myStream/playlist.m3u8",
    embedType: "hls",
    rating: "9.2",
    currentProgram: {
      title: "TV10 Sports Extra Live",
      timeSlot: "21:00 - 22:30 CAT",
      progress: 30
    },
    mediaType: "video",
    country: "Rwanda",
    isVerified: true,
    embeddingAllowed: true,
    status: "online"
  },
  {
    id: "tv1-rwanda",
    name: "TV1 Rwanda",
    logo: "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=300&q=80",
    category: "Rwandan Local TV",
    streamUrl: "https://5c46fa289c89f.streamlock.net/pub2live/myStream/playlist.m3u8",
    embedType: "hls",
    rating: "9.3",
    currentProgram: {
      title: "TV1 Bulletin & Entertainment Special",
      timeSlot: "18:30 - 20:00 CAT",
      progress: 75
    },
    mediaType: "video",
    country: "Rwanda",
    isVerified: true,
    embeddingAllowed: true,
    status: "online"
  },
  {
    id: "flash-tv-rwanda",
    name: "Flash TV Rwanda",
    logo: "https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=300&q=80",
    category: "Rwandan Local TV",
    streamUrl: "https://5c46fa289c89f.streamlock.net/pub2live/myStream/playlist.m3u8",
    embedType: "hls",
    rating: "9.1",
    currentProgram: {
      title: "Flash Cultural Digest & World News",
      timeSlot: "19:00 - 20:30 CAT",
      progress: 45
    },
    mediaType: "video",
    country: "Rwanda",
    isVerified: true,
    embeddingAllowed: true,
    status: "online"
  },
  {
    id: "isango-star-tv",
    name: "Isango Star TV",
    logo: "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=300&q=80",
    category: "Rwandan Local TV",
    streamUrl: "https://5c46fa289c89f.streamlock.net/pub2live/myStream/playlist.m3u8",
    embedType: "hls",
    rating: "9.0",
    currentProgram: {
      title: "Isango Scene Live Music Countdown",
      timeSlot: "20:00 - 22:00 CAT",
      progress: 55
    },
    mediaType: "video",
    country: "Rwanda",
    isVerified: true,
    embeddingAllowed: true,
    status: "online"
  },

  // StarTimes Premium Channels
  {
    id: "startimes-sports-1",
    name: "StarTimes World Football HD",
    logo: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=300&q=80",
    category: "StarTimes Channels",
    streamUrl: "https://5c46fa289c89f.streamlock.net/pub2live/myStream/playlist.m3u8",
    embedType: "hls",
    rating: "9.7",
    currentProgram: {
      title: "UEFA & CAF Champions League Match Day",
      timeSlot: "20:45 - 23:00 CAT",
      progress: 60
    },
    mediaType: "video",
    country: "International",
    isVerified: true,
    embeddingAllowed: true,
    status: "online"
  },
  {
    id: "startimes-novela-e",
    name: "StarTimes Novela E",
    logo: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=300&q=80",
    category: "StarTimes Channels",
    streamUrl: "https://5c46fa289c89f.streamlock.net/pub2live/myStream/playlist.m3u8",
    embedType: "hls",
    rating: "9.5",
    currentProgram: {
      title: "Passions & Secrets - Episode 42",
      timeSlot: "19:00 - 20:00 CAT",
      progress: 90
    },
    mediaType: "video",
    country: "International",
    isVerified: true,
    embeddingAllowed: true,
    status: "online"
  },
  {
    id: "startimes-kungfu",
    name: "StarTimes KungFu Channel",
    logo: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=300&q=80",
    category: "StarTimes Channels",
    streamUrl: "https://5c46fa289c89f.streamlock.net/pub2live/myStream/playlist.m3u8",
    embedType: "hls",
    rating: "9.3",
    currentProgram: {
      title: "Shaolin Masters Martial Arts Classic",
      timeSlot: "20:00 - 21:45 CAT",
      progress: 25
    },
    mediaType: "video",
    country: "International",
    isVerified: true,
    embeddingAllowed: true,
    status: "online"
  },
  {
    id: "startimes-bollywood",
    name: "StarTimes Bollywood HD",
    logo: "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?auto=format&fit=crop&w=300&q=80",
    category: "StarTimes Channels",
    streamUrl: "https://5c46fa289c89f.streamlock.net/pub2live/myStream/playlist.m3u8",
    embedType: "hls",
    rating: "9.4",
    currentProgram: {
      title: "Bollywood Gold Prime Feature",
      timeSlot: "19:30 - 22:30 CAT",
      progress: 50
    },
    mediaType: "video",
    country: "International",
    isVerified: true,
    embeddingAllowed: true,
    status: "online"
  },
  {
    id: "startimes-sino-drama",
    name: "StarTimes Sino Drama",
    logo: "https://images.unsplash.com/photo-1518676599626-5cd8c2d3f853?auto=format&fit=crop&w=300&q=80",
    category: "StarTimes Channels",
    streamUrl: "https://5c46fa289c89f.streamlock.net/pub2live/myStream/playlist.m3u8",
    embedType: "hls",
    rating: "9.1",
    currentProgram: {
      title: "Dynasty Legends Live Broadcast",
      timeSlot: "18:00 - 19:30 CAT",
      progress: 85
    },
    mediaType: "video",
    country: "International",
    isVerified: true,
    embeddingAllowed: true,
    status: "online"
  },

  // Live Radio Stations 📻
  {
    id: "radio-flash-fm",
    name: "Flash FM 89.2 Kigali",
    logo: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=300&q=80",
    category: "Radio Stations 📻",
    streamUrl: "https://stream.zeno.fm/f3wvbb3q218uv",
    embedType: "audio",
    rating: "9.8",
    currentProgram: {
      title: "Flash Drive Live & Great Hits",
      timeSlot: "16:00 - 20:00 CAT",
      progress: 70
    },
    mediaType: "audio",
    country: "Rwanda",
    isVerified: true,
    embeddingAllowed: true,
    status: "online"
  },
  {
    id: "radio-kiss-fm",
    name: "Kiss FM 102.3 Kigali",
    logo: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=300&q=80",
    category: "Radio Stations 📻",
    streamUrl: "https://stream.zeno.fm/a9p4z2k9s38uv",
    embedType: "audio",
    rating: "9.7",
    currentProgram: {
      title: "The Kiss Evening Jam & Top 40",
      timeSlot: "17:00 - 21:00 CAT",
      progress: 60
    },
    mediaType: "audio",
    country: "Rwanda",
    isVerified: true,
    embeddingAllowed: true,
    status: "online"
  },
  {
    id: "radio-rwanda-national",
    name: "Radio Rwanda (RBA National)",
    logo: "https://images.unsplash.com/photo-1487180144351-b8472da7d491?auto=format&fit=crop&w=300&q=80",
    category: "Radio Stations 📻",
    streamUrl: "https://5c46fa289c89f.streamlock.net/radiorwanda/radiorwanda/playlist.m3u8",
    embedType: "audio",
    rating: "9.9",
    currentProgram: {
      title: "Amakuru Y'Ikinyarwanda Na Politiki",
      timeSlot: "19:00 - 20:00 CAT",
      progress: 80
    },
    mediaType: "audio",
    country: "Rwanda",
    isVerified: true,
    embeddingAllowed: true,
    status: "online"
  },
  {
    id: "radio-choice-fm",
    name: "Choice FM 102.5",
    logo: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=300&q=80",
    category: "Radio Stations 📻",
    streamUrl: "https://stream.zeno.fm/03wvbb3q218uv",
    embedType: "audio",
    rating: "9.4",
    currentProgram: {
      title: "Choice Beats & Smooth Jazz",
      timeSlot: "20:00 - 23:00 CAT",
      progress: 35
    },
    mediaType: "audio",
    country: "Rwanda",
    isVerified: true,
    embeddingAllowed: true,
    status: "online"
  },
  {
    id: "radio-isango-star",
    name: "Isango Star Radio 91.5",
    logo: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=300&q=80",
    category: "Radio Stations 📻",
    streamUrl: "https://stream.zeno.fm/13wvbb3q218uv",
    embedType: "audio",
    rating: "9.3",
    currentProgram: {
      title: "Isango News Nightly Bulletin",
      timeSlot: "19:00 - 20:30 CAT",
      progress: 50
    },
    mediaType: "audio",
    country: "Rwanda",
    isVerified: true,
    embeddingAllowed: true,
    status: "online"
  }
];

export const FALLBACK_AGASOBANUYE_MOVIES: ScrapedMovie[] = [
  {
    id: "m-osh-1",
    title: "Kigali Underground Action - Agasobanuye HD",
    posterImage: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80",
    category: "rw Rwandan Agasobanuye",
    embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1",
    rating: "9.8",
    releaseYear: "2026",
    language: "Kinyarwanda"
  },
  {
    id: "m-osh-2",
    title: "Shadows of Virunga - Rocky Kimomo Version",
    posterImage: "https://images.unsplash.com/photo-1518676599626-5cd8c2d3f853?auto=format&fit=crop&w=600&q=80",
    category: "rw Rwandan Agasobanuye",
    embedUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
    rating: "9.6",
    releaseYear: "2025",
    language: "Kinyarwanda"
  },
  {
    id: "m-osh-3",
    title: "The Commando 4 - Junior Giti Dubbed",
    posterImage: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80",
    category: "Agasobanuye Action",
    embedUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
    rating: "9.5",
    releaseYear: "2026",
    language: "Kinyarwanda"
  },
  {
    id: "m-osh-4",
    title: "Cyber Strike 2026 - Yanga Translator",
    posterImage: "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?auto=format&fit=crop&w=600&q=80",
    category: "Agasobanuye Sci-Fi",
    embedUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    rating: "9.4",
    releaseYear: "2026",
    language: "Kinyarwanda"
  },
  {
    id: "m-osh-5",
    title: "African Gold Heist - Savimbi Voiceover",
    posterImage: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=600&q=80",
    category: "Agasobanuye Thriller",
    embedUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    rating: "9.3",
    releaseYear: "2025",
    language: "Kinyarwanda"
  },
  {
    id: "m-osh-6",
    title: "Martial Arts Legend - Agasobanuye Full Movie",
    posterImage: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80",
    category: "Agasobanuye KungFu",
    embedUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    rating: "9.7",
    releaseYear: "2026",
    language: "Kinyarwanda"
  }
];
