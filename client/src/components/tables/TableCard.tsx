'use client';

import React from 'react';
import { Table, TableStatus } from '@/lib/types';
import { useTheme } from '@/context/ThemeContext';
import {
  Users,
  ArrowRight,
  QrCode,
  X,
  Edit2,
  Trash2,
  Layers,
  MapPin,
  Trees,
  Sparkles,
  Check,
} from 'lucide-react';

interface TableCardProps {
  table: Table;
  isArrowOpen: boolean;
  onToggleArrow: () => void;
  onCloseArrow: () => void;
  onViewBarcode: (table: Table) => void;
  onChangeStatus: (tableId: string, status: TableStatus) => void;
  onReviewPaidPending: (table: Table) => void;
  onEditTable: (table: Table) => void;
  onDeleteTable: (table: Table) => void;
  actionPending: boolean;
}

export default function TableCard({
  table,
  isArrowOpen,
  onToggleArrow,
  onCloseArrow,
  onViewBarcode,
  onChangeStatus,
  onReviewPaidPending,
  onEditTable,
  onDeleteTable,
  actionPending,
}: TableCardProps) {
  const { isDark } = useTheme();

  const isAvail = table.status === 'AVAILABLE';
  const isOcc = table.status === 'OCCUPIED';
  const isPaidPending = table.status === 'PAID_PENDING';
  const isBill = table.status === 'BILL_REQUESTED';
  const isClean = table.status === 'CLEANING';

  const areaName = table.area?.name || 'Main Dining Hall';
  const isVipOrTerrace =
    areaName.toLowerCase().includes('terrace') || areaName.toLowerCase().includes('vip');

  // Helper for zone icon
  const getZoneIcon = (name?: string) => {
    if (!name) return <Layers className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />;
    const lower = name.toLowerCase();
    if (lower.includes('terrace') || lower.includes('garden')) {
      return <Trees className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />;
    }
    if (lower.includes('vip') || lower.includes('lounge')) {
      return <Sparkles className="w-3.5 h-3.5 text-sky-500 dark:text-amber-400" />;
    }
    return <Layers className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />;
  };

  // Card theme styling matching exact light and dark modes
  let lightBorder = 'border-emerald-400/80 hover:border-emerald-500';
  let darkCardTheme =
    'dark:bg-[#081924]/90 dark:border-2 dark:border-emerald-500/60 dark:shadow-[0_0_20px_rgba(16,185,129,0.2)] dark:hover:shadow-[0_0_28px_rgba(16,185,129,0.3)]';

  if (isOcc) {
    lightBorder = 'border-rose-400/80 hover:border-rose-500';
    darkCardTheme =
      'dark:bg-[#130d22]/90 dark:border-2 dark:border-red-500/70 dark:shadow-[0_0_20px_rgba(239,68,68,0.25)] dark:hover:shadow-[0_0_28px_rgba(239,68,68,0.35)]';
  } else if (isPaidPending) {
    lightBorder = 'border-emerald-400 hover:border-emerald-500';
    darkCardTheme =
      'dark:bg-[#071d18]/90 dark:border-2 dark:border-emerald-500/80 dark:shadow-[0_0_24px_rgba(16,185,129,0.3)]';
  } else if (isBill) {
    lightBorder = 'border-amber-400/80 hover:border-amber-500';
    darkCardTheme =
      'dark:bg-[#1d160c]/90 dark:border-2 dark:border-amber-500/80 dark:shadow-[0_0_24px_rgba(245,158,11,0.25)]';
  } else if (isClean) {
    lightBorder = 'border-sky-400/80 hover:border-sky-500';
    darkCardTheme =
      'dark:bg-[#0a1b32]/90 dark:border-2 dark:border-sky-500/70 dark:shadow-[0_0_20px_rgba(14,165,233,0.25)]';
  } else if (isAvail && isVipOrTerrace) {
    // Specifically Table #9 or VIP in light mockup has sky-blue border
    lightBorder = 'border-sky-400/80 hover:border-sky-500';
    darkCardTheme =
      'dark:bg-[#0a152e]/90 dark:border-2 dark:border-blue-500/60 dark:shadow-[0_0_20px_rgba(59,130,246,0.2)] dark:hover:shadow-[0_0_28px_rgba(59,130,246,0.3)]';
  }

  // Choose the visual table asset based on theme
  // In Light Mode: table_asset_light.png (from table_asset.jepg)
  // In Dark Mode: table_4p.png (from dark mockup)
  const tableImgSrc = isDark ? '/table_4p.png' : '/table_asset_light.png';

  return (
    <div
      className={`relative rounded-3xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-300 bg-white border-2 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-md ${lightBorder} ${darkCardTheme}`}
    >
      {/* --- TOP: STATUS BADGE PILL --- */}
      <div className="flex items-center justify-end">
        {isOcc && (
          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-rose-50 border border-rose-200 text-rose-600 dark:bg-red-950/80 dark:border-red-500/40 dark:text-red-400">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            Occupied
          </span>
        )}
        {isAvail && (
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold ${
              isVipOrTerrace
                ? 'bg-sky-50 border border-sky-200 text-sky-600 dark:bg-blue-950/80 dark:border-blue-500/40 dark:text-blue-300'
                : 'bg-emerald-50 border border-emerald-200 text-emerald-600 dark:bg-emerald-950/80 dark:border-emerald-500/40 dark:text-emerald-400'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${isVipOrTerrace ? 'bg-sky-500' : 'bg-emerald-500'}`}
            />
            Available
          </span>
        )}
        {isPaidPending && (
          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-black bg-emerald-100 border border-emerald-300 text-emerald-800 dark:bg-emerald-950/80 dark:border-emerald-500/50 dark:text-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            PAID
          </span>
        )}
        {isBill && (
          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-amber-50 border border-amber-200 text-amber-700 dark:bg-amber-950/80 dark:border-amber-500/40 dark:text-amber-400">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
            Bill Called
          </span>
        )}
        {isClean && (
          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-sky-50 border border-sky-200 text-sky-700 dark:bg-sky-950/80 dark:border-sky-500/40 dark:text-sky-300">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
            Cleaning
          </span>
        )}
      </div>

      {/* --- MIDDLE: 3D TABLE GRAPHIC & NUMBER --- */}
      <div className="my-3 flex items-center justify-between gap-2">
        {/* Isolated 3D Dining Table */}
        <div className="shrink-0 flex items-center justify-center pl-1">
          <img
            src={tableImgSrc}
            alt={`Table #${table.tableNumber}`}
            className="w-20 h-16 object-contain select-none pointer-events-none transition-transform duration-300 hover:scale-105"
          />
        </div>

        {/* Table Number & Capacity */}
        <div className="text-right">
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-none">
            #{table.tableNumber}
          </div>
          <div className="flex items-center justify-end gap-1 text-xs text-slate-500 dark:text-blue-200/70 font-semibold mt-1">
            <Users className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
            <span>{table.capacity || 4}p</span>
          </div>
        </div>
      </div>

      {/* --- BOTTOM: ZONE TAG, ACTION BUTTON & ARROW BUTTON --- */}
      <div className="pt-2 border-t border-slate-100 dark:border-blue-900/30 flex items-center justify-between relative gap-2">
        {/* Floor Zone Tag */}
        <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-blue-200/80 font-medium truncate max-w-[95px]">
          {getZoneIcon(table.area?.name)}
          <span className="truncate">{table.area?.name || 'Main Dining Hall'}</span>
        </div>

        {/* If table is marked as PAID, direct 1-click button to reset to AVAILABLE */}
        {isPaidPending && (
          <button
            type="button"
            disabled={actionPending}
            onClick={(e) => {
              e.stopPropagation();
              onChangeStatus(table.id, 'AVAILABLE');
            }}
            className="px-2.5 py-1 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-sm transition active:scale-95 cursor-pointer shrink-0"
            title="Reset table to Available for new guests"
          >
            <Check className="w-3 h-3 stroke-[3]" />
            <span>Make Available</span>
          </button>
        )}

        {/* Circular Arrow Button with Popover */}
        <div className="relative arrow-menu-container">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleArrow();
            }}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-xs cursor-pointer ${
              isArrowOpen
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 scale-105'
                : 'bg-slate-100 hover:bg-blue-600 hover:text-white border border-slate-200 text-slate-700 dark:bg-[#162045] dark:hover:bg-blue-600 dark:border-blue-500/40 dark:text-white'
            }`}
            title="Table Actions: Change Status & View Barcode"
          >
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Quick Actions Dropdown Popover */}
          {isArrowOpen && (
            <div
              className="absolute right-0 bottom-10 w-64 rounded-2xl bg-white dark:bg-[#0f1738]/95 backdrop-blur-xl border border-slate-200 dark:border-blue-500/40 p-3 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 space-y-3"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-blue-900/40">
                <div>
                  <span className="text-xs font-black text-slate-900 dark:text-white">
                    Table #{table.tableNumber}
                  </span>
                  <p className="text-[10px] text-slate-500 dark:text-blue-300/70">Quick Actions</p>
                </div>
                <button
                  onClick={onCloseArrow}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-blue-900/30 text-slate-400 dark:text-blue-300 hover:text-slate-700 dark:hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Action 1: VIEW BARCODE / QR */}
              <button
                onClick={() => {
                  onViewBarcode(table);
                  onCloseArrow();
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-600/25 transition cursor-pointer"
              >
                <QrCode className="w-4 h-4" />
                <span>View Barcode &amp; QR Standee</span>
              </button>

              {/* Action 2: CHANGE STATUS */}
              <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-blue-900/40">
                <span className="text-[10px] font-black text-slate-500 dark:text-blue-200 uppercase tracking-wider block">
                  Change Status
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {/* Set Available */}
                  <button
                    disabled={actionPending}
                    onClick={() => onChangeStatus(table.id, 'AVAILABLE')}
                    className={`px-2 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition ${
                      isAvail
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/30 dark:text-emerald-300 dark:border-emerald-500/50'
                        : 'bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 dark:bg-[#162148] dark:hover:bg-emerald-500/20 dark:text-gray-300 dark:hover:text-emerald-300'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Available</span>
                  </button>

                  {/* Set Occupied */}
                  <button
                    disabled={actionPending}
                    onClick={() => onChangeStatus(table.id, 'OCCUPIED')}
                    className={`px-2 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition ${
                      isOcc
                        ? 'bg-rose-100 text-rose-800 border border-rose-300 dark:bg-red-500/30 dark:text-red-300 dark:border-red-500/50'
                        : 'bg-slate-50 hover:bg-rose-50 text-slate-700 hover:text-rose-700 dark:bg-[#162148] dark:hover:bg-red-500/20 dark:text-gray-300 dark:hover:text-red-300'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span>Occupied</span>
                  </button>

                  {/* Set Paid • Review */}
                  <button
                    disabled={actionPending}
                    onClick={() => {
                      if (isPaidPending) {
                        onReviewPaidPending(table);
                        onCloseArrow();
                      } else {
                        onChangeStatus(table.id, 'PAID_PENDING');
                      }
                    }}
                    className={`px-2 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition ${
                      isPaidPending
                        ? 'bg-purple-100 text-purple-800 border border-purple-300 dark:bg-purple-500/30 dark:text-purple-300 dark:border-purple-500/50'
                        : 'bg-slate-50 hover:bg-purple-50 text-slate-700 hover:text-purple-700 dark:bg-[#162148] dark:hover:bg-purple-500/20 dark:text-gray-300 dark:hover:text-purple-300'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                    <span>Paid • Review</span>
                  </button>

                  {/* Set Cleaning */}
                  <button
                    disabled={actionPending}
                    onClick={() => onChangeStatus(table.id, 'CLEANING')}
                    className={`px-2 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition ${
                      isClean
                        ? 'bg-sky-100 text-sky-800 border border-sky-300 dark:bg-sky-500/30 dark:text-sky-300 dark:border-sky-500/50'
                        : 'bg-slate-50 hover:bg-sky-50 text-slate-700 hover:text-sky-700 dark:bg-[#162148] dark:hover:bg-sky-500/20 dark:text-gray-300 dark:hover:text-sky-300'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-sky-500" />
                    <span>Cleaning</span>
                  </button>
                </div>

                {/* Set Bill Called */}
                <button
                  disabled={actionPending}
                  onClick={() => onChangeStatus(table.id, 'BILL_REQUESTED')}
                  className={`w-full px-2 py-1.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition ${
                    isBill
                      ? 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-500/30 dark:text-amber-300 dark:border-amber-500/50'
                      : 'bg-slate-50 hover:bg-amber-50 text-slate-700 hover:text-amber-700 dark:bg-[#162148] dark:hover:bg-amber-500/20 dark:text-gray-300 dark:hover:text-amber-300'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Bill Called / Settle</span>
                </button>
              </div>

              {/* Extra Table Config */}
              <div className="pt-2 border-t border-slate-100 dark:border-blue-900/40 flex items-center justify-between text-xs">
                <button
                  onClick={() => onEditTable(table)}
                  className="text-slate-600 hover:text-blue-600 dark:text-blue-300 dark:hover:text-white flex items-center gap-1 font-semibold"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Edit Table</span>
                </button>
                <button
                  onClick={() => onDeleteTable(table)}
                  className="text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 flex items-center gap-1 font-semibold"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

