import {
  SEED_MOVIES,
  SEED_SERIES,
  SEED_TV_CHANNELS,
  SEED_SUBSCRIPTION_PLANS,
  SEED_CATEGORIES,
  DEFAULT_PLATFORM_SETTINGS,
  DEFAULT_USER_PROFILE,
  DEFAULT_DEVELOPER_PROFILE
} from './seedData';
import { MediaItem, TvChannel } from '../types';

export const INITIAL_MEDIA_ITEMS: MediaItem[] = [
  ...SEED_MOVIES.map((m) => ({
    id: m.id,
    title: m.title,
    type: 'movie' as const,
    posterUrl: m.posterUrl,
    backdropUrl: m.backdropUrl,
    videoUrl: m.videoUrl,
    streamUrl: m.videoUrl,
    rating: m.rating,
    releaseYear: m.year,
    duration: m.duration,
    genres: m.genres,
    description: m.description,
    access: m.access,
    status: m.status,
    isFeatured: m.isFeatured,
    isPopular: m.isPopular,
    isRwandan: m.country === 'Rwanda',
    isAfrican: true,
    isAgasobanuye: m.language.includes('Kinyarwanda') || m.genres.includes('Agasobanuye'),
    director: m.director,
    umusobanuzi: m.director,
    cast: m.cast
  })),
  ...SEED_SERIES.map((s) => ({
    id: s.id,
    title: s.title,
    type: 'series' as const,
    posterUrl: s.posterUrl,
    backdropUrl: s.backdropUrl,
    videoUrl: s.seasons?.[0]?.episodes?.[0]?.videoUrl || '',
    streamUrl: s.seasons?.[0]?.episodes?.[0]?.videoUrl || '',
    rating: s.rating,
    releaseYear: s.year,
    genres: s.genres,
    description: s.description,
    access: s.access,
    status: s.status,
    isFeatured: s.isFeatured,
    isPopular: s.isPopular,
    isRwandan: s.country === 'Rwanda',
    isAfrican: true,
    isAgasobanuye: s.language.includes('Kinyarwanda') || s.genres.includes('Agasobanuye'),
    director: s.director,
    umusobanuzi: s.director,
    cast: s.cast,
    seasons: s.seasons,
    episodes: s.seasons?.flatMap((sea) => sea.episodes || []) || []
  }))
];

export const INITIAL_TV_CHANNELS: TvChannel[] = SEED_TV_CHANNELS;

export {
  SEED_MOVIES,
  SEED_SERIES,
  SEED_TV_CHANNELS,
  SEED_SUBSCRIPTION_PLANS,
  SEED_CATEGORIES,
  DEFAULT_PLATFORM_SETTINGS,
  DEFAULT_USER_PROFILE,
  DEFAULT_DEVELOPER_PROFILE
};
