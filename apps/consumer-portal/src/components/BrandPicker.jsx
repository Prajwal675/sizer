import React, { useState, useEffect } from 'react';
import { ShoppingBag, Loader2, ArrowRight, ArrowLeft, WifiOff } from 'lucide-react';

// In dev, Vite serves the portal on 5173 while the local Netlify function server (server.js)
// runs separately on 8888. In a deployed build, Netlify serves functions same-origin at
// /.netlify/functions/<name>, so no absolute host is needed (or wanted — it'd break CORS-free
// same-origin calls and hardcode a fallback that works only on this machine).
const API_BASE =
  window.__SIZER_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:8888/.netlify/functions/match-size' : '/.netlify/functions/match-size');

// Used only if the API can't be reached (e.g. the local Netlify function server isn't running yet).
const FALLBACK_BRANDS = [
  { id: 'zara', name: 'Zara' },
  { id: 'hm', name: 'H&M' },
  { id: 'allensolly', name: 'Allen Solly' },
  { id: 'indian-standard', name: 'Indian Retail Standard' }
];

export default function BrandPicker({ profile, onMatched, onBack }) {
  const [brands, setBrands] = useState(FALLBACK_BRANDS);
  const [loadingBrands, setLoadingBrands] = useState(true);
  const [matchingBrandId, setMatchingBrandId] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadBrands() {
      try {
        const res = await fetch(API_BASE, { method: 'GET' });
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        const data = await res.json();
        if (!cancelled && Array.isArray(data.available_brands)) {
          setBrands(data.available_brands);
        }
      } catch (err) {
        console.warn('Could not fetch brand list from API, using fallback list:', err);
      } finally {
        if (!cancelled) setLoadingBrands(false);
      }
    }

    loadBrands();
    return () => {
      cancelled = true;
    };
  }, []);

  const handlePick = async (brand) => {
    setMatchingBrandId(brand.id);
    setErrorMessage(null);

    try {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand: brand.id,
          product_category: 'tops',
          user_measurements: profile
        })
      });

      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      onMatched(data, brand);
    } catch (err) {
      console.warn('Direct API match failed, falling back to local simulation:', err);
      // Resilience fallback for demo/offline use, matching the project's existing pattern.
      onMatched(
        {
          simulated: true,
          recommended_size: profile.chest < 92 ? 'S' : profile.chest < 102 ? 'M' : profile.chest < 110 ? 'L' : 'XL',
          confidence_score: 85,
          brand: { name: brand.name, fit_type: brand.fit_type },
          fit_summary: 'Computed via local fallback matching (API unreachable).'
        },
        brand
      );
    } finally {
      setMatchingBrandId(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-6 py-6 text-white">
        <div className="flex items-center gap-2">
          <span className="p-1.5 bg-white/20 backdrop-blur rounded-lg inline-flex">
            <ShoppingBag className="w-5 h-5 text-white" />
          </span>
          <h2 className="text-xl font-bold">Get Your Size</h2>
        </div>
        <p className="text-blue-100 text-xs sm:text-sm mt-1">
          Pick a brand below — we'll match your saved profile against its real size chart.
        </p>
      </div>

      <div className="p-6 sm:p-8">
        {errorMessage && (
          <div className="mb-4 flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
            <WifiOff className="w-4 h-4 shrink-0" />
            {errorMessage}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {brands.map((brand) => (
            <button
              key={brand.id}
              type="button"
              disabled={matchingBrandId !== null}
              onClick={() => handlePick(brand)}
              className="text-left p-4 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900 text-sm">{brand.name}</span>
                {matchingBrandId === brand.id ? (
                  <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500" />
                )}
              </div>
              {brand.fit_type && (
                <span className="text-xs text-slate-500 mt-1 block">{brand.fit_type}</span>
              )}
            </button>
          ))}
        </div>

        {loadingBrands && (
          <p className="text-xs text-slate-400 mt-4">Loading live brand list from the matching engine…</p>
        )}

        <button
          type="button"
          onClick={onBack}
          className="mt-6 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Edit my profile
        </button>
      </div>
    </div>
  );
}
