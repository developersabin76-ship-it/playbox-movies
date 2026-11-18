import {
  db,
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  handleFirestoreError,
  OperationType
} from './firebase';
import { MediaItem, ContentItem, TvChannel } from '../types';
import {
  addContentItem,
  updateContentItem,
  deleteContentItem,
  getStoredContent,
  convertContentToMediaItem,
  convertContentToTvChannel,
  getDeletedChannelIds
} from './contentStorage';
import { INITIAL_TV_CHANNELS } from '../data/mockData';

const MOVIES_COLLECTION = 'movies';
const CHANNELS_COLLECTION = 'channels';

export interface UploadMoviePayload {
  id: string;
  title: string;
  videoUrl: string;
  posterUrl?: string;
  logoUrl?: string;
  backdropUrl?: string;
  umusobanuzi?: string;
  type?: string;
  type_category?: string;
  genres?: string[];
  description?: string;
  streamType?: string;
  isLive?: boolean;
  isEnabled?: boolean;
  isVerified?: boolean;
  isHeroFeatured?: boolean;
  rating?: number;
  year?: number;
  quality?: string;
  duration?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Saves or updates a movie document in Firebase Firestore.
 */
export async function saveMovieToFirestore(payload: UploadMoviePayload): Promise<boolean> {
  try {
    const movieDocRef = doc(db, MOVIES_COLLECTION, payload.id);
    const cleanPayload = {
      ...payload,
      updatedAt: new Date().toISOString(),
      createdAt: payload.createdAt || new Date().toISOString(),
      isLive: false,
      isEnabled: true,
      isVerified: true,
      rating: payload.rating || 9.2,
      year: payload.year || new Date().getFullYear(),
      quality: payload.quality || '1080p FHD',
      duration: payload.duration || '01:45:00',
      type: payload.type || 'movie',
      type_category: payload.type_category || 'Action'
    };

    // Save to Firestore
    await setDoc(movieDocRef, cleanPayload, { merge: true });

    // Also mirror to contentStorage for seamless offline/immediate state
    const contentItemPayload: ContentItem = {
      id: payload.id,
      title: payload.title,
      type: 'movie',
      mediaType: 'video',
      country: 'Rwanda',
      countryCode: 'RW',
      category: payload.type_category || 'Agasobanuye',
      language: 'Kinyarwanda',
      poster: payload.posterUrl || payload.logoUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80',
      logo: payload.logoUrl || payload.posterUrl,
      description: payload.description || `${payload.title} - Agasobanuye translated by ${payload.umusobanuzi || 'Top Umusobanuzi'}`,
      streamUrl: payload.videoUrl,
      streamType: 'video',
      isLive: false,
      isEnabled: true,
      isVerified: true,
      year: payload.year || new Date().getFullYear(),
      rating: payload.rating || 9.2,
      createdAt: cleanPayload.createdAt,
      updatedAt: cleanPayload.updatedAt
    };
    addContentItem(contentItemPayload);

    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${MOVIES_COLLECTION}/${payload.id}`);
    // Fallback: save to local storage
    const contentItemPayload: ContentItem = {
      id: payload.id,
      title: payload.title,
      type: 'movie',
      mediaType: 'video',
      country: 'Rwanda',
      countryCode: 'RW',
      category: payload.type_category || 'Agasobanuye',
      language: 'Kinyarwanda',
      poster: payload.posterUrl || payload.logoUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80',
      logo: payload.logoUrl || payload.posterUrl,
      description: payload.description || `${payload.title} - Agasobanuye`,
      streamUrl: payload.videoUrl,
      streamType: 'video',
      isLive: false,
      isEnabled: true,
      isVerified: true,
      year: payload.year || new Date().getFullYear(),
      rating: payload.rating || 9.2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    addContentItem(contentItemPayload);
    return true;
  }
}

/**
 * Fetches all uploaded movies from Firestore.
 */
export async function getMoviesFromFirestore(): Promise<MediaItem[]> {
  try {
    const colRef = collection(db, MOVIES_COLLECTION);
    const snapPromise = getDocs(colRef);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Firestore timeout fallback')), 3000)
    );
    const snap = await Promise.race([snapPromise, timeoutPromise]);
    const results: MediaItem[] = [];

    snap.forEach((docSnap) => {
      const data = docSnap.data() as UploadMoviePayload;
      const mediaItem: MediaItem = {
        id: data.id,
        title: data.title,
        type: (data.type as any) || 'movie',
        posterUrl: data.posterUrl || data.logoUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80',
        backdropUrl: data.backdropUrl || data.posterUrl || data.logoUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80',
        logoUrl: data.logoUrl || data.posterUrl,
        videoUrl: data.videoUrl,
        streamUrl: data.videoUrl,
        description: data.description || `${data.title} - Agasobanuye translated by ${data.umusobanuzi || 'Top Umusobanuzi'}`,
        releaseYear: data.year || new Date().getFullYear(),
        rating: data.rating || 9.2,
        genres: data.genres && data.genres.length > 0 ? data.genres : [data.type_category || 'Action'],
        isRwandan: true,
        isAfrican: true,
        isAgasobanuye: true,
        director: data.umusobanuzi || 'Agasobanuye',
        duration: data.duration || '01:43:10'
      };
      (mediaItem as any).umusobanuzi = data.umusobanuzi || 'Agasobanuye';
      (mediaItem as any).type_category = data.type_category || 'Action';
      (mediaItem as any).isHeroFeatured = data.isHeroFeatured ?? true;
      results.push(mediaItem);
    });

    if (results.length > 0) {
      return results;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, MOVIES_COLLECTION);
  }

  // Fallback to local storage content
  const stored = getStoredContent();
  return stored
    .filter((i) => i.isEnabled !== false && i.type === 'movie')
    .map(convertContentToMediaItem);
}

/**
 * Subscribes to real-time updates for movies from Firestore.
 */
export function subscribeToFirestoreMovies(onUpdate: (movies: MediaItem[]) => void): () => void {
  try {
    const colRef = collection(db, MOVIES_COLLECTION);
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const movies: MediaItem[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as UploadMoviePayload;
          const mediaItem: MediaItem = {
            id: data.id,
            title: data.title,
            type: (data.type as any) || 'movie',
            posterUrl: data.posterUrl || data.logoUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80',
            backdropUrl: data.backdropUrl || data.posterUrl || data.logoUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80',
            logoUrl: data.logoUrl || data.posterUrl,
            videoUrl: data.videoUrl,
            streamUrl: data.videoUrl,
            description: data.description || `${data.title} - Agasobanuye translated by ${data.umusobanuzi || 'Top Umusobanuzi'}`,
            releaseYear: data.year || new Date().getFullYear(),
            rating: data.rating || 9.2,
            genres: data.genres && data.genres.length > 0 ? data.genres : [data.type_category || 'Action'],
            isRwandan: true,
            isAfrican: true,
            isAgasobanuye: true,
            director: data.umusobanuzi || 'Agasobanuye',
            duration: data.duration || '01:43:10'
          };
          (mediaItem as any).umusobanuzi = data.umusobanuzi || 'Agasobanuye';
          (mediaItem as any).type_category = data.type_category || 'Action';
          (mediaItem as any).isHeroFeatured = data.isHeroFeatured ?? true;
          movies.push(mediaItem);
        });

        if (movies.length > 0) {
          onUpdate(movies);
        } else {
          // If Firestore is empty, get from localStorage
          const stored = getStoredContent();
          const localMovies = stored
            .filter((i) => i.isEnabled !== false && i.type === 'movie')
            .map(convertContentToMediaItem);
          onUpdate(localMovies);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, MOVIES_COLLECTION);
        const stored = getStoredContent();
        const localMovies = stored
          .filter((i) => i.isEnabled !== false && i.type === 'movie')
          .map(convertContentToMediaItem);
        onUpdate(localMovies);
      }
    );

    return unsubscribe;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, MOVIES_COLLECTION);
    return () => {};
  }
}

/**
 * Deletes a movie from Firestore and local cache.
 */
export async function deleteMovieFromFirestore(id: string): Promise<boolean> {
  try {
    const movieDocRef = doc(db, MOVIES_COLLECTION, id);
    await deleteDoc(movieDocRef);
    deleteContentItem(id);
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${MOVIES_COLLECTION}/${id}`);
    deleteContentItem(id);
    return true;
  }
}

/**
 * Saves or updates a TV Channel in Firebase Firestore.
 */
export async function saveChannelToFirestore(channel: TvChannel): Promise<boolean> {
  try {
    const channelDocRef = doc(db, CHANNELS_COLLECTION, channel.id);
    const cleanPayload = {
      id: channel.id,
      name: channel.name,
      logo: channel.logo || channel.logoUrl || '',
      streamUrl: channel.streamUrl || '',
      country: channel.country || 'Rwanda',
      countryCode: channel.countryCode || 'RW',
      category: channel.category || 'Rwandan TV',
      mediaType: channel.mediaType || 'video',
      streamType: channel.streamType || 'hls',
      isLive: true,
      isVerified: true,
      isEnabled: true,
      updatedAt: new Date().toISOString()
    };

    await setDoc(channelDocRef, cleanPayload, { merge: true });

    // Also update local content storage
    const contentPayload: ContentItem = {
      id: channel.id,
      title: channel.name,
      type: 'channel',
      mediaType: channel.mediaType || 'video',
      country: channel.country || 'Rwanda',
      countryCode: 'RW',
      category: channel.category || 'Rwandan TV',
      logo: channel.logo || channel.logoUrl,
      poster: channel.logo || channel.logoUrl,
      streamUrl: channel.streamUrl || undefined,
      streamType: (channel.streamType as any) || 'hls',
      isLive: true,
      isEnabled: true,
      isVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    addContentItem(contentPayload);

    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${CHANNELS_COLLECTION}/${channel.id}`);
    // Fallback to local storage
    const contentPayload: ContentItem = {
      id: channel.id,
      title: channel.name,
      type: 'channel',
      mediaType: channel.mediaType || 'video',
      country: channel.country || 'Rwanda',
      countryCode: 'RW',
      category: channel.category || 'Rwandan TV',
      logo: channel.logo || channel.logoUrl,
      poster: channel.logo || channel.logoUrl,
      streamUrl: channel.streamUrl || undefined,
      streamType: (channel.streamType as any) || 'hls',
      isLive: true,
      isEnabled: true,
      isVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    addContentItem(contentPayload);
    return true;
  }
}

/**
 * Subscribes to real-time updates for TV Channels from Firestore.
 */
export function subscribeToFirestoreChannels(onUpdate: (channels: TvChannel[]) => void): () => void {
  try {
    const colRef = collection(db, CHANNELS_COLLECTION);
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const firestoreChannels: TvChannel[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as any;
          firestoreChannels.push({
            id: data.id,
            name: data.name,
            number: 1,
            logo: data.logo || data.logoUrl || '',
            logoUrl: data.logo || data.logoUrl || '',
            streamUrl: data.streamUrl || '',
            country: data.country || 'Rwanda',
            countryCode: data.countryCode || 'RW',
            category: data.category || 'Rwandan TV',
            mediaType: data.mediaType || 'video',
            streamType: data.streamType || 'hls',
            isLive: true,
            isFeatured: true,
            isActive: true,
            sortOrder: 1,
            status: 'ONLINE',
            access: 'FREE',
            isVerified: true,
            viewers: 1420,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        });

        const deletedIds = getDeletedChannelIds();
        const stored = getStoredContent();
        const userChannels = stored
          .filter((i) => i.isEnabled !== false && (i.type === 'channel' || i.type === 'sports' || i.type === 'other'))
          .map(convertContentToTvChannel);

        // Merge INITIAL_TV_CHANNELS, firestoreChannels, and userChannels
        const mergedMap = new Map<string, TvChannel>();
        INITIAL_TV_CHANNELS.forEach((c) => mergedMap.set(c.id, c));
        userChannels.forEach((c) => mergedMap.set(c.id, c));
        firestoreChannels.forEach((c) => mergedMap.set(c.id, c));

        const finalChannels = Array.from(mergedMap.values())
          .filter((c) => !deletedIds.includes(c.id))
          .slice(0, 10);

        onUpdate(finalChannels);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, CHANNELS_COLLECTION);
      }
    );

    return unsubscribe;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, CHANNELS_COLLECTION);
    return () => {};
  }
}
