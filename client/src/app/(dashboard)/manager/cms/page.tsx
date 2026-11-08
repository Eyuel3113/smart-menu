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
  Star,
  Receipt,
  CreditCard,
  Sliders,
  Check,
  Clapperboard,
  Film,
  Plus,
  Trash2,
  Edit2,
  Play,
  EyeOff,
  ShoppingBag,
  X,
} from 'lucide-react';
import {
  ReelItem,
  DEFAULT_REELS_DATA,
  getStoredReels,
  saveStoredReels,
} from '@/components/customer/ReelsModal';

export default function RestaurantCMSPage() {
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
  const [showReviewShower, setShowReviewShower] = useState(true);
  const [paymentTiming, setPaymentTiming] = useState<'FINAL' | 'PRE_ORDER'>('FINAL');

  // --- Reels Management State ---
  const [reels, setReels] = useState<ReelItem[]>([]);
  const [isReelModalOpen, setIsReelModalOpen] = useState(false);
  const [editingReel, setEditingReel] = useState<ReelItem | null>(null);
  const [reelToast, setReelToast] = useState<string | null>(null);

  // Form State for Reel Modal
  const [reelTitle, setReelTitle] = useState('');
  const [reelAuthor, setReelAuthor] = useState('');
  const [reelAuthorRole, setReelAuthorRole] = useState('');
  const [reelVideoSrc, setReelVideoSrc] = useState('');
  const [reelPosterSrc, setReelPosterSrc] = useState('');
  const [reelDesc, setReelDesc] = useState('');
  const [reelIsFood, setReelIsFood] = useState(true);
  const [reelDishName, setReelDishName] = useState('');
  const [reelDishPrice, setReelDishPrice] = useState<number>(450);
  const [reelCategory, setReelCategory] = useState('Main Grill');
  const [reelTags, setReelTags] = useState('#SizzlingHot, #KitchenSpecial');
  const [reelIcon, setReelIcon] = useState('🥩');
  const [reelActive, setReelActive] = useState(true);

  // Load reels catalog
  useEffect(() => {
    setReels(getStoredReels());
  }, []);

  const openAddReelModal = () => {
    setEditingReel(null);
    setReelTitle('');
    setReelAuthor('Chef Dawit');
    setReelAuthorRole('Head Grillmaster');
    setReelVideoSrc('https://upload.wikimedia.org/wikipedia/commons/transcoded/6/63/Chicken_%26_Beef_Barbecue_Skewers_at_the_Backyard.webm/Chicken_%26_Beef_Barbecue_Skewers_at_the_Backyard.webm.480p.vp9.webm');
    setReelPosterSrc('https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80');
    setReelDesc('Sizzling prime beef skewers caramelized over live coals with rosemary and niter kibbeh butter.');
    setReelIsFood(true);
    setReelDishName('Special Shekla Tibs');
    setReelDishPrice(450);
    setReelCategory('Main Grill');
    setReelTags('#SheklaTibs, #SizzlingHot, #NiterKibbeh');
    setReelIcon('🥩');
    setReelActive(true);
    setIsReelModalOpen(true);
  };

  const openEditReelModal = (reel: ReelItem) => {
    setEditingReel(reel);
    setReelTitle(reel.title);
    setReelAuthor(reel.author);
    setReelAuthorRole(reel.authorRole);
    setReelVideoSrc(reel.videoSrc);
    setReelPosterSrc(reel.posterSrc);
    setReelDesc(reel.description);
    setReelIsFood(reel.isFood);
    setReelDishName(reel.dishName || '');
    setReelDishPrice(reel.dishPrice || 0);
    setReelCategory(reel.category || 'Mains');
    setReelTags((reel.tags || []).join(', '));
    setReelIcon(reel.icon || '🍽️');
    setReelActive(reel.isActive !== false);
    setIsReelModalOpen(true);
  };

  const handleSaveReel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reelTitle.trim() || !reelVideoSrc.trim() || !reelPosterSrc.trim()) {
      alert('Please provide a title, video source URL, and poster image URL.');
      return;
    }

    const tagArray = reelTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .map((t) => (t.startsWith('#') ? t : `#${t}`));

    const newReel: ReelItem = {
      id: editingReel ? editingReel.id : `reel-custom-${Date.now()}`,
      title: reelTitle.trim(),
      author: reelAuthor.trim() || 'Head Chef',
      authorRole: reelAuthorRole.trim() || 'Kitchen Master',
      avatarBg: editingReel?.avatarBg || 'bg-red-600',
      icon: reelIcon || (reelIsFood ? '🍽️' : '✨'),
      description: reelDesc.trim(),
      dishName: reelDishName.trim(),
      dishPrice: Number(reelDishPrice) || 0,
      category: reelCategory.trim() || 'General',
      isFood: reelIsFood,
      initialLikes: editingReel?.initialLikes || Math.floor(Math.random() * 500 + 1200),
      videoSrc: reelVideoSrc.trim(),
      posterSrc: reelPosterSrc.trim(),
      tags: tagArray.length > 0 ? tagArray : ['#SmartMenu'],
      isActive: reelActive,
    };

    let updated: ReelItem[];
    if (editingReel) {
      updated = reels.map((r) => (r.id === editingReel.id ? newReel : r));
    } else {
      updated = [newReel, ...reels];
    }

    setReels(updated);
    saveStoredReels(updated);
    setIsReelModalOpen(false);
    setReelToast(editingReel ? 'Reel updated successfully!' : 'New Reel published to diner table feed!');
    sound.playSuccessDing();
    setTimeout(() => setReelToast(null), 3000);
  };

  const handleDeleteReel = (id: string) => {
    if (!confirm('Are you sure you want to remove this reel from diner hubs?')) return;
    const updated = reels.filter((r) => r.id !== id);
    setReels(updated);
    saveStoredReels(updated);
    setReelToast('Reel removed from catalog.');
    setTimeout(() => setReelToast(null), 3000);
  };

  const handleToggleReelActive = (id: string) => {
    const updated = reels.map((r) => (r.id === id ? { ...r, isActive: r.isActive === false } : r));
    setReels(updated);
    saveStoredReels(updated);
    setReelToast('Reel visibility updated.');
    setTimeout(() => setReelToast(null), 2500);
  };

  const handleResetDefaultReels = () => {
    if (!confirm('Reset reels list to factory default showcase?')) return;
    setReels(DEFAULT_REELS_DATA);
    saveStoredReels(DEFAULT_REELS_DATA);
    setReelToast('Reset reels to factory default catalog.');
    setTimeout(() => setReelToast(null), 3000);
  };

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
                CMS &amp; Media Management
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Configure brand identity, visuals, venue details, and diner video reels.
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

            {/* Section 4: Video Reels & Vibe Catalog Management */}
            <div className="bg-white/80 dark:bg-[#12162a]/90 backdrop-blur-md rounded-2xl border border-white/80 dark:border-blue-900/40 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                    <Clapperboard className="w-4 h-4 stroke-[2]" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-[#0f172a] dark:text-white uppercase tracking-wider">
                      Reels &amp; Video Showcase Management
                    </h2>
                    <p className="text-xs text-slate-400">
                      Manage vertical short clips shown to diners. Only food menu items show the &ldquo;Order Now&rdquo; cart button.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetDefaultReels}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold transition cursor-pointer"
                  >
                    Reset Defaults
                  </button>

                  <button
                    type="button"
                    onClick={openAddReelModal}
                    className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-600/20 active:scale-95 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Add Reel</span>
                  </button>
                </div>
              </div>

              {reelToast && (
                <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-200 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-purple-600" />
                  <span>{reelToast}</span>
                </div>
              )}

              {/* Reels Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {reels.map((reel) => {
                  const isActive = reel.isActive !== false;
                  return (
                    <div
                      key={reel.id}
                      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 overflow-hidden flex flex-col justify-between group hover:border-purple-300 dark:hover:border-purple-600/50 transition shadow-2xs"
                    >
                      {/* Video Poster Preview */}
                      <div className="relative aspect-4/3 w-full bg-slate-950 overflow-hidden">
                        <img
                          src={reel.posterSrc}
                          alt={reel.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow">
                            <Play className="w-4 h-4 fill-white translate-x-0.5" />
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="absolute top-2.5 right-2.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider backdrop-blur-md ${
                              isActive
                                ? 'bg-emerald-500/90 text-white'
                                : 'bg-slate-700/80 text-slate-300'
                            }`}
                          >
                            {isActive ? 'Live' : 'Hidden'}
                          </span>
                        </div>

                        {/* Category Tag */}
                        <div className="absolute bottom-2.5 left-2.5">
                          <span className="px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-md text-white text-[10px] font-bold">
                            {reel.category || 'Reel'}
                          </span>
                        </div>
                      </div>

                      {/* Info & Dish Attachment */}
                      <div className="p-3.5 space-y-2.5 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-sm">{reel.icon || '🍽️'}</span>
                            <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {reel.title}
                            </h3>
                          </div>
                          <p className="text-[11px] text-slate-400 line-clamp-2">
                            {reel.description}
                          </p>
                        </div>

                        {/* Food Attachment Pill */}
                        <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800">
                          {reel.isFood ? (
                            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/40">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-extrabold text-amber-900 dark:text-amber-200 truncate">
                                  {reel.dishName || 'Food Item'}
                                </span>
                                <span className="font-black text-amber-700 dark:text-amber-400 shrink-0">
                                  {reel.dishPrice} ETB
                                </span>
                              </div>
                              <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                                <ShoppingBag className="w-2.5 h-2.5" />
                                <span>Order Now Button Active</span>
                              </span>
                            </div>
                          ) : (
                            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/50 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                              Vibe / Beverage &bull; No Order Button
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800">
                          <button
                            type="button"
                            onClick={() => handleToggleReelActive(reel.id)}
                            className="text-[11px] font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 cursor-pointer"
                          >
                            {isActive ? (
                              <>
                                <Eye className="w-3.5 h-3.5 text-emerald-500" />
                                <span>Visible</span>
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                                <span>Hidden</span>
                              </>
                            )}
                          </button>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => openEditReelModal(reel)}
                              className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition cursor-pointer"
                              title="Edit Reel"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteReel(reel.id)}
                              className="p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 transition cursor-pointer"
                              title="Delete Reel"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
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
                <span>{isPending ? 'Saving Brand CMS...' : 'Save Brand CMS'}</span>
              </button>
            </div>
          </form>
        )}

        {/* ADD / EDIT REEL MODAL */}
        {isReelModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in">
            <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-[#12162a] border border-slate-200 dark:border-blue-900/40 p-6 shadow-2xl space-y-5 my-8">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                    <Clapperboard className="w-4 h-4 stroke-[2]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {editingReel ? 'Edit Video Reel' : 'Add New Video Reel'}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Configure video clip, creator, and attached food ordering item
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsReelModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveReel} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Reel Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={reelTitle}
                    onChange={(e) => setReelTitle(e.target.value)}
                    placeholder="e.g. Flame-Kissed Charcoal Tibs"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:border-purple-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Creator / Chef Name
                    </label>
                    <input
                      type="text"
                      value={reelAuthor}
                      onChange={(e) => setReelAuthor(e.target.value)}
                      placeholder="e.g. Chef Dawit"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Chef Role / Tagline
                    </label>
                    <input
                      type="text"
                      value={reelAuthorRole}
                      onChange={(e) => setReelAuthorRole(e.target.value)}
                      placeholder="e.g. Head Grillmaster"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:border-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Video Source URL (MP4 / WebM) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="url"
                    required
                    value={reelVideoSrc}
                    onChange={(e) => setReelVideoSrc(e.target.value)}
                    placeholder="https://.../video.webm or .mp4"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:outline-hidden focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Poster Thumbnail Image URL <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="url"
                    required
                    value={reelPosterSrc}
                    onChange={(e) => setReelPosterSrc(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:outline-hidden focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Description / Story
                  </label>
                  <textarea
                    rows={2}
                    value={reelDesc}
                    onChange={(e) => setReelDesc(e.target.value)}
                    placeholder="Describe the craft or preparation process..."
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-purple-500"
                  />
                </div>

                {/* Food Item Link Toggle */}
                <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>🍽️</span>
                        <span>Is this a Food Menu Item?</span>
                      </span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        If enabled, an &ldquo;Order Now&rdquo; button will appear on this reel to add the dish to the cart.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReelIsFood(!reelIsFood)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                        reelIsFood ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          reelIsFood ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {reelIsFood && (
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-amber-200/50 dark:border-amber-800/30 animate-in fade-in">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Dish Name
                        </label>
                        <input
                          type="text"
                          value={reelDishName}
                          onChange={(e) => setReelDishName(e.target.value)}
                          placeholder="e.g. Special Shekla Tibs"
                          className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800/60 text-xs font-semibold text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Dish Price (ETB)
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={reelDishPrice}
                          onChange={(e) => setReelDishPrice(Number(e.target.value))}
                          className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800/60 text-xs font-bold text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Status and Submit */}
                <div className="flex items-center justify-between pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={reelActive}
                      onChange={(e) => setReelActive(e.target.checked)}
                      className="w-4 h-4 rounded text-purple-600"
                    />
                    <span>Active &amp; Published in Diner Feed</span>
                  </label>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsReelModalOpen(false)}
                      className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-600/30 cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Reel</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
