import React, { useState, useEffect } from 'react';
import { Ruler, Sparkles, CheckCircle2, RefreshCw, HelpCircle, ShieldCheck, Wand2, AlertCircle } from 'lucide-react';

const STORAGE_KEY = 'size_profile_metrics';

// Rough tailoring approximations (NOT clinical/anthropometric data) used only to pre-fill
// chest/waist/shoulders from height for people who don't have a measuring tape handy.
// Users are always told these are estimates and can override any field manually.
const BODY_TYPES = [
  { id: 'slim', label: 'Slim', description: 'Narrow frame, lean build', chestRatio: 0.495, shoulderRatio: 0.225, waistFromChest: 0.83 },
  { id: 'average', label: 'Average', description: 'Balanced, regular build', chestRatio: 0.525, shoulderRatio: 0.235, waistFromChest: 0.87 },
  { id: 'athletic', label: 'Athletic', description: 'Broader chest, narrower waist', chestRatio: 0.545, shoulderRatio: 0.248, waistFromChest: 0.78 },
  { id: 'broad', label: 'Broad / Heavy', description: 'Fuller frame overall', chestRatio: 0.565, shoulderRatio: 0.252, waistFromChest: 0.90 }
];

const PRESETS = {
  small: {
    height: 168,
    weight: 62,
    chest: 90,
    waist: 76,
    shoulders: 43,
    unit: 'cm',
    fit_preference: 'Standard'
  },
  medium: {
    height: 176,
    weight: 74,
    chest: 98,
    waist: 84,
    shoulders: 45,
    unit: 'cm',
    fit_preference: 'Standard'
  },
  large: {
    height: 184,
    weight: 88,
    chest: 106,
    waist: 92,
    shoulders: 48,
    unit: 'cm',
    fit_preference: 'Standard'
  }
};

export default function SizeForm({ onProfileUpdated, currentProfile }) {
  const [unit, setUnit] = useState('cm');
  const [formData, setFormData] = useState({
    height: '',
    weight: '',
    chest: '',
    waist: '',
    shoulders: '',
    fit_preference: 'Standard'
  });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [activeTip, setActiveTip] = useState(null);
  const [estimated, setEstimated] = useState(false);
  const [heightMissingWarning, setHeightMissingWarning] = useState(false);

  // Initialize from current saved profile
  useEffect(() => {
    if (currentProfile) {
      setUnit(currentProfile.unit || 'cm');
      setFormData({
        height: currentProfile.height || '',
        weight: currentProfile.weight || '',
        chest: currentProfile.chest || '',
        waist: currentProfile.waist || '',
        shoulders: currentProfile.shoulders || '',
        fit_preference: currentProfile.fit_preference || 'Standard'
      });
      setEstimated(Boolean(currentProfile.estimated));
    }
  }, [currentProfile]);

  // Handle unit toggle with smart conversion
  const handleUnitToggle = (newUnit) => {
    if (newUnit === unit) return;

    const convert = (val) => {
      if (!val) return '';
      const num = parseFloat(val);
      if (isNaN(num)) return '';
      if (newUnit === 'in') {
        // cm to in
        return Math.round((num / 2.54) * 10) / 10;
      } else {
        // in to cm
        return Math.round((num * 2.54) * 10) / 10;
      }
    };

    setFormData(prev => ({
      ...prev,
      height: convert(prev.height),
      chest: convert(prev.chest),
      waist: convert(prev.waist),
      shoulders: convert(prev.shoulders)
      // weight is always kg and is intentionally excluded from cm/in conversion
    }));
    setUnit(newUnit);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setSavedSuccess(false);
    // Manually editing a measurement that was pre-filled from a body-type estimate
    // means it's no longer an estimate for that field.
    if (['chest', 'waist', 'shoulders'].includes(name)) {
      setEstimated(false);
    }
  };

  const applyPreset = (presetKey) => {
    const preset = PRESETS[presetKey];
    if (!preset) return;
    setUnit(preset.unit);
    setFormData({
      height: preset.height,
      weight: preset.weight,
      chest: preset.chest,
      waist: preset.waist,
      shoulders: preset.shoulders,
      fit_preference: preset.fit_preference
    });
    setEstimated(false);
    setSavedSuccess(false);
  };

  // Fills chest/waist/shoulders from height using a rough body-type ratio, for users
  // who don't know (or can't measure) their exact body measurements.
  const applyBodyTypeEstimate = (bodyType) => {
    const heightVal = parseFloat(formData.height);
    if (!heightVal || isNaN(heightVal)) {
      setHeightMissingWarning(true);
      return;
    }
    setHeightMissingWarning(false);

    const heightCm = unit === 'in' ? heightVal * 2.54 : heightVal;
    const chestCm = heightCm * bodyType.chestRatio;
    const shoulderCm = heightCm * bodyType.shoulderRatio;
    const waistCm = chestCm * bodyType.waistFromChest;

    const fromCm = (cmVal) => {
      const val = unit === 'in' ? cmVal / 2.54 : cmVal;
      return Math.round(val * 10) / 10;
    };

    setFormData(prev => ({
      ...prev,
      chest: fromCm(chestCm),
      waist: fromCm(waistCm),
      shoulders: fromCm(shoulderCm)
    }));
    setEstimated(true);
    setSavedSuccess(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const payload = {
      height: parseFloat(formData.height) || 0,
      weight: parseFloat(formData.weight) || 0,
      chest: parseFloat(formData.chest) || 0,
      waist: parseFloat(formData.waist) || 0,
      shoulders: parseFloat(formData.shoulders) || 0,
      unit: unit,
      weight_unit: 'kg',
      fit_preference: formData.fit_preference,
      estimated: estimated,
      updated_at: new Date().toISOString()
    };

    // Save directly to browser localStorage (Zero-DB SaaS requirement)
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      setSavedSuccess(true);
      if (onProfileUpdated) {
        onProfileUpdated(payload);
      }
      setTimeout(() => setSavedSuccess(false), 3500);
    } catch (err) {
      console.error('Failed to save to localStorage:', err);
      alert('Could not save measurements to localStorage.');
    }
  };

  const handleClear = () => {
    if (confirm('Clear your saved size profile from this browser?')) {
      window.localStorage.removeItem(STORAGE_KEY);
      setFormData({
        height: '',
        weight: '',
        chest: '',
        waist: '',
        shoulders: '',
        fit_preference: 'Standard'
      });
      setEstimated(false);
      if (onProfileUpdated) {
        onProfileUpdated(null);
      }
    }
  };

  const measurementFields = [
    {
      id: 'height',
      label: 'Height',
      required: true,
      tip: 'Stand barefoot with heels flat against a wall. Measure vertically to the crown of your head.',
      placeholder: unit === 'cm' ? 'e.g. 175' : 'e.g. 69',
      min: unit === 'cm' ? 120 : 47,
      max: unit === 'cm' ? 220 : 87
    },
    {
      id: 'weight',
      label: 'Weight',
      tip: "Optional. Your current body weight — not used for matching yet, but saved for better recommendations later. Leave it blank if you don't know it.",
      placeholder: 'e.g. 74',
      fixedUnit: 'kg',
      min: 30,
      max: 180
    },
    {
      id: 'chest',
      label: 'Chest Circumference',
      tip: "Optional, but improves accuracy. Wrap the tape under your armpits around the fullest part of your chest, keeping the tape level. Don't have a tape? Use the \"Not sure?\" estimator below instead.",
      placeholder: unit === 'cm' ? 'e.g. 98' : 'e.g. 38.5',
      min: unit === 'cm' ? 60 : 24,
      max: unit === 'cm' ? 160 : 63
    },
    {
      id: 'waist',
      label: 'Waist Circumference',
      tip: 'Optional, but improves accuracy. Measure around your natural waistline, slightly above your belly button. Keep tape comfortably loose.',
      placeholder: unit === 'cm' ? 'e.g. 84' : 'e.g. 33',
      min: unit === 'cm' ? 50 : 20,
      max: unit === 'cm' ? 150 : 60
    },
    {
      id: 'shoulders',
      label: 'Shoulder Width',
      tip: 'Optional, but improves accuracy. Measure across the back from the bony edge of one shoulder tip across the upper back to the other.',
      placeholder: unit === 'cm' ? 'e.g. 45' : 'e.g. 17.5',
      min: unit === 'cm' ? 30 : 12,
      max: unit === 'cm' ? 70 : 28
    }
  ];

  return (
    <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
      {/* Form Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-6 py-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-white/20 backdrop-blur rounded-lg inline-flex">
                <Ruler className="w-5 h-5 text-white" />
              </span>
              <h2 className="text-xl font-bold">Your Size Profile</h2>
            </div>
            <p className="text-blue-100 text-xs sm:text-sm mt-1">
              Enter once. Automatically matches your size across any partner store.
            </p>
          </div>

          {/* Unit Toggle Switch */}
          <div className="flex items-center bg-black/20 backdrop-blur p-1 rounded-xl self-start sm:self-auto border border-white/10">
            <button
              type="button"
              onClick={() => handleUnitToggle('cm')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                unit === 'cm'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              Centimeters (cm)
            </button>
            <button
              type="button"
              onClick={() => handleUnitToggle('in')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                unit === 'in'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              Inches (in)
            </button>
          </div>
        </div>

        {/* Quick Presets for Demo */}
        <div className="mt-4 pt-3 border-t border-white/15 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-white/70 flex items-center gap-1 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Demo Presets:
          </span>
          <button
            type="button"
            onClick={() => applyPreset('small')}
            className="px-2.5 py-1 bg-white/10 hover:bg-white/20 rounded-md text-white transition text-xs"
          >
            Small (S)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('medium')}
            className="px-2.5 py-1 bg-white/10 hover:bg-white/20 rounded-md text-white transition text-xs"
          >
            Medium (M)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('large')}
            className="px-2.5 py-1 bg-white/10 hover:bg-white/20 rounded-md text-white transition text-xs"
          >
            Large (L)
          </button>
        </div>
      </div>

      {/* Main Form Fields */}
      <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {measurementFields.map((field) => (
            <div key={field.id} className="relative">
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor={field.id}
                  className="text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1.5"
                >
                  {field.label}
                  {!field.required && (
                    <span className="normal-case font-normal text-slate-400 lowercase tracking-normal">(optional)</span>
                  )}
                  <button
                    type="button"
                    onClick={() => setActiveTip(activeTip === field.id ? null : field.id)}
                    className="text-slate-400 hover:text-indigo-600 transition"
                    title="Click for measurement instructions"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                  </button>
                </label>
                <span className="text-xs font-mono text-slate-400">{field.fixedUnit || unit}</span>
              </div>

              <div className="relative rounded-xl shadow-sm">
                <input
                  type="number"
                  step="0.1"
                  required={Boolean(field.required)}
                  id={field.id}
                  name={field.id}
                  value={formData[field.id]}
                  onChange={handleChange}
                  placeholder={field.placeholder}
                  className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition sm:text-sm font-medium"
                />
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5">
                  <span className="text-slate-400 text-xs font-semibold">{field.fixedUnit || unit}</span>
                </div>
              </div>

              {activeTip === field.id && (
                <div className="mt-2 p-2.5 bg-indigo-50 text-indigo-900 border border-indigo-100 rounded-lg text-xs leading-relaxed animate-fadeIn">
                  <strong>How to measure:</strong> {field.tip}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* "I don't know my measurements" estimator */}
        <div className="p-4 bg-violet-50/70 border border-violet-100 rounded-xl">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-violet-900 mb-1">
            <Wand2 className="w-3.5 h-3.5" />
            Don't know your chest/waist/shoulders? No tape measure needed.
          </div>
          <p className="text-xs text-violet-700/80 mb-3">
            Enter your height above, then pick the build that looks most like yours — we'll estimate the rest.
            You can always overwrite any field by typing your own number.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {BODY_TYPES.map((bodyType) => (
              <button
                key={bodyType.id}
                type="button"
                onClick={() => applyBodyTypeEstimate(bodyType)}
                title={bodyType.description}
                className="px-2.5 py-2 bg-white hover:bg-violet-100 border border-violet-200 rounded-lg text-xs font-semibold text-violet-800 transition"
              >
                {bodyType.label}
              </button>
            ))}
          </div>
          {heightMissingWarning && (
            <div className="mt-2.5 flex items-center gap-1.5 text-xs font-medium text-amber-700">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              Enter your height first so we have something to estimate from.
            </div>
          )}
          {estimated && (
            <div className="mt-2.5 flex items-center gap-1.5 text-xs font-medium text-indigo-700">
              <Wand2 className="w-3.5 h-3.5 shrink-0" />
              Chest/waist/shoulders below are estimated, not measured — accuracy will be lower than a real tape measurement.
            </div>
          )}
        </div>

        {/* Fit Preference Option */}
        <div className="pt-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
            Garment Fit Preference
          </label>
          <div className="grid grid-cols-3 gap-3">
            {['Slim Fit', 'Standard', 'Relaxed'].map((pref) => (
              <label
                key={pref}
                className={`flex items-center justify-center p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                  formData.fit_preference === pref
                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 shadow-sm'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="fit_preference"
                  value={pref}
                  checked={formData.fit_preference === pref}
                  onChange={handleChange}
                  className="sr-only"
                />
                {pref}
              </label>
            ))}
          </div>
        </div>

        {/* Zero-DB Guarantee Box */}
        <div className="flex items-start gap-3 p-3.5 bg-emerald-50/80 border border-emerald-200/80 rounded-xl text-emerald-900 text-xs">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold text-emerald-950">100% Client-Side Privacy:</strong> Your measurements never touch our database. They are stored strictly in your browser's <code className="bg-emerald-100/70 px-1 py-0.5 rounded text-emerald-800">localStorage</code>.
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            type="submit"
            className="w-full sm:flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3.5 px-6 rounded-xl shadow-lg shadow-indigo-600/25 transition active:scale-[0.99]"
          >
            <CheckCircle2 className="w-4 h-4" />
            Save & Get My Size
          </button>

          {currentProfile && (
            <button
              type="button"
              onClick={handleClear}
              className="w-full sm:w-auto px-4 py-3.5 border border-slate-200 hover:border-red-200 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-xl font-medium text-xs transition"
            >
              Clear Storage
            </button>
          )}
        </div>

        {/* Success Feedback banner */}
        {savedSuccess && (
          <div className="flex items-center gap-2 p-3 bg-emerald-600 text-white rounded-xl text-xs font-semibold shadow-md animate-bounce">
            <CheckCircle2 className="w-4 h-4" />
            Size profile successfully saved to localStorage (`{STORAGE_KEY}`)!
          </div>
        )}
      </form>
    </div>
  );
}
