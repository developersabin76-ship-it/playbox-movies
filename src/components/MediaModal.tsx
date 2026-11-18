import React, { useState, useEffect } from 'react';
import {
  X,
  Play,
  Plus,
  Check,
  Star,
  Film,
  Sparkles,
  MessageSquare,
  Send,
  Heart,
  Calendar,
  Clock,
  UserCheck,
  Tv,
  Tv2,
  ExternalLink,
  Loader2,
  Info
} from 'lucide-react';
import { MediaItem, Review, WatchmodeSource } from '../types';
import { searchWatchmode, getWatchmodeSources, getWatchmodeTitleDetails } from '../services/watchmodeService';

interface MediaModalProps {
  item: MediaItem | null;
  onClose: () => void;
  onPlay: (item: MediaItem, episodeId?: string) => void;
  onToggleWatchlist: (itemId: string) => void;
  watchlist: string[];
  allItems: MediaItem[];
  onSelectRelatedItem: (item: MediaItem) => void;
}

export const MediaModal: React.FC<MediaModalProps> = ({
  item,
  onClose,
  onPlay,
  onToggleWatchlist,
  watchlist = [],
  allItems = [],
  onSelectRelatedItem
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'where_to_watch' | 'episodes' | 'reviews' | 'similar'>('overview');
  const [newReviewText, setNewReviewText] = useState('');
  const [newRating, setNewRating] = useState(10);
  const [localReviews, setLocalReviews] = useState<Review[]>([]);

  // Watchmode Sources State
  const [watchmodeSources, setWatchmodeSources] = useState<WatchmodeSource[]>([]);
  const [isLoadingSources, setIsLoadingSources] = useState<boolean>(false);

  useEffect(() => {
    if (item) {
      setLocalReviews(item.reviews || []);
      // Reset & fetch watchmode sources
      setWatchmodeSources([]);
      setIsLoadingSources(true);

      // Check if item id starts with wm_
      let wmId: number | null = null;
      if (item.id.startsWith('wm_')) {
        wmId = Number(item.id.replace('wm_', ''));
      }

      if (wmId && !isNaN(wmId)) {
        getWatchmodeSources(wmId)
          .then(setWatchmodeSources)
          .catch(() => {})
          .finally(() => setIsLoadingSources(false));
      } else {
        // Search by title on Watchmode
        searchWatchmode(item.title)
          .then(async (res) => {
            if (res.results && res.results.length > 0) {
              const bestMatch = res.results[0];
              const sources = await getWatchmodeSources(bestMatch.id);
              setWatchmodeSources(sources);
            }
          })
          .catch(() => {})
          .finally(() => setIsLoadingSources(false));
      }
    }
  }, [item]);

  if (!item) return null;

  const isInWatchlist = (watchlist || []).includes(item.id);

  // Find related content matching genres or region
  const relatedItems = (allItems || [])
    .filter(
      (i) => i.id !== item.id && ((i.genres || []).some((g) => (item.genres || []).includes(g)) || i.region === item.region)
    )
    .slice(0, 4);

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewText.trim()) return;

    const reviewObj: Review = {
      id: String(Date.now()),
      userId: 'usr_lionel',
      userName: 'Lionel Stream User',
      userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      rating: newRating,
      comment: newReviewText,
      createdAt: 'Just now',
      likes: 0
    };

    setLocalReviews([reviewObj, ...localReviews]);
    setNewReviewText('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-xl overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-3xl bg-slate-900 border border-slate-700/80 overflow-hidden shadow-2xl my-auto text-white">
        {/* Backdrop Header Container */}
        <div className="relative h-64 sm:h-80 md:h-96 w-full overflow-hidden bg-slate-950">
          <img
            src={item.bannerUrl || item.posterUrl}
            alt={item.title}
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f19] via-[#0b0f19]/60 to-transparent" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-slate-950/80 text-slate-300 hover:text-white hover:bg-slate-900 transition-colors border border-slate-700"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Banner Details Overlay */}
          <div className="absolute bottom-6 left-6 right-6 z-10">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {item.isRwandan && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                  🇷🇼 Rwandan Cinema
                </span>
              )}
              {item.isAfrican && !item.isRwandan && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  🌍 African Spotlight
                </span>
              )}
              <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-slate-950/80 text-cyan-400 border border-cyan-500/30">
                {item.type.toUpperCase()}
              </span>
              <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-amber-400" /> {item.rating} / 10
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-white mb-3">
              {item.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-300">
              <span className="flex items-center gap-1 font-semibold text-cyan-400">
                <Calendar className="w-4 h-4" /> {item.releaseYear}
              </span>
              <span className="flex items-center gap-1 font-semibold">
                <Clock className="w-4 h-4" /> {item.duration}
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-xs">
                {item.ageRating}
              </span>
              <span className="text-cyan-400 font-bold">{item.matchPercentage}% Match</span>
            </div>
          </div>
        </div>

        {/* Play & Action Bar */}
        <div className="p-6 bg-[#0b0f19] border-b border-slate-800 flex flex-wrap items-center gap-3">
          <button
            onClick={() => onPlay(item)}
            className="px-6 py-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-sm flex items-center gap-2 shadow-lg shadow-cyan-500/30 transition-transform hover:scale-105"
          >
            <Play className="w-5 h-5 fill-slate-950" /> Play Movie / Trailer
          </button>

          <button
            onClick={() => setActiveTab('where_to_watch')}
            className="px-4 py-3 rounded-xl bg-amber-500/20 hover:bg-amber-500 hover:text-slate-950 border border-amber-500/40 text-amber-300 text-xs font-black flex items-center gap-1.5 transition-all"
          >
            <Tv2 className="w-4 h-4" /> Where to Watch ({watchmodeSources.length})
          </button>

          <button
            onClick={() => onToggleWatchlist(item.id)}
            className={`px-4 py-3 rounded-xl border text-xs font-bold flex items-center gap-2 transition-colors ${
              isInWatchlist
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50'
                : 'bg-slate-900 text-slate-200 border-slate-700 hover:border-cyan-500'
            }`}
          >
            {isInWatchlist ? <Check className="w-4 h-4 text-cyan-400" /> : <Plus className="w-4 h-4" />}
            {isInWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-4 bg-[#0b0f19] flex items-center gap-4 border-b border-slate-800 text-sm font-bold overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Overview
          </button>

          <button
            onClick={() => setActiveTab('where_to_watch')}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'where_to_watch'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Tv2 className="w-4 h-4" /> Where to Watch
            {watchmodeSources.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-300">
                {watchmodeSources.length}
              </span>
            )}
          </button>

          {item.episodes && item.episodes.length > 0 && (
            <button
              onClick={() => setActiveTab('episodes')}
              className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'episodes'
                  ? 'border-cyan-400 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              Episodes
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-cyan-500/20 text-cyan-400">
                {item.episodes.length}
              </span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('reviews')}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'reviews'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Reviews ({localReviews.length})
          </button>

          <button
            onClick={() => setActiveTab('similar')}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'similar'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Similar
          </button>
        </div>

        {/* Tab Body Content */}
        <div className="p-6 bg-[#0a0f1d] min-h-[300px] max-h-[450px] overflow-y-auto space-y-6">
          
          {/* TAB: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Synopsis
                </h3>
                <p className="text-sm text-slate-200 leading-relaxed font-normal">
                  {item.synopsis}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
                <div>
                  <span className="text-slate-400 block mb-1">Director</span>
                  <span className="font-bold text-white">{item.director}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Genres</span>
                  <span className="font-bold text-cyan-300">{item.genres.join(', ')}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Audio Dubbing / Languages</span>
                  <span className="font-bold text-amber-300">{item.audioLanguages.join(', ')}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Subtitles</span>
                  <span className="font-bold text-white">{item.subtitles.join(', ')}</span>
                </div>
              </div>

              {/* Cast Members Section */}
              {item.cast && item.cast.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
                    Top Cast
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {item.cast.map((c) => (
                      <div key={c.id} className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                        <img src={c.photoUrl} alt={c.name} className="w-10 h-10 rounded-lg object-cover" />
                        <div>
                          <p className="text-xs font-bold text-white line-clamp-1">{c.name}</p>
                          <p className="text-[10px] text-slate-400 line-clamp-1">{c.character}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: WHERE TO WATCH */}
          {activeTab === 'where_to_watch' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <Tv2 className="w-4 h-4 text-amber-400" />
                    Verified Watchmode Streaming Availability
                  </h3>
                  <p className="text-xs text-slate-400">
                    Official streaming links and digital purchase providers
                  </p>
                </div>
              </div>

              {isLoadingSources ? (
                <div className="p-8 text-center rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin text-amber-400 mx-auto" />
                  <p className="text-xs text-slate-400">Loading authorized streaming sources from Watchmode...</p>
                </div>
              ) : watchmodeSources.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {watchmodeSources.map((s, idx) => (
                    <div
                      key={`${s.source_id}_${idx}`}
                      className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-3"
                    >
                      <div>
                        <span className="font-bold text-white text-xs block">{s.name}</span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                            s.type === 'sub'
                              ? 'bg-purple-500/20 text-purple-300'
                              : s.type === 'free'
                              ? 'bg-cyan-500/20 text-cyan-300'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}>
                            {s.type === 'sub' ? 'Subscription' : s.type === 'free' ? 'Free' : 'Rent / Buy'}
                          </span>
                          {s.price !== undefined && s.price !== null && (
                            <span className="text-[10px] font-bold text-amber-400">${s.price.toFixed(2)}</span>
                          )}
                        </div>
                      </div>

                      <a
                        href={s.web_url || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-1.5 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Stream on {s.name}
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <p className="text-xs font-bold text-slate-300">No active third-party subscription streams found.</p>
                  <p className="text-[11px] text-slate-500">You can stream directly through Lionel Player above!</p>
                </div>
              )}

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start gap-2 text-[11px] text-slate-400">
                <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>Deep links provide navigation to verified streaming platforms via the Watchmode API.</span>
              </div>
            </div>
          )}

          {/* TAB: EPISODES */}
          {activeTab === 'episodes' && item.episodes && (
            <div className="space-y-3">
              {item.episodes.map((ep) => (
                <div
                  key={ep.id}
                  onClick={() => onPlay(item, ep.id)}
                  className="group flex flex-col sm:flex-row items-center gap-4 p-3 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 transition-all cursor-pointer"
                >
                  <div className="relative w-full sm:w-40 aspect-video rounded-xl overflow-hidden bg-slate-950 flex-shrink-0">
                    <img src={ep.thumbnailUrl} alt={ep.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="w-8 h-8 text-cyan-400 fill-cyan-400" />
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">
                        {ep.title}
                      </h4>
                      <span className="text-xs text-slate-400 font-mono">{ep.duration}</span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2">{ep.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB: REVIEWS */}
          {activeTab === 'reviews' && (
            <div className="space-y-6">
              <form onSubmit={handleAddReview} className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                  Write Your Review
                </h4>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-300">Rating:</span>
                  <select
                    value={newRating}
                    onChange={(e) => setNewRating(Number(e.target.value))}
                    className="bg-slate-950 border border-slate-700 text-amber-400 font-bold text-xs rounded-lg px-2 py-1"
                  >
                    {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((num) => (
                      <option key={num} value={num}>
                        {num} Stars
                      </option>
                    ))}
                  </select>
                </div>

                <textarea
                  placeholder="Share your thoughts about this movie..."
                  value={newReviewText}
                  onChange={(e) => setNewReviewText(e.target.value)}
                  className="w-full h-20 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />

                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400 transition-colors flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" /> Submit Review
                </button>
              </form>

              <div className="space-y-3">
                {localReviews.map((rev) => (
                  <div key={rev.id} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <img src={rev.userAvatar} alt={rev.userName} className="w-7 h-7 rounded-full object-cover" />
                        <span className="text-xs font-bold text-white">{rev.userName}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs font-bold text-amber-400">
                        <Star className="w-3.5 h-3.5 fill-amber-400" /> {rev.rating}/10
                      </div>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed mb-1">{rev.comment}</p>
                    <span className="text-[10px] text-slate-500">{rev.createdAt}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: SIMILAR */}
          {activeTab === 'similar' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {relatedItems.map((rel) => (
                <div
                  key={rel.id}
                  onClick={() => onSelectRelatedItem(rel)}
                  className="group rounded-xl overflow-hidden bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 cursor-pointer p-2 transition-all"
                >
                  <img src={rel.posterUrl} alt={rel.title} className="w-full aspect-[2/3] object-cover rounded-lg mb-2" />
                  <p className="text-xs font-bold text-white group-hover:text-cyan-400 truncate">{rel.title}</p>
                  <p className="text-[10px] text-slate-400">{rel.releaseYear} • {rel.rating}★</p>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
