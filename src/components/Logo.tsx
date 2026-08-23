import { cn } from "@/lib/utils";

/**
 * Vortex mark — rounded square containing a spiral vortex.
 * Official brand mark.
 */
export function LogoMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {/* Outer rounded square frame */}
      <rect
        x="1.5"
        y="1.5"
        width="29"
        height="29"
        rx="8"
        stroke="currentColor"
        strokeWidth="2.75"
        fill="none"
      />
      {/* Spiral arms – clean geometric approximation of the brand mark */}
      <path
        d="M16 8.5c4.14 0 7.5 3.36 7.5 7.5 0 3.05-1.82 5.68-4.45 6.85"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M16 10.5c3.04 0 5.5 2.46 5.5 5.5 0 2.24-1.34 4.17-3.27 5.03"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M16 12.5c1.93 0 3.5 1.57 3.5 3.5 0 1.42-.85 2.65-2.08 3.2"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M16 14.5c.83 0 1.5.67 1.5 1.5 0 .53-.28.99-.7 1.25"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
        fill="none"
      />
      {/* Center */}
      <circle cx="16" cy="16" r="1.35" fill="currentColor" />
    </svg>
  );
}

export function Logo({
  size = 30,
  withWord = true,
  className,
}: {
  size?: number;
  withWord?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5 select-none text-text", className)}>
      <LogoMark size={size} />
      {withWord && (
        <span
          className="text-gradient font-display text-[1.5rem] font-extrabold leading-none tracking-tight"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Vortex
        </span>
      )}
    </span>
  );
}
