'use client';

import React from 'react';
import { UtensilsCrossed, Sparkles } from 'lucide-react';

interface RestaurantLoaderProps {
  message?: string;
  subMessage?: string;
  variant?: 'fullscreen' | 'inline' | 'compact';
  className?: string;
}

export default function RestaurantLoader({
  message = 'Preparing culinary experience...',
  subMessage = 'Fresh flavors and live table updates in sync',
  variant = 'inline',
  className = '',
}: RestaurantLoaderProps) {
  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2.5 text-xs text-slate-500 font-medium ${className}`}>
        <div className="relative w-5 h-5 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-amber-500/20 border-t-amber-500 animate-spin" />
          <UtensilsCrossed className="w-2.5 h-2.5 text-amber-500" />
        </div>
        <span>{message}</span>
      </div>
    );
  }

  const isFullscreen = variant === 'fullscreen';

  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-6 select-none font-sans ${
        isFullscreen
          ? 'min-h-screen w-full bg-gradient-to-b from-[#f8fafc] via-[#f1f5f9] to-[#e8edf5] dark:from-[#080c1d] dark:via-[#090e24] dark:to-[#080c1d]'
          : 'py-16 sm:py-20 w-full'
      } ${className}`}
    >
      {/* Animated Culinary Cloche & Steam Container */}
      <div className="relative w-24 h-24 mb-4 flex items-center justify-center">
        {/* Soft Ambient Glow Halo */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-400/20 via-blue-500/20 to-purple-500/20 blur-xl animate-pulse" />

        {/* Outer Orbital Spinning Aura */}
        <div className="absolute -inset-1 rounded-full border-2 border-transparent border-t-amber-500/80 border-r-blue-500/70 animate-spin duration-1000" />

        {/* Inner Pulsing Serving Plate */}
        <div className="relative w-20 h-20 rounded-2xl bg-white dark:bg-[#121833] border border-amber-200/60 dark:border-blue-800/50 shadow-xl shadow-amber-500/10 flex items-center justify-center">
          {/* Steam Aroma Ripples */}
          <div className="absolute -top-3.5 flex items-center gap-1.5 pointer-events-none">
            <span className="w-1 h-3 rounded-full bg-amber-400/70 animate-bounce delay-100" />
            <span className="w-1 h-4 rounded-full bg-amber-500/80 animate-bounce delay-200" />
            <span className="w-1 h-3 rounded-full bg-amber-400/70 animate-bounce delay-300" />
          </div>

          {/* Central Crossed Utensils Icon */}
          <div className="relative z-10 flex flex-col items-center justify-center">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 flex items-center justify-center shadow-md">
              <UtensilsCrossed className="w-5 h-5 stroke-[2.3]" />
            </div>
          </div>

          {/* Sparkle Accent */}
          <Sparkles className="w-3.5 h-3.5 text-amber-500 absolute -top-1 -right-1 animate-ping duration-1000" />
        </div>
      </div>

      {/* Culinary Status Message */}
      <div className="space-y-1 max-w-xs mx-auto">
        <h4 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center justify-center gap-1.5">
          <span>{message}</span>
        </h4>
        {subMessage && (
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {subMessage}
          </p>
        )}
      </div>
    </div>
  );
}

