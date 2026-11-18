import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  MessageSquare,
  Users,
  Smile,
  Flame,
  Heart,
  ThumbsUp,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { UserProfile } from '../types';

interface ChatMessage {
  id: string;
  senderName: string;
  avatarUrl?: string;
  text: string;
  timestamp: string;
  isVip?: boolean;
  isAdmin?: boolean;
  likes?: number;
}

interface CommunityChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  currentTitle?: string;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg_1',
    senderName: 'Eric Mugisha',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    text: 'Iyi filime iraryoshye cyane! Junior Giti ni intyoza kabisa 🔥',
    timestamp: '2 min ago',
    isVip: true,
    likes: 14
  },
  {
    id: 'msg_2',
    senderName: 'Claude Nshimiyimana',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    text: 'TV1 na RTV live stream ziranyerera nta gucikagurika! Stream irakora neza 👏',
    timestamp: '1 min ago',
    likes: 8
  },
  {
    id: 'msg_3',
    senderName: 'Lionel Sabin',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
    text: 'Murakaza neza kuri AGASOBANUYEFREE / LIONEL STREAM! Episode nshya zose zamaze gusohoka.',
    timestamp: 'Just now',
    isAdmin: true,
    likes: 29
  },
  {
    id: 'msg_4',
    senderName: 'Divine Uwase',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    text: 'Sankara na Rocky Kirabiranya nabo bafite filime zishyushye hano!',
    timestamp: 'Just now',
    isVip: true,
    likes: 5
  }
];

export const CommunityChatModal: React.FC<CommunityChatModalProps> = ({
  isOpen,
  onClose,
  user,
  currentTitle = 'Live Stream & Movies'
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [onlineCount, setOnlineCount] = useState(148);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, messages]);

  // Periodic random online user flutter
  useEffect(() => {
    const interval = setInterval(() => {
      setOnlineCount((prev) => prev + Math.floor(Math.random() * 5) - 2);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  if (!isOpen) return null;

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      senderName: user.name || 'Agasobanuye Fan',
      avatarUrl: user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      text: inputText.trim(),
      timestamp: 'Just now',
      isVip: user.subscription?.status === 'ACTIVE',
      isAdmin: user.role === 'ADMIN',
      likes: 0
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText('');
  };

  const handleQuickReaction = (emoji: string) => {
    setInputText((prev) => prev + ' ' + emoji);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end sm:p-6 bg-black/60 backdrop-blur-sm select-none">
      <div className="relative w-full sm:w-[420px] h-[550px] max-h-[90vh] rounded-t-3xl sm:rounded-3xl bg-[#030712] border border-cyan-500/30 sm:border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5">
        
        {/* Chat Header */}
        <div className="p-4 bg-slate-900/90 border-b border-cyan-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-400 to-blue-500 flex items-center justify-center text-slate-950 shadow-[0_0_10px_#00e5ff]">
              <MessageSquare className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                Community Live Chat
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#00f0ff]" />
              </h3>
              <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                <Users className="w-3 h-3 text-cyan-400" />
                <span className="text-cyan-300 font-bold">{onlineCount}</span> online reba movie
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Watching Context Badge */}
        <div className="px-4 py-1.5 bg-cyan-950/30 border-b border-cyan-900/30 flex items-center justify-between text-[11px]">
          <span className="text-slate-400 truncate max-w-[240px]">
            Streaming: <strong className="text-cyan-300">{currentTitle}</strong>
          </span>
          <span className="text-[10px] text-cyan-400 font-bold bg-cyan-900/50 px-2 py-0.5 rounded border border-cyan-800/40">
            Live Room
          </span>
        </div>

        {/* Chat Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 no-scrollbar">
          {messages.map((msg) => (
            <div key={msg.id} className="flex items-start gap-2.5 group">
              <img
                src={msg.avatarUrl}
                alt={msg.senderName}
                className="w-7 h-7 rounded-lg object-cover ring-1 ring-slate-700 shrink-0 mt-0.5"
              />
              <div className="flex-1 min-w-0 bg-slate-900/70 hover:bg-slate-900 p-2.5 rounded-2xl rounded-tl-none border border-slate-800/80 transition-colors">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold text-white truncate max-w-[130px]">
                      {msg.senderName}
                    </span>
                    {msg.isAdmin && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-red-600 text-white flex items-center gap-0.5">
                        <ShieldCheck className="w-2.5 h-2.5" /> ADMIN
                      </span>
                    )}
                    {msg.isVip && !msg.isAdmin && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-500 text-slate-950 flex items-center gap-0.5">
                        <Sparkles className="w-2.5 h-2.5" /> VIP
                      </span>
                    )}
                  </div>
                  <span className="text-[9px] text-slate-500 font-mono shrink-0">
                    {msg.timestamp}
                  </span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed break-words">
                  {msg.text}
                </p>
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Quick Reactions Bar */}
        <div className="px-3 py-1.5 bg-slate-900/60 border-t border-slate-800/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {['🔥', '🇷🇼', '👏', '😂', '🍿', '❤️', '🙌', '💯'].map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleQuickReaction(emoji)}
              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs transition-transform active:scale-90 shrink-0 cursor-pointer"
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Chat Input Box */}
        <form onSubmit={handleSendMessage} className="p-3 bg-slate-900/90 border-t border-slate-800 flex items-center gap-2">
          <input
            type="text"
            placeholder="Andika ubutumwa (Type a comment)..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="w-9 h-9 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 disabled:opacity-40 text-slate-950 flex items-center justify-center shadow-[0_0_10px_#00e5ff] transition-all shrink-0 cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
};
