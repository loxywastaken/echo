import { LogoMark, Logo } from "@/components/Logo";
import { BRAND } from "@/lib/constants";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full">
      {/* Brand panel (desktop) */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden p-12 lg:flex">
        <div className="absolute inset-0 -z-10 bg-accent-gradient opacity-[0.12]" />
        <div
          className="absolute -left-24 top-1/4 -z-10 h-96 w-96 rounded-full opacity-30 blur-3xl"
          style={{ background: "radial-gradient(circle, rgb(var(--accent)), transparent 70%)" }}
        />
        <div
          className="absolute right-0 bottom-0 -z-10 h-96 w-96 rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, rgb(var(--accent-2)), transparent 70%)" }}
        />
        <Logo size={40} />
        <div>
          <h1 className="max-w-md font-display text-5xl font-extrabold leading-tight tracking-tight">
            Share what <span className="text-gradient">echoes</span>.
          </h1>
          <p className="mt-4 max-w-sm text-lg text-muted">
            A calmer place for the moments worth repeating. Post, follow, message, and discover —
            beautifully.
          </p>
        </div>
        <p className="text-sm text-faint">© {new Date().getFullYear()} {BRAND.name}</p>
      </div>

      {/* Form area */}
      <div className="flex w-full flex-col items-center justify-center px-5 py-10 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex justify-center lg:hidden">
            <Logo size={34} />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
