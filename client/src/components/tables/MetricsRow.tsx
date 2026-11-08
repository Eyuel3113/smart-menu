'use client';

import React from 'react';
import { TableKpis } from '@/lib/types';
import { Users, Check, User, DollarSign, Sparkles, Bell } from 'lucide-react';

interface MetricsRowProps {
  kpis: TableKpis;
}

export default function MetricsRow({ kpis }: MetricsRowProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
      {/* 1. Total Tables */}
      <div className="rounded-2xl p-4 bg-white/95 dark:bg-gradient-to-br dark:from-[#0c1635]/90 dark:to-[#0e1f4d]/60 border border-slate-200/90 dark:border-blue-500/30 relative overflow-hidden backdrop-blur-xl shadow-xs dark:shadow-lg flex items-center gap-3.5 transition-colors">
        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-blue-500/20 border border-slate-200 dark:border-blue-500/30 flex items-center justify-center text-slate-600 dark:text-blue-300 shrink-0">
          <Users className="w-5 h-5" />
        </div>
        <div>
          <span className="text-[11px] text-slate-500 dark:text-blue-200/70 font-medium block">Total Tables</span>
          <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-none mt-0.5 block">
            {kpis.total}
          </span>
        </div>
        <div className="absolute -bottom-6 -right-6 w-20 h-20 rounded-full bg-slate-300/20 dark:bg-blue-500/15 blur-xl pointer-events-none" />
      </div>

      {/* 2. Available */}
      <div className="rounded-2xl p-4 bg-emerald-50/60 dark:bg-gradient-to-br dark:from-[#072421]/90 dark:to-[#0a3832]/60 border border-emerald-200/80 dark:border-emerald-500/35 relative overflow-hidden backdrop-blur-xl shadow-xs dark:shadow-lg flex items-center gap-3.5 transition-colors">
        <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0 shadow-sm dark:shadow-[0_0_12px_rgba(16,185,129,0.5)]">
          <Check className="w-5 h-5 stroke-[3]" />
        </div>
        <div>
          <span className="text-[11px] text-emerald-700 dark:text-emerald-200/70 font-medium block">Available</span>
          <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-none mt-0.5 block">
            {kpis.available}
          </span>
        </div>
        <div className="absolute -bottom-6 -right-6 w-20 h-20 rounded-full bg-emerald-400/20 dark:bg-emerald-500/20 blur-xl pointer-events-none" />
      </div>

      {/* 3. Occupied */}
      <div className="rounded-2xl p-4 bg-rose-50/60 dark:bg-gradient-to-br dark:from-[#290d1e]/90 dark:to-[#3d122b]/60 border border-rose-200/80 dark:border-rose-500/35 relative overflow-hidden backdrop-blur-xl shadow-xs dark:shadow-lg flex items-center gap-3.5 transition-colors">
        <div className="w-10 h-10 rounded-full bg-rose-500 flex items-center justify-center text-white shrink-0 shadow-sm dark:shadow-[0_0_12px_rgba(244,63,94,0.5)]">
          <User className="w-5 h-5" />
        </div>
        <div>
          <span className="text-[11px] text-rose-700 dark:text-rose-200/70 font-medium block">Occupied</span>
          <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-none mt-0.5 block">
            {kpis.occupied}
          </span>
        </div>
        <div className="absolute -bottom-6 -right-6 w-20 h-20 rounded-full bg-rose-400/20 dark:bg-rose-500/20 blur-xl pointer-events-none" />
      </div>

      {/* 4. Paid • Review */}
      <div className="rounded-2xl p-4 bg-amber-50/60 dark:bg-gradient-to-br dark:from-[#2a1e0c]/90 dark:to-[#3b2a10]/60 border border-amber-200/80 dark:border-amber-500/35 relative overflow-hidden backdrop-blur-xl shadow-xs dark:shadow-lg flex items-center gap-3.5 transition-colors">
        <div className="w-10 h-10 rounded-full bg-amber-400 dark:bg-amber-500 flex items-center justify-center text-slate-950 font-black shrink-0 shadow-sm dark:shadow-[0_0_12px_rgba(245,158,11,0.5)]">
          <DollarSign className="w-5 h-5 stroke-[2.5]" />
        </div>
        <div>
          <span className="text-[11px] text-amber-800 dark:text-amber-200/70 font-medium block">Paid • Review</span>
          <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-none mt-0.5 block">
            {kpis.paidPending}
          </span>
        </div>
        <div className="absolute -bottom-6 -right-6 w-20 h-20 rounded-full bg-amber-300/30 dark:bg-amber-500/20 blur-xl pointer-events-none" />
      </div>

      {/* 5. Cleaning */}
      <div className="rounded-2xl p-4 bg-sky-50/60 dark:bg-gradient-to-br dark:from-[#0c1e38]/90 dark:to-[#122e54]/60 border border-sky-200/80 dark:border-sky-500/35 relative overflow-hidden backdrop-blur-xl shadow-xs dark:shadow-lg flex items-center gap-3.5 transition-colors">
        <div className="w-10 h-10 rounded-full bg-sky-400 dark:bg-sky-500 flex items-center justify-center text-white shrink-0 shadow-sm dark:shadow-[0_0_12px_rgba(14,165,233,0.5)]">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <span className="text-[11px] text-sky-700 dark:text-sky-200/70 font-medium block">Cleaning</span>
          <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-none mt-0.5 block">
            {kpis.cleaning}
          </span>
        </div>
        <div className="absolute -bottom-6 -right-6 w-20 h-20 rounded-full bg-sky-300/30 dark:bg-sky-500/20 blur-xl pointer-events-none" />
      </div>

      {/* 6. Bill Called */}
      <div className="rounded-2xl p-4 bg-purple-50/60 dark:bg-gradient-to-br dark:from-[#1f0f35]/90 dark:to-[#2e154f]/60 border border-purple-200/80 dark:border-purple-500/35 relative overflow-hidden backdrop-blur-xl shadow-xs dark:shadow-lg flex items-center gap-3.5 transition-colors">
        <div className="w-10 h-10 rounded-full bg-purple-500 dark:bg-purple-600 flex items-center justify-center text-white shrink-0 shadow-sm dark:shadow-[0_0_12px_rgba(168,85,247,0.5)]">
          <Bell className="w-5 h-5" />
        </div>
        <div>
          <span className="text-[11px] text-purple-700 dark:text-purple-200/70 font-medium block">Bill Called</span>
          <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-none mt-0.5 block">
            {kpis.billRequested}
          </span>
        </div>
        <div className="absolute -bottom-6 -right-6 w-20 h-20 rounded-full bg-purple-300/30 dark:bg-purple-600/20 blur-xl pointer-events-none" />
      </div>
    </div>
  );
}

