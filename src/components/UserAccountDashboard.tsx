import React, { useState } from 'react';
import {
  User,
  CreditCard,
  RotateCcw,
  Bookmark,
  Download,
  Bell,
  Trash2,
  Play,
  CheckCircle2,
  Calendar,
  ShieldCheck,
  Zap,
  ExternalLink,
  Clock,
  Sparkles,
  HardDrive
} from 'lucide-react';
import {
  UserProfile,
  WatchHistoryEntry,
  MovieItem,
  SeriesItem,
  DownloadedItem,
  PaymentTransaction,
  NotificationItem
} from '../types';
import {
  getStoredTransactions
} from '../services/paymentService';
import {
  clearWatchHistory,
  removeDownloadItem,
  markNotificationAsRead
} from '../services/contentStorage';

interface UserAccountDashboardProps {
  user: UserProfile;
  watchHistory: WatchHistoryEntry[];
  watchlistItems: (MovieItem | SeriesItem)[];
  downloads: DownloadedItem[];
  notifications: NotificationItem[];
  onSelectMovie: (movie: MovieItem) => void;
  onSelectSeries: (series: SeriesItem, seasonNumber?: number, episodeNumber?: number) => void;
  onOpenSubscribe: () => void;
  onRefreshData: () => void;
  onToggleWatchlist: (id: string) => void;
}

export const UserAccountDashboard: React.FC<UserAccountDashboardProps> = ({
  user,
  watchHistory = [],
  watchlistItems = [],
  downloads = [],
  notifications = [],
  onSelectMovie,
  onSelectSeries,
  onOpenSubscribe,
  onRefreshData,
  onToggleWatchlist
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'watchlist' | 'downloads' | 'payments' | 'notifications'>('overview');
  const transactions: PaymentTransaction[] = getStoredTransactions();

  const handleClearHistory = () => {
    clearWatchHistory();
    onRefreshData();
  };

  const handleRemoveDownload = (id: string) => {
    removeDownloadItem(id);
    onRefreshData();
  };

  const handleMarkNotification = (id: string) => {
    markNotificationAsRead(id);
    onRefreshData();
  };

  const isVip = Boolean(user.role === 'ADMIN' || (user.subscription && user.subscription.status === 'ACTIVE'));

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-8 space-y-8 select-none">
      
      {/* Account Hero Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-blue-950/70 via-slate-900/90 to-cyan-950/50 border border-cyan-500/30 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
              alt={user.name}
              className="w-20 h-20 rounded-2xl object-cover ring-2 ring-cyan-400/60 shadow-xl"
            />
            {isVip && (
              <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-cyan-400 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-[0_0_8px_#00f0ff]">
                VIP
              </span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-white">{user.name}</h1>
              {user.role === 'ADMIN' && (
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-blue-600 text-white uppercase">
                  SUPER ADMIN
                </span>
              )}
            </div>

            <p className="text-xs text-slate-400 font-mono mt-0.5">{user.email}</p>
            <p className="text-[11px] text-cyan-400 font-semibold mt-1">
              {isVip ? `Active Subscription: ${user.subscription?.planName || 'VIP Unlimited'}` : 'Free Tier Account'}
            </p>
          </div>
        </div>

        {/* Upgrade / Manage Subscription CTA */}
        <div className="flex items-center gap-3">
          {!isVip ? (
            <button
              onClick={onOpenSubscribe}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-slate-950 font-black text-xs shadow-xl shadow-cyan-950/50 hover:scale-105 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>Get VIP Pass (500 RWF)</span>
            </button>
          ) : (
            <button
              onClick={onOpenSubscribe}
              className="px-5 py-2.5 rounded-2xl bg-slate-900 border border-cyan-500/40 text-cyan-300 hover:text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
            >
              <CreditCard className="w-4 h-4 text-cyan-400" />
              <span>Change Subscription Plan</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar border-b border-slate-800 pb-2">
        {[
          { id: 'overview', label: 'Subscription & Profile', icon: User },
          { id: 'history', label: `Watch History (${watchHistory.length})`, icon: RotateCcw },
          { id: 'watchlist', label: `My List (${watchlistItems.length})`, icon: Bookmark },
          { id: 'downloads', label: `Downloads (${downloads.length})`, icon: Download },
          { id: 'payments', label: `Payments (${transactions.length})`, icon: CreditCard },
          { id: 'notifications', label: `Notifications (${notifications.length})`, icon: Bell }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ==========================================
          TAB 1: SUBSCRIPTION & OVERVIEW
          ========================================== */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Subscription Card */}
          <div className="md:col-span-2 p-6 rounded-3xl bg-slate-900/80 border border-blue-900/30 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-cyan-400" /> Current Membership
              </span>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_8px_rgba(0,229,255,0.3)]">
                {isVip ? 'ACTIVE VIP' : 'FREE TIER'}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-white">
                  {user.subscription?.planName || 'Free Standard Access'}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {isVip
                    ? `Renews on ${new Date(user.subscription?.expiryDate || Date.now()).toLocaleDateString()}`
                    : 'Upgrade to watch all VIP episodes and download movies offline.'}
                </p>
              </div>

              <button
                onClick={onOpenSubscribe}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 text-slate-950 text-xs font-black shrink-0 cursor-pointer shadow-[0_0_12px_#00e5ff]"
              >
                {isVip ? 'Renew / Upgrade' : 'Unlock VIP Now'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Streaming Quality</span>
                <span className="text-sm font-black text-cyan-400">{isVip ? '1080p Full HD' : '720p HD'}</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Concurrent Devices</span>
                <span className="text-sm font-black text-white">{isVip ? 'Up to 4 Screens' : '1 Device'}</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Offline Downloads</span>
                <span className="text-sm font-black text-blue-400">{isVip ? 'Unlimited' : 'Disabled'}</span>
              </div>
            </div>
          </div>

          {/* Quick Stats Panel */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-blue-900/30 shadow-xl space-y-4">
            <span className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
              <HardDrive className="w-4 h-4 text-blue-400" /> Account Storage & Stats
            </span>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Watchlist Items:</span>
                <span className="font-bold text-white">{user.watchlist.length}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>History Items:</span>
                <span className="font-bold text-white">{watchHistory.length}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Downloaded Content:</span>
                <span className="font-bold text-white">{downloads.length} files</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Member Since:</span>
                <span className="font-bold text-slate-400">{new Date(user.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 2: WATCH HISTORY
          ========================================== */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-white">Your Streaming History</h2>
            {watchHistory.length > 0 && (
              <button
                onClick={handleClearHistory}
                className="px-3 py-1.5 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 hover:text-white text-xs font-bold flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear History
              </button>
            )}
          </div>

          {watchHistory.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              You haven't watched any movies or series yet. Start streaming from the catalog!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {watchHistory.map((item) => (
                <div
                  key={item.contentId}
                  className="p-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-blue-500/60 flex flex-col justify-between shadow-lg group"
                >
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-black mb-3">
                    <img src={item.posterUrl} alt={item.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <button
                        onClick={() => {
                          if (item.seriesId) {
                            const dummySer = { id: item.seriesId, title: item.seriesTitle || item.title } as any;
                            onSelectSeries(dummySer, item.seasonNumber || 1, item.episodeNumber || 1);
                          }
                        }}
                        className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg"
                      >
                        <Play className="w-4 h-4 fill-current translate-x-0.5" />
                      </button>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-800">
                      <div className="h-full bg-cyan-400 shadow-[0_0_8px_#00f0ff]" style={{ width: `${item.progressPercent}%` }} />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-white truncate">{item.title}</h3>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 font-mono">
                      <span>{item.progressPercent}% finished</span>
                      <span>{new Date(item.lastWatched).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==========================================
          TAB 3: MY LIST / WATCHLIST
          ========================================== */}
      {activeTab === 'watchlist' && (
        <div className="space-y-4">
          <h2 className="text-base font-black text-white">Your Saved Favorites</h2>

          {watchlistItems.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              Your watchlist is empty. Add movies and series to your list to watch later.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {watchlistItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    if ('seasons' in item) {
                      onSelectSeries(item as SeriesItem, 1, 1);
                    } else {
                      onSelectMovie(item as MovieItem);
                    }
                  }}
                  className="group relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 hover:border-blue-500/60 cursor-pointer transition-all flex flex-col shadow-lg"
                >
                  <div className="relative aspect-[2/3] w-full overflow-hidden bg-black">
                    <img src={item.posterUrl} alt={item.title} className="w-full h-full object-cover" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleWatchlist(item.id);
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-red-600/80 text-white hover:bg-red-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="p-2.5">
                    <h3 className="text-xs font-bold text-white truncate">{item.title}</h3>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==========================================
          TAB 4: OFFLINE DOWNLOADS
          ========================================== */}
      {activeTab === 'downloads' && (
        <div className="space-y-4">
          <h2 className="text-base font-black text-white">Downloaded Files for Offline Viewing</h2>

          {downloads.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              No offline downloads. As a VIP member, click 'Download' on any movie or episode to save for offline viewing.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {downloads.map((dl) => (
                <div
                  key={dl.id}
                  className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3 shadow-lg"
                >
                  <div className="flex items-center gap-3">
                    <img src={dl.posterUrl} alt={dl.title} className="w-12 h-16 rounded-xl object-cover shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-white">{dl.title}</h4>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {dl.fileSizeMb} MB • {dl.quality} Full HD
                      </p>
                      <span className="text-[9px] text-cyan-400 font-bold flex items-center gap-1 mt-1">
                        <CheckCircle2 className="w-3 h-3" /> Ready Offline
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemoveDownload(dl.id)}
                    className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-950/40 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==========================================
          TAB 5: PAYMENT TRANSACTIONS
          ========================================== */}
      {activeTab === 'payments' && (
        <div className="space-y-4">
          <h2 className="text-base font-black text-white">Payment & Billing History</h2>

          {transactions.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              No transactions recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900 text-[10px] font-black uppercase text-slate-400">
                  <tr>
                    <th className="p-3">Reference ID</th>
                    <th className="p-3">Plan</th>
                    <th className="p-3">Method</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-900/50">
                      <td className="p-3 font-mono font-bold text-white">{tx.paymentReference || tx.id}</td>
                      <td className="p-3">{tx.planName}</td>
                      <td className="p-3 font-semibold text-blue-400">{tx.paymentMethod}</td>
                      <td className="p-3 font-mono font-bold text-cyan-400">{tx.amount} {tx.currency}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                          {tx.status}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400">{new Date(tx.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ==========================================
          TAB 6: NOTIFICATIONS
          ========================================== */}
      {activeTab === 'notifications' && (
        <div className="space-y-3">
          <h2 className="text-base font-black text-white">System Announcements & Updates</h2>

          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => handleMarkNotification(n.id)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                n.isRead
                  ? 'bg-slate-900/50 border-slate-800'
                  : 'bg-blue-600/10 border-blue-500/50 shadow-md'
              }`}
            >
              <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center shrink-0">
                <Bell className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white">{n.title}</h4>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(n.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">{n.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
