import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Role = "buyer" | "supplier";

export interface SavedAddress {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  postalCode?: string;
}

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  role: Role;
  isOnboarded: boolean;
  buyerProfile?: any;
  supplierProfile?: any;
  wishlist?: string[];
  savedAddress?: SavedAddress;
  isEmailVerified?: boolean;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  setAuth: (user: AuthUser, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (user, token) => set({ user, token }),
      logout: () => {
        set({ user: null, token: null });
        // A cart/wishlist left in localStorage would otherwise leak into the
        // next account that logs in on this browser.
        useCartStore.getState().clear();
        useWishlistStore.getState().clear();
      },
    }),
    { name: "auth-storage" }
  )
);

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  image?: string;
  moq: number;
  stock: number;
  quantity: number;
  // Set when the product has per-size inventory — a size and a non-sized
  // product both key uniquely off (productId, size), so the same product in
  // two different sizes shows up as two separate cart lines.
  size?: string;
}

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  updateQuantity: (productId: string, quantity: number, size?: string) => void;
  removeItem: (productId: string, size?: string) => void;
  clear: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        const existing = get().items.find((i) => i.productId === item.productId && i.size === item.size);
        if (existing) {
          set({
            items: get().items.map((i) =>
              i.productId === item.productId && i.size === item.size
                ? { ...i, quantity: i.quantity + item.quantity }
                : i
            ),
          });
        } else {
          set({ items: [...get().items, item] });
        }
      },
      updateQuantity: (productId, quantity, size) =>
        set({
          items: get().items.map((i) => (i.productId === productId && i.size === size ? { ...i, quantity } : i)),
        }),
      removeItem: (productId, size) =>
        set({ items: get().items.filter((i) => !(i.productId === productId && i.size === size)) }),
      clear: () => set({ items: [] }),
    }),
    { name: "cart-storage" }
  )
);

export type ToastType = "success" | "error" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastState {
  toasts: ToastItem[];
  show: (message: string, type?: ToastType) => void;
  dismiss: (id: string) => void;
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  show: (message, type = "info") => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    set({ toasts: [...get().toasts, { id, type, message }] });
    setTimeout(() => get().dismiss(id), 4000);
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));

export interface WishlistState {
  ids: string[];
  setIds: (ids: string[]) => void;
  add: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      ids: [],
      setIds: (ids) => set({ ids }),
      add: (id) => set({ ids: get().ids.includes(id) ? get().ids : [...get().ids, id] }),
      remove: (id) => set({ ids: get().ids.filter((i) => i !== id) }),
      clear: () => set({ ids: [] }),
    }),
    { name: "wishlist-storage" }
  )
);
