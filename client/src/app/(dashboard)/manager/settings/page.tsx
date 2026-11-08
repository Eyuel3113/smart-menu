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
  Building2,
  Image as ImageIcon,
  Phone,
  MapPin,
  Save,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Coins,
  Sparkles,
  Eye,
} from 'lucide-react';

export default function RestaurantSettingsPage() {
  const router = useRouter();
  const [branding, setBranding] = useState<RestaurantBranding | null>(null);
  const [loading, setLoading] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Form State
  const [name, setName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [currency, setCurrency] = useState('ETB');

  const loadBranding = async () => {
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
      setName(data.name || '');
      setLogoUrl(data.logoUrl || '');
      setBannerUrl(data.bannerUrl || '');
      setPhone(data.phone || '');
      setAddress(data.address || '');
      setCurrency(data.currency || 'ETB');
    } catch (err: any) {
      console.warn('Failed to load restaurant branding:', err);
      setErrorMsg(err.message || 'Failed to load restaurant configuration');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBranding();
  }, [router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSavedSuccess(false);

    startTransition(async () => {
      try {
        const updated = await api.branding.update({
          name,
          logoUrl: logoUrl.trim() || null,
          bannerUrl: bannerUrl.trim() || null,
          phone: phone.trim() || null,
          address: address.trim() || null,
          currency,
        });

        setBranding(updated);
        setSavedSuccess(true);
        sound.playSuccessDing();
        setTimeout(() => setSavedSuccess(false), 3500);
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to update restaurant branding');
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0] dark:bg-[#080c1d] dark:from-[#080c1d] dark:to-[#080c1d] text-slate-900 dark:text-gray-100 flex flex-col font-sans transition-colors duration-200 relative">
      {/* 1. Shared Unified Top Navigation Bar */}
      <ManagerNav onRefresh={loadBranding} />

      {/* Ambient Fluid Glow Elements */}
      <div className="fixed -top-40 -left-40 w-96 h-96 rounded-full bg-blue-400/10 dark:bg-blue-600/10 blur-[130px] pointer-events-none" />
      <div className="fixed top-1/3 -right-40 w-96 h-96 rounded-full bg-indigo-400/10 dark:bg-purple-600/10 blur-[140px] pointer-events-none" />
      <div className="fixed -bottom-40 left-1/3 w-[500px] h-80 rounded-full bg-sky-400/10 dark:bg-cyan-600/10 blur-[130px] pointer-events-none" />

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 relative z-10">
        {/* Page Sub-Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100/80 dark:border-blue-800/40 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-xs">
              <Settings className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#0f172a] dark:text-white tracking-tight">
                CMS & Restaurant Branding
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Configure your brand identity, visuals, and venue details across guest table sessions.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={loadBranding}
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

        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-3 font-sans">
            <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-500 text-xs font-medium">Loading restaurant branding settings...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Status Feedback Banners */}
            {savedSuccess && (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2.5 animate-in fade-in shadow-xs">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Restaurant branding and venue configuration updated successfully!</span>
              </div>
            )}

            {errorMsg && (
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-bold flex items-center gap-2.5 animate-in fade-in shadow-xs">
                <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Section 1: Brand Identity */}
            <div className="bg-white/80 dark:bg-[#12162a]/90 backdrop-blur-md rounded-2xl border border-white/80 dark:border-blue-900/40 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-6 space-y-5">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Building2 className="w-4 h-4 stroke-[2]" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#0f172a] dark:text-white uppercase tracking-wider">
                    Brand Identity
                  </h2>
                  <p className="text-xs text-slate-400">Core legal and consumer-facing establishment details</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Restaurant Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Taste of Addis Lounge"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition placeholder:text-slate-400"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Displayed in the diner header, table orders, and printed receipts.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Currency Symbol / Code
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      placeholder="ETB"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition placeholder:text-slate-400"
                    />
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                      <Coins className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Prefix or suffix appended to menu prices and digital wallet settlements.</p>
                </div>
              </div>
            </div>

            {/* Section 2: Visual Assets & Imagery */}
            <div className="bg-white/80 dark:bg-[#12162a]/90 backdrop-blur-md rounded-2xl border border-white/80 dark:border-blue-900/40 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-6 space-y-5">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <ImageIcon className="w-4 h-4 stroke-[2]" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#0f172a] dark:text-white uppercase tracking-wider">
                    Visual Assets & Imagery
                  </h2>
                  <p className="text-xs text-slate-400">High-resolution brand mark and cover banner assets</p>
                </div>
              </div>

              <div className="space-y-5">
                {/* Logo Field */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Logo Image URL
                  </label>
                  <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                    <input
                      type="url"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/photo-... or https://example.com/logo.png"
                      className="flex-1 w-full px-4 py-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition placeholder:text-slate-400"
                    />
                    {logoUrl && (
                      <div className="relative w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0 shadow-xs flex items-center justify-center">
                        <img
                          src={logoUrl}
                          alt="Logo Preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Rendered in diner table header navigation, receipts, and order confirmation sheets.
                  </p>
                </div>

                {/* Banner Field */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Cover Banner Image URL
                  </label>
                  <div className="space-y-3">
                    <input
                      type="url"
                      value={bannerUrl}
                      onChange={(e) => setBannerUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/photo-... or https://example.com/banner.jpg"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition placeholder:text-slate-400"
                    />
                    {bannerUrl ? (
                      <div className="relative w-full h-32 sm:h-40 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
                        <img
                          src={bannerUrl}
                          alt="Banner Preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent flex items-end p-4">
                          <span className="text-xs font-bold text-white bg-black/40 backdrop-blur-xs px-2.5 py-1 rounded-full border border-white/20">
                            Live Banner Header Preview
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-24 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 text-xs">
                        Enter a valid image URL to preview hero banner
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Contact & Location */}
            <div className="bg-white/80 dark:bg-[#12162a]/90 backdrop-blur-md rounded-2xl border border-white/80 dark:border-blue-900/40 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-6 space-y-5">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <MapPin className="w-4 h-4 stroke-[2]" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#0f172a] dark:text-white uppercase tracking-wider">
                    Contact & Venue Details
                  </h2>
                  <p className="text-xs text-slate-400">Guest support helpline and physical address information</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Contact Phone Number
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+251 911 234 567"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition placeholder:text-slate-400"
                    />
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                      <Phone className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Physical Address / Dining Floor
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="e.g. Bole Medhanialem Road, Addis Ababa"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition placeholder:text-slate-400"
                    />
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                      <MapPin className="w-4 h-4" />
                    </div>
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
                <span>{isPending ? 'Saving Changes...' : 'Save Branding Configuration'}</span>
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
