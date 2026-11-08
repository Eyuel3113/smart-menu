'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { Order, OrderStatus, Table } from '@/lib/types';
import { useSocket } from '@/hooks/useSocket';
import sound from '@/lib/sound';
import RestaurantLoader from '@/components/ui/RestaurantLoader';
import {
  Clock,
  ChefHat,
  CheckCircle,
  ArrowLeft,
  ShoppingBag,
  Sparkles,
  Flame,
  Receipt,
  UtensilsCrossed,
  Utensils,
  CheckCircle2,
  Smartphone,
  CreditCard,
  Banknote,
  X,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import PaymentModal, { PaymentProvider } from '@/components/customer/PaymentModal';

function CelebrationFlagIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M4 22V3" />
      <path
        d="M4 4c4-2 8 2 12 0 2-1 3.5-1 4.5 0v9c-1-1-2.5-1-4.5 0-4 2-8-2-12 0"
        fill="currentColor"
        fillOpacity="0.2"
      />
    </svg>
  );
}

function ClocheIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 4v2" />
      <path d="M4 18h16" />
      <path d="M4 18a8 8 0 0 1 16 0" />
      <circle cx="12" cy="4" r="1.5" fill="currentColor" />
      <path d="M9 21h6" />
    </svg>
  );
}

type PaymentMethod = 'telebirr' | 'cbe' | 'cash_card';

export default function OrderTrackPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const tableId = params.tableId as string;
  const orderId = searchParams.get('orderId');

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [billRequested, setBillRequested] = useState<boolean>(false);
  const [requestingBill, setRequestingBill] = useState<boolean>(false);
  const [sessionCompleted, setSessionCompleted] = useState<boolean>(false);
  const [paymentSubmitted, setPaymentSubmitted] = useState<boolean>(false);
  const [isItemsExpanded, setIsItemsExpanded] = useState<boolean>(true);

  // Digital Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [selectedMethodName, setSelectedMethodName] = useState<string>('Telebirr');

  // Navigation back to menu preserving table tokens
  const handleOrderMore = () => {
    let activeToken = searchParams.get('token') || '';
    try {
      if (!activeToken && typeof window !== 'undefined') {
        activeToken =
          sessionStorage.getItem(`smart_menu_table_token_${tableId}`) ||
          sessionStorage.getItem('smart_menu_last_table_token') ||
          sessionStorage.getItem('smart_menu_customer_token') ||
          '';
      }
    } catch {}

    const query = activeToken ? `?token=${encodeURIComponent(activeToken)}` : '';
    router.push(`/table/${tableId}${query}`);
  };

  // Connect to the table's socket room
  const { on, isConnected } = useSocket({ tableId });

  // 1. Initial Fetch of Active Orders
  useEffect(() => {
    let isMounted = true;

    async function loadTableOrders() {
      try {
        setLoading(true);
        const data = await api.orders.getTableOrders(tableId);
        if (!isMounted) return;

        setOrders(data);

        // Check if all fetched orders are completed
        if (data.length > 0 && data.every((o) => o.status === 'COMPLETED')) {
          setSessionCompleted(true);
        }
      } catch (err) {
        console.error('Failed to load table orders:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadTableOrders();

    return () => {
      isMounted = false;
    };
  }, [tableId]);

  // 2. Real-Time Socket Event Listeners for Order Lifecycle
  useEffect(() => {
    const handleOrderUpdate = (updatedOrder: Order) => {
      if (updatedOrder.tableId !== tableId) return;

      sound.playSuccessDing();

      setOrders((prev) => {
        const index = prev.findIndex((o) => o.id === updatedOrder.id);
        let next: Order[];
        if (index >= 0) {
          next = [...prev];
          next[index] = updatedOrder;
        } else {
          next = [...prev, updatedOrder];
        }

        if (next.length > 0 && next.every((o) => o.status === 'COMPLETED')) {
          setSessionCompleted(true);
        }

        return next;
      });

      if (updatedOrder.status === 'COMPLETED') {
        setSessionCompleted(true);
      }
    };

    const cleanupPlaced = on<Order>('order:placed', handleOrderUpdate);
    const cleanupAccepted = on<Order>('order:accepted', handleOrderUpdate);
    const cleanupSent = on<Order>('order:sent_to_kitchen', handleOrderUpdate);
    const cleanupPreparing = on<Order>('order:preparing', handleOrderUpdate);
    const cleanupReady = on<Order>('order:ready', handleOrderUpdate);
    const cleanupServed = on<Order>('order:served', (servedOrder) => {
      handleOrderUpdate(servedOrder);
    });
    const cleanupCompleted = on<Order>('order:completed', (completedOrder) => {
      handleOrderUpdate(completedOrder);
      setSessionCompleted(true);
    });
    const cleanupRejected = on<Order>('order:rejected', handleOrderUpdate);

    const cleanupTable = on<Table>('table:status_updated', (updatedTable) => {
      if (
        updatedTable.id === tableId &&
        (updatedTable.status === 'AVAILABLE' || updatedTable.status === 'CLEANING')
      ) {
        setSessionCompleted(true);
      }
    });

    const cleanupConcluded = on<{ tableId: string }>('table:session_concluded', (data) => {
      if (data.tableId === tableId) {
        setSessionCompleted(true);
        try {
          sessionStorage.removeItem('smart_menu_cart_items');
          localStorage.removeItem('smart_menu_cart_items');
          sessionStorage.removeItem(`smart_menu_active_order_${tableId}`);
          localStorage.removeItem(`smart_menu_active_order_${tableId}`);
        } catch {}
        setTimeout(() => {
          const tkn = searchParams.get('token') || '';
          router.push(`/table/${tableId}${tkn ? `?token=${encodeURIComponent(tkn)}` : ''}`);
        }, 1500);
      }
    });

    return () => {
      cleanupPlaced();
      cleanupAccepted();
      cleanupSent();
      cleanupPreparing();
      cleanupReady();
      cleanupServed();
      cleanupCompleted();
      cleanupRejected();
      cleanupTable();
      cleanupConcluded();
    };
  }, [on, tableId]);

  // Handle Confirm Payment / Settle via Direct Mobile USSD Push
  const handlePaymentSubmit = async (data: {
    provider: PaymentProvider;
    phoneNumber: string;
    grandTotal: number;
  }) => {
    try {
      setRequestingBill(true);
      const method = data.provider === 'telebirr' ? 'TELEBIRR' : 'CBE_BIRR';
      const providerLabel =
        data.provider === 'telebirr'
          ? 'Telebirr'
          : data.provider === 'cbe'
          ? 'CBE Birr'
          : 'Awash Birr';

      setSelectedMethodName(providerLabel);

      const res = await api.tables.pay(tableId, {
        paymentMethod: method,
        referenceNote: `[${providerLabel} USSD Push] Phone: +251 ${data.phoneNumber}`,
      });

      const settledAmount = Number(res?.transaction?.amount || data.grandTotal);
      const settledItems = Array.isArray(res?.transaction?.itemSnapshot) && res.transaction.itemSnapshot.length > 0
        ? res.transaction.itemSnapshot
        : activeOrders.flatMap((o) =>
            (o.items || []).map((i) => ({
              name: i.menuItem?.name || 'Dish',
              quantity: i.quantity,
              unitPrice: Number(i.unitPrice),
            }))
          );

      try {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(`smart_menu_paid_amount_${tableId}`, settledAmount.toString());
          sessionStorage.setItem(`smart_menu_paid_items_${tableId}`, JSON.stringify(settledItems));
        }
      } catch {}

      setPaymentSubmitted(true);
      setBillRequested(true);
    } catch (err) {
      console.error('Failed to submit payment:', err);
      throw err;
    } finally {
      setRequestingBill(false);
    }
  };

  // Derive active vs completed orders
  const activeOrders = orders.filter(
    (o) => o.status !== 'COMPLETED' && o.status !== 'REJECTED'
  );
  const completedOrders = orders.filter((o) => o.status === 'COMPLETED');
  const isAllCompleted =
    sessionCompleted || (orders.length > 0 && activeOrders.length === 0 && completedOrders.length > 0);

  // 10-second real-time timer tick for reactive relative times ("Just now", "2 min ago")
  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(timer);
  }, []);

  // Format real clock time accurately using local system time (no hardcoded fallbacks)
  const formatClockTime = (dateStr?: string | Date) => {
    if (!dateStr) {
      return new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
    }
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) {
        return new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
      }
      return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
    } catch {
      return new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
    }
  };

  // Real-time relative duration calculation ("Just now", "3 min ago")
  const getElapsedString = (dateStr?: string | Date) => {
    if (!dateStr) return 'Just now';
    try {
      const diffMs = Math.max(0, now - new Date(dateStr).getTime());
      const diffSecs = Math.floor(diffMs / 1000);
      if (diffSecs < 45) return 'Just now';
      const mins = Math.floor(diffSecs / 60);
      if (mins < 60) return `${mins} min ago`;
      const hrs = Math.floor(mins / 60);
      return `${hrs}h ago`;
    } catch {
      return 'Just now';
    }
  };

  // Chronologically sort all session orders into rounds (Round 1 = first order placed)
  const sessionOrders = [...orders]
    .filter((o) => o.status !== 'REJECTED')
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  // Map into rounds with 3 stages (0: Placed, 1: Kitchen, 2: Food Ready)
  const allRounds = sessionOrders.map((order, idx) => {
    const step =
      order.status === 'READY' || order.status === 'SERVED' || order.status === 'COMPLETED'
        ? 2
        : ['ACCEPTED', 'PREPARING'].includes(order.status)
        ? 1
        : 0;

    return {
      roundNumber: idx + 1,
      order,
      step,
      isLatest: idx === sessionOrders.length - 1,
    };
  });

  // User requirement: "make slider to the all round timeline but same ui like now and make the newest round first..."
  const displayRounds = [...allRounds].reverse();
  const [selectedRoundIdx, setSelectedRoundIdx] = useState<number>(0);

  // Active round safely bound to selection (defaults to index 0: newest round)
  const activeRound = displayRounds[selectedRoundIdx] || displayRounds[0] || {
    roundNumber: 1,
    order: orders[0],
    step: 0,
    isLatest: true,
  };

  // Overall session step (3 stages: 0=Placed, 1=Kitchen, 2=Ready)
  const getOverallStepIndex = (): number => {
    if (activeOrders.length === 0) return 0;
    if (activeOrders.some((o) => o.status === 'READY' || o.status === 'SERVED')) {
      return 2; // Step 3: Food Ready
    }
    if (activeOrders.some((o) => ['ACCEPTED', 'PREPARING'].includes(o.status))) {
      return 1; // Step 2: In Kitchen
    }
    return 0; // Step 1: Order Placed
  };

  const currentStep = getOverallStepIndex();
  const grandTotal = activeOrders.reduce(
    (sum, o) => sum + Number(o.totalAmount || 0),
    0
  );
  const tableNumber =
    orders[0]?.table?.tableNumber || searchParams.get('tableNumber') || '1';

  const earliestOrder = sessionOrders[0];
  const startTime = earliestOrder ? formatClockTime(earliestOrder.createdAt) : formatClockTime(new Date());
  const latestOrder = sessionOrders[sessionOrders.length - 1] || earliestOrder;
  const timeElapsed = latestOrder
    ? getElapsedString(latestOrder.updatedAt || latestOrder.createdAt)
    : 'Just now';

  const isPrePaid =
    searchParams.get('paid') === 'true' ||
    orders.some((o: any) => o.notes?.includes('Pre-Paid'));

  if (loading) {
    return (
      <RestaurantLoader
        variant="fullscreen"
        message="Connecting to live table session..."
        subMessage="Fetching kitchen rounds, course updates, and dining progress"
      />
    );
  }

  // --- 1. THANK YOU / PAID SCREEN (When Completed) ---
  if (isAllCompleted) {
    let totalPaid = 0;
    let allCompletedItems: any[] = [];

    // Prioritize exact settlement amount and items from sessionStorage / query param
    let storedAmount = 0;
    let storedItems: any[] = [];
    try {
      if (typeof window !== 'undefined') {
        const amt = sessionStorage.getItem(`smart_menu_paid_amount_${tableId}`);
        if (amt && Number(amt) > 0) storedAmount = Number(amt);
        const itms = sessionStorage.getItem(`smart_menu_paid_items_${tableId}`);
        if (itms) storedItems = JSON.parse(itms);
      }
    } catch {}

    const queryAmt = Number(searchParams.get('amount') || 0);

    if (storedAmount > 0) {
      totalPaid = storedAmount;
      allCompletedItems = storedItems.map((i: any) => ({
        id: i.id || i.name,
        quantity: i.quantity || 1,
        unitPrice: i.unitPrice || i.price || (i.total && i.quantity ? i.total / i.quantity : 0),
        menuItem: { name: i.name || i.menuItem?.name || 'Dish' },
      }));
    } else if (queryAmt > 0) {
      totalPaid = queryAmt;
      allCompletedItems = orders.flatMap((o) => o.items || []);
    } else {
      // Fallback: only include orders belonging to the current session (within last 3 hours)
      const nowMs = Date.now();
      const sessionRecentOrders = orders.filter((o) => {
        const orderTime = new Date(o.createdAt).getTime();
        return nowMs - orderTime < 3 * 60 * 60 * 1000;
      });
      const targetOrders = sessionRecentOrders.length > 0 ? sessionRecentOrders : orders;
      totalPaid = targetOrders.reduce(
        (sum, o) => sum + Number(o.totalAmount || 0),
        0
      );
      allCompletedItems = targetOrders.flatMap((o) => o.items || []);
    }

    return (
      <div className="min-h-screen bg-gradient-to-b from-[#f0f4f9] via-[#edf2f8] to-[#e4ebf5] text-slate-900 flex flex-col justify-between p-4 sm:p-6 font-sans">
        <div className="max-w-md mx-auto w-full pt-6 space-y-6 text-center">
          {/* Glowing Animated Success Badge */}
          <div className="relative inline-flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/10">
              <CheckCircle2 className="w-10 h-10" />
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-black uppercase tracking-wider inline-block">
              Bill Settled &bull; Paid
            </span>
            <h1 className="text-2xl font-black text-[#0a1128] tracking-tight">
              Thank You for Dining With Us!
            </h1>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Your payment has been received and Table #{tableNumber} is settled. We look forward to hosting you again!
            </p>
          </div>

          {/* Receipt Summary Card */}
          <div className="rounded-3xl bg-white p-5 text-left shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dining Session</span>
                <h3 className="text-sm font-extrabold text-[#0a1128]">Table #{tableNumber}</h3>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">
                {orders.length} {orders.length === 1 ? 'Round' : 'Rounds'}
              </span>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-2 divide-y divide-slate-100 pr-1">
              {allCompletedItems.map((item, idx) => (
                <div key={item.id || idx} className="pt-2 flex justify-between items-center text-xs">
                  <span className="text-slate-700 font-medium">
                    {item.quantity}x {item.menuItem?.name || 'Dish'}
                  </span>
                  <span className="text-slate-900 font-bold">
                    {(Number(item.unitPrice) * item.quantity).toLocaleString()} ETB
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
              <div>
                <span className="text-xs font-semibold text-slate-500 block">Total Amount Paid</span>
                <span className="text-[11px] text-emerald-600 font-bold">Receipt confirmed by staff</span>
              </div>
              <span className="text-xl font-black text-blue-600">
                {totalPaid.toLocaleString()} ETB
              </span>
            </div>
          </div>
        </div>

        <div className="max-w-md mx-auto w-full pt-4 pb-2">
          <button
            onClick={handleOrderMore}
            className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:opacity-75 transition cursor-pointer"
          >
            <UtensilsCrossed className="w-4 h-4" />
            <span>Start New Session &bull; Browse Menu</span>
          </button>
        </div>
      </div>
    );
  }

  // --- 2. NO ACTIVE ORDERS SCREEN ---
  if (activeOrders.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#f0f4f9] via-[#edf2f8] to-[#e4ebf5] text-slate-900 flex flex-col items-center justify-center p-6 text-center space-y-5 font-sans">
        <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-sm">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-[#0a1128]">No Active Orders Found</h2>
          <p className="text-slate-500 text-xs max-w-xs mt-1">
            You haven&apos;t placed any orders for Table #{tableNumber} yet or your previous round was completed.
          </p>
        </div>
        <button
          onClick={handleOrderMore}
          className="px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/25 transition cursor-pointer"
        >
          Browse Menu & Order
        </button>
      </div>
    );
  }

  // Main status header copy derived from current step (3 stages)
  const stageHeaders = [
    {
      title: 'Order Placed!',
      desc: 'Sent to manager for approval and preparation.',
      icon: Clock,
      badgeText: timeElapsed,
    },
    {
      title: 'Kitchen is Cooking!',
      desc: 'Our chefs are actively preparing your dishes.',
      icon: ChefHat,
      badgeText: timeElapsed,
    },
    {
      title: 'Food is Ready!',
      desc: 'Your food is prepared and ready to serve.',
      icon: CelebrationFlagIcon,
      badgeText: timeElapsed,
    },
  ];

  const currentStage = stageHeaders[Math.min(currentStep, 2)];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#edf2f8] via-[#e8eff7] to-[#e0e9f5] text-slate-900 font-sans pb-24">
      {/* 1. Top Island Navigation Header */}
      <div className="sticky top-0 z-30 pt-3 px-4 max-w-md mx-auto">
        <header className="bg-white/95 backdrop-blur-xl rounded-3xl px-4 py-3 border border-slate-200/90 shadow-[0_4px_25px_rgba(0,0,0,0.03)] flex items-center justify-between">
          <button
            onClick={handleOrderMore}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.2]" />
            <span>Back to Menu</span>
          </button>

          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-emerald-500 animate-ping' : 'bg-amber-400'
              }`}
            />
            <span className="text-xs font-bold text-slate-700">
              Table {tableNumber} &bull; Live
            </span>
          </div>
        </header>
      </div>

      <main className="max-w-md mx-auto px-4 pt-3.5 space-y-3.5">
        {/* 2. Top Hero Card (Matching Image 2 Exactly: "Food is Ready!") */}
        <div className="rounded-3xl bg-white/95 backdrop-blur-xl border border-slate-100 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] relative overflow-hidden">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3.5">
              {/* Soft blue icon container */}
              <div className="w-13 h-13 rounded-2xl bg-blue-50/90 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs">
                {currentStep === 2 ? (
                  <CelebrationFlagIcon className="w-6 h-6 stroke-[2.2] text-blue-600" />
                ) : currentStep === 1 ? (
                  <ChefHat className="w-6 h-6 stroke-[2.2] text-blue-600" />
                ) : (
                  <Clock className="w-6 h-6 stroke-[2.2] text-blue-600" />
                )}
              </div>

              <div className="min-w-0 pr-1">
                <h1 className="text-lg sm:text-xl font-black text-[#0a1128] tracking-tight leading-tight">
                  {currentStage.title}
                </h1>
                <p className="text-xs text-slate-500 font-medium mt-1 leading-snug">
                  {currentStage.desc}
                </p>
              </div>
            </div>

            {/* Top Right Live Pill Badge */}
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-bold flex items-center gap-1 shrink-0 shadow-2xs">
              <CheckCircle2 className="w-3.5 h-3.5 fill-emerald-600 text-white" />
              <span>{currentStage.badgeText}</span>
            </span>
          </div>
        </div>

        {/* 3. Session Progress Timeline Card (Matching Image 2 Stepper with Round Slider) */}
        <div className="rounded-3xl bg-white/95 backdrop-blur-xl border border-slate-100 p-5 sm:p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] space-y-5">
          {/* Header row */}
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600 stroke-[2.2]" />
              <h2 className="text-sm sm:text-base font-extrabold text-[#0a1128] tracking-tight">
                Session Progress Timeline
              </h2>
            </div>
            <span className="px-3 py-1 rounded-full bg-blue-50 border border-blue-100/90 text-blue-600 text-xs font-bold">
              {allRounds.length} {allRounds.length === 1 ? 'Round' : 'Rounds'}
            </span>
          </div>

          {/* Round Slider Controls (Rendered if there is more than 1 round, newest round first) */}
          {displayRounds.length > 1 && (
            <div className="pt-1 pb-3 border-b border-slate-100 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                <span>Select Dining Round:</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={selectedRoundIdx === 0}
                    onClick={() => setSelectedRoundIdx((prev) => Math.max(0, prev - 1))}
                    className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center text-slate-600 transition cursor-pointer"
                    title="Newer Round"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] font-extrabold text-blue-600 px-1">
                    Round {activeRound.roundNumber} of {displayRounds.length}
                  </span>
                  <button
                    type="button"
                    disabled={selectedRoundIdx === displayRounds.length - 1}
                    onClick={() => setSelectedRoundIdx((prev) => Math.min(displayRounds.length - 1, prev + 1))}
                    className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center text-slate-600 transition cursor-pointer"
                    title="Older Round"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Horizontal slider pills with newest round first */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
                {displayRounds.map((r, idx) => {
                  const isSel = idx === selectedRoundIdx;
                  return (
                    <button
                      key={r.order.id}
                      type="button"
                      onClick={() => setSelectedRoundIdx(idx)}
                      className={`px-3 py-1.5 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                        isSel
                          ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-500/25'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
                      }`}
                    >
                      <span>Round {r.roundNumber}</span>
                      {r.isLatest && (
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded-full font-black uppercase tracking-wider ${
                            isSel ? 'bg-white/25 text-white' : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          Newest
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Stepper Timeline List (Exact same UI like now, for active round) */}
          <div className="space-y-6 relative pl-1">
            {/* --- STEP 1: Order Placed --- */}
            <div className="flex items-start gap-4 relative">
              {/* Connector Line downwards */}
              <div
                className={`absolute left-4.5 top-9 w-0.5 h-9 transition-colors duration-500 ${
                  activeRound.step > 0 ? 'bg-blue-500' : 'bg-slate-200'
                }`}
              />

              <div
                className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all ${
                  activeRound.step > 0
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-blue-600 text-white ring-4 ring-blue-500/20 font-bold'
                }`}
              >
                {activeRound.step > 0 ? (
                  <Check className="w-4 h-4 stroke-[3] text-white" />
                ) : (
                  <Clock className="w-4 h-4 text-white" />
                )}
              </div>

              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-sm text-[#0a1128]">
                    Order Placed
                  </h3>
                  <span className="text-xs font-semibold text-slate-400">
                    {formatClockTime(activeRound.order?.createdAt)}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 font-medium">
                  Sent to manager for approval
                </p>
              </div>
            </div>

            {/* --- STEP 2: In Kitchen --- */}
            <div className="flex items-start gap-4 relative">
              {/* Connector Line downwards */}
              <div
                className={`absolute left-4.5 top-9 w-0.5 h-9 transition-colors duration-500 ${
                  activeRound.step > 1 ? 'bg-amber-400' : 'bg-slate-200'
                }`}
              />

              <div
                className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all ${
                  activeRound.step > 1
                    ? 'bg-blue-600 text-white shadow-xs'
                    : activeRound.step === 1
                    ? 'bg-blue-100 text-blue-600 ring-4 ring-blue-500/20 font-bold'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {activeRound.step > 1 ? (
                  <Check className="w-4 h-4 stroke-[3] text-white" />
                ) : (
                  <ChefHat className="w-4 h-4 stroke-[2.2] text-blue-600" />
                )}
              </div>

              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-sm text-[#0a1128]">
                    In Kitchen
                  </h3>
                  <span className="text-xs font-semibold text-slate-400">
                    {activeRound.step >= 1
                      ? formatClockTime(activeRound.order?.updatedAt || activeRound.order?.createdAt)
                      : '—'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 font-medium">
                  Chef is preparing your dishes
                </p>
              </div>
            </div>

            {/* --- STEP 3: Food Ready (Final stage, no connector line downwards) --- */}
            <div className="flex items-start gap-4 relative">
              <div
                className={`relative z-10 flex items-center justify-center shrink-0 transition-all ${
                  activeRound.step === 2 && activeRound.order?.status === 'READY'
                    ? 'w-11 h-11 -ml-1 rounded-full bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30'
                    : activeRound.step >= 2
                    ? 'w-9 h-9 rounded-full bg-blue-600 text-white shadow-xs'
                    : 'w-9 h-9 rounded-full bg-slate-100 text-slate-400'
                }`}
              >
                {activeRound.step >= 2 && activeRound.order?.status !== 'READY' ? (
                  <Check className="w-4 h-4 stroke-[3] text-white" />
                ) : (
                  <ClocheIcon className="w-5 h-5 text-white" />
                )}
              </div>

              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-center justify-between">
                  <h3
                    className={`text-sm ${
                      activeRound.step === 2 && activeRound.order?.status === 'READY'
                        ? 'font-black text-[#0a1128]'
                        : 'font-extrabold text-[#0a1128]'
                    }`}
                  >
                    Food Ready
                  </h3>
                  {activeRound.step === 2 && activeRound.order?.status === 'READY' ? (
                    <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-wider">
                      ACTIVE STAGE
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-slate-400">
                      {activeRound.step >= 2
                        ? formatClockTime(activeRound.order?.updatedAt || activeRound.order?.createdAt)
                        : '—'}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5 font-medium">
                  Plated & heading to your table
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Bottom Row (2 Grid Cards matching Image 2: Table & Started At) */}
        <div className="grid grid-cols-2 gap-3">
          {/* Card 1: Table # */}
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-4 border border-slate-100 shadow-[0_4px_25px_rgba(0,0,0,0.03)] flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100/80 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs">
              <Utensils className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <h4 className="font-black text-sm text-[#0a1128] truncate">
                Table {tableNumber}
              </h4>
              <p className="text-[11px] text-slate-400 font-medium">
                Dining Session
              </p>
            </div>
          </div>

          {/* Card 2: Started At */}
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-4 border border-slate-100 shadow-[0_4px_25px_rgba(0,0,0,0.03)] flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100/80 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs">
              <Clock className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-slate-400 font-medium">
                Started At
              </p>
              <h4 className="font-black text-sm text-[#0a1128] truncate">
                {startTime}
              </h4>
            </div>
          </div>
        </div>

        {/* 5. Dishes in this Session (Collapsible clean summary card) */}
        <div className="rounded-3xl bg-white/95 backdrop-blur-xl border border-slate-100 p-5 shadow-[0_4px_25px_rgba(0,0,0,0.03)] space-y-4">
          <div
            onClick={() => setIsItemsExpanded(!isItemsExpanded)}
            className="flex items-center justify-between cursor-pointer select-none"
          >
            <div>
              <h3 className="text-sm font-extrabold text-[#0a1128]">
                Dishes in this Session
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {activeOrders.reduce((sum, o) => sum + (o.items?.length || 0), 0)} item(s) ordered
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-blue-600">
                {grandTotal.toLocaleString()} ETB
              </span>
              <button
                type="button"
                className="p-1 rounded-full text-slate-400 hover:text-slate-700"
              >
                {isItemsExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {isItemsExpanded && (
            <div className="space-y-3 pt-2 border-t border-slate-100">
              {activeOrders.map((order, orderIdx) => (
                <div key={order.id} className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
                    <span className="font-bold text-slate-600">
                      Round {orderIdx + 1}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold uppercase">
                      {order.status}
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {order.items?.map((item) => (
                      <div
                        key={item.id}
                        className="py-2 flex items-center justify-between text-xs"
                      >
                        <div className="min-w-0 pr-2">
                          <h4 className="font-bold text-slate-800 truncate">
                            {item.quantity}x {item.menuItem?.name || 'Dish'}
                          </h4>
                          {item.notes && (
                            <p className="text-[11px] text-amber-600 italic">
                              &ldquo;{item.notes}&rdquo;
                            </p>
                          )}
                        </div>
                        <span className="font-bold text-slate-900 shrink-0">
                          {(Number(item.unitPrice) * item.quantity).toLocaleString()} ETB
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 6. Action Controls: Request Bill / Settle & Order Additional Items */}
        <div className="space-y-3 pt-1">
          {isPrePaid ? (
            <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-center space-y-1 shadow-2xs">
              <div className="flex items-center justify-center gap-1.5 text-emerald-700 font-extrabold text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Order Pre-Paid ({grandTotal.toLocaleString()} ETB)</span>
              </div>
              <p className="text-[11px] text-emerald-600/90 font-medium">
                Payment verified upfront via Mobile USSD. No additional bill settlement required.
              </p>
            </div>
          ) : billRequested ? (
            <div className="rounded-3xl bg-amber-50 border border-amber-200 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                    Bill Requested & Waiter Notified
                  </h4>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black uppercase">
                  {selectedMethodName || 'USSD Mobile'}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Staff have received your settlement request for Table #{tableNumber}. Your server is bringing your receipt.
              </p>
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(true)}
                className="w-full py-2.5 rounded-xl bg-white border border-amber-200 text-xs font-bold text-slate-700 hover:bg-amber-100/50 transition cursor-pointer"
              >
                Change Payment Method / View Till QR
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsPaymentModalOpen(true)}
              className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl shadow-blue-500/25 active:opacity-75 transition cursor-pointer"
            >
              <Receipt className="w-4 h-4 stroke-[2.2]" />
              <span>Proceed to Payment / Request Bill ({grandTotal.toLocaleString()} ETB)</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleOrderMore}
            className="w-full py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 border border-slate-200/90 shadow-2xs active:opacity-75 transition cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 text-blue-600 stroke-[2.2]" />
            <span>Order Additional Items</span>
          </button>
        </div>
      </main>

      {/* --- IN-APP DIRECT USSD MOBILE PAYMENT MODAL --- */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        tableNumber={tableNumber}
        tableId={tableId}
        grandTotal={grandTotal}
        itemCount={activeOrders.reduce((sum, o) => sum + (o.items?.length || 0), 0)}
        onConfirmPayment={handlePaymentSubmit}
        onDoneReturnToMenu={() => {
          const tkn = searchParams.get('token') || '';
          router.push(`/table/${tableId}${tkn ? `?token=${encodeURIComponent(tkn)}` : ''}`);
        }}
      />
    </div>
  );
}
