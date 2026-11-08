import React from 'react';
import { CheckCircle2, RotateCcw, Pencil, TrendingDown, AlertTriangle, Wand2 } from 'lucide-react';

export default function SizeResult({ result, estimated, onTryAnotherBrand, onEditProfile }) {
  if (!result) return null;

  const brandName = result.brand?.name || 'this brand';
  const fitType = result.brand?.fit_type;

  return (
    <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 px-6 py-8 text-white text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold mb-4">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Your Recommended Size
        </div>
        <div className="text-6xl font-extrabold tracking-tight">{result.recommended_size}</div>
        <p className="mt-2 text-sm text-white/90">
          for <strong>{brandName}</strong>{fitType ? ` (${fitType})` : ''}
        </p>
      </div>

      <div className="p-6 sm:p-8 space-y-5">
        <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Match Confidence</span>
          <span className="text-lg font-bold text-indigo-600">{result.confidence_score}%</span>
        </div>

        {result.fit_summary && (
          <p className="text-sm text-slate-700 leading-relaxed">{result.fit_summary}</p>
        )}

        {result.simulated && (
          <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            Matching engine was unreachable — this is a simplified local estimate, not the real matcher.
          </div>
        )}

        {estimated && (
          <div className="flex items-center gap-2 p-3 bg-violet-50 border border-violet-200 rounded-xl text-violet-800 text-xs">
            <Wand2 className="w-4 h-4 shrink-0" />
            Based on estimated measurements (no tape measure used) — for a more accurate size, edit your profile with real measurements.
          </div>
        )}

        <div className="flex items-start gap-3 p-3.5 bg-emerald-50/80 border border-emerald-200/80 rounded-xl text-emerald-900 text-xs">
          <TrendingDown className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold text-emerald-950">One profile, fewer returns:</strong> your
            measurements are saved once — come back and pick a different brand any time instead of guessing
            a size and returning it.
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onTryAnotherBrand}
            className="w-full sm:flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3.5 px-6 rounded-xl shadow-lg shadow-indigo-600/25 transition active:scale-[0.99]"
          >
            <RotateCcw className="w-4 h-4" />
            Try Another Brand
          </button>
          <button
            type="button"
            onClick={onEditProfile}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3.5 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600 rounded-xl font-medium text-xs transition"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit Profile
          </button>
        </div>
      </div>
    </div>
  );
}
