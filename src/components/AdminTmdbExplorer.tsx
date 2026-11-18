import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Film,
  Tv,
  Sparkles,
  TrendingUp,
  Award,
  Calendar,
  Play,
  Check,
  Plus,
  Edit3,
  ExternalLink,
  Info,
  Layers,
  X,
  Radio,
  Eye,
  CheckCircle2,
  AlertCircle,
  Clock,
  Globe,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';
import {
  MovieItem,
  SeriesItem,
  ContentAccess
} from '../types';
import {
  TmdbItem,
  TmdbMovieDetails,
  TmdbTvDetails,
  fetchTrendingMovies,
  fetchPopularMovies,
  fetchTopRatedMovies,
  fetchNowPlayingMovies,
  fetchUpcomingMovies,
  fetchPopularTvShows,
  fetchTmdbSearch,
  fetchTmdbMovieDetails,
  fetchTmdbTvDetails,
  getTmdbPosterUrl,
  getTmdbBackdropUrl,
  getTmdbTitle,
  getTmdbYear,
  getTmdbMediaType,
  NO_POSTER_PLACEHOLDER
} from '../services/tmdbService';
import { VideoPlayer } from './VideoPlayer';
import { saveMovieToFirestore } from '../services/firestoreMovieService';

type TmdbCategoryKey = 'trending' | 'popular' | 'top_rated' | 'now_playing' | 'upcoming' | 'tv_popular';

interface AdminTmdbExplorerProps {
  movies: MovieItem[];
  series: SeriesItem[];
  onSaveMovie: (movie: MovieItem) => void;
  onSaveSeries: (series: SeriesItem) => void;
  onRefreshData: () => void;
}

export const AdminTmdbExplorer: React.FC<AdminTmdbExplorerProps> = ({
  movies = [],
  series = [],
  onSaveMovie,
  onSaveSeries,
  onRefreshData
}) => {
  // Category & Search State
  const [selectedCategory, setSelectedCategory] = useState<TmdbCategoryKey>('popular');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [searchFilterType, setSearchFilterType] = useState<'all' | 'movie' | 'tv'>('all');
  
  // Data Loading States
  const [items, setItems] = useState<TmdbItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Video Link Editor Modal State
  const [selectedTmdbItem, setSelectedTmdbItem] = useState<TmdbItem | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  
  // Form Editor Fields
  const [contentType, setContentType] = useState<'movie' | 'series'>('movie');
  const [formTitle, setFormTitle] = useState('');
  const [formStreamUrl, setFormStreamUrl] = useState('');
  const [formLowVideoUrl, setFormLowVideoUrl] = useState('');
  const [formHdVideoUrl, setFormHdVideoUrl] = useState('');
  const [formPosterUrl, setFormPosterUrl] = useState('');
  const [formBackdropUrl, setFormBackdropUrl] = useState('');
  const [formYear, setFormYear] = useState<number>(new Date().getFullYear());
  const [formDuration, setFormDuration] = useState('01:45:00');
  const [formGenres, setFormGenres] = useState<string[]>(['Action', 'Agasobanuye']);
  const [formUmusobanuzi, setFormUmusobanuzi] = useState('Junior Giti');
  const [formAccess, setFormAccess] = useState<ContentAccess>('FREE');
  const [formQuality, setFormQuality] = useState('1080p Full HD');
  const [formDescription, setFormDescription] = useState('');
  const [formRating, setFormRating] = useState(9.2);
  const [formAgeRating, setFormAgeRating] = useState('16+');
  const [formIsFeatured, setFormIsFeatured] = useState(true);
  const [formIsPopular, setFormIsPopular] = useState(true);
  const [formDownloadEnabled, setFormDownloadEnabled] = useState(true);

  // Stream preview test state inside modal
  const [testStreamPlaying, setTestStreamPlaying] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Common Umusobanuzi list
  const interpretersList = ['Junior Giti', 'Rocky Kimomo', 'Sankara', 'Gaheza', 'Yanga', 'Chris', 'Savimbi', 'Master P', 'Lionel Sabin'];

  // Map of existing movies/series by clean normalized title for instant matching
  const existingLibraryMap = useMemo(() => {
    const map = new Map<string, { type: 'movie' | 'series'; item: MovieItem | SeriesItem }>();
    movies.forEach((m) => {
      const cleanKey = m.title.trim().toLowerCase();
      map.set(cleanKey, { type: 'movie', item: m });
    });
    series.forEach((s) => {
      const cleanKey = s.title.trim().toLowerCase();
      map.set(cleanKey, { type: 'series', item: s });
    });
    return map;
  }, [movies, series]);

  // Load items when category or active search changes
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setIsLoading(true);
      setFetchError(null);

      try {
        let res;
        if (activeSearchTerm.trim()) {
          res = await fetchTmdbSearch(activeSearchTerm.trim(), 1, searchFilterType);
        } else {
          switch (selectedCategory) {
            case 'trending':
              res = await fetchTrendingMovies(1);
              break;
            case 'popular':
              res = await fetchPopularMovies(1);
              break;
            case 'top_rated':
              res = await fetchTopRatedMovies(1);
              break;
            case 'now_playing':
              res = await fetchNowPlayingMovies(1);
              break;
            case 'upcoming':
              res = await fetchUpcomingMovies(1);
              break;
            case 'tv_popular':
              res = await fetchPopularTvShows(1);
              break;
            default:
              res = await fetchPopularMovies(1);
          }
        }

        if (isMounted) {
          setItems(res?.results || []);
          setPage(1);
          setTotalPages(res?.total_pages || 1);
        }
      } catch (err: any) {
        if (isMounted) {
          console.error('[Admin TMDB Explorer Error]:', err);
          setFetchError(err.message || 'Unable to connect to TMDB. Please try again.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [selectedCategory, activeSearchTerm, searchFilterType]);

  // Load more pages
  const handleLoadMore = async () => {
    if (page >= totalPages || isLoadingMore) return;
    setIsLoadingMore(true);
    const nextPage = page + 1;

    try {
      let res;
      if (activeSearchTerm.trim()) {
        res = await fetchTmdbSearch(activeSearchTerm.trim(), nextPage, searchFilterType);
      } else {
        switch (selectedCategory) {
          case 'trending':
            res = await fetchTrendingMovies(nextPage);
            break;
          case 'popular':
            res = await fetchPopularMovies(nextPage);
            break;
          case 'top_rated':
            res = await fetchTopRatedMovies(nextPage);
            break;
          case 'now_playing':
            res = await fetchNowPlayingMovies(nextPage);
            break;
          case 'upcoming':
            res = await fetchUpcomingMovies(nextPage);
            break;
          case 'tv_popular':
            res = await fetchPopularTvShows(nextPage);
            break;
          default:
            res = await fetchPopularMovies(nextPage);
        }
      }

      if (res?.results) {
        setItems((prev) => {
          const existingIds = new Set(prev.map((i) => i.id));
          const uniqueNew = res.results.filter((i) => !existingIds.has(i.id));
          return [...prev, ...uniqueNew];
        });
        setPage(nextPage);
      }
    } catch (err) {
      console.error('[Admin TMDB Load More Error]:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Trigger search
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearchTerm(searchQuery.trim());
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setActiveSearchTerm('');
  };

  // Open the stream editor modal for a TMDB item
  const handleOpenEditor = async (item: TmdbItem) => {
    setSelectedTmdbItem(item);
    setIsEditorOpen(true);
    setIsLoadingDetails(true);
    setTestStreamPlaying(false);
    setSaveSuccessMessage(null);

    const title = getTmdbTitle(item);
    const yearStr = getTmdbYear(item);
    const mediaType = getTmdbMediaType(item);
    const isTv = mediaType === 'tv' || selectedCategory === 'tv_popular';

    // Check if this item already exists in local/cloud library
    const match = existingLibraryMap.get(title.trim().toLowerCase());
    
    // Set basic info initially
    setFormTitle(title);
    setContentType(isTv ? 'series' : 'movie');
    setFormYear(parseInt(yearStr, 10) || new Date().getFullYear());
    setFormPosterUrl(getTmdbPosterUrl(item.poster_path, 'w500'));
    setFormBackdropUrl(getTmdbBackdropUrl(item.backdrop_path, 'original'));
    setFormDescription(item.overview || '');
    setFormRating(item.vote_average ? Number(item.vote_average.toFixed(1)) : 9.2);

    if (match) {
      // Pre-fill with existing movie/series details
      if (match.type === 'movie') {
        const m = match.item as MovieItem;
        setFormStreamUrl(m.videoUrl || '');
        setFormLowVideoUrl(m.lowVideoUrl || '');
        setFormHdVideoUrl(m.hdVideoUrl || m.videoUrl || '');
        setFormUmusobanuzi(m.director || 'Junior Giti');
        setFormAccess(m.access || 'FREE');
        setFormQuality(m.quality || '1080p Full HD');
        setFormDuration(m.duration || '01:45:00');
        setFormGenres(m.genres || ['Action', 'Agasobanuye']);
        setFormIsFeatured(m.isFeatured ?? true);
        setFormIsPopular(m.isPopular ?? true);
      } else {
        const s = match.item as SeriesItem;
        const firstEp = s.seasons?.[0]?.episodes?.[0];
        setFormStreamUrl(firstEp?.videoUrl || '');
        setFormUmusobanuzi(s.director || 'Junior Giti');
        setFormAccess(s.access || 'FREE');
        setFormGenres(s.genres || ['Action', 'Agasobanuye']);
        setFormIsFeatured(s.isFeatured ?? true);
        setFormIsPopular(s.isPopular ?? true);
      }
    } else {
      // Brand new item: supply standard defaults
      setFormStreamUrl('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
      setFormLowVideoUrl('');
      setFormHdVideoUrl('');
      setFormUmusobanuzi('Junior Giti');
      setFormAccess('FREE');
      setFormQuality('1080p Full HD');
      setFormDuration(isTv ? '45m' : '01:45:00');
      setFormGenres(['Action', 'Agasobanuye']);
      setFormIsFeatured(true);
      setFormIsPopular(true);
      setFormDownloadEnabled(true);
    }

    // Fetch rich TMDB details in background to get precise genres, runtime, etc.
    try {
      if (isTv) {
        const tvDetails = await fetchTmdbTvDetails(item.id);
        if (tvDetails) {
          if (tvDetails.genres && tvDetails.genres.length > 0) {
            setFormGenres([...tvDetails.genres.map((g) => g.name), 'Agasobanuye']);
          }
          if (tvDetails.backdrop_path) {
            setFormBackdropUrl(getTmdbBackdropUrl(tvDetails.backdrop_path, 'original'));
          }
          if (tvDetails.poster_path) {
            setFormPosterUrl(getTmdbPosterUrl(tvDetails.poster_path, 'w500'));
          }
          if (tvDetails.overview) {
            setFormDescription(tvDetails.overview);
          }
        }
      } else {
        const movieDetails = await fetchTmdbMovieDetails(item.id);
        if (movieDetails) {
          if (movieDetails.runtime) {
            const hrs = Math.floor(movieDetails.runtime / 60);
            const mins = movieDetails.runtime % 60;
            setFormDuration(`0${hrs}:${mins < 10 ? '0' : ''}${mins}:00`);
          }
          if (movieDetails.genres && movieDetails.genres.length > 0) {
            setFormGenres([...movieDetails.genres.map((g) => g.name), 'Agasobanuye']);
          }
          if (movieDetails.backdrop_path) {
            setFormBackdropUrl(getTmdbBackdropUrl(movieDetails.backdrop_path, 'original'));
          }
          if (movieDetails.poster_path) {
            setFormPosterUrl(getTmdbPosterUrl(movieDetails.poster_path, 'w500'));
          }
          if (movieDetails.overview) {
            setFormDescription(movieDetails.overview);
          }
        }
      }
    } catch (err) {
      console.warn('Notice: Could not fetch detailed metadata, using basic TMDB payload.', err);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Handle saving the stream link and publishing to client library
  const handleSaveAndPublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formStreamUrl.trim()) {
      alert('Please provide a title and valid Video Stream URL');
      return;
    }

    const cleanSlug = formTitle
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-');

    if (contentType === 'movie') {
      // Find existing movie or generate new ID
      const existingMatch = movies.find((m) => m.title.trim().toLowerCase() === formTitle.trim().toLowerCase());
      const movieId = existingMatch ? existingMatch.id : `mov_tmdb_${selectedTmdbItem?.id || Date.now()}`;

      const moviePayload: MovieItem = {
        id: movieId,
        slug: cleanSlug,
        title: formTitle.trim(),
        description: formDescription.trim(),
        posterUrl: formPosterUrl.trim() || NO_POSTER_PLACEHOLDER,
        backdropUrl: formBackdropUrl.trim() || formPosterUrl.trim(),
        videoUrl: formStreamUrl.trim(),
        lowVideoUrl: formLowVideoUrl.trim() || formStreamUrl.trim(),
        midVideoUrl: formStreamUrl.trim(),
        hdVideoUrl: formHdVideoUrl.trim() || formStreamUrl.trim(),
        downloadEnabled: formDownloadEnabled,
        year: formYear,
        duration: formDuration,
        genres: formGenres,
        language: 'Kinyarwanda',
        country: 'Rwanda',
        director: formUmusobanuzi,
        cast: [],
        rating: formRating,
        ageRating: formAgeRating,
        quality: formQuality,
        isFeatured: formIsFeatured,
        isPopular: formIsPopular,
        status: 'PUBLISHED',
        access: formAccess,
        createdAt: existingMatch ? existingMatch.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      onSaveMovie(moviePayload);

      // Also mirror to Firestore if available
      try {
        await saveMovieToFirestore({
          id: movieId,
          title: moviePayload.title,
          videoUrl: moviePayload.videoUrl,
          posterUrl: moviePayload.posterUrl,
          backdropUrl: moviePayload.backdropUrl,
          umusobanuzi: moviePayload.director,
          description: moviePayload.description,
          rating: moviePayload.rating,
          year: moviePayload.year,
          quality: moviePayload.quality,
          duration: moviePayload.duration,
          genres: moviePayload.genres,
          type: 'movie'
        });
      } catch (err) {
        console.warn('Firestore mirror note:', err);
      }

      setSaveSuccessMessage(`Success! "${moviePayload.title}" is now published with stream URL in client library.`);
    } else {
      // TV Series
      const existingMatch = series.find((s) => s.title.trim().toLowerCase() === formTitle.trim().toLowerCase());
      const seriesId = existingMatch ? existingMatch.id : `ser_tmdb_${selectedTmdbItem?.id || Date.now()}`;

      const seriesPayload: SeriesItem = {
        id: seriesId,
        slug: cleanSlug,
        title: formTitle.trim(),
        description: formDescription.trim(),
        posterUrl: formPosterUrl.trim() || NO_POSTER_PLACEHOLDER,
        backdropUrl: formBackdropUrl.trim() || formPosterUrl.trim(),
        year: formYear,
        genres: formGenres,
        language: 'Kinyarwanda',
        country: 'Rwanda',
        director: formUmusobanuzi,
        cast: [],
        rating: formRating,
        ageRating: formAgeRating,
        status: 'PUBLISHED',
        access: formAccess,
        isFeatured: formIsFeatured,
        isPopular: formIsPopular,
        seasonsCount: existingMatch?.seasons?.length || 1,
        totalEpisodesCount: existingMatch?.totalEpisodesCount || 1,
        seasons: existingMatch?.seasons && existingMatch.seasons.length > 0
          ? existingMatch.seasons
          : [
              {
                id: `sea_${Date.now()}`,
                seriesId: seriesId,
                seasonNumber: 1,
                title: 'Season 1',
                description: `Season 1 of ${formTitle}`,
                year: formYear,
                episodesCount: 1,
                episodes: [
                  {
                    id: `ep_${Date.now()}`,
                    seriesId: seriesId,
                    seasonId: `sea_${Date.now()}`,
                    episodeNumber: 1,
                    title: `${formTitle} - Episode 1`,
                    description: formDescription,
                    thumbnailUrl: formBackdropUrl || formPosterUrl,
                    videoUrl: formStreamUrl.trim(),
                    duration: formDuration,
                    access: formAccess,
                    downloadEnabled: formDownloadEnabled,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                  }
                ]
              }
            ],
        createdAt: existingMatch ? existingMatch.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      onSaveSeries(seriesPayload);
      setSaveSuccessMessage(`Success! TV Series "${seriesPayload.title}" with Episode 1 stream URL is published!`);
    }

    onRefreshData();

    setTimeout(() => {
      setIsEditorOpen(false);
      setSaveSuccessMessage(null);
    }, 1600);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Title */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-950/80 via-slate-900 to-slate-950 border border-blue-900/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-600/30 text-blue-300 border border-blue-500/40">
              TMDB v3 Catalog & Stream Studio
            </span>
            <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Live TMDB Connected
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-white tracking-wide">
            TMDB Movies & Series Explorer & Video Stream Link Editor
          </h2>
          <p className="text-xs text-slate-400 max-w-2xl">
            Browse all worldwide TMDB movies and TV series, search any title, and instantly attach/edit your video stream URLs (MP4, HLS, CDN) so clients can stream them directly.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 p-2 rounded-2xl shrink-0">
          <div className="text-right px-2">
            <span className="text-[10px] text-slate-400 font-bold block uppercase">Client Library</span>
            <span className="text-xs font-mono font-black text-emerald-400">
              {movies.length} Movies • {series.length} Shows
            </span>
          </div>
        </div>
      </div>

      {/* Search Bar & Category Navigation */}
      <div className="space-y-3 bg-slate-900/90 border border-slate-800 p-4 rounded-3xl">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-2.5">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search any movie or TV series on TMDB (e.g., Gladiator, Avatar, Dune, Game of Thrones, Spider-Man)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={searchFilterType}
              onChange={(e) => setSearchFilterType(e.target.value as any)}
              className="px-3 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-bold text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Types</option>
              <option value="movie">Movies Only</option>
              <option value="tv">TV Shows Only</option>
            </select>

            <button
              type="submit"
              className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all shrink-0"
            >
              <Search className="w-4 h-4" />
              <span>Search TMDB</span>
            </button>
          </div>
        </form>

        {/* Category Filter Pills (Active when not searching) */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1 border-t border-slate-800/60">
          {[
            { id: 'popular', label: 'Popular Worldwide', icon: Sparkles },
            { id: 'trending', label: 'Trending Weekly', icon: TrendingUp },
            { id: 'top_rated', label: 'Top Rated Movies', icon: Award },
            { id: 'now_playing', label: 'Now in Theaters', icon: Film },
            { id: 'upcoming', label: 'Upcoming Releases', icon: Calendar },
            { id: 'tv_popular', label: 'Popular TV Shows', icon: Tv }
          ].map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id && !activeSearchTerm;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id as TmdbCategoryKey);
                  setActiveSearchTerm('');
                  setSearchQuery('');
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/50'
                    : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Search Notification Banner */}
      {activeSearchTerm && (
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-blue-950/40 border border-blue-800/40 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Search className="w-4 h-4 text-blue-400" />
            <span>Showing TMDB search results for: <strong>"{activeSearchTerm}"</strong> ({items.length} titles found)</span>
          </div>
          <button
            onClick={handleClearSearch}
            className="text-blue-400 hover:text-blue-300 font-bold underline text-xs"
          >
            Clear Search & Return to Categories
          </button>
        </div>
      )}

      {/* Error state */}
      {fetchError && (
        <div className="p-4 rounded-2xl bg-red-950/60 border border-red-800 text-red-200 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <div>
            <p className="font-bold">Notice from TMDB</p>
            <p className="text-slate-300 text-[11px] mt-0.5">{fetchError}</p>
          </div>
        </div>
      )}

      {/* Loading Skeleton / Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, idx) => (
            <div key={idx} className="bg-slate-900/80 rounded-2xl p-3 border border-slate-800/80 animate-pulse space-y-3">
              <div className="aspect-[2/3] bg-slate-800 rounded-xl" />
              <div className="h-3 bg-slate-800 rounded w-3/4" />
              <div className="h-2.5 bg-slate-800 rounded w-1/2" />
              <div className="h-8 bg-slate-800 rounded-xl" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {items.length === 0 ? (
            <div className="py-16 text-center rounded-3xl bg-slate-900/50 border border-slate-800 space-y-3">
              <Film className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-sm font-bold text-white">No TMDB movies or shows found</h3>
              <p className="text-xs text-slate-400">Try searching for a different keyword like "Action", "Avengers", or "Dune".</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {items.map((item) => {
                const title = getTmdbTitle(item);
                const year = getTmdbYear(item);
                const mediaType = getTmdbMediaType(item);
                const posterUrl = getTmdbPosterUrl(item.poster_path, 'w342');
                const rating = item.vote_average ? Number(item.vote_average).toFixed(1) : 'N/A';
                
                // Match against existing library
                const cleanKey = title.trim().toLowerCase();
                const matchedItem = existingLibraryMap.get(cleanKey);
                const isInLibrary = Boolean(matchedItem);

                return (
                  <div
                    key={`${item.id}-${mediaType}`}
                    className={`group rounded-2xl bg-slate-900 border transition-all duration-200 overflow-hidden flex flex-col justify-between shadow-lg ${
                      isInLibrary
                        ? 'border-emerald-500/40 hover:border-emerald-400 bg-slate-900/90'
                        : 'border-slate-800 hover:border-blue-500/60'
                    }`}
                  >
                    {/* Poster & Badge Area */}
                    <div className="relative aspect-[2/3] overflow-hidden bg-slate-950">
                      <img
                        src={posterUrl}
                        alt={title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = NO_POSTER_PLACEHOLDER;
                        }}
                      />

                      {/* Top Badges */}
                      <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1 pointer-events-none">
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-black/75 backdrop-blur-md text-white border border-white/10">
                          {mediaType.toUpperCase()}
                        </span>

                        <span className="px-1.5 py-0.5 rounded-md text-[9px] font-mono font-black bg-amber-500/90 text-slate-950 flex items-center gap-0.5 shadow-sm">
                          ★ {rating}
                        </span>
                      </div>

                      {/* In Library Indicator */}
                      {isInLibrary && (
                        <div className="absolute bottom-2 left-2 right-2 px-2 py-1 rounded-lg bg-emerald-950/90 border border-emerald-500/80 backdrop-blur-md flex items-center justify-center gap-1.5 shadow-lg">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="text-[10px] font-black text-emerald-300 tracking-tight truncate">
                            ACTIVE IN LIBRARY
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Metadata & Actions */}
                    <div className="p-3 space-y-2.5 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="text-xs font-black text-white line-clamp-1 group-hover:text-blue-400 transition-colors" title={title}>
                          {title}
                        </h3>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mt-0.5">
                          <span>{year}</span>
                          <span className="text-[9px] text-slate-500">TMDB ID: {item.id}</span>
                        </div>
                      </div>

                      {/* Action Button */}
                      <button
                        onClick={() => handleOpenEditor(item)}
                        className={`w-full py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-md ${
                          isInLibrary
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-slate-950 shadow-emerald-900/40'
                            : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/40'
                        }`}
                      >
                        {isInLibrary ? (
                          <>
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit Stream URL</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>+ Set Video URL</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Load More Button */}
          {page < totalPages && items.length > 0 && (
            <div className="flex justify-center pt-4">
              <button
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="px-8 py-3 rounded-2xl bg-slate-900 border border-slate-700 hover:border-blue-500 text-white text-xs font-black flex items-center gap-2 transition-all hover:bg-slate-800 disabled:opacity-50"
              >
                {isLoadingMore ? (
                  <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
                <span>{isLoadingMore ? 'Loading next page...' : 'Load More TMDB Movies'}</span>
              </button>
            </div>
          )}
        </>
      )}

      {/* ==========================================
          TMDB STREAM LINK & METADATA EDITOR MODAL
          ========================================== */}
      {isEditorOpen && selectedTmdbItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-slate-950 rounded-3xl border border-blue-900/50 shadow-2xl p-6 sm:p-8 space-y-6 my-auto max-h-[92vh] overflow-y-auto no-scrollbar">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center shrink-0">
                  <Film className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                    <span>{existingLibraryMap.has(formTitle.trim().toLowerCase()) ? 'Edit Stream Link & Publish' : 'Add Video Stream URL to TMDB Movie'}</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Provide the video stream link for clients to watch on the Lionel Stream platform.
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsEditorOpen(false);
                  setTestStreamPlaying(false);
                }}
                className="p-1.5 rounded-xl bg-slate-900 text-slate-400 hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Success Banner */}
            {saveSuccessMessage && (
              <div className="p-4 rounded-2xl bg-emerald-950/90 border border-emerald-500 text-emerald-300 text-xs font-bold flex items-center gap-3 animate-in fade-in">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>{saveSuccessMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSaveAndPublish} className="space-y-5 text-xs">
              
              {/* TMDB Linked Banner Preview */}
              <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 p-4 flex flex-col sm:flex-row gap-4 items-start">
                <img
                  src={formPosterUrl || NO_POSTER_PLACEHOLDER}
                  alt="Poster preview"
                  className="w-20 h-28 rounded-xl object-cover border border-slate-700 shrink-0"
                />
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-blue-600 text-white">
                      TMDB #{selectedTmdbItem.id}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      ★ {formRating} / 10
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                      {formYear}
                    </span>
                  </div>
                  <h4 className="text-sm font-black text-white">{formTitle}</h4>
                  <p className="text-[11px] text-slate-400 line-clamp-2">{formDescription || 'No description synopsis available.'}</p>
                </div>
              </div>

              {/* SECTION: Video Stream URL (The Core User Request) */}
              <div className="p-5 rounded-2xl bg-blue-950/40 border border-blue-500/40 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Play className="w-4 h-4 text-emerald-400" />
                    Video Stream URL (MP4, HLS .m3u8, CDN Link) *
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">Clients will stream from this URL</span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    required
                    placeholder="https://your-server.com/movies/video.mp4 or https://.../playlist.m3u8"
                    value={formStreamUrl}
                    onChange={(e) => setFormStreamUrl(e.target.value)}
                    className="flex-1 px-4 py-3 rounded-xl bg-slate-950 border border-blue-800 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-emerald-400 transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setTestStreamPlaying(!testStreamPlaying)}
                    className={`px-4 py-3 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shrink-0 ${
                      testStreamPlaying
                        ? 'bg-amber-600 text-white'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-slate-950'
                    }`}
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>{testStreamPlaying ? 'Close Test Player' : 'Test Stream'}</span>
                  </button>
                </div>

                {/* In-Modal Video Player Test */}
                {testStreamPlaying && (
                  <div className="pt-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase">Live Stream Tester</span>
                      <span className="text-[10px] text-slate-400">Verifying link playback</span>
                    </div>
                    <div className="aspect-video rounded-xl overflow-hidden bg-black border border-emerald-500/50">
                      <VideoPlayer
                        streamUrl={formStreamUrl}
                        title={formTitle}
                        autoPlay={true}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Grid Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Movie / Show Title</label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-medium focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Content Type</label>
                  <select
                    value={contentType}
                    onChange={(e) => setContentType(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-bold focus:border-blue-500 outline-none"
                  >
                    <option value="movie">Movie (Single Full Feature Film)</option>
                    <option value="series">TV Series (Multi-Season & Episodes)</option>
                  </select>
                </div>
              </div>

              {/* Umusobanuzi & Access & Quality */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Umusobanuzi (Translator)</label>
                  <select
                    value={formUmusobanuzi}
                    onChange={(e) => setFormUmusobanuzi(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-bold focus:border-blue-500 outline-none"
                  >
                    {interpretersList.map((interp) => (
                      <option key={interp} value={interp}>{interp}</option>
                    ))}
                    <option value="Other Interpreter">Other Interpreter</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Client Access Level</label>
                  <select
                    value={formAccess}
                    onChange={(e) => setFormAccess(e.target.value as ContentAccess)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-bold focus:border-blue-500 outline-none"
                  >
                    <option value="FREE">FREE (All Visitors)</option>
                    <option value="PREMIUM">PREMIUM (VIP Subscribers Only)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Video Quality Label</label>
                  <select
                    value={formQuality}
                    onChange={(e) => setFormQuality(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-bold focus:border-blue-500 outline-none"
                  >
                    <option value="1080p Full HD">1080p Full HD</option>
                    <option value="4K Ultra HD">4K Ultra HD</option>
                    <option value="720p HD">720p HD</option>
                    <option value="BluRay 1080p">BluRay 1080p</option>
                  </select>
                </div>
              </div>

              {/* Poster & Backdrop Banner URLs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Poster URL (TMDB CDN)</label>
                  <input
                    type="text"
                    value={formPosterUrl}
                    onChange={(e) => setFormPosterUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-[11px] focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Backdrop Banner URL (TMDB CDN)</label>
                  <input
                    type="text"
                    value={formBackdropUrl}
                    onChange={(e) => setFormBackdropUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-[11px] focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Synopsis Description */}
              <div>
                <label className="text-slate-300 font-bold block mb-1">Movie Synopsis / Overview</label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:border-blue-500 outline-none"
                />
              </div>

              {/* Toggles */}
              <div className="flex flex-wrap items-center gap-6 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsFeatured}
                    onChange={(e) => setFormIsFeatured(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 bg-slate-950 border-slate-700"
                  />
                  <span className="font-bold text-slate-200">Show in Hero Featured Banner</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsPopular}
                    onChange={(e) => setFormIsPopular(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 bg-slate-950 border-slate-700"
                  />
                  <span className="font-bold text-slate-200">Show in Top Trending Agasobanuye</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formDownloadEnabled}
                    onChange={(e) => setFormDownloadEnabled(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 bg-slate-950 border-slate-700"
                  />
                  <span className="font-bold text-slate-200">Allow Client Offline Download</span>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                
                <button
                  type="submit"
                  className="px-7 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-400 hover:to-blue-500 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>Save & Publish to Client Library</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
