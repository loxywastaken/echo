import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AuthError } from "./auth";
import { StorageError } from "./storage";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data as any, init);
}
export function created<T>(data: T) {
  return NextResponse.json(data as any, { status: 201 });
}
export function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}
export const unauthorized = () => bad("You need to be signed in.", 401);
export const forbidden = () => bad("You don't have permission to do that.", 403);
export const notFound = (what = "Not found") => bad(what, 404);

/** Wrap a route handler so thrown errors become clean JSON responses. */
export function route<Args extends any[]>(
  handler: (...args: Args) => Promise<Response>
) {
  return async (...args: Args): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (err) {
      if (err instanceof AuthError) return unauthorized();
      if (err instanceof StorageError) return bad(err.message, 400);
      if (err instanceof ZodError) return bad(err.issues[0]?.message ?? "Invalid input", 400);
      console.error("[echo:route-error]", err);
      return bad("Something went wrong on our side.", 500);
    }
  };
}

/** Parse cursor pagination params from a URL. */
export function pageParams(url: string) {
  const { searchParams } = new URL(url);
  return {
    cursor: searchParams.get("cursor") || undefined,
    q: (searchParams.get("q") || "").trim(),
    limit: Math.min(Number(searchParams.get("limit")) || 8, 30),
    type: searchParams.get("type") || undefined,
    tab: searchParams.get("tab") || undefined,
  };
}
