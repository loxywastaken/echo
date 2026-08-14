import { cn } from "@/lib/utils";
import { Loader2, BadgeCheck } from "lucide-react";

export function VerifiedBadge({ size = 15, className }: { size?: number; className?: string }) {
  return (
    <BadgeCheck
      size={size}
      className={cn("shrink-0 text-accent", className)}
      aria-label="Verified"
      fill="currentColor"
      stroke="rgb(var(--bg))"
    />
  );
}

export function Spinner({ size = 20, className }: { size?: number; className?: string }) {
  return <Loader2 size={size} className={cn("animate-spin text-muted", className)} />;
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-lg", className)} />;
}

export function EmptyState({
  icon,
  title,
  hint,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center animate-fade-in">
      {icon && (
        <div className="grid h-16 w-16 place-items-center rounded-2xl border border-border bg-surface text-muted">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-text">{title}</h3>
      {hint && <p className="max-w-xs text-sm text-muted">{hint}</p>}
      {action}
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "press relative h-6 w-11 shrink-0 rounded-full transition-colors",
        checked ? "bg-accent-gradient" : "bg-surface-2 border border-border"
      )}
    >
      <span
        className={cn(
          "absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-white shadow transition-all",
          checked ? "left-6" : "left-1"
        )}
      />
    </button>
  );
}
