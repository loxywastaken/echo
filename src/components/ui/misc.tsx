import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

/**
 * X.com-style verification badge with three tiers:
 * - "blue" (default): Individual verified — blue scalloped seal
 * - "gold": Business / organisation — gold scalloped seal
 * - "gray": Government / official — gray scalloped seal
 */
export function VerifiedBadge({
  size = 15,
  type = "blue",
  className,
}: {
  size?: number;
  type?: "blue" | "gold" | "gray";
  className?: string;
}) {
  const colors: Record<string, { fill: string; label: string }> = {
    blue: { fill: "#1D9BF0", label: "Verified" },
    gold: { fill: "#E4A72F", label: "Verified organisation" },
    gray: { fill: "#829AAB", label: "Verified official" },
  };
  const { fill, label } = colors[type] || colors.blue;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={cn("shrink-0", className)}
      aria-label={label}
    >
      {/* scalloped seal shape */}
      <path
        d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81C14.67 2.63 13.43 1.75 12 1.75s-2.67.88-3.34 2.19c-1.39-.46-2.9-.2-3.91.81s-1.27 2.52-.81 3.91C2.63 9.33 1.75 10.57 1.75 12s.88 2.67 2.19 3.34c-.46 1.39-.2 2.9.81 3.91s2.52 1.27 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.67-.88 3.34-2.19c1.39.46 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34z"
        fill={fill}
      />
      {/* white checkmark */}
      <path
        d="M9.813 15.904L7.076 13.18a.75.75 0 0 0-1.06 1.06l3.268 3.268a.75.75 0 0 0 1.06 0l7.13-7.13a.75.75 0 0 0-1.06-1.06l-6.6 6.586z"
        fill="#fff"
      />
    </svg>
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
    <div className="flex flex-col items-center justify-center gap-3.5 px-6 py-20 text-center animate-fade-in">
      {icon && (
        <div className="grid h-14 w-14 place-items-center rounded-2xl border border-border/80 bg-surface/80 text-muted shadow-soft">
          {icon}
        </div>
      )}
      <div className="space-y-1.5">
        <h3 className="text-base font-semibold tracking-tight text-text">{title}</h3>
        {hint && <p className="max-w-[260px] text-sm leading-relaxed text-muted">{hint}</p>}
      </div>
      {action && <div className="mt-1">{action}</div>}
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
