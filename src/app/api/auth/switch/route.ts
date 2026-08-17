import { NextRequest } from "next/server";
import { route, ok, bad } from "@/lib/api";
import { switchAccount } from "@/lib/auth";

export const POST = route(async (req: NextRequest) => {
  const { userId } = await req.json();
  if (!userId || typeof userId !== "string") return bad("Missing userId");

  const success = await switchAccount(userId);
  if (!success) return bad("Could not switch — account session may have expired.", 401);

  return ok({ ok: true });
});
