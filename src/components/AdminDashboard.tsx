import React, { useState } from 'react';
import {
  Shield,
  ShieldCheck,
  Film,
  Layers,
  Tv,
  CreditCard,
  Bell,
  Settings,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Play,
  Search,
  ExternalLink,
  Users,
  Eye,
  AlertCircle,
  Save,
  Radio,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Code2,
  MessageCircle,
  Instagram,
  Facebook,
  Mail,
  Globe,
  Smartphone,
  MapPin,
  Briefcase
} from 'lucide-react';
import { AdminSecuritySection } from './AdminSecuritySection';
import {
  MovieItem,
  SeriesItem,
  SeasonItem,
  EpisodeItem,
  TVChannelItem,
  SubscriptionPlan,
  PaymentTransaction,
  NotificationItem,
  PlatformSettings,
  ContentAccess,
  DeveloperProfile
} from '../types';
import {
  saveMovie,
  deleteMovie,
  saveSeries,
  deleteSeries,
  saveSeasonToSeries,
  deleteSeasonFromSeries,
  saveEpisodeToSeason,
  deleteEpisodeFromSeason,
  saveChannel,
  deleteChannel,
  savePlan,
  deletePlan,
  addNotification,
  saveStoredSettings,
  getStoredDeveloperProfile,
  saveStoredDeveloperProfile
} from '../services/contentStorage';
import { getStoredTransactions } from '../services/paymentService';
import { VideoPlayer } from './VideoPlayer';
import { AdminTmdbExplorer } from './AdminTmdbExplorer';

interface AdminDashboardProps {
  movies: MovieItem[];
  series: SeriesItem[];
  channels: TVChannelItem[];
  plans: SubscriptionPlan[];
  settings: PlatformSettings;
  developer?: DeveloperProfile;
  onUpdateDeveloper?: (dev: DeveloperProfile) => void;
  onOpenDeveloperPreview?: () => void;
  onRefreshData: () => void;
  onExitAdmin: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  movies = [],
  series = [],
  channels = [],
  plans = [],
  settings,
  developer,
  onUpdateDeveloper,
  onOpenDeveloperPreview,
  onRefreshData,
  onExitAdmin
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'tmdb' | 'developer' | 'movies' | 'series' | 'channels' | 'plans' | 'payments' | 'notifications' | 'settings'>('developer');

  // Filter state for movies list
  const [movieFilterQuery, setMovieFilterQuery] = useState('');

  // ==========================================
  // STATE FOR DEVELOPER PROFILE
  // ==========================================
  const [devProfile, setDevProfile] = useState<DeveloperProfile>(() => {
    return developer || getStoredDeveloperProfile();
  });
  const [devSaveSuccess, setDevSaveSuccess] = useState(false);
  const [skillsInput, setSkillsInput] = useState(() => (devProfile.skills || []).join(', '));

  // ==========================================
  // STATE FOR MOVIE EDITING MODAL
  // ==========================================
  const [editingMovie, setEditingMovie] = useState<MovieItem | null>(null);
  const [isMovieModalOpen, setIsMovieModalOpen] = useState(false);

  // ==========================================
  // STATE FOR SERIES / SEASONS / EPISODES
  // ==========================================
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(series[0]?.id || null);
  const [editingSeries, setEditingSeries] = useState<SeriesItem | null>(null);
  const [isSeriesModalOpen, setIsSeriesModalOpen] = useState(false);
  
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null);
  const [editingSeason, setEditingSeason] = useState<SeasonItem | null>(null);
  const [isSeasonModalOpen, setIsSeasonModalOpen] = useState(false);

  const [editingEpisode, setEditingEpisode] = useState<EpisodeItem | null>(null);
  const [isEpisodeModalOpen, setIsEpisodeModalOpen] = useState(false);

  // ==========================================
  // STATE FOR TV CHANNELS EDITING & LIVE TEST
  // ==========================================
  const [editingChannel, setEditingChannel] = useState<TVChannelItem | null>(null);
  const [isChannelModalOpen, setIsChannelModalOpen] = useState(false);
  const [previewTestStreamUrl, setPreviewTestStreamUrl] = useState<string | null>(null);

  // ==========================================
  // STATE FOR NOTIFICATION BROADCAST
  // ==========================================
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifType, setNotifType] = useState<'announcement' | 'movie' | 'series'>('announcement');
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  // Active Series & Season context
  const activeSeries = series.find((s) => s.id === selectedSeriesId) || series[0];
  const activeSeason = activeSeries?.seasons?.find((sea) => sea.id === selectedSeasonId) || activeSeries?.seasons?.[0];

  const transactions: PaymentTransaction[] = getStoredTransactions();

  // ==========================================
  // HANDLERS: MOVIES
  // ==========================================
  const handleSaveMovie = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMovie) return;
    saveMovie(editingMovie);
    setIsMovieModalOpen(false);
    setEditingMovie(null);
    onRefreshData();
  };

  const handleDeleteMovie = (id: string) => {
    if (window.confirm('Are you sure you want to delete this movie?')) {
      deleteMovie(id);
      onRefreshData();
    }
  };

  // ==========================================
  // HANDLERS: SERIES
  // ==========================================
  const handleSaveSeries = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSeries) return;
    saveSeries(editingSeries);
    setIsSeriesModalOpen(false);
    setEditingSeries(null);
    onRefreshData();
  };

  const handleDeleteSeries = (id: string) => {
    if (window.confirm('Delete this series and all its seasons & episodes?')) {
      deleteSeries(id);
      onRefreshData();
    }
  };

  // ==========================================
  // HANDLERS: SEASONS
  // ==========================================
  const handleSaveSeason = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSeries || !editingSeason) return;
    saveSeasonToSeries(activeSeries.id, editingSeason);
    setIsSeasonModalOpen(false);
    setEditingSeason(null);
    onRefreshData();
  };

  const handleDeleteSeason = (seasonId: string) => {
    if (!activeSeries) return;
    if (window.confirm('Delete this season and all its episodes?')) {
      deleteSeasonFromSeries(activeSeries.id, seasonId);
      onRefreshData();
    }
  };

  // ==========================================
  // HANDLERS: EPISODES
  // ==========================================
  const handleSaveEpisode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSeries || !activeSeason || !editingEpisode) return;
    saveEpisodeToSeason(activeSeries.id, activeSeason.id, editingEpisode);
    setIsEpisodeModalOpen(false);
    setEditingEpisode(null);
    onRefreshData();
  };

  const handleDeleteEpisode = (episodeId: string) => {
    if (!activeSeries || !activeSeason) return;
    if (window.confirm('Delete this episode?')) {
      deleteEpisodeFromSeason(activeSeries.id, activeSeason.id, episodeId);
      onRefreshData();
    }
  };

  // ==========================================
  // HANDLERS: TV CHANNELS
  // ==========================================
  const handleSaveChannel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChannel) return;
    saveChannel(editingChannel);
    setIsChannelModalOpen(false);
    setEditingChannel(null);
    onRefreshData();
  };

  const handleDeleteChannel = (id: string) => {
    if (window.confirm('Delete this TV channel?')) {
      deleteChannel(id);
      onRefreshData();
    }
  };

  // ==========================================
  // HANDLERS: DEVELOPER PROFILE & CONTACTS
  // ==========================================
  const handleSaveDeveloper = (e: React.FormEvent) => {
    e.preventDefault();
    const skillsArray = skillsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const updatedProfile: DeveloperProfile = {
      ...devProfile,
      skills: skillsArray
    };

    saveStoredDeveloperProfile(updatedProfile);
    setDevProfile(updatedProfile);
    if (onUpdateDeveloper) {
      onUpdateDeveloper(updatedProfile);
    }
    setDevSaveSuccess(true);
    setTimeout(() => setDevSaveSuccess(false), 3500);
  };

  // ==========================================
  // HANDLERS: BROADCAST NOTIFICATIONS
  // ==========================================
  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifMessage.trim()) return;

    addNotification({
      title: notifTitle,
      message: notifMessage,
      type: notifType
    });

    setNotifTitle('');
    setNotifMessage('');
    setBroadcastSuccess(true);
    setTimeout(() => setBroadcastSuccess(false), 3000);
    onRefreshData();
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-white p-4 sm:p-8 max-w-[1600px] mx-auto select-none space-y-8">
      
      {/* Top Admin Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900/90 border border-blue-900/40 shadow-2xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-400 to-blue-600 p-0.5 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full bg-[#080d1a] rounded-[14px] flex items-center justify-center">
              <Shield className="w-6 h-6 text-cyan-400" />
            </div>
          </div>

          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide flex items-center gap-2">
              LIONEL STREAM CONTROL PANEL
            </h1>
            <p className="text-xs text-slate-400">
              Master management suite for Movies, TV Series, Seasons, Episodes, Live TV & Payments
            </p>
          </div>
        </div>

        <button
          onClick={onExitAdmin}
          className="px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 text-xs font-bold transition-all flex items-center gap-2"
        >
          <X className="w-4 h-4" />
          <span>Exit Admin Panel</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar border-b border-slate-800 pb-2">
        {[
          { id: 'developer', label: 'Developer Portal & Social Hub', icon: Code2, highlight: true },
          { id: 'tmdb', label: 'TMDB Movies & Stream Links', icon: Sparkles, highlight: true },
          { id: 'security', label: 'Security & Database Architecture', icon: ShieldCheck, highlight: true },
          { id: 'overview', label: 'Overview Metrics', icon: Film },
          { id: 'movies', label: `Movies Catalog (${movies.length})`, icon: Film },
          { id: 'series', label: `TV Series & Episodes (${series.length})`, icon: Layers },
          { id: 'channels', label: `Live TV Channels (${channels.length})`, icon: Tv },
          { id: 'plans', label: `Subscription Plans (${plans.length})`, icon: CreditCard },
          { id: 'payments', label: `Transactions (${transactions.length})`, icon: CreditCard },
          { id: 'notifications', label: 'Broadcast Push Alerts', icon: Bell }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl text-xs font-black whitespace-nowrap transition-all flex items-center gap-2 ${
                isActive
                  ? tab.highlight
                    ? 'bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-600 text-slate-950 font-black shadow-lg shadow-cyan-900/60'
                    : 'bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-900/50'
                  : tab.highlight
                  ? 'bg-cyan-950/60 border border-cyan-800 text-cyan-300 hover:text-white hover:bg-cyan-900'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.highlight && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-black bg-cyan-400 text-slate-950 shadow-[0_0_8px_#00f0ff]">
                  PORTAL
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ==========================================
          TAB: DEVELOPER PORTAL & SOCIAL HUBS CONFIGURATION
          ========================================== */}
      {activeTab === 'developer' && (
        <div className="space-y-6 max-w-5xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-blue-950/90 via-[#071329] to-cyan-950/90 border-2 border-cyan-500/40 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-400 to-blue-500 p-0.5 shadow-lg shadow-cyan-500/20">
                <img
                  src={devProfile.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'}
                  alt={devProfile.name}
                  className="w-full h-full object-cover rounded-[14px]"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-white">{devProfile.name}</h2>
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 text-[10px] font-black uppercase border border-cyan-500/40 shadow-[0_0_8px_rgba(0,229,255,0.3)]">
                    Lead Architect
                  </span>
                </div>
                <p className="text-xs text-cyan-300 font-bold mt-0.5">{devProfile.role}</p>
                <p className="text-[11px] text-slate-400">{devProfile.email} • {devProfile.whatsapp}</p>
              </div>
            </div>

            {onOpenDeveloperPreview && (
              <button
                type="button"
                onClick={onOpenDeveloperPreview}
                className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black text-xs shadow-lg shadow-cyan-950/40 flex items-center gap-2 hover:scale-105 transition-all cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                <span>Preview Developer Modal</span>
              </button>
            )}
          </div>

          <form onSubmit={handleSaveDeveloper} className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-cyan-900/50 space-y-6">
            <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Code2 className="w-5 h-5 text-cyan-400" />
                  <span>Developer Identity & Public Portal Information</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Customize the channels, contact links, email, portfolio URL, and social media shown when users click the Developer tab in the header.
                </p>
              </div>

              {devSaveSuccess && (
                <div className="px-4 py-2 rounded-xl bg-cyan-400 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-[0_0_12px_#00f0ff] animate-fadeIn">
                  <Check className="w-4 h-4" />
                  <span>Developer Profile Saved!</span>
                </div>
              )}
            </div>

            {/* Basic Info: Name, Role, Location */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-black text-slate-300 block mb-1.5 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" /> Developer Name
                </label>
                <input
                  type="text"
                  required
                  value={devProfile.name}
                  onChange={(e) => setDevProfile({ ...devProfile, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 text-xs text-white"
                  placeholder="e.g. Lionel Sabin"
                />
              </div>

              <div>
                <label className="text-xs font-black text-slate-300 block mb-1.5 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-cyan-400" /> Professional Title / Role
                </label>
                <input
                  type="text"
                  required
                  value={devProfile.role}
                  onChange={(e) => setDevProfile({ ...devProfile, role: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 text-xs text-white"
                  placeholder="e.g. Lead Full-Stack Software Engineer"
                />
              </div>

              <div>
                <label className="text-xs font-black text-slate-300 block mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-pink-400" /> Location / Base
                </label>
                <input
                  type="text"
                  value={devProfile.location}
                  onChange={(e) => setDevProfile({ ...devProfile, location: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 text-xs text-white"
                  placeholder="e.g. Kigali, Rwanda"
                />
              </div>
            </div>

            {/* Direct Contacts: Email, WhatsApp, Instagram, Facebook */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-black text-slate-300 block mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-cyan-400" /> Developer Contact Email
                </label>
                <input
                  type="email"
                  required
                  value={devProfile.email}
                  onChange={(e) => setDevProfile({ ...devProfile, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 text-xs text-white font-mono"
                  placeholder="e.g. developersabin76@gmail.com"
                />
              </div>

              <div>
                <label className="text-xs font-black text-slate-300 block mb-1.5 flex items-center gap-1.5">
                  <MessageCircle className="w-3.5 h-3.5 text-cyan-400" /> WhatsApp Number / Link
                </label>
                <input
                  type="text"
                  required
                  value={devProfile.whatsapp}
                  onChange={(e) => setDevProfile({ ...devProfile, whatsapp: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-400 text-xs text-white font-mono"
                  placeholder="e.g. +250 788 123 456 or https://wa.me/250788123456"
                />
              </div>

              <div>
                <label className="text-xs font-black text-slate-300 block mb-1.5 flex items-center gap-1.5">
                  <Instagram className="w-3.5 h-3.5 text-pink-400" /> Instagram Handle / URL
                </label>
                <input
                  type="text"
                  value={devProfile.instagram}
                  onChange={(e) => setDevProfile({ ...devProfile, instagram: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-pink-500 text-xs text-white"
                  placeholder="e.g. @lionel_sabin or https://instagram.com/lionel_sabin"
                />
              </div>

              <div>
                <label className="text-xs font-black text-slate-300 block mb-1.5 flex items-center gap-1.5">
                  <Facebook className="w-3.5 h-3.5 text-blue-400" /> Facebook Profile / Page URL
                </label>
                <input
                  type="text"
                  value={devProfile.facebook}
                  onChange={(e) => setDevProfile({ ...devProfile, facebook: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-blue-500 text-xs text-white"
                  placeholder="e.g. https://facebook.com/lionel.sabin.dev"
                />
              </div>
            </div>

            {/* Developer Channel Name & Portfolio Website URL */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-red-900/40 space-y-3">
                <div className="flex items-center gap-2 text-xs font-black text-red-400 uppercase tracking-wider">
                  <Tv className="w-4 h-4" />
                  <span>Developer Video / TV Channel</span>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Channel Name</label>
                  <input
                    type="text"
                    value={devProfile.channelName}
                    onChange={(e) => setDevProfile({ ...devProfile, channelName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                    placeholder="e.g. Sabin Media & Cinema Tech"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Channel Portal URL / Stream Link</label>
                  <input
                    type="text"
                    value={devProfile.channelUrl || ''}
                    onChange={(e) => setDevProfile({ ...devProfile, channelUrl: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white font-mono"
                    placeholder="e.g. https://youtube.com/@sabin_media"
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/80 border border-purple-900/40 space-y-3">
                <div className="flex items-center gap-2 text-xs font-black text-purple-400 uppercase tracking-wider">
                  <Globe className="w-4 h-4" />
                  <span>Developer Portfolio Website</span>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Portfolio Website URL</label>
                  <input
                    type="text"
                    required
                    value={devProfile.portfolioUrl}
                    onChange={(e) => setDevProfile({ ...devProfile, portfolioUrl: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white font-mono"
                    placeholder="e.g. https://sabin-developer-portfolio.vercel.app"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Status Badge / Verification Title</label>
                  <input
                    type="text"
                    value={devProfile.statusBadge || ''}
                    onChange={(e) => setDevProfile({ ...devProfile, statusBadge: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                    placeholder="e.g. Verified Platform Architect"
                  />
                </div>
              </div>
            </div>

            {/* Images: Avatar URL & Banner URL */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-black text-slate-300 block mb-1.5">Avatar Image URL</label>
                <input
                  type="text"
                  value={devProfile.avatarUrl}
                  onChange={(e) => setDevProfile({ ...devProfile, avatarUrl: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="text-xs font-black text-slate-300 block mb-1.5">Banner Backdrop URL</label>
                <input
                  type="text"
                  value={devProfile.bannerUrl || ''}
                  onChange={(e) => setDevProfile({ ...devProfile, bannerUrl: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono"
                  placeholder="https://..."
                />
              </div>
            </div>

            {/* Skills & Bio */}
            <div>
              <label className="text-xs font-black text-slate-300 block mb-1.5">
                Technical Skills & Architecture Competencies (comma-separated)
              </label>
              <input
                type="text"
                value={skillsInput}
                onChange={(e) => setSkillsInput(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                placeholder="React 19, TypeScript, HLS Video Streaming, Node.js Express, Agasobanuye Cinema Pipeline"
              />
            </div>

            <div>
              <label className="text-xs font-black text-slate-300 block mb-1.5">
                Developer Bio & System Architecture Statement
              </label>
              <textarea
                rows={3}
                value={devProfile.bio}
                onChange={(e) => setDevProfile({ ...devProfile, bio: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                placeholder="Write your professional bio and streaming architecture overview..."
              />
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              {onOpenDeveloperPreview && (
                <button
                  type="button"
                  onClick={onOpenDeveloperPreview}
                  className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-black flex items-center gap-1.5 transition-all"
                >
                  <Eye className="w-4 h-4" />
                  <span>Preview Portal</span>
                </button>
              )}

              <button
                type="submit"
                className="px-7 py-3 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-slate-950 font-black text-xs shadow-lg shadow-cyan-950/40 flex items-center gap-2 hover:scale-105 transition-all cursor-pointer"
              >
                <Save className="w-4 h-4 fill-slate-950" />
                <span>Save Developer Portal Info</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==========================================
          TAB: SECURITY & DATABASE ARCHITECTURE (PRODUCTION HARDENED)
          ========================================== */}
      {activeTab === 'security' && <AdminSecuritySection />}

      {/* ==========================================
          TAB: TMDB MOVIES & STREAM LINKS EXPLORER (TOP PRIORITY)
          ========================================== */}
      {activeTab === 'tmdb' && (
        <AdminTmdbExplorer
          movies={movies}
          series={series}
          onSaveMovie={(movie) => {
            saveMovie(movie);
            onRefreshData();
          }}
          onSaveSeries={(ser) => {
            saveSeries(ser);
            onRefreshData();
          }}
          onRefreshData={onRefreshData}
        />
      )}

      {/* ==========================================
          TAB 1: OVERVIEW METRICS
          ========================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Movies</span>
              <span className="text-2xl font-black text-white mt-1 block">{movies.length}</span>
            </div>
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Total TV Series</span>
              <span className="text-2xl font-black text-blue-400 mt-1 block">{series.length}</span>
            </div>
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Live TV Stations</span>
              <span className="text-2xl font-black text-cyan-400 mt-1 block">{channels.length}</span>
            </div>
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Transactions</span>
              <span className="text-2xl font-black text-amber-400 mt-1 block">{transactions.length}</span>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900/80 border border-blue-900/30 space-y-4">
            <h3 className="text-sm font-black text-white uppercase tracking-wider">Quick Management Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => {
                  setActiveTab('series');
                  setEditingSeries({
                    id: `ser_${Date.now()}`,
                    slug: `new-series-${Date.now()}`,
                    title: 'New TV Series',
                    description: '',
                    posterUrl: 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?auto=format&fit=crop&w=800&q=80',
                    backdropUrl: 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?auto=format&fit=crop&w=1600&q=80',
                    year: new Date().getFullYear(),
                    genres: ['Action', 'Agasobanuye'],
                    language: 'Kinyarwanda',
                    country: 'Rwanda',
                    director: 'Junior Giti',
                    cast: [],
                    rating: 9.5,
                    ageRating: '16+',
                    status: 'PUBLISHED',
                    access: 'FREE',
                    isFeatured: true,
                    isPopular: true,
                    seasonsCount: 1,
                    totalEpisodesCount: 0,
                    seasons: [
                      {
                        id: `sea_${Date.now()}`,
                        seriesId: `ser_${Date.now()}`,
                        seasonNumber: 1,
                        title: 'Season 1',
                        description: 'Season 1 Episodes',
                        year: new Date().getFullYear(),
                        episodesCount: 0,
                        episodes: []
                      }
                    ],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                  });
                  setIsSeriesModalOpen(true);
                }}
                className="p-4 rounded-2xl bg-blue-600/20 border border-blue-500/40 text-left hover:bg-blue-600 hover:text-white transition-all group"
              >
                <Plus className="w-5 h-5 text-blue-400 group-hover:text-white mb-2" />
                <h4 className="text-xs font-black text-white">+ Add New TV Series</h4>
                <p className="text-[10px] text-slate-400 group-hover:text-blue-100 mt-0.5">
                  Create series with seasons and episode hierarchy
                </p>
              </button>

              <button
                onClick={() => {
                  setActiveTab('movies');
                  setEditingMovie({
                    id: `mov_${Date.now()}`,
                    slug: `new-movie-${Date.now()}`,
                    title: 'New Movie',
                    description: '',
                    posterUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80',
                    backdropUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1600&q=80',
                    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
                    downloadEnabled: true,
                    year: new Date().getFullYear(),
                    duration: '01:45:00',
                    genres: ['Action', 'Agasobanuye'],
                    language: 'Kinyarwanda',
                    country: 'Rwanda',
                    director: 'Lionel Sabin',
                    cast: [],
                    rating: 9.4,
                    ageRating: '16+',
                    quality: '1080p Full HD',
                    isFeatured: true,
                    isPopular: true,
                    status: 'PUBLISHED',
                    access: 'FREE',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                  });
                  setIsMovieModalOpen(true);
                }}
                className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/40 text-left hover:bg-cyan-500 hover:text-slate-950 transition-all group shadow-[0_0_15px_rgba(0,229,255,0.15)]"
              >
                <Plus className="w-5 h-5 text-cyan-400 group-hover:text-slate-950 mb-2" />
                <h4 className="text-xs font-black text-white group-hover:text-slate-950">+ Add New Movie</h4>
                <p className="text-[10px] text-slate-400 group-hover:text-slate-900 mt-0.5">
                  Upload movie stream URLs & metadata
                </p>
              </button>

              <button
                onClick={() => {
                  setActiveTab('channels');
                  setEditingChannel({
                    id: `ch_${Date.now()}`,
                    name: 'New Rwandan TV',
                    country: 'Rwanda',
                    countryCode: 'RW',
                    category: 'Rwandan TV',
                    logo: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=200&q=80',
                    streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
                    streamType: 'hls',
                    isLive: true,
                    isFeatured: true,
                    isActive: true,
                    sortOrder: 1,
                    status: 'ONLINE',
                    access: 'FREE',
                    viewerCount: 8500,
                    description: 'Live Rwandan Television Broadcast',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                  });
                  setIsChannelModalOpen(true);
                }}
                className="p-4 rounded-2xl bg-purple-600/20 border border-purple-500/40 text-left hover:bg-purple-600 hover:text-white transition-all group"
              >
                <Plus className="w-5 h-5 text-purple-400 group-hover:text-white mb-2" />
                <h4 className="text-xs font-black text-white">+ Add TV Channel</h4>
                <p className="text-[10px] text-slate-400 group-hover:text-purple-100 mt-0.5">
                  Configure live stream & logo URLs
                </p>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 2: SERIES & SEASONS & EPISODES MANAGER (CRITICAL)
          ========================================== */}
      {activeTab === 'series' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" /> Series &rarr; Seasons &rarr; Episodes Hierarchy
            </h2>

            <button
              onClick={() => {
                setEditingSeries({
                  id: `ser_${Date.now()}`,
                  slug: `new-series-${Date.now()}`,
                  title: 'New Series Title',
                  description: '',
                  posterUrl: 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?auto=format&fit=crop&w=800&q=80',
                  backdropUrl: 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?auto=format&fit=crop&w=1600&q=80',
                  year: new Date().getFullYear(),
                  genres: ['Action', 'Agasobanuye'],
                  language: 'Kinyarwanda',
                  country: 'Rwanda',
                  director: 'Junior Giti',
                  cast: [],
                  rating: 9.5,
                  ageRating: '16+',
                  status: 'PUBLISHED',
                  access: 'FREE',
                  isFeatured: true,
                  isPopular: true,
                  seasonsCount: 1,
                  totalEpisodesCount: 0,
                  seasons: [
                    {
                      id: `sea_${Date.now()}`,
                      seriesId: `ser_${Date.now()}`,
                      seasonNumber: 1,
                      title: 'Season 1',
                      description: 'Season 1',
                      year: new Date().getFullYear(),
                      episodesCount: 0,
                      episodes: []
                    }
                  ],
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                });
                setIsSeriesModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-blue-900/50"
            >
              <Plus className="w-4 h-4" /> Add New Series
            </button>
          </div>

          {/* Series Selection Bar */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
            {series.map((s) => {
              const isSelected = s.id === activeSeries?.id;
              return (
                <button
                  key={s.id}
                  onClick={() => {
                    setSelectedSeriesId(s.id);
                    setSelectedSeasonId(s.seasons?.[0]?.id || null);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  <img src={s.posterUrl} alt={s.title} className="w-4 h-6 rounded object-cover" />
                  <span>{s.title}</span>
                  <span className="text-[10px] text-cyan-400 font-mono">({s.seasons?.length || 0} seasons)</span>
                </button>
              );
            })}
          </div>

          {/* Active Series Management Deck */}
          {activeSeries && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 rounded-3xl bg-slate-900/80 border border-blue-900/30">
              
              {/* Left Column: Series Info & Seasons Selector */}
              <div className="lg:col-span-4 space-y-4">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex gap-3">
                  <img src={activeSeries.posterUrl} alt={activeSeries.title} className="w-16 h-24 rounded-xl object-cover" />
                  <div className="flex-1 overflow-hidden">
                    <h3 className="text-sm font-black text-white truncate">{activeSeries.title}</h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{activeSeries.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => {
                          setEditingSeries(activeSeries);
                          setIsSeriesModalOpen(true);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 hover:text-white text-[10px] font-bold flex items-center gap-1"
                      >
                        <Edit2 className="w-3 h-3" /> Edit Series
                      </button>
                      <button
                        onClick={() => handleDeleteSeries(activeSeries.id)}
                        className="px-2.5 py-1 rounded-lg bg-red-950/80 text-red-300 hover:text-white text-[10px] font-bold flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  </div>
                </div>

                {/* Seasons List for Active Series */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-cyan-400 uppercase tracking-wider">
                      Seasons ({activeSeries.seasons?.length || 0})
                    </span>
                    <button
                      onClick={() => {
                        const nextNum = (activeSeries.seasons?.length || 0) + 1;
                        setEditingSeason({
                          id: `sea_${Date.now()}`,
                          seriesId: activeSeries.id,
                          seasonNumber: nextNum,
                          title: `Season ${nextNum}`,
                          description: `Season ${nextNum} description`,
                          year: new Date().getFullYear(),
                          episodesCount: 0,
                          episodes: []
                        });
                        setIsSeasonModalOpen(true);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-500/40 text-[10px] font-black flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> + Add Season
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    {activeSeries.seasons?.map((season) => {
                      const isSeasonSelected = season.id === activeSeason?.id;
                      return (
                        <div
                          key={season.id}
                          onClick={() => setSelectedSeasonId(season.id)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                            isSeasonSelected
                              ? 'bg-blue-600/20 border-blue-500 text-white font-black'
                              : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-900'
                          }`}
                        >
                          <div>
                            <span className="text-xs">Season {season.seasonNumber}: {season.title}</span>
                            <span className="text-[10px] text-slate-400 font-mono block">
                              {season.episodes?.length || 0} episodes
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingSeason(season);
                                setIsSeasonModalOpen(true);
                              }}
                              className="p-1 rounded text-slate-400 hover:text-white"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSeason(season.id);
                              }}
                              className="p-1 rounded text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Right Column: Episodes in Active Season */}
              <div className="lg:col-span-8 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-white">
                      Episodes in {activeSeason?.title || 'Season 1'}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Manage stream URLs, title, thumbnail, duration, and VIP/FREE access
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      const nextEpNum = (activeSeason?.episodes?.length || 0) + 1;
                      setEditingEpisode({
                        id: `ep_${Date.now()}`,
                        seriesId: activeSeries.id,
                        seasonId: activeSeason?.id || '',
                        episodeNumber: nextEpNum,
                        title: `Episode ${nextEpNum}: Chapter Title`,
                        description: `Episode synopsis and translation details.`,
                        thumbnailUrl: activeSeries.backdropUrl || activeSeries.posterUrl,
                        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
                        duration: '45m',
                        access: 'FREE',
                        downloadEnabled: true,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                      });
                      setIsEpisodeModalOpen(true);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,240,255,0.4)] hover:shadow-[0_0_25px_rgba(0,240,255,0.6)] transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" /> + Add Episode
                  </button>
                </div>

                {/* Episodes Table */}
                <div className="space-y-2 max-h-[500px] overflow-y-auto no-scrollbar">
                  {activeSeason?.episodes?.map((ep) => (
                    <div
                      key={ep.id}
                      className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4 group"
                    >
                      <div className="flex items-center gap-3">
                        <img src={ep.thumbnailUrl || activeSeries.posterUrl} alt={ep.title} className="w-14 h-9 rounded-lg object-cover" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-blue-400 font-mono">
                              EP {ep.episodeNumber}
                            </span>
                            <span className="text-xs font-bold text-white">{ep.title}</span>
                            {ep.access === 'PREMIUM' ? (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-[0_0_8px_rgba(0,240,255,0.3)]">
                                VIP
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-800 text-slate-400">
                                FREE
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono mt-0.5 block truncate max-w-md">
                            {ep.videoUrl}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingEpisode(ep);
                            setIsEpisodeModalOpen(true);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1"
                        >
                          <Edit2 className="w-3 h-3" /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteEpisode(ep.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-red-950/60 text-red-400 hover:text-white text-xs font-bold flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" /> Delete
                        </button>
                      </div>
                    </div>
                  ))}

                  {(!activeSeason?.episodes || activeSeason.episodes.length === 0) && (
                    <div className="py-12 text-center text-slate-400 text-xs">
                      No episodes added yet in this season. Click '+ Add Episode' to add one.
                    </div>
                  )}
                </div>

              </div>

            </div>
          )}
        </div>
      )}

      {/* ==========================================
          TAB 3: MOVIES CATALOG MANAGER
          ========================================== */}
      {activeTab === 'movies' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <Film className="w-4 h-4 text-cyan-400" /> Movies Management ({movies.length})
              </h2>
              <p className="text-xs text-slate-400">
                Manage uploaded movies, stream URLs, Umusobanuzi, access tiers, and metadata.
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => setActiveTab('tmdb')}
                className="px-3.5 py-2 rounded-xl bg-blue-950/80 border border-blue-800 text-blue-300 hover:text-white hover:bg-blue-900 text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>Search TMDB Movies</span>
              </button>

              <button
                onClick={() => {
                  setEditingMovie({
                    id: `mov_${Date.now()}`,
                    slug: `movie-${Date.now()}`,
                    title: 'New Movie',
                    description: '',
                    posterUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80',
                    backdropUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1600&q=80',
                    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
                    downloadEnabled: true,
                    year: new Date().getFullYear(),
                    duration: '01:45:00',
                    genres: ['Action', 'Agasobanuye'],
                    language: 'Kinyarwanda',
                    country: 'Rwanda',
                    director: 'Junior Giti',
                    cast: [],
                    rating: 9.4,
                    ageRating: '16+',
                    quality: '1080p Full HD',
                    isFeatured: true,
                    isPopular: true,
                    status: 'PUBLISHED',
                    access: 'FREE',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                  });
                  setIsMovieModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,240,255,0.4)] hover:shadow-[0_0_25px_rgba(0,240,255,0.6)] transition-all shrink-0"
              >
                <Plus className="w-4 h-4" /> Add Movie
              </button>
            </div>
          </div>

          {/* Search bar inside movies tab */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Filter current library movies by title, director, or genre..."
              value={movieFilterQuery}
              onChange={(e) => setMovieFilterQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {movies
              .filter((m) => {
                if (!movieFilterQuery.trim()) return true;
                const q = movieFilterQuery.toLowerCase();
                return (
                  m.title.toLowerCase().includes(q) ||
                  (m.director && m.director.toLowerCase().includes(q)) ||
                  (m.genres && m.genres.some((g) => g.toLowerCase().includes(q)))
                );
              })
              .map((m) => (
              <div
                key={m.id}
                className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between gap-3 shadow-lg"
              >
                <div className="flex gap-3">
                  <img src={m.posterUrl} alt={m.title} className="w-14 h-20 rounded-xl object-cover shrink-0" />
                  <div className="flex-1 overflow-hidden">
                    <h3 className="text-xs font-black text-white truncate">{m.title}</h3>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">{m.year} • {m.duration}</p>
                    <span className="text-[10px] text-cyan-300 font-semibold block mt-1">
                      Umusobanuzi: {m.director || 'N/A'}
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-blue-600/20 text-blue-300 border border-blue-500/30 inline-block mt-1">
                      {m.access}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <button
                    onClick={() => {
                      setEditingMovie(m);
                      setIsMovieModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1"
                  >
                    <Edit2 className="w-3 h-3" /> Edit
                  </button>

                  <button
                    onClick={() => handleDeleteMovie(m.id)}
                    className="px-3 py-1.5 rounded-lg bg-red-950/60 text-red-400 hover:text-white text-xs font-bold flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 4: LIVE TV CHANNELS MANAGER & STREAM TESTER
          ========================================== */}
      {activeTab === 'channels' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <Tv className="w-4 h-4 text-cyan-400" /> Live TV Channels Management
              </h2>
              <p className="text-xs text-slate-400">
                Edit stream URLs, logo assets, categories, and test live streams before publishing
              </p>
            </div>

            <button
              onClick={() => {
                setEditingChannel({
                  id: `ch_${Date.now()}`,
                  name: 'New TV Station',
                  country: 'Rwanda',
                  countryCode: 'RW',
                  category: 'Rwandan TV',
                  logo: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=200&q=80',
                  streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
                  streamType: 'hls',
                  isLive: true,
                  isFeatured: true,
                  isActive: true,
                  sortOrder: 1,
                  status: 'ONLINE',
                  access: 'FREE',
                  viewerCount: 12000,
                  description: 'Live Broadcast',
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                });
                setIsChannelModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-purple-600 text-white font-black text-xs flex items-center gap-1.5 shadow-md"
            >
              <Plus className="w-4 h-4" /> Add TV Channel
            </button>
          </div>

          {/* Channels Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {channels.map((ch) => (
              <div
                key={ch.id}
                className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between gap-3 shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 p-1 flex items-center justify-center shrink-0">
                    <img src={ch.logo || ch.logoUrl} alt={ch.name} className="w-full h-full object-contain rounded-lg" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <h3 className="text-xs font-black text-white truncate">{ch.name}</h3>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">{ch.category} • {ch.country}</p>
                    <span className="text-[9px] font-mono text-cyan-400 truncate block mt-0.5">
                      {ch.streamUrl}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <button
                    onClick={() => setPreviewTestStreamUrl(ch.streamUrl)}
                    className="px-3 py-1.5 rounded-lg bg-blue-600/20 text-blue-300 hover:text-white text-xs font-bold flex items-center gap-1"
                  >
                    <Play className="w-3 h-3" /> Test Stream
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingChannel(ch);
                        setIsChannelModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" /> Edit
                    </button>

                    <button
                      onClick={() => handleDeleteChannel(ch.id)}
                      className="px-3 py-1.5 rounded-lg bg-red-950/60 text-red-400 hover:text-white text-xs font-bold flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Test Stream Modal Popover */}
          {previewTestStreamUrl && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
              <div className="relative w-full max-w-2xl bg-slate-950 rounded-3xl border border-blue-500/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-cyan-400 uppercase tracking-wider">
                    Live Stream Preview
                  </span>
                  <button
                    onClick={() => setPreviewTestStreamUrl(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="aspect-video rounded-2xl overflow-hidden bg-black">
                  <VideoPlayer
                    streamUrl={previewTestStreamUrl}
                    title="Live Stream Test"
                    autoPlay={true}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==========================================
          TAB 5: SUBSCRIPTION PLANS MANAGER
          ========================================== */}
      {activeTab === 'plans' && (
        <div className="space-y-4">
          <h2 className="text-base font-black text-white">Subscription Plans Configuration</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((p) => (
              <div key={p.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-white">{p.name}</h3>
                  <span className="text-xs font-mono font-bold text-cyan-400">{p.price} {p.currency}</span>
                </div>
                <p className="text-xs text-slate-400">Duration: {p.durationDays} Days</p>
                <ul className="text-xs text-slate-300 space-y-1">
                  {p.features.map((f, idx) => (
                    <li key={idx} className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-cyan-400" /> {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 6: PAYMENTS & BILLING LOGS
          ========================================== */}
      {activeTab === 'payments' && (
        <div className="space-y-4">
          <h2 className="text-base font-black text-white">All Platform Payment Transactions</h2>
          {transactions.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">No transactions recorded yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900 text-[10px] font-black uppercase text-slate-400">
                  <tr>
                    <th className="p-3">Reference</th>
                    <th className="p-3">User</th>
                    <th className="p-3">Phone / Method</th>
                    <th className="p-3">Plan</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-900/50">
                      <td className="p-3 font-mono font-bold text-white">{tx.paymentReference || tx.id}</td>
                      <td className="p-3">{tx.userName} ({tx.userEmail})</td>
                      <td className="p-3 font-mono text-cyan-400">{tx.userPhone || tx.paymentMethod}</td>
                      <td className="p-3 font-bold">{tx.planName}</td>
                      <td className="p-3 font-mono font-bold text-white">{tx.amount} {tx.currency}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-[0_0_8px_rgba(0,240,255,0.25)]">
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
          TAB 7: NOTIFICATIONS BROADCAST
          ========================================== */}
      {activeTab === 'notifications' && (
        <div className="max-w-xl space-y-4">
          <h2 className="text-base font-black text-white">Broadcast System Announcement</h2>
          <form onSubmit={handleBroadcast} className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Notification Title</label>
              <input
                type="text"
                required
                placeholder="e.g. New Dune Prophecy Season 2 Released"
                value={notifTitle}
                onChange={(e) => setNotifTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Notification Message</label>
              <textarea
                required
                rows={3}
                placeholder="Write announcement details..."
                value={notifMessage}
                onChange={(e) => setNotifMessage(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
              />
            </div>

            {broadcastSuccess && (
              <div className="p-3 rounded-xl bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 text-xs font-bold shadow-[0_0_12px_rgba(0,240,255,0.2)]">
                Announcement broadcasted successfully to all users!
              </div>
            )}

            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-blue-600 text-white font-black text-xs shadow-md"
            >
              Send Announcement to All Users
            </button>
          </form>
        </div>
      )}

      {/* ==========================================
          MODALS: MOVIE / SERIES / SEASON / EPISODE / CHANNEL
          ========================================== */}
      
      {/* 1. MOVIE MODAL */}
      {isMovieModalOpen && editingMovie && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-slate-950 rounded-3xl border border-blue-900/40 p-6 space-y-4 my-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white">
                {editingMovie.id.startsWith('mov_') ? 'Add Movie' : 'Edit Movie'}
              </h3>
              <button onClick={() => setIsMovieModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMovie} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">Movie Title</label>
                <input
                  type="text"
                  required
                  value={editingMovie.title}
                  onChange={(e) => setEditingMovie({ ...editingMovie, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Video Stream URL (MP4 / HLS .m3u8)</label>
                <input
                  type="text"
                  required
                  value={editingMovie.videoUrl}
                  onChange={(e) => setEditingMovie({ ...editingMovie, videoUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Poster URL</label>
                  <input
                    type="text"
                    value={editingMovie.posterUrl}
                    onChange={(e) => setEditingMovie({ ...editingMovie, posterUrl: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Backdrop Banner URL</label>
                  <input
                    type="text"
                    value={editingMovie.backdropUrl}
                    onChange={(e) => setEditingMovie({ ...editingMovie, backdropUrl: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Umusobanuzi / Director</label>
                  <input
                    type="text"
                    value={editingMovie.director || ''}
                    onChange={(e) => setEditingMovie({ ...editingMovie, director: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Release Year</label>
                  <input
                    type="number"
                    value={editingMovie.year}
                    onChange={(e) => setEditingMovie({ ...editingMovie, year: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Access Level</label>
                  <select
                    value={editingMovie.access}
                    onChange={(e) => setEditingMovie({ ...editingMovie, access: e.target.value as ContentAccess })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                  >
                    <option value="FREE">FREE</option>
                    <option value="PREMIUM">PREMIUM (VIP)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editingMovie.description}
                  onChange={(e) => setEditingMovie({ ...editingMovie, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsMovieModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white font-black"
                >
                  Save Movie
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. SERIES MODAL */}
      {isSeriesModalOpen && editingSeries && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-slate-950 rounded-3xl border border-blue-900/40 p-6 space-y-4 my-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white">
                {editingSeries.id.startsWith('ser_') ? 'Add TV Series' : 'Edit TV Series'}
              </h3>
              <button onClick={() => setIsSeriesModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSeries} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">Series Title</label>
                <input
                  type="text"
                  required
                  value={editingSeries.title}
                  onChange={(e) => setEditingSeries({ ...editingSeries, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Poster URL</label>
                  <input
                    type="text"
                    value={editingSeries.posterUrl}
                    onChange={(e) => setEditingSeries({ ...editingSeries, posterUrl: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Backdrop Banner URL</label>
                  <input
                    type="text"
                    value={editingSeries.backdropUrl}
                    onChange={(e) => setEditingSeries({ ...editingSeries, backdropUrl: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Umusobanuzi / Director</label>
                  <input
                    type="text"
                    value={editingSeries.director || ''}
                    onChange={(e) => setEditingSeries({ ...editingSeries, director: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Year</label>
                  <input
                    type="number"
                    value={editingSeries.year}
                    onChange={(e) => setEditingSeries({ ...editingSeries, year: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Access Level</label>
                  <select
                    value={editingSeries.access}
                    onChange={(e) => setEditingSeries({ ...editingSeries, access: e.target.value as ContentAccess })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                  >
                    <option value="FREE">FREE</option>
                    <option value="PREMIUM">PREMIUM (VIP)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editingSeries.description}
                  onChange={(e) => setEditingSeries({ ...editingSeries, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSeriesModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white font-black"
                >
                  Save Series
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. EPISODE MODAL */}
      {isEpisodeModalOpen && editingEpisode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-slate-950 rounded-3xl border border-blue-900/40 p-6 space-y-4 my-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white">
                {editingEpisode.id.startsWith('ep_') ? 'Add Episode' : 'Edit Episode'}
              </h3>
              <button onClick={() => setIsEpisodeModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEpisode} className="space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Episode Number</label>
                  <input
                    type="number"
                    required
                    value={editingEpisode.episodeNumber}
                    onChange={(e) => setEditingEpisode({ ...editingEpisode, episodeNumber: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-slate-300 font-bold block mb-1">Episode Title</label>
                  <input
                    type="text"
                    required
                    value={editingEpisode.title}
                    onChange={(e) => setEditingEpisode({ ...editingEpisode, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Video Stream URL (MP4 / HLS .m3u8)</label>
                <input
                  type="text"
                  required
                  value={editingEpisode.videoUrl}
                  onChange={(e) => setEditingEpisode({ ...editingEpisode, videoUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Duration</label>
                  <input
                    type="text"
                    value={editingEpisode.duration || '45m'}
                    onChange={(e) => setEditingEpisode({ ...editingEpisode, duration: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Access Level</label>
                  <select
                    value={editingEpisode.access}
                    onChange={(e) => setEditingEpisode({ ...editingEpisode, access: e.target.value as ContentAccess })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                  >
                    <option value="FREE">FREE</option>
                    <option value="PREMIUM">PREMIUM (VIP)</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Thumbnail URL</label>
                  <input
                    type="text"
                    value={editingEpisode.thumbnailUrl || ''}
                    onChange={(e) => setEditingEpisode({ ...editingEpisode, thumbnailUrl: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Episode Description</label>
                <textarea
                  rows={2}
                  value={editingEpisode.description}
                  onChange={(e) => setEditingEpisode({ ...editingEpisode, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEpisodeModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white font-black"
                >
                  Save Episode
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. TV CHANNEL MODAL */}
      {isChannelModalOpen && editingChannel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-slate-950 rounded-3xl border border-blue-900/40 p-6 space-y-4 my-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white">
                {editingChannel.id.startsWith('ch_') ? 'Add TV Channel' : 'Edit TV Channel'}
              </h3>
              <button onClick={() => setIsChannelModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveChannel} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">Channel Name</label>
                <input
                  type="text"
                  required
                  value={editingChannel.name}
                  onChange={(e) => setEditingChannel({ ...editingChannel, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Live Stream URL (HLS .m3u8)</label>
                <input
                  type="text"
                  required
                  value={editingChannel.streamUrl}
                  onChange={(e) => setEditingChannel({ ...editingChannel, streamUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Logo URL</label>
                  <input
                    type="text"
                    value={editingChannel.logo || editingChannel.logoUrl || ''}
                    onChange={(e) => setEditingChannel({ ...editingChannel, logo: e.target.value, logoUrl: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Category</label>
                  <select
                    value={editingChannel.category}
                    onChange={(e) => setEditingChannel({ ...editingChannel, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                  >
                    <option value="Rwandan TV">Rwandan TV</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="News & Sports">News & Sports</option>
                    <option value="Youth & Music">Youth & Music</option>
                    <option value="Culture">Culture</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsChannelModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 text-white font-black"
                >
                  Save TV Channel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
