import {
  ContentItem,
  TvChannel,
  MediaItem,
  MovieItem,
  SeriesItem,
  SeasonItem,
  EpisodeItem,
  TVChannelItem,
  SubscriptionPlan,
  CategoryItem,
  PlatformSettings,
  WatchHistoryEntry,
  DownloadedItem,
  NotificationItem,
  UserProfile,
  DeveloperProfile
} from '../types';
import {
  SEED_MOVIES,
  SEED_SERIES,
  SEED_TV_CHANNELS,
  SEED_SUBSCRIPTION_PLANS,
  SEED_CATEGORIES,
  DEFAULT_PLATFORM_SETTINGS,
  DEFAULT_USER_PROFILE,
  DEFAULT_DEVELOPER_PROFILE
} from '../data/mockData';

// Storage keys
export const STORAGE_KEYS = {
  MOVIES: 'lionel_stream_movies_v3',
  SERIES: 'lionel_stream_series_v3',
  CHANNELS: 'lionel_stream_channels_v3',
  PLANS: 'lionel_stream_plans_v3',
  CATEGORIES: 'lionel_stream_categories_v3',
  SETTINGS: 'lionel_stream_settings_v3',
  WATCH_HISTORY: 'lionel_stream_watch_history_v3',
  DOWNLOADS: 'lionel_stream_downloads_v3',
  NOTIFICATIONS: 'lionel_stream_notifications_v3',
  USER_PROFILE: 'lionel_stream_user_profile_v3',
  DEVELOPER_PROFILE: 'lionel_stream_developer_profile_v3',
  CONTENT: 'lionel_tv_content_v2',
  DELETED_CHANNELS: 'lionel_tv_deleted_channels_v1'
};

// ==========================================
// 1. MOVIES REPOSITORY
// ==========================================
export function getStoredMovies(): MovieItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MOVIES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Error reading movies:', e);
  }
  // Initialize with seed movies
  saveStoredMovies(SEED_MOVIES);
  return SEED_MOVIES;
}

export function saveStoredMovies(movies: MovieItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.MOVIES, JSON.stringify(movies));
  } catch (e) {
    console.error('Error saving movies:', e);
  }
}

export function saveMovie(movie: MovieItem): MovieItem[] {
  const list = getStoredMovies();
  const index = list.findIndex((m) => m.id === movie.id);
  let updated: MovieItem[];
  if (index >= 0) {
    updated = [...list];
    updated[index] = { ...movie, updatedAt: new Date().toISOString() };
  } else {
    updated = [{ ...movie, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, ...list];
  }
  saveStoredMovies(updated);

  // Asynchronously mirror to server relational database
  try {
    const token = localStorage.getItem('lionel_auth_token');
    fetch('/api/movies', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        id: movie.id,
        title: movie.title,
        slug: movie.slug,
        description: movie.description,
        poster_url: movie.posterUrl,
        backdrop_url: movie.backdropUrl,
        video_sources: [
          {
            video_url: movie.videoUrl,
            quality: movie.quality || '1080p',
            is_primary: 1
          }
        ],
        year: movie.year,
        duration: movie.duration,
        director: movie.director,
        rating: movie.rating,
        quality: movie.quality,
        access: movie.access,
        genres: movie.genres,
        featured: movie.isFeatured,
        popular: movie.isPopular,
        download_enabled: movie.downloadEnabled
      })
    }).catch((err) => console.warn('Database mirror notice:', err));
  } catch (err) {
    // Non-blocking
  }

  return updated;
}

export function deleteMovie(id: string): MovieItem[] {
  const list = getStoredMovies();
  const updated = list.filter((m) => m.id !== id);
  saveStoredMovies(updated);
  return updated;
}

// ==========================================
// 2. SERIES / SEASONS / EPISODES REPOSITORY
// ==========================================
export function getStoredSeries(): SeriesItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SERIES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Error reading series:', e);
  }
  saveStoredSeries(SEED_SERIES);
  return SEED_SERIES;
}

export function saveStoredSeries(series: SeriesItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SERIES, JSON.stringify(series));
  } catch (e) {
    console.error('Error saving series:', e);
  }
}

export function saveSeries(item: SeriesItem): SeriesItem[] {
  const list = getStoredSeries();
  const index = list.findIndex((s) => s.id === item.id);
  let updated: SeriesItem[];
  if (index >= 0) {
    updated = [...list];
    updated[index] = { ...item, updatedAt: new Date().toISOString() };
  } else {
    updated = [{ ...item, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, ...list];
  }
  saveStoredSeries(updated);
  return updated;
}

export function deleteSeries(id: string): SeriesItem[] {
  const list = getStoredSeries();
  const updated = list.filter((s) => s.id !== id);
  saveStoredSeries(updated);
  return updated;
}

/**
 * Adds or updates a Season inside a Series.
 */
export function saveSeasonToSeries(seriesId: string, season: SeasonItem): SeriesItem[] {
  const list = getStoredSeries();
  const updated = list.map((series) => {
    if (series.id !== seriesId) return series;
    const seasons = series.seasons ? [...series.seasons] : [];
    const sIndex = seasons.findIndex((s) => s.id === season.id);
    if (sIndex >= 0) {
      seasons[sIndex] = { ...season, updatedAt: new Date().toISOString() };
    } else {
      seasons.push({ ...season, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    return {
      ...series,
      seasons,
      seasonsCount: seasons.length,
      updatedAt: new Date().toISOString()
    };
  });
  saveStoredSeries(updated);
  return updated;
}

/**
 * Deletes a season and its episodes from a series.
 */
export function deleteSeasonFromSeries(seriesId: string, seasonId: string): SeriesItem[] {
  const list = getStoredSeries();
  const updated = list.map((series) => {
    if (series.id !== seriesId || !series.seasons) return series;
    const seasons = series.seasons.filter((s) => s.id !== seasonId);
    return {
      ...series,
      seasons,
      seasonsCount: seasons.length,
      updatedAt: new Date().toISOString()
    };
  });
  saveStoredSeries(updated);
  return updated;
}

/**
 * Adds or updates an Episode inside a Season of a Series.
 */
export function saveEpisodeToSeason(seriesId: string, seasonId: string, episode: EpisodeItem): SeriesItem[] {
  const list = getStoredSeries();
  const updated = list.map((series) => {
    if (series.id !== seriesId || !series.seasons) return series;
    const seasons = series.seasons.map((season) => {
      if (season.id !== seasonId) return season;
      const episodes = season.episodes ? [...season.episodes] : [];
      const epIndex = episodes.findIndex((e) => e.id === episode.id);
      if (epIndex >= 0) {
        episodes[epIndex] = { ...episode, updatedAt: new Date().toISOString() };
      } else {
        episodes.push({ ...episode, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
      }
      return {
        ...season,
        episodes,
        episodesCount: episodes.length,
        updatedAt: new Date().toISOString()
      };
    });
    const totalEpisodes = seasons.reduce((acc, s) => acc + (s.episodes?.length || 0), 0);
    return {
      ...series,
      seasons,
      totalEpisodesCount: totalEpisodes,
      updatedAt: new Date().toISOString()
    };
  });
  saveStoredSeries(updated);
  return updated;
}

/**
 * Deletes an episode from a season.
 */
export function deleteEpisodeFromSeason(seriesId: string, seasonId: string, episodeId: string): SeriesItem[] {
  const list = getStoredSeries();
  const updated = list.map((series) => {
    if (series.id !== seriesId || !series.seasons) return series;
    const seasons = series.seasons.map((season) => {
      if (season.id !== seasonId || !season.episodes) return season;
      const episodes = season.episodes.filter((e) => e.id !== episodeId);
      return {
        ...season,
        episodes,
        episodesCount: episodes.length,
        updatedAt: new Date().toISOString()
      };
    });
    const totalEpisodes = seasons.reduce((acc, s) => acc + (s.episodes?.length || 0), 0);
    return {
      ...series,
      seasons,
      totalEpisodesCount: totalEpisodes,
      updatedAt: new Date().toISOString()
    };
  });
  saveStoredSeries(updated);
  return updated;
}

// ==========================================
// 3. TV CHANNELS REPOSITORY
// ==========================================
export function getStoredChannels(): TVChannelItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CHANNELS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const hasStaleBrokenStream = parsed.some(
          (ch: any) =>
            typeof ch?.streamUrl === 'string' &&
            (ch.streamUrl.includes('stream.zeno.fm') ||
              ch.streamUrl.includes('rtv.rba.co.rw') ||
              ch.streamUrl.includes('d2e1asnsl7br7b.cloudfront.net'))
        );
        if (!hasStaleBrokenStream) {
          return parsed;
        }
      }
    }
  } catch (e) {
    console.warn('Error reading channels:', e);
  }
  saveStoredChannels(SEED_TV_CHANNELS);
  return SEED_TV_CHANNELS;
}

export function saveStoredChannels(channels: TVChannelItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CHANNELS, JSON.stringify(channels));
  } catch (e) {
    console.error('Error saving channels:', e);
  }
}

export function saveChannel(channel: TVChannelItem): TVChannelItem[] {
  const list = getStoredChannels();
  const index = list.findIndex((c) => c.id === channel.id);
  let updated: TVChannelItem[];
  if (index >= 0) {
    updated = [...list];
    updated[index] = { ...channel, updatedAt: new Date().toISOString() };
  } else {
    updated = [{ ...channel, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, ...list];
  }
  saveStoredChannels(updated);
  return updated;
}

export function deleteChannel(id: string): TVChannelItem[] {
  const list = getStoredChannels();
  const updated = list.filter((c) => c.id !== id);
  saveStoredChannels(updated);
  return updated;
}

// ==========================================
// 4. SUBSCRIPTION PLANS REPOSITORY
// ==========================================
export function getStoredPlans(): SubscriptionPlan[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PLANS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Error reading plans:', e);
  }
  saveStoredPlans(SEED_SUBSCRIPTION_PLANS);
  return SEED_SUBSCRIPTION_PLANS;
}

export function saveStoredPlans(plans: SubscriptionPlan[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(plans));
  } catch (e) {
    console.error('Error saving plans:', e);
  }
}

export function savePlan(plan: SubscriptionPlan): SubscriptionPlan[] {
  const list = getStoredPlans();
  const index = list.findIndex((p) => p.id === plan.id);
  let updated: SubscriptionPlan[];
  if (index >= 0) {
    updated = [...list];
    updated[index] = { ...plan, updatedAt: new Date().toISOString() };
  } else {
    updated = [{ ...plan, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, ...list];
  }
  saveStoredPlans(updated);
  return updated;
}

export function deletePlan(id: string): SubscriptionPlan[] {
  const list = getStoredPlans();
  const updated = list.filter((p) => p.id !== id);
  saveStoredPlans(updated);
  return updated;
}

// ==========================================
// 5. CATEGORIES REPOSITORY
// ==========================================
export function getStoredCategories(): CategoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Error reading categories:', e);
  }
  saveStoredCategories(SEED_CATEGORIES);
  return SEED_CATEGORIES;
}

export function saveStoredCategories(categories: CategoryItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  } catch (e) {
    console.error('Error saving categories:', e);
  }
}

export function saveCategory(cat: CategoryItem): CategoryItem[] {
  const list = getStoredCategories();
  const index = list.findIndex((c) => c.id === cat.id);
  let updated: CategoryItem[];
  if (index >= 0) {
    updated = [...list];
    updated[index] = cat;
  } else {
    updated = [cat, ...list];
  }
  saveStoredCategories(updated);
  return updated;
}

export function deleteCategory(id: string): CategoryItem[] {
  const list = getStoredCategories();
  const updated = list.filter((c) => c.id !== id);
  saveStoredCategories(updated);
  return updated;
}

// ==========================================
// 6. WATCH HISTORY & CONTINUE WATCHING
// ==========================================
export function getStoredWatchHistory(): WatchHistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.WATCH_HISTORY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('Error reading watch history:', e);
  }
  return [];
}

export function updateWatchHistoryProgress(entry: WatchHistoryEntry): WatchHistoryEntry[] {
  try {
    const list = getStoredWatchHistory();
    const existingIndex = list.findIndex((i) => i.contentId === entry.contentId);
    let updated: WatchHistoryEntry[];
    if (existingIndex >= 0) {
      updated = [...list];
      updated[existingIndex] = entry;
    } else {
      updated = [entry, ...list];
    }
    // Limit to 20 most recent items
    updated = updated.slice(0, 20);
    localStorage.setItem(STORAGE_KEYS.WATCH_HISTORY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Error saving watch history progress:', e);
    return [];
  }
}

export function clearWatchHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.WATCH_HISTORY);
  } catch (e) {
    console.error('Error clearing watch history:', e);
  }
}

// ==========================================
// 7. DOWNLOADS REPOSITORY
// ==========================================
export function getStoredDownloads(): DownloadedItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DOWNLOADS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('Error reading downloads:', e);
  }
  return [];
}

export function addDownloadItem(item: DownloadedItem): DownloadedItem[] {
  const list = getStoredDownloads();
  const updated = [item, ...list.filter((d) => d.id !== item.id)];
  try {
    localStorage.setItem(STORAGE_KEYS.DOWNLOADS, JSON.stringify(updated));
  } catch (e) {
    console.error('Error saving downloads:', e);
  }
  return updated;
}

export function removeDownloadItem(id: string): DownloadedItem[] {
  const list = getStoredDownloads();
  const updated = list.filter((d) => d.id !== id);
  try {
    localStorage.setItem(STORAGE_KEYS.DOWNLOADS, JSON.stringify(updated));
  } catch (e) {
    console.error('Error deleting download item:', e);
  }
  return updated;
}

// ==========================================
// 8. NOTIFICATIONS REPOSITORY
// ==========================================
export function getStoredNotifications(): NotificationItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('Error reading notifications:', e);
  }
  const defaultNotes: NotificationItem[] = [
    {
      id: 'notif_1',
      title: 'Welcome to Lionel Stream!',
      message: 'Explore Full HD Agasobanuye movies, TV series and verified Live Rwandan channels.',
      type: 'announcement',
      isRead: false,
      createdAt: new Date().toISOString()
    },
    {
      id: 'notif_2',
      title: 'Dune: Prophecy Season 2 Released',
      message: 'Watch new episode releases translated with master commentary by Junior Giti.',
      type: 'series',
      contentId: 'ser_dune_prophecy',
      contentType: 'series',
      isRead: false,
      createdAt: new Date().toISOString()
    }
  ];
  saveStoredNotifications(defaultNotes);
  return defaultNotes;
}

export function saveStoredNotifications(notes: NotificationItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notes));
  } catch (e) {
    console.error('Error saving notifications:', e);
  }
}

export function addNotification(note: Omit<NotificationItem, 'id' | 'isRead' | 'createdAt'>): NotificationItem[] {
  const list = getStoredNotifications();
  const newNote: NotificationItem = {
    ...note,
    id: `notif_${Date.now()}`,
    isRead: false,
    createdAt: new Date().toISOString()
  };
  const updated = [newNote, ...list];
  saveStoredNotifications(updated);
  return updated;
}

export function markNotificationAsRead(id: string): NotificationItem[] {
  const list = getStoredNotifications();
  const updated = list.map((n) => (n.id === id ? { ...n, isRead: true } : n));
  saveStoredNotifications(updated);
  return updated;
}

// ==========================================
// 9. PLATFORM SETTINGS REPOSITORY
// ==========================================
export function getStoredSettings(): PlatformSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Error reading settings:', e);
  }
  return DEFAULT_PLATFORM_SETTINGS;
}

export function saveStoredSettings(settings: PlatformSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving settings:', e);
  }
}

// ==========================================
// 10. USER PROFILE & WATCHLIST REPOSITORY
// ==========================================
export function getStoredUserProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.email) return parsed;
    }
  } catch (e) {
    console.warn('Error reading user profile:', e);
  }
  return DEFAULT_USER_PROFILE;
}

export function saveStoredUserProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
  } catch (e) {
    console.error('Error saving user profile:', e);
  }
}

// ==========================================
// 11. DEVELOPER PROFILE REPOSITORY
// ==========================================
export function getStoredDeveloperProfile(): DeveloperProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DEVELOPER_PROFILE);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.email) {
        return {
          ...DEFAULT_DEVELOPER_PROFILE,
          ...parsed
        };
      }
    }
  } catch (e) {
    console.warn('Error reading developer profile:', e);
  }
  return DEFAULT_DEVELOPER_PROFILE;
}

export function saveStoredDeveloperProfile(profile: DeveloperProfile): void {
  try {
    localStorage.setItem(STORAGE_KEYS.DEVELOPER_PROFILE, JSON.stringify(profile));
  } catch (e) {
    console.error('Error saving developer profile:', e);
  }
}

export function getStoredWatchlist(): string[] {
  const user = getStoredUserProfile();
  return user.watchlist || [];
}

export function toggleWatchlistItem(contentId: string): string[] {
  const user = getStoredUserProfile();
  const exists = user.watchlist.includes(contentId);
  const updatedWatchlist = exists
    ? user.watchlist.filter((id) => id !== contentId)
    : [...user.watchlist, contentId];
  
  const updatedUser: UserProfile = {
    ...user,
    watchlist: updatedWatchlist
  };
  saveStoredUserProfile(updatedUser);
  return updatedWatchlist;
}

export const saveWatchHistoryEntry = updateWatchHistoryProgress;

// Legacy adapters for backwards compatibility
export function getStoredContent(): ContentItem[] {
  const movies = getStoredMovies();
  return movies.map((m) => ({
    id: m.id,
    title: m.title,
    type: 'movie',
    country: m.country,
    countryCode: 'RW',
    category: m.genres[0] || 'Action',
    language: m.language,
    poster: m.posterUrl,
    logo: m.posterUrl,
    description: m.description,
    streamUrl: m.videoUrl,
    videoUrl: m.videoUrl,
    streamType: 'video',
    year: m.year,
    rating: m.rating,
    isLive: false,
    isEnabled: m.status === 'PUBLISHED',
    isVerified: true,
    access: m.access,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt
  }));
}

export function addContentItem(newItem: ContentItem): ContentItem[] {
  const moviePayload: MovieItem = {
    id: newItem.id,
    slug: newItem.id.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    title: newItem.title,
    description: newItem.description || '',
    posterUrl: newItem.poster || newItem.logo || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80',
    backdropUrl: newItem.poster || newItem.logo || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1600&q=80',
    videoUrl: newItem.videoUrl || newItem.streamUrl || '',
    lowVideoUrl: newItem.videoUrl || newItem.streamUrl || '',
    midVideoUrl: newItem.videoUrl || newItem.streamUrl || '',
    hdVideoUrl: newItem.videoUrl || newItem.streamUrl || '',
    downloadEnabled: true,
    year: newItem.year || new Date().getFullYear(),
    duration: '01:45:00',
    genres: newItem.category ? [newItem.category] : ['Action'],
    language: newItem.language || 'Kinyarwanda',
    country: newItem.country || 'Rwanda',
    director: newItem.director || 'Lionel Sabin',
    cast: [],
    rating: newItem.rating || 9.2,
    ageRating: '16+',
    quality: '1080p Full HD',
    isFeatured: true,
    isPopular: true,
    status: 'PUBLISHED',
    access: newItem.access || 'FREE',
    createdAt: newItem.createdAt || new Date().toISOString(),
    updatedAt: newItem.updatedAt || new Date().toISOString()
  };
  saveMovie(moviePayload);
  return getStoredContent();
}

export function updateContentItem(updatedItem: ContentItem): ContentItem[] {
  return addContentItem(updatedItem);
}

export function deleteContentItem(id: string): ContentItem[] {
  deleteMovie(id);
  deleteSeries(id);
  deleteChannel(id);
  return getStoredContent();
}

export function getDeletedChannelIds(): string[] {
  return [];
}

export function convertContentToTvChannel(item: ContentItem): TvChannel {
  return {
    id: item.id,
    name: item.title,
    country: item.country || 'Rwanda',
    countryCode: item.countryCode || 'RW',
    category: item.category || 'General',
    logo: item.logo || item.poster || '',
    logoUrl: item.logo || item.poster,
    streamUrl: item.streamUrl || '',
    streamType: (item.streamType as any) || 'hls',
    isLive: item.isLive !== false,
    isFeatured: true,
    isActive: true,
    sortOrder: 1,
    status: 'ONLINE',
    access: item.access || 'FREE',
    viewerCount: 14200,
    description: item.description || `${item.title} Live Broadcast`,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  };
}

export function convertContentToMediaItem(item: ContentItem): MediaItem {
  return {
    id: item.id,
    title: item.title,
    type: item.type === 'movie' ? 'movie' : 'series',
    posterUrl: item.poster || item.logo || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80',
    backdropUrl: item.poster || item.logo || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1600&q=80',
    videoUrl: item.streamUrl || item.videoUrl || '',
    streamUrl: item.streamUrl || item.videoUrl || '',
    description: item.description || '',
    releaseYear: item.year || 2026,
    duration: '01:45:00',
    genres: item.category ? [item.category] : ['Action'],
    rating: item.rating || 9.2,
    isRwandan: true,
    isAfrican: true,
    isAgasobanuye: true,
    access: item.access || 'FREE',
    status: 'PUBLISHED'
  };
}
