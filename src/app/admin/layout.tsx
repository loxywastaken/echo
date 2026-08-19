import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { Logo } from "@/components/Logo";
import { ArrowLeft } from "lucide-react";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/");

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border glass px-5 py-3">
        <div className="flex items-center gap-3">
          <Logo size={26} withWord={false} />
          <span className="font-display text-lg font-bold">Vortex <span className="text-gradient">Admin</span></span>
        </div>
        <Link href="/" className="press flex items-center gap-1.5 text-sm text-muted hover:text-text">
          <ArrowLeft size={16} /> Back to app
        </Link>
      </header>
      {children}
    </div>
  );
}
