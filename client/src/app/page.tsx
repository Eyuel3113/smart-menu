'use client';

import Link from 'next/link';
import { UtensilsCrossed, MonitorPlay, QrCode, ShieldCheck, Flame, BellRing } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-radial from-[#181b24] to-[#0f1117] flex flex-col justify-center items-center px-4 py-12">
      <div className="max-w-4xl w-full text-center space-y-8">
        {/* Header Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold tracking-wide uppercase shadow-sm">
          <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
          Real-Time Restaurant Operating System
        </div>

        {/* Title */}
        <div className="space-y-3">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white">
            Smart<span className="text-amber-500">Menu</span>
          </h1>
          <p className="text-gray-400 text-base md:text-xl max-w-2xl mx-auto">
            Zero-friction contactless dining. Real-time dining state machine connecting diners, staff, and kitchen displays seamlessly.
          </p>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 text-left">
          {/* Customer Portal */}
          <Link
            href="/table/tbl-uuid-01?token=tbl-token-secret-1"
            className="group relative p-6 rounded-2xl bg-[#181b24]/80 border border-gray-800 hover:border-amber-500/50 hover:bg-[#1f2330] transition-all duration-300 shadow-xl hover:shadow-amber-500/10 flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white group-hover:text-amber-400 transition-colors">
                  Customer Dining
                </h3>
                <p className="text-sm text-gray-400 mt-1">
                  Table 1 simulated QR scan. Interactive menu, instant ordering, and live socket order tracking.
                </p>
              </div>
            </div>
            <div className="pt-6 flex items-center text-sm font-semibold text-amber-400 group-hover:translate-x-1 transition-transform">
              Launch Table 1 &rarr;
            </div>
          </Link>

          {/* Kitchen Display */}
          <Link
            href="/kitchen"
            className="group relative p-6 rounded-2xl bg-[#181b24]/80 border border-gray-800 hover:border-orange-500/50 hover:bg-[#1f2330] transition-all duration-300 shadow-xl hover:shadow-orange-500/10 flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 group-hover:scale-110 transition-transform">
                <UtensilsCrossed className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white group-hover:text-orange-400 transition-colors">
                  Kitchen Display (KDS)
                </h3>
                <p className="text-sm text-gray-400 mt-1">
                  High-contrast chef ticket screen with live cook timers and one-touch &ldquo;Mark Ready&rdquo; state transitions.
                </p>
              </div>
            </div>
            <div className="pt-6 flex items-center text-sm font-semibold text-orange-400 group-hover:translate-x-1 transition-transform">
              Open Kitchen Screen &rarr;
            </div>
          </Link>

          {/* Manager Dashboard */}
          <Link
            href="/manager"
            className="group relative p-6 rounded-2xl bg-[#181b24]/80 border border-gray-800 hover:border-emerald-500/50 hover:bg-[#1f2330] transition-all duration-300 shadow-xl hover:shadow-emerald-500/10 flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                <MonitorPlay className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">
                  Staff & Manager
                </h3>
                <p className="text-sm text-gray-400 mt-1">
                  Live order queue, 10-table visual matrix, real-time waiter call alerts, and sales analytics.
                </p>
              </div>
            </div>
            <div className="pt-6 flex items-center text-sm font-semibold text-emerald-400 group-hover:translate-x-1 transition-transform">
              Open Manager Portal &rarr;
            </div>
          </Link>
        </div>

        {/* Quick Credentials Info */}
        <div className="p-4 rounded-xl bg-gray-900/50 border border-gray-800 text-xs text-gray-400 flex flex-wrap items-center justify-center gap-4">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Staff Login: <strong>manager@smartmenu.com</strong> / <strong>password123</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <BellRing className="w-4 h-4 text-amber-400" />
            <span>Real-time Audio Chimes Synthesized via Web Audio API</span>
          </div>
        </div>
      </div>
    </main>
  );
}
