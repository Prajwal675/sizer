import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import SizeForm from './components/SizeForm';
import ProfileCard from './components/ProfileCard';
import BrandPicker from './components/BrandPicker';
import SizeResult from './components/SizeResult';
import Bridge from './components/Bridge';
import { ShieldCheck } from 'lucide-react';

const STORAGE_KEY = 'size_profile_metrics';

const STEPS = [
  { id: 'profile', label: 'Enter Profile' },
  { id: 'brand', label: 'Get Size' },
  { id: 'result', label: 'Result' }
];

function StepIndicator({ step }) {
  const activeIndex = STEPS.findIndex((s) => s.id === step);
  return (
    <div className="flex items-center justify-center gap-2 sm:gap-4 mb-8">
      {STEPS.map((s, i) => (
        <React.Fragment key={s.id}>
          <div className="flex items-center gap-2">
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                i <= activeIndex ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'
              }`}
            >
              {i + 1}
            </span>
            <span className={`text-xs font-semibold hidden sm:inline ${i <= activeIndex ? 'text-slate-900' : 'text-slate-400'}`}>
              {s.label}
            </span>
          </div>
          {i < STEPS.length - 1 && <span className="w-6 sm:w-10 h-px bg-slate-200" />}
        </React.Fragment>
      ))}
    </div>
  );
}

export default function App() {
  const [currentProfile, setCurrentProfile] = useState(null);
  const [step, setStep] = useState('profile');
  const [matchResult, setMatchResult] = useState(null);
  const [matchedBrand, setMatchedBrand] = useState(null);

  // Check if route is /bridge
  const isBridgeRoute =
    window.location.pathname.includes('/bridge') ||
    window.location.hash.includes('bridge');

  // Load existing profile from localStorage on mount
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setCurrentProfile(parsed);
        setStep('brand');
      }
    } catch (err) {
      console.warn('Error reading from localStorage:', err);
    }
  }, []);

  // If this is the bridge route, render the Bridge component exclusively
  if (isBridgeRoute) {
    return <Bridge />;
  }

  const handleProfileUpdated = (updated) => {
    setCurrentProfile(updated);
    if (updated) {
      setMatchResult(null);
      setMatchedBrand(null);
      setStep('brand');
    } else {
      setStep('profile');
    }
  };

  const handleMatched = (result, brand) => {
    setMatchResult(result);
    setMatchedBrand(brand);
    setStep('result');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Hero Section */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Enter Your Size Once. Fit Every Brand.
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
            Save your measurements once, then get a size recommendation for any partner brand in seconds —
            fewer wrong-size orders, fewer returns.
          </p>
        </div>

        <StepIndicator step={step} />

        {/* Step content */}
        {step === 'profile' && (
          <SizeForm currentProfile={currentProfile} onProfileUpdated={handleProfileUpdated} />
        )}

        {step === 'brand' && currentProfile && (
          <div className="space-y-6">
            <ProfileCard profile={currentProfile} />
            <BrandPicker profile={currentProfile} onMatched={handleMatched} onBack={() => setStep('profile')} />
          </div>
        )}

        {step === 'result' && (
          <div className="space-y-6">
            <SizeResult
              result={matchResult}
              estimated={Boolean(currentProfile?.estimated)}
              onTryAnotherBrand={() => {
                setMatchResult(null);
                setMatchedBrand(null);
                setStep('brand');
              }}
              onEditProfile={() => setStep('profile')}
            />
            <ProfileCard profile={currentProfile} />
          </div>
        )}

        {/* Privacy footnote */}
        <div className="mt-10 flex items-center justify-center gap-1.5 text-xs text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5" />
          Your measurements are stored only in this browser's localStorage — no account, no database.
        </div>
      </main>

      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-400 bg-white">
        Universal Size-Matching Profile &bull; React + Netlify Functions
      </footer>
    </div>
  );
}
