import "server-only";
import { promises as fs } from "fs";
import path from "path";
import { nanoid } from "nanoid";
import { ALLOWED_IMAGE, ALLOWED_VIDEO, MAX_UPLOAD_MB } from "./constants";

// Media is stored as real files (object storage), never as DB blobs — the DB
// only keeps the URL. In production (Vercel) files go to Vercel Blob; in local
// dev (no BLOB token) they're written to /public/uploads on disk.

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

export type SavedFile = {
  url: string;
  type: "image" | "video";
  mime: string;
  size: number;
};

export async function saveFile(file: File): Promise<SavedFile> {
  const mime = file.type;
  const isImage = ALLOWED_IMAGE.includes(mime);
  const isVideo = ALLOWED_VIDEO.includes(mime);
  if (!isImage && !isVideo) {
    throw new StorageError(`Unsupported file type: ${mime || "unknown"}`);
  }
  if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
    throw new StorageError(`File too large (max ${MAX_UPLOAD_MB}MB)`);
  }

  const type = isImage ? "image" : "video";
  const ext = extFor(mime) || path.extname(file.name) || "";
  const name = `${Date.now()}-${nanoid(10)}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  // Production / any environment with a Blob token → Vercel Blob object storage.
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import("@vercel/blob");
    const blob = await put(`echo/${name}`, buffer, {
      access: "public",
      contentType: mime,
    });
    return { url: blob.url, type, mime, size: file.size };
  }

  // Vercel without a Blob token would try to write to a read-only FS — fail loud.
  if (process.env.VERCEL) {
    throw new StorageError(
      "Media storage is not configured. Add a Vercel Blob store and set BLOB_READ_WRITE_TOKEN."
    );
  }

  // Local dev fallback → write to /public/uploads.
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.writeFile(path.join(UPLOAD_DIR, name), buffer);
  return { url: `/uploads/${name}`, type, mime, size: file.size };
}

function extFor(mime: string): string {
  const map: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "image/avif": ".avif",
    "video/mp4": ".mp4",
    "video/webm": ".webm",
    "video/quicktime": ".mov",
  };
  return map[mime] ?? "";
}

export class StorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StorageError";
  }
}
