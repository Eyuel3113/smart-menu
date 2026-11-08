'use client';

import React from 'react';
import { Area, Table } from '@/lib/types';
import { Layers, Search } from 'lucide-react';

interface FilterBarProps {
  tables: Table[];
  areas: Area[];
  selectedAreaId: string;
  onSelectArea: (areaId: string) => void;
  onManageZones: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export default function FilterBar({
  tables,
  areas,
  selectedAreaId,
  onSelectArea,
  onManageZones,
  searchQuery,
  onSearchChange,
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
      {/* Left Zone Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => onSelectArea('ALL')}
          className={`px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
            selectedAreaId === 'ALL'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 dark:bg-gradient-to-r dark:from-[#06b6d4] dark:to-[#2563eb] dark:shadow-[0_0_15px_rgba(6,182,212,0.4)]'
              : 'bg-slate-100 hover:bg-slate-200/80 border border-slate-200/80 text-slate-700 dark:bg-[#0e1633]/80 dark:hover:bg-[#162148] dark:border-blue-900/50 dark:text-gray-300 font-medium'
          }`}
        >
          All Zones ({tables.length})
        </button>

        {areas.map((area) => {
          const count = tables.filter((t) => t.areaId === area.id).length;
          const isSelected = selectedAreaId === area.id;
          return (
            <button
              key={area.id}
              onClick={() => onSelectArea(area.id)}
              className={`px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 dark:bg-gradient-to-r dark:from-[#06b6d4] dark:to-[#2563eb] dark:shadow-[0_0_15px_rgba(6,182,212,0.4)] font-bold'
                  : 'bg-slate-100 hover:bg-slate-200/80 border border-slate-200/80 text-slate-700 dark:bg-[#0e1633]/80 dark:hover:bg-[#162148] dark:border-blue-900/50 dark:text-gray-300 font-medium'
              }`}
            >
              <span>{area.name}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  isSelected
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200 text-slate-700 dark:bg-blue-950 dark:text-blue-300'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Right Tools: Manage Zones & Search */}
      <div className="flex items-center gap-3">
        <button
          onClick={onManageZones}
          className="bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-700 dark:bg-[#0e1633]/90 dark:hover:bg-[#162148] dark:border-blue-900/60 dark:text-gray-200 font-bold rounded-full px-4 py-2 text-xs flex items-center gap-2 shadow-xs dark:shadow-sm transition cursor-pointer"
        >
          <Layers className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
          <span>Manage Zones</span>
        </button>

        <div className="h-6 w-px bg-slate-200 dark:bg-blue-900/60 hidden sm:block" />

        {/* Search Input */}
        <div className="relative w-44 sm:w-56">
          <Search className="w-3.5 h-3.5 text-slate-400 dark:text-blue-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tables..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 rounded-full bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 shadow-xs focus:outline-hidden focus:border-blue-500 dark:bg-[#0a1026]/90 dark:border-blue-900/60 dark:text-white dark:placeholder-blue-300/40 dark:focus:border-blue-500 transition"
          />
        </div>
      </div>
    </div>
  );
}

