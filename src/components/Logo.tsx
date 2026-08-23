import { cn } from "@/lib/utils";

/**
 * Vortex mark — official spiral galaxy logo (exact brand asset).
 */
export function LogoMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo-mark.png"
      alt="Vortex"
      width={size}
      height={size}
      className={cn("shrink-0 select-none object-contain", className)}
      draggable={false}
      style={{ width: size, height: size }}
    />
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
