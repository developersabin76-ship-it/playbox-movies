import React, { useState } from 'react';
import { X, User, Lock, Mail, Camera, Clock, Bookmark, Heart, Settings, ShieldCheck, Check } from 'lucide-react';
import { UserProfile, MediaItem } from '../types';

interface UserAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onUpdateUser: (updatedUser: UserProfile) => void;
  mediaItems: MediaItem[];
  onPlayMedia: (item: MediaItem) => void;
}

export const UserAuthModal: React.FC<UserAuthModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpdateUser,
  mediaItems = [],
  onPlayMedia
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'history' | 'lists' | 'settings'>('profile');
  const [nameInput, setNameInput] = useState(user?.name || '');
  const [emailInput, setEmailInput] = useState(user?.email || '');
  const [prefLang, setPrefLang] = useState(user?.preferredLanguage || 'Kinyarwanda');
  const [avatarUrlInput, setAvatarUrlInput] = useState(user?.avatarUrl || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser({
      ...user,
      name: nameInput,
      email: emailInput,
      preferredLanguage: prefLang,
      avatarUrl: avatarUrlInput
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const continueWatchingItems = (user?.continueWatching || []).map((cw) => ({
    ...cw,
    item: (mediaItems || []).find((m) => m.id === cw.mediaId)
  }));

  const favoriteItems = (mediaItems || []).filter((m) => (user?.favorites || []).includes(m.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-2xl overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl glass-panel border border-slate-700/80 p-6 shadow-2xl text-white my-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
          <div className="flex items-center gap-3">
            <img src={user.avatarUrl} alt={user.name} className="w-12 h-12 rounded-2xl object-cover ring-2 ring-cyan-500/50" />
            <div>
              <h2 className="text-xl font-extrabold text-white">{user.name}</h2>
              <p className="text-xs text-cyan-400 font-mono">{user.email} • {user.role.toUpperCase()}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-3 mb-6 text-xs font-bold border-b border-slate-800">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'profile' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-900 text-slate-400'
            }`}
          >
            Profile Customization
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'history' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-900 text-slate-400'
            }`}
          >
            Watch History
          </button>
          <button
            onClick={() => setActiveTab('lists')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'lists' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-900 text-slate-400'
            }`}
          >
            Saved Favorites ({favoriteItems.length})
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="space-y-4">
            {savedSuccess && (
              <div className="p-3 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs flex items-center gap-2 shadow-[0_0_12px_rgba(0,229,255,0.2)]">
                <Check className="w-4 h-4 text-cyan-400" /> Profile details saved successfully!
              </div>
            )}

            <div>
              <label className="text-xs text-slate-400 block mb-1">Full Name</label>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Email Address</label>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Avatar Image URL</label>
              <input
                type="text"
                value={avatarUrlInput}
                onChange={(e) => setAvatarUrlInput(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Preferred Audio Dubbing / Language</label>
              <select
                value={prefLang}
                onChange={(e) => setPrefLang(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="Kinyarwanda">🇷🇼 Kinyarwanda (Default)</option>
                <option value="English">🇬🇧 English</option>
                <option value="French">🇫🇷 French</option>
                <option value="Swahili">🇹🇿 Swahili</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400 transition-colors"
            >
              Update Account Settings
            </button>
          </form>
        )}

        {activeTab === 'history' && (
          <div className="space-y-3 max-h-[350px] overflow-y-auto">
            {continueWatchingItems.map((cw) =>
              cw.item ? (
                <div
                  key={cw.mediaId}
                  onClick={() => {
                    onPlayMedia(cw.item!);
                    onClose();
                  }}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-cyan-500/50 cursor-pointer transition-all"
                >
                  <img src={cw.item.posterUrl} alt={cw.item.title} className="w-12 h-16 object-cover rounded-xl" />
                  <div className="flex-1">
                    <h4 className="text-xs font-bold text-white mb-1">{cw.item.title}</h4>
                    <p className="text-[10px] text-slate-400 mb-1.5">Last watched: {cw.timestamp}</p>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-cyan-400 h-full" style={{ width: `${cw.progressPercent}%` }} />
                    </div>
                  </div>
                  <span className="text-xs font-bold text-cyan-400 font-mono">{cw.progressPercent}%</span>
                </div>
              ) : null
            )}
          </div>
        )}

        {activeTab === 'lists' && (
          <div className="grid grid-cols-2 gap-3 max-h-[350px] overflow-y-auto">
            {favoriteItems.map((fav) => (
              <div
                key={fav.id}
                onClick={() => {
                  onPlayMedia(fav);
                  onClose();
                }}
                className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/50 cursor-pointer transition-all"
              >
                <img src={fav.posterUrl} alt={fav.title} className="w-full aspect-[2/3] object-cover rounded-lg mb-2" />
                <p className="text-xs font-bold text-white truncate">{fav.title}</p>
                <p className="text-[10px] text-amber-400">{fav.rating}★ Rating</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
