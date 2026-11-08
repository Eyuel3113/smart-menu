'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Table, Area, TableKpis, TableStatus } from '@/lib/types';
import ManagerNav from '@/components/ManagerNav';
import MetricsRow from '@/components/tables/MetricsRow';
import FilterBar from '@/components/tables/FilterBar';
import TableCard from '@/components/tables/TableCard';
import { useSocket } from '@/hooks/useSocket';
import sound from '@/lib/sound';
import {
  Layers,
  Plus,
  QrCode,
  Edit2,
  Trash2,
  Check,
  X,
  RefreshCw,
  Download,
  Printer,
  Copy,
  ShieldCheck,
  Users,
} from 'lucide-react';

export default function TableMatrixZonesPage() {
  const router = useRouter();

  const [tables, setTables] = useState<Table[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [kpis, setKpis] = useState<TableKpis>({
    total: 0,
    available: 0,
    occupied: 0,
    paidPending: 0,
    cleaning: 0,
    billRequested: 0,
  });
  const [selectedAreaId, setSelectedAreaId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [actionPending, startActionTransition] = useTransition();

  // Active Arrow Popover
  const [activeArrowTableId, setActiveArrowTableId] = useState<string | null>(null);

  // Modals
  const [isAddTableOpen, setIsAddTableOpen] = useState(false);
  const [newTableNum, setNewTableNum] = useState<number>(1);
  const [newTableAreaId, setNewTableAreaId] = useState<string>('');
  const [newTableCapacity, setNewTableCapacity] = useState<number>(4);

  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [editTableNum, setEditTableNum] = useState<number>(1);
  const [editTableAreaId, setEditTableAreaId] = useState<string>('');
  const [editTableCapacity, setEditTableCapacity] = useState<number>(4);

  const [deletingTable, setDeletingTable] = useState<Table | null>(null);

  const [isAreaModalOpen, setIsAreaModalOpen] = useState(false);
  const [newAreaName, setNewAreaName] = useState('');
  const [newAreaSort, setNewAreaSort] = useState(0);

  const [qrModalTable, setQrModalTable] = useState<Table | null>(null);
  const [isRegeneratingQr, setIsRegeneratingQr] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const [reviewSettlementTable, setReviewSettlementTable] = useState<Table | null>(null);

  const { on } = useSocket({ isManager: true, autoConnect: true });

  const loadData = async () => {
    try {
      setLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('smart_menu_staff_token') : null;
      if (!token) {
        router.push('/login');
        return;
      }

      const [tablesRes, areasData] = await Promise.all([
        api.tables.getWithKpis(selectedAreaId === 'ALL' ? undefined : selectedAreaId),
        api.areas.getAll(),
      ]);

      setTables(tablesRes.tables);
      setKpis(tablesRes.kpis);
      setAreas(areasData);
    } catch (err: any) {
      console.warn('Failed to load tables & zones:', err);
      if (err.message?.includes('401') || err.message?.includes('token')) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedAreaId, router]);

  // Click outside listener for table arrow popover
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.arrow-menu-container')) {
        setActiveArrowTableId(null);
      }
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  // Socket updates
  useEffect(() => {
    const cleanupStatus = on<Table>('table:status_updated', (updated) => {
      setTables((prev) =>
        prev.map((t) => (t.id === updated.id || t.tableNumber === updated.tableNumber ? { ...t, ...updated } : t))
      );
    });

    const cleanupPaidPending = on<{ table: Table; transaction: any }>('table:paid_pending', ({ table }) => {
      sound.playServiceAlert();
      setTables((prev) =>
        prev.map((t) => (t.id === table.id || t.tableNumber === table.tableNumber ? { ...t, ...table } : t))
      );
    });

    const cleanupCreated = on<Table>('table:created', (newTable) => {
      setTables((prev) => {
        if (prev.some((t) => t.id === newTable.id)) return prev;
        return [...prev, newTable].sort((a, b) => a.tableNumber - b.tableNumber);
      });
    });

    const cleanupUpdated = on<Table>('table:updated', (updated) => {
      setTables((prev) =>
        prev
          .map((t) => (t.id === updated.id ? { ...t, ...updated } : t))
          .sort((a, b) => a.tableNumber - b.tableNumber)
      );
    });

    const cleanupDeleted = on<{ id: string }>('table:deleted', ({ id }) => {
      setTables((prev) => prev.filter((t) => t.id !== id));
    });

    return () => {
      cleanupStatus();
      cleanupPaidPending();
      cleanupCreated();
      cleanupUpdated();
      cleanupDeleted();
    };
  }, [on]);

  // Status transitions
  const handleTableStatusChange = (tableId: string, status: TableStatus) => {
    startActionTransition(async () => {
      try {
        const updated = await api.tables.updateStatus(tableId, status);
        setTables((prev) => prev.map((t) => (t.id === tableId ? { ...t, ...updated } : t)));
        setActiveArrowTableId(null);
        sound.playSuccessDing();
        loadData();
      } catch (err: any) {
        alert(err.message || 'Failed to update table status');
      }
    });
  };

  const handleApproveSettlement = (tableId: string) => {
    startActionTransition(async () => {
      try {
        const updated = await api.tables.approveSettlement(tableId);
        setTables((prev) => prev.map((t) => (t.id === tableId ? { ...t, ...updated } : t)));
        setReviewSettlementTable(null);
        setActiveArrowTableId(null);
        sound.playSuccessDing();
        loadData();
      } catch (err: any) {
        alert(err.message || 'Failed to approve settlement');
      }
    });
  };

  // Table CRUD
  const openAddTableModal = () => {
    const nextTableNum = tables.length > 0 ? Math.max(...tables.map((t) => t.tableNumber)) + 1 : 1;
    setNewTableNum(nextTableNum);
    setNewTableAreaId(areas[0]?.id || '');
    setNewTableCapacity(4);
    setIsAddTableOpen(true);
  };

  const handleCreateTable = (e: React.FormEvent) => {
    e.preventDefault();
    startActionTransition(async () => {
      try {
        await api.tables.create({
          tableNumber: Number(newTableNum),
          areaId: newTableAreaId || undefined,
          capacity: Number(newTableCapacity),
        });
        setIsAddTableOpen(false);
        sound.playSuccessDing();
        loadData();
      } catch (err: any) {
        alert(err.message || 'Failed to create table');
      }
    });
  };

  const openEditTableModal = (table: Table) => {
    setEditingTable(table);
    setEditTableNum(table.tableNumber);
    setEditTableAreaId(table.areaId || '');
    setEditTableCapacity(table.capacity || 4);
    setActiveArrowTableId(null);
  };

  const handleUpdateTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTable) return;
    startActionTransition(async () => {
      try {
        await api.tables.update(editingTable.id, {
          tableNumber: Number(editTableNum),
          areaId: editTableAreaId || undefined,
          capacity: Number(editTableCapacity),
        });
        setEditingTable(null);
        sound.playSuccessDing();
        loadData();
      } catch (err: any) {
        alert(err.message || 'Failed to update table');
      }
    });
  };

  const openDeleteTableModal = (table: Table) => {
    setDeletingTable(table);
    setActiveArrowTableId(null);
  };

  const handleDeleteTable = () => {
    if (!deletingTable) return;
    startActionTransition(async () => {
      try {
        await api.tables.delete(deletingTable.id);
        setDeletingTable(null);
        sound.playSuccessDing();
        loadData();
      } catch (err: any) {
        alert(err.message || 'Failed to delete table');
      }
    });
  };

  // Area CRUD
  const handleCreateArea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAreaName.trim()) return;
    startActionTransition(async () => {
      try {
        await api.areas.create({
          name: newAreaName.trim(),
          sortOrder: Number(newAreaSort),
        });
        setNewAreaName('');
        setIsAreaModalOpen(false);
        loadData();
      } catch (err: any) {
        alert(err.message || 'Failed to create area');
      }
    });
  };

  const handleDeleteArea = (areaId: string) => {
    if (!confirm('Are you sure you want to delete this zone? Assigned tables will become unassigned.')) return;
    startActionTransition(async () => {
      try {
        await api.areas.delete(areaId);
        loadData();
      } catch (err: any) {
        alert(err.message || 'Failed to delete area');
      }
    });
  };

  // QR Standee
  const handleRegenerateQr = async (tableId: string) => {
    setIsRegeneratingQr(true);
    try {
      const updated = await api.tables.regenerateQr(tableId);
      setTables((prev) => prev.map((t) => (t.id === tableId ? updated : t)));
      setQrModalTable(updated);
      sound.playSuccessDing();
    } catch (err: any) {
      alert(err.message || 'Failed to regenerate QR code');
    } finally {
      setIsRegeneratingQr(false);
    }
  };

  const handleCopyQrLink = (table: Table) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const url = `${origin}/table/${table.id}?token=${encodeURIComponent(table.secretToken)}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleDownloadQr = (table: Table) => {
    if (!table.qrCodeUrl) return;
    const link = document.createElement('a');
    link.href = table.qrCodeUrl;
    link.download = `table-${table.tableNumber}-qr.png`;
    link.click();
  };

  const handlePrintQr = (table: Table) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Table #${table.tableNumber} QR Card</title>
          <style>
            body { font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f8fafc; }
            .card { background: #fff; padding: 32px; border-radius: 24px; text-align: center; border: 2px solid #e2e8f0; width: 340px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
            .brand { font-size: 14px; font-weight: 800; color: #2563eb; text-transform: uppercase; letter-spacing: 1px; }
            .title { font-size: 36px; font-weight: 900; color: #0f172a; margin: 8px 0 16px; }
            img { width: 220px; height: 220px; display: block; margin: 0 auto; }
            .sub { font-size: 13px; font-weight: 700; color: #475569; margin-top: 16px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="brand">SmartMenu Digital</div>
            <div class="title">Table #${table.tableNumber}</div>
            <img src="${table.qrCodeUrl}" />
            <div class="sub">Scan QR with your phone to order</div>
          </div>
          <script>window.onload = function() { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Filter tables by search query
  const filteredTables = tables.filter((t) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase().trim();
    const matchNum = t.tableNumber.toString().includes(q);
    const matchArea = t.area?.name?.toLowerCase().includes(q);
    return matchNum || matchArea;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#f0f4f9] to-[#e2e8f0] dark:bg-[#080c1d] dark:from-[#080c1d] dark:to-[#080c1d] text-slate-900 dark:text-gray-100 flex flex-col relative overflow-hidden font-sans transition-colors duration-200">
      {/* Ambient Aurora Glow Overlays */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-blue-400/10 dark:bg-blue-600/15 blur-[120px] pointer-events-none" />
      <div className="absolute top-1/4 -right-32 w-96 h-96 rounded-full bg-indigo-400/10 dark:bg-purple-600/10 blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-32 left-1/3 w-[500px] h-[300px] rounded-full bg-sky-400/10 dark:bg-cyan-600/10 blur-[130px] pointer-events-none" />

      {/* Top Navbar */}
      <ManagerNav onRefresh={loadData} title="Tables & Zones" />

      <main className="flex-1 max-w-[1440px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6 relative z-10">
        {/* --- PAGE HEADER --- */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100/80 text-indigo-600 shadow-xs dark:bg-gradient-to-br dark:from-indigo-500/20 dark:to-blue-600/30 dark:border-indigo-500/40 dark:text-indigo-400 dark:shadow-[0_0_20px_rgba(99,102,241,0.25)] flex items-center justify-center shrink-0">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                Tables &amp; Floor Zones
              </h1>
              <p className="text-xs text-slate-500 dark:text-blue-300/70 font-medium mt-0.5">
                Manage your dining area efficiently
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={openAddTableModal}
              className="px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-blue-500/25 active:scale-95 transition cursor-pointer dark:bg-gradient-to-r dark:from-blue-600 dark:via-indigo-600 dark:to-purple-600 dark:hover:from-blue-500 dark:hover:to-purple-500 dark:shadow-[0_0_20px_rgba(99,102,241,0.4)]"
            >
              <Plus className="w-4 h-4" />
              <span>Add Table</span>
            </button>
          </div>
        </div>

        {/* --- 6 STATUS SUMMARY KPI CARDS --- */}
        <MetricsRow kpis={kpis} />

        {/* --- FILTER & SEARCH BAR --- */}
        <FilterBar
          tables={tables}
          areas={areas}
          selectedAreaId={selectedAreaId}
          onSelectArea={setSelectedAreaId}
          onManageZones={() => setIsAreaModalOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* --- TABLE MATRIX GRID (10 CARDS) --- */}
        {loading ? (
          <div className="py-24 text-center text-slate-500 dark:text-blue-300 text-xs flex flex-col items-center gap-3">
            <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span>Synchronizing live floor table matrix...</span>
          </div>
        ) : filteredTables.length === 0 ? (
          <div className="py-20 text-center rounded-3xl bg-white/80 border border-slate-200 dark:bg-[#0c142b]/60 dark:border-blue-900/40 space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 dark:bg-blue-600/10 dark:border-blue-500/20 dark:text-blue-400 flex items-center justify-center">
              <Users className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">No Tables Found</h3>
              <p className="text-xs text-slate-500 dark:text-blue-300/60 max-w-sm mx-auto mt-1">
                No dining tables match your zone or search criteria.
              </p>
            </div>
            <button
              onClick={openAddTableModal}
              className="px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-md shadow-blue-500/25 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Table</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-5">
            {filteredTables.map((table) => (
              <TableCard
                key={table.id}
                table={table}
                isArrowOpen={activeArrowTableId === table.id}
                onToggleArrow={() =>
                  setActiveArrowTableId(activeArrowTableId === table.id ? null : table.id)
                }
                onCloseArrow={() => setActiveArrowTableId(null)}
                onViewBarcode={(t) => setQrModalTable(t)}
                onChangeStatus={handleTableStatusChange}
                onReviewPaidPending={(t) => setReviewSettlementTable(t)}
                onEditTable={openEditTableModal}
                onDeleteTable={openDeleteTableModal}
                actionPending={actionPending}
              />
            ))}
          </div>
        )}
      </main>

      {/* --- ADD TABLE MODAL --- */}
      {isAddTableOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-[#0f1738] border border-slate-200 dark:border-blue-500/30 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-blue-900/40">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Create New Table</span>
              </h3>
              <button
                onClick={() => setIsAddTableOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-700 dark:text-blue-300 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTable} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-blue-200">Table Number *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={newTableNum}
                  onChange={(e) => setNewTableNum(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#090e24] border border-slate-200 dark:border-blue-900/60 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-blue-200">Floor Zone / Area</label>
                <select
                  value={newTableAreaId}
                  onChange={(e) => setNewTableAreaId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#090e24] border border-slate-200 dark:border-blue-900/60 text-xs text-slate-900 dark:text-white font-bold focus:outline-hidden focus:border-blue-500"
                >
                  <option value="">No Zone (Main Dining)</option>
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-blue-200">Guest Seating Capacity</label>
                <select
                  value={newTableCapacity}
                  onChange={(e) => setNewTableCapacity(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#090e24] border border-slate-200 dark:border-blue-900/60 text-xs text-slate-900 dark:text-white font-bold focus:outline-hidden focus:border-blue-500"
                >
                  <option value={2}>2 Guests (Cozy 2p)</option>
                  <option value={4}>4 Guests (Standard 4p)</option>
                  <option value={6}>6 Guests (Large 6p)</option>
                  <option value={8}>8 Guests (Family 8p)</option>
                  <option value={10}>10+ Guests (VIP Banquet)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-blue-900/40">
                <button
                  type="button"
                  onClick={() => setIsAddTableOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#162148] dark:hover:bg-blue-900/40 text-slate-700 dark:text-blue-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionPending}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/30"
                >
                  Create Table
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT TABLE MODAL --- */}
      {editingTable && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-[#0f1738] border border-slate-200 dark:border-blue-500/30 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-blue-900/40">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Edit Table #{editingTable.tableNumber}
              </h3>
              <button
                onClick={() => setEditingTable(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-700 dark:text-blue-300 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateTable} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-blue-200">Table Number</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={editTableNum}
                  onChange={(e) => setEditTableNum(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#090e24] border border-slate-200 dark:border-blue-900/60 text-xs text-slate-900 dark:text-white focus:outline-hidden"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-blue-200">Floor Zone</label>
                <select
                  value={editTableAreaId}
                  onChange={(e) => setEditTableAreaId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#090e24] border border-slate-200 dark:border-blue-900/60 text-xs text-slate-900 dark:text-white font-bold focus:outline-hidden"
                >
                  <option value="">No Zone (Main Dining)</option>
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-blue-200">Capacity</label>
                <select
                  value={editTableCapacity}
                  onChange={(e) => setEditTableCapacity(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#090e24] border border-slate-200 dark:border-blue-900/60 text-xs text-slate-900 dark:text-white font-bold focus:outline-hidden"
                >
                  <option value={2}>2 Guests (2p)</option>
                  <option value={4}>4 Guests (4p)</option>
                  <option value={6}>6 Guests (6p)</option>
                  <option value={8}>8 Guests (8p)</option>
                  <option value={10}>10+ Guests (10p+)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-blue-900/40">
                <button
                  type="button"
                  onClick={() => setEditingTable(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#162148] dark:hover:bg-blue-900/40 text-slate-700 dark:text-blue-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionPending}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- DELETE TABLE MODAL --- */}
      {deletingTable && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white dark:bg-[#0f1738] border border-rose-200 dark:border-rose-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              Delete Table #{deletingTable.tableNumber}?
            </h3>
            <p className="text-xs text-slate-600 dark:text-blue-200/80">
              Are you sure you want to permanently delete this table? Any active printed QR cards will become invalid.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingTable(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#162148] dark:hover:bg-blue-900/40 text-slate-700 dark:text-blue-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTable}
                disabled={actionPending}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
              >
                Delete Table
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MANAGE ZONES MODAL --- */}
      {isAreaModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-[#0f1738] border border-slate-200 dark:border-blue-500/30 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-blue-900/40">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-500" />
                <span>Manage Floor Zones</span>
              </h3>
              <button
                onClick={() => setIsAreaModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-700 dark:text-blue-300 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {areas.map((a) => (
                <div
                  key={a.id}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#090e24] border border-slate-200 dark:border-blue-900/40 flex items-center justify-between text-xs"
                >
                  <span className="font-bold text-slate-900 dark:text-white">{a.name}</span>
                  <button
                    onClick={() => handleDeleteArea(a.id)}
                    className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10 transition"
                    title="Delete Zone"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <form onSubmit={handleCreateArea} className="pt-3 border-t border-slate-100 dark:border-blue-900/40 space-y-3">
              <span className="text-xs font-bold text-slate-900 dark:text-white block">Add New Zone</span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  required
                  placeholder="e.g. Rooftop Patio"
                  value={newAreaName}
                  onChange={(e) => setNewAreaName(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#090e24] border border-slate-200 dark:border-blue-900/60 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-blue-300/40 focus:outline-hidden"
                />
                <button
                  type="submit"
                  disabled={actionPending}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
                >
                  Add Zone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- REVIEW & CLEAR SETTLEMENT MODAL --- */}
      {reviewSettlementTable && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white dark:bg-[#0f1738] border border-purple-200 dark:border-purple-500/40 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-purple-900/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Review Payment • Table #{reviewSettlementTable.tableNumber}
                  </h3>
                  <p className="text-xs text-purple-600 dark:text-purple-300">
                    Customer has settled payment. Verify &amp; clear table.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setReviewSettlementTable(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:text-purple-300 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-500/30 flex items-center justify-between">
              <div>
                <span className="text-xs text-purple-700 dark:text-purple-200/70 font-medium">Payment Status</span>
                <div className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                  Pending Manager Clearance
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-black bg-purple-100 text-purple-800 border border-purple-300 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/40 animate-pulse">
                Paid • Review
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-purple-900/40">
              <button
                type="button"
                onClick={() => setReviewSettlementTable(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#162148] dark:hover:bg-blue-900/40 text-slate-700 dark:text-blue-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionPending}
                onClick={() => handleApproveSettlement(reviewSettlementTable.id)}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30 active:scale-95 transition cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Approve &amp; Clear to Cleaning</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- VIEW BARCODE & QR MODAL --- */}
      {qrModalTable && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-[#0f1738] border border-slate-200 dark:border-blue-500/40 rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-blue-900/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Table #{qrModalTable.tableNumber} Barcode &amp; QR Standee
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-blue-300/70">
                    {qrModalTable.area?.name || 'Main Dining'} • {qrModalTable.capacity || 4} Guests Seating
                  </p>
                </div>
              </div>
              <button
                onClick={() => setQrModalTable(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:text-blue-300 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-white rounded-3xl p-6 flex flex-col items-center justify-center shadow-lg border border-gray-200">
              {qrModalTable.qrCodeUrl ? (
                <img
                  src={qrModalTable.qrCodeUrl}
                  alt={`Table ${qrModalTable.tableNumber} Barcode QR`}
                  className="w-56 h-56 object-contain rounded-xl"
                />
              ) : (
                <div className="w-56 h-56 flex items-center justify-center text-gray-400 text-xs">
                  Generating Barcode QR...
                </div>
              )}
              <span className="mt-3 text-xs font-black text-gray-900 uppercase tracking-widest">
                Table #{qrModalTable.tableNumber} • SmartMenu
              </span>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-blue-900/40 flex flex-wrap items-center justify-between gap-3">
              <button
                disabled={isRegeneratingQr}
                onClick={() => handleRegenerateQr(qrModalTable.id)}
                className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#090e24] dark:hover:bg-blue-900/30 border border-slate-200 dark:border-blue-900/60 text-xs font-semibold text-slate-700 dark:text-blue-200 flex items-center gap-1.5 transition cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRegeneratingQr ? 'animate-spin' : ''}`} />
                <span>{isRegeneratingQr ? 'Regenerating...' : 'Regenerate QR'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopyQrLink(qrModalTable)}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#162148] dark:hover:bg-blue-900/40 border border-slate-200 dark:border-blue-700/50 text-slate-800 dark:text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
                </button>
                <button
                  onClick={() => handleDownloadQr(qrModalTable)}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#162148] dark:hover:bg-blue-900/40 border border-slate-200 dark:border-blue-700/50 text-slate-800 dark:text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Download className="w-4 h-4 text-amber-500" />
                  <span>Download</span>
                </button>
                <button
                  onClick={() => handlePrintQr(qrModalTable)}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/30 transition cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Standee</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
