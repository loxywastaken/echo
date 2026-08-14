"use client";

import { useRef, useState } from "react";
import { ImagePlus, Type } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/client";
import { useToast } from "@/context/ToastContext";
import { STORY_BG_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function StoryComposer({ onClose, onPosted }: { onClose: () => void; onPosted: () => void }) {
  const { toast } = useToast();
  const [mode, setMode] = useState<"media" | "text">("media");
  const [file, setFile] = useState<{ url: string; type: "image" | "video" } | null>(null);
  const [text, setText] = useState("");
  const [bg, setBg] = useState(STORY_BG_COLORS[0]);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function pick(f: File) {
    setBusy(true);
    try {
      const { files } = await api.upload([f]);
      setFile({ url: files[0].url, type: files[0].type });
    } catch (e: any) {
      toast(e?.message || "Upload failed", "error");
    } finally {
      setBusy(false);
    }
  }

  async function post() {
    setBusy(true);
    try {
      if (mode === "text") {
        if (!text.trim()) return;
        await api.post("/api/stories", { type: "text", text, bgColor: bg });
      } else {
        if (!file) return;
        await api.post("/api/stories", { type: file.type, url: file.url });
      }
      toast("Story shared", "success");
      onPosted();
    } catch (e: any) {
      toast(e?.message || "Could not post story", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="Add to your story" className="sm:max-w-md">
      <div className="p-4">
        <div className="mb-4 flex gap-2">
          <Button variant={mode === "media" ? "primary" : "subtle"} size="sm" onClick={() => setMode("media")}>
            <ImagePlus size={16} /> Photo / Video
          </Button>
          <Button variant={mode === "text" ? "primary" : "subtle"} size="sm" onClick={() => setMode("text")}>
            <Type size={16} /> Text
          </Button>
        </div>

        {mode === "media" ? (
          <div>
            <input
              ref={inputRef}
              type="file"
              accept="image/*,video/*"
              hidden
              onChange={(e) => e.target.files?.[0] && pick(e.target.files[0])}
            />
            {file ? (
              <div className="relative aspect-[9/16] overflow-hidden rounded-2xl bg-black">
                {file.type === "video" ? (
                  <video src={file.url} className="h-full w-full object-contain" controls />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={file.url} alt="" className="h-full w-full object-contain" />
                )}
              </div>
            ) : (
              <button
                onClick={() => inputRef.current?.click()}
                className="press grid aspect-[9/16] w-full place-items-center rounded-2xl border-2 border-dashed border-border text-muted hover:bg-surface-2"
              >
                <span className="flex flex-col items-center gap-2">
                  <ImagePlus size={30} />
                  <span className="text-sm">{busy ? "Uploading…" : "Tap to upload"}</span>
                </span>
              </button>
            )}
          </div>
        ) : (
          <div>
            <div
              className="grid aspect-[9/16] w-full place-items-center rounded-2xl p-6"
              style={{ background: bg }}
            >
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type something…"
                className="w-full resize-none bg-transparent text-center font-display text-2xl font-bold text-white placeholder:text-white/60 focus:outline-none"
                rows={4}
              />
            </div>
            <div className="mt-3 flex justify-center gap-2">
              {STORY_BG_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setBg(c)}
                  className={cn("h-7 w-7 rounded-full", bg === c && "ring-2 ring-accent ring-offset-2 ring-offset-surface")}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>
        )}

        <Button variant="primary" size="lg" className="mt-4 w-full" loading={busy} onClick={post}>
          Share to story
        </Button>
      </div>
    </Modal>
  );
}
