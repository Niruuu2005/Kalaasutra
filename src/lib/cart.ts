// src/lib/cart.ts
// Lightweight local storage cart manager with event-based subscription for React reactivity

export interface CartItem {
  id: string; // Composite unique key: productId + variant combination hash + options hash
  productId: string;
  title: string;
  imageUrl: string | null;
  basePrice: number;
  salePrice: number | null;
  price: number; // unit price after adjustments
  quantity: number;
  selectedVariants: {
    name: string;
    option_name: string;
    price_adjustment: number;
  }[];
  customizationData: Record<string, string>;
}

type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach(listener => listener());
}

export const CartStore = {
  getCart(): CartItem[] {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem('kalaasutra_cart');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  setCart(cart: CartItem[]) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('kalaasutra_cart', JSON.stringify(cart));
      notify();
    } catch (e) {
      console.error('Failed to write cart to localStorage', e);
    }
  },

  addToCart(newItem: Omit<CartItem, 'id'>) {
    const cart = this.getCart();
    
    // Create unique composite key based on product ID, selected variants, and customizations
    const variantStr = newItem.selectedVariants.map(v => `${v.name}:${v.option_name}`).sort().join('|');
    const customStr = Object.entries(newItem.customizationData).map(([k, v]) => `${k}:${v}`).sort().join('|');
    const compositeId = `${newItem.productId}_${variantStr}_${customStr}`;
    
    const existingIndex = cart.findIndex(item => item.id === compositeId);
    
    if (existingIndex > -1) {
      cart[existingIndex].quantity += newItem.quantity;
    } else {
      cart.push({ ...newItem, id: compositeId });
    }
    
    this.setCart(cart);
  },

  removeFromCart(id: string) {
    const cart = this.getCart();
    const updated = cart.filter(item => item.id !== id);
    this.setCart(updated);
  },

  updateQuantity(id: string, quantity: number) {
    if (quantity <= 0) {
      this.removeFromCart(id);
      return;
    }
    const cart = this.getCart();
    const item = cart.find(item => item.id === id);
    if (item) {
      item.quantity = quantity;
      this.setCart(cart);
    }
  },

  clearCart() {
    this.setCart([]);
  },

  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }
};
