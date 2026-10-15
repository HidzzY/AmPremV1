import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Layers, 
  Plus, 
  Download, 
  ExternalLink, 
  Copy, 
  Check, 
  Search, 
  Sparkles,
  Trash2,
  Tag
} from 'lucide-react';

interface PresetHubViewProps {
  openAuthModal: () => void;
}

const CATEGORIES = ['Semua', 'Jedag Jedug', 'Cinematic', 'Velocity', 'Typo 3D', 'Anime'];

export const PresetHubView: React.FC<PresetHubViewProps> = ({ openAuthModal }) => {
  const { currentUser, presets, addPreset, deletePreset, incrementPresetDownload } = useAuth();

  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal State
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [presetLink, setPresetLink] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [category, setCategory] = useState('Jedag Jedug');

  // Filter presets
  const filteredPresets = presets.filter((p) => {
    const matchesCategory = selectedCategory === 'Semua' || p.category === selectedCategory;
    const matchesSearch = 
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.author_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCopyLink = (id: string, link: string) => {
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    incrementPresetDownload(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenPreset = (id: string, link: string) => {
    incrementPresetDownload(id);
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  const handleCreatePreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      openAuthModal();
      return;
    }
    if (!title.trim() || !presetLink.trim()) return;

    addPreset(title, presetLink, previewUrl, category);
    setTitle('');
    setPresetLink('');
    setPreviewUrl('');
    setCategory('Jedag Jedug');
    setIsUploadOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold mb-1">
            <Layers className="w-4 h-4" />
            <span>ALIGHT MOTION PRESET COMMUNITY</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Preset Sharing Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Kumpulan link preset XML & 5MB terbaik karya kreator Indonesia. Langsung import ke Alight Motion Anda.
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
          <span>Bagikan Preset Saya</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari judul preset / author..."
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>
      </div>

      {/* Preset Grid */}
      {filteredPresets.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6">
          <Layers className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-300">
            {presets.length === 0 ? 'Belum Ada Preset Terdaftar (0 Preset)' : 'Preset Tidak Ditemukan'}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            {presets.length === 0 
              ? 'Belum ada pengguna lain yang mengunggah preset. Klik tombol "Upload Preset Baru" di atas untuk membagikan karya Anda!' 
              : 'Coba kata kunci pencarian lain atau pilih kategori yang berbeda.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPresets.map((preset) => {
            const isOwner = currentUser?.id === preset.user_id || currentUser?.role === 'admin';
            return (
              <div
                key={preset.id}
                className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden hover:border-emerald-500/40 transition-all flex flex-col group shadow-lg"
              >
                {/* Thumbnail Preview */}
                <div className="relative h-44 bg-slate-950 overflow-hidden">
                  <img
                    src={preset.preview_url || 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=600&auto=format&fit=crop&q=80'}
                    alt={preset.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                  
                  {/* Category Chip */}
                  <div className="absolute top-3 left-3 px-2 py-1 bg-slate-950/80 backdrop-blur-md border border-slate-700/60 rounded-md text-[10px] font-semibold text-emerald-300 flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    <span>{preset.category}</span>
                  </div>

                  {isOwner && (
                    <button
                      onClick={() => deletePreset(preset.id)}
                      title="Hapus Preset"
                      className="absolute top-3 right-3 p-1.5 bg-rose-950/80 border border-rose-500/40 rounded-md text-rose-400 hover:text-rose-200 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white line-clamp-2 leading-snug">
                      {preset.title}
                    </h3>
                    <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                      <span>Kreator: <strong className="text-slate-300">{preset.author_name}</strong></span>
                      <span className="font-mono text-emerald-400 text-[11px] tabular-nums">
                        {preset.downloads}x digunakan
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center gap-2">
                    <button
                      onClick={() => handleOpenPreset(preset.id, preset.preset_link)}
                      className="flex-1 py-2 px-3 rounded-xl text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Buka di AM</span>
                    </button>

                    <button
                      onClick={() => handleCopyLink(preset.id, preset.preset_link)}
                      title="Salin Tautan Preset"
                      className="p-2 rounded-xl text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white transition-colors border border-slate-700"
                    >
                      {copiedId === preset.id ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Preset Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white mb-1">Bagikan Preset Alight Motion</h3>
            <p className="text-xs text-slate-400 mb-5">
              Bagikan karya preset XML atau link 5MB Anda kepada komunitas kreator.
            </p>

            <form onSubmit={handleCreatePreset} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Judul Preset <span className="text-emerald-400">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Preset JJ Sound Kane 2026 Slowmo"
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Link Preset (Alight Link / Drive / Mediafire) <span className="text-emerald-400">*</span>
                </label>
                <input
                  type="url"
                  value={presetLink}
                  onChange={(e) => setPresetLink(e.target.value)}
                  placeholder="http://alight.link/..."
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Kategori Preset
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    {CATEGORIES.filter(c => c !== 'Semua').map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    URL Gambar Sampul (Opsional)
                  </label>
                  <input
                    type="url"
                    value={previewUrl}
                    onChange={(e) => setPreviewUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
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
                  Publikasikan Preset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
