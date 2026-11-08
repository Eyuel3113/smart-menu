'use client';

import React from 'react';
import api from '@/lib/api';
import { ShoppingBag, X, Plus, Minus, Trash2, Sparkles, BellRing } from 'lucide-react';

export interface CartSheetItem {
  menuItem: {
    id: string;
    name: string;
    price: number | string;
    imageUrl?: string | null;
  };
  quantity: number;
  notes?: string;
}

export interface CartSheetProps {
  isOpen: boolean;
  onClose: () => void;
  tableId: string;
  tableNumber?: number;
  currency?: string;
  cartItems: CartSheetItem[];
  totalAmount: number;
  orderNotes?: string;
  setOrderNotes?: (notes: string) => void;
  updateQuantity?: (menuItemId: string, quantity: number) => void;
  removeItem?: (menuItemId: string) => void;
  onCheckout: () => void;
  isOrdering?: boolean;
  onCallWaiter?: () => void;
}

export default function CartSheet({
  isOpen,
  onClose,
  tableId,
  tableNumber = 1,
  currency = 'ETB',
  cartItems,
  totalAmount,
  orderNotes = '',
  setOrderNotes,
  updateQuantity,
  removeItem,
  onCheckout,
  isOrdering = false,
  onCallWaiter,
}: CartSheetProps) {
  if (!isOpen) return null;

  const handleCallWaiterInternal = async () => {
    if (onCallWaiter) {
      onCallWaiter();
      return;
    }
    try {
      await api.service.create(tableId, 'CALL_WAITER');
      alert('Waiter has been summoned to your table!');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to call waiter');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#161924] border-l border-gray-800 flex flex-col h-full shadow-2xl">
        {/* Sheet Top */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-white text-base">Your Order Tray</h3>
            <span className="text-xs text-gray-400">({cartItems.length} items)</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sheet Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cartItems.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center space-y-3">
              <ShoppingBag className="w-12 h-12 text-gray-600" />
              <p className="text-sm font-semibold text-gray-400">Your order tray is currently empty</p>
            </div>
          ) : (
            cartItems.map((item) => (
              <div
                key={item.menuItem.id}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-900/60 border border-gray-800"
              >
                <div className="flex-1 pr-3">
                  <h4 className="font-bold text-sm text-white">{item.menuItem.name}</h4>
                  <span className="text-xs text-amber-400 font-semibold">
                    {Number(item.menuItem.price).toLocaleString()} {currency}
                  </span>
                  {item.notes && (
                    <p className="text-[11px] text-gray-400 italic mt-0.5">&ldquo;{item.notes}&rdquo;</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {updateQuantity && (
                    <>
                      <button
                        onClick={() => updateQuantity(item.menuItem.id, item.quantity - 1)}
                        className="w-7 h-7 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 flex items-center justify-center text-xs transition"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs font-bold text-white w-4 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.menuItem.id, item.quantity + 1)}
                        className="w-7 h-7 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 flex items-center justify-center text-xs transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                  {removeItem && (
                    <button
                      onClick={() => removeItem(item.menuItem.id)}
                      className="ml-1 p-1.5 text-gray-500 hover:text-red-400 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}

          {/* Special Instructions Note */}
          {setOrderNotes && (
            <div className="pt-2">
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                Kitchen Notes / Dietary Requests
              </label>
              <textarea
                rows={2}
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder="e.g. Extra napkins, no spicy mitmita, please..."
                className="w-full px-3 py-2 text-xs bg-gray-900 border border-gray-800 rounded-xl text-gray-200 placeholder-gray-600 focus:outline-hidden focus:border-amber-500 transition"
              />
            </div>
          )}
        </div>

        {/* Sheet Footer Checkout */}
        <div className="p-5 border-t border-gray-800 bg-[#141720] space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Total Payable</span>
            <span className="text-xl font-black text-amber-400">
              {totalAmount.toLocaleString()} {currency}
            </span>
          </div>

          {/* Primary Action Button: Place Order */}
          <button
            disabled={isOrdering || cartItems.length === 0}
            onClick={onCheckout}
            className="w-full py-4 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-gray-700 text-gray-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 active:scale-98 transition cursor-pointer"
          >
            {isOrdering ? (
              <>
                <div className="w-4 h-4 border-2 border-gray-950 border-t-transparent rounded-full animate-spin" />
                <span>Placing Order with Kitchen...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Place Order & Send to Kitchen &rarr;</span>
              </>
            )}
          </button>

          {/* Secondary Button: Need assistance first? [Call Waiter] */}
          <div className="text-center pt-1">
            <button
              type="button"
              onClick={handleCallWaiterInternal}
              className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-amber-400 transition cursor-pointer py-1.5 px-3 rounded-lg hover:bg-gray-800/60"
            >
              <BellRing className="w-3.5 h-3.5 text-amber-400" />
              <span>Need assistance first? <strong className="text-amber-400 underline decoration-amber-400/50 underline-offset-2">Call Waiter</strong></span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
