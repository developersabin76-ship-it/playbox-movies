import {
  WatchmodeSearchResponse,
  WatchmodeSearchResultItem,
  WatchmodeTitleDetails,
  WatchmodeSource,
  WatchmodeSeason,
  WatchmodeEpisode,
  MediaItem
} from '../types';

export interface WatchmodeStatusResponse {
  configured: boolean;
  hasKey: boolean;
  message: string;
}

/**
 * Check if the backend has WATCHMODE_API_KEY configured
 */
export async function getWatchmodeStatus(): Promise<WatchmodeStatusResponse> {
  try {
    const res = await fetch('/api/watchmode/status');
    if (!res.ok) throw new Error('Status request failed');
    return await res.json();
  } catch (err: any) {
    return {
      configured: false,
      hasKey: false,
      message: 'Watchmode API backend offline or initializing.'
    };
  }
}

/**
 * Search movies and TV shows via the secure backend Watchmode service
 */
export async function searchWatchmode(query: string, type?: 'movie' | 'tv_series' | 'all'): Promise<WatchmodeSearchResponse> {
  if (!query || !query.trim()) {
    return { results: [], configured: false };
  }

  try {
    const params = new URLSearchParams({
      query: query.trim(),
      ...(type && type !== 'all' ? { type } : {})
    });

    const res = await fetch(`/api/watchmode/search?${params.toString()}`);
    const data = await res.json();
    if (!res.ok) {
      return {
        results: [],
        configured: data.configured ?? false,
        error: data.error || data.message || 'Watchmode is temporarily unavailable. Please try again.'
      };
    }
    return data;
  } catch (err: any) {
    console.error('Watchmode search error:', err.message);
    return {
      results: [],
      configured: false,
      error: 'Unable to search movies right now. Please try again.'
    };
  }
}

/**
 * Get comprehensive metadata for a specific title by Watchmode ID
 */
export async function getWatchmodeTitleDetails(titleId: number | string): Promise<WatchmodeTitleDetails | null> {
  try {
    const res = await fetch(`/api/watchmode/title/${titleId}`);
    if (!res.ok) throw new Error(`Details fetch failed: ${res.status}`);
    const data = await res.json();
    return data.title || data;
  } catch (err: any) {
    console.warn(`Watchmode title details fetch error for ID ${titleId}:`, err.message);
    return null;
  }
}

/**
 * Get streaming availability and official deep links ("Where to Watch")
 */
export async function getWatchmodeSources(titleId: number | string): Promise<WatchmodeSource[]> {
  try {
    const res = await fetch(`/api/watchmode/title/${titleId}/sources`);
    if (!res.ok) throw new Error(`Sources fetch failed: ${res.status}`);
    const data = await res.json();
    return data.sources || [];
  } catch (err: any) {
    console.warn(`Watchmode sources fetch error for ID ${titleId}:`, err.message);
    return [];
  }
}

/**
 * Get seasons and episodes for TV shows
 */
export async function getWatchmodeSeasons(titleId: number | string): Promise<WatchmodeSeason[]> {
  try {
    const res = await fetch(`/api/watchmode/title/${titleId}/seasons`);
    if (!res.ok) throw new Error(`Seasons fetch failed: ${res.status}`);
    const data = await res.json();
    return data.seasons || [];
  } catch (err: any) {
    console.warn(`Watchmode seasons fetch error for ID ${titleId}:`, err.message);
    return [];
  }
}

/**
 * Helper to convert Watchmode Title Details into the site's MediaItem format
 */
export function convertWatchmodeToMediaItem(
  wm: WatchmodeTitleDetails,
  customVideoUrl?: string,
  customDownloadUrl?: string
): MediaItem {
  const isSeries = wm.type === 'tv_series' || wm.type === 'tv_miniseries';
  const genres = wm.genre_names && wm.genre_names.length > 0 ? wm.genre_names : ['Cinema', 'Drama'];

  const cast = (wm.cast_crew || [])
    .filter((c) => c.role === 'Actor' || c.character || c.name)
    .slice(0, 8)
    .map((c, idx) => ({
      id: `wm_cast_${c.id || idx}`,
      name: c.name,
      character: c.character || 'Cast Member',
      photoUrl: c.headshot_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
    }));

  const episodes = (wm.seasons || []).flatMap((s) =>
    (s.episodes || []).map((ep) => ({
      id: `wm_ep_${s.season_number}_${ep.episode_number}`,
      seasonNumber: s.season_number,
      episodeNumber: ep.episode_number,
      title: ep.title || `Season ${s.season_number} Episode ${ep.episode_number}`,
      duration: '45m',
      thumbnailUrl: ep.thumbnail_url || wm.backdrop || wm.poster || '',
      description: ep.overview || `Episode ${ep.episode_number} of ${wm.title}`,
      videoUrl: customVideoUrl || ''
    }))
  );

  return {
    id: `wm_${wm.id}`,
    title: wm.title,
    originalTitle: wm.original_title,
    type: isSeries ? 'series' : 'movie',
    region: 'global',
    bannerUrl: wm.backdrop || wm.poster || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1200&q=80',
    posterUrl: wm.poster || 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?auto=format&fit=crop&w=600&q=80',
    videoUrl: customVideoUrl || '',
    trailerUrl: wm.trailer || undefined,
    synopsis: wm.plot_overview || 'No synopsis available for this title.',
    releaseYear: wm.year || new Date().getFullYear(),
    duration: isSeries
      ? `${wm.seasons?.length || 1} Season${(wm.seasons?.length || 1) > 1 ? 's' : ''}`
      : wm.runtime_minutes
      ? `${Math.floor(wm.runtime_minutes / 60)}h ${wm.runtime_minutes % 60}m`
      : '1h 55m',
    genres,
    rating: wm.user_rating ? Number((wm.user_rating * 1).toFixed(1)) : 8.5,
    matchPercentage: wm.critic_score || 94,
    ageRating: wm.us_rating || 'PG-13',
    audioLanguages: [wm.original_language ? wm.original_language.toUpperCase() : 'English', 'Kinyarwanda Subtitles'],
    subtitles: [
      { lang: 'English', url: '' },
      { lang: 'Kinyarwanda', url: '' },
      { lang: 'French', url: '' }
    ],
    director: 'Acclaimed Director',
    cast,
    episodes: episodes.length > 0 ? episodes : undefined,
    viewsCount: 14500,
    likesCount: 3200,
    reviews: [],
    category: isSeries ? 'TV Series' : 'Blockbuster Movies'
  };
}
