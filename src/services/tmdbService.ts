export interface TmdbItem {
  id: number;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  vote_count?: number;
  popularity?: number;
  genre_ids?: number[];
  media_type?: 'movie' | 'tv';
  [key: string]: any;
}

export interface TmdbCastMember {
  id: number;
  name: string;
  character?: string;
  profile_path?: string | null;
  order?: number;
}

export interface TmdbVideoItem {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official?: boolean;
}

export interface TmdbMovieDetails {
  id: number;
  title: string;
  original_title?: string;
  tagline?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  vote_average?: number;
  vote_count?: number;
  runtime?: number;
  genres?: { id: number; name: string }[];
  credits?: {
    cast?: TmdbCastMember[];
    crew?: any[];
  };
  videos?: {
    results?: TmdbVideoItem[];
  };
  similar?: {
    results?: TmdbItem[];
  };
  recommendations?: {
    results?: TmdbItem[];
  };
  [key: string]: any;
}

export interface TmdbTvDetails {
  id: number;
  name: string;
  original_name?: string;
  tagline?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  first_air_date?: string;
  last_air_date?: string;
  vote_average?: number;
  vote_count?: number;
  number_of_seasons?: number;
  number_of_episodes?: number;
  genres?: { id: number; name: string }[];
  credits?: {
    cast?: TmdbCastMember[];
    crew?: any[];
  };
  videos?: {
    results?: TmdbVideoItem[];
  };
  similar?: {
    results?: TmdbItem[];
  };
  recommendations?: {
    results?: TmdbItem[];
  };
  [key: string]: any;
}

export interface TmdbPaginatedResponse {
  page: number;
  results: TmdbItem[];
  total_pages: number;
  total_results: number;
  error?: string;
}

// Clean placeholder for movies with no poster
export const NO_POSTER_PLACEHOLDER =
  "data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22500%22%20height%3D%22750%22%20viewBox%3D%220%200%20500%20750%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%23080d1a%22%2F%3E%3Crect%20x%3D%2220%22%20y%3D%2220%22%20width%3D%22460%22%20height%3D%22710%22%20rx%3D%2224%22%20fill%3D%22%230f172a%22%20stroke%3D%22%231e293b%22%20stroke-width%3D%224%22%20stroke-dasharray%3D%228%208%22%2F%3E%3Cpath%20d%3D%22M250%20310%20c-33%200-60%2027-60%2060%200%2033%2027%2060%2060%2060%20s60-27%2060-60c0-33-27-60-60-60z%20m-90%20140%20h180%20v20%20H160z%22%20fill%3D%22%23334155%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%22530%22%20fill%3D%22%2394a3b8%22%20font-family%3D%22sans-serif%22%20font-size%3D%2222%22%20font-weight%3D%22bold%22%20text-anchor%3D%22middle%22%3ENo%20Poster%20Available%3C%2Ftext%3E%3Ctext%20x%3D%2250%25%22%20y%3D%22565%22%20fill%3D%22%2364748b%22%20font-family%3D%22sans-serif%22%20font-size%3D%2214%22%20text-anchor%3D%22middle%22%3ETMDB%20Metadata%20Linked%3C%2Ftext%3E%3C%2Fsvg%3E";

export const NO_BACKDROP_PLACEHOLDER =
  "data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221280%22%20height%3D%22720%22%20viewBox%3D%220%200%201280%20720%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%23080d1a%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20fill%3D%22%23475569%22%20font-family%3D%22sans-serif%22%20font-size%3D%2228%22%20font-weight%3D%22bold%22%20text-anchor%3D%22middle%22%3ELIONEL%20STREAM%20%E2%80%A2%20TMDB%3C%2Ftext%3E%3C%2Fsvg%3E";

export function getTmdbPosterUrl(
  posterPath?: string | null,
  size: 'w185' | 'w342' | 'w500' | 'w780' | 'original' = 'w500'
): string {
  if (!posterPath) return NO_POSTER_PLACEHOLDER;
  if (posterPath.startsWith('http')) return posterPath;
  return `https://image.tmdb.org/t/p/${size}${posterPath.startsWith('/') ? '' : '/'}${posterPath}`;
}

export function getTmdbBackdropUrl(
  backdropPath?: string | null,
  size: 'w780' | 'w1280' | 'original' = 'original'
): string {
  if (!backdropPath) return NO_BACKDROP_PLACEHOLDER;
  if (backdropPath.startsWith('http')) return backdropPath;
  return `https://image.tmdb.org/t/p/${size}${backdropPath.startsWith('/') ? '' : '/'}${backdropPath}`;
}

export function getTmdbProfileUrl(
  profilePath?: string | null,
  size: 'w185' | 'h632' = 'w185'
): string {
  if (!profilePath) return NO_POSTER_PLACEHOLDER;
  if (profilePath.startsWith('http')) return profilePath;
  return `https://image.tmdb.org/t/p/${size}${profilePath.startsWith('/') ? '' : '/'}${profilePath}`;
}

export function getTmdbTitle(item: TmdbItem | TmdbMovieDetails | TmdbTvDetails): string {
  return (item as any).title || (item as any).name || (item as any).original_title || (item as any).original_name || 'Untitled';
}

export function getTmdbYear(item: TmdbItem | TmdbMovieDetails | TmdbTvDetails): string {
  const dateStr = (item as any).release_date || (item as any).first_air_date || '';
  if (!dateStr) return '2026';
  return dateStr.substring(0, 4);
}

export function getTmdbMediaType(item: TmdbItem, defaultType: string = 'movie'): 'movie' | 'tv' {
  if (item.media_type === 'tv' || item.media_type === 'movie') return item.media_type;
  if (item.name || item.first_air_date || defaultType === 'tv') return 'tv';
  return 'movie';
}

// Client-side cache to prevent repetitive network roundtrips on tab switching
const clientCache = new Map<string, { data: any; timestamp: number }>();
const CLIENT_CACHE_TTL_MS = 10 * 60 * 1000; // 10 mins

async function apiGet<T>(endpoint: string): Promise<T> {
  const cached = clientCache.get(endpoint);
  if (cached && Date.now() - cached.timestamp < CLIENT_CACHE_TTL_MS) {
    return cached.data as T;
  }

  const response = await fetch(endpoint);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to fetch from ${endpoint}`);
  }

  const data = await response.json();
  clientCache.set(endpoint, { data, timestamp: Date.now() });
  return data;
}

// Category Fetchers
export async function fetchTrendingMovies(page: number = 1): Promise<TmdbPaginatedResponse> {
  return apiGet<TmdbPaginatedResponse>(`/api/tmdb/trending/movies?page=${page}`);
}

export async function fetchPopularMovies(page: number = 1): Promise<TmdbPaginatedResponse> {
  return apiGet<TmdbPaginatedResponse>(`/api/tmdb/movies/popular?page=${page}`);
}

export async function fetchTopRatedMovies(page: number = 1): Promise<TmdbPaginatedResponse> {
  return apiGet<TmdbPaginatedResponse>(`/api/tmdb/movies/top_rated?page=${page}`);
}

export async function fetchNowPlayingMovies(page: number = 1): Promise<TmdbPaginatedResponse> {
  return apiGet<TmdbPaginatedResponse>(`/api/tmdb/movies/now_playing?page=${page}`);
}

export async function fetchUpcomingMovies(page: number = 1): Promise<TmdbPaginatedResponse> {
  return apiGet<TmdbPaginatedResponse>(`/api/tmdb/movies/upcoming?page=${page}`);
}

export async function fetchPopularTvShows(page: number = 1): Promise<TmdbPaginatedResponse> {
  return apiGet<TmdbPaginatedResponse>(`/api/tmdb/tv/popular?page=${page}`);
}

export async function fetchTmdbMovieDetails(id: number | string): Promise<TmdbMovieDetails> {
  return apiGet<TmdbMovieDetails>(`/api/tmdb/movie/${id}`);
}

export async function fetchTmdbTvDetails(id: number | string): Promise<TmdbTvDetails> {
  return apiGet<TmdbTvDetails>(`/api/tmdb/tv/${id}`);
}

export async function fetchTmdbSearch(
  query: string,
  page: number = 1,
  type: 'all' | 'movie' | 'tv' = 'all'
): Promise<TmdbPaginatedResponse> {
  const clean = encodeURIComponent(query.trim());
  return apiGet<TmdbPaginatedResponse>(`/api/tmdb/search?query=${clean}&page=${page}&type=${type}`);
}
