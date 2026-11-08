'use client';

import React, { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Order } from '@/lib/types';
import { useSocket } from '@/hooks/useSocket';
import sound from '@/lib/sound';
import {
  Flame,
  CheckCircle,
  Clock,
  RefreshCw,
  ChefHat,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  LayoutGrid,
  ChevronDown,
  Settings,
  LogOut,
  Radio,
} from 'lucide-react';

export default function KitchenDisplayPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [now, setNow] = useState<number>(Date.now());
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [dismissedOrderIds, setDismissedOrderIds] = useState<Set<string>>(new Set());
  const [profileOpen, setProfileOpen] = useState<boolean>(false);

  const [actionPending, startActionTransition] = useTransition();

  // Connect to the kitchen_display socket room (only when authenticated)
  const { socket, on, isConnected } = useSocket({ isKitchen: true, autoConnect: isAuthenticated });

  // Explicitly emit join_kitchen_room on mount and connection
  useEffect(() => {
    if (socket && isConnected) {
      socket.emit('join_kitchen_room');
    }
  }, [socket, isConnected]);

  // 1. Initial Load of Kitchen Orders
  const loadKitchenOrders = async () => {
    try {
      setLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('smart_menu_staff_token') : null;
      if (!token) {
        router.push('/login');
        return;
      }

      // Fetch active kitchen orders using api.orders.getKitchen()
      const data = await api.orders.getKitchen();
      const activeTickets = Array.isArray(data)
        ? data.filter((o) => o.status === 'ACCEPTED' || o.status === 'PREPARING')
        : [];
      setOrders(activeTickets);
    } catch (err) {
      console.error('Failed to load kitchen display orders (GET /api/orders/kitchen):', err);
      if (err instanceof Error && (err.message.includes('401') || err.message.toLowerCase().includes('unauthorized'))) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('smart_menu_staff_token');
          localStorage.removeItem('smart_menu_staff_user');
        }
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('smart_menu_staff_token') : null;
    if (!token) {
      router.push('/login');
      return;
    }
    setIsAuthenticated(true);
    loadKitchenOrders();
  }, [router]);

  // 2. Real-Time Elapsed Timer Tick (every second)
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Listen to fullscreenchange events so state syncs if user presses Esc
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // 3. Real-Time Socket Event Listeners
  useEffect(() => {
    // New ticket approved by manager and forwarded to kitchen
    const handleKitchenOrder = (newOrder: Order) => {
      setOrders((prev) => {
        if (prev.some((o) => o.id === newOrder.id)) {
          return prev.map((o) => (o.id === newOrder.id ? newOrder : o));
        }
        return [newOrder, ...prev];
      });
      try {
        sound.playChime();
      } catch {}
    };

    const cleanupAccepted = on<Order>('order:accepted', handleKitchenOrder);
    const cleanupSent = on<Order>('order:sent_to_kitchen', handleKitchenOrder);

    const cleanupPreparing = on<Order>('order:preparing', (updatedTicket) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === updatedTicket.id ? updatedTicket : o))
      );
    });

    // When food is ready or served or cancelled, permanently remove ticket from active cook screen
    const removeTicket = (doneTicket: Order) => {
      setDismissedOrderIds((prev) => new Set(prev).add(doneTicket.id));
      setOrders((prev) => prev.filter((o) => o.id !== doneTicket.id));
    };

    const cleanupReady = on<Order>('order:ready', removeTicket);
    const cleanupServed = on<Order>('order:served', removeTicket);
    const cleanupCompleted = on<Order>('order:completed', removeTicket);
    const cleanupRejected = on<Order>('order:rejected', removeTicket);

    return () => {
      cleanupAccepted();
      cleanupSent();
      cleanupPreparing();
      cleanupReady();
      cleanupServed();
      cleanupCompleted();
      cleanupRejected();
    };
  }, [on]);

  // Actions
  const handleStartPreparing = (orderId: string) => {
    // Optimistic UI update
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'PREPARING' } : o))
    );

    startActionTransition(async () => {
      try {
        const updated = await api.orders.prepare(orderId);
        setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      } catch (err: any) {
        console.error('Failed to start preparing:', err);
      }
    });
  };

  const handleMarkReady = (orderId: string) => {
    // Immediately remove from screen
    setDismissedOrderIds((prev) => new Set(prev).add(orderId));
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    try {
      sound.playSuccessDing();
    } catch {}

    startActionTransition(async () => {
      try {
        await api.orders.ready(orderId);
      } catch (err: any) {
        console.error('Failed to mark order ready:', err);
      }
    });
  };

  const toggleSound = () => {
    const next = !isMuted;
    setIsMuted(next);
    sound.setMuted(next);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handleLogout = () => {
    api.auth.logout();
    router.push('/login');
  };

  // Helper to calculate elapsed time in minutes and seconds
  const formatElapsed = (createdAt: string) => {
    const diffSeconds = Math.max(0, Math.floor((now - new Date(createdAt).getTime()) / 1000));
    const mins = Math.floor(diffSeconds / 60);
    const secs = diffSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Real live tickets currently cooking or accepted
  const displayTickets = orders.filter(
    (o) => (o.status === 'ACCEPTED' || o.status === 'PREPARING') && !dismissedOrderIds.has(o.id)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#eff6ff] to-[#e0f2fe] dark:bg-[#080c1d] dark:from-[#080c1d] dark:to-[#080c1d] text-slate-900 dark:text-gray-100 flex flex-col relative overflow-hidden font-sans transition-colors duration-200 select-none">
      {/* Ambient Fluid Glow Waves */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-blue-400/10 dark:bg-blue-600/15 blur-[120px] pointer-events-none" />
      <div className="absolute top-1/4 -right-32 w-96 h-96 rounded-full bg-indigo-400/10 dark:bg-purple-600/10 blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-32 left-1/3 w-[500px] h-[300px] rounded-full bg-sky-400/10 dark:bg-cyan-600/10 blur-[130px] pointer-events-none" />

      {/* Top Floating KDS Navbar (hidden in fullscreen mode so only order cards show) */}
      {!isFullscreen && (
        <header className="relative z-20 bg-white/90 dark:bg-[#12162a]/90 backdrop-blur-xl border border-white/80 dark:border-blue-900/40 rounded-3xl shadow-[0_4px_25px_rgba(0,0,0,0.04)] px-6 py-3.5 flex items-center justify-between mx-4 sm:mx-6 mt-4">
        {/* Left: Chef Hat Badge & Title */}
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
            <ChefHat className="w-6 h-6 stroke-[1.75]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-[#0f172a] dark:text-white tracking-wide uppercase font-sans">
                Kitchen Display System (KDS)
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#f97316] text-white shadow-xs">
                {displayTickets.length} Active
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-blue-300/70 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Real-Time Kitchen Pipeline Active</span>
            </div>
          </div>
        </div>

        {/* Right: Sound, Refresh, Fullscreen Controls & Profile */}
        <div className="flex items-center gap-2">
          {/* Mute/Unmute Toggle */}
          <button
            onClick={toggleSound}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition border shadow-xs cursor-pointer ${
              isMuted
                ? 'bg-rose-50 border-rose-200 text-rose-500 dark:bg-rose-950/40 dark:border-rose-800'
                : 'bg-blue-600 border-blue-600 text-white'
            }`}
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Refresh Button */}
          <button
            onClick={loadKitchenOrders}
            className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center transition hover:bg-blue-700 shadow-xs cursor-pointer active:scale-95"
            title="Refresh Orders"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center transition hover:bg-blue-700 shadow-xs cursor-pointer active:scale-95"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>

          <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block" />

          {/* Manager Station Link */}
          <Link
            href="/manager"
            className="h-9 px-4 rounded-full bg-slate-100 hover:bg-slate-200/80 dark:bg-[#111936] dark:hover:bg-blue-900/30 text-slate-800 dark:text-white text-xs font-bold flex items-center gap-1.5 transition border border-slate-200 dark:border-blue-900/40 shadow-xs active:scale-95"
          >
            <LayoutGrid className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Manager</span>
          </Link>

          {/* Profile User Avatar Pill & Dropdown */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-1.5 p-1 pl-1.5 pr-2 rounded-full bg-slate-100 hover:bg-slate-200/80 dark:bg-[#111936] dark:hover:bg-blue-900/30 border border-slate-200 dark:border-blue-900/40 text-slate-800 dark:text-white transition cursor-pointer"
              title="Staff Profile"
            >
              <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-600/30 border border-blue-300 dark:border-blue-400/40 flex items-center justify-center font-bold text-xs text-blue-700 dark:text-blue-200">
                K
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 dark:text-blue-300" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white dark:bg-[#0f1738] border border-slate-200 dark:border-blue-800/40 p-2 shadow-2xl z-50 animate-in fade-in space-y-1">
                <div className="px-3 py-2 border-b border-slate-100 dark:border-blue-900/40">
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Kitchen Station</p>
                  <p className="text-[10px] text-slate-500 dark:text-blue-300/70">Head Chef Console</p>
                </div>
                <Link
                  href="/manager/settings"
                  className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-700 dark:text-blue-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-blue-900/30 flex items-center gap-2 transition"
                  onClick={() => setProfileOpen(false)}
                >
                  <Settings className="w-3.5 h-3.5 text-blue-500" />
                  <span>Settings</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center gap-2 transition cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      )}

      {/* Floating Exit Fullscreen Button (only visible in fullscreen mode) */}
      {isFullscreen && (
        <button
          onClick={toggleFullscreen}
          className="fixed top-4 right-4 z-50 px-3.5 py-2 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white backdrop-blur-md shadow-xl border border-white/20 transition-all flex items-center gap-2 text-xs font-bold cursor-pointer opacity-40 hover:opacity-100 hover:scale-105 active:scale-95"
          title="Exit Fullscreen (Esc)"
        >
          <Minimize className="w-3.5 h-3.5" />
          <span>Exit Fullscreen</span>
        </button>
      )}

      {/* Main KDS Grid */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto relative z-10">
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center space-y-3 font-sans">
            <div className="w-10 h-10 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-500 text-sm">Synchronizing active cooking tickets...</p>
          </div>
        ) : displayTickets.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center rounded-3xl bg-white/80 dark:bg-[#0f1738]/60 border border-slate-200 dark:border-blue-900/40 text-center space-y-3 font-sans max-w-lg mx-auto shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Kitchen Display is Clear</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
              All guest orders have been cooked and served. New incoming tickets dispatched by front-of-house will chime and appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start">
            {displayTickets.map((ticket) => {
              const tableNum = ticket.table?.tableNumber || 1;
              const shortId = ticket.id.replace(/-/g, '').slice(0, 6);
              const isCooking = ticket.status === 'PREPARING';
              const customInstructions =
                ticket.notes ||
                ticket.items.find((i) => i.notes)?.notes ||
                null;

              return (
                <div
                  key={ticket.id}
                  className="rounded-3xl border border-rose-500/50 shadow-[0_12px_40px_rgba(225,29,72,0.22)] overflow-hidden bg-[#1c1822] text-white flex flex-col justify-between transition-all duration-300 hover:scale-[1.01]"
                >
                  {/* Card Header: Deep Wine/Crimson gradient bar matching screenshot */}
                  <div className="bg-gradient-to-r from-[#5f1320] via-[#881337] to-[#4c0d1a] px-5 py-3.5 flex items-center justify-between border-b border-rose-900/50">
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-black text-white font-sans tracking-tight">
                        T#{tableNum}
                      </span>
                      <span className="text-xs font-mono text-rose-200/80">
                        #{shortId}
                      </span>
                    </div>

                    {/* Red Pill Timer */}
                    <div className="bg-rose-600 text-white font-mono font-bold text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                      <Clock className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>{formatElapsed(ticket.createdAt)}</span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 space-y-4 flex-1">
                    {/* Items List */}
                    <div className="space-y-2">
                      {ticket.items.map((item, idx) => (
                        <div key={idx} className="flex items-start text-sm">
                          <span className="text-amber-500 font-black mr-2">
                            {item.quantity}x
                          </span>
                          <span className="font-bold text-white leading-tight">
                            {item.menuItem?.name || 'Dish'}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Kitchen Instructions Box */}
                    {customInstructions && (
                      <div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">
                          KITCHEN INSTRUCTIONS:
                        </span>
                        <div className="bg-black/40 border border-amber-900/40 rounded-xl px-3.5 py-2.5 text-xs font-medium text-amber-400 italic">
                          “{customInstructions}”
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Action Footer */}
                  <div className="p-4 pt-0">
                    {!isCooking ? (
                      <button
                        disabled={actionPending}
                        onClick={() => handleStartPreparing(ticket.id)}
                        className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-gray-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 active:scale-95 transition cursor-pointer tracking-wider"
                      >
                        <Flame className="w-4 h-4 fill-gray-950" />
                        <span>START COOKING</span>
                      </button>
                    ) : (
                      <button
                        disabled={actionPending}
                        onClick={() => handleMarkReady(ticket.id)}
                        className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-95 transition cursor-pointer tracking-wider"
                      >
                        <CheckCircle className="w-4 h-4 fill-white text-emerald-600" />
                        <span>MARK AS READY</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
