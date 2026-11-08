'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Order, Table, ServiceRequest } from '@/lib/types';
import { useSocket } from '@/hooks/useSocket';
import sound from '@/lib/sound';
import ManagerNav from '@/components/ManagerNav';
import RestaurantLoader from '@/components/ui/RestaurantLoader';
import {
  Zap,
  Clock,
  Check,
  X,
  MessageSquare,
  Info,
  CheckCircle2,
  UtensilsCrossed,
  Bell,
  Sparkles,
  Receipt,
  ChefHat,
  Flame,
  ArrowRight,
  Radio,
} from 'lucide-react';

export interface PaidAlert {
  tableId: string;
  tableNumber: number;
  amount: number;
  referenceNote?: string | null;
  paidAt: string;
  items?: { name: string; quantity: number; price: number }[];
  orderId?: string;
  areaTag?: string;
}

export default function ManagerDashboardPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [paidAlerts, setPaidAlerts] = useState<PaidAlert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'PENDING' | 'PREPARING' | 'READY' | 'REQUESTS'>('PENDING');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const [actionPending, startActionTransition] = useTransition();

  // Socket connection to manager_dashboard room
  const { on, isConnected } = useSocket({ isManager: true, autoConnect: true });

  const loadData = async () => {
    try {
      setLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('smart_menu_staff_token') : null;
      if (!token) {
        router.push('/login');
        return;
      }

      const [ordersData, tablesData, requestsData] = await Promise.all([
        api.orders.getAll(),
        api.tables.getAll(),
        api.service.getAll(),
      ]);

      setOrders(ordersData || []);
      setTables(tablesData || []);
      setRequests(requestsData || []);

      // Derive any active paid pending tables with real transaction amounts & items
      const clearedTableIds = new Set<string>();
      try {
        if (typeof window !== 'undefined') {
          const raw = sessionStorage.getItem('smart_menu_cleared_settlement_tables');
          if (raw) JSON.parse(raw).forEach((id: string) => clearedTableIds.add(id));
        }
      } catch {}

      const currentPaid = (tablesData || [])
        .filter((t: Table) => {
          if (t.status !== 'PAID_PENDING') return false;
          if (clearedTableIds.has(t.id)) return false;

          const latestTx = t.transactions && t.transactions.length > 0 ? t.transactions[0] : null;
          // If transaction was already cleared by staff, do not show in Live Ops!
          if (latestTx?.settledByStaffId) return false;

          // If no transaction record, only show if there are active non-completed orders
          const activeOrders = (ordersData || []).filter(
            (o: Order) => o.tableId === t.id && o.status !== 'COMPLETED' && o.status !== 'REJECTED'
          );
          if (!latestTx && activeOrders.length === 0) return false;

          return true;
        })
        .map((t: Table) => {
          const latestTx = t.transactions && t.transactions.length > 0 ? t.transactions[0] : null;
          let realAmount = 0;
          let realItems: { name: string; quantity: number; price: number }[] = [];
          let paymentNote = 'Direct Mobile USSD (Telebirr / CBE Birr)';
          let orderId = t.id;

          if (latestTx) {
            realAmount = Number(latestTx.amount);
            paymentNote =
              latestTx.referenceNote ||
              (latestTx.paymentMethod === 'TELEBIRR'
                ? 'Telebirr Mobile USSD'
                : latestTx.paymentMethod === 'CBE_BIRR'
                ? 'CBE Birr Mobile USSD'
                : 'Direct Mobile USSD');
            orderId = latestTx.id;

            if (Array.isArray(latestTx.itemSnapshot)) {
              realItems = latestTx.itemSnapshot.map((i: any) => ({
                name: i.name || 'Dish',
                quantity: Number(i.quantity || 1),
                price: Number(i.total || (Number(i.unitPrice || 0) * Number(i.quantity || 1)) || 0),
              }));
            }
          }

          // Fallback if no item snapshot: use ONLY active non-completed orders, NEVER old completed ones!
          if (realItems.length === 0) {
            const activeOrders = (ordersData || []).filter(
              (o: Order) => o.tableId === t.id && o.status !== 'COMPLETED' && o.status !== 'REJECTED'
            );
            realItems = activeOrders.flatMap((o: Order) =>
              (o.items || []).map((i) => ({
                name: i.menuItem?.name || 'Dish',
                quantity: i.quantity,
                price: Number(i.unitPrice) * i.quantity,
              }))
            );
            if (realAmount === 0) {
              realAmount = activeOrders.reduce(
                (sum: number, o: Order) => sum + Number(o.totalAmount || 0),
                0
              );
            }
            orderId = activeOrders[0]?.id || t.id;
          }

          return {
            tableId: t.id,
            tableNumber: t.tableNumber,
            amount: realAmount,
            referenceNote: paymentNote,
            paidAt: latestTx?.createdAt || new Date().toISOString(),
            items: realItems,
            orderId: orderId,
            areaTag: t.area?.name || 'Main Dining',
          };
        });
      setPaidAlerts(currentPaid);
    } catch (err) {
      console.warn('Failed to load manager live ops:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [router]);

  // Real-time socket handlers
  useEffect(() => {
    const handleNewOrder = (newOrder: Order) => {
      try {
        sound.playChime();
      } catch {}
      setOrders((prev) => {
        if (prev.some((o) => o.id === newOrder.id)) {
          return prev.map((o) => (o.id === newOrder.id ? newOrder : o));
        }
        return [newOrder, ...prev];
      });
      setActionNotice(`New incoming order from Table #${newOrder.table?.tableNumber || '?'}`);
      setTimeout(() => setActionNotice(null), 4000);
    };

    const cleanupPlaced = on<Order>('order:placed', handleNewOrder);
    const cleanupNew = on<Order>('order:new', handleNewOrder);

    const handleOrderUpdate = (updated: Order) => {
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    };

    const cleanupAccepted = on<Order>('order:accepted', handleOrderUpdate);
    const cleanupPreparing = on<Order>('order:preparing', handleOrderUpdate);
    const cleanupReady = on<Order>('order:ready', handleOrderUpdate);
    const cleanupServed = on<Order>('order:served', handleOrderUpdate);
    const cleanupCompleted = on<Order>('order:completed', handleOrderUpdate);
    const cleanupRejected = on<Order>('order:rejected', handleOrderUpdate);

    const cleanupServiceReq = on<ServiceRequest>('service:requested', (newReq) => {
      try {
        sound.playServiceAlert();
      } catch {}
      setRequests((prev) => [newReq, ...prev.filter((r) => r.id !== newReq.id)]);
      setActionNotice(`New service request from Table #${newReq.table?.tableNumber || '?'}`);
      setTimeout(() => setActionNotice(null), 4000);
    });

    const cleanupServiceUpdate = on<ServiceRequest>('service:status_updated', (updated) => {
      setRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    });

    const cleanupPaidPending = on<{ table: Table; transaction: any }>('table:paid_pending', ({ table, transaction }) => {
      try {
        sound.playSuccessDing();
      } catch {}

      // Find real items: prioritize transaction itemSnapshot, otherwise active orders only
      let allItems: { name: string; quantity: number; price: number }[] = [];
      if (Array.isArray(transaction?.itemSnapshot) && transaction.itemSnapshot.length > 0) {
        allItems = transaction.itemSnapshot.map((i: any) => ({
          name: i.name || 'Dish',
          quantity: Number(i.quantity || 1),
          price: Number(i.total || (Number(i.unitPrice || 0) * Number(i.quantity || 1)) || 0),
        }));
      } else {
        const tableOrders = orders.filter((o) => o.tableId === table.id && o.status !== 'COMPLETED' && o.status !== 'REJECTED');
        allItems = tableOrders.flatMap((o) =>
          (o.items || []).map((i) => ({
            name: i.menuItem?.name || 'Dish',
            quantity: i.quantity,
            price: Number(i.unitPrice) * i.quantity,
          }))
        );
      }

      const totalAmount =
        Number(transaction?.amount) ||
        orders
          .filter((o) => o.tableId === table.id && o.status !== 'COMPLETED' && o.status !== 'REJECTED')
          .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

      setPaidAlerts((prev) => {
        if (prev.some((a) => a.tableId === table.id)) return prev;
        return [
          {
            tableId: table.id,
            tableNumber: table.tableNumber,
            amount: totalAmount,
            referenceNote: transaction?.referenceNote || 'Direct Mobile USSD Payment',
            paidAt: transaction?.createdAt || new Date().toISOString(),
            items: allItems,
            orderId: transaction?.id || table.id,
            areaTag: table.area?.name || 'Main Dining',
          },
          ...prev,
        ];
      });
      setTables((prev) => prev.map((t) => (t.id === table.id ? { ...t, status: 'PAID_PENDING' } : t)));
    });

    return () => {
      cleanupPlaced();
      cleanupNew();
      cleanupAccepted();
      cleanupPreparing();
      cleanupReady();
      cleanupServed();
      cleanupCompleted();
      cleanupRejected();
      cleanupServiceReq();
      cleanupServiceUpdate();
      cleanupPaidPending();
    };
  }, [on, orders]);

  // One-click handler: Admin confirms table payment, clears active orders to history
  const handleClearPaidSession = (tableId: string, tableNumber: number) => {
    try {
      sound.playSuccessDing();
    } catch {}

    // Record in persistent sessionStorage so cleared tables never reappear upon page refresh
    try {
      if (typeof window !== 'undefined') {
        const raw = sessionStorage.getItem('smart_menu_cleared_settlement_tables');
        const list = raw ? JSON.parse(raw) : [];
        if (!list.includes(tableId)) {
          list.push(tableId);
          sessionStorage.setItem('smart_menu_cleared_settlement_tables', JSON.stringify(list));
        }
      }
    } catch {}

    // Immediately remove paid alert card from Live Ops
    setPaidAlerts((prev) => prev.filter((a) => a.tableId !== tableId));
    // Remove active orders for this table from the active queue
    setOrders((prev) => prev.filter((o) => o.tableId !== tableId));

    setActionNotice(`Table #${tableNumber} session cleared and saved to history. Table remains marked as PAID.`);
    setTimeout(() => setActionNotice(null), 4000);

    startActionTransition(async () => {
      try {
        await api.tables.approveSettlement(tableId);
      } catch (err: any) {
        console.error('Failed to clear table session:', err);
      }
    });
  };

  // Order Actions
  const handleAcceptOrder = (orderId: string, shortId: string) => {
    try {
      sound.playSuccessDing();
    } catch {}
    setActionNotice(`Order #${shortId} accepted and dispatched to Kitchen KDS.`);
    setTimeout(() => setActionNotice(null), 4000);

    startActionTransition(async () => {
      try {
        const updated = await api.orders.accept(orderId);
        setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      } catch (err: any) {
        alert(err.message || 'Failed to accept order');
      }
    });
  };

  const handleRejectOrder = (orderId: string, shortId: string) => {
    if (!confirm(`Are you sure you want to reject Order #${shortId}?`)) return;

    setActionNotice(`Order #${shortId} was rejected.`);
    setTimeout(() => setActionNotice(null), 3000);

    startActionTransition(async () => {
      try {
        const updated = await api.orders.reject(orderId);
        setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      } catch (err: any) {
        alert(err.message || 'Failed to reject order');
      }
    });
  };

  const handleResolveRequest = (requestId: string, tableNumber?: number) => {
    try {
      sound.playSuccessDing();
    } catch {}
    setActionNotice(`Service request for Table #${tableNumber || 1} marked attended & resolved.`);
    setTimeout(() => setActionNotice(null), 3500);

    startActionTransition(async () => {
      try {
        await api.service.updateStatus(requestId, 'RESOLVED');
        setRequests((prev) => prev.filter((r) => r.id !== requestId));
      } catch (err: any) {
        alert(err.message || 'Failed to resolve request');
      }
    });
  };

  // Helper for realistic relative timestamps
  const getRelativeTimeDisplay = (createdAt: string) => {
    const diffMs = Math.max(0, Date.now() - new Date(createdAt).getTime());
    const diffSecs = Math.floor(diffMs / 1000);
    if (diffSecs < 45) return 'Just now';
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours}h ${diffMins % 60}m ago`;
  };

  // Real Customer Orders by status
  const pendingOrders = orders.filter((o) => o.status === 'PENDING');
  const preparingOrders = orders.filter((o) => o.status === 'ACCEPTED' || o.status === 'PREPARING');
  const readyOrders = orders.filter((o) => o.status === 'READY' || o.status === 'SERVED');
  const pendingRequests = requests.filter((r) => r.status === 'PENDING');

  const displayedOrders =
    activeTab === 'PENDING'
      ? pendingOrders
      : activeTab === 'PREPARING'
      ? preparingOrders
      : activeTab === 'READY'
      ? readyOrders
      : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#eff6ff] to-[#e0f2fe] dark:bg-[#080c1d] dark:from-[#080c1d] dark:to-[#080c1d] text-slate-900 dark:text-gray-100 flex flex-col relative overflow-hidden font-sans transition-colors duration-200">
      {/* Ambient Fluid Glow Waves */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-blue-400/10 dark:bg-blue-600/15 blur-[120px] pointer-events-none" />
      <div className="absolute top-1/4 -right-32 w-96 h-96 rounded-full bg-indigo-400/10 dark:bg-purple-600/10 blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-32 left-1/3 w-[500px] h-[300px] rounded-full bg-sky-400/10 dark:bg-cyan-600/10 blur-[130px] pointer-events-none" />

      {/* Shared Navigation Bar */}
      <ManagerNav onRefresh={loadData} title="Manager Station" />

      <main className="flex-1 max-w-[1440px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6 relative z-10">
        {/* --- PAGE HEADER --- */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white shadow-md border border-slate-100 dark:bg-[#131b38] dark:border-blue-900/40 flex items-center justify-center text-amber-500 shrink-0 shadow-[0_4px_20px_rgba(245,158,11,0.12)]">
              <Zap className="w-7 h-7 text-amber-500 fill-amber-500 stroke-[1.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-[#0f172a] dark:text-white tracking-tight leading-tight">
                  Manager Station
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Ops Feed
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Real-time dining room orders & service calls from customer tables
              </p>
            </div>
          </div>

          {/* Quick Filter Tabs */}
          <div className="flex items-center flex-wrap gap-2">
            {/* 1. Pending Approval */}
            <button
              type="button"
              onClick={() => setActiveTab('PENDING')}
              className={`px-4 py-2 rounded-full flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'PENDING'
                  ? 'bg-white dark:bg-[#0f1738] border border-slate-200/90 dark:border-blue-700/80 shadow-sm ring-1 ring-amber-500/20'
                  : 'bg-white/80 dark:bg-[#0f1738]/60 border border-slate-100 dark:border-blue-900/40 shadow-xs hover:bg-white dark:hover:bg-[#0f1738]'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0 shadow-xs" />
              <span className="text-xs font-bold text-[#0f172a] dark:text-white">
                Incoming Feed
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#fef3c7] text-[#92400e] dark:bg-amber-950/60 dark:text-amber-300">
                {pendingOrders.length}
              </span>
            </button>

            {/* 2. In Kitchen */}
            <button
              type="button"
              onClick={() => setActiveTab('PREPARING')}
              className={`px-4 py-2 rounded-full flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'PREPARING'
                  ? 'bg-white dark:bg-[#0f1738] border border-slate-200/90 dark:border-blue-700/80 shadow-sm ring-1 ring-blue-500/20'
                  : 'bg-white/80 dark:bg-[#0f1738]/60 border border-slate-100 dark:border-blue-900/40 shadow-xs hover:bg-white dark:hover:bg-[#0f1738]'
              }`}
            >
              <ChefHat className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
              <span className="text-xs font-bold text-[#0f172a] dark:text-white">
                In Kitchen
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                {preparingOrders.length}
              </span>
            </button>

            {/* 3. Service Requests */}
            <button
              type="button"
              onClick={() => setActiveTab('REQUESTS')}
              className={`px-4 py-2 rounded-full flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'REQUESTS'
                  ? 'bg-white dark:bg-[#0f1738] border border-slate-200/90 dark:border-blue-700/80 shadow-sm ring-1 ring-emerald-500/20'
                  : 'bg-white/80 dark:bg-[#0f1738]/60 border border-slate-100 dark:border-blue-900/40 shadow-xs hover:bg-white dark:hover:bg-[#0f1738]'
              }`}
            >
              <Bell className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="text-xs font-bold text-[#0f172a] dark:text-white">
                Service Calls
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#d1fae5] text-[#065f46] dark:bg-emerald-950/60 dark:text-emerald-300">
                {pendingRequests.length}
              </span>
            </button>
          </div>
        </div>

        {/* --- PAID TABLE SETTLEMENT CARDS (AUTHENTIC POS CARDS) --- */}
        {paidAlerts.length > 0 && (
          <div className="space-y-3.5 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                  Settled Tables &bull; Ready to Clear ({paidAlerts.length})
                </h3>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Customer payment confirmed &bull; Click OK to conclude session
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paidAlerts.map((alert) => {
                const shortTableCode = `T${alert.tableNumber}`;
                const shortId = alert.orderId ? alert.orderId.replace(/-/g, '').slice(0, 8) : 'SETTLED';

                return (
                  <div
                    key={alert.tableId}
                    className="bg-white dark:bg-[#071915] rounded-3xl p-6 border-2 border-emerald-400 dark:border-emerald-500/70 shadow-[0_10px_35px_rgba(16,185,129,0.12)] dark:shadow-[0_0_30px_rgba(16,185,129,0.15)] flex flex-col justify-between transition-all duration-300 hover:shadow-xl relative overflow-hidden"
                  >
                    {/* Emerald Top Accent Stripe */}
                    <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500" />

                    {/* CARD HEADER */}
                    <div>
                      <div className="flex items-start justify-between gap-3 pt-1">
                        {/* Table Short Badge */}
                        <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-base shrink-0 shadow-md shadow-emerald-600/30">
                          {shortTableCode}
                        </div>

                        {/* Table Info & Monospace Ref */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-slate-900 dark:text-white text-base leading-tight flex items-center gap-1.5">
                            <span>Table #{alert.tableNumber}</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                              {alert.areaTag || 'Main Dining'}
                            </span>
                          </h3>
                          <div className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                            ID: {shortId}
                          </div>
                        </div>

                        {/* Status Pill Badge & Time */}
                        <div className="text-right shrink-0">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/50 shadow-2xs">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                            <span>PAID</span>
                          </span>
                          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold text-right mt-1">
                            Just now
                          </div>
                        </div>
                      </div>

                      {/* PAYMENT METHOD BADGE */}
                      <div className="mt-4 px-3.5 py-2 rounded-xl bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/40 flex items-center justify-between text-xs">
                        <span className="text-slate-600 dark:text-emerald-200/80 font-medium">Payment Channel</span>
                        <span className="font-extrabold text-emerald-700 dark:text-emerald-300 truncate pl-2">
                          {alert.referenceNote || 'Direct Mobile USSD'}
                        </span>
                      </div>

                      {/* ITEMS SETTLED LIST */}
                      <div className="my-4 space-y-2">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Settled Order Items:
                        </div>
                        {alert.items && alert.items.length > 0 ? (
                          alert.items.slice(0, 4).map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2 truncate pr-2">
                                <span className="font-bold text-emerald-600 shrink-0">{item.quantity}x</span>
                                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                                  {item.name}
                                </span>
                              </div>
                              <span className="font-black text-slate-900 dark:text-white shrink-0">
                                {item.price ? `${item.price.toLocaleString()} ETB` : ''}
                              </span>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-slate-500 italic">
                            All session dining orders settled via customer mobile prompt.
                          </p>
                        )}
                        {alert.items && alert.items.length > 4 && (
                          <p className="text-[11px] text-slate-400 font-medium">
                            +{alert.items.length - 4} more items...
                          </p>
                        )}
                      </div>
                    </div>

                    {/* CARD FOOTER */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800/60 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          TOTAL PAID
                        </span>
                        <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                          {alert.amount > 0 ? `${alert.amount.toLocaleString()} ETB` : 'Paid in Full'}
                        </span>
                      </div>

                      {/* ACTION BUTTON */}
                      <button
                        type="button"
                        onClick={() => handleClearPaidSession(alert.tableId, alert.tableNumber)}
                        className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 active:scale-95 transition cursor-pointer"
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>OK &bull; Clear Session</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Notice Alert */}
        {actionNotice && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center justify-between animate-in fade-in duration-150">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              {actionNotice}
            </span>
            <button onClick={() => setActionNotice(null)} className="text-emerald-600 hover:text-emerald-900 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* --- SECTION HEADER --- */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-extrabold text-[#0f172a] dark:text-white tracking-tight">
              {activeTab === 'PENDING'
                ? 'Active Order Queue'
                : activeTab === 'PREPARING'
                ? 'Cooking in Kitchen'
                : activeTab === 'READY'
                ? 'Ready for Table Delivery'
                : 'Customer Service Requests'}
            </h2>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#e0edff] dark:bg-blue-950/60 border border-blue-200/70 dark:border-blue-800/50 text-[#1d4ed8] dark:text-blue-300 text-xs sm:text-sm font-bold shadow-2xs">
              <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>
                {activeTab === 'REQUESTS'
                  ? `${pendingRequests.length} Requests Awaiting Action`
                  : `${displayedOrders.length} Orders Awaiting Action`}
              </span>
            </div>
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 font-medium">
            <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
            <span>Connected: {isConnected ? 'Live Socket Active' : 'Connecting...'}</span>
          </div>
        </div>

        {/* --- ORDER CARDS VIEW --- */}
        {loading ? (
          <RestaurantLoader
            message="Connecting to Live Ops Feed..."
            subMessage="Real-time dining room orders, service calls, and kitchen pipeline"
          />
        ) : activeTab !== 'REQUESTS' ? (
          <>
            {displayedOrders.length === 0 ? (
              <div className="py-20 text-center rounded-3xl bg-white/80 dark:bg-[#0f1738]/60 border border-slate-200 dark:border-blue-900/40 space-y-4 shadow-sm">
                <div className="w-14 h-14 mx-auto rounded-3xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/40 shadow-xs">
                  {activeTab === 'PENDING' ? (
                    <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                  ) : (
                    <ChefHat className="w-7 h-7 text-blue-500" />
                  )}
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    {activeTab === 'PENDING'
                      ? 'No Pending Orders Awaiting Action'
                      : 'No Orders in this Status'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                    {activeTab === 'PENDING'
                      ? 'When a diner scans a table QR code and submits an order, it will chime and appear here instantly in real-time.'
                      : 'Orders dispatched to the kitchen will be visible here until completed.'}
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => router.push('/manager/tables')}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition cursor-pointer"
                  >
                    View Tables Matrix
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push('/kitchen')}
                    className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white transition cursor-pointer"
                  >
                    Open Kitchen KDS
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedOrders.map((order) => {
                  const tableNumber = order.table?.tableNumber || 1;
                  const shortTableCode = `T${tableNumber}`;
                  const shortId = order.id.replace(/-/g, '').slice(0, 8);
                  const areaTag = order.table?.area?.name || 'Main Dining';
                  const relativeTime = getRelativeTimeDisplay(order.createdAt);
                  const totalETB = Number(order.totalAmount).toLocaleString();

                  // Customer Dietary / Kitchen Note
                  const customNote =
                    order.notes || order.items.find((i) => i.notes)?.notes;

                  return (
                    <div
                      key={order.id}
                      className="bg-white dark:bg-[#0f1738]/90 rounded-3xl p-6 border border-blue-100/80 dark:border-blue-900/50 shadow-[0_10px_35px_rgba(30,58,138,0.06)] dark:shadow-2xl flex flex-col justify-between transition-all duration-300 hover:shadow-lg"
                    >
                      {/* CARD HEADER */}
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          {/* Table Short Badge */}
                          <div className="w-12 h-12 rounded-2xl bg-blue-50/80 border border-blue-100 dark:bg-blue-950/60 dark:border-blue-800/40 flex items-center justify-center font-black text-blue-950 dark:text-blue-300 text-base shrink-0 shadow-2xs">
                            {shortTableCode}
                          </div>

                          {/* Table Info & Monospace ID */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base leading-tight flex items-center gap-1.5">
                              <span>Table #{tableNumber}</span>
                              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                                {areaTag}
                              </span>
                            </h3>
                            <div className="text-xs font-mono text-blue-500 dark:text-blue-400 font-medium mt-0.5">
                              ID: {shortId}
                            </div>
                          </div>

                          {/* Status Pill Badge & Time */}
                          <div className="text-right shrink-0">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                                order.status === 'PENDING'
                                  ? 'bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 border-amber-500/30'
                                  : order.status === 'ACCEPTED' || order.status === 'PREPARING'
                                  ? 'bg-blue-500/15 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 border-blue-500/30'
                                  : 'bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border-emerald-500/30'
                              }`}
                            >
                              <Clock className="w-3.5 h-3.5" />
                              <span>{order.status}</span>
                            </span>
                            <div className="text-[11px] text-amber-600/80 dark:text-amber-400 font-semibold text-right mt-1">
                              {relativeTime}
                            </div>
                          </div>
                        </div>

                        {/* ORDER ITEMS LIST */}
                        <div className="my-5 space-y-2.5">
                          {order.items.map((item, itemIdx) => (
                            <div key={itemIdx} className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
                                <span className="font-bold text-amber-500 w-6 shrink-0">
                                  {item.quantity}x
                                </span>
                                <span className="font-bold text-slate-800 dark:text-white truncate">
                                  {item.menuItem?.name || 'Dish'}
                                </span>
                              </div>
                              <span className="font-black text-slate-900 dark:text-white whitespace-nowrap">
                                {(Number(item.unitPrice) * item.quantity).toLocaleString()} ETB
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* SPECIAL INSTRUCTIONS / KITCHEN NOTES */}
                        {customNote ? (
                          <div className="bg-amber-50/90 border border-amber-200/80 dark:bg-amber-950/30 dark:border-amber-800/40 rounded-xl px-3.5 py-2.5 text-amber-900 dark:text-amber-300 text-xs italic flex items-center gap-2 mb-6 shadow-2xs">
                            <MessageSquare className="w-4 h-4 text-amber-500 shrink-0" />
                            <span className="truncate">“{customNote}”</span>
                          </div>
                        ) : (
                          <div className="bg-slate-50/80 border border-slate-200/60 dark:bg-slate-900/30 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-500 dark:text-slate-400 text-xs flex items-center gap-2 mb-6">
                            <Info className="w-4 h-4 text-slate-400 shrink-0" />
                            <span>Standard kitchen prep (no special modifiers)</span>
                          </div>
                        )}
                      </div>

                      {/* CARD FOOTER */}
                      <div>
                        {/* TOTAL AMOUNT */}
                        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/60 mb-4">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            TOTAL AMOUNT
                          </span>
                          <span className="text-xl font-black text-slate-900 dark:text-white">
                            {totalETB} ETB
                          </span>
                        </div>

                        {/* ACTION BUTTONS */}
                        {order.status === 'PENDING' ? (
                          <div className="grid grid-cols-2 gap-3">
                            {/* Primary CTA: Accept & Send */}
                            <button
                              disabled={actionPending}
                              onClick={() => handleAcceptOrder(order.id, shortId)}
                              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl py-3 shadow-md shadow-blue-500/25 flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer text-sm"
                            >
                              <Check className="w-4 h-4 stroke-[3]" />
                              <span>Accept &amp; Send</span>
                            </button>

                            {/* Secondary CTA: Reject */}
                            <button
                              disabled={actionPending}
                              onClick={() => handleRejectOrder(order.id, shortId)}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 font-bold rounded-xl py-3 flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer text-sm"
                            >
                              <X className="w-4 h-4 stroke-[3]" />
                              <span>Reject</span>
                            </button>
                          </div>
                        ) : (
                          <div className="w-full py-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/30 text-center text-xs font-bold text-blue-700 dark:text-blue-300">
                            Dispatched to Kitchen &bull; Currently Cooking
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : null}

        {/* --- SERVICE REQUESTS VIEW --- */}
        {!loading && activeTab === 'REQUESTS' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingRequests.length === 0 ? (
              <div className="col-span-full py-24 text-center rounded-3xl bg-white/80 dark:bg-[#0f1738]/60 border border-slate-200 dark:border-blue-900/40 space-y-3">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">All Tables Attended</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  There are currently no active customer service requests. When a diner calls a waiter or requests a bill, it will chime and appear here instantly.
                </p>
              </div>
            ) : (
              pendingRequests.map((req) => {
                const tableNumber = req.table?.tableNumber || 1;
                const isBill = req.type === 'REQUEST_BILL';
                return (
                  <div
                    key={req.id}
                    className="bg-white dark:bg-[#0f1738]/90 rounded-3xl p-6 border border-blue-100/80 dark:border-blue-900/50 shadow-[0_10px_35px_rgba(30,58,138,0.06)] dark:shadow-2xl flex flex-col justify-between transition-all duration-300 hover:shadow-lg"
                  >
                    <div>
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50/80 border border-blue-100 dark:bg-blue-950/60 dark:border-blue-800/40 flex items-center justify-center font-black text-blue-950 dark:text-blue-300 text-base shrink-0 shadow-2xs">
                          T{tableNumber}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-slate-900 dark:text-white text-base leading-tight">
                            Table #{tableNumber}
                          </h3>
                          <div className="text-xs font-mono text-blue-500 dark:text-blue-400 font-medium mt-0.5">
                            ID: {req.id.slice(0, 8)}
                          </div>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                            isBill
                              ? 'bg-blue-500/15 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 border border-blue-500/30'
                              : 'bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {isBill ? <Receipt className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
                          <span>{isBill ? 'BILL REQUEST' : 'CALL WAITER'}</span>
                        </span>
                      </div>

                      {/* Detail Box */}
                      <div className="my-5 p-3.5 rounded-2xl bg-slate-50 dark:bg-blue-950/40 border border-slate-100 dark:border-blue-900/30 text-xs text-slate-600 dark:text-slate-300">
                        {isBill ? (
                          <p className="font-medium">
                            Guest at Table #{tableNumber} requested the bill. Review bill or settle at table.
                          </p>
                        ) : (
                          <p className="font-medium">
                            Guest at Table #{tableNumber} pressed Call Waiter on their digital menu for service.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-4 border-t border-slate-100 dark:border-blue-900/40 flex items-center gap-2">
                      <button
                        disabled={actionPending}
                        onClick={() => handleResolveRequest(req.id, tableNumber)}
                        className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 active:scale-95 transition cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>Mark Attended &amp; Resolved</span>
                      </button>
                      <button
                        onClick={() => router.push('/manager/tables')}
                        className="py-3 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition cursor-pointer"
                        title="View Table Matrix"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </main>
    </div>
  );
}
