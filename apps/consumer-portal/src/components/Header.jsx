import React from 'react';
import { Ruler, Shield, Sparkles, ExternalLink } from 'lucide-react';

export default function Header() {
  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Ruler className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-base sm:text-lg tracking-tight">
                Universal Size Profile
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                <Shield className="w-3 h-3" /> Zero-DB SaaS
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              Client-side measurements for cross-store size recommendations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <a
            href="/bridge"
            target="_blank"
            rel="noreferrer"
            className="hidden md:inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50 text-slate-700 font-medium transition"
          >
            Iframe Bridge (/bridge)
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 font-medium border border-indigo-100">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            Prototype Ready
          </span>
        </div>
      </div>
    </header>
  );
}
