import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Image as ImageIcon, 
  Heart, 
  Plus, 
  Upload, 
  User, 
  Sparkles,
  Share2,
  Check
} from 'lucide-react';

interface GalleryViewProps {
  openAuthModal: () => void;
}

export const GalleryView: React.FC<GalleryViewProps> = ({ openAuthModal }) => {
  const { currentUser, gallery, addGalleryItem, toggleLikeGallery } = useAuth();

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      openAuthModal();
      return;
    }
    if (!imageUrl.trim()) return;

    addGalleryItem(imageUrl, caption);
    setImageUrl('');
    setCaption('');
    setIsUploadOpen(false);
  };

  const handleShare = (id: string, img: string) => {
    navigator.clipboard.writeText(img);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold mb-1">
            <ImageIcon className="w-4 h-4" />
            <span>ALIGHT MOTION CREATOR SHOWCASE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            AM Gallery Showcase
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Pamerkan tangkapan layar, color grading, dan visual effects hasil karya Alight Motion Anda.
          </p>
        </div>

        <button
          onClick={() => {
            if (!currentUser) {
              openAuthModal();
            } else {
              setIsUploadOpen(true);
            }
          }}
          className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-300 hover:to-emerald-400 transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 self-start md:self-auto shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Karya Saya</span>
        </button>
      </div>

      {/* Gallery Grid */}
      {gallery.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 border border-slate-800/80 rounded-2xl">
          <ImageIcon className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-300">Belum Ada Karya yang Diunggah</h3>
          <p className="text-xs text-slate-500 mt-1">Jadilah yang pertama memamerkan tangkapan layar editan Anda!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {gallery.map((item) => (
            <div
              key={item.id}
              className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden hover:border-emerald-500/40 transition-all flex flex-col group shadow-lg"
            >
              {/* Media Card */}
              <div className="relative h-60 bg-slate-950 overflow-hidden">
                <img
                  src={item.image_url}
                  alt={item.caption || 'Karya Alight Motion'}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

                {/* Floating Creator Chip */}
                <div className="absolute bottom-3 left-3 flex items-center gap-2 px-2.5 py-1 bg-slate-950/80 backdrop-blur-md border border-slate-800 rounded-full text-xs text-white">
                  <img
                    src={item.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + item.username}
                    alt={item.username}
                    className="w-4 h-4 rounded-full object-cover"
                  />
                  <span className="font-medium text-[11px]">{item.username}</span>
                </div>
              </div>

              {/* Caption & Likes */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                  {item.caption || 'Karya editan Alight Motion Pro.'}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(item.created_at).toLocaleDateString('id-ID')}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleShare(item.id, item.image_url)}
                      title="Salin tautan gambar"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                      {copiedId === item.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={() => toggleLikeGallery(item.id)}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold transition-colors border border-rose-500/20"
                    >
                      <Heart className="w-3.5 h-3.5 fill-rose-500" />
                      <span className="tabular-nums font-mono">{item.likes}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white mb-1">Upload Tangkapan Layar Karya AM</h3>
            <p className="text-xs text-slate-400 mb-5">
              Masukkan tautan gambar hasil export atau screenshot timeline Alight Motion Anda.
            </p>

            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  URL Gambar / Screenshot <span className="text-emerald-400">*</span>
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/... atau link gambar publik"
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Deskripsi / Caption Karya
                </label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  rows={3}
                  placeholder="Ceritakan efek, sound, atau preset yang Anda gunakan pada karya ini..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition-colors"
                >
                  Unggah ke Showcase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
