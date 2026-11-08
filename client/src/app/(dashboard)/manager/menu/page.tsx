'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import ManagerNav from '@/components/ManagerNav';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Search,
  Check,
  X,
  UtensilsCrossed,
  Layers,
  Image as ImageIcon,
} from 'lucide-react';

interface CategoryItem {
  id: string;
  name: string;
  sortOrder: number;
  menuItems?: any[];
  _count?: { menuItems: number };
}

interface MenuItemData {
  id: string;
  categoryId: string;
  name: string;
  description: string | null;
  price: number | string;
  imageUrl: string | null;
  isAvailable: boolean;
  category?: { id: string; name: string };
}

export default function ManagerMenuPage() {
  const router = useRouter();

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [items, setItems] = useState<MenuItemData[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Category Modals
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [categoryName, setCategoryName] = useState<string>('');
  const [categorySortOrder, setCategorySortOrder] = useState<number>(0);

  const [deletingCategory, setDeletingCategory] = useState<CategoryItem | null>(null);

  // Dish Modals
  const [isItemModalOpen, setIsItemModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<MenuItemData | null>(null);
  const [itemName, setItemName] = useState<string>('');
  const [itemCategoryId, setItemCategoryId] = useState<string>('');
  const [itemPrice, setItemPrice] = useState<string>('');
  const [itemDescription, setItemDescription] = useState<string>('');
  const [itemImageUrl, setItemImageUrl] = useState<string>('');
  const [itemIsAvailable, setItemIsAvailable] = useState<boolean>(true);

  const [deletingItem, setDeletingItem] = useState<MenuItemData | null>(null);

  const [isPending, startTransition] = useTransition();

  const loadData = async () => {
    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('smart_menu_staff_token') : null;
      if (!token) {
        router.push('/login');
        return;
      }

      const [catsData, itemsData] = await Promise.all([
        api.menu.getCategories(),
        api.menu.getItems(),
      ]);

      setCategories(catsData || []);
      setItems(itemsData || []);
    } catch (err) {
      console.error('Failed to load menu catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // --- Category Handlers ---
  const openAddCategory = () => {
    setEditingCategory(null);
    setCategoryName('');
    setCategorySortOrder(categories.length);
    setIsCategoryModalOpen(true);
  };

  const openEditCategory = (cat: CategoryItem) => {
    setEditingCategory(cat);
    setCategoryName(cat.name);
    setCategorySortOrder(cat.sortOrder || 0);
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) return;

    startTransition(async () => {
      try {
        if (editingCategory) {
          await api.menu.updateCategory(editingCategory.id, {
            name: categoryName.trim(),
            sortOrder: Number(categorySortOrder),
          });
        } else {
          await api.menu.createCategory({
            name: categoryName.trim(),
            sortOrder: Number(categorySortOrder),
          });
        }
        setIsCategoryModalOpen(false);
        loadData();
      } catch (err: any) {
        alert(err.message || 'Failed to save category');
      }
    });
  };

  const handleDeleteCategory = () => {
    if (!deletingCategory) return;
    startTransition(async () => {
      try {
        await api.menu.deleteCategory(deletingCategory.id);
        setDeletingCategory(null);
        if (selectedCategoryId === deletingCategory.id) {
          setSelectedCategoryId('ALL');
        }
        loadData();
      } catch (err: any) {
        alert(err.message || 'Failed to delete category');
      }
    });
  };

  // --- Dish Handlers ---
  const openAddItem = () => {
    setEditingItem(null);
    setItemName('');
    setItemCategoryId(selectedCategoryId !== 'ALL' ? selectedCategoryId : (categories[0]?.id || ''));
    setItemPrice('');
    setItemDescription('');
    setItemImageUrl('');
    setItemIsAvailable(true);
    setIsItemModalOpen(true);
  };

  const openEditItem = (item: MenuItemData) => {
    setEditingItem(item);
    setItemName(item.name);
    setItemCategoryId(item.categoryId);
    setItemPrice(item.price.toString());
    setItemDescription(item.description || '');
    setItemImageUrl(item.imageUrl || '');
    setItemIsAvailable(item.isAvailable);
    setIsItemModalOpen(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim() || !itemCategoryId || !itemPrice) {
      alert('Dish Name, Category, and Price are required.');
      return;
    }

    startTransition(async () => {
      try {
        const payload = {
          name: itemName.trim(),
          categoryId: itemCategoryId,
          price: Number(itemPrice),
          description: itemDescription.trim() || undefined,
          imageUrl: itemImageUrl.trim() || undefined,
          isAvailable: itemIsAvailable,
        };

        if (editingItem) {
          await api.menu.updateItem(editingItem.id, payload);
        } else {
          await api.menu.createItem(payload);
        }
        setIsItemModalOpen(false);
        loadData();
      } catch (err: any) {
        alert(err.message || 'Failed to save dish');
      }
    });
  };

  const handleToggleAvailability = (item: MenuItemData) => {
    startTransition(async () => {
      try {
        const nextState = !item.isAvailable;
        // Optimistic UI update
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, isAvailable: nextState } : i))
        );
        await api.menu.toggleAvailability(item.id, nextState);
      } catch (err: any) {
        alert(err.message || 'Failed to toggle availability');
        loadData();
      }
    });
  };

  const handleDeleteItem = () => {
    if (!deletingItem) return;
    startTransition(async () => {
      try {
        await api.menu.deleteItem(deletingItem.id);
        setDeletingItem(null);
        loadData();
      } catch (err: any) {
        alert(err.message || 'Failed to delete dish');
      }
    });
  };

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchesCategory = selectedCategoryId === 'ALL' || item.categoryId === selectedCategoryId;
    const matchesSearch =
      !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0] dark:bg-[#080c1d] dark:from-[#080c1d] dark:to-[#080c1d] text-slate-900 dark:text-gray-100 flex flex-col relative overflow-hidden font-sans transition-colors duration-200">
      {/* Ambient Fluid Glow Waves */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-blue-400/10 dark:bg-blue-600/15 blur-[120px] pointer-events-none" />
      <div className="absolute top-1/4 -right-32 w-96 h-96 rounded-full bg-indigo-400/10 dark:bg-purple-600/10 blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-32 left-1/3 w-[500px] h-[300px] rounded-full bg-sky-400/10 dark:bg-cyan-600/10 blur-[130px] pointer-events-none" />

      {/* Shared Navigation Bar */}
      <ManagerNav onRefresh={loadData} title="Menu & Category Management" />

      <main className="flex-1 max-w-[1440px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6 relative z-10">
        {/* Page Title & Add Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white shadow-md border border-slate-100 dark:bg-[#131b38] dark:border-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 shadow-[0_4px_20px_rgba(37,99,235,0.12)]">
              <BookOpen className="w-7 h-7 text-blue-600 dark:text-blue-400 stroke-[1.75]" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#0f172a] dark:text-white tracking-tight leading-tight">
                Menu &amp; Category Management
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Organize culinary categories, adjust pricing, toggle real-time dish availability, and introduce new menu items.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={openAddItem}
              className="px-5 py-2.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-blue-500/25 active:scale-95 transition cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add New Dish</span>
            </button>
          </div>
        </div>

        {/* Master-Detail Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* LEFT: Category Sidebar */}
          <div className="lg:col-span-1 rounded-3xl bg-white/80 dark:bg-[#0f1738]/90 backdrop-blur-md border border-slate-200/80 dark:border-blue-900/40 p-4 space-y-3 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                Categories ({categories.length})
              </span>
              <button
                onClick={openAddCategory}
                className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/40 text-slate-600 dark:text-slate-300 hover:text-blue-600 transition cursor-pointer"
                title="Add New Category"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              {/* All Dishes Tab */}
              <button
                onClick={() => setSelectedCategoryId('ALL')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                  selectedCategoryId === 'ALL'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 font-semibold'
                }`}
              >
                <span>All Dishes</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    selectedCategoryId === 'ALL'
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {items.length}
                </span>
              </button>

              {/* Categorized List */}
              {categories.map((cat) => {
                const count = items.filter((i) => i.categoryId === cat.id).length;
                const isSelected = selectedCategoryId === cat.id;

                return (
                  <div
                    key={cat.id}
                    className={`group rounded-xl transition flex items-center justify-between px-2 cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 font-bold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 font-semibold'
                    }`}
                  >
                    <button
                      onClick={() => setSelectedCategoryId(cat.id)}
                      className="flex-1 py-2.5 px-1 text-left text-xs truncate flex items-center justify-between pr-2 cursor-pointer"
                    >
                      <span className="truncate">{cat.name}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {count}
                      </span>
                    </button>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditCategory(cat);
                        }}
                        className={`p-1 rounded-md transition ${
                          isSelected
                            ? 'text-white hover:bg-white/20'
                            : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800'
                        }`}
                        title="Edit Category"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingCategory(cat);
                        }}
                        className={`p-1 rounded-md transition ${
                          isSelected
                            ? 'text-white hover:bg-red-500/40'
                            : 'text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-800'
                        }`}
                        title="Delete Category"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT: Dishes Catalog */}
          <div className="lg:col-span-3 space-y-4">
            {/* Search Bar & Stats */}
            <div className="p-3.5 rounded-2xl bg-white/90 dark:bg-[#0f1738]/90 border border-slate-200/80 dark:border-blue-900/40 flex flex-wrap items-center justify-between gap-3 shadow-xs">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search dishes by name or ingredients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 transition"
                />
              </div>

              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Showing <strong className="text-slate-900 dark:text-white font-bold">{filteredItems.length}</strong> dish
                {filteredItems.length !== 1 ? 'es' : ''}
              </span>
            </div>

            {/* Dishes Grid */}
            {loading ? (
              <div className="py-24 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span className="font-semibold">Loading menu items...</span>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="py-20 text-center rounded-3xl bg-white/80 dark:bg-[#0f1738]/60 border border-slate-200 dark:border-blue-900/40 space-y-3">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-600">
                  <UtensilsCrossed className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">No Dishes Found</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  No menu items matched your query or category selection.
                </p>
                <button
                  onClick={openAddItem}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create First Dish</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className={`rounded-2xl border flex flex-col justify-between transition-all duration-200 shadow-[0_4px_20px_rgba(0,0,0,0.04)] overflow-hidden hover:shadow-md ${
                      item.isAvailable
                        ? 'bg-white dark:bg-[#0f1738]/90 border-slate-200/90 dark:border-blue-900/50 hover:border-blue-300 dark:hover:border-blue-700'
                        : 'bg-slate-50 dark:bg-[#0c1024] border-slate-200 dark:border-red-900/30 opacity-75'
                    }`}
                  >
                    <div>
                      {/* Image Preview / Placeholder */}
                      <div className="relative w-full h-44 bg-slate-100 dark:bg-slate-900 overflow-hidden flex items-center justify-center">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60';
                            }}
                          />
                        ) : (
                          <div className="flex flex-col items-center gap-1 text-slate-400">
                            <ImageIcon className="w-8 h-8" />
                            <span className="text-[10px] font-medium">No photo available</span>
                          </div>
                        )}

                        {/* Sold Out Overlay Banner */}
                        {!item.isAvailable && (
                          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center">
                            <span className="px-3.5 py-1.5 rounded-full text-xs font-black bg-rose-600 text-white uppercase tracking-wider shadow-lg">
                              Sold Out
                            </span>
                          </div>
                        )}

                        {/* Price Badge (Bottom-Right overlay: Floating dark squircle badge with bright gold/amber price text) */}
                        <div className="absolute bottom-2.5 right-2.5 px-3 py-1 rounded-xl bg-slate-950/85 backdrop-blur-md border border-slate-800 text-white font-black text-xs shadow-md">
                          <span>{Number(item.price).toLocaleString()}</span>{' '}
                          <span className="text-amber-400 font-bold">ETB</span>
                        </div>
                      </div>

                      {/* Content Section */}
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base truncate">
                              {item.name}
                            </h3>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold block mt-0.5 truncate">
                              {item.category?.name || categories.find((c) => c.id === item.categoryId)?.name || 'Dish'}
                            </span>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => openEditItem(item)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 dark:bg-slate-800/80 dark:hover:bg-blue-900/30 text-slate-500 hover:text-blue-600 dark:text-slate-300 transition cursor-pointer"
                              title="Edit Dish"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeletingItem(item)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 dark:bg-slate-800/80 dark:hover:bg-rose-900/30 text-slate-500 hover:text-rose-600 dark:text-slate-300 transition cursor-pointer"
                              title="Delete Dish"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Description */}
                        {item.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Footer: Live In-Stock Switch */}
                    <div className="px-4 pb-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Inventory Status:</span>
                      <button
                        onClick={() => handleToggleAvailability(item)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
                          item.isAvailable
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100'
                        }`}
                      >
                        {item.isAvailable ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>In Stock</span>
                          </>
                        ) : (
                          <>
                            <X className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                            <span>Sold Out</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* --- CATEGORY ADD / EDIT MODAL --- */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white dark:bg-[#141b36] border border-slate-200 dark:border-blue-900/50 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingCategory ? 'Edit Category' : 'Create New Category'}
              </h3>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-gray-300">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Starters, Main Course, Drinks..."
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-gray-300">Display Order</label>
                <input
                  type="number"
                  value={categorySortOrder}
                  onChange={(e) => setCategorySortOrder(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 transition"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-gray-300 text-xs font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 active:scale-95 transition cursor-pointer"
                >
                  {editingCategory ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- CATEGORY DELETE CONFIRMATION MODAL --- */}
      {deletingCategory && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white dark:bg-[#141b36] border border-slate-200 dark:border-blue-900/50 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete Category?</h3>
            <p className="text-xs text-slate-600 dark:text-gray-300">
              Are you sure you want to delete <strong className="text-slate-900 dark:text-white">{deletingCategory.name}</strong>?
            </p>
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-xs text-rose-700 dark:text-rose-300 font-medium">
              Dishes inside this category must be reassigned or deleted first.
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingCategory(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-gray-300 text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCategory}
                disabled={isPending}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition cursor-pointer shadow-md shadow-rose-500/20"
              >
                Delete Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- DISH ADD / EDIT MODAL --- */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white dark:bg-[#141b36] border border-slate-200 dark:border-blue-900/50 rounded-3xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingItem ? 'Edit Dish' : 'Create New Dish'}
              </h3>
              <button
                onClick={() => setIsItemModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-gray-300">Dish Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Crispy Garlic Wings"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-gray-300">Category *</label>
                  <select
                    required
                    value={itemCategoryId}
                    onChange={(e) => setItemCategoryId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 transition"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-gray-300">Price in ETB *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="320.00"
                    value={itemPrice}
                    onChange={(e) => setItemPrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-gray-300">Image URL</label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={itemImageUrl}
                    onChange={(e) => setItemImageUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 transition"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-gray-300">Description / Ingredients</label>
                <textarea
                  rows={3}
                  placeholder="Fresh chicken wings tossed in garlic herb butter..."
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 transition resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="availCheck"
                  checked={itemIsAvailable}
                  onChange={(e) => setItemIsAvailable(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-blue-600 focus:ring-0 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="availCheck" className="text-xs font-semibold text-slate-700 dark:text-gray-300 cursor-pointer">
                  Available in stock immediately
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsItemModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-gray-300 text-xs font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 active:scale-95 transition cursor-pointer"
                >
                  {editingItem ? 'Save Dish' : 'Create Dish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- DISH DELETE CONFIRMATION MODAL --- */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white dark:bg-[#141b36] border border-slate-200 dark:border-blue-900/50 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete Dish?</h3>
            <p className="text-xs text-slate-600 dark:text-gray-300">
              Are you sure you want to permanently delete <strong className="text-slate-900 dark:text-white">{deletingItem.name}</strong>?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingItem(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-gray-300 text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteItem}
                disabled={isPending}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition cursor-pointer shadow-md shadow-rose-500/20"
              >
                Delete Dish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
