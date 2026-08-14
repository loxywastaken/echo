import { cn, gradientFor, initials } from "@/lib/utils";

export function Avatar({
  src,
  name,
  size = 40,
  className,
  ring,
}: {
  src?: string | null;
  name: string;
  size?: number;
  className?: string;
  ring?: "story" | "seen" | null;
}) {
  const inner = (
    <span
      className={cn(
        "relative grid shrink-0 place-items-center overflow-hidden rounded-full bg-surface-2 font-semibold text-white",
        className
      )}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} className="h-full w-full object-cover" />
      ) : (
        <span
          className="grid h-full w-full place-items-center"
          style={{ background: gradientFor(name || "?") }}
        >
          {initials(name || "?")}
        </span>
      )}
    </span>
  );

  if (!ring) return inner;
  return (
    <span
      className={cn(
        "grid place-items-center rounded-full p-[2px]",
        ring === "story" ? "story-ring" : "story-ring-seen"
      )}
      style={{ width: size + 6, height: size + 6 }}
    >
      <span className="rounded-full bg-bg p-[2px]">{inner}</span>
    </span>
  );
}
