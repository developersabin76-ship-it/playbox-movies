import React, { useState, useEffect } from 'react';
import { X, Tv, Save, CheckCircle2, AlertCircle, Play, Sparkles, Image, Link } from 'lucide-react';
import { TvChannel } from '../types';
import { saveChannelToFirestore } from '../services/firestoreMovieService';

interface EditChannelModalProps {
  isOpen: boolean;
  channel: TvChannel | null;
  onClose: () => void;
  onChannelUpdated: () => void;
}

export const EditChannelModal: React.FC<EditChannelModalProps> = ({
  isOpen,
  channel,
  onClose,
  onChannelUpdated
}) => {
  const [name, setName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [streamUrl, setStreamUrl] = useState('');
  const [category, setCategory] = useState('Rwandan TV');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (channel) {
      setName(channel.name || '');
      setLogoUrl(channel.logo || channel.logoUrl || '');
      setStreamUrl(channel.streamUrl || '');
      setCategory(channel.category || 'Rwandan TV');
      setSuccessMsg(null);
      setErrorMsg(null);
    }
  }, [channel, isOpen]);

  if (!isOpen || !channel) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!name.trim()) {
      setErrorMsg('Please enter a channel name.');
      return;
    }
    if (!streamUrl.trim()) {
      setErrorMsg('Please provide a live streaming URL.');
      return;
    }

    setIsSubmitting(true);

    const updatedChannel: TvChannel = {
      ...channel,
      name: name.trim(),
      logo: logoUrl.trim() || channel.logo,
      logoUrl: logoUrl.trim() || channel.logoUrl,
      streamUrl: streamUrl.trim(),
      category: category.trim(),
      isLive: true
    };

    try {
      await saveChannelToFirestore(updatedChannel);
      setSuccessMsg(`Channel "${name.trim()}" updated & synced to Firestore database!`);
      setTimeout(() => {
        onChannelUpdated();
        onClose();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update channel.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-[#0e172f] to-[#060b18] border border-emerald-400/40 rounded-3xl overflow-hidden shadow-2xl shadow-emerald-950/80 my-auto text-slate-200 mirror-shine">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-emerald-500/20 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/30">
              <Tv className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h2 className="text-base font-black text-white tracking-wide flex items-center gap-2">
                EDIT TV / CHANNEL STREAM
                <span className="px-2 py-0.5 rounded-md text-[9px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  ADMIN
                </span>
              </h2>
              <p className="text-xs text-emerald-300/80">
                Update logo URL or live stream URL to stream on your website
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-400 text-emerald-300 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {successMsg}
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-red-950/80 border border-red-400 text-red-300 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {errorMsg}
            </div>
          )}

          {/* Current Channel Preview */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
            <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center p-1 overflow-hidden shrink-0">
              {logoUrl ? (
                <img src={logoUrl} alt={name} className="w-full h-full object-contain" />
              ) : (
                <Tv className="w-6 h-6 text-slate-500" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-black text-white block truncate">{name || 'Channel Title'}</span>
              <span className="text-[11px] text-emerald-400 font-mono block truncate">{streamUrl || 'No stream url set'}</span>
            </div>
          </div>

          {/* 1. CHANNEL NAME */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Tv className="w-3.5 h-3.5 text-emerald-400" /> Channel / Station Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. RBA TV Rwanda, Flash TV, TV10"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950/90 border border-emerald-500/30 text-white text-sm font-medium focus:border-emerald-400 focus:outline-none"
            />
          </div>

          {/* 2. CHANNEL LOGO URL */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Image className="w-3.5 h-3.5 text-emerald-400" /> Channel Logo Image URL
            </label>
            <input
              type="url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://.../logo.png"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950/90 border border-emerald-500/30 text-white text-xs focus:border-emerald-400 focus:outline-none placeholder:text-slate-600"
            />
          </div>

          {/* 3. LIVE STREAMING URL */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Link className="w-3.5 h-3.5 text-emerald-400" /> Live Stream URL (HLS .m3u8 / MP4 / YouTube / Embed) *
            </label>
            <input
              type="url"
              required
              value={streamUrl}
              onChange={(e) => setStreamUrl(e.target.value)}
              placeholder="https://.../live/stream.m3u8 or YouTube live URL"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950/90 border border-emerald-500/30 text-emerald-300 font-mono text-xs focus:border-emerald-400 focus:outline-none placeholder:text-slate-600"
            />
            <p className="text-[11px] text-slate-400">
              Supports HLS (.m3u8), direct video (.mp4), YouTube Live, or authorized iframe embeds.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/30 transition-all hover:scale-[1.02] flex items-center gap-2"
            >
              <Save className="w-4 h-4 text-slate-950" />
              {isSubmitting ? 'Saving Channel...' : 'Save & Sync Channel'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
