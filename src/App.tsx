import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from './components/Header';
import { SideDock } from './components/SideDock';
import { MobileFooterNav } from './components/MobileFooterNav';
import { SettingsHubModal } from './components/SettingsHubModal';
import { HomeStreamingView } from './components/HomeStreamingView';
import { MovieSearchSplitView } from './components/MovieSearchSplitView';
import { SeriesWatchPage } from './components/SeriesWatchPage';
import { MovieWatchPage } from './components/MovieWatchPage';
import { LiveTVPage } from './components/LiveTVPage';
import { FMRadioPage } from './components/FMRadioPage';
import { CategoriesView } from './components/CategoriesView';
import { UserAccountDashboard } from './components/UserAccountDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { SubscriptionModal } from './components/SubscriptionModal';
import { MovieDetailsModal } from './components/MovieDetailsModal';
import { CommunityChatModal } from './components/CommunityChatModal';
import { DeveloperPortalModal } from './components/DeveloperPortalModal';
import { LiveMatchesPage } from './components/LiveMatchesPage';
import { RequestMovieModal } from './components/RequestMovieModal';
import { Footer } from './components/Footer';
import { MediaCoreLoading } from './components/MediaCoreLoading';
import { ThreeDCinemaStage, StageModelId } from './components/ThreeDCinemaStage';

// Types & Data services
import {
  MovieItem,
  SeriesItem,
  TVChannelItem,
  UserProfile,
  SubscriptionPlan,
  WatchHistoryEntry,
  DownloadedItem,
  NotificationItem,
  CategoryItem,
  PlatformSettings,
  DeveloperProfile
} from './types';
import {
  getStoredMovies,
  getStoredSeries,
  getStoredChannels,
  getStoredPlans,
  getStoredUserProfile,
  getStoredWatchHistory,
  getStoredWatchlist,
  getStoredDownloads,
  getStoredNotifications,
  getStoredSettings,
  getStoredDeveloperProfile,
  saveStoredDeveloperProfile,
  saveWatchHistoryEntry,
  toggleWatchlistItem,
  addDownloadItem
} from './services/contentStorage';

export default function App() {
  // Central tab navigation state
  const [activeTab, setActiveTab] = useState<
    'home' | 'movies' | 'series' | 'channels' | 'matches' | 'radio' | 'trending' | 'search' | 'categories' | 'watchlist' | 'account' | 'admin'
  >('home');

  // Search initial query/category state - default to Movies
  const [searchInitialQuery, setSearchInitialQuery] = useState<string>('');
  const [searchInitialCategory, setSearchInitialCategory] = useState<string>('Movies');

  // Loaded Application Data
  const [movies, setMovies] = useState<MovieItem[]>([]);
  const [series, setSeries] = useState<SeriesItem[]>([]);
  const [channels, setChannels] = useState<TVChannelItem[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [user, setUser] = useState<UserProfile>(getStoredUserProfile());
  const [developer, setDeveloper] = useState<DeveloperProfile>(getStoredDeveloperProfile());
  const [watchHistory, setWatchHistory] = useState<WatchHistoryEntry[]>([]);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [downloads, setDownloads] = useState<DownloadedItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [settings, setSettings] = useState<PlatformSettings>(getStoredSettings());

  // Active Playback Contexts
  const [selectedMovie, setSelectedMovie] = useState<MovieItem | null>(null);
  const [selectedSeries, setSelectedSeries] = useState<SeriesItem | null>(null);
  const [selectedSeasonNumber, setSelectedSeasonNumber] = useState<number>(1);
  const [selectedEpisodeNumber, setSelectedEpisodeNumber] = useState<number>(1);
  const [selectedChannel, setSelectedChannel] = useState<TVChannelItem | null>(null);

  // Modals state
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubscribeModalOpen, setIsSubscribeModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [isDeveloperPortalOpen, setIsDeveloperPortalOpen] = useState<boolean>(false);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState<boolean>(false);
  const [previewQuickItem, setPreviewQuickItem] = useState<MovieItem | SeriesItem | null>(null);
  const [threeDStageState, setThreeDStageState] = useState<{ isOpen: boolean; model: StageModelId }>({
    isOpen: false,
    model: 'projector',
  });

  // Trigger replay of MediaCoreTV cinematic loading animation
  const handleReplayIntro = () => {
    setIsLoading(true);
  };

  // Refresh all state from repositories
  const refreshAppData = () => {
    const loadedMovies = getStoredMovies();
    const loadedSeries = getStoredSeries();
    const loadedChannels = getStoredChannels();
    const loadedPlans = getStoredPlans();
    const loadedUser = getStoredUserProfile();
    const loadedDev = getStoredDeveloperProfile();
    const loadedHistory = getStoredWatchHistory();
    const loadedWatchlist = getStoredWatchlist();
    const loadedDownloads = getStoredDownloads();
    const loadedNotifs = getStoredNotifications();
    const loadedSettings = getStoredSettings();

    setMovies(loadedMovies);
    setSeries(loadedSeries);
    setChannels(loadedChannels);
    setPlans(loadedPlans);
    setUser(loadedUser);
    setDeveloper(loadedDev);
    setWatchHistory(loadedHistory);
    setWatchlist(loadedWatchlist);
    setDownloads(loadedDownloads);
    setNotifications(loadedNotifs);
    setSettings(loadedSettings);

    setCategories([
      { id: 'cat_agasobanuye', name: 'Agasobanuye', slug: 'agasobanuye', icon: '🇷🇼', isActive: true },
      { id: 'cat_action', name: 'Action', slug: 'action', icon: '💥', isActive: true },
      { id: 'cat_drama', name: 'Drama', slug: 'drama', icon: '🎭', isActive: true },
      { id: 'cat_scifi', name: 'Sci-Fi', slug: 'sci-fi', icon: '🚀', isActive: true },
      { id: 'cat_crime', name: 'Crime & Thriller', slug: 'crime', icon: '🕵️', isActive: true },
      { id: 'cat_rwandan', name: 'Rwandan Cinema', slug: 'rwandan-cinema', icon: '🇷🇼', isActive: true },
      { id: 'cat_romance', name: 'Romance', slug: 'romance', icon: '❤️', isActive: true },
      { id: 'cat_comedy', name: 'Comedy', slug: 'comedy', icon: '😂', isActive: true },
      { id: 'cat_anime', name: 'Anime', slug: 'anime', icon: '⚡', isActive: true }
    ]);
  };

  useEffect(() => {
    refreshAppData();
  }, []);

  // Handler to toggle watchlist
  const handleToggleWatchlist = (id: string) => {
    const updated = toggleWatchlistItem(id);
    setWatchlist(updated);
    setUser((prev) => ({ ...prev, watchlist: updated }));
  };

  // Handler to record watch progress
  const handleRecordProgress = (entry: WatchHistoryEntry) => {
    saveWatchHistoryEntry(entry);
    setWatchHistory(getStoredWatchHistory());
  };

  // Handler to download item
  const handleDownload = (item: DownloadedItem) => {
    addDownloadItem(item);
    setDownloads(getStoredDownloads());
  };

  // Open search split view - defaults to Movies
  const handleOpenSearch = (category: string = 'Movies') => {
    setSearchInitialCategory(category);
    setActiveTab('search');
  };

  // Memoized featured collections to prevent unnecessary child re-renders
  const featuredMovies = useMemo(() => movies.filter((m) => m.isFeatured), [movies]);
  const featuredSeries = useMemo(() => series.filter((s) => s.isFeatured), [series]);

  // Stable loading completion callback
  const handleCompleteLoading = useCallback(() => {
    setIsLoading(false);
  }, []);

  // Watchlist full items for Account Dashboard
  const watchlistFullItems: (MovieItem | SeriesItem)[] = useMemo(() => [
    ...movies.filter((m) => watchlist.includes(m.id)),
    ...series.filter((s) => watchlist.includes(s.id))
  ], [movies, series, watchlist]);

  return (
    <div className="relative min-h-screen bg-[#050a16] text-slate-100 font-sans selection:bg-yellow-400 selection:text-slate-950 overflow-x-hidden flex flex-col select-none rwanda-ambient-bg">
      
      {/* ==========================================
          1. TOP NAVIGATION HEADER
          ========================================== */}
      <Header
        activeTab={activeTab}
        setActiveTab={(tab) => setActiveTab(tab as any)}
        onOpenSearch={() => handleOpenSearch('Movies')}
        onOpenSubscribe={() => setIsSubscribeModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenDeveloper={() => setIsDeveloperPortalOpen(true)}
        onOpenRequestModal={() => setIsRequestModalOpen(true)}
        onReplayIntro={handleReplayIntro}
        user={user}
        watchlistCount={watchlist.length}
      />

      {/* ==========================================
          2. FLOATING LEFT CAPSULE SIDE DOCK (DESKTOP)
          ========================================== */}
      <SideDock
        activeTab={activeTab}
        setActiveTab={(tab) => setActiveTab(tab as any)}
        onOpenSearch={() => handleOpenSearch('Movies')}
        onOpenChat={() => setIsChatOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpen3DStage={() =>
          setThreeDStageState({
            isOpen: true,
            model: activeTab === 'matches' ? 'trophy' : activeTab === 'channels' ? 'satellite' : 'projector',
          })
        }
      />

      {/* ==========================================
          3. MAIN CONTENT ROUTER & VIEWPORT
          ========================================== */}
      <main className="flex-1 w-full transition-all pl-0 md:pl-16 pb-20 md:pb-0">
        
        {/* VIEW 1: HOME STREAMING HUB */}
        {activeTab === 'home' && (
          <HomeStreamingView
            featuredSeries={featuredSeries}
            featuredMovies={featuredMovies}
            allSeries={series}
            allMovies={movies}
            liveChannels={channels}
            watchHistory={watchHistory}
            user={user}
            onSelectMovie={(movie) => {
              setSelectedMovie(movie);
              setActiveTab('movies');
            }}
            onSelectSeries={(ser, seasonNum = 1, epNum = 1) => {
              setSelectedSeries(ser);
              setSelectedSeasonNumber(seasonNum);
              setSelectedEpisodeNumber(epNum);
              setActiveTab('series');
            }}
            onSelectChannel={(ch) => {
              setSelectedChannel(ch);
              setActiveTab('channels');
            }}
            onOpenSubscribe={() => setIsSubscribeModalOpen(true)}
            onOpenSearch={() => handleOpenSearch('Movies')}
            onToggleWatchlist={handleToggleWatchlist}
            onQuickPreview={(item) => setPreviewQuickItem(item)}
            onOpenMatches={() => setActiveTab('matches')}
            onOpenRequestModal={() => setIsRequestModalOpen(true)}
          />
        )}

        {/* VIEW 2: LIVE TV BROADCAST PAGE WITH DEDICATED TV SEARCH TAB */}
        {activeTab === 'channels' && (
          <LiveTVPage
            channels={channels}
            initialChannelId={selectedChannel?.id}
            onBack={() => setActiveTab('home')}
          />
        )}

        {/* VIEW 2B: LIVE FOOTBALL & SPORTS BROADCAST (IMIKINO YA NONE LIVE) */}
        {activeTab === 'matches' && (
          <LiveMatchesPage onBack={() => setActiveTab('home')} />
        )}

        {/* VIEW 3: SEARCH & MOVIES SPLIT VIEW */}
        {(activeTab === 'search' || activeTab === 'trending') && (
          <MovieSearchSplitView
            movies={movies}
            series={series}
            channels={channels}
            user={user}
            initialQuery={searchInitialQuery}
            initialCategory={activeTab === 'trending' ? 'Trending' : searchInitialCategory || 'Movies'}
            onSelectMovie={(movie) => {
              setSelectedMovie(movie);
              setActiveTab('movies');
            }}
            onSelectSeries={(ser, seasonNum = 1, epNum = 1) => {
              setSelectedSeries(ser);
              setSelectedSeasonNumber(seasonNum);
              setSelectedEpisodeNumber(epNum);
              setActiveTab('series');
            }}
            onSelectChannel={(ch) => {
              setSelectedChannel(ch);
              setActiveTab('channels');
            }}
            onOpenSubscribe={() => setIsSubscribeModalOpen(true)}
            onToggleWatchlist={handleToggleWatchlist}
            onOpenMovieDetails={(item) => setPreviewQuickItem(item)}
          />
        )}

        {/* VIEW 3: MOVIES EXPLORER / DEDICATED WATCH PAGE */}
        {activeTab === 'movies' && (
          <div>
            {selectedMovie ? (
              <MovieWatchPage
                movie={selectedMovie}
                allMovies={movies}
                user={user}
                onBack={() => setSelectedMovie(null)}
                onOpenSubscribe={() => setIsSubscribeModalOpen(true)}
                onSelectMovie={(mov) => setSelectedMovie(mov)}
                onToggleWatchlist={handleToggleWatchlist}
                isWatchlisted={watchlist.includes(selectedMovie.id)}
              />
            ) : (
              <MovieSearchSplitView
                movies={movies}
                series={series}
                channels={channels}
                user={user}
                initialCategory="Movies"
                onSelectMovie={(movie) => {
                  setSelectedMovie(movie);
                }}
                onSelectSeries={(ser, seasonNum = 1, epNum = 1) => {
                  setSelectedSeries(ser);
                  setSelectedSeasonNumber(seasonNum);
                  setSelectedEpisodeNumber(epNum);
                  setActiveTab('series');
                }}
                onSelectChannel={(ch) => {
                  setSelectedChannel(ch);
                }}
                onOpenSubscribe={() => setIsSubscribeModalOpen(true)}
                onToggleWatchlist={handleToggleWatchlist}
                onOpenMovieDetails={(item) => setPreviewQuickItem(item)}
              />
            )}
          </div>
        )}

        {/* VIEW 4: TV SERIES & SEASONS WATCH VIEW */}
        {activeTab === 'series' && (
          <SeriesWatchPage
            series={selectedSeries || series[0]}
            allSeries={series}
            initialSeasonNumber={selectedSeasonNumber}
            initialEpisodeNumber={selectedEpisodeNumber}
            user={user}
            onOpenSubscribe={() => setIsSubscribeModalOpen(true)}
            onSelectSeries={(ser, seaNum = 1, epNum = 1) => {
              setSelectedSeries(ser);
              setSelectedSeasonNumber(seaNum);
              setSelectedEpisodeNumber(epNum);
            }}
            onRecordProgress={handleRecordProgress}
            onDownloadEpisode={handleDownload}
            onToggleWatchlist={handleToggleWatchlist}
          />
        )}

        {/* VIEW 5: FM RADIO LIVE TUNER PAGE */}
        {activeTab === 'radio' && (
          <FMRadioPage onBackToHome={() => setActiveTab('home')} />
        )}

        {/* VIEW 6: CATEGORIES & GENRES VIEW */}
        {activeTab === 'categories' && (
          <CategoriesView
            categories={categories}
            movies={movies}
            series={series}
            onSelectMovie={(mov) => {
              setSelectedMovie(mov);
              setActiveTab('movies');
            }}
            onSelectSeries={(ser, seasonNum = 1, epNum = 1) => {
              setSelectedSeries(ser);
              setSelectedSeasonNumber(seasonNum);
              setSelectedEpisodeNumber(epNum);
              setActiveTab('series');
            }}
          />
        )}

        {/* VIEW 7: USER ACCOUNT, SUBSCRIPTION & WATCHLIST DASHBOARD */}
        {(activeTab === 'account' || activeTab === 'watchlist') && (
          <UserAccountDashboard
            user={user}
            watchHistory={watchHistory}
            watchlistItems={watchlistFullItems}
            downloads={downloads}
            notifications={notifications}
            onSelectMovie={(mov) => {
              setSelectedMovie(mov);
              setActiveTab('movies');
            }}
            onSelectSeries={(ser, seaNum = 1, epNum = 1) => {
              setSelectedSeries(ser);
              setSelectedSeasonNumber(seaNum);
              setSelectedEpisodeNumber(epNum);
              setActiveTab('series');
            }}
            onOpenSubscribe={() => setIsSubscribeModalOpen(true)}
            onRefreshData={refreshAppData}
            onToggleWatchlist={handleToggleWatchlist}
          />
        )}

        {/* VIEW 8: ADMIN CONTROL DASHBOARD */}
        {activeTab === 'admin' && (
          <AdminDashboard
            movies={movies}
            series={series}
            channels={channels}
            plans={plans}
            settings={settings}
            developer={developer}
            onUpdateDeveloper={(dev) => setDeveloper(dev)}
            onOpenDeveloperPreview={() => setIsDeveloperPortalOpen(true)}
            onRefreshData={refreshAppData}
            onExitAdmin={() => setActiveTab('home')}
          />
        )}

        {/* Unified Footer */}
        {activeTab !== 'admin' && (
          <Footer
            onOpenAdmin={() => setActiveTab('admin')}
            setActiveTab={(tab) => setActiveTab(tab as any)}
            onOpenSubscribe={() => setIsSubscribeModalOpen(true)}
            onOpenSettings={() => setIsSettingsModalOpen(true)}
            onOpenDeveloper={() => setIsDeveloperPortalOpen(true)}
            onReplayIntro={handleReplayIntro}
          />
        )}

      </main>

      {/* ==========================================
          4. MOBILE FOOTER NAVIGATION (HORIZONTAL BOTTOM TAB FOR PHONES)
          ========================================== */}
      {activeTab !== 'admin' && (
        <MobileFooterNav
          activeTab={activeTab}
          setActiveTab={(tab) => setActiveTab(tab as any)}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
          onOpenSearch={() => handleOpenSearch('All')}
          user={user}
          watchlistCount={watchlist.length}
        />
      )}

      {/* ==========================================
          5. SETTINGS & ACCOUNT / PAYMENTS HUB MODAL
          ========================================== */}
      <SettingsHubModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        user={user}
        plans={plans}
        downloads={downloads}
        onOpenSubscribe={() => {
          setIsSettingsModalOpen(false);
          setIsSubscribeModalOpen(true);
        }}
        onOpenAdmin={() => {
          setIsSettingsModalOpen(false);
          setActiveTab('admin');
        }}
        onRefreshData={refreshAppData}
        onReplayIntro={handleReplayIntro}
      />

      {/* ==========================================
          MODALS & OVERLAYS
          ========================================== */}
      
      {/* Subscription & Payment Modal (MTN MoMo, Airtel Money, Card) */}
      <SubscriptionModal
        isOpen={isSubscribeModalOpen}
        onClose={() => setIsSubscribeModalOpen(false)}
        plans={plans}
        user={user}
        onSuccess={() => {
          refreshAppData();
        }}
      />

      {/* Movie / Series Quick Preview Modal */}
      <MovieDetailsModal
        item={previewQuickItem}
        isOpen={Boolean(previewQuickItem)}
        onClose={() => setPreviewQuickItem(null)}
        user={user}
        onPlayMovie={(mov) => {
          setSelectedMovie(mov);
          setActiveTab('movies');
        }}
        onPlaySeries={(ser) => {
          setSelectedSeries(ser);
          setSelectedSeasonNumber(1);
          setSelectedEpisodeNumber(1);
          setActiveTab('series');
        }}
        onToggleWatchlist={handleToggleWatchlist}
      />

      {/* Community Live Chat Modal */}
      <CommunityChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        user={user}
        currentTitle={selectedMovie?.title || selectedChannel?.name || 'MediaCoreTV'}
      />

      {/* Request Movie Modal ("Saba Filime" - Agasobanuye Free Feature) */}
      <RequestMovieModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
      />

      {/* Developer Portal & Direct Contacts Modal */}
      <DeveloperPortalModal
        isOpen={isDeveloperPortalOpen}
        onClose={() => setIsDeveloperPortalOpen(false)}
        developer={developer}
      />

      {/* Interactive 3D Cinema & Sports Studio Stage (Three.js) */}
      <ThreeDCinemaStage
        isOpen={threeDStageState.isOpen}
        initialModel={threeDStageState.model}
        onClose={() => setThreeDStageState((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* ==========================================
          6. MEDIACORETV PREMIUM LOADING ANIMATION OVERLAY
          ========================================== */}
      <MediaCoreLoading
        isOpen={isLoading}
        onComplete={handleCompleteLoading}
        minDuration={2400}
        tagline="STREAM • WATCH • ENJOY"
        allowSkip={true}
      />

    </div>
  );
}
