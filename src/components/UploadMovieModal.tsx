import React, { useState } from 'react';
import { X, Film, Upload, Play, Sparkles, CheckCircle2, AlertCircle, Mic2, Tag, Database, Image, Clock, Flame } from 'lucide-react';
import { saveMovieToFirestore } from '../services/firestoreMovieService';

interface UploadMovieModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMovieAdded: () => void;
}

export const UploadMovieModal: React.FC<UploadMovieModalProps> = ({
  isOpen,
  onClose,
  onMovieAdded
}) => {
  // 5 Essential Fields requested by user:
  // 1. Movie Title / Logo
  // 2. Movie Video URL (MP4, HLS, YouTube, or Embed)
  // 3. Movie Logo / Poster URL
  // 4. Umusobanuzi (Translator)
  // 5. Type / Genre (Horror, Action, etc.)
  const [title, setTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  const [backdropUrl, setBackdropUrl] = useState('');
  const [umusobanuzi, setUmusobanuzi] = useState('Rocky Kimomo');
  const [customUmusobanuzi, setCustomUmusobanuzi] = useState('');
  const [movieType, setMovieType] = useState('Action');
  const [customMovieType, setCustomMovieType] = useState('');
  const [duration, setDuration] = useState('01:43:10');
  const [releaseYear, setReleaseYear] = useState('2026');
  const [isHeroFeatured, setIsHeroFeatured] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const umusobanuziList = [
    'Rocky Kimomo',
    'Junior Giti',
    'Sankara',
    'Sikov',
    'Yvan',
    'Savimbi',
    'Patrick',
    'Gasongo',
    'Chris',
    'Other (Type Below)'
  ];

  const genresList = [
    'Action',
    'Horror 💀',
    'Sci-Fi',
    'Drama',
    'Thriller',
    'Comedy',
    'Romance',
    'Adventure',
    'Animation',
    'Series / Episode',
    'Other (Type Below)'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!title.trim()) {
      setErrorMessage('Please enter a movie title.');
      return;
    }
    if (!videoUrl.trim()) {
      setErrorMessage('Please enter a movie video URL (MP4, HLS m3u8, YouTube, or Embed).');
      return;
    }

    const finalUmusobanuzi = umusobanuzi === 'Other (Type Below)'
      ? (customUmusobanuzi.trim() || 'Agasobanuye')
      : umusobanuzi;

    const rawType = movieType === 'Other (Type Below)'
      ? (customMovieType.trim() || 'Action')
      : movieType;

    const finalType = rawType.replace(' 💀', '');
    const defaultPoster = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80';
    const finalPoster = posterUrl.trim() || defaultPoster;
    const finalBackdrop = backdropUrl.trim() || finalPoster;

    setIsSubmitting(true);

    const movieId = `movie_${Date.now()}`;
    const payload = {
      id: movieId,
      title: title.trim(),
      videoUrl: videoUrl.trim(),
      posterUrl: finalPoster,
      logoUrl: finalPoster,
      backdropUrl: finalBackdrop,
      umusobanuzi: finalUmusobanuzi,
      type_category: finalType,
      type: finalType.toLowerCase().includes('series') ? 'series' : 'movie',
      genres: [finalType],
      duration: duration.trim() || '01:43:10',
      year: parseInt(releaseYear, 10) || 2026,
      rating: 9.5,
      quality: '1080p FHD',
      isHeroFeatured: isHeroFeatured,
      description: `Agasobanuye ${finalType} film translated by ${finalUmusobanuzi}.`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      // 1. Save directly to Firebase Firestore database
      await saveMovieToFirestore(payload);

      // 2. Also notify backend
      fetch('/api/custom-movies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(() => {});

      setSuccessMessage(`"${title.trim()}" saved to database successfully & added to 3-second Hero Slider!`);
      
      setTimeout(() => {
        onMovieAdded();
        onClose();
      }, 1000);

    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save movie to database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-gradient-to-b from-[#0a1426] to-[#040813] border border-cyan-400/40 rounded-3xl overflow-hidden shadow-2xl shadow-cyan-950/80 my-auto text-slate-200 mirror-shine">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-cyan-400/20 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-slate-950 font-black shadow-[0_0_15px_#00f0ff]">
              <Upload className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h2 className="text-base font-black text-white tracking-wide flex items-center gap-2">
                UPLOAD AGASOBANUYE FILM
                <span className="px-2 py-0.5 rounded-md text-[9px] font-black bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 flex items-center gap-1 shadow-[0_0_8px_rgba(0,240,255,0.3)]">
                  <Database className="w-2.5 h-2.5" /> FIRESTORE DB
                </span>
              </h2>
              <p className="text-xs text-cyan-300/80">
                Add video URL, poster, Umusobanuzi & genre to store permanently
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
          
          {successMessage && (
            <div className="p-3.5 rounded-2xl bg-cyan-950/80 border border-cyan-400 text-cyan-300 text-xs font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(0,240,255,0.2)]">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {successMessage}
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-red-950/80 border border-red-400 text-red-300 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {errorMessage}
            </div>
          )}

          {/* 1. MOVIE TITLE */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Film className="w-3.5 h-3.5 text-cyan-400" /> Movie Title / Logo Name *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. LUCKY STRIKE (Agasobanuye)"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950/90 border border-cyan-500/30 text-white text-sm font-medium focus:border-cyan-400 focus:outline-none placeholder:text-slate-600 focus:shadow-[0_0_12px_rgba(0,240,255,0.25)]"
            />
          </div>

          {/* 2. MOVIE VIDEO URL */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Play className="w-3.5 h-3.5 text-cyan-400" /> Movie Video URL (Direct MP4 / HLS .m3u8 / YouTube / Embed) *
            </label>
            <input
              type="url"
              required
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://.../video.mp4 or .m3u8 or YouTube URL"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950/90 border border-cyan-500/30 text-cyan-300 font-mono text-xs focus:border-cyan-400 focus:outline-none placeholder:text-slate-600 focus:shadow-[0_0_12px_rgba(0,240,255,0.25)]"
            />
          </div>

          {/* 3. MOVIE POSTER / LOGO & BACKDROP URL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Movie Poster / Logo URL
              </label>
              <input
                type="url"
                value={posterUrl}
                onChange={(e) => setPosterUrl(e.target.value)}
                placeholder="https://.../poster.jpg"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950/90 border border-cyan-500/30 text-white text-xs focus:border-cyan-400 focus:outline-none placeholder:text-slate-600"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Image className="w-3.5 h-3.5 text-cyan-400" /> Hero Slider Banner Image / Video URL
              </label>
              <input
                type="url"
                value={backdropUrl}
                onChange={(e) => setBackdropUrl(e.target.value)}
                placeholder="https://.../banner.jpg"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950/90 border border-cyan-500/30 text-white text-xs focus:border-cyan-400 focus:outline-none placeholder:text-slate-600"
              />
            </div>
          </div>

          {/* 4. UMUSOBANUZI & 5. MOVIE TYPE / GENRE */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            {/* UMUSOBANUZI */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Mic2 className="w-3.5 h-3.5 text-cyan-400" /> Umusobanuzi (Translator) *
              </label>
              <select
                value={umusobanuzi}
                onChange={(e) => setUmusobanuzi(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950/90 border border-cyan-500/30 text-white text-xs font-bold focus:border-cyan-400 focus:outline-none"
              >
                {umusobanuziList.map((u) => (
                  <option key={u} value={u} className="bg-slate-900 text-white">{u}</option>
                ))}
              </select>

              {umusobanuzi === 'Other (Type Below)' && (
                <input
                  type="text"
                  placeholder="Enter translator name..."
                  value={customUmusobanuzi}
                  onChange={(e) => setCustomUmusobanuzi(e.target.value)}
                  className="w-full mt-1.5 px-3 py-2 rounded-xl bg-slate-950 border border-cyan-500/40 text-white text-xs focus:outline-none"
                />
              )}
            </div>

            {/* MOVIE TYPE / GENRE */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-cyan-400" /> Movie Type / Genre *
              </label>
              <select
                value={movieType}
                onChange={(e) => setMovieType(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950/90 border border-cyan-500/30 text-white text-xs font-bold focus:border-cyan-400 focus:outline-none"
              >
                {genresList.map((g) => (
                  <option key={g} value={g} className="bg-slate-900 text-white">{g}</option>
                ))}
              </select>

              {movieType === 'Other (Type Below)' && (
                <input
                  type="text"
                  placeholder="Enter genre / type..."
                  value={customMovieType}
                  onChange={(e) => setCustomMovieType(e.target.value)}
                  className="w-full mt-1.5 px-3 py-2 rounded-xl bg-slate-950 border border-cyan-500/40 text-white text-xs focus:outline-none"
                />
              )}
            </div>

          </div>

          {/* DURATION & HERO SLIDER TOGGLE */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-cyan-400" /> Duration
              </label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="01:43:10"
                className="w-full px-3 py-2 rounded-xl bg-slate-950/90 border border-cyan-500/30 text-white text-xs focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 pt-6">
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-white">
                <input
                  type="checkbox"
                  checked={isHeroFeatured}
                  onChange={(e) => setIsHeroFeatured(e.target.checked)}
                  className="w-4 h-4 rounded text-cyan-400 bg-slate-900 border-cyan-500 focus:ring-0"
                />
                <span className="flex items-center gap-1 text-cyan-400">
                  <Flame className="w-3.5 h-3.5" /> Feature in Top 3-Second Slider
                </span>
              </label>
            </div>
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
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-slate-950 font-black text-xs shadow-[0_0_15px_#00f0ff] transition-all hover:scale-[1.02] flex items-center gap-2 cursor-pointer"
            >
              <Database className="w-4 h-4 text-slate-950" />
              {isSubmitting ? 'Saving to Database...' : 'Save to Cloud Database'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
