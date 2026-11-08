'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { CartItem, MenuItem } from '../lib/types';
import sound from '../lib/sound';

interface CartContextType {
  items: CartItem[];
  addItem: (item: MenuItem, quantity?: number, notes?: string) => void;
  removeItem: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, delta: number) => void;
  clearCart: () => void;
  orderNotes: string;
  setOrderNotes: (notes: string) => void;
  totalCount: number;
  totalAmount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({
  children,
  tableId,
}: {
  children: React.ReactNode;
  tableId?: string;
}) {
  const storageKey = tableId ? `smart_menu_cart_${tableId}` : 'smart_menu_cart_default';
  const [items, setItems] = useState<CartItem[]>([]);
  const [orderNotes, setOrderNotes] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setItems(JSON.parse(saved));
      }
    } catch {
      // Ignored
    } finally {
      setIsLoaded(true);
    }
  }, [storageKey]);

  // Sync to localStorage
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(items));
    } catch {
      // Ignored
    }
  }, [items, storageKey, isLoaded]);

  const addItem = (menuItem: MenuItem, quantity = 1, notes = '') => {
    setItems((prev) => {
      const index = prev.findIndex((i) => i.menuItem.id === menuItem.id);
      if (index >= 0) {
        const next = [...prev];
        next[index] = {
          ...next[index],
          quantity: next[index].quantity + quantity,
          notes: notes || next[index].notes,
        };
        return next;
      }
      return [...prev, { menuItem, quantity, notes }];
    });
    try {
      sound.playSuccessDing();
    } catch {
      // Handled silently
    }
  };

  const removeItem = (menuItemId: string) => {
    setItems((prev) => prev.filter((i) => i.menuItem.id !== menuItemId));
  };

  const updateQuantity = (menuItemId: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((i) => {
          if (i.menuItem.id === menuItemId) {
            const nextQty = i.quantity + delta;
            return nextQty > 0 ? { ...i, quantity: nextQty } : null;
          }
          return i;
        })
        .filter((i): i is CartItem => i !== null)
    );
  };

  const clearCart = () => {
    setItems([]);
    setOrderNotes('');
    if (typeof window !== 'undefined') {
      localStorage.removeItem(storageKey);
    }
  };

  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const totalAmount = items.reduce(
    (sum, item) => sum + Number(item.menuItem.price) * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        orderNotes,
        setOrderNotes,
        totalCount,
        totalAmount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
