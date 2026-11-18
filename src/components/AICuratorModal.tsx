import React, { useState } from 'react';
import { X, Sparkles, Film, Play, Send, CheckCircle2, Zap } from 'lucide-react';
import { MediaItem } from '../types';

interface AICuratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaItems: MediaItem[];
  onPlayMedia: (item: MediaItem) => void;
}

export const AICuratorModal: React.FC<AICuratorModalProps> = ({
  isOpen,
  onClose,
  mediaItems = [],
  onPlayMedia
}) => {
  const [promptInput, setPromptInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState<{
    headline: string;
    summary: string;
    recommendedIds: string[];
    tags: string[];
  } | null>({
    headline: 'Lionel Stream AI Curator Ready',
    summary: 'Tell me your current vibe or preferences (e.g. "Mind-bending Rwandan sci-fi", "High-octane African action heist", or "Top rated 2026 releases"), and I will curate custom picks for you.',
    recommendedIds: ['m1', 's1', 'm2', 'm5'],
    tags: ['Rwandan Cinema', '4K Blockbuster', 'Top Rated']
  });

  if (!isOpen) return null;

  const handleGenerateRecommendation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptInput.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/ai/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userPrompt: promptInput })
      });
      const data = await res.json();
      setAiResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const recommendedItems = (mediaItems || []).filter((m) =>
    aiResult?.recommendedIds?.includes(m.id)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-2xl overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-3xl glass-panel border border-purple-500/40 p-6 shadow-2xl text-white my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 via-indigo-600 to-cyan-500 p-[1px] shadow-lg shadow-purple-500/30">
              <div className="w-full h-full bg-slate-950 rounded-[15px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                Ask Lionel Stream AI Curator
              </h2>
              <p className="text-xs text-purple-300/80 font-mono">
                Powered by Gemini AI • Smart Vibe Match Engine
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* AI Prompt Input Form */}
        <form onSubmit={handleGenerateRecommendation} className="mb-6 space-y-3">
          <div className="relative">
            <input
              type="text"
              placeholder="e.g. Find me an inspiring Rwandan drama or high-octane African action movie..."
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              className="w-full pl-4 pr-28 py-3.5 rounded-2xl bg-slate-900/90 border border-purple-500/40 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 shadow-inner"
            />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-2 top-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all shadow-md"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 fill-slate-950" /> Curate Vibe
                </>
              )}
            </button>
          </div>

          {/* Preset Suggestion Chips */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-400">Try prompts:</span>
            {[
              'Rwandan Sci-Fi Thrillers',
              'African Nollywood Action',
              '4K High Rating Movies',
              'Inspiring Documentaries'
            ].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setPromptInput(preset)}
                className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-300 text-[11px]"
              >
                {preset}
              </button>
            ))}
          </div>
        </form>

        {/* AI Result Presentation */}
        {aiResult && (
          <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/40 uppercase">
                  AI Recommendation
                </span>
                {aiResult.tags?.map((t) => (
                  <span key={t} className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-cyan-300 font-mono">
                    #{t}
                  </span>
                ))}
              </div>
              <h3 className="text-lg font-bold text-white text-glow">{aiResult.headline}</h3>
              <p className="text-xs text-slate-300 leading-relaxed mt-1 font-normal">{aiResult.summary}</p>
            </div>

            {/* Recommended Movies Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {recommendedItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    onPlayMedia(item);
                    onClose();
                  }}
                  className="group flex items-center gap-3 p-3 rounded-xl bg-slate-950/90 border border-slate-800 hover:border-cyan-500/50 cursor-pointer transition-all"
                >
                  <img src={item.posterUrl} alt={item.title} className="w-12 h-16 object-cover rounded-lg" />
                  <div className="flex-1 truncate">
                    <p className="text-xs font-bold text-white group-hover:text-cyan-400 transition-colors truncate">
                      {item.title}
                    </p>
                    <p className="text-[10px] text-slate-400">{item.releaseYear} • {item.rating}★</p>
                    <span className="text-[10px] text-emerald-400 font-bold">{item.matchPercentage}% Match</span>
                  </div>
                  <Play className="w-5 h-5 text-cyan-400 fill-cyan-400" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
