export type ContentType = 'movie' | 'series' | 'episode' | 'channel' | 'sports' | 'other';

export type VideoQuality = 'AUTO' | 'LOW' | 'MID' | 'HD';

export type AccessType = 'FREE' | 'PREMIUM';
export type ContentAccess = AccessType;

export interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  likes?: number;
  createdAt: string;
  [key: string]: any;
}

export interface WatchmodeSource {
  source_id: number;
  name: string;
  type: string;
  region: string;
  ios_url?: string;
  android_url?: string;
  web_url?: string;
  format?: string;
  price?: number | null;
  seasons?: number;
  episodes?: number;
  [key: string]: any;
}

export interface WatchmodeEpisode {
  id: number;
  name: string;
  season_number: number;
  episode_number: number;
  overview?: string;
  air_date?: string;
  thumbnail_url?: string;
  streamUrl?: string;
  videoUrl?: string;
  [key: string]: any;
}

export interface WatchmodeSeason {
  id: number;
  season_number: number;
  name: string;
  overview?: string;
  poster_url?: string;
  air_date?: string;
  episode_count?: number;
  episodes?: WatchmodeEpisode[];
  [key: string]: any;
}

export interface WatchmodeTitleDetails {
  id: number;
  title: string;
  original_title?: string;
  plot_overview?: string;
  type?: string;
  runtime_minutes?: number;
  year?: number;
  end_year?: number;
  release_date?: string;
  genre_names?: string[];
  user_rating?: number;
  critic_score?: number;
  us_rating?: string;
  original_language?: string;
  similar_titles?: number[];
  sources?: WatchmodeSource[];
  trailer?: string;
  trailer_thumbnail?: string;
  poster?: string;
  backdrop?: string;
  cast_crew?: any[];
  seasons?: any[];
  [key: string]: any;
}

export interface WatchmodeSearchResultItem {
  id: number;
  name: string;
  type: string;
  year?: number;
  result_type?: string;
  tmdb_id?: number;
  tmdb_type?: string;
  image_url?: string;
  [key: string]: any;
}

export interface WatchmodeSearchResponse {
  results: WatchmodeSearchResultItem[];
  configured?: boolean;
  error?: string;
  [key: string]: any;
}

export interface FilterOptions {
  category?: string;
  genre?: string;
  year?: number;
  access?: AccessType;
  query?: string;
  [key: string]: any;
}

export interface MovieMetadata {
  id?: string;
  title: string;
  director?: string;
  year?: number;
  duration?: string;
  genres?: string[];
  access?: AccessType;
  posterImage?: string;
  category?: string;
  embedUrl?: string;
  rating?: number;
  [key: string]: any;
}

export type ContentStatus = 'DRAFT' | 'PUBLISHED' | 'UNPUBLISHED';

export type StreamType = 'hls' | 'mp4' | 'video' | 'embed' | 'youtube';

export type StreamStatus = 'ONLINE' | 'OFFLINE' | 'UNKNOWN' | 'online' | 'offline' | 'unverified';

// ==========================================
// 1. MOVIES SYSTEM
// ==========================================
export interface MovieItem {
  id: string;
  slug: string;
  title: string;
  originalTitle?: string;
  description: string;
  synopsis?: string;
  posterUrl: string;
  backdropUrl: string;
  trailerUrl?: string;
  
  // Multi-quality video streaming URLs
  videoUrl: string;       // Default / Primary stream URL
  lowVideoUrl?: string;   // LOW quality stream (e.g. 480p)
  midVideoUrl?: string;   // MID quality stream (e.g. 720p)
  hdVideoUrl?: string;    // HD quality stream (e.g. 1080p)
  
  downloadUrl?: string;
  downloadEnabled: boolean;
  
  year: number;
  duration: string;       // e.g. "2h 15m" or "01:45:00"
  genres: string[];
  language: string;
  country: string;
  director: string;
  cast: string[];
  rating: number;         // e.g. 9.4
  ageRating: string;      // e.g. "16+", "PG-13", "18+"
  
  quality: string;        // e.g. "HD", "4K", "1080p"
  subtitles?: { lang: string; url: string }[];
  audioLanguage?: string;
  
  isFeatured: boolean;
  isPopular: boolean;
  status: ContentStatus;
  access: AccessType;     // FREE or PREMIUM
  
  viewsCount?: number;
  likesCount?: number;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// 2. SERIES / SEASONS / EPISODES SYSTEM
// ==========================================
export interface EpisodeItem {
  id: string;
  seriesId: string;
  seasonId: string;
  seasonNumber: number;
  episodeNumber: number;
  title: string;
  description: string;
  thumbnailUrl: string;
  duration: string;       // e.g. "45 min"
  releaseDate?: string;
  
  // Multi-quality video streams
  videoUrl: string;       // Primary video URL
  lowVideoUrl?: string;   // LOW URL (480p)
  midVideoUrl?: string;   // MID URL (720p)
  hdVideoUrl?: string;    // HD URL (1080p)
  
  subtitleUrl?: string;
  downloadUrl?: string;
  downloadEnabled?: boolean;
  
  access: AccessType;     // FREE or PREMIUM
  status: ContentStatus;  // DRAFT or PUBLISHED
  audioLanguage?: string;
  
  viewsCount?: number;
  sortOrder?: number;
  createdAt: string;
  updatedAt: string;
}

export interface SeasonItem {
  id: string;
  seriesId: string;
  seasonNumber: number;
  title: string;          // e.g. "Season 1"
  description?: string;
  posterUrl?: string;
  releaseDate?: string;
  status: ContentStatus;
  episodesCount?: number;
  episodes?: EpisodeItem[];
  createdAt: string;
  updatedAt: string;
}

export interface SeriesItem {
  id: string;
  slug: string;
  title: string;
  originalTitle?: string;
  description: string;
  posterUrl: string;
  backdropUrl: string;
  trailerUrl?: string;
  year: number;
  genres: string[];
  language: string;
  country: string;
  director?: string;
  cast: string[];
  rating: number;
  ageRating?: string;
  
  access: AccessType;     // FREE or PREMIUM
  status: ContentStatus;  // DRAFT or PUBLISHED
  isFeatured?: boolean;
  isPopular?: boolean;
  
  seasonsCount?: number;
  totalEpisodesCount?: number;
  seasons?: SeasonItem[];
  
  viewsCount?: number;
  createdAt: string;
  updatedAt: string;
}

// Unified Media Item interface for backwards compatibility and generic cards
export interface MediaItem extends Partial<MovieItem>, Partial<SeriesItem> {
  id: string;
  title: string;
  type: 'movie' | 'series' | 'channel' | 'trailer';
  posterUrl: string;
  backdropUrl?: string;
  logoUrl?: string;
  videoUrl: string;
  streamUrl?: string;
  rating?: number;
  releaseYear?: number;
  duration?: string;
  genres?: string[];
  description?: string;
  access?: AccessType;
  status?: ContentStatus;
  isFeatured?: boolean;
  isPopular?: boolean;
  isRwandan?: boolean;
  isAfrican?: boolean;
  isAgasobanuye?: boolean;
  umusobanuzi?: string;
  director?: string;
  cast?: any[];
  seasons?: SeasonItem[];
  episodes?: any[];
  [key: string]: any;
}

// ==========================================
// 3. LIVE TV & TV CHANNELS SYSTEM
// ==========================================
export interface TVChannelItem {
  id: string;
  name: string;
  logo: string;
  logoUrl?: string;
  country: string;
  countryCode: string;
  category: string;       // e.g. "News", "Sports", "Entertainment", "Music", "Kids", "Rwandan TV"
  
  streamUrl: string;
  streamType: StreamType;
  backupStreamUrl?: string;
  websiteUrl?: string;
  iframeUrl?: string;
  mediaType?: string;
  number?: number;
  isVerified?: boolean;
  embeddingAllowed?: boolean;
  source?: string;
  
  description?: string;
  status: StreamStatus;   // ONLINE, OFFLINE, UNKNOWN
  isLive: boolean;
  isFeatured: boolean;
  isActive: boolean;
  sortOrder: number;
  
  access: AccessType;     // FREE or PREMIUM
  viewerCount?: number;
  currentProgram?: string;
  currentShow?: { title: string; time?: string };
  nextProgram?: string;
  
  schedule?: {
    time: string;
    show: string;
    description?: string;
  }[];
  
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

// Alias for TVChannel
export type TvChannel = TVChannelItem;

// ==========================================
// 4. SUBSCRIPTION PLANS & BILLING
// ==========================================
export interface SubscriptionPlan {
  id: string;
  name: string;           // e.g. "FREE", "BASIC", "CLASSIC", "PREMIUM"
  tagline?: string;
  price: number;          // e.g. 0, 500, 1000, 1500
  currency: string;       // e.g. "RWF" or "USD"
  interval: 'day' | 'week' | 'month' | 'year';
  durationDays: number;   // e.g. 30 for 1 month
  
  features: string[];
  maxQuality: VideoQuality; // LOW, MID, HD
  downloadPermission: boolean;
  movieAccess: boolean;
  seriesAccess: boolean;
  liveTvAccess: boolean;
  deviceLimit: number;    // e.g. 1, 2, 4
  
  isPopular?: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type PaymentMethod = 'MTN_MOMO' | 'AIRTEL_MONEY' | 'CARD' | 'STRIPE' | 'PAYPAL' | 'FREE_TRIAL';

export type TransactionStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'REFUNDED';

export interface PaymentTransaction {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  
  planId: string;
  planName: string;
  amount: number;
  currency: string;
  
  paymentMethod: PaymentMethod;
  paymentReference: string;
  transactionRef?: string;
  
  status: TransactionStatus;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserSubscription {
  id: string;
  userId: string;
  planId: string;
  planName: string;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'TRIAL';
  startDate: string;
  expiryDate: string;
  paymentMethod: PaymentMethod;
  autoRenew?: boolean;
}

// ==========================================
// 5. USER ACCOUNTS, WATCH HISTORY & DOWNLOADS
// ==========================================
export interface WatchHistoryEntry {
  contentId: string;
  type: 'movie' | 'series' | 'episode';
  title: string;
  posterUrl: string;
  seriesId?: string;
  seriesTitle?: string;
  seasonNumber?: number;
  episodeNumber?: number;
  episodeId?: string;
  currentTime: number;    // in seconds
  duration: number;       // in seconds
  progressPercent: number; // 0 - 100
  lastWatched: string;
  videoUrl: string;
}

export interface DownloadedItem {
  id: string;
  contentId: string;
  type: 'movie' | 'episode';
  title: string;
  posterUrl: string;
  fileSizeMb?: number;
  downloadUrl: string;
  quality: VideoQuality;
  downloadedAt: string;
  expiryDate?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  avatarUrl?: string;
  role: 'USER' | 'ADMIN';
  
  subscription?: UserSubscription;
  
  watchlist: string[];       // Content IDs
  favorites: string[];       // Content IDs
  watchHistory: WatchHistoryEntry[];
  downloads: DownloadedItem[];
  
  preferences?: {
    defaultQuality?: VideoQuality;
    autoPlayNext?: boolean;
    audioLanguage?: string;
    subtitlesEnabled?: boolean;
  };
  
  createdAt: string;
  lastLoginAt?: string;
}

// ==========================================
// 6. NOTIFICATIONS & CATEGORIES
// ==========================================
export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'movie' | 'series' | 'episode' | 'channel' | 'subscription' | 'announcement';
  contentId?: string;
  contentType?: ContentType;
  isRead: boolean;
  createdAt: string;
}

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  itemCount?: number;
  isActive: boolean;
}

export interface DeveloperProfile {
  name: string;
  role: string;
  tagline: string;
  bio: string;
  email: string;
  whatsapp: string;          // WhatsApp phone number or link (e.g. "+250 788 123 456")
  instagram: string;         // Instagram profile link or handle
  facebook: string;          // Facebook profile/page link
  channelName: string;       // Developer Channel Name (e.g. "Lionel Sabin Media Tech")
  channelUrl?: string;       // Developer Channel link
  portfolioUrl: string;      // Portfolio website URL
  avatarUrl: string;         // Profile photo URL
  bannerUrl?: string;        // Cover photo URL
  skills: string[];          // List of competencies
  location: string;          // City, Country (e.g. "Kigali, Rwanda")
  github?: string;           // GitHub profile
  linkedIn?: string;         // LinkedIn profile
  statusBadge?: string;      // e.g. "Verified Platform Architect"
  experienceYears?: number;
  availableForHire?: boolean;
}

export interface PlatformSettings {
  siteName: string;
  siteTagline: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  defaultCurrency: string;
  
  // Payment Gateways configuration
  mtnMomoMerchantNumber?: string;
  airtelMoneyMerchantNumber?: string;
  stripePublishableKey?: string;
  
  // Streaming & Feature toggles
  downloadsEnabledGlobally: boolean;
  allowGuestPreview: boolean;
  autoPlayNextEpisode: boolean;
  streamProxyEnabled: boolean;
}

// For content storage & generic adapters
export interface ContentItem {
  id: string;
  title: string;
  type: ContentType;
  country?: string;
  countryCode?: string;
  category?: string;
  language?: string;
  logo?: string;
  poster?: string;
  description?: string;
  streamUrl?: string;
  videoUrl?: string;
  streamType?: StreamType;
  year?: number;
  rating?: number;
  isLive?: boolean;
  isEnabled?: boolean;
  isVerified?: boolean;
  access?: AccessType;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}
