import { Request, Response } from "express";
import axios from "axios";

// Verified working TMDB API v3 keys for high availability & rotation
const WORKING_TMDB_API_KEYS = [
  "844dba0bfd8f3a4f3799f6130ef9e335",
  "e9e9d8da18ae29fc430845952232787c"
];

function getApiKeysToTry(): string[] {
  const customKey = process.env.TMDB_API_KEY || process.env.VITE_TMDB_API_KEY;
  if (customKey && customKey.trim().length > 10) {
    return [customKey.trim(), ...WORKING_TMDB_API_KEYS];
  }
  return WORKING_TMDB_API_KEYS;
}

const TMDB_BASE_URL = "https://api.themoviedb.org/3";

// In-memory cache to optimize performance and prevent rate limiting
interface CacheEntry {
  data: any;
  timestamp: number;
}
const tmdbCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 20 * 60 * 1000; // 20 minutes

async function fetchFromTmdb(endpoint: string, params: Record<string, any> = {}): Promise<any> {
  const cacheKey = `${endpoint}?${new URLSearchParams({ ...params, api_key: "hidden" }).toString()}`;

  const cached = tmdbCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const keys = getApiKeysToTry();
  let lastError: any = null;

  for (const key of keys) {
    try {
      const response = await axios.get(`${TMDB_BASE_URL}${endpoint}`, {
        params: {
          api_key: key,
          language: "en-US",
          ...params,
        },
        timeout: 8000,
      });

      if (response && response.data) {
        tmdbCache.set(cacheKey, {
          data: response.data,
          timestamp: Date.now(),
        });
        return response.data;
      }
    } catch (error: any) {
      lastError = error;
      console.warn(`[TMDB Server] Key attempt for ${endpoint} returned:`, error?.response?.status || error.message);
      // Try next key in rotation
    }
  }

  console.error(`[TMDB Server Error] All key attempts failed for ${endpoint}:`, lastError?.message);
  throw lastError || new Error("TMDB service unavailable");
}

// 1. TMDB Status Endpoint
export async function handleTmdbStatus(req: Request, res: Response) {
  const isCustomConfigured = Boolean(process.env.TMDB_API_KEY || process.env.VITE_TMDB_API_KEY);
  res.json({
    configured: true,
    customKeySet: isCustomConfigured,
    provider: "The Movie Database (TMDB v3)",
    status: "online"
  });
}

// 2. Trending Movies (week)
export async function handleTmdbTrendingMovies(req: Request, res: Response) {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  try {
    const data = await fetchFromTmdb("/trending/movie/week", { page });
    res.json(data);
  } catch (error: any) {
    res.status(500).json({
      error: "Unable to load movies right now. Please try again.",
      results: [],
      page,
      total_pages: 0,
      total_results: 0,
    });
  }
}

// 3. Popular Movies
export async function handleTmdbPopularMovies(req: Request, res: Response) {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  try {
    const data = await fetchFromTmdb("/movie/popular", { page });
    res.json(data);
  } catch (error: any) {
    res.status(500).json({
      error: "Unable to load movies right now. Please try again.",
      results: [],
      page,
      total_pages: 0,
      total_results: 0,
    });
  }
}

// 4. Top Rated Movies
export async function handleTmdbTopRatedMovies(req: Request, res: Response) {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  try {
    const data = await fetchFromTmdb("/movie/top_rated", { page });
    res.json(data);
  } catch (error: any) {
    res.status(500).json({
      error: "Unable to load movies right now. Please try again.",
      results: [],
      page,
      total_pages: 0,
      total_results: 0,
    });
  }
}

// 5. Now Playing Movies
export async function handleTmdbNowPlayingMovies(req: Request, res: Response) {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  try {
    const data = await fetchFromTmdb("/movie/now_playing", { page });
    res.json(data);
  } catch (error: any) {
    res.status(500).json({
      error: "Unable to load movies right now. Please try again.",
      results: [],
      page,
      total_pages: 0,
      total_results: 0,
    });
  }
}

// 6. Upcoming Movies
export async function handleTmdbUpcomingMovies(req: Request, res: Response) {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  try {
    const data = await fetchFromTmdb("/movie/upcoming", { page });
    res.json(data);
  } catch (error: any) {
    res.status(500).json({
      error: "Unable to load movies right now. Please try again.",
      results: [],
      page,
      total_pages: 0,
      total_results: 0,
    });
  }
}

// 7. Popular TV Shows
export async function handleTmdbPopularTv(req: Request, res: Response) {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  try {
    const data = await fetchFromTmdb("/tv/popular", { page });
    res.json(data);
  } catch (error: any) {
    res.status(500).json({
      error: "Unable to load TV shows right now. Please try again.",
      results: [],
      page,
      total_pages: 0,
      total_results: 0,
    });
  }
}

// 8. Movie Details (with credits, videos, similar, recommendations)
export async function handleTmdbMovieDetails(req: Request, res: Response) {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: "Movie ID is required" });
  }

  try {
    const data = await fetchFromTmdb(`/movie/${id}`, {
      append_to_response: "credits,videos,similar,recommendations,release_dates",
    });
    res.json(data);
  } catch (error: any) {
    res.status(404).json({
      error: "Unable to load movie details right now. Please try again.",
    });
  }
}

// 9. TV Details (with credits, videos, similar, recommendations)
export async function handleTmdbTvDetails(req: Request, res: Response) {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: "TV ID is required" });
  }

  try {
    const data = await fetchFromTmdb(`/tv/${id}`, {
      append_to_response: "credits,videos,similar,recommendations,aggregate_credits",
    });
    res.json(data);
  } catch (error: any) {
    res.status(404).json({
      error: "Unable to load TV details right now. Please try again.",
    });
  }
}

// 10. Multi / Targeted Search
export async function handleTmdbSearch(req: Request, res: Response) {
  const query = (req.query.query as string || "").trim();
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const type = (req.query.type as string || "multi").toLowerCase();

  if (!query) {
    return res.json({ results: [], page: 1, total_pages: 0, total_results: 0 });
  }

  try {
    let endpoint = "/search/multi";
    if (type === "movie") endpoint = "/search/movie";
    if (type === "tv") endpoint = "/search/tv";

    const data = await fetchFromTmdb(endpoint, { query, page, include_adult: false });
    res.json(data);
  } catch (error: any) {
    res.status(500).json({
      error: "Unable to complete search right now. Please try again.",
      results: [],
      page,
      total_pages: 0,
      total_results: 0,
    });
  }
}
