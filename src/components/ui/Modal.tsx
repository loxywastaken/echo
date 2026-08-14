"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

export function Modal({
  open,
  onClose,
  children,
  title,
  className,
  hideClose,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: React.ReactNode;
  className?: string;
  hideClose?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative z-10 flex max-h-[92vh] w-full flex-col overflow-hidden border border-border bg-surface shadow-card animate-slide-up sm:max-w-lg sm:animate-scale-in",
          "rounded-t-3xl sm:rounded-3xl",
          className
        )}
      >
        {(title || !hideClose) && (
          <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
            <h2 className="font-display text-base font-bold">{title}</h2>
            {!hideClose && (
              <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
                <X size={20} />
              </Button>
            )}
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto thin-scrollbar">{children}</div>
      </div>
    </div>
  );
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  danger,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message?: string;
  confirmLabel?: string;
  danger?: boolean;
  loading?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} hideClose className="sm:max-w-sm">
      <div className="p-6 text-center">
        <h3 className="font-display text-lg font-bold">{title}</h3>
        {message && <p className="mt-2 text-sm text-muted">{message}</p>}
        <div className="mt-6 flex flex-col gap-2">
          <Button
            variant={danger ? "danger" : "primary"}
            loading={loading}
            onClick={onConfirm}
            className="w-full"
          >
            {confirmLabel}
          </Button>
          <Button variant="ghost" onClick={onClose} className="w-full">
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}
