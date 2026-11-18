import React, { useState } from 'react';
import {
  X,
  MessageCircle,
  Instagram,
  Facebook,
  Mail,
  Globe,
  Tv,
  ExternalLink,
  Copy,
  Check,
  Code2,
  Sparkles,
  ShieldCheck,
  MapPin,
  Briefcase,
  Terminal,
  Cpu,
  Layers,
  Flame,
  Award,
  Send
} from 'lucide-react';
import { DeveloperProfile } from '../types';
import { MediaCoreLogo } from './MediaCoreLogo';

interface DeveloperPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  developer: DeveloperProfile;
}

export const DeveloperPortalModal: React.FC<DeveloperPortalModalProps> = ({
  isOpen,
  onClose,
  developer
}) => {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  if (!isOpen) return null;

  // Format WhatsApp Link
  const cleanPhone = developer.whatsapp ? developer.whatsapp.replace(/[^0-9]/g, '') : '';
  const whatsappUrl = developer.whatsapp?.startsWith('http')
    ? developer.whatsapp
    : `https://wa.me/${cleanPhone}?text=${encodeURIComponent('Hello Lionel, I visited MediaCoreTV and would like to connect!')}`;

  // Format Instagram Link
  const instagramUrl = developer.instagram?.startsWith('http')
    ? developer.instagram
    : `https://instagram.com/${developer.instagram?.replace('@', '')}`;

  // Format Facebook Link
  const facebookUrl = developer.facebook?.startsWith('http')
    ? developer.facebook
    : `https://facebook.com/${developer.facebook}`;

  // Format Portfolio Link
  const portfolioUrl = developer.portfolioUrl?.startsWith('http')
    ? developer.portfolioUrl
    : `https://${developer.portfolioUrl}`;

  // Format Channel Link
  const channelUrl = developer.channelUrl?.startsWith('http')
    ? developer.channelUrl
    : developer.channelUrl
    ? `https://${developer.channelUrl}`
    : 'https://youtube.com';

  const handleCopyEmail = () => {
    if (developer.email) {
      navigator.clipboard.writeText(developer.email);
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    }
  };

  const handleCopyPhone = () => {
    if (developer.whatsapp) {
      navigator.clipboard.writeText(developer.whatsapp);
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-xl overflow-y-auto animate-fadeIn select-none">
      
      {/* Container with High-Contrast Neon Obsidian Card */}
      <div className="relative w-full max-w-3xl bg-[#050914] rounded-3xl border-2 border-cyan-500/50 shadow-[0_0_50px_rgba(0,229,255,0.25)] overflow-hidden my-auto">
        
        {/* Top Gradient Banner */}
        <div className="relative h-36 sm:h-44 w-full bg-gradient-to-r from-blue-950 via-[#071329] to-cyan-950 overflow-hidden">
          <img
            src={developer.bannerUrl || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1600&q=80'}
            alt="Developer Banner"
            className="w-full h-full object-cover opacity-35 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050914] via-transparent to-black/40" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-9 h-9 rounded-2xl bg-black/60 hover:bg-slate-800 border border-cyan-500/40 text-slate-300 hover:text-white flex items-center justify-center transition-all hover:scale-105 cursor-pointer shadow-lg"
            title="Close Portal"
          >
            <X className="w-5 h-5 text-cyan-400" />
          </button>

          {/* Platform Emblem on top left of banner */}
          <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-black/70 border border-cyan-500/40 backdrop-blur-md">
            <MediaCoreLogo size="sm" showTagline={false} />
            <span className="text-[11px] font-black text-cyan-300 tracking-wider">
              MEDIACORE<span className="text-cyan-400">TV</span> ARCHITECT
            </span>
          </div>
        </div>

        {/* Profile Details Header Section */}
        <div className="px-5 sm:px-8 -mt-16 sm:-mt-20 relative z-10 space-y-6 pb-8">
          
          {/* Avatar and Main Info Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {/* Profile Avatar with Neon Glow */}
              <div className="relative group">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl p-1 bg-gradient-to-tr from-cyan-400 via-sky-400 to-blue-500 shadow-[0_0_25px_rgba(0,229,255,0.4)]">
                  <img
                    src={developer.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
                    alt={developer.name}
                    className="w-full h-full object-cover rounded-[22px]"
                  />
                </div>
                <div className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-lg bg-cyan-400 text-slate-950 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-[0_0_10px_#00f0ff] border border-slate-950">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Verified</span>
                </div>
              </div>

              {/* Names & Titles */}
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide">
                    {developer.name}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 text-[10px] font-black uppercase tracking-wider">
                    {developer.statusBadge || 'Platform Developer'}
                  </span>
                </div>

                <p className="text-xs sm:text-sm font-bold text-cyan-300 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>{developer.role}</span>
                </p>

                <p className="text-[11px] text-slate-400 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>{developer.location || 'Kigali, Rwanda'}</span>
                  {developer.experienceYears && (
                    <span className="ml-2 px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-bold">
                      {developer.experienceYears}+ Years Exp.
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Quick Contact Primary Button */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black text-xs shadow-[0_0_20px_rgba(0,240,255,0.4)] hover:scale-105 transition-all cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 fill-slate-950" />
                <span>Chat on WhatsApp</span>
              </a>

              {developer.portfolioUrl && (
                <a
                  href={portfolioUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 hover:text-white font-black text-xs transition-all hover:scale-105 cursor-pointer shadow"
                  title="View Portfolio"
                >
                  <Globe className="w-4 h-4 text-cyan-400" />
                  <span className="hidden sm:inline">Portfolio</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

          </div>

          {/* Developer Bio & Platform Mission */}
          <div className="p-4 rounded-2xl bg-[#081024] border border-cyan-900/50 space-y-2">
            <div className="flex items-center gap-2 text-xs font-black text-cyan-300 uppercase tracking-wider">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span>About Developer & System Architecture</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              {developer.bio}
            </p>
          </div>

          {/* ==========================================
              INTERACTIVE CONTACT & SOCIAL HUBS
              ========================================== */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Official Social & Direct Contact Channels</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              
              {/* 1. WHATSAPP */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-950/40 via-slate-900 to-slate-950 border border-cyan-500/40 hover:border-cyan-400 transition-all flex flex-col justify-between gap-3 group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform shadow-[0_0_10px_rgba(0,240,255,0.3)]">
                      <MessageCircle className="w-5 h-5 fill-cyan-400/30" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white">WhatsApp</h4>
                      <p className="text-[10px] text-cyan-400 font-bold">Direct Messaging</p>
                    </div>
                  </div>
                  <button
                    onClick={handleCopyPhone}
                    className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                    title="Copy Phone Number"
                  >
                    {copiedPhone ? <Check className="w-3.5 h-3.5 text-cyan-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="text-[11px] font-mono text-slate-300 truncate">
                  {developer.whatsapp || '+250 788 123 456'}
                </div>

                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 rounded-xl bg-cyan-600/20 hover:bg-cyan-500 border border-cyan-500/50 hover:border-cyan-400 text-cyan-300 hover:text-slate-950 text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-[0_0_12px_rgba(0,240,255,0.2)]"
                >
                  <span>Open WhatsApp</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* 2. INSTAGRAM */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-pink-950/40 via-slate-900 to-slate-950 border border-pink-500/40 hover:border-pink-400 transition-all flex flex-col justify-between gap-3 group">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 p-0.5 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                    <div className="w-full h-full bg-[#0d1222] rounded-[10px] flex items-center justify-center">
                      <Instagram className="w-4 h-4 text-pink-400" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white">Instagram</h4>
                    <p className="text-[10px] text-pink-400 font-bold">Photos & Updates</p>
                  </div>
                </div>

                <div className="text-[11px] font-mono text-slate-300 truncate">
                  {developer.instagram || '@lionel_sabin'}
                </div>

                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 rounded-xl bg-pink-600/20 hover:bg-gradient-to-r hover:from-pink-600 hover:to-purple-600 border border-pink-500/50 hover:border-pink-400 text-pink-300 hover:text-white text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <span>View Instagram</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* 3. FACEBOOK */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-950/40 via-slate-900 to-slate-950 border border-blue-500/40 hover:border-blue-400 transition-all flex flex-col justify-between gap-3 group">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/50 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                    <Facebook className="w-5 h-5 fill-blue-400/30" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white">Facebook</h4>
                    <p className="text-[10px] text-blue-400 font-bold">Community & Page</p>
                  </div>
                </div>

                <div className="text-[11px] font-mono text-slate-300 truncate">
                  {developer.facebook || 'lionel.sabin.dev'}
                </div>

                <a
                  href={facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600 border border-blue-500/50 hover:border-blue-400 text-blue-300 hover:text-white text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <span>Connect on Facebook</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* 4. OFFICIAL EMAIL */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-950/40 via-slate-900 to-slate-950 border border-cyan-500/40 hover:border-cyan-400 transition-all flex flex-col justify-between gap-3 group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white">Official Email</h4>
                      <p className="text-[10px] text-cyan-400 font-bold">Inquiries & Jobs</p>
                    </div>
                  </div>
                  <button
                    onClick={handleCopyEmail}
                    className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                    title="Copy Email Address"
                  >
                    {copiedEmail ? <Check className="w-3.5 h-3.5 text-cyan-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="text-[11px] font-mono text-cyan-200 truncate">
                  {developer.email || 'developersabin76@gmail.com'}
                </div>

                <a
                  href={`mailto:${developer.email || 'developersabin76@gmail.com'}?subject=${encodeURIComponent('Inquiry from MediaCoreTV visitor')}`}
                  className="w-full py-2 rounded-xl bg-cyan-600/20 hover:bg-cyan-600 border border-cyan-500/50 hover:border-cyan-400 text-cyan-300 hover:text-slate-950 text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Send className="w-3 h-3" />
                  <span>Send Direct Email</span>
                </a>
              </div>

              {/* 5. DEVELOPER MEDIA / YOUTUBE CHANNEL */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-red-950/40 via-slate-900 to-slate-950 border border-red-500/40 hover:border-red-400 transition-all flex flex-col justify-between gap-3 group">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-red-600/20 border border-red-500/50 flex items-center justify-center text-red-400 group-hover:scale-110 transition-transform">
                    <Tv className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white">Media Channel</h4>
                    <p className="text-[10px] text-red-400 font-bold">Videos & Cinema</p>
                  </div>
                </div>

                <div className="text-[11px] font-bold text-white truncate">
                  {developer.channelName || 'Sabin Media & Cinema Tech'}
                </div>

                <a
                  href={channelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 rounded-xl bg-red-600/20 hover:bg-red-600 border border-red-500/50 hover:border-red-400 text-red-300 hover:text-white text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <span>Visit Channel Portal</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* 6. DEVELOPER PORTFOLIO */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-950/40 via-slate-900 to-slate-950 border border-purple-500/40 hover:border-purple-400 transition-all flex flex-col justify-between gap-3 group">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/50 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white">Web Portfolio</h4>
                    <p className="text-[10px] text-purple-400 font-bold">Full Projects Showcase</p>
                  </div>
                </div>

                <div className="text-[11px] font-mono text-purple-300 truncate">
                  {developer.portfolioUrl || 'sabin-portfolio.dev'}
                </div>

                <a
                  href={portfolioUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600 border border-purple-500/50 hover:border-purple-400 text-purple-300 hover:text-white text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <span>Visit Portfolio URL</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

            </div>
          </div>

          {/* ==========================================
              TECH STACK & CORE SYSTEM SKILLS
              ========================================== */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>Engine Competencies & MediaCoreTV Tech Stack</span>
            </h3>

            <div className="flex flex-wrap gap-2">
              {developer.skills && developer.skills.map((skill, idx) => (
                <div
                  key={idx}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 border border-cyan-900/60 hover:border-cyan-400/80 text-cyan-300 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <Code2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{skill}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Card */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-blue-950/60 to-cyan-950/60 border border-cyan-500/30">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Available for custom streaming platforms, mobile apps & web engineering.</span>
            </div>
            
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 text-slate-950 font-black text-xs hover:scale-105 transition-transform shadow-[0_0_12px_#00f0ff]"
            >
              Get In Touch
            </a>
          </div>

        </div>

      </div>
    </div>
  );
};
