import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  MessageSquare, 
  Send, 
  Sparkles, 
  ShieldCheck, 
  Crown,
  RefreshCw,
  Radio,
  Zap,
  Smile
} from 'lucide-react';

interface LiveChatViewProps {
  openAuthModal: () => void;
}

const QUICK_EMOJIS = ['🔥', '⚡', '✨', '👏', '🚀', '💯', '🙏', '❤️'];

export const LiveChatView: React.FC<LiveChatViewProps> = ({ openAuthModal }) => {
  const { currentUser, chats, sendChatMessage, refreshChats, isWsConnected } = useAuth();
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync on mount
  useEffect(() => {
    refreshChats().catch(() => {});
  }, []);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chats.length]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refreshChats();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentUser) {
      openAuthModal();
      return;
    }
    if (!inputText.trim() || isSending) return;

    const text = inputText.trim();
    setInputText('');
    setIsSending(true);

    try {
      await sendChatMessage(text);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const addEmoji = (emoji: string) => {
    setInputText(prev => prev + emoji);
    inputRef.current?.focus();
  };

  // Filter out any mock message permanently
  const visibleChats = chats.filter(c => 
    c && c.message && 
    !c.message.toLowerCase().includes('mbak siti') &&
    !c.message.toLowerCase().includes('sound kane') &&
    !c.message.toLowerCase().includes('preset jj')
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-[calc(100vh-10rem)] min-h-[520px] flex flex-col">
      
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Live Community Chat</span>
              <span className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-semibold ${
                isWsConnected 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
              }`}>
                <span className={`w-2 h-2 rounded-full ${isWsConnected ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`}></span>
                <span>{isWsConnected ? 'Real-Time WebSocket' : 'Sync Polling'}</span>
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Obrolan langsung multi-user real-time sesama kreator Alight Motion & editor video Indonesia.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleManualRefresh}
            title="Segarkan pesan obrolan"
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
          <div className="text-xs text-slate-400 font-mono hidden sm:block bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-800">
            {visibleChats.length} Pesan
          </div>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
        {visibleChats.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-3 text-emerald-400">
              <Zap className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-300">Belum Ada Pesan di Ruang Obrolan</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              Kirim pesan pertama Anda sekarang! Pesan akan langsung tersinkronisasi secara real-time ke semua akun & tab browser lain.
            </p>
          </div>
        ) : (
          visibleChats.map((chat) => {
            const isMe = currentUser?.id === chat.user_id;
            const isAdmin = chat.role === 'admin' || chat.username === 'AlcaW44';
            const isVip = chat.role === 'vip';

            return (
              <div
                key={chat.id}
                className={`flex items-start gap-3 ${isMe ? 'flex-row-reverse' : ''}`}
              >
                <img
                  src={chat.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + chat.username}
                  alt={chat.username}
                  className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-700 bg-slate-800 mt-0.5"
                />

                <div className={`max-w-[80%] sm:max-w-[70%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  {/* User info & badge */}
                  <div className="flex items-center gap-1.5 mb-1 text-[11px]">
                    <span className="font-semibold text-slate-300">
                      {chat.username} {isMe && <span className="text-[10px] text-emerald-400 font-normal">(Anda)</span>}
                    </span>
                    
                    {isAdmin ? (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 bg-rose-500/20 border border-rose-500/40 text-rose-300 rounded text-[9px] font-bold uppercase">
                        <ShieldCheck className="w-2.5 h-2.5" />
                        Admin
                      </span>
                    ) : isVip ? (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 bg-amber-500/20 border border-amber-500/40 text-amber-300 rounded text-[9px] font-bold uppercase">
                        <Crown className="w-2.5 h-2.5" />
                        VIP
                      </span>
                    ) : (
                      <span className="text-[9px] text-slate-500 uppercase px-1 py-0.2 bg-slate-800 rounded">
                        Free
                      </span>
                    )}

                    <span className="text-slate-500 text-[10px] ml-1 font-mono">
                      {new Date(chat.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`p-3 rounded-2xl text-xs sm:text-sm leading-relaxed break-words max-w-full ${
                      isMe
                        ? 'bg-emerald-600 text-white rounded-tr-none shadow-md shadow-emerald-600/10'
                        : isAdmin
                        ? 'bg-slate-900 border border-rose-500/30 text-slate-100 rounded-tl-none shadow-sm'
                        : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none shadow-sm'
                    }`}
                  >
                    {chat.message}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={chatBottomRef} />
      </div>

      {/* Quick Reaction Emojis */}
      {currentUser && (
        <div className="py-2 flex items-center gap-1.5 overflow-x-auto text-xs shrink-0">
          <span className="text-[11px] text-slate-500 flex items-center gap-1 mr-1">
            <Smile className="w-3.5 h-3.5" /> Reaksi:
          </span>
          {QUICK_EMOJIS.map(emoji => (
            <button
              key={emoji}
              type="button"
              onClick={() => addEmoji(emoji)}
              className="px-2 py-1 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg hover:scale-110 active:scale-95 transition-all text-xs"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Input Box */}
      <div className="pt-2 border-t border-slate-800 shrink-0">
        {currentUser ? (
          <form onSubmit={handleSend} className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Tulis pesan sebagai ${currentUser.username}... (Tekan Enter untuk kirim)`}
              maxLength={300}
              className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isSending}
              className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">{isSending ? 'Mengirim...' : 'Kirim'}</span>
            </button>
          </form>
        ) : (
          <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
            <span className="text-slate-400">Silakan login untuk ikut mengobrol dalam live chat komunitas.</span>
            <button
              type="button"
              onClick={openAuthModal}
              className="font-bold text-emerald-400 hover:underline"
            >
              Masuk Sekarang →
            </button>
          </div>
        )}
      </div>

    </div>
  );
};
