import { cn } from "@/lib/utils";

/**
 * Vortex mark — spiral galaxy logo in a rounded square frame.
 * Inline SVG so it never 404s and loads instantly (zero network).
 */
export function LogoMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={cn("shrink-0 select-none", className)}
      aria-hidden="true"
    >
      {/* rounded square frame */}
      <rect width="100" height="100" rx="23" fill="#000" />
      <rect
        x="4.5"
        y="4.5"
        width="91"
        height="91"
        rx="20"
        stroke="#fff"
        strokeWidth="6.5"
        fill="none"
      />
      {/* spiral arms */}
      <path
        fill="#fff"
        d="M50 24c13.5 0 24.5 11 24.5 24.5 0 10-6 18.5-14.5 22.5l-3.5-3c7-3.5 11.5-10.5 11.5-18.5 0-11.5-9.5-21-21-21-9.5 0-17.5 6-21 14.5l4 2c3-7 9.5-11.5 17-11.5 9.5 0 17 7.5 17 17 0 7-4.5 13-11 16l-2.5-3.5c5-2.5 8.5-7.5 8.5-13.5 0-8-6.5-14.5-14.5-14.5-6 0-11 3.5-13.5 9l4 1.5c2-4 6-6.5 10.5-6.5 6.5 0 11.5 5 11.5 11.5 0 5-3 9-7.5 11l-2-3.5c3-1.5 5-4.5 5-8 0-4.5-3.5-8-8-8-3.5 0-6.5 2-8 5l3.5 1.5c1-2 3-3.5 5.5-3.5 3.5 0 6.5 3 6.5 6.5 0 2.5-1.5 4.5-3.5 5.5l-1.5-3c1.5-.5 2.5-2 2.5-3.5 0-2.5-2-4.5-4.5-4.5-1.5 0-3 1-3.5 2.5l2.5 1c.5-1 1.5-1.5 2.5-1.5 1.5 0 2.5 1 2.5 2.5 0 1-.5 2-1.5 2.5l-1-2c.5 0 1-.5 1-1.5 0-1-.5-1.5-1.5-1.5s-1.5.5-1.5 1.5c0 .5.5 1 1 1.5z"
      />
      <path fill="#fff" d="M38 18c-2 8-3 16 0 24l4-2c-2-7-1-14 2-22z" opacity=".95" />
      <path fill="#fff" d="M20 50c8-4 16-5 24-2l-2 4c-7-2-14-1-22 2z" opacity=".9" />
      <path fill="#fff" d="M45 80c6-8 14-10 22-6l-3 4c-6-3-12-2-18 4z" opacity=".95" />
      <path fill="#fff" d="M80 40c-4 8-5 16-2 24l4-2c-2-7-1-14 2-22z" opacity=".9" />
      <path fill="#fff" d="M28 72c6-6 14-8 22-4l-3 4c-6-3-12-2-18 4z" opacity=".85" />
      {/* bright core star */}
      <circle cx="68" cy="30" r="5.5" fill="#fff" />
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
