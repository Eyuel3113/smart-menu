'use client';

import React from 'react';

interface RestaurantLoaderProps {
  message?: string;
  subMessage?: string;
  variant?: 'fullscreen' | 'inline' | 'compact';
  className?: string;
}

// 28-segment radial ticks exactly matching the Agelgil loader design
const TICK_SEGMENTS: Array<{ angle: number; color: string; opacity: number }> = [
  // Top fading trail (12 o'clock / 0 deg)
  { angle: 0 * (360 / 28), color: '#38bdf8', opacity: 0.2 },
  { angle: 1 * (360 / 28), color: '#38bdf8', opacity: 0.32 },
  { angle: 2 * (360 / 28), color: '#60a5fa', opacity: 0.48 },
  { angle: 3 * (360 / 28), color: '#3b82f6', opacity: 0.65 },
  // Clockwise into royal & deep navy blue (1 to 5 o'clock)
  { angle: 4 * (360 / 28), color: '#2563eb', opacity: 0.82 },
  { angle: 5 * (360 / 28), color: '#1d4ed8', opacity: 0.95 },
  { angle: 6 * (360 / 28), color: '#1e40af', opacity: 1.0 },
  { angle: 7 * (360 / 28), color: '#1e3a8a', opacity: 1.0 },
  { angle: 8 * (360 / 28), color: '#1e3a8a', opacity: 1.0 },
  { angle: 9 * (360 / 28), color: '#172554', opacity: 1.0 },
  { angle: 10 * (360 / 28), color: '#0f172a', opacity: 1.0 },
  // Deep navy transitioning into burnt amber (5 to 6 o'clock)
  { angle: 11 * (360 / 28), color: '#1e293b', opacity: 1.0 },
  { angle: 12 * (360 / 28), color: '#334155', opacity: 1.0 },
  { angle: 13 * (360 / 28), color: '#9a3412', opacity: 1.0 },
  { angle: 14 * (360 / 28), color: '#c2410c', opacity: 1.0 },
  // Vibrant warm orange & golden amber (6 to 10 o'clock)
  { angle: 15 * (360 / 28), color: '#ea580c', opacity: 1.0 },
  { angle: 16 * (360 / 28), color: '#f97316', opacity: 1.0 },
  { angle: 17 * (360 / 28), color: '#f97316', opacity: 1.0 },
  { angle: 18 * (360 / 28), color: '#fb923c', opacity: 1.0 },
  { angle: 19 * (360 / 28), color: '#f59e0b', opacity: 1.0 },
  { angle: 20 * (360 / 28), color: '#f59e0b', opacity: 1.0 },
  { angle: 21 * (360 / 28), color: '#f59e0b', opacity: 1.0 },
  { angle: 22 * (360 / 28), color: '#fbbf24', opacity: 1.0 },
  { angle: 23 * (360 / 28), color: '#fbbf24', opacity: 0.92 },
  { angle: 24 * (360 / 28), color: '#fcd34d', opacity: 0.78 },
  // 10:30 to 12 o'clock - tail fading into sky blue
  { angle: 25 * (360 / 28), color: '#bae6fd', opacity: 0.55 },
  { angle: 26 * (360 / 28), color: '#e0f2fe', opacity: 0.35 },
  { angle: 27 * (360 / 28), color: '#f0f9ff', opacity: 0.22 },
];

export default function RestaurantLoader({
  message = 'ዝግጅት ላይ ነን...',
  subMessage = 'Agelgil Smart Dining • Real-Time sync',
  variant = 'inline',
  className = '',
}: RestaurantLoaderProps) {
  // Compact spinner for buttons and dense lists
  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2.5 text-xs text-slate-500 font-medium ${className}`}>
        <div className="relative w-6 h-6 shrink-0 flex items-center justify-center">
          <svg
            viewBox="0 0 200 200"
            className="w-full h-full animate-spin [animation-duration:1.2s]"
            aria-hidden="true"
          >
            {TICK_SEGMENTS.map((tick, i) => (
              <line
                key={i}
                x1="100"
                y1="14"
                x2="100"
                y2="34"
                stroke={tick.color}
                strokeWidth="7"
                strokeLinecap="round"
                opacity={tick.opacity}
                transform={`rotate(${tick.angle} 100 100)`}
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center p-1 pointer-events-none">
            <img
              src="/images/agelgil-logo.png"
              alt="አገልግል"
              className="w-3.5 h-3.5 rounded-full object-contain"
            />
          </div>
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
          : 'py-12 sm:py-16 w-full'
      } ${className}`}
    >
      {/* 28-Segment Radial Animated Spinner with Centered Agelgil Badge */}
      <div className="relative w-28 h-28 sm:w-32 sm:h-32 mb-4 flex items-center justify-center">
        {/* Soft Ambient Radial Glow */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-500/15 via-blue-500/15 to-amber-500/10 blur-xl animate-pulse pointer-events-none" />

        {/* 28-Segment Radial Tick Ring SVG */}
        <svg
          viewBox="0 0 200 200"
          className="absolute inset-0 w-full h-full animate-spin [animation-duration:1.3s]"
          aria-hidden="true"
        >
          {TICK_SEGMENTS.map((tick, i) => (
            <line
              key={i}
              x1="100"
              y1="12"
              x2="100"
              y2="32"
              stroke={tick.color}
              strokeWidth="6.5"
              strokeLinecap="round"
              opacity={tick.opacity}
              transform={`rotate(${tick.angle} 100 100)`}
            />
          ))}
        </svg>

        {/* Centered Circular Agelgil Badge (Stationary & Upright) */}
        <div className="relative z-10 w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center pointer-events-none">
          <img
            src="/images/agelgil-logo.png"
            alt="አገልግል"
            className="w-full h-full object-contain rounded-full drop-shadow-md transition-transform duration-300 hover:scale-105"
          />
        </div>
      </div>

      {/* Culinary Status Message */}
      <div className="space-y-1 max-w-xs mx-auto">
        <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center justify-center gap-1.5">
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
