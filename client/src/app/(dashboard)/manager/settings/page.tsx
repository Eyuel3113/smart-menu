'use client';

import React, { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { RestaurantBranding } from '@/lib/types';
import ManagerNav from '@/components/ManagerNav';
import sound from '@/lib/sound';
import {
  Settings,
  Save,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Eye,
  Star,
  Receipt,
  CreditCard,
  Sliders,
  Check,
  Palette,
  ArrowRight,
} from 'lucide-react';

export default function ExperienceSettingsPage() {
  const router = useRouter();
  const [branding, setBranding] = useState<RestaurantBranding | null>(null);
  const [loading, setLoading] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Experience Settings State
  const [showReviewShower, setShowReviewShower] = useState(true);
  const [paymentTiming, setPaymentTiming] = useState<'FINAL' | 'PRE_ORDER'>('FINAL');

  const loadSettings = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const token = typeof window !== 'undefined' ? localStorage.getItem('smart_menu_staff_token') : null;
      if (!token) {
        router.push('/login');
        return;
      }

      const data = await api.branding.get();
      setBranding(data);
      setShowReviewShower(data.showReviewShower !== false);
      setPaymentTiming((data.paymentTiming as any) === 'PRE_ORDER' ? 'PRE_ORDER' : 'FINAL');

      // Sync local cache
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          'smart_menu_experience_settings',
          JSON.stringify({
            showReviewShower: data.showReviewShower !== false,
            paymentTiming: (data.paymentTiming as any) === 'PRE_ORDER' ? 'PRE_ORDER' : 'FINAL',
          })
        );
      }
    } catch (err: any) {
      console.warn('Failed to load settings:', err);
      setErrorMsg(err.message || 'Failed to load experience configuration');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, [router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSavedSuccess(false);

    startTransition(async () => {
      try {
        const updated = await api.branding.update({
          showReviewShower,
          paymentTiming,
        });

        setBranding(updated);
        if (typeof window !== 'undefined') {
          localStorage.setItem(
            'smart_menu_experience_settings',
            JSON.stringify({
              showReviewShower,
              paymentTiming,
            })
          );
        }
        setSavedSuccess(true);
        sound.playSuccessDing();
        setTimeout(() => setSavedSuccess(false), 3500);
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to update experience settings');
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0] dark:bg-[#080c1d] dark:from-[#080c1d] dark:to-[#080c1d] text-slate-900 dark:text-gray-100 flex flex-col font-sans transition-colors duration-200 relative">
      {/* 1. Top Navigation Bar */}
      <ManagerNav onRefresh={loadSettings} />

      {/* Ambient Fluid Glow */}
      <div className="fixed -top-40 -left-40 w-96 h-96 rounded-full bg-blue-400/10 dark:bg-blue-600/10 blur-[130px] pointer-events-none" />
      <div className="fixed top-1/3 -right-40 w-96 h-96 rounded-full bg-indigo-400/10 dark:bg-purple-600/10 blur-[140px] pointer-events-none" />

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 relative z-10">
        {/* Page Sub-Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100/80 dark:border-blue-800/40 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-xs">
              <Settings className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#0f172a] dark:text-white tracking-tight">
                Settings
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Experience &amp; Order Policy controls for diner menus and table checkout.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={loadSettings}
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#12162a] border border-slate-200/90 dark:border-blue-900/40 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <Link
              href="/table/tbl-uuid-01"
              target="_blank"
              className="px-4 py-2 rounded-xl bg-white dark:bg-[#12162a] border border-slate-200/90 dark:border-blue-900/40 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Preview Diner Menu</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </Link>
          </div>
        </div>

        {/* Link banner to CMS if user wants Brand identity & Reels */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-blue-500/10 border border-purple-300/40 dark:border-purple-800/40 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0">
              <Palette className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                Looking for Brand Logos, Covers &amp; Video Reels?
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Manage your visual assets and video catalog on the CMS page.
              </p>
            </div>
          </div>
          <Link
            href="/manager/cms"
            className="px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-xs font-bold flex items-center gap-1.5 shadow-xs hover:bg-purple-50 dark:hover:bg-purple-950 transition shrink-0"
          >
            <span>Open CMS</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-3 font-sans">
            <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-500 text-xs font-medium">Loading experience policy settings...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Status Feedback Banners */}
            {savedSuccess && (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2.5 animate-in fade-in shadow-xs">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Experience policy &amp; order timing settings updated successfully!</span>
              </div>
            )}

            {errorMsg && (
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-bold flex items-center gap-2.5 animate-in fade-in shadow-xs">
                <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Experience & Order Policy Section */}
            <div className="bg-white/80 dark:bg-[#12162a]/90 backdrop-blur-md rounded-2xl border border-white/80 dark:border-blue-900/40 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-6 space-y-6">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Sliders className="w-4 h-4 stroke-[2]" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#0f172a] dark:text-white uppercase tracking-wider">
                    Experience &amp; Order Policy
                  </h2>
                  <p className="text-xs text-slate-400">
                    Control menu top widgets and diner checkout settlement flow
                  </p>
                </div>
              </div>

              {/* Toggle 1: Review Shower in Top of Menu */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      Review Shower in Top of Menu
                    </span>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        showReviewShower
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                          : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {showReviewShower ? 'ON' : 'OFF'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl">
                    Display the customer rating badge (&ldquo;⭐ 4.8 • 2.5k reviews&rdquo;) and &ldquo;Leave a Review&rdquo; button at the top header of the diner menu.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowReviewShower(!showReviewShower)}
                  className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    showReviewShower ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                  role="switch"
                  aria-checked={showReviewShower}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      showReviewShower ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Toggle 2: Payment Policy (Final Settlement vs Pay Before Commit Order) */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                    Payment Timing &amp; Order Settlement Mode
                  </label>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Choose whether diners settle their bill at the final conclusion or must pay before committing each order round.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Mode 1: Final Settlement */}
                  <div
                    onClick={() => setPaymentTiming('FINAL')}
                    className={`p-4 rounded-2xl border-2 transition cursor-pointer relative ${
                      paymentTiming === 'FINAL'
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 shadow-md shadow-blue-500/10'
                        : 'border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <Receipt className="w-5 h-5 stroke-[2]" />
                      </div>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                        Default
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        Pay in the Final
                      </h3>
                      {paymentTiming === 'FINAL' && (
                        <Check className="w-4 h-4 text-blue-600 stroke-[3]" />
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Diners order dishes freely across rounds, dine first, and settle the accumulated check at the end before table checkout.
                    </p>
                  </div>

                  {/* Mode 2: Pay Before Commit Order */}
                  <div
                    onClick={() => setPaymentTiming('PRE_ORDER')}
                    className={`p-4 rounded-2xl border-2 transition cursor-pointer relative ${
                      paymentTiming === 'PRE_ORDER'
                        ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 shadow-md shadow-emerald-500/10'
                        : 'border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <CreditCard className="w-5 h-5 stroke-[2]" />
                      </div>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        Pre-Payment
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        Pay Before Commit Order
                      </h3>
                      {paymentTiming === 'PRE_ORDER' && (
                        <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Instant upfront USSD push (Telebirr / CBE Birr / Awash). Diners must complete payment before the order is sent to the kitchen.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Action CTA */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="submit"
                disabled={isPending}
                className="px-6 py-2.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-md shadow-blue-500/25 active:scale-95 transition cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4 stroke-[2.2]" />
                <span>{isPending ? 'Saving Settings...' : 'Save Settings'}</span>
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
