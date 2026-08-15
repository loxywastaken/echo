"use client";

import { useCallback, useRef, useState } from "react";
import { UploadCloud, X, MapPin, Users, Film, ImageIcon } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/misc";
import { Avatar } from "@/components/ui/Avatar";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { cn } from "@/lib/utils";

type Uploaded = { url: string; type: "image" | "video"; width?: number; height?: number };

function uploadWithProgress(files: File[], onProgress: (p: number) => void): Promise<{ files: Uploaded[] }> {
  return new Promise((resolve, reject) => {
    const fd = new FormData();
    files.forEach((f) => fd.append("files", f));
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload");
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        xhr.status >= 200 && xhr.status < 300 ? resolve(data) : reject(new Error(data.error || "Upload failed"));
      } catch {
        reject(new Error("Upload failed"));
      }
    };
    xhr.onerror = () => reject(new Error("Upload failed"));
    xhr.send(fd);
  });
}

export function CreateModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, refresh } = useAuth();
  const { toast } = useToast();
  const [media, setMedia] = useState<Uploaded[]>([]);
  const [progress, setProgress] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [tagged, setTagged] = useState("");
  const [commentsDisabled, setCommentsDisabled] = useState(false);
  const [asClip, setAsClip] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const hasVideo = media.some((m) => m.type === "video");

  const reset = () => {
    setMedia([]); setCaption(""); setLocation(""); setTagged("");
    setCommentsDisabled(false); setAsClip(false); setProgress(null);
  };
  const close = () => { reset(); onClose(); };

  const addFiles = useCallback(async (files: File[]) => {
    if (!files.length) return;
    setProgress(0);
    try {
      const dims = await Promise.all(files.map(readDims));
      const { files: uploaded } = await uploadWithProgress(files, setProgress);
      setProgress(1);
      setMedia((m) => [...m, ...uploaded.map((u, i) => ({ ...u, ...dims[i] }))].slice(0, 10));
      setTimeout(() => setProgress(null), 400);
    } catch (e: any) {
      toast(e?.message || "Upload failed", "error");
      setProgress(null);
    }
  }, [toast]);

  async function publish() {
    if (!media.length) return;
    setPublishing(true);
    try {
      const taggedUsernames = tagged.split(/[\s,]+/).map((s) => s.replace(/^@/, "")).filter(Boolean);
      const { post } = await import("@/lib/client").then((m) =>
        m.api.post("/api/posts", {
          caption,
          location: location || undefined,
          media,
          taggedUsernames,
          commentsDisabled,
          isClip: asClip && hasVideo,
        })
      );
      window.dispatchEvent(new CustomEvent("echo:post-created", { detail: post }));
      refresh();
      toast("Posted ✨", "success");
      close();
    } catch (e: any) {
      toast(e?.message || "Could not publish", "error");
    } finally {
      setPublishing(false);
    }
  }

  return (
    <Modal open={open} onClose={close} title="Create new post" className="sm:max-w-3xl">
      <div className="grid sm:grid-cols-2">
        {/* left: media */}
        <div
          className={cn(
            "relative flex min-h-[340px] items-center justify-center border-b border-border p-4 sm:min-h-[460px] sm:border-b-0 sm:border-r",
            dragging && "bg-accent/5"
          )}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            addFiles(Array.from(e.dataTransfer.files));
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            hidden
            onChange={(e) => addFiles(Array.from(e.target.files || []))}
          />
          {media.length === 0 ? (
            <button onClick={() => inputRef.current?.click()} className="flex flex-col items-center gap-3 text-muted">
              <UploadCloud size={54} strokeWidth={1.3} className={cn(dragging && "text-accent")} />
              <span className="font-medium text-text">Drag photos & videos here</span>
              <span className="text-xs text-faint">or click to browse · up to 10 files</span>
              {progress !== null && (
                <div className="mt-2 h-1.5 w-40 overflow-hidden rounded-full bg-surface-2">
                  <div className="h-full bg-accent-gradient transition-all" style={{ width: `${(progress || 0) * 100}%` }} />
                </div>
              )}
            </button>
          ) : (
            <div className="w-full">
              <div className="grid grid-cols-3 gap-2">
                {media.map((m, i) => (
                  <div key={i} className="group relative aspect-square overflow-hidden rounded-lg bg-black">
                    {m.type === "video" ? (
                      <video src={m.url} className="h-full w-full object-cover" />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.url} alt="" className="h-full w-full object-cover" />
                    )}
                    <button
                      onClick={() => setMedia((mm) => mm.filter((_, idx) => idx !== i))}
                      className="press absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white"
                    >
                      <X size={13} />
                    </button>
                    {m.type === "video" && (
                      <span className="absolute left-1 top-1 rounded bg-black/60 px-1"><Film size={12} className="text-white" /></span>
                    )}
                  </div>
                ))}
                {media.length < 10 && (
                  <button
                    onClick={() => inputRef.current?.click()}
                    className="press grid aspect-square place-items-center rounded-lg border-2 border-dashed border-border text-muted hover:bg-surface-2"
                  >
                    <ImageIcon size={22} />
                  </button>
                )}
              </div>
              {progress !== null && progress < 1 && (
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                  <div className="h-full bg-accent-gradient transition-all" style={{ width: `${progress * 100}%` }} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* right: details */}
        <div className="flex flex-col p-4">
          <div className="mb-3 flex items-center gap-2">
            <Avatar src={user?.avatar} name={user?.displayName || "?"} size={32} />
            <span className="text-sm font-semibold">{user?.username}</span>
          </div>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Write a caption…  Use #hashtags and @mentions"
            rows={4}
            className="input-base resize-none"
            maxLength={2200}
          />
          <div className="mt-3 space-y-3">
            <label className="flex items-center gap-2 rounded-xl border border-border bg-surface-2 px-3">
              <MapPin size={16} className="text-faint" />
              <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Add location" className="flex-1 bg-transparent py-2.5 text-sm outline-none" />
            </label>
            <label className="flex items-center gap-2 rounded-xl border border-border bg-surface-2 px-3">
              <Users size={16} className="text-faint" />
              <input value={tagged} onChange={(e) => setTagged(e.target.value)} placeholder="Tag people (comma separated)" className="flex-1 bg-transparent py-2.5 text-sm outline-none" />
            </label>
            <div className="flex items-center justify-between rounded-xl px-1 py-1">
              <span className="text-sm text-muted">Turn off commenting</span>
              <Toggle checked={commentsDisabled} onChange={setCommentsDisabled} />
            </div>
            {hasVideo && (
              <div className="flex items-center justify-between rounded-xl px-1 py-1">
                <span className="flex items-center gap-1.5 text-sm text-muted"><Film size={15} /> Share as a Vortex Clip</span>
                <Toggle checked={asClip} onChange={setAsClip} />
              </div>
            )}
          </div>

          <Button
            variant="primary"
            size="lg"
            className="mt-auto w-full"
            loading={publishing}
            disabled={!media.length}
            onClick={publish}
          >
            Share
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function readDims(file: File): Promise<{ width?: number; height?: number }> {
  return new Promise((resolve) => {
    if (file.type.startsWith("image/")) {
      const img = new Image();
      img.onload = () => resolve({ width: img.width, height: img.height });
      img.onerror = () => resolve({});
      img.src = URL.createObjectURL(file);
    } else {
      resolve({});
    }
  });
}
