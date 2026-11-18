import React, { useState } from 'react';
import {
  X,
  Send,
  Film,
  Sparkles,
  MessageCircle,
  CheckCircle2,
  Phone,
  HelpCircle
} from 'lucide-react';

interface RequestMovieModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TRANSLATORS = [
  'Junior Giti',
  'Sankara da Premier',
  'Rocky Kirabiranya (Kimomo)',
  'Gaheza Simba',
  'Savimbi',
  'Gasirabo',
  'Yvan',
  'Aba-Stars',
  'Master Sikov',
  'P-Kaly',
  'Uwo ariwe wese (Any)'
];

export const RequestMovieModal: React.FC<RequestMovieModalProps> = ({ isOpen, onClose }) => {
  const [movieTitle, setMovieTitle] = useState('');
  const [translator, setTranslator] = useState('Junior Giti');
  const [category, setCategory] = useState('Action');
  const [userContact, setUserContact] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!movieTitle.trim()) return;

    // Save request to localStorage
    const saved = localStorage.getItem('agasobanuye_user_requests');
    const existing = saved ? JSON.parse(saved) : [];
    existing.unshift({
      id: `req_${Date.now()}`,
      title: movieTitle.trim(),
      translator,
      category,
      contact: userContact.trim(),
      notes: notes.trim(),
      createdAt: new Date().toISOString()
    });
    localStorage.setItem('agasobanuye_user_requests', JSON.stringify(existing.slice(0, 50)));

    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setMovieTitle('');
      setNotes('');
      onClose();
    }, 2500);
  };

  const handleSendViaWhatsApp = () => {
    const text = encodeURIComponent(
      `Muraho Lionel Stream & AgasobanuyeFree! Ndasaba ko mwandurira iyi filime:\n🎬 Izina: ${movieTitle || 'Filime nshya'}\n🎙️ Umusobanuzi: ${translator}\n📂 Icyiciro: ${category}\n📝 Ibisobanuro: ${notes || 'N/A'}`
    );
    window.open(`https://wa.me/250788888888?text=${text}`, '_blank');
  };

  const handleSendViaTelegram = () => {
    const text = encodeURIComponent(
      `Muraho! Ndasaba filime: ${movieTitle || 'Filime nshya'} (Umusobanuzi: ${translator})`
    );
    window.open(`https://t.me/lionelstream?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#030712] border-2 border-cyan-400/50 p-6 sm:p-7 shadow-[0_0_50px_rgba(14,165,233,0.3)] text-white overflow-hidden">
        
        {/* Top Mirror Blue Specular Glow Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-600 shadow-[0_0_20px_#00f0ff]" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-cyan-900/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <Film className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                SABA FILIME <span className="text-cyan-400 text-xs font-bold px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40">REQUEST</span>
              </h3>
              <p className="text-xs text-slate-400">
                Andika filime wifuza ko tuguha cyangwa tuguhe amakuru
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-cyan-400 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSubmitted ? (
          <div className="py-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-cyan-500/20 border-2 border-cyan-400 flex items-center justify-center mx-auto text-cyan-400 shadow-[0_0_30px_rgba(14,165,233,0.5)]">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-black text-white">Ubusabe bwakiriwe neza!</h4>
            <p className="text-xs text-slate-300 max-w-xs mx-auto">
              Iyi filime irasuzumwa n'abasobanuzi, irashyirwa ku rubuga vuba cyane.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                Izina rya Filime cyangwa Series *
              </label>
              <input
                type="text"
                required
                value={movieTitle}
                onChange={(e) => setMovieTitle(e.target.value)}
                placeholder="Urugero: Beekeeper, Gladiator 2, Mutiny, Fast X..."
                className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-cyan-900/50 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 text-sm text-white placeholder-slate-600 outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Umusobanuzi Wifuza
                </label>
                <select
                  value={translator}
                  onChange={(e) => setTranslator(e.target.value)}
                  className="w-full px-3 py-3 rounded-2xl bg-slate-950 border border-cyan-900/50 focus:border-cyan-400 text-xs font-semibold text-white outline-none cursor-pointer"
                >
                  {TRANSLATORS.map((t) => (
                    <option key={t} value={t} className="bg-slate-950 text-white">
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Icyiciro / Genre
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-3 rounded-2xl bg-slate-950 border border-cyan-900/50 focus:border-cyan-400 text-xs font-semibold text-white outline-none cursor-pointer"
                >
                  <option value="Action">Action & Thriller</option>
                  <option value="Adventure">Adventure</option>
                  <option value="Series">TV Series</option>
                  <option value="Karate">Karate & Kung Fu</option>
                  <option value="Indian">Indian Cinema</option>
                  <option value="Horror">Horror</option>
                  <option value="Animation">Animation / Cartoons</option>
                  <option value="Drama">Drama & Romance</option>
                  <option value="War">War & Historical</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-cyan-400" />
                Nimero yawe ya WhatsApp cyangwa Email (Bikugirire akamaro)
              </label>
              <input
                type="text"
                value={userContact}
                onChange={(e) => setUserContact(e.target.value)}
                placeholder="+250 788 000 000 cyangwa email@gmail.com"
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-cyan-900/50 focus:border-cyan-400 text-xs text-white placeholder-slate-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
                Ibindi bisobanuro (Season, Episode, cyangwa Umwaka)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Niba ari Series, vuga Season n'Episode ushaka..."
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-cyan-900/50 focus:border-cyan-400 text-xs text-white placeholder-slate-600 outline-none resize-none"
              />
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
              <button
                type="submit"
                className="w-full sm:flex-1 py-3 px-5 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-[0_0_25px_rgba(14,165,233,0.6)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Ohereza Ubusabe (Submit)</span>
              </button>

              <button
                type="button"
                onClick={handleSendViaWhatsApp}
                className="w-full sm:w-auto py-3 px-4 rounded-2xl bg-[#0c1e38] hover:bg-[#122c54] border border-cyan-500/40 text-cyan-300 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
                title="Send request via WhatsApp"
              >
                <MessageCircle className="w-4 h-4 text-cyan-400" />
                <span>WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={handleSendViaTelegram}
                className="w-full sm:w-auto py-3 px-4 rounded-2xl bg-[#0c1e38] hover:bg-[#122c54] border border-cyan-500/40 text-cyan-300 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
                title="Send request via Telegram"
              >
                <Send className="w-4 h-4 text-sky-400" />
                <span>Telegram</span>
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
