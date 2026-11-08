'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Transaction, PaymentMethod } from '@/lib/types';
import ManagerNav from '@/components/ManagerNav';
import RestaurantLoader from '@/components/ui/RestaurantLoader';
import {
  Receipt,
  Search,
  DollarSign,
  TrendingUp,
  CreditCard,
  Smartphone,
  Banknote,
  UtensilsCrossed,
  X,
  FileText,
  ChevronDown,
} from 'lucide-react';

export default function ManagerTransactionsPage() {
  const router = useRouter();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [avgTicket, setAvgTicket] = useState<number>(0);

  const [loading, setLoading] = useState<boolean>(true);
  const [datePreset, setDatePreset] = useState<'today' | '7d' | '30d' | 'custom'>('today');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<string>('ALL');
  const [searchTable, setSearchTable] = useState<string>('');
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);

  const [isPending, startTransition] = useTransition();

  // Calculate default dates
  const computeDateRange = (preset: 'today' | '7d' | '30d' | 'custom') => {
    const now = new Date();
    if (preset === 'today') {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return { from: startOfDay.toISOString(), to: undefined };
    }
    if (preset === '7d') {
      const past7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return { from: past7.toISOString(), to: undefined };
    }
    if (preset === '30d') {
      const past30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return { from: past30.toISOString(), to: undefined };
    }
    return {
      from: fromDate ? new Date(fromDate).toISOString() : undefined,
      to: toDate ? new Date(toDate).toISOString() : undefined,
    };
  };

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('smart_menu_staff_token') : null;
      if (!token) {
        router.push('/login');
        return;
      }

      const { from, to } = computeDateRange(datePreset);
      const method = selectedMethod !== 'ALL' ? (selectedMethod as PaymentMethod) : undefined;

      const res = await api.transactions.getAll({
        from,
        to,
        paymentMethod: method,
      });

      setTransactions(res.transactions || []);
      setTotalRevenue(res.stats?.totalRevenue || 0);
      setTotalCount(res.stats?.transactionCount || 0);
      setAvgTicket(res.stats?.averageTicket || 0);
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [datePreset, selectedMethod]);

  const handleApplyCustomFilter = (e: React.FormEvent) => {
    e.preventDefault();
    loadTransactions();
  };

  // Filter client-side by table search
  const filteredTransactions = transactions.filter((t) => {
    if (!searchTable) return true;
    const tableNum = t.table?.tableNumber?.toString() || '';
    return tableNum.includes(searchTable.trim());
  });

  const getMethodBadge = (method: PaymentMethod) => {
    switch (method) {
      case 'TELEBIRR':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <Smartphone className="w-3.5 h-3.5" />
            Telebirr
          </span>
        );
      case 'CBE_BIRR':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            <Smartphone className="w-3.5 h-3.5" />
            CBE Birr
          </span>
        );
      case 'POS_CARD':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <CreditCard className="w-3.5 h-3.5" />
            POS Terminal
          </span>
        );
      case 'CASH':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <Banknote className="w-3.5 h-3.5" />
            Cash
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0] dark:bg-[#080c1d] dark:from-[#080c1d] dark:to-[#080c1d] text-slate-900 dark:text-gray-100 flex flex-col relative overflow-hidden font-sans transition-colors duration-200">
      {/* Ambient Fluid Glow Waves */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-blue-400/10 dark:bg-blue-600/15 blur-[120px] pointer-events-none" />
      <div className="absolute top-1/4 -right-32 w-96 h-96 rounded-full bg-indigo-400/10 dark:bg-purple-600/10 blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-32 left-1/3 w-[500px] h-[300px] rounded-full bg-sky-400/10 dark:bg-cyan-600/10 blur-[130px] pointer-events-none" />

      {/* Shared Navigation Bar */}
      <ManagerNav onRefresh={loadTransactions} title="Payment & Settlement Records" />

      <main className="flex-1 max-w-[1440px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6 relative z-10">
        {/* Title Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white shadow-md border border-slate-100 dark:bg-[#131b38] dark:border-blue-900/40 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0 shadow-[0_4px_20px_rgba(168,85,247,0.12)]">
              <Receipt className="w-7 h-7 text-purple-600 dark:text-purple-400 stroke-[1.75]" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#0f172a] dark:text-white tracking-tight leading-tight">
                Payment &amp; Settlement Records
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Audit settled guest bills, digital wallet transaction references, and itemized dining snapshots.
              </p>
            </div>
          </div>
        </div>

        {/* Metric KPI Cards (3-Column Layout) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Settled Revenue */}
          <div className="bg-white/80 dark:bg-[#0f1738]/90 backdrop-blur-md rounded-2xl border border-white/80 dark:border-blue-900/40 shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-6 flex justify-between items-center transition-all hover:shadow-md">
            <div>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Settled Revenue
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#0f172a] dark:text-white mt-1">
                {totalRevenue.toLocaleString()}{' '}
                <span className="text-base font-bold text-slate-600 dark:text-slate-300">ETB</span>
              </div>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                Filtered timeframe total
              </span>
            </div>
            <div className="w-13 h-13 rounded-full bg-[#fef3c7] dark:bg-amber-950/60 flex items-center justify-center text-[#92400e] dark:text-amber-300 shadow-2xs shrink-0">
              <DollarSign className="w-6 h-6 stroke-[2.5]" />
            </div>
          </div>

          {/* Card 2: Settled Bills */}
          <div className="bg-white/80 dark:bg-[#0f1738]/90 backdrop-blur-md rounded-2xl border border-white/80 dark:border-blue-900/40 shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-6 flex justify-between items-center transition-all hover:shadow-md">
            <div>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Settled Bills
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#0f172a] dark:text-white mt-1">
                {totalCount}
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block mt-1.5">
                Completed transactions
              </span>
            </div>
            <div className="w-13 h-13 rounded-full bg-[#f3e8ff] dark:bg-purple-950/60 flex items-center justify-center text-[#7e22ce] dark:text-purple-300 shadow-2xs shrink-0">
              <Receipt className="w-6 h-6 stroke-[2]" />
            </div>
          </div>

          {/* Card 3: Average Ticket */}
          <div className="bg-white/80 dark:bg-[#0f1738]/90 backdrop-blur-md rounded-2xl border border-white/80 dark:border-blue-900/40 shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-6 flex justify-between items-center transition-all hover:shadow-md">
            <div>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Average Ticket
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#0f172a] dark:text-white mt-1">
                {avgTicket.toLocaleString()}{' '}
                <span className="text-base font-bold text-slate-600 dark:text-slate-300">ETB</span>
              </div>
              <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold block mt-1.5">
                Per table dining session
              </span>
            </div>
            <div className="w-13 h-13 rounded-full bg-[#e0f2fe] dark:bg-sky-950/60 flex items-center justify-center text-[#0369a1] dark:text-sky-300 shadow-2xs shrink-0">
              <CreditCard className="w-6 h-6 stroke-[2]" />
            </div>
          </div>
        </div>

        {/* Filter & Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Left Timeframe Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                { id: 'today', label: 'Today' },
                { id: '7d', label: 'Last 7 Days' },
                { id: '30d', label: 'Last 30 Days' },
                { id: 'custom', label: 'Custom Range' },
              ] as const
            ).map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => setDatePreset(preset.id)}
                className={`px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition cursor-pointer ${
                  datePreset === preset.id
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                    : 'bg-white/90 dark:bg-[#0f1738]/90 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-blue-900/40 shadow-xs'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Right Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Payment Dropdown Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Payment:</span>
              <div className="relative">
                <select
                  value={selectedMethod}
                  onChange={(e) => setSelectedMethod(e.target.value)}
                  className="appearance-none bg-white dark:bg-[#0f1738] border border-slate-200/90 dark:border-blue-900/40 rounded-full pl-4 pr-9 py-2 text-xs sm:text-sm text-slate-800 dark:text-white shadow-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 font-medium cursor-pointer"
                >
                  <option value="ALL">All Methods</option>
                  <option value="TELEBIRR">Telebirr</option>
                  <option value="CBE_BIRR">CBE Birr</option>
                  <option value="POS_CARD">POS Terminal</option>
                  <option value="CASH">Cash</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Table Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter Table #"
                value={searchTable}
                onChange={(e) => setSearchTable(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-full bg-white dark:bg-[#0f1738] border border-slate-200/90 dark:border-blue-900/40 text-xs sm:text-sm text-slate-800 dark:text-white placeholder:text-slate-400 shadow-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 w-44 sm:w-52 transition"
              />
            </div>
          </div>
        </div>

        {/* Custom Range Picker Drawer */}
        {datePreset === 'custom' && (
          <form
            onSubmit={handleApplyCustomFilter}
            className="p-4 rounded-2xl bg-white/80 dark:bg-[#0f1738]/90 border border-slate-200/80 dark:border-blue-900/40 flex flex-wrap items-center gap-3 animate-in fade-in duration-150 shadow-xs"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">From:</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">To:</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition cursor-pointer"
            >
              Apply Range
            </button>
          </form>
        )}

        {/* Main Content Card / Empty State or Transactions Table */}
        <div className="bg-white/80 dark:bg-[#0f1738]/90 backdrop-blur-md rounded-3xl border border-white/90 dark:border-blue-900/40 shadow-[0_6px_30px_rgba(0,0,0,0.03)] overflow-hidden">
          {loading ? (
            <RestaurantLoader
              message="Loading payment & settlement records..."
              subMessage="Fetching Telebirr, CBE Birr, Awash Birr, and cash ledger audit history"
            />
          ) : filteredTransactions.length === 0 ? (
            /* Empty State matching payments_settlements_light.png */
            <div className="py-20 px-6 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-800/40 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4 shadow-sm">
                <Receipt className="w-7 h-7 stroke-[1.75]" />
              </div>
              <h3 className="text-xl font-bold text-[#0f172a] dark:text-white mb-2">
                No Transactions Found
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md leading-relaxed">
                No settled dining bills match your current filters. Adjust the time frame or payment method.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-6 py-4">Date &amp; Time</th>
                    <th className="px-6 py-4">Table</th>
                    <th className="px-6 py-4">Method</th>
                    <th className="px-6 py-4">Reference / Note</th>
                    <th className="px-6 py-4">Items Snapshot</th>
                    <th className="px-6 py-4 text-right">Amount (ETB)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredTransactions.map((txn) => {
                    const items = Array.isArray(txn.itemSnapshot) ? (txn.itemSnapshot as any[]) : [];
                    const itemCount = items.reduce((sum: number, i: any) => sum + (Number(i.quantity) || 1), 0);

                    return (
                      <tr key={txn.id} className="hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition">
                        <td className="px-6 py-4.5 whitespace-nowrap">
                          <div className="font-bold text-slate-900 dark:text-white text-xs">
                            {new Date(txn.createdAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {new Date(txn.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </td>

                        <td className="px-6 py-4.5 whitespace-nowrap">
                          <span className="font-black text-slate-900 dark:text-white text-sm">
                            Table #{txn.table?.tableNumber || '—'}
                          </span>
                        </td>

                        <td className="px-6 py-4.5 whitespace-nowrap">{getMethodBadge(txn.paymentMethod)}</td>

                        <td className="px-6 py-4.5">
                          {txn.referenceNote ? (
                            <span className="font-mono text-slate-700 dark:text-slate-300 text-[11px] bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700">
                              {txn.referenceNote}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">—</span>
                          )}
                        </td>

                        <td className="px-6 py-4.5">
                          <button
                            onClick={() => setSelectedTxn(txn)}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-blue-950/40 text-slate-700 hover:text-blue-600 dark:text-slate-300 transition font-semibold text-xs border border-slate-200/80 dark:border-slate-700 cursor-pointer"
                          >
                            <UtensilsCrossed className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                            <span>
                              {itemCount} item{itemCount !== 1 ? 's' : ''}
                            </span>
                          </button>
                        </td>

                        <td className="px-6 py-4.5 whitespace-nowrap text-right font-black text-slate-900 dark:text-white text-sm">
                          {Number(txn.amount).toLocaleString()}{' '}
                          <span className="text-xs text-blue-600 dark:text-blue-400 font-bold">ETB</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Item Snapshot Detail Modal */}
      {selectedTxn && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-[#141b36] border border-slate-200 dark:border-blue-900/50 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/40 flex items-center justify-center text-purple-600 dark:text-purple-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Settled Dishes Snapshot</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Table #{selectedTxn.table?.tableNumber} Bill Details</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTxn(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 divide-y divide-slate-100 dark:divide-slate-800">
              {Array.isArray(selectedTxn.itemSnapshot) &&
                (selectedTxn.itemSnapshot as any[]).map((item, idx) => (
                  <div key={idx} className="pt-2 first:pt-0 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {item.quantity}x {item.name}
                      </span>
                      {item.notes && <p className="text-[10px] text-slate-500 italic">{item.notes}</p>}
                    </div>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {(Number(item.unitPrice) * item.quantity).toLocaleString()} ETB
                    </span>
                  </div>
                ))}
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Payment Reference</span>
                <p className="text-xs font-mono font-bold text-slate-800 dark:text-white">
                  {selectedTxn.referenceNote || 'Direct Settlement'}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Total Settled</span>
                <div className="text-lg font-black text-blue-600 dark:text-blue-400">
                  {Number(selectedTxn.amount).toLocaleString()} ETB
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setSelectedTxn(null)}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition cursor-pointer"
              >
                Close Snapshot
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
