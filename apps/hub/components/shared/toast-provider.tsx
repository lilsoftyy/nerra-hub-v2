'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, Loader2, AlertCircle } from 'lucide-react';

interface Toast {
  id: string;
  title: string;
  description?: string;
  type: 'loading' | 'success' | 'error';
  action?: { label: string; onClick: () => void };
}

interface ToastContextType {
  addToast: (toast: Omit<Toast, 'id'>) => string;
  updateToast: (id: string, updates: Partial<Omit<Toast, 'id'>>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { ...toast, id }]);

    // Auto-remove success/error after 5s
    if (toast.type !== 'loading') {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 5000);
    }

    return id;
  }, []);

  const updateToast = useCallback((id: string, updates: Partial<Omit<Toast, 'id'>>) => {
    setToasts((prev) => prev.map((t) => t.id === id ? { ...t, ...updates } : t));

    // Auto-remove if updated to success/error
    if (updates.type && updates.type !== 'loading') {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 5000);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const icons = {
    loading: <Loader2 className="size-4 animate-spin text-primary" />,
    success: <CheckCircle className="size-4 text-emerald-500" />,
    error: <AlertCircle className="size-4 text-red-500" />,
  };

  return (
    <ToastContext.Provider value={{ addToast, updateToast, removeToast }}>
      {children}

      {/* Toast container */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-[300px]">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="rounded-xl bg-popover px-3.5 py-2.5 text-sm ring-1 ring-foreground/10 animate-in slide-in-from-right-full fade-in duration-200"
            style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.03)' }}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0">{icons[toast.type]}</div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-[13px]">{toast.title}</p>
                {toast.description && <p className="mt-0.5 text-[11px] text-muted-foreground">{toast.description}</p>}
                {toast.action && (
                  <button
                    onClick={toast.action.onClick}
                    className="mt-1.5 text-[11px] text-primary hover:underline"
                  >
                    {toast.action.label}
                  </button>
                )}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="shrink-0 text-muted-foreground/40 hover:text-foreground transition-[color] duration-150"
                aria-label="Lukk"
              >
                <X className="size-3" strokeWidth={1.75} />
              </button>
            </div>
            {toast.type === 'loading' && (
              <div className="mt-2 h-0.5 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full animate-progress rounded-full bg-primary/40" />
              </div>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
