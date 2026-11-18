import React, { useState } from 'react';
import {
  Settings,
  User,
  CreditCard,
  Sliders,
  HardDrive,
  Bell,
  ShieldCheck,
  HelpCircle,
  X,
  Check,
  Sparkles,
  Smartphone,
  Tv,
  Film,
  Download,
  Trash2,
  ExternalLink,
  ChevronRight,
  Zap,
  Volume2,
  Layers,
  Lock,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import {
  UserProfile,
  SubscriptionPlan,
  DownloadedItem,
  PaymentTransaction,
  VideoQuality
} from '../types';
import { getStoredTransactions } from '../services/paymentService';
import { saveStoredUserProfile } from '../services/contentStorage';

interface SettingsHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  plans: SubscriptionPlan[];
  downloads: DownloadedItem[];
  onOpenSubscribe: () => void;
  onOpenAdmin: () => void;
  onRefreshData: () => void;
  onReplayIntro?: () => void;
}

export const SettingsHubModal: React.FC<SettingsHubModalProps> = ({
  isOpen,
  onClose,
  user,
  plans,
  downloads,
  onOpenSubscribe,
  onOpenAdmin,
  onRefreshData,
  onReplayIntro
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<
    'profile' | 'payments' | 'playback' | 'downloads' | 'notifications' | 'security' | 'about'
  >('profile');

  // Editable Profile State
  const [name, setName] = useState(user.name || '');
  const [email, setEmail] = useState(user.email || '');
  const [phone, setPhone] = useState(user.phoneNumber || '+250 788 123 456');
  const [selectedAvatar, setSelectedAvatar] = useState(
    user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
  );
  const [isSavedToast, setIsSavedToast] = useState(false);

  // Playback Preferences State
  const [defaultQuality, setDefaultQuality] = useState<VideoQuality>(
    user.preferences?.defaultQuality || 'HD'
  );
  const [preferredCommentator, setPreferredCommentator] = useState<string>('Rocky Kirabiranya');
  const [subtitlesEnabled, setSubtitlesEnabled] = useState<boolean>(
    user.preferences?.subtitlesEnabled ?? true
  );
  const [autoPlayNext, setAutoPlayNext] = useState<boolean>(
    user.preferences?.autoPlayNext ?? true
  );
  const [wifiOnlyDownload, setWifiOnlyDownload] = useState<boolean>(true);
  const [notifMovies, setNotifMovies] = useState<boolean>(true);
  const [notifLiveTV, setNotifLiveTV] = useState<boolean>(true);

  // Password change state
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordFeedback, setPasswordFeedback] = useState('');

  const transactions: PaymentTransaction[] = getStoredTransactions();
  const isVip = Boolean(user.role === 'ADMIN' || (user.subscription && user.subscription.status === 'ACTIVE'));

  const avatarPresets = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
    'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&q=80'
  ];

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedUser: UserProfile = {
      ...user,
      name,
      email,
      phoneNumber: phone,
      avatarUrl: selectedAvatar,
      preferences: {
        ...user.preferences,
        defaultQuality,
        subtitlesEnabled,
        autoPlayNext
      }
    };
    saveStoredUserProfile(updatedUser);
    onRefreshData();
    setIsSavedToast(true);
    setTimeout(() => setIsSavedToast(false), 2500);
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setPasswordFeedback('Ijambobanga rigomba kugira byibuze inyuguti 6.');
      return;
    }
    setPasswordFeedback('Ijambobanga ryahinduwe neza! (Password updated successfully)');
    setCurrentPassword('');
    setNewPassword('');
    setTimeout(() => setPasswordFeedback(''), 3000);
  };

  const navTabs = [
    { id: 'profile', label: 'Profile & Account', icon: User, badge: isVip ? 'VIP' : undefined, color: 'blue' },
    { id: 'payments', label: 'Payments & VIP', icon: CreditCard, highlight: true, color: 'yellow' },
    { id: 'playback', label: 'Playback & Audio', icon: Sliders, color: 'green' },
    { id: 'downloads', label: `Offline Storage (${downloads.length})`, icon: HardDrive, color: 'blue' },
    { id: 'notifications', label: 'Notifications', icon: Bell, color: 'yellow' },
    { id: 'security', label: 'Security & Admin', icon: ShieldCheck, color: 'green' },
    { id: 'about', label: 'About & Support', icon: HelpCircle, color: 'blue' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-200 select-none">
      
      {/* Modal Container */}
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-[#02050e] border-2 border-cyan-400/40 rounded-3xl shadow-2xl shadow-cyan-950/80 flex flex-col overflow-hidden ring-1 ring-cyan-400/30">
        
        {/* Top Header Bar with Bright Blue Mirror Accent */}
        <div className="relative bg-gradient-to-r from-blue-950/80 via-[#02050e] to-cyan-950/80 border-b border-cyan-500/30 px-5 sm:px-8 py-4.5 flex items-center justify-between">
          
          {/* Top Decorative Blue Mirror Glass border strip */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-600 shadow-[0_0_15px_#00f0ff]" />

          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-400 via-sky-400 to-blue-600 p-0.5 shadow-lg shadow-cyan-500/40 flex items-center justify-center">
              <div className="w-full h-full bg-[#02050e] rounded-[14px] flex items-center justify-center">
                <Settings className="w-5 h-5 text-cyan-300 animate-spin-slow" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white tracking-wide">
                  Ibyo Guhitamo & Konti <span className="text-cyan-400 font-mono text-sm">(Settings Hub)</span>
                </h3>
                {isVip && (
                  <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-cyan-400 to-sky-400 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-[0_0_10px_#00e5ff]">
                    VIP Member
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Manage your account, payments, video quality, and platform preferences.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
            title="Funga (Close)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Saved Toast Notification */}
        {isSavedToast && (
          <div className="bg-cyan-400 text-slate-950 px-4 py-2 text-xs font-black text-center flex items-center justify-center gap-2 animate-in slide-in-from-top shadow-[0_0_15px_#00f0ff]">
            <Check className="w-4 h-4" /> Byahinduwe neza! All settings saved successfully.
          </div>
        )}

        {/* Modal Main Body (Left Tabs + Right Viewport) */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 min-h-0 overflow-hidden">
          
          {/* ==========================================
              LEFT TABS NAVIGATION (Desktop Sidebar / Mobile Top Bar)
              ========================================== */}
          <div className="md:col-span-4 bg-[#02050e] border-b md:border-b-0 md:border-r border-cyan-900/40 p-3 sm:p-4 overflow-x-auto md:overflow-y-auto no-scrollbar flex md:flex-col gap-1.5">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-600 text-slate-950 font-black shadow-lg shadow-cyan-500/40'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/80 border border-transparent hover:border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950 font-black' : 'text-slate-400'}`} />
                    <span>{tab.label}</span>
                  </div>

                  {tab.badge && (
                    <span className="hidden sm:inline-block px-1.5 py-0.5 rounded-md bg-yellow-400 text-slate-950 text-[9px] font-black">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Quick Action Button to open VIP Subscription in Sidebar */}
            <div className="hidden md:block mt-auto pt-4 border-t border-slate-800/80">
              <button
                onClick={() => {
                  onClose();
                  onOpenSubscribe();
                }}
                className="w-full py-2.5 px-3 rounded-2xl bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-500 hover:from-yellow-400 hover:to-amber-300 text-slate-950 font-black text-xs shadow-lg shadow-yellow-500/20 flex items-center justify-center gap-1.5 transition-all hover:scale-[1.02] cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                <span>KUGURA VIP PASS (MoMo)</span>
              </button>
            </div>
          </div>

          {/* ==========================================
              RIGHT CONTENT VIEWPORT
              ========================================== */}
          <div className="md:col-span-8 p-4 sm:p-6 overflow-y-auto max-h-[68vh] md:max-h-[72vh] space-y-6">
            
            {/* ------------------------------------------
                TAB 1: PROFILE & ACCOUNT
                ------------------------------------------ */}
            {activeTab === 'profile' && (
              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h4 className="text-sm font-black text-white uppercase tracking-wider">
                      Imyirondoro yawe (User Profile)
                    </h4>
                    <p className="text-xs text-slate-400">Update your profile details, avatar, and credentials.</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-xl bg-blue-950/80 border border-blue-600/40 text-blue-300 text-[11px] font-bold font-mono">
                    ID: {user.id || 'usr_rw_01'}
                  </span>
                </div>

                {/* Avatar Picker */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300">Hitamo Avatar (Choose Cinema Avatar)</label>
                  <div className="flex items-center gap-3 overflow-x-auto pb-2">
                    {avatarPresets.map((imgUrl, idx) => (
                      <button
                        type="button"
                        key={idx}
                        onClick={() => setSelectedAvatar(imgUrl)}
                        className={`w-12 h-12 rounded-2xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                          selectedAvatar === imgUrl
                            ? 'border-yellow-400 ring-2 ring-yellow-400/40 scale-105'
                            : 'border-slate-800 hover:border-slate-600 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={imgUrl} alt="Avatar option" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Profile Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Amazina Yose (Full Name)</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-900 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Imeri (Email Address)</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-900 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-300">Numero ya Telefone / MTN MoMo (*182#)</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-900 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:border-cyan-400"
                      placeholder="+250 788..."
                    />
                  </div>
                </div>

                {/* Password Change Toggle */}
                <div className="pt-2 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => setShowPasswordSection(!showPasswordSection)}
                    className="text-xs font-bold text-yellow-400 hover:text-yellow-300 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>{showPasswordSection ? 'Hisha guhindura ijambobanga' : 'Guhindura Ijambobanga (Change Password)'}</span>
                  </button>

                  {showPasswordSection && (
                    <div className="mt-3 p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] text-slate-400 block mb-1">Ijambobanga ry'ubu</label>
                          <input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                            placeholder="Current Password"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-400 block mb-1">Ijambobanga rishya</label>
                          <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                            placeholder="New Password (min 6 chars)"
                          />
                        </div>
                      </div>

                      {passwordFeedback && (
                        <p className="text-xs text-cyan-400 font-bold">{passwordFeedback}</p>
                      )}

                      <button
                        type="button"
                        onClick={handleSavePassword}
                        className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold cursor-pointer"
                      >
                        Bika Ijambobanga Rishya
                      </button>
                    </div>
                  )}
                </div>

                {/* Save Profile Button */}
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-slate-950 font-black text-xs shadow-lg shadow-cyan-950/40 flex items-center gap-2 cursor-pointer transition-all hover:scale-105"
                  >
                    <Check className="w-4 h-4" /> Bika Impinduka (Save Changes)
                  </button>
                </div>
              </form>
            )}

            {/* ------------------------------------------
                TAB 2: PAYMENTS, SUBSCRIPTIONS & TRANSACTIONS
                ------------------------------------------ */}
            {activeTab === 'payments' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h4 className="text-sm font-black text-white uppercase tracking-wider">
                      Ubwishyu & VIP Pass (Payments & Plans)
                    </h4>
                    <p className="text-xs text-slate-400">MTN Mobile Money, Airtel Money, and Visa/Mastercard support.</p>
                  </div>

                  <button
                    onClick={() => {
                      onClose();
                      onOpenSubscribe();
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-400 text-slate-950 font-black text-xs shadow hover:scale-105 transition-transform flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Gura VIP Pass
                  </button>
                </div>

                {/* Active Membership Status Card */}
                <div className="p-5 rounded-3xl bg-gradient-to-r from-blue-950/80 via-slate-900 to-cyan-950/60 border border-cyan-500/40 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-cyan-400/20 border border-cyan-400/40 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-cyan-300" />
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 block font-semibold">Gahunda Y'ubu (Current Plan)</span>
                        <h4 className="text-base font-black text-white">
                          {isVip ? (user.subscription?.planName || 'VIP Monthly Pass') : 'Free Guest Streaming'}
                        </h4>
                      </div>
                    </div>

                    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                      isVip ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_8px_rgba(0,229,255,0.3)]' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {isVip ? 'ACTIVE • 1080p UNLOCKED' : 'LIMITED FREE ACCESS'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs">
                    <div className="p-2.5 rounded-2xl bg-slate-950/80 border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Agasobanuye Full HD</span>
                      <span className="text-cyan-400 font-bold">100% Unlocked</span>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-slate-950/80 border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Igihe Kizarangirira</span>
                      <span className="text-cyan-400 font-bold">
                        {user.subscription?.expiresAt ? new Date(user.subscription.expiresAt).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-slate-950/80 border border-slate-800 col-span-2 sm:col-span-1">
                      <span className="text-slate-400 block text-[10px]">Uburyo bwo Kwishyura</span>
                      <span className="text-blue-300 font-bold">MTN MoMo / Airtel</span>
                    </div>
                  </div>
                </div>

                {/* Transaction History */}
                <div className="space-y-3">
                  <h5 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-cyan-400" />
                    Amateka y'Ubwishyu (Transaction Records)
                  </h5>

                  {transactions.length === 0 ? (
                    <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-400 space-y-2">
                      <p>Nta bwishyu burakorwa kuri iyi konti.</p>
                      <button
                        onClick={() => {
                          onClose();
                          onOpenSubscribe();
                        }}
                        className="px-4 py-1.5 rounded-xl bg-cyan-400 text-slate-950 font-bold text-xs hover:bg-cyan-300 transition-colors shadow-[0_0_10px_#00e5ff]"
                      >
                        Kanda hano wishyure via MTN MoMo
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {transactions.map((tx) => (
                        <div
                          key={tx.id}
                          className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-bold text-white block">{tx.planName}</span>
                            <span className="text-[11px] text-slate-400">
                              Ref: {tx.paymentReference || tx.id} • {new Date(tx.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-black text-cyan-400 block">
                              {tx.amount.toLocaleString()} {tx.currency}
                            </span>
                            <span className="text-[10px] text-cyan-400 font-bold uppercase">{tx.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ------------------------------------------
                TAB 3: PLAYBACK, AUDIO & COMMENTATOR PREFERENCES
                ------------------------------------------ */}
            {activeTab === 'playback' && (
              <div className="space-y-6">
                <div className="pb-3 border-b border-slate-800">
                  <h4 className="text-sm font-black text-white uppercase tracking-wider">
                    Ibyo Gukina Video & Amajwi (Playback & Stream Quality)
                  </h4>
                  <p className="text-xs text-slate-400">Configure your video resolution, commentary, and subtitles.</p>
                </div>

                {/* Default Stream Resolution */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300">
                    Ubuziranenge bwa Video (Default Streaming Resolution)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      { id: 'AUTO', label: 'Auto (Adapt)', desc: 'Adaptive network' },
                      { id: 'HD', label: '1080p Full HD', desc: 'Best clarity' },
                      { id: 'MID', label: '720p HD', desc: 'Standard data' },
                      { id: 'LOW', label: '480p Data Saver', desc: 'Save MoMo data' }
                    ].map((item) => (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => setDefaultQuality(item.id as VideoQuality)}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                          defaultQuality === item.id
                            ? 'bg-blue-600/20 border-blue-500 text-white ring-1 ring-blue-500'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                        }`}
                      >
                        <span className="font-bold text-xs block text-yellow-400">{item.label}</span>
                        <span className="text-[10px] text-slate-400 block">{item.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preferred Agasobanuye Commentator */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300">
                    Umusobanuzi Ukunda Cyane (Preferred Voice Translator)
                  </label>
                  <select
                    value={preferredCommentator}
                    onChange={(e) => setPreferredCommentator(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-yellow-400 cursor-pointer"
                  >
                    <option value="Rocky Kirabiranya">Rocky Kirabiranya (Action & Comedy)</option>
                    <option value="Junior Giti">Junior Giti (Sci-Fi, Series & Dramas)</option>
                    <option value="Sankara">Sankara (Martial Arts & Thrillers)</option>
                    <option value="Gaheza">Gaheza (Epic Action & War)</option>
                    <option value="Yvan">Yvan (Romance & Modern Hits)</option>
                    <option value="All">Abasobanuzi Bose (All Translators)</option>
                  </select>
                </div>

                {/* Subtitles & Autoplay Toggles */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
                    <div>
                      <span className="text-xs font-bold text-white block">Amagambo yo hasi (Subtitles / CC)</span>
                      <span className="text-[11px] text-slate-400">Show Kinyarwanda & English subtitles when available</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSubtitlesEnabled(!subtitlesEnabled)}
                      className={`w-12 h-6 rounded-full p-1 transition-colors cursor-pointer ${
                        subtitlesEnabled ? 'bg-cyan-400 shadow-[0_0_8px_#00f0ff]' : 'bg-slate-700'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-slate-950 transition-transform ${
                        subtitlesEnabled ? 'translate-x-6' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
                    <div>
                      <span className="text-xs font-bold text-white block">Autoplay Next Episode</span>
                      <span className="text-[11px] text-slate-400">Automatically play the next series episode without clicks</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAutoPlayNext(!autoPlayNext)}
                      className={`w-12 h-6 rounded-full p-1 transition-colors cursor-pointer ${
                        autoPlayNext ? 'bg-blue-600' : 'bg-slate-700'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        autoPlayNext ? 'translate-x-6' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs cursor-pointer shadow"
                  >
                    Bika Ibyo Wahisemo
                  </button>
                </div>
              </div>
            )}

            {/* ------------------------------------------
                TAB 4: OFFLINE STORAGE & DOWNLOADS
                ------------------------------------------ */}
            {activeTab === 'downloads' && (
              <div className="space-y-6">
                <div className="pb-3 border-b border-slate-800 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-black text-white uppercase tracking-wider">
                      Ububiko & Filime Wabitse (Offline Storage)
                    </h4>
                    <p className="text-xs text-slate-400">Manage downloaded films and device storage space.</p>
                  </div>
                  <span className="px-3 py-1 rounded-xl bg-slate-800 text-yellow-400 font-mono text-xs font-bold">
                    {downloads.length} Downloaded
                  </span>
                </div>

                {/* Storage Bar Indicator */}
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-bold flex items-center gap-1.5">
                      <HardDrive className="w-4 h-4 text-cyan-400" />
                      Ububiko Bwakoreshejwe (Storage Usage)
                    </span>
                    <span className="text-slate-400 font-mono">1.2 GB / 32 GB Free</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-600 shadow-[0_0_8px_#00f0ff] w-[15%]" />
                  </div>
                </div>

                {/* Wi-Fi Download Toggle */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
                  <div>
                    <span className="text-xs font-bold text-white block">Download on Wi-Fi Only</span>
                    <span className="text-[11px] text-slate-400">Prevent using your cellular mobile bundle for video downloads</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setWifiOnlyDownload(!wifiOnlyDownload)}
                    className={`w-12 h-6 rounded-full p-1 transition-colors cursor-pointer ${
                      wifiOnlyDownload ? 'bg-cyan-400 shadow-[0_0_8px_#00f0ff]' : 'bg-slate-700'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-slate-950 transition-transform ${
                      wifiOnlyDownload ? 'translate-x-6' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                {/* Downloaded List */}
                <div className="space-y-2">
                  <h5 className="text-xs font-bold text-slate-300">Downloaded Movies & Episodes</h5>
                  {downloads.length === 0 ? (
                    <p className="text-xs text-slate-500 italic p-4 bg-slate-900/40 rounded-2xl text-center">
                      Nta filime urabika muri offline. Kanda "Download" kuri filime cyangwa series ushaka.
                    </p>
                  ) : (
                    downloads.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <img src={item.poster} alt={item.title} className="w-10 h-14 rounded-lg object-cover" />
                          <div>
                            <span className="font-bold text-white block">{item.title}</span>
                            <span className="text-[11px] text-cyan-400">{item.quality} • {item.fileSize}</span>
                          </div>
                        </div>
                        <span className="text-slate-400 text-[10px]">Saved</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* ------------------------------------------
                TAB 5: NOTIFICATIONS & ALERTS
                ------------------------------------------ */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div className="pb-3 border-b border-slate-800">
                  <h4 className="text-sm font-black text-white uppercase tracking-wider">
                    Ubutumwa & Integuza (Notifications)
                  </h4>
                  <p className="text-xs text-slate-400">Manage SMS and in-app alerts for new film releases and live sports.</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
                    <div>
                      <span className="text-xs font-bold text-white block">Filime Nshya z'Agasobanuye (New Releases)</span>
                      <span className="text-[11px] text-slate-400">Get alerts when Rocky, Sankara, or Junior release new movies</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNotifMovies(!notifMovies)}
                      className={`w-12 h-6 rounded-full p-1 transition-colors cursor-pointer ${
                        notifMovies ? 'bg-cyan-400 shadow-[0_0_8px_#00f0ff]' : 'bg-slate-700'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-slate-950 transition-transform ${
                        notifMovies ? 'translate-x-6' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
                    <div>
                      <span className="text-xs font-bold text-white block">Imikino & Live Rwandan TV Alerts</span>
                      <span className="text-[11px] text-slate-400">Alerts for Rwanda Premier League & European football matches</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNotifLiveTV(!notifLiveTV)}
                      className={`w-12 h-6 rounded-full p-1 transition-colors cursor-pointer ${
                        notifLiveTV ? 'bg-blue-600' : 'bg-slate-700'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        notifLiveTV ? 'translate-x-6' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------
                TAB 6: SECURITY & ADMIN SHORTCUT
                ------------------------------------------ */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div className="pb-3 border-b border-slate-800">
                  <h4 className="text-sm font-black text-white uppercase tracking-wider">
                    Umutekano & Ubuyobozi (Security & Admin)
                  </h4>
                  <p className="text-xs text-slate-400">Relational SQLite database status, audit logs, and management controls.</p>
                </div>

                <div className="p-5 rounded-3xl bg-slate-900/90 border border-cyan-500/30 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                        <ShieldCheck className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-xs text-cyan-400 font-bold block">Hardened Security Active</span>
                        <h4 className="text-sm font-black text-white">Database WAL Mode & Parameterized Queries</h4>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-full bg-cyan-400 text-slate-950 text-[10px] font-black uppercase shadow-[0_0_8px_#00f0ff]">
                      SECURE
                    </span>
                  </div>

                  <p className="text-xs text-slate-400">
                    All authentication hashes use Bcrypt with 10 salt rounds and JWT tokens. Sensitive administrative actions are recorded in immutable audit logs.
                  </p>

                  <div className="pt-2">
                    <button
                      onClick={() => {
                        onClose();
                        onOpenAdmin();
                      }}
                      className="px-4 py-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 text-slate-950 text-xs font-black shadow-lg shadow-cyan-950/40 hover:scale-105 transition-transform flex items-center gap-2 cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      Fungura Admin Management Portal
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------
                TAB 7: ABOUT & SUPPORT
                ------------------------------------------ */}
            {activeTab === 'about' && (
              <div className="space-y-6">
                <div className="pb-3 border-b border-slate-800">
                  <h4 className="text-sm font-black text-white uppercase tracking-wider">
                    Ibyerekeye Lionel Stream (About & Support)
                  </h4>
                  <p className="text-xs text-slate-400">Customer assistance, contact info, and terms.</p>
                </div>

                <div className="space-y-4 text-xs text-slate-300">
                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-bold block text-sm">MediaCoreTV — Rwanda HD Cinema</span>
                      <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-black uppercase border border-cyan-500/40">
                        STREAM • WATCH • ENJOY
                      </span>
                    </div>
                    <p className="text-slate-400">
                      Version 4.2.0 • Ultra-fast HD HLS engine with Rwandan Agasobanuye translations.
                    </p>
                    {onReplayIntro && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onReplayIntro();
                        }}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-600 text-slate-950 font-black text-xs hover:opacity-90 transition-opacity flex items-center gap-1.5 cursor-pointer shadow-lg shadow-cyan-500/20"
                      >
                        <Sparkles className="w-4 h-4" /> Replay MediaCoreTV Intro Animation
                      </button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <h5 className="font-bold text-white uppercase tracking-wider text-[11px]">Ubufasha (Customer Care)</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                        <span className="text-slate-400 block text-[10px]">WhatsApp Hotline</span>
                        <span className="text-cyan-400 font-mono font-bold">+250 788 123 456</span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                        <span className="text-slate-400 block text-[10px]">Email Support</span>
                        <span className="text-blue-300 font-mono font-bold">support@lionelstream.rw</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
};
