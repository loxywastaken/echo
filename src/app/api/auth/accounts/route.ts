import { route, ok } from "@/lib/api";
import { getLinkedAccounts } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  const accounts = await getLinkedAccounts();
  return ok({ accounts });
});
