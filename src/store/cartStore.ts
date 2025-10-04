import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, MenuItem } from '../types';

interface CartState {
  items: CartItem[];
  addItem: (menuItem: MenuItem) => void;
  removeItem: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalAmount: () => number;
  getTotalItems: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (menuItem) => {
        const items = get().items;
        const existingItem = items.find((item) => item.menu_item.id === menuItem.id);

        if (existingItem) {
          set({
            items: items.map((item) =>
              item.menu_item.id === menuItem.id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            ),
          });
        } else {
          set({ items: [...items, { menu_item: menuItem, quantity: 1 }] });
        }
      },
      removeItem: (menuItemId) => {
        set({ items: get().items.filter((item) => item.menu_item.id !== menuItemId) });
      },
      updateQuantity: (menuItemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(menuItemId);
        } else {
          set({
            items: get().items.map((item) =>
              item.menu_item.id === menuItemId ? { ...item, quantity } : item
            ),
          });
        }
      },
      clearCart: () => set({ items: [] }),
      getTotalAmount: () => {
        return get().items.reduce((total, item) => total + item.menu_item.price * item.quantity, 0);
      },
      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },
    }),
    {
      name: 'yuum-cart-storage',
    }
  )
);
