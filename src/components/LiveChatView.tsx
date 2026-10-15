import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  MessageSquare, 
  Send, 
  Sparkles, 
  ShieldCheck, 
  Smile, 
  User as UserIcon,
  Crown
} from 'lucide-react';

interface LiveChatViewProps {
  openAuthModal: () => void;
}

export const LiveChatView: React.FC<LiveChatViewProps> = ({ openAuthModal }) => {
  const { currentUser, chats, sendChatMessage } = useAuth();
  const [inputText, setInputText] = useState('');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chats.length]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      openAuthModal();
      return;
    }
    if (!inputText.trim()) return;

    sendChatMessage(inputText);
    setInputText('');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-[calc(100vh-10rem)] min-h-[500px] flex flex-col">
      
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Live Community Chat</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </h1>
            <p className="text-xs text-slate-400">
              Forum obrolan langsung sesama kreator Alight Motion & editor video Indonesia.
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-400 font-mono hidden sm:block">
          {chats.length} Pesan
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
        {chats.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500">
            <MessageSquare className="w-10 h-10 text-slate-600 mb-3" />
            <p className="text-sm font-semibold text-slate-300">Belum Ada Pesan</p>
            <p className="text-xs text-slate-500 mt-1">Jadilah yang pertama mengirim pesan di Live Chat!</p>
          </div>
        ) : (
          chats.map((chat) => {
          const isMe = currentUser?.id === chat.user_id;
          const isAdmin = chat.role === 'admin';
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
                  <span className="font-semibold text-slate-300">{chat.username}</span>
                  
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
                    <span className="text-[9px] text-slate-500 uppercase">
                      Free
                    </span>
                  )}

                  <span className="text-slate-600 text-[10px] ml-1 font-mono">
                    {new Date(chat.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Message Bubble */}
                <div
                  className={`p-3 rounded-2xl text-xs sm:text-sm leading-relaxed ${
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
        }))}
        <div ref={chatBottomRef} />
      </div>

      {/* Input Box */}
      <div className="pt-3 border-t border-slate-800 shrink-0">
        {currentUser ? (
          <form onSubmit={handleSend} className="flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Tulis pesan ke komunitas kreator..."
              maxLength={300}
              className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Kirim</span>
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
