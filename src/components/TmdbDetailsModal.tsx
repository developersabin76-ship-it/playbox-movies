import React, { useState, useEffect } from 'react';
import {
  X,
  Play,
  Star,
  Clock,
  Calendar,
  Sparkles,
  Film,
  Tv,
  CheckCircle2,
  Bookmark,
  Share2,
  Info,
  ExternalLink,
  Layers,
  ShieldCheck,
  PlayCircle,
  Users
} from 'lucide-react';
import {
  TmdbItem,
  TmdbMovieDetails,
  TmdbTvDetails,
  fetchTmdbMovieDetails,
  fetchTmdbTvDetails,
  getTmdbPosterUrl,
  getTmdbBackdropUrl,
  getTmdbProfileUrl,
  getTmdbTitle,
  getTmdbYear,
  getTmdbMediaType,
  NO_POSTER_PLACEHOLDER
} from '../services/tmdbService';
import { MovieItem, SeriesItem, UserProfile } from '../types';

interface TmdbDetailsModalProps {
  item: TmdbItem | null;
  isOpen: boolean;
  onClose: () => void;
  user?: UserProfile;
  myMovies?: (MovieItem | SeriesItem)[];
  onPlayMovie?: (movie: MovieItem) => void;
  onPlaySeries?: (series: SeriesItem) => void;
  onSelectAnotherTitle?: (title: TmdbItem) => void;
  onToggleWatchlist?: (id: string) => void;
}

export const TmdbDetailsModal: React.FC<TmdbDetailsModalProps> = ({
  item,
  isOpen,
  onClose,
  user,
  myMovies = [],
  onPlayMovie,
  onPlaySeries,
  onSelectAnotherTitle,
  onToggleWatchlist
}) => {
  const [details, setDetails] = useState<TmdbMovieDetails | TmdbTvDetails | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'cast' | 'similar'>('overview');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  useEffect(() => {
    if (!item || !isOpen) return;

    let isMounted = true;
    setIsLoading(true);
    setError(null);
    setDetails(null);
    setActiveTab('overview');

    const mediaType = getTmdbMediaType(item);

    const loadDetails = async () => {
      try {
        if (mediaType === 'tv') {
          const data = await fetchTmdbTvDetails(item.id);
          if (isMounted) setDetails(data);
        } else {
          const data = await fetchTmdbMovieDetails(item.id);
          if (isMounted) setDetails(data);
        }
      } catch (err: any) {
        if (isMounted) {
          console.error('[TMDB Modal Error]:', err);
          setError('Unable to load full movie details right now. Please try again.');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadDetails();

    return () => {
      isMounted = false;
    };
  }, [item, isOpen]);

  if (!isOpen || !item) return null;

  const title = details ? getTmdbTitle(details) : getTmdbTitle(item);
  const year = details ? getTmdbYear(details) : getTmdbYear(item);
  const mediaType = getTmdbMediaType(item);
  const isTv = mediaType === 'tv';

  // Check matching "My Movies" authorized item
  const matchingMyMovie = myMovies.find(
    (m) =>
      m.title.toLowerCase().trim() === title.toLowerCase().trim() ||
      (m as any).tmdb_id === item.id ||
      (m.originalTitle && m.originalTitle.toLowerCase().trim() === title.toLowerCase().trim())
  );

  const isMatchingSeries = matchingMyMovie && 'seasons' in matchingMyMovie;

  const handlePlayAuthorized = () => {
    if (!matchingMyMovie) return;
    onClose();
    if (isMatchingSeries && onPlaySeries) {
      onPlaySeries(matchingMyMovie as SeriesItem);
    } else if (onPlayMovie) {
      onPlayMovie(matchingMyMovie as MovieItem);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title,
        text: `Check out ${title} on Lionel Stream`,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  // Find trailer YouTube key
  const videos = details?.videos?.results || [];
  const trailerVideo =
    videos.find((v) => v.site === 'YouTube' && v.type === 'Trailer' && v.official) ||
    videos.find((v) => v.site === 'YouTube' && v.type === 'Trailer') ||
    videos.find((v) => v.site === 'YouTube' && v.type === 'Teaser') ||
    videos[0];

  const trailerEmbedUrl = trailerVideo?.key
    ? `https://www.youtube.com/embed/${trailerVideo.key}?autoplay=1&modestbranding=1`
    : null;

  // Runtime formatter
  const runtimeMinutes = (details as TmdbMovieDetails)?.runtime;
  const runtimeText = runtimeMinutes
    ? `${Math.floor(runtimeMinutes / 60)}h ${runtimeMinutes % 60}m`
    : isTv
    ? `${(details as TmdbTvDetails)?.number_of_seasons || 1} Seasons`
    : null;

  // Similar titles
  const similarList = [
    ...(details?.recommendations?.results || []),
    ...(details?.similar?.results || [])
  ].slice(0, 12);

  // Cast list
  const castList = (details?.credits?.cast || []).slice(0, 12);

  const backdropSrc = getTmdbBackdropUrl(details?.backdrop_path || item.backdrop_path, 'original');
  const posterSrc = getTmdbPosterUrl(details?.poster_path || item.poster_path, 'w500');

  const rating = details?.vote_average
    ? Number(details.vote_average).toFixed(1)
    : item.vote_average
    ? Number(item.vote_average).toFixed(1)
    : '8.5';

  const isWatchlisted = user?.watchlist?.includes(`tmdb_${item.id}`);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto select-none animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl bg-[#080d1a] border border-blue-900/40 rounded-3xl overflow-hidden shadow-2xl my-auto text-slate-200 max-h-[92vh] flex flex-col"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-30 p-2.5 rounded-full bg-slate-950/80 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white transition-all shadow-xl cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* HERO BANNER & HEADER */}
        <div className="relative h-64 sm:h-80 md:h-96 w-full shrink-0 overflow-hidden bg-slate-950">
          <img
            src={backdropSrc}
            alt={title}
            className="w-full h-full object-cover object-center filter brightness-90 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#080d1a] via-[#080d1a]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#080d1a] via-[#080d1a]/50 to-transparent" />

          {/* Hero Content Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8 flex items-end gap-5">
            {/* Poster Thumbnail */}
            <div className="hidden sm:block w-28 md:w-32 aspect-[2/3] shrink-0 rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-700/80 bg-slate-950">
              <img src={posterSrc} alt={title} className="w-full h-full object-cover" />
            </div>

            <div className="space-y-2.5 flex-1 min-w-0">
              {/* Type Badges */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-red-600 text-white flex items-center gap-1 shadow">
                  {isTv ? <Tv className="w-3 h-3" /> : <Film className="w-3 h-3" />}
                  {isTv ? 'TMDB TV SHOW' : 'TMDB MOVIE'}
                </span>

                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-900/60 text-blue-300 border border-blue-700/50 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> TMDB Official
                </span>

                {matchingMyMovie && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-cyan-400 text-slate-950 flex items-center gap-1 shadow-[0_0_10px_#00e5ff]">
                    <CheckCircle2 className="w-3 h-3" /> AGASOBANUYE STREAM AVAILABLE
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight drop-shadow-lg line-clamp-2">
                {title}
              </h1>

              {/* Metadata Info Row */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs font-semibold text-slate-300">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-blue-400" />
                  {year}
                </span>

                {runtimeText && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {runtimeText}
                  </span>
                )}

                <span className="flex items-center gap-1 text-amber-400 font-bold bg-slate-900/90 px-2 py-0.5 rounded-md border border-slate-800">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  {rating} / 10
                  {details?.vote_count ? (
                    <span className="text-[10px] text-slate-400 font-normal">
                      ({details.vote_count.toLocaleString()})
                    </span>
                  ) : null}
                </span>

                {details?.genres && details.genres.length > 0 && (
                  <span className="text-slate-400 hidden sm:inline truncate max-w-xs">
                    {details.genres.map((g) => g.name).join(' • ')}
                  </span>
                )}
              </div>

              {/* Quick Actions Row */}
              <div className="flex flex-wrap items-center gap-2.5 pt-1.5">
                {matchingMyMovie ? (
                  <button
                    onClick={handlePlayAuthorized}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-xs sm:text-sm shadow-xl shadow-red-900/50 hover:scale-105 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-white translate-x-0.5" />
                    <span>KINA / WATCH AGASOBANUYE (1080p FHD)</span>
                  </button>
                ) : (
                  <a
                    href={trailerVideo ? `https://www.youtube.com/watch?v=${trailerVideo.key}` : `https://www.google.com/search?q=${encodeURIComponent(title + ' watch online')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-xs shadow-lg flex items-center gap-2 cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>Watch Official Trailer</span>
                  </a>
                )}

                {onToggleWatchlist && (
                  <button
                    onClick={() => onToggleWatchlist(`tmdb_${item.id}`)}
                    className={`px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border ${
                      isWatchlisted
                        ? 'bg-blue-600 text-white border-blue-500'
                        : 'bg-slate-900/80 text-slate-200 border-slate-700 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>{isWatchlisted ? 'In Watchlist' : '+ Watchlist'}</span>
                  </button>
                )}

                <button
                  onClick={handleShare}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{copiedLink ? 'Copied!' : 'Share'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* MODAL TABS NAVIGATION */}
        <div className="flex items-center gap-2 px-5 sm:px-8 border-b border-slate-800 bg-[#080d1a]/95 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'overview'
                ? 'border-red-500 text-red-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Info className="w-4 h-4" /> Overview & Trailer
          </button>

          {castList.length > 0 && (
            <button
              onClick={() => setActiveTab('cast')}
              className={`py-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'cast'
                  ? 'border-red-500 text-red-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-4 h-4" /> Top Cast & Crew ({castList.length})
            </button>
          )}

          {similarList.length > 0 && (
            <button
              onClick={() => setActiveTab('similar')}
              className={`py-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'similar'
                  ? 'border-red-500 text-red-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-4 h-4" /> Recommendations & Similar ({similarList.length})
            </button>
          )}
        </div>

        {/* TAB BODY / SCROLLABLE CONTENT */}
        <div className="p-5 sm:p-8 overflow-y-auto flex-1 space-y-6">
          
          {/* TAB 1: OVERVIEW & TRAILER */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              
              {/* PLAYBACK & AGASOBANUYE STATUS NOTICE */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#0c1322] border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black tracking-wider uppercase text-red-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" /> Streaming & Metadata Status
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900 text-slate-400 border border-slate-800">
                    TMDB v3 API
                  </span>
                </div>

                {matchingMyMovie ? (
                  <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-800/60 text-xs text-cyan-200 flex items-start gap-2.5 shadow-[0_0_15px_rgba(0,229,255,0.15)]">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-cyan-300">
                        Authorized Agasobanuye stream linked to this title!
                      </p>
                      <p className="text-[11px] text-cyan-400/80 mt-0.5">
                        You can watch this release in 1080p FHD with Kinyarwanda commentary immediately.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-slate-200">
                        This title is synchronized with real TMDB metadata.
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Watch the official YouTube trailer below, or stream via authorized providers.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Tagline */}
              {details?.tagline && (
                <p className="text-sm italic font-medium text-slate-400 border-l-2 border-red-500 pl-3">
                  "{details.tagline}"
                </p>
              )}

              {/* Synopsis Section */}
              <div className="space-y-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Plot Synopsis & Overview
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {details?.overview || item.overview || 'No synopsis overview available for this title.'}
                </p>
              </div>

              {/* Genres Badges */}
              {details?.genres && details.genres.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Genres & Classifications
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {details.genres.map((g) => (
                      <span
                        key={g.id}
                        className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300"
                      >
                        {g.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Official YouTube Trailer */}
              {trailerEmbedUrl && (
                <div className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Play className="w-3.5 h-3.5 text-red-500" />
                    Official Trailer ({trailerVideo?.name || 'HD'})
                  </h3>
                  <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-slate-800 shadow-2xl">
                    <iframe
                      src={trailerEmbedUrl}
                      title={`${title} Trailer`}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}

              {/* TMDB Quick Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-[#0c1322] border border-slate-800">
                  <span className="text-[11px] text-slate-500 block">TMDB ID</span>
                  <span className="font-mono font-bold text-red-400">{item.id}</span>
                </div>
                <div className="p-3 rounded-2xl bg-[#0c1322] border border-slate-800">
                  <span className="text-[11px] text-slate-500 block">Release Date</span>
                  <span className="font-bold text-white">
                    {(details as any)?.release_date || (details as any)?.first_air_date || year}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-[#0c1322] border border-slate-800">
                  <span className="text-[11px] text-slate-500 block">Original Language</span>
                  <span className="font-bold text-white uppercase">
                    {(details as any)?.original_language || 'EN'}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-[#0c1322] border border-slate-800">
                  <span className="text-[11px] text-slate-500 block">Audience Score</span>
                  <span className="font-bold text-amber-400">{rating} / 10</span>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: TOP CAST & CREW */}
          {activeTab === 'cast' && (
            <div className="space-y-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-400">
                Top Billed Cast & Characters
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
                {castList.map((member) => (
                  <div
                    key={member.id}
                    className="p-3 rounded-2xl bg-[#0c1322] border border-slate-800 flex items-center gap-3"
                  >
                    <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 bg-slate-900 border border-slate-700">
                      <img
                        src={getTmdbProfileUrl(member.profile_path, 'w185')}
                        alt={member.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-black text-white truncate">{member.name}</h4>
                      <p className="text-[11px] text-slate-400 truncate">{member.character || 'Actor'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: RECOMMENDATIONS & SIMILAR TITLES */}
          {activeTab === 'similar' && (
            <div className="space-y-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-400">
                Recommended Titles
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {similarList.map((sim) => (
                  <div
                    key={sim.id}
                    onClick={() => {
                      if (onSelectAnotherTitle) {
                        onSelectAnotherTitle(sim);
                      }
                    }}
                    className="group rounded-2xl overflow-hidden bg-[#0c1322] border border-slate-800 hover:border-red-500 transition-all cursor-pointer flex flex-col"
                  >
                    <div className="relative aspect-[2/3] w-full bg-slate-950 overflow-hidden">
                      <img
                        src={getTmdbPosterUrl(sim.poster_path, 'w342')}
                        alt={getTmdbTitle(sim)}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="p-2 bg-[#080d1a]">
                      <h4 className="text-xs font-bold text-white truncate group-hover:text-red-400">
                        {getTmdbTitle(sim)}
                      </h4>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                        <span>{getTmdbYear(sim)}</span>
                        <span className="flex items-center gap-0.5 text-amber-400 font-bold">
                          <Star className="w-2.5 h-2.5 fill-amber-400" />
                          {sim.vote_average ? Number(sim.vote_average).toFixed(1) : '8.0'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
