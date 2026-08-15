import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getAppConfig } from "@/lib/config";
import { AppShell } from "@/components/AppShell";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const cfg = await getAppConfig();
  if (cfg.maintenanceMode && user.role !== "admin") redirect("/maintenance");
  return <AppShell>{children}</AppShell>;
}
