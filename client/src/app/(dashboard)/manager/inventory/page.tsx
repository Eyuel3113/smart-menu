'use client';

import React, { useState, useEffect, useMemo } from 'react';
import ManagerNav from '@/components/ManagerNav';
import {
  Boxes,
  PackagePlus,
  PackageMinus,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  History,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  FileSpreadsheet,
  X,
  Check,
  ShieldAlert,
} from 'lucide-react';

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  currentStock: number;
  minParLevel: number;
  unit: string;
  unitCost: number; // in ETB
  lastRestockedAt: string;
}

export type MovementType = 'STOCK_IN' | 'STOCK_OUT' | 'WASTE' | 'ADJUSTMENT';

export interface StockMovement {
  id: string;
  itemId: string;
  itemName: string;
  type: MovementType;
  quantity: number;
  unit: string;
  previousStock: number;
  newStock: number;
  reason: string;
  performedBy: string;
  createdAt: string;
}

const CATEGORIES = [
  'All Categories',
  'Meat & Poultry',
  'Produce & Veggies',
  'Dairy & Cheese',
  'Beverages & Bar',
  'Bakery & Grains',
  'Spices & Seasoning',
  'Packaging',
];

const INITIAL_ITEMS: InventoryItem[] = [
  {
    id: 'inv-1',
    sku: 'MT-BEEF-01',
    name: 'Prime Beef Cubes (Tibs / Kitfo)',
    category: 'Meat & Poultry',
    currentStock: 28.5,
    minParLevel: 15.0,
    unit: 'kg',
    unitCost: 750,
    lastRestockedAt: new Date(Date.now() - 3600000 * 18).toISOString(),
  },
  {
    id: 'inv-2',
    sku: 'MT-CHKN-02',
    name: 'Fresh Chicken Wings (Skin-on)',
    category: 'Meat & Poultry',
    currentStock: 4.5,
    minParLevel: 12.0,
    unit: 'kg',
    unitCost: 280,
    lastRestockedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
  },
  {
    id: 'inv-3',
    sku: 'DR-CHSE-01',
    name: 'Whole Mozzarella Cheese Block',
    category: 'Dairy & Cheese',
    currentStock: 0.0,
    minParLevel: 8.0,
    unit: 'kg',
    unitCost: 480,
    lastRestockedAt: new Date(Date.now() - 3600000 * 96).toISOString(),
  },
  {
    id: 'inv-4',
    sku: 'DR-BUTR-02',
    name: 'Niter Kibbeh (Clarified Spiced Butter)',
    category: 'Dairy & Cheese',
    currentStock: 14.0,
    minParLevel: 6.0,
    unit: 'kg',
    unitCost: 650,
    lastRestockedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: 'inv-5',
    sku: 'GR-TEFF-01',
    name: 'Magna Teff Grain Flour',
    category: 'Bakery & Grains',
    currentStock: 52.0,
    minParLevel: 25.0,
    unit: 'kg',
    unitCost: 140,
    lastRestockedAt: new Date(Date.now() - 3600000 * 72).toISOString(),
  },
  {
    id: 'inv-6',
    sku: 'SP-MITM-01',
    name: 'Highland Mitmita & Berbere Blend',
    category: 'Spices & Seasoning',
    currentStock: 8.5,
    minParLevel: 4.0,
    unit: 'kg',
    unitCost: 420,
    lastRestockedAt: new Date(Date.now() - 3600000 * 30).toISOString(),
  },
  {
    id: 'inv-7',
    sku: 'BV-COFF-01',
    name: 'Yirgacheffe Green Coffee Beans',
    category: 'Beverages & Bar',
    currentStock: 18.0,
    minParLevel: 10.0,
    unit: 'kg',
    unitCost: 340,
    lastRestockedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    id: 'inv-8',
    sku: 'BV-PASS-02',
    name: 'Tropical Passionfruit Puree',
    category: 'Beverages & Bar',
    currentStock: 3.0,
    minParLevel: 6.0,
    unit: 'liters',
    unitCost: 240,
    lastRestockedAt: new Date(Date.now() - 3600000 * 60).toISOString(),
  },
  {
    id: 'inv-9',
    sku: 'PR-ROSE-01',
    name: 'Fresh Garden Rosemary & Jalapeños',
    category: 'Produce & Veggies',
    currentStock: 1.8,
    minParLevel: 5.0,
    unit: 'kg',
    unitCost: 90,
    lastRestockedAt: new Date(Date.now() - 3600000 * 10).toISOString(),
  },
  {
    id: 'inv-10',
    sku: 'PR-ONIO-02',
    name: 'Red Shallots & Garlic Cloves',
    category: 'Produce & Veggies',
    currentStock: 22.0,
    minParLevel: 12.0,
    unit: 'kg',
    unitCost: 75,
    lastRestockedAt: new Date(Date.now() - 3600000 * 16).toISOString(),
  },
  {
    id: 'inv-11',
    sku: 'PK-BOX-01',
    name: 'Kraft Food Takeout Containers',
    category: 'Packaging',
    currentStock: 160,
    minParLevel: 50,
    unit: 'pcs',
    unitCost: 18,
    lastRestockedAt: new Date(Date.now() - 3600000 * 80).toISOString(),
  },
  {
    id: 'inv-12',
    sku: 'BV-BEER-01',
    name: 'St. George Draft Beer Keg (50L)',
    category: 'Beverages & Bar',
    currentStock: 2,
    minParLevel: 1,
    unit: 'crates',
    unitCost: 2600,
    lastRestockedAt: new Date(Date.now() - 3600000 * 36).toISOString(),
  },
];

const INITIAL_MOVEMENTS: StockMovement[] = [
  {
    id: 'mov-1',
    itemId: 'inv-1',
    itemName: 'Prime Beef Cubes (Tibs / Kitfo)',
    type: 'STOCK_IN',
    quantity: 20,
    unit: 'kg',
    previousStock: 8.5,
    newStock: 28.5,
    reason: 'Weekly Butcher Delivery - Invoice #8841',
    performedBy: 'Dawit (Head Chef)',
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
  },
  {
    id: 'mov-2',
    itemId: 'inv-2',
    itemName: 'Fresh Chicken Wings (Skin-on)',
    type: 'STOCK_OUT',
    quantity: 8,
    unit: 'kg',
    previousStock: 12.5,
    newStock: 4.5,
    reason: 'Dinner Rush Kitchen Prep',
    performedBy: 'Robel (Cook)',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'mov-3',
    itemId: 'inv-3',
    itemName: 'Whole Mozzarella Cheese Block',
    type: 'STOCK_OUT',
    quantity: 4.5,
    unit: 'kg',
    previousStock: 4.5,
    newStock: 0.0,
    reason: 'Pizza Station Shift Prep',
    performedBy: 'Michael (Pizzaiolo)',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'mov-4',
    itemId: 'inv-9',
    itemName: 'Fresh Garden Rosemary & Jalapeños',
    type: 'WASTE',
    quantity: 1.2,
    unit: 'kg',
    previousStock: 3.0,
    newStock: 1.8,
    reason: 'Produce Spoilage / Wilted Herbs',
    performedBy: 'Dawit (Head Chef)',
    createdAt: new Date(Date.now() - 3600000 * 10).toISOString(),
  },
];

export default function ManagerInventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('smart_menu_inventory_items');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return INITIAL_ITEMS;
  });

  const [movements, setMovements] = useState<StockMovement[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('smart_menu_stock_movements');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return INITIAL_MOVEMENTS;
  });

  // Save to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem('smart_menu_inventory_items', JSON.stringify(items));
    } catch {}
  }, [items]);

  useEffect(() => {
    try {
      localStorage.setItem('smart_menu_stock_movements', JSON.stringify(movements));
    } catch {}
  }, [movements]);

  // Tab & Filters
  const [activeTab, setActiveTab] = useState<'ITEMS' | 'MOVEMENTS'>('ITEMS');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'>('ALL');
  const [selectedMovementFilter, setSelectedMovementFilter] = useState<'ALL' | MovementType>('ALL');

  // Modals
  const [stockInModalOpen, setStockInModalOpen] = useState(false);
  const [stockOutModalOpen, setStockOutModalOpen] = useState(false);
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  // Form States - Stock In
  const [stockInItemId, setStockInItemId] = useState(items[0]?.id || '');
  const [stockInQty, setStockInQty] = useState('');
  const [stockInCost, setStockInCost] = useState('');
  const [stockInNote, setStockInNote] = useState('');
  const [stockInStaff, setStockInStaff] = useState('Manager (Admin)');

  // Form States - Stock Out
  const [stockOutItemId, setStockOutItemId] = useState(items[0]?.id || '');
  const [stockOutQty, setStockOutQty] = useState('');
  const [stockOutType, setStockOutType] = useState<'STOCK_OUT' | 'WASTE'>('STOCK_OUT');
  const [stockOutReason, setStockOutReason] = useState('Kitchen Prep - Daily Service');
  const [stockOutStaff, setStockOutStaff] = useState('Kitchen Staff');

  // Form States - Item Create / Edit
  const [formSku, setFormSku] = useState('');
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Meat & Poultry');
  const [formCurrentStock, setFormCurrentStock] = useState('');
  const [formMinPar, setFormMinPar] = useState('');
  const [formUnit, setFormUnit] = useState('kg');
  const [formUnitCost, setFormUnitCost] = useState('');

  // KPIs
  const totalValue = useMemo(() => {
    return items.reduce((sum, item) => sum + item.currentStock * item.unitCost, 0);
  }, [items]);

  const totalItemsCount = items.length;

  const lowStockItems = useMemo(() => {
    return items.filter((i) => i.currentStock > 0 && i.currentStock <= i.minParLevel);
  }, [items]);

  const outOfStockItems = useMemo(() => {
    return items.filter((i) => i.currentStock <= 0);
  }, [items]);

  // Filtered Items Catalog
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat =
        selectedCategory === 'All Categories' || item.category === selectedCategory;

      let matchStatus = true;
      if (selectedStatus === 'OUT_OF_STOCK') matchStatus = item.currentStock <= 0;
      else if (selectedStatus === 'LOW_STOCK')
        matchStatus = item.currentStock > 0 && item.currentStock <= item.minParLevel;
      else if (selectedStatus === 'IN_STOCK')
        matchStatus = item.currentStock > item.minParLevel;

      return matchSearch && matchCat && matchStatus;
    });
  }, [items, searchQuery, selectedCategory, selectedStatus]);

  // Filtered Movements
  const filteredMovements = useMemo(() => {
    return movements.filter((mov) => {
      if (selectedMovementFilter !== 'ALL' && mov.type !== selectedMovementFilter)
        return false;
      return true;
    });
  }, [movements, selectedMovementFilter]);

  // Handler: Stock In Submit
  const handleStockInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(stockInQty);
    if (!qty || qty <= 0) return;

    const targetItem = items.find((i) => i.id === stockInItemId);
    if (!targetItem) return;

    const prevStock = targetItem.currentStock;
    const newStock = prevStock + qty;

    // Update item
    setItems((prev) =>
      prev.map((i) =>
        i.id === stockInItemId
          ? {
              ...i,
              currentStock: newStock,
              unitCost: stockInCost ? parseFloat(stockInCost) : i.unitCost,
              lastRestockedAt: new Date().toISOString(),
            }
          : i
      )
    );

    // Record movement
    const newMov: StockMovement = {
      id: `mov-${Date.now()}`,
      itemId: targetItem.id,
      itemName: targetItem.name,
      type: 'STOCK_IN',
      quantity: qty,
      unit: targetItem.unit,
      previousStock: prevStock,
      newStock,
      reason: stockInNote || 'Supplier Restock Delivery',
      performedBy: stockInStaff || 'Manager',
      createdAt: new Date().toISOString(),
    };

    setMovements((prev) => [newMov, ...prev]);

    // Reset and close
    setStockInQty('');
    setStockInCost('');
    setStockInNote('');
    setStockInModalOpen(false);
  };

  // Handler: Stock Out Submit
  const handleStockOutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(stockOutQty);
    if (!qty || qty <= 0) return;

    const targetItem = items.find((i) => i.id === stockOutItemId);
    if (!targetItem) return;

    const prevStock = targetItem.currentStock;
    const newStock = Math.max(0, prevStock - qty);

    // Update item
    setItems((prev) =>
      prev.map((i) => (i.id === stockOutItemId ? { ...i, currentStock: newStock } : i))
    );

    // Record movement
    const newMov: StockMovement = {
      id: `mov-${Date.now()}`,
      itemId: targetItem.id,
      itemName: targetItem.name,
      type: stockOutType,
      quantity: qty,
      unit: targetItem.unit,
      previousStock: prevStock,
      newStock,
      reason: stockOutReason || 'Kitchen Usage',
      performedBy: stockOutStaff || 'Kitchen Staff',
      createdAt: new Date().toISOString(),
    };

    setMovements((prev) => [newMov, ...prev]);

    // Reset and close
    setStockOutQty('');
    setStockOutModalOpen(false);
  };

  // Quick adjust (+/- 1 unit) directly from table
  const handleQuickAdjust = (itemId: string, delta: number) => {
    const targetItem = items.find((i) => i.id === itemId);
    if (!targetItem) return;

    const prevStock = targetItem.currentStock;
    const newStock = Math.max(0, prevStock + delta);

    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, currentStock: newStock } : i))
    );

    const newMov: StockMovement = {
      id: `mov-${Date.now()}`,
      itemId: targetItem.id,
      itemName: targetItem.name,
      type: delta > 0 ? 'STOCK_IN' : 'STOCK_OUT',
      quantity: Math.abs(delta),
      unit: targetItem.unit,
      previousStock: prevStock,
      newStock,
      reason: `Quick Adjust (${delta > 0 ? '+1' : '-1'})`,
      performedBy: 'Manager',
      createdAt: new Date().toISOString(),
    };

    setMovements((prev) => [newMov, ...prev]);
  };

  // Handler: Create or Edit Item Submit
  const handleItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName) return;

    if (editingItem) {
      // Edit
      setItems((prev) =>
        prev.map((i) =>
          i.id === editingItem.id
            ? {
                ...i,
                sku: formSku || i.sku,
                name: formName,
                category: formCategory,
                currentStock: parseFloat(formCurrentStock) || 0,
                minParLevel: parseFloat(formMinPar) || 0,
                unit: formUnit,
                unitCost: parseFloat(formUnitCost) || 0,
              }
            : i
        )
      );
    } else {
      // Create new
      const newItem: InventoryItem = {
        id: `inv-${Date.now()}`,
        sku: formSku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
        name: formName,
        category: formCategory,
        currentStock: parseFloat(formCurrentStock) || 0,
        minParLevel: parseFloat(formMinPar) || 5,
        unit: formUnit,
        unitCost: parseFloat(formUnitCost) || 100,
        lastRestockedAt: new Date().toISOString(),
      };
      setItems((prev) => [newItem, ...prev]);
    }

    setItemModalOpen(false);
    setEditingItem(null);
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setFormSku(`SKU-${Math.floor(1000 + Math.random() * 9000)}`);
    setFormName('');
    setFormCategory('Meat & Poultry');
    setFormCurrentStock('10');
    setFormMinPar('5');
    setFormUnit('kg');
    setFormUnitCost('250');
    setItemModalOpen(true);
  };

  const openEditModal = (item: InventoryItem) => {
    setEditingItem(item);
    setFormSku(item.sku);
    setFormName(item.name);
    setFormCategory(item.category);
    setFormCurrentStock(item.currentStock.toString());
    setFormMinPar(item.minParLevel.toString());
    setFormUnit(item.unit);
    setFormUnitCost(item.unitCost.toString());
    setItemModalOpen(true);
  };

  const handleDeleteItem = (itemId: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}" from inventory?`)) {
      setItems((prev) => prev.filter((i) => i.id !== itemId));
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#070b1e] text-slate-900 dark:text-white font-sans transition-colors duration-200 pb-28">
      {/* 1. TOP MANAGER NAVIGATION */}
      <ManagerNav onRefresh={() => {}} title="Inventory" />

      <main className="max-w-7xl mx-auto px-4 sm:px-8 pt-6 space-y-6">
        {/* 2. HEADER TITLE & QUICK ACTIONS ROW */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <Boxes className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              <span>Inventory & Raw Materials</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Real-time ingredient tracking, stock movements, supplier receipts & automated par-level alerts
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Quick Stock In Button */}
            <button
              onClick={() => setStockInModalOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-600/25 transition active:scale-95 cursor-pointer"
            >
              <PackagePlus className="w-4 h-4" />
              <span>Stock In (Receive)</span>
            </button>

            {/* Quick Stock Out / Waste Button */}
            <button
              onClick={() => setStockOutModalOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-rose-600/25 transition active:scale-95 cursor-pointer"
            >
              <PackageMinus className="w-4 h-4" />
              <span>Stock Out / Waste</span>
            </button>

            {/* Add New Item Button */}
            <button
              onClick={openCreateModal}
              className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-blue-600/25 transition active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Ingredient</span>
            </button>
          </div>
        </div>

        {/* 3. INVENTORY KPIS SUMMARY (4 CARDS) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* KPI 1: Total Stock Value */}
          <div className="bg-white dark:bg-[#0f1738]/90 rounded-3xl p-5 border border-slate-100 dark:border-blue-900/40 shadow-[0_4px_25px_rgba(0,0,0,0.03)] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-blue-300">Total Stock Value</span>
              <div className="w-9 h-9 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-800/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {totalValue.toLocaleString()} <span className="text-xs font-bold text-slate-400">ETB</span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Assets currently in kitchen pantry</p>
          </div>

          {/* KPI 2: Total Tracked Items */}
          <div className="bg-white dark:bg-[#0f1738]/90 rounded-3xl p-5 border border-slate-100 dark:border-blue-900/40 shadow-[0_4px_25px_rgba(0,0,0,0.03)] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-blue-300">Tracked SKUs</span>
              <div className="w-9 h-9 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {totalItemsCount} <span className="text-xs font-bold text-slate-400">Items</span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Across all bar and pantry categories</p>
          </div>

          {/* KPI 3: Low Stock Warning */}
          <div
            onClick={() => {
              setSelectedStatus('LOW_STOCK');
              setActiveTab('ITEMS');
            }}
            className="bg-white dark:bg-[#0f1738]/90 rounded-3xl p-5 border border-slate-100 dark:border-blue-900/40 shadow-[0_4px_25px_rgba(0,0,0,0.03)] space-y-2 cursor-pointer hover:border-amber-400 transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-blue-300">Low Stock Alert</span>
              <div className="w-9 h-9 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-100 dark:border-amber-800/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400">
              {lowStockItems.length} <span className="text-xs font-bold text-amber-500/80">Near Minimum</span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Needs purchase reorder soon</p>
          </div>

          {/* KPI 4: Out of Stock Critical */}
          <div
            onClick={() => {
              setSelectedStatus('OUT_OF_STOCK');
              setActiveTab('ITEMS');
            }}
            className="bg-white dark:bg-[#0f1738]/90 rounded-3xl p-5 border border-slate-100 dark:border-blue-900/40 shadow-[0_4px_25px_rgba(0,0,0,0.03)] space-y-2 cursor-pointer hover:border-rose-400 transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-blue-300">Out of Stock</span>
              <div className="w-9 h-9 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-100 dark:border-rose-800/40 flex items-center justify-center text-rose-600 dark:text-rose-400">
                <ShieldAlert className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400">
              {outOfStockItems.length} <span className="text-xs font-bold text-rose-500/80">Critical (0)</span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Temporarily unavailable for kitchen</p>
          </div>
        </div>

        {/* 4. PRIMARY VIEW TABS (CATALOG vs AUDIT TRAIL) */}
        <div className="flex items-center gap-3 border-b border-slate-200 dark:border-blue-900/40 pb-2">
          <button
            onClick={() => setActiveTab('ITEMS')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'ITEMS'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                : 'text-slate-600 dark:text-blue-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-blue-900/20'
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>Inventory Items Catalog ({items.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('MOVEMENTS')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'MOVEMENTS'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                : 'text-slate-600 dark:text-blue-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-blue-900/20'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Stock Movements & Audit Trail ({movements.length})</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: INVENTORY ITEMS CATALOG */}
        {/* ========================================================================= */}
        {activeTab === 'ITEMS' && (
          <div className="space-y-4">
            {/* Filter & Search Bar */}
            <div className="bg-white dark:bg-[#0f1738]/90 rounded-3xl p-4 border border-slate-100 dark:border-blue-900/40 shadow-[0_4px_25px_rgba(0,0,0,0.03)] flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Search input */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search ingredient by name or SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30"
                />
              </div>

              {/* Status Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {(['ALL', 'IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setSelectedStatus(st)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                      selectedStatus === st
                        ? st === 'OUT_OF_STOCK'
                          ? 'bg-rose-600 text-white'
                          : st === 'LOW_STOCK'
                          ? 'bg-amber-500 text-white'
                          : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                        : 'bg-slate-100 dark:bg-blue-900/30 text-slate-600 dark:text-blue-200 hover:bg-slate-200'
                    }`}
                  >
                    {st === 'ALL'
                      ? 'All'
                      : st === 'IN_STOCK'
                      ? 'In Stock'
                      : st === 'LOW_STOCK'
                      ? `Low Stock (${lowStockItems.length})`
                      : `Out of Stock (${outOfStockItems.length})`}
                  </button>
                ))}
              </div>

              {/* Category Dropdown */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-blue-200 focus:outline-hidden cursor-pointer"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Inventory Items Table Card */}
            <div className="bg-white dark:bg-[#0f1738]/90 rounded-3xl border border-slate-100 dark:border-blue-900/40 shadow-[0_4px_25px_rgba(0,0,0,0.03)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-blue-950/40 text-slate-500 dark:text-blue-300/80 font-bold uppercase tracking-wider border-b border-slate-100 dark:border-blue-900/40">
                    <tr>
                      <th className="py-3.5 px-4 sm:px-6">Item & SKU</th>
                      <th className="py-3.5 px-4">Category</th>
                      <th className="py-3.5 px-4">Stock Level</th>
                      <th className="py-3.5 px-4">Unit Cost</th>
                      <th className="py-3.5 px-4">Total Value</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-blue-900/30 font-medium">
                    {filteredItems.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-slate-400">
                          No inventory items match your search filters.
                        </td>
                      </tr>
                    ) : (
                      filteredItems.map((item) => {
                        const isOutOfStock = item.currentStock <= 0;
                        const isLowStock =
                          item.currentStock > 0 && item.currentStock <= item.minParLevel;
                        const stockPercent = Math.min(
                          100,
                          Math.round((item.currentStock / (item.minParLevel * 2)) * 100)
                        );

                        return (
                          <tr
                            key={item.id}
                            className="hover:bg-slate-50/70 dark:hover:bg-blue-900/10 transition"
                          >
                            {/* 1. Item Name & SKU */}
                            <td className="py-4 px-4 sm:px-6">
                              <div className="font-bold text-slate-900 dark:text-white text-sm">
                                {item.name}
                              </div>
                              <div className="text-[11px] font-mono text-blue-600 dark:text-blue-400">
                                {item.sku}
                              </div>
                            </td>

                            {/* 2. Category */}
                            <td className="py-4 px-4">
                              <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-blue-950/60 text-slate-700 dark:text-blue-300 font-semibold text-[11px]">
                                {item.category}
                              </span>
                            </td>

                            {/* 3. Stock Level with Bar */}
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`font-black text-sm ${
                                    isOutOfStock
                                      ? 'text-rose-600 dark:text-rose-400'
                                      : isLowStock
                                      ? 'text-amber-600 dark:text-amber-400'
                                      : 'text-slate-900 dark:text-white'
                                  }`}
                                >
                                  {item.currentStock} {item.unit}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  (Min: {item.minParLevel})
                                </span>
                              </div>
                              {/* Visual Progress Bar */}
                              <div className="w-28 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-1.5">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    isOutOfStock
                                      ? 'bg-rose-500 w-0'
                                      : isLowStock
                                      ? 'bg-amber-500'
                                      : 'bg-emerald-500'
                                  }`}
                                  style={{ width: `${stockPercent}%` }}
                                />
                              </div>
                            </td>

                            {/* 4. Unit Cost */}
                            <td className="py-4 px-4 font-bold text-slate-700 dark:text-slate-300">
                              {item.unitCost.toLocaleString()} ETB
                            </td>

                            {/* 5. Total Value */}
                            <td className="py-4 px-4 font-extrabold text-blue-600 dark:text-blue-400">
                              {(item.currentStock * item.unitCost).toLocaleString()} ETB
                            </td>

                            {/* 6. Status Badge */}
                            <td className="py-4 px-4">
                              {isOutOfStock ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800/40">
                                  <XCircle className="w-3 h-3" />
                                  <span>OUT OF STOCK</span>
                                </span>
                              ) : isLowStock ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800/40">
                                  <AlertTriangle className="w-3 h-3" />
                                  <span>LOW STOCK</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/40">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>IN STOCK</span>
                                </span>
                              )}
                            </td>

                            {/* 7. Quick Increment/Decrement & Actions */}
                            <td className="py-4 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* Quick +1 */}
                                <button
                                  type="button"
                                  onClick={() => handleQuickAdjust(item.id, 1)}
                                  className="w-7 h-7 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center justify-center font-black transition cursor-pointer"
                                  title="Quick Add +1"
                                >
                                  +1
                                </button>

                                {/* Quick -1 */}
                                <button
                                  type="button"
                                  disabled={item.currentStock <= 0}
                                  onClick={() => handleQuickAdjust(item.id, -1)}
                                  className="w-7 h-7 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center font-black transition cursor-pointer"
                                  title="Quick Use -1"
                                >
                                  -1
                                </button>

                                {/* Edit Button */}
                                <button
                                  type="button"
                                  onClick={() => openEditModal(item)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-white transition cursor-pointer"
                                  title="Edit Item"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>

                                {/* Delete Button */}
                                <button
                                  type="button"
                                  onClick={() => handleDeleteItem(item.id, item.name)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 transition cursor-pointer"
                                  title="Delete Item"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: STOCK MOVEMENTS AUDIT TRAIL LEDGER */}
        {/* ========================================================================= */}
        {activeTab === 'MOVEMENTS' && (
          <div className="space-y-4">
            {/* Filter Buttons */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              {(['ALL', 'STOCK_IN', 'STOCK_OUT', 'WASTE', 'ADJUSTMENT'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setSelectedMovementFilter(filter)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                    selectedMovementFilter === filter
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white dark:bg-[#0f1738] text-slate-600 dark:text-blue-200 border border-slate-200 dark:border-blue-900/40 hover:bg-slate-100'
                  }`}
                >
                  {filter.replace('_', ' ')}
                </button>
              ))}
            </div>

            {/* Audit Table */}
            <div className="bg-white dark:bg-[#0f1738]/90 rounded-3xl border border-slate-100 dark:border-blue-900/40 shadow-[0_4px_25px_rgba(0,0,0,0.03)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-blue-950/40 text-slate-500 dark:text-blue-300/80 font-bold uppercase tracking-wider border-b border-slate-100 dark:border-blue-900/40">
                    <tr>
                      <th className="py-3.5 px-4 sm:px-6">Timestamp</th>
                      <th className="py-3.5 px-4">Item</th>
                      <th className="py-3.5 px-4">Type</th>
                      <th className="py-3.5 px-4">Quantity</th>
                      <th className="py-3.5 px-4">Balance After</th>
                      <th className="py-3.5 px-4">Reason / Reference</th>
                      <th className="py-3.5 px-4">Recorded By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-blue-900/30 font-medium">
                    {filteredMovements.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-slate-400">
                          No movements logged for this filter.
                        </td>
                      </tr>
                    ) : (
                      filteredMovements.map((mov) => {
                        const isStockIn = mov.type === 'STOCK_IN';
                        const isWaste = mov.type === 'WASTE';

                        return (
                          <tr
                            key={mov.id}
                            className="hover:bg-slate-50/70 dark:hover:bg-blue-900/10 transition"
                          >
                            <td className="py-3.5 px-4 sm:px-6 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                              {new Date(mov.createdAt).toLocaleDateString()}{' '}
                              <span className="text-slate-400 font-mono">
                                {new Date(mov.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </td>

                            <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                              {mov.itemName}
                            </td>

                            <td className="py-3.5 px-4">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                                  isStockIn
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300'
                                    : isWaste
                                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300'
                                    : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300'
                                }`}
                              >
                                {isStockIn ? (
                                  <ArrowUpRight className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <ArrowDownRight className="w-3 h-3 text-rose-600" />
                                )}
                                <span>{mov.type.replace('_', ' ')}</span>
                              </span>
                            </td>

                            <td className="py-3.5 px-4">
                              <span
                                className={`font-black text-sm ${
                                  isStockIn
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-rose-600 dark:text-rose-400'
                                }`}
                              >
                                {isStockIn ? '+' : '-'}
                                {mov.quantity} {mov.unit}
                              </span>
                            </td>

                            <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200">
                              {mov.newStock} {mov.unit}
                            </td>

                            <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                              {mov.reason}
                            </td>

                            <td className="py-3.5 px-4 font-semibold text-slate-500 dark:text-slate-400">
                              {mov.performedBy}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* MODAL 1: STOCK IN (RECEIVE SUPPLIES) */}
      {/* ========================================================================= */}
      {stockInModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#0f1738] rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-blue-900/50 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-blue-900/40">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <PackagePlus className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                  Record Stock In (Delivery)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setStockInModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleStockInSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Select Item / Ingredient
                </label>
                <select
                  value={stockInItemId}
                  onChange={(e) => setStockInItemId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-bold"
                >
                  {items.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name} (Current: {i.currentStock} {i.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Quantity Received
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    placeholder="e.g. 15"
                    value={stockInQty}
                    onChange={(e) => setStockInQty(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Unit Cost (ETB, opt)
                  </label>
                  <input
                    type="number"
                    step="1"
                    placeholder="e.g. 750"
                    value={stockInCost}
                    onChange={(e) => setStockInCost(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Supplier / Batch Invoice Reference
                </label>
                <input
                  type="text"
                  placeholder="e.g. Merkato Meat Supplier Inv #392"
                  value={stockInNote}
                  onChange={(e) => setStockInNote(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Received By Staff Member
                </label>
                <input
                  type="text"
                  value={stockInStaff}
                  onChange={(e) => setStockInStaff(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setStockInModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold shadow-md shadow-emerald-600/30 transition cursor-pointer"
                >
                  Confirm Stock In
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: STOCK OUT / WASTE */}
      {/* ========================================================================= */}
      {stockOutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#0f1738] rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-blue-900/50 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-blue-900/40">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <PackageMinus className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                  Record Stock Out / Waste
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setStockOutModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleStockOutSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Select Item / Ingredient
                </label>
                <select
                  value={stockOutItemId}
                  onChange={(e) => setStockOutItemId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-bold"
                >
                  {items.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name} (Available: {i.currentStock} {i.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Quantity Reduced
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    placeholder="e.g. 5"
                    value={stockOutQty}
                    onChange={(e) => setStockOutQty(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Log Category
                  </label>
                  <select
                    value={stockOutType}
                    onChange={(e) => setStockOutType(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-bold"
                  >
                    <option value="STOCK_OUT">Service Consumption</option>
                    <option value="WASTE">Spoilage / Waste</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Reason / Consumption Purpose
                </label>
                <input
                  type="text"
                  placeholder="e.g. Friday Night Dinner Prep, Spoilage, Staff Meal"
                  value={stockOutReason}
                  onChange={(e) => setStockOutReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Logged By Staff
                </label>
                <input
                  type="text"
                  value={stockOutStaff}
                  onChange={(e) => setStockOutStaff(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setStockOutModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold shadow-md shadow-rose-600/30 transition cursor-pointer"
                >
                  Confirm Deduction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: CREATE OR EDIT INVENTORY ITEM */}
      {/* ========================================================================= */}
      {itemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#0f1738] rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-blue-900/50 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-blue-900/40">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Boxes className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                  {editingItem ? 'Edit Inventory Item' : 'New Raw Material / Ingredient'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setItemModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleItemSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Item / Ingredient Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fresh Teff Flour"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    SKU Code
                  </label>
                  <input
                    type="text"
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-bold"
                  >
                    {CATEGORIES.filter((c) => c !== 'All Categories').map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Current Stock
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={formCurrentStock}
                    onChange={(e) => setFormCurrentStock(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Min Par Level
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={formMinPar}
                    onChange={(e) => setFormMinPar(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Unit
                  </label>
                  <select
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-bold"
                  >
                    <option value="kg">kg</option>
                    <option value="liters">liters</option>
                    <option value="pcs">pcs</option>
                    <option value="portions">portions</option>
                    <option value="crates">crates</option>
                    <option value="boxes">boxes</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Unit Cost (ETB)
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  placeholder="e.g. 350"
                  value={formUnitCost}
                  onChange={(e) => setFormUnitCost(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-bold"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setItemModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold shadow-md shadow-blue-600/30 transition cursor-pointer"
                >
                  {editingItem ? 'Save Changes' : 'Create Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
