import { MovieItem } from '../types';
import { fetchTmdbSearch, getTmdbPosterUrl, getTmdbBackdropUrl, TmdbItem } from './tmdbService';
import { getMoviesFromFirestore } from './firestoreMovieService';

// Fallback playable streaming URLs for previewing / streaming
const DEFAULT_STREAM_URL = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

export interface ApiStoreSearchResult {
  movies: MovieItem[];
  totalFound: number;
  source: string;
}

// In-memory cache for fast responsive search without refetching identical queries
const searchCache = new Map<string, { result: ApiStoreSearchResult; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Searches the API STORE (TMDB Catalog, Firestore Database, and Local Backend API)
 * Returns movies matching the query with newest releases on top.
 */
export async function searchApiStoreMovies(
  query: string,
  localMovies: MovieItem[] = []
): Promise<ApiStoreSearchResult> {
  const cleanQuery = query.trim();
  if (!cleanQuery || cleanQuery.length < 2) {
    return { movies: [], totalFound: 0, source: 'none' };
  }

  const cacheKey = cleanQuery.toLowerCase();
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.result;
  }

  const results: MovieItem[] = [];
  const seenIds = new Set<string>();
  const seenTitles = new Set<string>();

  // 1. Search existing local and memory movies first
  const qLower = cleanQuery.toLowerCase();
  localMovies.forEach((m) => {
    if (
      m.title.toLowerCase().includes(qLower) ||
      (m.originalTitle && m.originalTitle.toLowerCase().includes(qLower)) ||
      (m.director && m.director.toLowerCase().includes(qLower)) ||
      (m.genres && m.genres.some((g) => g.toLowerCase().includes(qLower)))
    ) {
      if (!seenIds.has(m.id)) {
        seenIds.add(m.id);
        seenTitles.add(m.title.trim().toLowerCase());
        results.push(m);
      }
    }
  });

  // 2. Concurrently query Firestore database & TMDB API Store & Local backend
  try {
    const [tmdbRes, firestoreMovies, backendMoviesRes] = await Promise.allSettled([
      // TMDB API Store (Searches across over 1,000,000 global and African films)
      fetchTmdbSearch(cleanQuery, 1, 'movie'),

      // Firestore Database
      getMoviesFromFirestore(),

      // Local Backend API /api/movies?search=...
      fetch(`/api/movies?search=${encodeURIComponent(cleanQuery)}&limit=24`)
        .then((r) => (r.ok ? r.json() : { movies: [] }))
        .catch(() => ({ movies: [] }))
    ]);

    // Process Firestore movies
    if (firestoreMovies.status === 'fulfilled' && Array.isArray(firestoreMovies.value)) {
      firestoreMovies.value.forEach((m: any) => {
        const title = m.title || '';
        const titleKey = title.trim().toLowerCase();
        if (
          (title.toLowerCase().includes(qLower) || (m.description && m.description.toLowerCase().includes(qLower))) &&
          !seenTitles.has(titleKey) &&
          !seenIds.has(m.id)
        ) {
          seenIds.add(m.id);
          seenTitles.add(titleKey);
          results.push({
            id: m.id || `fs_${Date.now()}_${Math.random()}`,
            slug: (title || 'movie').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            title,
            originalTitle: m.originalTitle || title,
            description: m.description || 'Agasobanuye cinema movie in Lionel Stream.',
            synopsis: m.synopsis || m.description,
            posterUrl: m.posterUrl || '',
            backdropUrl: m.backdropUrl || m.posterUrl || '',
            videoUrl: m.videoUrl || m.streamUrl || DEFAULT_STREAM_URL,
            lowVideoUrl: m.lowVideoUrl || m.videoUrl,
            midVideoUrl: m.midVideoUrl || m.videoUrl,
            hdVideoUrl: m.hdVideoUrl || m.videoUrl,
            downloadUrl: m.downloadUrl || m.videoUrl,
            downloadEnabled: m.downloadEnabled ?? true,
            year: m.releaseYear || m.year || 2026,
            duration: m.duration || '01:45:00',
            genres: m.genres || ['Agasobanuye', 'Action'],
            language: m.language || 'Kinyarwanda',
            country: m.country || 'Rwanda',
            director: m.director || m.umusobanuzi || 'Junior Giti',
            cast: m.cast || [],
            rating: m.rating || 9.5,
            ageRating: m.ageRating || '16+',
            quality: m.quality || '1080p Full HD',
            isFeatured: m.isFeatured ?? true,
            isPopular: m.isPopular ?? true,
            status: 'PUBLISHED',
            access: m.access || 'FREE',
            createdAt: m.createdAt || new Date().toISOString(),
            updatedAt: m.updatedAt || new Date().toISOString()
          });
        }
      });
    }

    // Process Backend SQLite /api/movies results
    if (backendMoviesRes.status === 'fulfilled' && backendMoviesRes.value?.movies) {
      backendMoviesRes.value.movies.forEach((m: any) => {
        const title = m.title || '';
        const titleKey = title.trim().toLowerCase();
        if (!seenTitles.has(titleKey) && !seenIds.has(m.id)) {
          seenIds.add(m.id);
          seenTitles.add(titleKey);
          results.push({
            id: m.id,
            slug: m.slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            title,
            originalTitle: m.original_title || title,
            description: m.description || '',
            posterUrl: m.poster_url || '',
            backdropUrl: m.backdrop_url || m.poster_url || '',
            videoUrl: m.video_url || DEFAULT_STREAM_URL,
            year: m.release_year || 2025,
            duration: m.duration || '01:45:00',
            genres: m.genres ? (typeof m.genres === 'string' ? JSON.parse(m.genres) : m.genres) : ['Action'],
            language: m.language || 'Kinyarwanda',
            country: m.country || 'Rwanda',
            director: m.director || 'Junior Giti',
            cast: [],
            rating: m.rating || 9.4,
            ageRating: '16+',
            quality: '1080p HD',
            isFeatured: Boolean(m.is_featured),
            isPopular: Boolean(m.is_popular),
            status: 'PUBLISHED',
            access: (m.access as any) || 'FREE',
            downloadEnabled: true,
            createdAt: m.created_at || new Date().toISOString(),
            updatedAt: m.updated_at || new Date().toISOString()
          });
        }
      });
    }

    // Process TMDB API Store results (the core global/API store with thousands of movies)
    if (tmdbRes.status === 'fulfilled' && tmdbRes.value && Array.isArray(tmdbRes.value.results)) {
      const tmdbItems: TmdbItem[] = tmdbRes.value.results;

      for (const item of tmdbItems) {
        const title = item.title || item.original_title || item.name || '';
        if (!title) continue;

        const titleKey = title.trim().toLowerCase();
        if (seenTitles.has(titleKey)) continue;

        const dateStr = item.release_date || item.first_air_date || '';
        const parsedYear = dateStr ? parseInt(dateStr.substring(0, 4), 10) : 2026;

        const posterUrl = getTmdbPosterUrl(item.poster_path, 'w500');
        const backdropUrl = getTmdbBackdropUrl(item.backdrop_path, 'original');

        // Check if there is an existing local match to reuse its video/stream
        const localMatch = localMovies.find(
          (m) => m.title.trim().toLowerCase() === titleKey || (m as any).tmdb_id === item.id
        );

        const movieItem: MovieItem = {
          id: `mov_tmdb_${item.id}`,
          slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          title,
          originalTitle: item.original_title || title,
          description: item.overview || `Watch ${title} in High Definition on Lionel Stream. Complete film synopsis and media catalog.`,
          synopsis: item.overview || `Full cinematic presentation of ${title}.`,
          posterUrl: posterUrl,
          backdropUrl: backdropUrl,
          trailerUrl: DEFAULT_STREAM_URL,
          videoUrl: localMatch?.videoUrl || DEFAULT_STREAM_URL,
          lowVideoUrl: localMatch?.lowVideoUrl || DEFAULT_STREAM_URL,
          midVideoUrl: localMatch?.midVideoUrl || DEFAULT_STREAM_URL,
          hdVideoUrl: localMatch?.hdVideoUrl || DEFAULT_STREAM_URL,
          downloadUrl: DEFAULT_STREAM_URL,
          downloadEnabled: true,
          year: parsedYear,
          duration: '01:45:00',
          genres: ['Agasobanuye', 'Cinema', 'Action'],
          language: 'Kinyarwanda & English',
          country: 'International',
          director: 'Agasobanuye Cinema • Junior Giti',
          cast: [],
          rating: item.vote_average ? Math.round(item.vote_average * 10) / 10 : 9.5,
          ageRating: '16+',
          quality: '1080p Full HD',
          isFeatured: true,
          isPopular: (item.popularity || 0) > 10,
          status: 'PUBLISHED',
          access: 'FREE',
          viewsCount: item.vote_count ? item.vote_count * 15 : 1240,
          likesCount: item.vote_count || 120,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          // Metadata tags
          ...( { tmdb_id: item.id, isApiStore: true } as any )
        };

        seenIds.add(movieItem.id);
        seenTitles.add(titleKey);
        results.push(movieItem);
      }
    }
  } catch (err) {
    console.warn('[API Store Search Warning]:', err);
  }

  // CRITICAL REQUIREMENT: Sort results so newest films are on top / upper place!
  const sorted = results.sort((a, b) => {
    // Exact or starting match gets highest relevance
    const aStarts = a.title.toLowerCase().startsWith(qLower);
    const bStarts = b.title.toLowerCase().startsWith(qLower);
    if (aStarts && !bStarts) return -1;
    if (!aStarts && bStarts) return 1;

    // Newest films on top (2026, 2025, 2024...)
    const yearDiff = (b.year || 0) - (a.year || 0);
    if (yearDiff !== 0) return yearDiff;

    // Rating fallback
    return (b.rating || 0) - (a.rating || 0);
  });

  const finalResult: ApiStoreSearchResult = {
    movies: sorted,
    totalFound: sorted.length,
    source: 'API Store (TMDB & Database)'
  };

  searchCache.set(cacheKey, { result: finalResult, timestamp: Date.now() });
  return finalResult;
}
