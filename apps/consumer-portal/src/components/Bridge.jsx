import React, { useEffect, useState } from 'react';

const STORAGE_KEY = 'size_profile_metrics';

export default function Bridge() {
  const [profile, setProfile] = useState(null);
  const [lastBroadcast, setLastBroadcast] = useState(null);
  const isEmbedded = window.self !== window.top;

  const broadcastProfile = () => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const data = raw ? JSON.parse(raw) : null;
      setProfile(data);

      const messagePayload = {
        type: 'SIZE_PROFILE_METRICS',
        source: 'universal-size-bridge',
        data: data,
        timestamp: Date.now()
      };

      // Broadcast to parent frame
      window.parent.postMessage(messagePayload, '*');
      setLastBroadcast(new Date().toLocaleTimeString());
      console.log('[Bridge] Broadcasted size metrics to parent window:', messagePayload);
    } catch (err) {
      console.error('[Bridge] Failed to read localStorage or postMessage:', err);
    }
  };

  useEffect(() => {
    // 1. Immediately broadcast on mount
    broadcastProfile();

    // 2. Listen for requests from parent frame
    const handleParentMessage = (event) => {
      // Security note: In production, you can validate event.origin against a list of verified partner domains
      if (!event.data) return;

      if (event.data.type === 'GET_SIZE_PROFILE' || event.data.type === 'REFRESH_SIZE_PROFILE') {
        console.log('[Bridge] Received request from parent frame:', event.data.type);
        broadcastProfile();
      }
    };

    window.addEventListener('message', handleParentMessage);

    // Also listen for storage changes in other tabs
    const handleStorageChange = (e) => {
      if (e.key === STORAGE_KEY) {
        broadcastProfile();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('message', handleParentMessage);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // When loaded inside an iframe (B2B widget bridge mode), keep invisible
  if (isEmbedded) {
    return (
      <div style={{ display: 'none' }} data-testid="size-profile-bridge-active">
        Universal Size Profile Bridge (Active)
      </div>
    );
  }

  // When visited directly in the browser (Developer / Diagnostic Mode)
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-8 flex flex-col items-center justify-center">
      <div className="max-w-xl w-full bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            Universal Size Profile — Iframe Bridge Route (/bridge)
          </h1>
        </div>

        <p className="text-sm text-slate-300 mb-6">
          This endpoint acts as the cross-origin communication bridge. When embedded by partner e-commerce sites via an invisible iframe, it reads the user's client-side <code className="bg-slate-700 px-1.5 py-0.5 rounded text-emerald-300">localStorage</code> metrics and securely dispatches them to the parent window via <code className="bg-slate-700 px-1.5 py-0.5 rounded text-emerald-300">postMessage</code>.
        </p>

        <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 mb-6">
          <div className="flex justify-between items-center mb-2 text-xs font-semibold uppercase text-slate-400">
            <span>Current LocalStorage Payload</span>
            <span>Key: {STORAGE_KEY}</span>
          </div>
          <pre className="text-xs font-mono text-emerald-400 overflow-x-auto p-2 bg-slate-900 rounded">
            {profile ? JSON.stringify(profile, null, 2) : '// No profile found in this browser yet.\n// Visit the main portal to save measurements.'}
          </pre>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 mb-6">
          <span>Last Handshake Broadcast: <strong>{lastBroadcast || 'None'}</strong></span>
          <span className="text-emerald-400 font-medium">Zero-DB Privacy Enabled</span>
        </div>

        <div className="flex gap-3">
          <button
            onClick={broadcastProfile}
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2.5 px-4 rounded-xl text-sm transition"
          >
            Trigger Manual Broadcast Test
          </button>
          <a
            href="/"
            className="bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium py-2.5 px-4 rounded-xl text-sm transition"
          >
            Go to Portal
          </a>
        </div>
      </div>
    </div>
  );
}
