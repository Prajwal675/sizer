import React from 'react';
import { User, ShieldCheck, Wand2 } from 'lucide-react';

export default function ProfileCard({ profile }) {
  if (!profile) {
    return (
      <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center flex flex-col items-center justify-center h-full">
        <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mb-4">
          <User className="w-7 h-7" />
        </div>
        <h3 className="text-base font-semibold text-slate-700 mb-1">No Profile Saved Yet</h3>
        <p className="text-xs text-slate-500 max-w-xs mb-4">
          Fill out the form with your body measurements to instantly activate your Universal Size Profile.
        </p>
        <div className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full">
          <ShieldCheck className="w-4 h-4" /> Stored locally in your browser
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 p-6 sm:p-7">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Active Profile</span>
          <h3 className="text-lg font-bold text-slate-900 mt-0.5">Your Metrics Summary</h3>
        </div>
        {profile.estimated ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-violet-50 text-violet-700 border border-violet-100">
            <Wand2 className="w-3 h-3" /> Estimated
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active
          </span>
        )}
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 my-5">
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
          <span className="text-xs text-slate-500 block">Height</span>
          <span className="text-lg font-bold text-slate-900">
            {profile.height} <span className="text-xs font-normal text-slate-500">{profile.unit}</span>
          </span>
        </div>
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
          <span className="text-xs text-slate-500 block">Weight</span>
          <span className="text-lg font-bold text-slate-900">
            {profile.weight || '—'} <span className="text-xs font-normal text-slate-500">{profile.weight_unit || 'kg'}</span>
          </span>
        </div>
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
          <span className="text-xs text-slate-500 block">Chest</span>
          <span className="text-lg font-bold text-slate-900">
            {profile.chest} <span className="text-xs font-normal text-slate-500">{profile.unit}</span>
          </span>
        </div>
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
          <span className="text-xs text-slate-500 block">Waist</span>
          <span className="text-lg font-bold text-slate-900">
            {profile.waist} <span className="text-xs font-normal text-slate-500">{profile.unit}</span>
          </span>
        </div>
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 col-span-2">
          <span className="text-xs text-slate-500 block">Shoulders</span>
          <span className="text-lg font-bold text-slate-900">
            {profile.shoulders} <span className="text-xs font-normal text-slate-500">{profile.unit}</span>
          </span>
        </div>
      </div>

      <div className="text-xs text-slate-500 flex items-center justify-between">
        <span>Fit Preference: <strong className="text-slate-800">{profile.fit_preference || 'Standard'}</strong></span>
        <span>Updated: <strong className="text-slate-800">{profile.updated_at ? new Date(profile.updated_at).toLocaleTimeString() : 'Just now'}</strong></span>
      </div>
    </div>
  );
}
