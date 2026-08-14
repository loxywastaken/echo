import { NextRequest } from "next/server";
import { route, ok, bad } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { saveFile } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = route(async (req: NextRequest) => {
  await requireUser();
  const form = await req.formData();
  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (files.length === 0) return bad("No files provided.");
  if (files.length > 10) return bad("Up to 10 files at a time.");
  const saved = await Promise.all(files.map((f) => saveFile(f)));
  return ok({ files: saved });
});
