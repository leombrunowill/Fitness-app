'use client';

import { createContext, PropsWithChildren, useCallback, useContext, useMemo, useState } from 'react';

type ToastItem = { id: number; kind: 'error' | 'success'; message: string };
type ToastContextValue = { pushToast: (message: string, kind?: ToastItem['kind']) => void };

const ToastContext = createContext<ToastContextValue>({ pushToast: () => undefined });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: PropsWithChildren) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const pushToast = useCallback((message: string, kind: ToastItem['kind'] = 'error') => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, message, kind }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 2800);
  }, []);

  const value = useMemo(() => ({ pushToast }), [pushToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-3 top-3 z-[100] space-y-2">
        {toasts.map((toast) => (
          <div key={toast.id} className={`rounded-lg px-3 py-2 text-sm font-medium shadow ${toast.kind === 'error' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'}`}>
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
