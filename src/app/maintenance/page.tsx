import { LogoMark } from "@/components/Logo";
import { getAppConfig } from "@/lib/config";

export const dynamic = "force-dynamic";

export default async function MaintenancePage() {
  const { maintenanceMessage } = await getAppConfig();
  return (
    <div className="grid min-h-screen place-items-center bg-bg px-6 text-text">
      <div className="card w-full max-w-md p-8 text-center">
        <LogoMark size={56} className="mx-auto text-text" />
        <h1 className="mt-5 font-display text-2xl font-bold">We’ll be right back</h1>
        <p className="mt-2 text-muted">
          {maintenanceMessage || "Vortex is down for scheduled maintenance. Please check back soon."}
        </p>
      </div>
    </div>
  );
}
