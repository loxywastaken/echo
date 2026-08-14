"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { Check, AlertTriangle, Info, X } from "lucide-react";

type ToastKind = "success" | "error" | "info";
type Toast = { id: number; kind: ToastKind; message: string };

const ToastContext = createContext<{
  toast: (message: string, kind?: ToastKind) => void;
}>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

let counter = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, kind: ToastKind = "info") => {
      const id = ++counter;
      setToasts((t) => [...t, { id, kind, message }]);
      setTimeout(() => remove(id), 3600);
    },
    [remove]
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 left-1/2 z-[100] flex -translate-x-1/2 flex-col items-center gap-2 px-3 sm:bottom-6">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className="pointer-events-auto flex w-full max-w-sm animate-fade-in-up items-center gap-3 rounded-2xl border border-border bg-elevated/95 px-4 py-3 shadow-card backdrop-blur"
          >
            <span
              className={
                "grid h-7 w-7 shrink-0 place-items-center rounded-full " +
                (t.kind === "success"
                  ? "bg-success/15 text-success"
                  : t.kind === "error"
                  ? "bg-danger/15 text-danger"
                  : "bg-accent/15 text-accent")
              }
            >
              {t.kind === "success" ? (
                <Check size={16} />
              ) : t.kind === "error" ? (
                <AlertTriangle size={16} />
              ) : (
                <Info size={16} />
              )}
            </span>
            <p className="flex-1 text-sm leading-snug text-text">{t.message}</p>
            <button
              onClick={() => remove(t.id)}
              className="press text-faint hover:text-text"
              aria-label="Dismiss"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
