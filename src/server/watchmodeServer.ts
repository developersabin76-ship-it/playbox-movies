import { Request, Response } from 'express';
import axios from 'axios';

const WATCHMODE_BASE_URL = 'https://api.watchmode.com/v1';

// Server-side in-memory caches to save API quota and speed up responses
const searchCache = new Map<string, { timestamp: number; data: any }>();
const detailsCache = new Map<string, { timestamp: number; data: any }>();
const sourcesCache = new Map<string, { timestamp: number; data: any }>();
const seasonsCache = new Map<string, { timestamp: number; data: any }>();

const SEARCH_CACHE_TTL = 15 * 60 * 1000; // 15 minutes
const DETAILS_CACHE_TTL = 60 * 60 * 1000; // 1 hour

// Server-side custom movies store for admin-managed & imported titles (SOURCE B: My Movies)
let customMoviesStore: any[] = [];

/**
 * Check if a valid WATCHMODE_API_KEY exists in process.env
 */
export function getWatchmodeApiKey(): string | null {
  const key = process.env.WATCHMODE_API_KEY;
  if (!key || key.trim() === '' || key === 'YOUR_PRIVATE_WATCHMODE_API_KEY' || key === 'MY_WATCHMODE_API_KEY') {
    return null;
  }
  return key.trim();
}

// Log startup status safely (SERVER-SIDE ONLY - NEVER LOGS THE KEY)
const isConfigured = Boolean(getWatchmodeApiKey());
console.log('[Watchmode Server] Startup initialization complete.');
console.log(`[Watchmode Server] WATCHMODE_API_KEY configured: ${isConfigured}`);

/**
 * Endpoint: GET /api/watchmode/status
 * Returns key configuration status
 */
export function handleWatchmodeStatus(req: Request, res: Response) {
  const key = getWatchmodeApiKey();
  return res.json({
    configured: Boolean(key),
    hasKey: Boolean(key),
    message: key
      ? 'Watchmode API is fully connected and ready for live production queries.'
      : 'WATCHMODE_API_KEY is not configured in server environment secrets.'
  });
}

/**
 * Endpoint: GET /api/watchmode/search
 * Secure server-side proxy to search titles from Watchmode API
 * ZERO MOCK DATA: Directly queries official Watchmode API and returns live results or actual error.
 */
export async function handleWatchmodeSearch(req: Request, res: Response) {
  const query = (req.query.query as string || '').trim();
  const searchType = req.query.type as string; // 'movie' | 'tv_series' | undefined

  if (!query) {
    return res.json({ results: [], total_results: 0, configured: Boolean(getWatchmodeApiKey()) });
  }

  const apiKey = getWatchmodeApiKey();

  if (!apiKey) {
    console.warn('[Watchmode Server] Search requested but WATCHMODE_API_KEY is not set in environment.');
    return res.status(400).json({
      success: false,
      configured: false,
      error: 'WATCHMODE_API_KEY is not configured on the server. Please set WATCHMODE_API_KEY in environment variables.',
      results: [],
      total_results: 0
    });
  }

  const cacheKey = `search_${query.toLowerCase()}_${searchType || 'all'}`;
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < SEARCH_CACHE_TTL) {
    return res.json(cached.data);
  }

  try {
    // SERVER-SIDE LOG: request sent
    console.log(`[Watchmode API] Sending search request to Watchmode for query: "${query}"`);

    // 1. First query official autocomplete-search endpoint (provides rich poster URLs and relevance ranking)
    const autoUrl = `${WATCHMODE_BASE_URL}/autocomplete-search/?apiKey=${apiKey}&search_value=${encodeURIComponent(query)}`;
    const autoRes = await axios.get(autoUrl, { timeout: 10000 });

    let rawResults: any[] = [];
    if (autoRes.data && Array.isArray(autoRes.data.results)) {
      rawResults = autoRes.data.results.filter((item: any) => item.result_type === 'title' || item.type === 'movie' || item.type === 'tv_series');
    }

    // 2. If autocomplete returned no titles, query official title search endpoint
    if (rawResults.length === 0) {
      const searchUrl = `${WATCHMODE_BASE_URL}/search/?apiKey=${apiKey}&search_field=name&search_value=${encodeURIComponent(query)}`;
      const searchRes = await axios.get(searchUrl, { timeout: 10000 });
      if (searchRes.data && Array.isArray(searchRes.data.title_results)) {
        rawResults = searchRes.data.title_results;
      }
    }

    // SERVER-SIDE LOG: HTTP status & count
    console.log(`[Watchmode API] Response status: ${autoRes.status}, found ${rawResults.length} real Watchmode results`);

    // Filter by type if requested
    if (searchType && searchType !== 'all') {
      rawResults = rawResults.filter((item: any) => {
        const itemType = (item.type || item.result_type || '').toLowerCase();
        if (searchType === 'movie') return itemType === 'movie';
        if (searchType === 'tv_series') return itemType.includes('tv') || itemType === 'tv_series' || itemType === 'tv_miniseries';
        return true;
      });
    }

    if (rawResults.length > 0) {
      const first = rawResults[0];
      // SERVER-SIDE LOG: First result details (NEVER LOGS KEY)
      console.log(`[Watchmode API] First result: "${first.name || first.title}" (Watchmode ID: ${first.id}, Type: ${first.type || first.result_type}, Year: ${first.year})`);
    }

    // Format results cleanly
    const formattedResults = rawResults.map((item: any) => {
      const rawType = item.type || item.result_type || 'movie';
      const isTv = rawType === 'tv_series' || rawType === 'tv_miniseries' || rawType.includes('tv');

      return {
        id: item.id,
        name: item.name || item.title,
        type: isTv ? 'tv_series' : 'movie',
        year: item.year || null,
        imdb_id: item.imdb_id || null,
        tmdb_id: item.tmdb_id || null,
        tmdb_type: item.tmdb_type || (isTv ? 'tv' : 'movie'),
        image_url: item.image_url || item.poster || item.poster_url || null,
        poster_url: item.image_url || item.poster || item.poster_url || null,
        result_type: isTv ? 'tv_series' : 'movie',
        user_rating: item.user_rating || null,
        plot_overview: item.plot_overview || null
      };
    });

    const payload = {
      success: true,
      results: formattedResults,
      total_results: formattedResults.length,
      configured: true,
      source: 'watchmode_official_api'
    };

    searchCache.set(cacheKey, { timestamp: Date.now(), data: payload });
    return res.json(payload);
  } catch (err: any) {
    const status = err.response?.status || 500;
    const errorMsg = err.response?.data?.message || err.message || 'Error communicating with Watchmode API';
    console.error(`[Watchmode API] Search error - HTTP status ${status}:`, errorMsg);

    if (status === 429) {
      return res.status(429).json({
        success: false,
        configured: true,
        results: [],
        total_results: 0,
        error: 'Watchmode API rate limit reached. Please wait a moment before trying again.'
      });
    }

    return res.status(status >= 400 && status < 600 ? status : 500).json({
      success: false,
      configured: true,
      results: [],
      total_results: 0,
      error: 'Watchmode is temporarily unavailable. Please try again.'
    });
  }
}

/**
 * Endpoint: GET /api/watchmode/title/:id
 * Retrieve rich title metadata directly from Watchmode API
 */
export async function handleWatchmodeTitleDetails(req: Request, res: Response) {
  const titleId = req.params.id;
  if (!titleId) return res.status(400).json({ success: false, error: 'Title ID required' });

  const apiKey = getWatchmodeApiKey();
  if (!apiKey) {
    return res.status(400).json({
      success: false,
      configured: false,
      error: 'WATCHMODE_API_KEY is not configured on the server.'
    });
  }

  const cacheKey = `details_${titleId}`;
  const cached = detailsCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < DETAILS_CACHE_TTL) {
    return res.json(cached.data);
  }

  try {
    console.log(`[Watchmode API] Fetching title details for ID: ${titleId}`);
    const url = `${WATCHMODE_BASE_URL}/title/${titleId}/details/?apiKey=${apiKey}&append_to_response=sources`;
    const response = await axios.get(url, { timeout: 10000 });
    const data = response.data;

    if (!data || !data.id) {
      throw new Error('Invalid title data returned from Watchmode');
    }

    // If sources array is empty, attempt secondary fetch to /sources
    if (!data.sources || data.sources.length === 0) {
      try {
        const srcRes = await axios.get(`${WATCHMODE_BASE_URL}/title/${titleId}/sources/?apiKey=${apiKey}`, { timeout: 6000 });
        if (Array.isArray(srcRes.data)) {
          data.sources = srcRes.data;
        }
      } catch (err: any) {
        console.warn(`[Watchmode API] Secondary sources fetch notice for ID ${titleId}:`, err.message);
      }
    }

    // If TV show, fetch season information
    const isTv = data.type === 'tv_series' || data.type === 'tv_miniseries';
    if (isTv) {
      try {
        const seaRes = await axios.get(`${WATCHMODE_BASE_URL}/title/${titleId}/seasons/?apiKey=${apiKey}`, { timeout: 6000 });
        if (Array.isArray(seaRes.data)) {
          data.seasons = seaRes.data;
        }
      } catch (err: any) {
        console.warn(`[Watchmode API] Seasons fetch notice for ID ${titleId}:`, err.message);
      }
    }

    // Fetch top cast members
    try {
      const castRes = await axios.get(`${WATCHMODE_BASE_URL}/title/${titleId}/cast-crew/?apiKey=${apiKey}`, { timeout: 6000 });
      if (Array.isArray(castRes.data)) {
        data.cast_crew = castRes.data
          .filter((c: any) => c.type === 'Cast' || c.role === 'Actor')
          .slice(0, 12)
          .map((c: any) => ({
            id: c.person_id || c.id,
            name: c.full_name || c.name,
            character: c.role || c.character || 'Cast',
            headshot_url: c.headshot_url
          }));
      }
    } catch {
      // ignore cast non-fatal error
    }

    console.log(`[Watchmode API] Retrieved details for "${data.title}" (Year: ${data.year}, Sources: ${data.sources?.length || 0})`);

    const payload = { success: true, title: data, configured: true };
    detailsCache.set(cacheKey, { timestamp: Date.now(), data: payload });
    return res.json(payload);
  } catch (err: any) {
    const status = err.response?.status || 500;
    console.error(`[Watchmode API] Title details error for ID ${titleId} - HTTP status ${status}:`, err.message);
    return res.status(status >= 400 && status < 600 ? status : 500).json({
      success: false,
      configured: true,
      error: 'Unable to retrieve title details from Watchmode. Please try again.'
    });
  }
}

/**
 * Endpoint: GET /api/watchmode/title/:id/sources
 * Retrieve streaming providers & official deep watch links ("Where to Watch")
 */
export async function handleWatchmodeTitleSources(req: Request, res: Response) {
  const titleId = req.params.id;
  if (!titleId) return res.status(400).json({ success: false, error: 'Title ID required' });

  const apiKey = getWatchmodeApiKey();
  if (!apiKey) {
    return res.status(400).json({
      success: false,
      configured: false,
      error: 'WATCHMODE_API_KEY is not configured on the server.'
    });
  }

  const cacheKey = `sources_${titleId}`;
  const cached = sourcesCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < DETAILS_CACHE_TTL) {
    return res.json(cached.data);
  }

  try {
    const url = `${WATCHMODE_BASE_URL}/title/${titleId}/sources/?apiKey=${apiKey}`;
    const response = await axios.get(url, { timeout: 10000 });
    const sources = Array.isArray(response.data) ? response.data : [];

    const payload = { success: true, sources, configured: true };
    sourcesCache.set(cacheKey, { timestamp: Date.now(), data: payload });
    return res.json(payload);
  } catch (err: any) {
    const status = err.response?.status || 500;
    console.error(`[Watchmode API] Sources error for ID ${titleId} - HTTP status ${status}:`, err.message);
    return res.status(status >= 400 && status < 600 ? status : 500).json({
      success: false,
      sources: [],
      error: 'Unable to retrieve streaming providers from Watchmode.'
    });
  }
}

/**
 * Endpoint: GET /api/watchmode/title/:id/seasons
 * Retrieve TV show seasons directly from Watchmode API
 */
export async function handleWatchmodeTitleSeasons(req: Request, res: Response) {
  const titleId = req.params.id;
  if (!titleId) return res.status(400).json({ success: false, error: 'Title ID required' });

  const apiKey = getWatchmodeApiKey();
  if (!apiKey) {
    return res.status(400).json({
      success: false,
      configured: false,
      error: 'WATCHMODE_API_KEY is not configured on the server.'
    });
  }

  const cacheKey = `seasons_${titleId}`;
  const cached = seasonsCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < DETAILS_CACHE_TTL) {
    return res.json(cached.data);
  }

  try {
    const url = `${WATCHMODE_BASE_URL}/title/${titleId}/seasons/?apiKey=${apiKey}`;
    const response = await axios.get(url, { timeout: 10000 });
    const seasons = Array.isArray(response.data) ? response.data : [];

    const payload = { success: true, seasons, configured: true };
    seasonsCache.set(cacheKey, { timestamp: Date.now(), data: payload });
    return res.json(payload);
  } catch (err: any) {
    const status = err.response?.status || 500;
    console.error(`[Watchmode API] Seasons error for ID ${titleId} - HTTP status ${status}:`, err.message);
    return res.status(status >= 400 && status < 600 ? status : 500).json({
      success: false,
      seasons: [],
      error: 'Unable to retrieve seasons from Watchmode.'
    });
  }
}

/**
 * SOURCE B: My Movies (Movies that admin is legally authorized to host)
 * Keeps separate admin-hosted video URLs, custom trailers, and upload metadata.
 */
export function handleCustomMoviesGet(req: Request, res: Response) {
  return res.json({
    success: true,
    movies: customMoviesStore,
    total: customMoviesStore.length
  });
}

export function handleCustomMoviesUpsert(req: Request, res: Response) {
  try {
    const movie = req.body;
    if (!movie || !movie.title) {
      return res.status(400).json({ success: false, message: 'Movie title is required' });
    }

    const titleNormalized = movie.title.trim().toLowerCase();
    const movieId = movie.id || `custom_movie_${Date.now()}`;

    // Duplicate detection: check if existing movie has same ID or title
    const existingIndex = customMoviesStore.findIndex(
      (m) => m.id === movieId || m.title.trim().toLowerCase() === titleNormalized
    );

    const savedMovie = {
      ...movie,
      id: movieId,
      title: movie.title.trim(),
      updatedAt: new Date().toISOString(),
      source: movie.source || 'Admin Upload / My Movies'
    };

    if (existingIndex >= 0) {
      customMoviesStore[existingIndex] = savedMovie;
    } else {
      customMoviesStore.unshift(savedMovie);
    }

    return res.json({
      success: true,
      message: existingIndex >= 0 ? 'Movie updated in library (duplicate updated).' : 'Movie saved in library successfully.',
      movie: savedMovie,
      isDuplicateUpdate: existingIndex >= 0
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export function handleCustomMoviesDelete(req: Request, res: Response) {
  const { id } = req.params;
  const initialLength = customMoviesStore.length;
  customMoviesStore = customMoviesStore.filter((m) => m.id !== id);

  return res.json({
    success: true,
    deleted: customMoviesStore.length < initialLength,
    remaining: customMoviesStore.length
  });
}
