"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff } from "lucide-react";
import { api } from "@/lib/client";
import { useAuth } from "./AuthContext";
import { useToast } from "./ToastContext";
import { Avatar } from "@/components/ui/Avatar";
import type { PublicUser } from "@/lib/types";
import { cn } from "@/lib/utils";

type Kind = "audio" | "video";
type Phase = "idle" | "outgoing" | "incoming" | "active";

// Public STUN only (no TURN server available) — connects across most, but not
// all, networks (symmetric NAT will fail).
const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

type CallCtx = { startCall: (peer: PublicUser, kind: Kind) => void; busy: boolean };
const Ctx = createContext<CallCtx>({ startCall: () => {}, busy: false });
export const useCall = () => useContext(Ctx);

export function CallProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [phase, setPhase] = useState<Phase>("idle");
  const [peer, setPeer] = useState<PublicUser | null>(null);
  const [kind, setKind] = useState<Kind>("video");
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [connected, setConnected] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const callIdRef = useRef<string | null>(null);
  const roleRef = useRef<"caller" | "callee">("caller");
  const localRef = useRef<MediaStream | null>(null);
  const appliedRef = useRef<Set<string>>(new Set());
  const pendingCandRef = useRef<any[]>([]);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const incomingOfferRef = useRef<any>(null);

  const cleanup = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    try { pcRef.current?.close(); } catch {}
    pcRef.current = null;
    localRef.current?.getTracks().forEach((t) => t.stop());
    localRef.current = null;
    callIdRef.current = null;
    appliedRef.current = new Set();
    pendingCandRef.current = [];
    incomingOfferRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    setConnected(false);
    setMuted(false);
    setCameraOff(false);
    setPeer(null);
    setPhase("idle");
  }, []);

  const hangup = useCallback((notifyServer = true) => {
    const id = callIdRef.current;
    if (notifyServer && id) api.post(`/api/calls/${id}/end`).catch(() => {});
    cleanup();
  }, [cleanup]);

  function sendCandidate(cand: any) {
    const id = callIdRef.current;
    if (!id) { pendingCandRef.current.push(cand); return; }
    api.post(`/api/calls/${id}/candidate`, { candidate: cand }).catch(() => {});
  }
  function flushCandidates() {
    const id = callIdRef.current;
    if (!id) return;
    const q = pendingCandRef.current;
    pendingCandRef.current = [];
    q.forEach((c) => api.post(`/api/calls/${id}/candidate`, { candidate: c }).catch(() => {}));
  }

  function newPc() {
    const pc = new RTCPeerConnection(RTC_CONFIG);
    pc.onicecandidate = (e) => { if (e.candidate) sendCandidate(e.candidate.toJSON()); };
    pc.ontrack = (e) => setRemoteStream(e.streams[0]);
    pc.onconnectionstatechange = () => {
      const st = pc.connectionState;
      if (st === "connected") setConnected(true);
      if (st === "failed") { toast("Call connection failed", "error"); hangup(); }
    };
    pcRef.current = pc;
    return pc;
  }

  async function getMedia(k: Kind) {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: k === "video" });
    localRef.current = stream;
    setLocalStream(stream);
    return stream;
  }

  function startPolling() {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      const id = callIdRef.current;
      const pc = pcRef.current;
      if (!id || !pc) return;
      try {
        const r = await api.get(`/api/calls/${id}`);
        if (r.status === "ended" || r.status === "declined") {
          toast(r.status === "declined" ? "Call declined" : "Call ended");
          cleanup();
          return;
        }
        if (roleRef.current === "caller" && r.answer && !pc.currentRemoteDescription) {
          await pc.setRemoteDescription(new RTCSessionDescription(r.answer));
          setPhase("active");
        }
        for (const c of r.candidates || []) {
          if (appliedRef.current.has(c.id)) continue;
          if (!pc.remoteDescription) continue; // wait until remote SDP is set
          appliedRef.current.add(c.id);
          try { await pc.addIceCandidate(new RTCIceCandidate(c.candidate)); } catch {}
        }
      } catch {}
    }, 1500);
  }

  const startCall = useCallback(async (p: PublicUser, k: Kind) => {
    if (callIdRef.current || phase !== "idle") return;
    roleRef.current = "caller";
    setPeer(p); setKind(k); setPhase("outgoing");
    let stream: MediaStream;
    try {
      stream = await getMedia(k);
    } catch {
      toast("Camera and microphone access is needed to call", "error");
      cleanup();
      return;
    }
    const pc = newPc();
    stream.getTracks().forEach((t) => pc.addTrack(t, stream));
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      const { call } = await api.post("/api/calls", { calleeId: p.id, kind: k, offer });
      callIdRef.current = call.id;
      flushCandidates();
      startPolling();
    } catch (e: any) {
      toast(e?.message || "Couldn't start the call", "error");
      hangup();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, cleanup, hangup, toast]);

  const accept = useCallback(async () => {
    const offer = incomingOfferRef.current;
    const id = callIdRef.current;
    if (!offer || !id) return;
    roleRef.current = "callee";
    let stream: MediaStream;
    try {
      stream = await getMedia(kind);
    } catch {
      toast("Camera and microphone access is needed", "error");
      hangup();
      return;
    }
    const pc = newPc();
    stream.getTracks().forEach((t) => pc.addTrack(t, stream));
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await api.post(`/api/calls/${id}/answer`, { answer });
      flushCandidates();
      setPhase("active");
      startPolling();
    } catch (e: any) {
      toast(e?.message || "Couldn't accept the call", "error");
      hangup();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, hangup, toast]);

  const decline = useCallback(() => {
    const id = callIdRef.current;
    if (id) api.post(`/api/calls/${id}/end`).catch(() => {});
    cleanup();
  }, [cleanup]);

  // Poll for incoming calls (when idle) and for caller-cancellation (when ringing).
  useEffect(() => {
    if (!user) return;
    const iv = setInterval(async () => {
      try {
        if (phase === "incoming") {
          const id = callIdRef.current;
          if (id) {
            const r = await api.get(`/api/calls/${id}`).catch(() => null);
            if (!r || r.status === "ended" || r.status === "declined") cleanup();
          }
          return;
        }
        if (phase !== "idle") return;
        const r = await api.get("/api/calls/incoming");
        if (r.call) {
          callIdRef.current = r.call.id;
          incomingOfferRef.current = r.call.offer;
          roleRef.current = "callee";
          setKind(r.call.kind);
          setPeer(r.call.caller);
          setPhase("incoming");
        }
      } catch {}
    }, 2500);
    return () => clearInterval(iv);
  }, [user, phase, cleanup]);

  function toggleMute() {
    const s = localRef.current;
    if (!s) return;
    const next = !muted;
    setMuted(next);
    s.getAudioTracks().forEach((t) => (t.enabled = !next));
  }
  function toggleCamera() {
    const s = localRef.current;
    if (!s) return;
    const next = !cameraOff;
    setCameraOff(next);
    s.getVideoTracks().forEach((t) => (t.enabled = !next));
  }

  useEffect(() => () => cleanup(), [cleanup]);

  return (
    <Ctx.Provider value={{ startCall, busy: phase !== "idle" }}>
      {children}
      <CallUI
        phase={phase}
        peer={peer}
        kind={kind}
        muted={muted}
        cameraOff={cameraOff}
        connected={connected}
        localStream={localStream}
        remoteStream={remoteStream}
        onAccept={accept}
        onDecline={decline}
        onHangup={() => hangup()}
        onToggleMute={toggleMute}
        onToggleCamera={toggleCamera}
      />
    </Ctx.Provider>
  );
}

function CallUI({
  phase, peer, kind, muted, cameraOff, connected, localStream, remoteStream,
  onAccept, onDecline, onHangup, onToggleMute, onToggleCamera,
}: {
  phase: Phase;
  peer: PublicUser | null;
  kind: Kind;
  muted: boolean;
  cameraOff: boolean;
  connected: boolean;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  onAccept: () => void;
  onDecline: () => void;
  onHangup: () => void;
  onToggleMute: () => void;
  onToggleCamera: () => void;
}) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (localVideoRef.current) localVideoRef.current.srcObject = localStream;
  }, [localStream, phase, cameraOff]);
  useEffect(() => {
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = remoteStream;
  }, [remoteStream, phase]);

  if (phase === "idle") return null;
  const isVideo = kind === "video";
  const statusText = phase === "outgoing" ? "Calling…" : connected ? "Connected" : "Connecting…";

  if (phase === "incoming") {
    return (
      <div className="fixed inset-0 z-[100] grid place-items-center bg-black/80 p-5 backdrop-blur-md animate-fade-in">
        <div className="card w-full max-w-sm p-6 text-center">
          <Avatar src={peer?.avatar} name={peer?.displayName || "?"} size={96} className="mx-auto" />
          <p className="mt-4 text-lg font-semibold">{peer?.username}</p>
          <p className="text-sm text-muted">Incoming {isVideo ? "video" : "voice"} call…</p>
          <div className="mt-7 flex items-center justify-center gap-8">
            <button onClick={onDecline} className="press grid h-16 w-16 place-items-center rounded-full bg-danger text-white" aria-label="Decline">
              <PhoneOff size={24} />
            </button>
            <button onClick={onAccept} className="press grid h-16 w-16 place-items-center rounded-full bg-success text-white" aria-label="Accept">
              <Phone size={24} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // outgoing / active
  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black animate-fade-in">
      {/* Remote audio always routed here; the remote <video> stays muted to avoid echo. */}
      <audio ref={remoteAudioRef} autoPlay />
      <div className="relative flex-1 overflow-hidden">
        {isVideo && remoteStream ? (
          <video ref={remoteVideoRef} autoPlay playsInline muted className="h-full w-full bg-black object-contain" />
        ) : (
          <div className="grid h-full w-full place-items-center bg-gradient-to-b from-surface-2 to-black">
            <div className="text-center">
              <Avatar src={peer?.avatar} name={peer?.displayName || "?"} size={120} className="mx-auto" />
              <p className="mt-4 text-xl font-semibold text-white">{peer?.username}</p>
              <p className="mt-1 text-sm text-white/70">{statusText}</p>
            </div>
          </div>
        )}

        {isVideo && (
          <div className="absolute left-1/2 top-5 -translate-x-1/2 rounded-full bg-black/50 px-4 py-1.5 text-sm text-white backdrop-blur">
            {peer?.username} · {statusText}
          </div>
        )}
        {isVideo && localStream && (
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="absolute bottom-28 right-4 h-40 w-28 rounded-2xl border border-white/20 object-cover shadow-card"
          />
        )}
      </div>

      <div className="flex items-center justify-center gap-5 bg-black/95 py-6">
        <button
          onClick={onToggleMute}
          className={cn("press grid h-14 w-14 place-items-center rounded-full text-white", muted ? "bg-white text-black" : "bg-white/15")}
          aria-label={muted ? "Unmute" : "Mute"}
        >
          {muted ? <MicOff size={22} /> : <Mic size={22} />}
        </button>
        {isVideo && (
          <button
            onClick={onToggleCamera}
            className={cn("press grid h-14 w-14 place-items-center rounded-full text-white", cameraOff ? "bg-white text-black" : "bg-white/15")}
            aria-label={cameraOff ? "Turn camera on" : "Turn camera off"}
          >
            {cameraOff ? <VideoOff size={22} /> : <Video size={22} />}
          </button>
        )}
        <button onClick={onHangup} className="press grid h-14 w-14 place-items-center rounded-full bg-danger text-white" aria-label="Hang up">
          <PhoneOff size={24} />
        </button>
      </div>
    </div>
  );
}
