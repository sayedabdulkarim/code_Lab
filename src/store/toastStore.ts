import { create } from 'zustand';

export interface ToastItem {
  id: string;
  title?: string;
  description?: string;
  type: 'default' | 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

interface ToastStore {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  // Convenience methods
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

let toastId = 0;

export const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],

  addToast: (toast) => {
    const id = `toast-${++toastId}`;
    const newToast: ToastItem = {
      ...toast,
      id,
      duration: toast.duration ?? 5000,
    };
    set((state) => ({ toasts: [...state.toasts, newToast] }));
  },

  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },

  clearToasts: () => set({ toasts: [] }),

  success: (title, description) => {
    get().addToast({ title, description, type: 'success' });
  },

  error: (title, description) => {
    get().addToast({ title, description, type: 'error', duration: 8000 });
  },

  warning: (title, description) => {
    get().addToast({ title, description, type: 'warning' });
  },

  info: (title, description) => {
    get().addToast({ title, description, type: 'info' });
  },
}));
