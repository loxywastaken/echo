import { cn } from "@/lib/utils";

/**
 * Echo mark â an original "echo ripple": a source dot emitting three concentric
 * sound-wave arcs. Deliberately unlike any camera/aperture glyph.
 */
export function LogoMark({ size = 32, className }: { size?: number; className?: string }) {
  const id = "echoGrad";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={id} x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="rgb(var(--accent))" />
          <stop offset="1" stopColor="rgb(var(--accent-2))" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#echoGrad)" opacity="0.14" />
      {/* source dot */}
      <circle cx="10" cy="16" r="2.4" fill="url(#echoGrad)" />
      {/* three ripple arcs opening right */}
      <path d="M14 11 A5.6 5.6 0 0 1 14 21" stroke="url(#echoGrad)" strokeWidth="2.3" strokeLinecap="round" />
      <path d="M17.5 8 A9.4 9.4 0 0 1 17.5 24" stroke="url(#echoGrad)" strokeWidth="2.3" strokeLinecap="round" opacity="0.72" />
      <path d="M21 5.5 A12.8 12.8 0 0 1 21 26.5" stroke="url(#echoGrad)" strokeWidth="2.3" strokeLinecap="round" opacity="0.42" />
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
    <span className={cn("inline-flex items-center gap-2.5 select-none", className)}>
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
