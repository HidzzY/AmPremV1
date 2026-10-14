import React from 'react';
import { ExternalLink, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-slate-800/80 bg-[#080c14] py-8 mt-16 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Creator Branding */}
          <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
            <div className="flex items-center gap-2">
              <img
                src="/icon.jpg"
                alt="Alight Premium Logo"
                className="w-5 h-5 rounded-full object-cover border border-emerald-500/40"
              />
              <span className="font-semibold text-slate-200 text-sm">Alight Premium</span>
            </div>
            <span className="hidden sm:inline text-slate-600">·</span>
            <div className="flex items-center gap-1.5">
              <span>Created with</span>
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" />
              <span>by <strong className="text-white font-semibold">Alca W44</strong></span>
            </div>
          </div>

          {/* Official Channel and WhatsApp Links */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
            <a
              href="https://whatsapp.com/channel/0029Vb82nkLEwEjtLSQ49I44"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 transition-colors font-medium hover:underline"
            >
              <span>Saluran WhatsApp Alca W44</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <span className="text-slate-700">·</span>

            <a
              href="https://wa.me/6289502003601?text=mas%20alca%20pengen%20up%20akun%20jadi%20role%20vip%20dong"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors"
            >
              <span>Upgrade VIP Official</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
