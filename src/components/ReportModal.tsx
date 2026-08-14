"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/client";
import { useToast } from "@/context/ToastContext";
import { REPORT_REASONS } from "@/lib/constants";
import { ChevronRight } from "lucide-react";

export function ReportModal({
  open,
  onClose,
  targetType,
  targetId,
}: {
  open: boolean;
  onClose: () => void;
  targetType: "post" | "comment" | "user";
  targetId: string;
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  async function report(reason: string) {
    setLoading(true);
    try {
      await api.post("/api/reports", { targetType, targetId, reason });
      toast("Thanks — we'll review this report.", "success");
      onClose();
    } catch {
      toast("Could not submit report", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Report" className="sm:max-w-md">
      <p className="px-5 pt-4 text-sm text-muted">Why are you reporting this {targetType}?</p>
      <div className="p-2">
        {REPORT_REASONS.map((reason) => (
          <button
            key={reason}
            disabled={loading}
            onClick={() => report(reason)}
            className="press flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm hover:bg-surface-2 disabled:opacity-50"
          >
            {reason}
            <ChevronRight size={16} className="text-faint" />
          </button>
        ))}
      </div>
    </Modal>
  );
}
